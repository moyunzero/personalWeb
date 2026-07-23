#!/usr/bin/env node
/**
 * Export Pyjama Shark Free → public/threejs-assets/web/spectacle/pyjama-shark/
 * Requires Blender on PATH or /Applications/Blender.app (macOS).
 * Hard budget: SPECTACLE_BUDGET_BYTES (AC-7).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'assets/spectacle-source');
const BLEND = path.join(SRC_DIR, 'source/Pyjama_Shark.blend');
const TEX_DIR = path.join(SRC_DIR, 'textures');
const OUT_DIR = path.join(ROOT, 'public/threejs-assets/web/spectacle/pyjama-shark');
const WORK = path.join(ROOT, '.tmp/spectacle-export');

export const SPECTACLE_BUDGET_BYTES = Math.floor(2.5 * 1024 * 1024);

function fail(msg) {
    console.error(`[prepare-spectacle-assets] ${msg}`);
    process.exit(1);
}

function findBlender() {
    const candidates = [
        process.env.BLENDER,
        'blender',
        '/Applications/Blender.app/Contents/MacOS/Blender',
        '/usr/bin/blender',
    ].filter(Boolean);
    for (const bin of candidates) {
        if (bin === 'blender') {
            const which = spawnSync('which', ['blender'], { encoding: 'utf8' });
            if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
            continue;
        }
        if (existsSync(bin)) return bin;
    }
    return null;
}

function dirBytes(dir) {
    let sum = 0;
    if (!existsSync(dir)) return 0;
    for (const name of readdirSync(dir)) {
        if (name.startsWith('.')) continue;
        const full = path.join(dir, name);
        const st = statSync(full);
        if (st.isFile()) sum += st.size;
        else if (st.isDirectory()) sum += dirBytes(full);
    }
    return sum;
}

async function prepareTextures() {
    mkdirSync(WORK, { recursive: true });
    const jobs = [
        { src: '4K_Pyjama_Diffuse2.png', out: 'diffuse.jpg', size: 1024, jpeg: true },
        { src: 'Normal.png', out: 'normal.jpg', size: 512, jpeg: true },
        { src: 'Roughness_Metallic.png', out: 'orm.jpg', size: 512, jpeg: true },
    ];
    const paths = {};
    for (const job of jobs) {
        const input = path.join(TEX_DIR, job.src);
        if (!existsSync(input)) fail(`missing texture ${job.src}`);
        const out = path.join(WORK, job.out);
        let pipeline = sharp(input).resize(job.size, job.size, { fit: 'inside' });
        if (job.jpeg) {
            await pipeline.jpeg({ quality: 72, mozjpeg: true }).toFile(out);
        } else {
            await pipeline.png({ compressionLevel: 9 }).toFile(out);
        }
        paths[job.out] = out;
        console.log(`  texture ${job.out}: ${(statSync(out).size / 1024).toFixed(1)} KB`);
    }
    return paths;
}

function writeExportScript(texPaths, glbOut) {
    const scriptPath = path.join(WORK, 'export_shark.py');
    const diffuse = texPaths['diffuse.jpg'].replace(/\\/g, '/');
    const normal = texPaths['normal.jpg'].replace(/\\/g, '/');
    const orm = texPaths['orm.jpg'].replace(/\\/g, '/');
    const blend = BLEND.replace(/\\/g, '/');
    const out = glbOut.replace(/\\/g, '/');

    const py = `
import bpy
import os

blend = r"${blend}"
out = r"${out}"
diffuse = r"${diffuse}"
normal = r"${normal}"
orm = r"${orm}"

bpy.ops.wm.open_mainfile(filepath=blend)

# Prefer a Swim action name when present; otherwise keep the first action (AC-7).
actions = list(bpy.data.actions)
if actions:
    preferred = next((a for a in actions if a.name.lower() == "swim"), actions[0])
    if preferred.name != "Swim":
        preferred.name = "Swim"

mesh = next((o for o in bpy.data.objects if o.type == "MESH"), None)
if mesh is None:
    raise SystemExit("no mesh in blend")

# Rebuild a compact PBR material with web textures.
mat = bpy.data.materials.new(name="PyjamaSharkWeb")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out_n = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])

tex_d = nt.nodes.new("ShaderNodeTexImage")
tex_d.image = bpy.data.images.load(diffuse)
nt.links.new(tex_d.outputs["Color"], bsdf.inputs["Base Color"])

tex_n = nt.nodes.new("ShaderNodeTexImage")
tex_n.image = bpy.data.images.load(normal)
tex_n.image.colorspace_settings.name = "Non-Color"
nmap = nt.nodes.new("ShaderNodeNormalMap")
nt.links.new(tex_n.outputs["Color"], nmap.inputs["Color"])
nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])

tex_orm = nt.nodes.new("ShaderNodeTexImage")
tex_orm.image = bpy.data.images.load(orm)
tex_orm.image.colorspace_settings.name = "Non-Color"
# Roughness from G, metal from B when packed; fall back to full RGB as roughness.
sep = nt.nodes.new("ShaderNodeSeparateColor")
nt.links.new(tex_orm.outputs["Color"], sep.inputs["Color"])
nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])

if mesh.data.materials:
    mesh.data.materials[0] = mat
else:
    mesh.data.materials.append(mat)

# Keep mesh + armature only.
for obj in list(bpy.data.objects):
    if obj.type not in {"MESH", "ARMATURE"}:
        bpy.data.objects.remove(obj, do_unlink=True)

os.makedirs(os.path.dirname(out), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=False,
    export_animations=True,
    export_apply=False,
    export_skins=True,
    export_morph=False,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="JPEG",
    export_jpeg_quality=70,
)
print("EXPORTED", out)
`;
    writeFileSync(scriptPath, py, 'utf8');
    return scriptPath;
}

async function main() {
    if (!existsSync(BLEND)) fail(`missing ${path.relative(ROOT, BLEND)}`);
    const blender = findBlender();
    if (!blender) fail('Blender not found. Install Blender or set BLENDER=/path/to/blender');

    mkdirSync(OUT_DIR, { recursive: true });
    for (const name of readdirSync(OUT_DIR)) {
        rmSync(path.join(OUT_DIR, name), { recursive: true, force: true });
    }

    console.log('Preparing downscaled textures…');
    const texPaths = await prepareTextures();
    const glbOut = path.join(OUT_DIR, 'model.glb');
    const script = writeExportScript(texPaths, glbOut);

    console.log(`Exporting glTF via ${blender}…`);
    const result = spawnSync(blender, ['--background', '--python', script], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) fail(`Blender export failed (exit ${result.status})`);
    if (!existsSync(glbOut)) fail('model.glb was not written');

    const total = dirBytes(OUT_DIR);
    console.log(
        `\nSpectacle total: ${(total / (1024 * 1024)).toFixed(2)} MB / ${(SPECTACLE_BUDGET_BYTES / (1024 * 1024)).toFixed(1)} MB`,
    );
    if (total > SPECTACLE_BUDGET_BYTES) {
        fail('spectacle budget exceeded (AC-7)');
    }
    console.log('OK', path.relative(ROOT, glbOut));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
