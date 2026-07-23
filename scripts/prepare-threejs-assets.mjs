#!/usr/bin/env node
/**
 * Derive web-safe cosmos textures from assets/threejs-source/ into
 * public/threejs-assets/web/. Fails if total output exceeds BUDGET_BYTES (AC-7).
 */
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { DataUtils } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/threejs-source');
const OUT = path.join(ROOT, 'public/threejs-assets/web');

/** Hard ceiling for all files under web/ (AC-7). */
const BUDGET_BYTES = 8 * 1024 * 1024;

const PLANET_JOBS = [
    { src: '2k_sun.jpg', out: 'sun.jpg', size: 1024 },
    { src: '2k_moon.jpg', out: 'moon.jpg', size: 512 },
    { src: '8k_mercury.jpg', out: 'mercury.jpg', size: 1024 },
    { src: '8k_venus_surface.jpg', out: 'venus.jpg', size: 1024 },
    { src: '4k_venus_atmosphere.jpg', out: 'venus_atmosphere.jpg', size: 1024 },
    { src: '8k_earth_daymap.jpg', out: 'earth_day.jpg', size: 1024 },
    { src: '8k_earth_nightmap.jpg', out: 'earth_night.jpg', size: 1024 },
    { src: '2k_earth_clouds.jpg', out: 'earth_clouds.jpg', size: 1024 },
    { src: '8k_mars.jpg', out: 'mars.jpg', size: 1024 },
    { src: '8k_jupiter.jpg', out: 'jupiter.jpg', size: 1024 },
    { src: '8k_saturn.jpg', out: 'saturn.jpg', size: 1024 },
    { src: '8k_saturn_ring_alpha.png', out: 'saturn_ring.png', width: 1024, height: 64 },
    { src: '2k_uranus.jpg', out: 'uranus.jpg', size: 1024 },
    { src: '2k_neptune.jpg', out: 'neptune.jpg', size: 1024 },
];

function halfToFloat(h) {
    return DataUtils.fromHalfFloat(h);
}

function floatToRGBE(r, g, b) {
    const v = Math.max(r, g, b);
    if (v < 1e-32) return [0, 0, 0, 0];
    const exp = Math.floor(Math.log2(v)) + 1;
    const scale = Math.pow(2, exp - 8);
    return [
        Math.min(255, Math.floor(r / scale)),
        Math.min(255, Math.floor(g / scale)),
        Math.min(255, Math.floor(b / scale)),
        exp + 128,
    ];
}

