/**
 * Portal + Pyjama Shark spectacle scene (spec 0005).
 *
 * Playwright (2026-07-23 late):
 * - Swim glTF bakes Root.position over ~30s → looks like a rigid sticker drifting,
 *   and pulls the body off the portal center. Strip position tracks for in-place swim.
 * - Swim segment was ~2.9s (~2.4 wu/s) — too fast; lengthen and soften travel.
 * - Surge must start in the hole center (small), not already parked beside the ring.
 */
import type * as ThreeNS from 'three';
import { PHASE_MS, type PortalAnchor } from './spectacleModel';

export type ThreeModule = typeof ThreeNS;

export type SpectacleSceneHandles = {
    update: (nowMs: number, dtSec: number) => void;
    resize: (vw: number, vh: number) => void;
    dispose: () => void;
    ready: Promise<void>;
};

export type SpectacleSceneOptions = {
    THREE: ThreeModule;
    canvas: HTMLCanvasElement;
    baseUrl: string;
    portal: PortalAnchor;
    beastDurationMs: number;
    onBeastComplete: () => void;
    /** AC-5: webglcontextlost (or other hard GPU failure) → island must end + unlock. */
    onFatalError?: () => void;
};

/** Relative weights; scaled into beastDurationMs so AC-1 5–7s budget is kept. */
const SURGE_W = 1.7;
const TURN_W = 0.55;
const SWIM_W = 6.2;
const EXIT_W = 1.1;
const BEAST_WEIGHT = SURGE_W + TURN_W + SWIM_W + EXIT_W;
const PORTAL_IN_S = PHASE_MS.portal / 1000;
const PORTAL_SHRINK_FRAC = 1.1 / BEAST_WEIGHT;
const PIXEL_RATIO_CAP = 1.25;
/** Slightly larger hole so a bigger beast still reads inside it. */
const PORTAL_VISUAL_SCALE = 0.85;
const PORTAL_MIN_WORLD_R = 0.72;
/** Beast length relative to hole radius — bumped for readability. */
const BEAST_IN_HOLE = 1.7;

/**
 * Keep spine/fin undulation; drop baked translation and whole-body yaw so we own facing + travel.
 */
function makeInPlaceSwimClip(
    THREE: ThreeModule,
    clip: ThreeNS.AnimationClip,
): ThreeNS.AnimationClip {
    const tracks = clip.tracks.filter((track) => {
        if (/\.position$/.test(track.name)) return false;
        if (/^(Shark|TSM3WorldJoint|Root)\.quaternion$/.test(track.name)) return false;
        return true;
    });
    return new THREE.AnimationClip(`${clip.name}_inplace`, clip.duration, tracks);
}

const portalVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const portalFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.07 + 17.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float r = length(uv);
  float ang = atan(uv.y, uv.x);
  if (r > 1.0) { gl_FragColor = vec4(0.0); return; }

  float t = uTime;
  // --- Event horizon ---
  float rs = 0.26;
  float horizon = 1.0 - smoothstep(rs * 0.85, rs * 1.25, r);

  // --- Gravitational lensing warp ---
  float bend = 0.65 / max(r, 0.08);
  float twisted = ang + bend * 1.8 - t * 0.7;
  vec2 dir = vec2(cos(twisted), sin(twisted));
  vec2 warped = dir * r;

  // Background stars stretched by lensing
  float starField = noise(warped * 16.0 + t * 0.08);
  float stars = smoothstep(0.86, 0.98, starField);
  stars *= smoothstep(rs * 1.3, 0.9, r);

  // Thin bright photon ring
  float photonR = 0.40;
  float photon = exp(-pow((r - photonR) * 28.0, 2.0));
  photon += 0.35 * exp(-pow((r - photonR * 1.15) * 40.0, 2.0));

  // Accretion disk: bright ellipse with Doppler
  // Project onto inclined plane
  float incl = 0.42; // cos-like foreshortening
  vec2 dUV = vec2(uv.x, uv.y / max(incl, 0.2));
  float dR = length(dUV);
  float dA = atan(dUV.y, dUV.x);
  float turb = fbm(vec2(dA * 2.5 - t * 1.8, dR * 5.0));
  float spiral = 0.55 + 0.45 * sin(dA * 7.0 - dR * 10.0 - t * 2.6 + turb * 6.0);
  float disk = exp(-pow((dR - 0.62) * 4.2, 2.0));
  disk *= smoothstep(0.22, 0.38, r) * smoothstep(0.98, 0.48, r);
  disk *= spiral * (0.55 + 0.45 * turb);

  // Front/back of disk (near side brighter)
  float front = smoothstep(-0.2, 0.35, uv.y);
  disk *= 0.55 + 0.7 * front;

  float doppler = clamp(uv.x * 1.6, -1.0, 1.0);
  vec3 diskCol = mix(vec3(0.85, 0.18, 0.05), vec3(1.0, 0.72, 0.28), doppler * 0.5 + 0.5);
  diskCol = mix(diskCol, vec3(0.9, 0.95, 1.0), smoothstep(0.25, 0.95, doppler));

  // Soft outer glow / haze
  float glow = smoothstep(1.0, 0.35, r) * (1.0 - horizon) * 0.35;

  vec3 col = vec3(0.0);
  col += vec3(0.75, 0.85, 1.0) * stars * 0.65;
  col += diskCol * disk * (1.15 + 0.55 * doppler);
  col += vec3(1.0, 0.95, 0.82) * photon * 1.6;
  col += vec3(1.0, 0.45, 0.15) * glow * 0.45;

  // Punch a true black hole
  col *= 1.0 - horizon;

  float alpha = horizon * 1.0 + photon * 1.4 + disk * 1.35 + glow * 0.6 + stars * 0.35;
  alpha = clamp(alpha, 0.0, 1.0);
  alpha *= smoothstep(1.0, 0.72, r) * uIntensity;

  gl_FragColor = vec4(col, alpha);
}
`;

function pxToWorldX(x: number, vw: number, span: number): number {
    return ((x / vw) * 2 - 1) * span;
}

function pxToWorldY(y: number, vh: number, span: number, aspect: number): number {
    return -((y / vh) * 2 - 1) * (span / aspect);
}

function easeOutCubic(t: number): number {
    const u = 1 - Math.min(1, Math.max(0, t));
    return 1 - u * u * u;
}

function easeInCubic(t: number): number {
    const u = Math.min(1, Math.max(0, t));
    return u * u * u;
}

function easeInOutCubic(t: number): number {
    const u = Math.min(1, Math.max(0, t));
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

export function buildSpectacleScene(opts: SpectacleSceneOptions): SpectacleSceneHandles {
    const { THREE, canvas, baseUrl, portal, beastDurationMs, onBeastComplete, onFatalError } =
        opts;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP));

    let disposed = false;
    let fatalNotified = false;
    const notifyFatal = () => {
        if (fatalNotified || disposed) return;
        fatalNotified = true;
        onFatalError?.();
    };
    const onContextLost = (event: Event) => {
        event.preventDefault();
        notifyFatal();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0, 12);

    scene.add(new THREE.AmbientLight(0x99aacc, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(2.5, 4, 10);
    scene.add(key);
    // Fill from camera so the surge isn't a black silhouette in the horizon.
    const fill = new THREE.DirectionalLight(0xa8c4ff, 0.85);
    fill.position.set(-1.5, 1.5, 12);
    scene.add(fill);
    const rim = new THREE.PointLight(0xffc8a0, 1.1, 40);
    rim.position.set(0, 0.5, 8);
    scene.add(rim);

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const viewSpan = 6;
    // Spawn-time scroll: keep hole+beast locked to that page point while user scrolls.
    const originScrollX = window.scrollX || window.pageXOffset || 0;
    const originScrollY = window.scrollY || window.pageYOffset || 0;
    // Portal on the left → beast swims right; portal on the right → swims left.
    const swimDir: 1 | -1 = portal.x < vw * 0.5 ? 1 : -1;

    const portalMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: 0 },
        },
        vertexShader: portalVertex,
        fragmentShader: portalFragment,
    });
    const portalMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 96), portalMat);
    portalMesh.renderOrder = 0;

    const root = new THREE.Group();
    root.renderOrder = 2;
    const orient = new THREE.Group();
    root.add(orient);

    const scrollRig = new THREE.Group();
    scrollRig.add(portalMesh);
    scrollRig.add(root);
    scene.add(scrollRig);

    const syncScrollRig = () => {
        const dxPx = (window.scrollX || window.pageXOffset || 0) - originScrollX;
        const dyPx = (window.scrollY || window.pageYOffset || 0) - originScrollY;
        const aspect = vw / Math.max(vh, 1);
        scrollRig.position.x = -(dxPx / vw) * 2 * viewSpan;
        scrollRig.position.y = (dyPx / vh) * 2 * (viewSpan / aspect);
    };
    syncScrollRig();

    /** Nose direction in orient-local space (measured from Head bone). */
    const noseLocal = new THREE.Vector3(0, 0, 1);
    /** Surge: head-on toward camera (+Z), no lateral yaw yet. */
    const faceEmerge = new THREE.Vector3(0, -0.12, 1).normalize();
    const faceSwim = new THREE.Vector3(swimDir, 0, 0);
    const tmp = new THREE.Vector3();
    const noseWorld = new THREE.Vector3();
    const qFrom = new THREE.Quaternion();
    const qTo = new THREE.Quaternion();
    const qNow = new THREE.Quaternion();

    /**
     * Rotate so `fromDir` (nose) aligns with `toDir`.
     */
    const faceToward = (fromDir: ThreeNS.Vector3, toDir: ThreeNS.Vector3, out: ThreeNS.Quaternion) => {
        tmp.copy(toDir).normalize();
        const from = fromDir.clone().normalize();
        out.setFromUnitVectors(from, tmp);
    };

    /**
     * Fade beast materials without crushing scale at the viewport edge.
     */
    const setBeastOpacity = (opacity: number) => {
        beastOpacity = Math.min(1, Math.max(0, opacity));
        if (!shark) return;
        shark.traverse((obj) => {
            const mesh = obj as ThreeNS.Mesh;
            if (!mesh.isMesh) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of mats) {
                const std = mat as ThreeNS.MeshStandardMaterial;
                if (!std) continue;
                std.transparent = true;
                std.opacity = beastOpacity;
                std.depthWrite = beastOpacity > 0.92;
                std.needsUpdate = true;
            }
        });
    };

    let mixer: ThreeNS.AnimationMixer | null = null;
    let swimAction: ThreeNS.AnimationAction | null = null;
    let shark: ThreeNS.Object3D | null = null;
    let beastOpacity = 1;
    let beastDone = false;
    /** Wall clock for shader time only; portal narrative clock starts after glTF is ready. */
    const shaderT0 = performance.now();
    let portalNarrativeT0: number | null = null;
    let beastStart = 0;
    let phase: 'portalIn' | 'beast' | 'done' = 'portalIn';
    let phaseLabel: 'portal' | 'surge' | 'turn' | 'swim' | 'exit' | 'idle' = 'portal';
    let portalBaseR = 1.05;

    const portalWorld = () => {
        const aspect = vw / Math.max(vh, 1);
        return {
            x: pxToWorldX(portal.x, vw, viewSpan),
            y: pxToWorldY(portal.y, vh, viewSpan, aspect),
            r: Math.max((portal.r / vw) * 2 * viewSpan * PORTAL_VISUAL_SCALE, PORTAL_MIN_WORLD_R),
        };
    };

    const placePortal = () => {
        const p = portalWorld();
        portalBaseR = p.r;
        portalMesh.position.set(p.x, p.y, -0.4);
        portalMesh.scale.setScalar(portalBaseR);
    };

    const resize = (nextVw: number, nextVh: number) => {
        vw = nextVw;
        vh = nextVh;
        renderer.setSize(vw, vh, false);
        camera.aspect = vw / Math.max(vh, 1);
        camera.updateProjectionMatrix();
        placePortal();
    };
    resize(vw, vh);

    let resolveReady!: () => void;
    let rejectReady!: (err: unknown) => void;
    const ready = new Promise<void>((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
    });

    const publishProbe = () => {
        const w = window as Window & {
            __spectacleProbe?: () => Record<string, unknown>;
        };
        noseWorld.copy(noseLocal).normalize().applyQuaternion(orient.quaternion);
        let headScreen: { x: number; y: number } | null = null;
        let rootScreen: { x: number; y: number } | null = null;
        if (shark) {
            const head =
                shark.getObjectByName('UpperLip') ||
                shark.getObjectByName('Head') ||
                shark.getObjectByName('Jaw');
            const hp = new THREE.Vector3();
            if (head) {
                head.getWorldPosition(hp);
            } else {
                hp.copy(noseWorld).multiplyScalar(0.5).add(root.position);
            }
            hp.project(camera);
            headScreen = {
                x: (hp.x * 0.5 + 0.5) * vw,
                y: (-hp.y * 0.5 + 0.5) * vh,
            };
            const rp = root.position.clone().project(camera);
            rootScreen = {
                x: (rp.x * 0.5 + 0.5) * vw,
                y: (-rp.y * 0.5 + 0.5) * vh,
            };
        }
        w.__spectacleProbe = () => ({
            phase: phaseLabel,
            swimDir,
            portalR: portalBaseR,
            rootScale: root.scale.x,
            rootPos: { x: root.position.x, y: root.position.y, z: root.position.z },
            scrollRig: { x: scrollRig.position.x, y: scrollRig.position.y },
            portalPos: {
                x: portalMesh.position.x,
                y: portalMesh.position.y,
                z: portalMesh.position.z,
            },
            offsetFromPortal: Math.hypot(
                root.position.x - portalMesh.position.x,
                root.position.y - portalMesh.position.y,
            ),
            noseLocal: { x: noseLocal.x, y: noseLocal.y, z: noseLocal.z },
            noseWorld: { x: noseWorld.x, y: noseWorld.y, z: noseWorld.z },
            headScreen,
            rootScreen,
            headLeadsSwim:
                headScreen && rootScreen
                    ? Math.sign(headScreen.x - rootScreen.x) === swimDir
                    : null,
            swimTime: swimAction?.time ?? null,
            swimPlaying: swimAction ? !swimAction.paused && swimAction.timeScale > 0 : false,
            opacity: beastOpacity,
            visible: root.visible,
            portalVisible: portalMesh.visible,
        });
    };
    publishProbe();

    const glbUrl = `${baseUrl}threejs-assets/web/spectacle/pyjama-shark/model.glb`;

    void (async () => {
        try {
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
            const loader = new GLTFLoader();
            const gltf = await new Promise<{
                scene: ThreeNS.Group;
                animations: ThreeNS.AnimationClip[];
            }>((res, rej) => {
                loader.load(glbUrl, res as (g: unknown) => void, undefined, rej);
            });
            if (disposed) {
                rejectReady(new Error('disposed before ready'));
                return;
            }

            const model = gltf.scene;
            let meshOk = false;
            let textureFail = false;
            model.traverse((obj) => {
                const mesh = obj as ThreeNS.Mesh;
                if (mesh.isMesh) {
                    meshOk = true;
                    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    for (const mat of mats) {
                        const std = mat as ThreeNS.MeshStandardMaterial;
                        for (const map of [std.map, std.normalMap, std.metalnessMap, std.roughnessMap]) {
                            if (map && map.image == null) textureFail = true;
                        }
                    }
                }
            });
            if (!meshOk || textureFail) {
                throw new Error(textureFail ? 'required texture failed' : 'mesh missing');
            }

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const longest = Math.max(size.x, size.y, size.z, 0.001);
            const holeR = portalWorld().r;
            const targetLen = holeR * BEAST_IN_HOLE;
            model.scale.setScalar(targetLen / longest);
            box.setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.sub(center);

            // Brighten slightly so surge isn't a black silhouette in the horizon.
            model.traverse((obj) => {
                const mesh = obj as ThreeNS.Mesh;
                if (!mesh.isMesh) return;
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (const mat of mats) {
                    const std = mat as ThreeNS.MeshStandardMaterial;
                    if (std.emissive) {
                        std.emissive.setHex(0x1a2230);
                        std.emissiveIntensity = 0.35;
                    }
                    if (typeof std.metalness === 'number') std.metalness = Math.min(std.metalness, 0.25);
                    if (typeof std.roughness === 'number') std.roughness = Math.max(std.roughness, 0.55);
                }
            });

            orient.quaternion.identity();
            orient.add(model);
            // Bind pose: prefer snout tip (UpperLip), then Head.
            orient.updateMatrixWorld(true);
            const snout =
                model.getObjectByName('UpperLip') ||
                model.getObjectByName('Head') ||
                model.getObjectByName('Jaw');
            if (snout) {
                const snoutWorld = new THREE.Vector3();
                snout.getWorldPosition(snoutWorld);
                orient.worldToLocal(snoutWorld);
                if (snoutWorld.lengthSq() > 1e-6) {
                    noseLocal.copy(snoutWorld).normalize();
                }
            } else {
                noseLocal.set(0, 0, 1);
            }

            faceToward(noseLocal, faceEmerge, qFrom);
            faceToward(noseLocal, faceSwim, qTo);
            orient.quaternion.copy(qFrom);

            shark = model;
            root.visible = false;
            root.scale.setScalar(0.1);
            {
                const p0 = portalWorld();
                root.position.set(p0.x, p0.y, -0.55);
            }

            mixer = new THREE.AnimationMixer(model);
            const clips = gltf.animations ?? [];
            const rawClip =
                clips.find((c) => c.name === 'Swim') ??
                clips.find((c) => /swim/i.test(c.name)) ??
                clips[0];
            if (rawClip) {
                const clip = makeInPlaceSwimClip(THREE, rawClip);
                swimAction = mixer.clipAction(clip);
                swimAction.reset();
                swimAction.setLoop(THREE.LoopRepeat, Infinity);
                swimAction.clampWhenFinished = false;
                swimAction.paused = true;
                swimAction.timeScale = 0;
                swimAction.time = 0.35; // mid-undulation bind, not T-pose
                swimAction.play();
            }

            publishProbe();
            resolveReady();
        } catch (err) {
            rejectReady(err);
        }
    })();

    const update = (nowMs: number, dtSec: number) => {
        if (disposed) return;
        syncScrollRig();
        portalMat.uniforms.uTime.value = (nowMs - shaderT0) / 1000;

        if (phase === 'portalIn') {
            phaseLabel = 'portal';
            // Faint portal while glTF loads; AC-1 portal clock starts only when mesh is ready.
            if (!shark) {
                portalMat.uniforms.uIntensity.value = 0.15;
                portalMesh.visible = true;
                portalMesh.scale.setScalar(portalBaseR);
            } else {
                if (portalNarrativeT0 == null) portalNarrativeT0 = nowMs;
                const elapsed = (nowMs - portalNarrativeT0) / 1000;
                const t = Math.min(1, elapsed / PORTAL_IN_S);
                portalMat.uniforms.uIntensity.value = t;
                portalMesh.visible = true;
                portalMesh.scale.setScalar(portalBaseR);
                if (t >= 1) {
                    phase = 'beast';
                    beastStart = nowMs;
                    root.visible = true;
                    orient.quaternion.copy(qFrom);
                    const p0 = portalWorld();
                    root.position.set(p0.x, p0.y, -0.55);
                    root.scale.setScalar(0.1);
                    setBeastOpacity(1);
                }
            }
        }

        if (phase === 'beast' && shark) {
            const local = (nowMs - beastStart) / 1000;
            // Fit surge/turn/swim/exit into the sampled AC-1 beast window (5–7s).
            const totalS = Math.max(beastDurationMs / 1000, PHASE_MS.beastMin / 1000);
            const surgeS = (SURGE_W / BEAST_WEIGHT) * totalS;
            const turnS = (TURN_W / BEAST_WEIGHT) * totalS;
            const swimS = (SWIM_W / BEAST_WEIGHT) * totalS;
            const exitS = (EXIT_W / BEAST_WEIGHT) * totalS;
            const portalShrinkS = PORTAL_SHRINK_FRAC * totalS;
            const surgeEnd = surgeS;
            const turnEnd = surgeS + turnS;
            const swimEnd = turnEnd + swimS;
            const exitStart = Math.max(swimEnd, totalS - exitS);
            const p = portalWorld();
            const edgeX = swimDir * viewSpan * 0.92;
            const travel = edgeX - p.x;

            if (local < surgeEnd) {
                phaseLabel = 'surge';
                const t = easeOutCubic(local / Math.max(surgeEnd, 0.001));
                root.scale.setScalar(0.08 + t * 0.92);
                root.position.set(p.x, p.y, -0.5 + t * 2.0);
                orient.quaternion.copy(qFrom);
                root.rotation.set(0, 0, 0);
                if (swimAction) {
                    swimAction.paused = true;
                    swimAction.timeScale = 0;
                }
                setBeastOpacity(1);
                portalMesh.visible = true;
                portalMat.uniforms.uIntensity.value = 1;
                portalMesh.scale.setScalar(portalBaseR);
            } else if (local < turnEnd) {
                phaseLabel = 'turn';
                const t = easeInOutCubic((local - surgeEnd) / Math.max(turnS, 0.001));
                root.scale.setScalar(1);
                root.position.set(p.x, p.y, 1.5);
                qNow.copy(qFrom).slerp(qTo, t);
                orient.quaternion.copy(qNow);
                root.rotation.set(0, 0, 0);
                if (swimAction) {
                    swimAction.paused = false;
                    swimAction.timeScale = 0.6 + t * 1.4;
                }
                setBeastOpacity(1);
                portalMesh.visible = true;
                portalMat.uniforms.uIntensity.value = 1;
                portalMesh.scale.setScalar(portalBaseR);
            } else if (local < exitStart) {
                phaseLabel = 'swim';
                const t = (local - turnEnd) / Math.max(0.001, exitStart - turnEnd);
                const eased = t * t * (3 - 2 * t);
                root.scale.setScalar(1);
                root.position.set(
                    p.x + travel * eased,
                    p.y + Math.sin(eased * Math.PI * 1.5) * 0.1,
                    1.5,
                );
                orient.quaternion.copy(qTo);
                root.rotation.set(0, 0, 0);
                if (swimAction) {
                    swimAction.paused = false;
                    swimAction.timeScale = 2.6;
                }
                const nearEdge = Math.max(0, (eased - 0.78) / 0.22);
                setBeastOpacity(1 - easeInOutCubic(nearEdge) * 0.88);
                const shrinkT = Math.min(1, (local - turnEnd) / Math.max(portalShrinkS, 0.001));
                const shrink = 1 - easeInCubic(shrinkT);
                portalMat.uniforms.uIntensity.value = shrink;
                portalMesh.scale.setScalar(portalBaseR * Math.max(0.05, shrink));
                portalMesh.visible = shrink > 0.05;
            } else {
                phaseLabel = 'exit';
                const t = Math.min(1, (local - exitStart) / Math.max(exitS, 0.001));
                setBeastOpacity(0.12 * (1 - easeInOutCubic(t)));
                root.scale.setScalar(1);
                root.position.set(edgeX, p.y, 1.5);
                orient.quaternion.copy(qTo);
                root.rotation.set(0, 0, 0);
                if (swimAction) {
                    swimAction.paused = false;
                    swimAction.timeScale = 1.6;
                }
                portalMesh.visible = false;
                portalMat.uniforms.uIntensity.value = 0;
                if (beastOpacity < 0.02) {
                    root.visible = false;
                }
            }

            if (local >= totalS && !beastDone) {
                beastDone = true;
                phase = 'done';
                phaseLabel = 'idle';
                root.visible = false;
                portalMesh.visible = false;
                portalMat.uniforms.uIntensity.value = 0;
                onBeastComplete();
            }
        }

        mixer?.update(dtSec);
        publishProbe();
        renderer.render(scene, camera);
    };

    const dispose = () => {
        disposed = true;
        // Unblock await sceneHandles.ready if GLB load never finished (AC-9).
        rejectReady(new Error('disposed before ready'));
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        const w = window as Window & { __spectacleProbe?: unknown };
        delete w.__spectacleProbe;
        mixer?.stopAllAction();
        mixer = null;
        scene.traverse((obj) => {
            const mesh = obj as ThreeNS.Mesh;
            if (mesh.isMesh) {
                mesh.geometry?.dispose();
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (const mat of mats) {
                    mat?.dispose?.();
                    const std = mat as ThreeNS.MeshStandardMaterial;
                    std.map?.dispose?.();
                    std.normalMap?.dispose?.();
                    std.roughnessMap?.dispose?.();
                    std.metalnessMap?.dispose?.();
                }
            }
        });
        portalMat.dispose();
        renderer.dispose();
    };

    return { update, resize, dispose, ready };
}