/** Uncompressed Radiance RGBE (simple, portable). */
function writeRGBE(width, height, rgbaHalf, flipY) {
    const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`;
    const pixels = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
        const srcY = flipY ? height - 1 - y : y;
        for (let x = 0; x < width; x++) {
            const si = (srcY * width + x) * 4;
            const di = (y * width + x) * 4;
            const r = halfToFloat(rgbaHalf[si]);
            const g = halfToFloat(rgbaHalf[si + 1]);
            const b = halfToFloat(rgbaHalf[si + 2]);
            const [er, eg, eb, ee] = floatToRGBE(r, g, b);
            pixels[di] = er;
            pixels[di + 1] = eg;
            pixels[di + 2] = eb;
            pixels[di + 3] = ee;
        }
    }
    return Buffer.concat([Buffer.from(header, 'ascii'), pixels]);
}

function downsampleHalfFloat(srcW, srcH, data, dstW, dstH) {
    const out = new Uint16Array(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    for (let y = 0; y < dstH; y++) {
        const sy = Math.min(srcH - 1, Math.floor(y * yRatio));
        for (let x = 0; x < dstW; x++) {
            const sx = Math.min(srcW - 1, Math.floor(x * xRatio));
            const si = (sy * srcW + sx) * 4;
            const di = (y * dstW + x) * 4;
            out[di] = data[si];
            out[di + 1] = data[si + 1];
            out[di + 2] = data[si + 2];
            out[di + 3] = data[si + 3];
        }
    }
    return out;
}

function toneMapPosterRGBA(srcW, srcH, data, dstW, dstH) {
    const rgba = Buffer.alloc(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    for (let y = 0; y < dstH; y++) {
        const sy = Math.min(srcH - 1, Math.floor(y * yRatio));
        for (let x = 0; x < dstW; x++) {
            const sx = Math.min(srcW - 1, Math.floor(x * xRatio));
            const si = (sy * srcW + sx) * 4;
            const di = (y * dstW + x) * 4;
            const r = halfToFloat(data[si]);
            const g = halfToFloat(data[si + 1]);
            const b = halfToFloat(data[si + 2]);
            // Reinhard + gamma for SSR poster
            const tr = r / (1 + r);
            const tg = g / (1 + g);
            const tb = b / (1 + b);
            rgba[di] = Math.min(255, Math.floor(Math.pow(tr, 1 / 2.2) * 255));
            rgba[di + 1] = Math.min(255, Math.floor(Math.pow(tg, 1 / 2.2) * 255));
            rgba[di + 2] = Math.min(255, Math.floor(Math.pow(tb, 1 / 2.2) * 255));
            rgba[di + 3] = 255;
        }
    }
    return rgba;
}

async function prepareHdr() {
    const srcPath = path.join(SRC, 'HDR_blue_nebulae_3.hdr');
    const buf = readFileSync(srcPath);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const parsed = new HDRLoader().parse(ab);
    const { width, height, data, flipY } = parsed;

    // Spec desktop up to 2048×1024; 1024×512 keeps AC-7 download budget healthier
    const envW = 1024;
    const envH = 512;
    const envData = downsampleHalfFloat(width, height, data, envW, envH);
    const hdrOut = writeRGBE(envW, envH, envData, Boolean(flipY));
    await writeFile(path.join(OUT, 'hdr_blue_nebulae.hdr'), hdrOut);

    const posterW = 1920;
    const posterH = 960;
    const posterRgba = toneMapPosterRGBA(width, height, data, posterW, posterH);
    await sharp(posterRgba, { raw: { width: posterW, height: posterH, channels: 4 } })
        .webp({ quality: 72 })
        .toFile(path.join(OUT, 'hdr_blue_nebulae_poster.webp'));
}

async function preparePlanets() {
    for (const job of PLANET_JOBS) {
        const input = path.join(SRC, job.src);
        let pipeline = sharp(input);
        if (job.width && job.height) {
            pipeline = pipeline.resize(job.width, job.height, { fit: 'fill' });
        } else {
            pipeline = pipeline.resize(job.size, job.size, { fit: 'inside' });
        }
        const outPath = path.join(OUT, job.out);
        if (job.out.endsWith('.png')) {
            await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
        } else {
            await pipeline.jpeg({ quality: 78, mozjpeg: true }).toFile(outPath);
        }
    }
}

async function totalBytes(dir) {
    const names = await readdir(dir);
    let sum = 0;
    const rows = [];
    for (const name of names) {
        const s = await stat(path.join(dir, name));
        if (!s.isFile()) continue;
        sum += s.size;
        rows.push({ name, size: s.size });
    }
    rows.sort((a, b) => b.size - a.size);
    return { sum, rows };
}

async function main() {
    await mkdir(OUT, { recursive: true });
    for (const name of await readdir(OUT)) {
        if (name === 'spectacle') continue;
        await rm(path.join(OUT, name), { force: true, recursive: true });
    }

    console.log('Preparing HDR + poster…');
    await prepareHdr();
    console.log('Preparing planet maps…');
    await preparePlanets();

    const { sum, rows } = await totalBytes(OUT);
    // Exclude spectacle/ from cosmos budget (separate AC-7 budget).
    let cosmosSum = 0;
    const cosmosRows = [];
    for (const row of rows) {
        if (row.name === 'spectacle') continue;
        cosmosSum += row.size;
        cosmosRows.push(row);
    }
    console.log('\nweb/ outputs (cosmos):');
    for (const row of cosmosRows) {
        console.log(`  ${(row.size / 1024).toFixed(1).padStart(8)} KB  ${row.name}`);
    }
    console.log(`\nTotal: ${(cosmosSum / (1024 * 1024)).toFixed(2)} MB / ${(BUDGET_BYTES / (1024 * 1024)).toFixed(0)} MB budget`);

    if (cosmosSum > BUDGET_BYTES) {
        console.error('Budget exceeded (AC-7). Reduce sizes and re-run.');
        process.exit(1);
    }
    console.log('OK');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
