/**
 * Build / dispose the home solar system scene (AC-1, AC-5).
 * Call only after dynamic `import('three')`.
 */
import {
    MOON,
    PLANETS,
    SUN,
    SUN_RADIUS,
    moonStateAt,
    sunSpinAt,
    type PlanetId,
    type PlanetState,
} from './solarSystemModel';

export type ThreeModule = typeof import('three');

export type CosmosTier = 'desktop' | 'mobile';

export type SolarSystemHandles = {
    root: import('three').Group;
    sun: import('three').Mesh;
    sunLight: import('three').PointLight;
    planets: Map<
        PlanetId,
        {
            group: import('three').Group;
            body: import('three').Mesh;
            extras: import('three').Object3D[];
        }
    >;
    moon: { group: import('three').Group; body: import('three').Mesh };
    dispose: () => void;
};

function assetUrl(baseUrl: string, file: string): string {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${base}threejs-assets/web/${file}`;
}

const SURFACE_FILES: Record<PlanetId, string> = {
    mercury: 'mercury.jpg',
    venus: 'venus.jpg',
    earth: 'earth_day.jpg',
    mars: 'mars.jpg',
    jupiter: 'jupiter.jpg',
    saturn: 'saturn.jpg',
    uranus: 'uranus.jpg',
    neptune: 'neptune.jpg',
};

async function loadTexture(
    THREE: ThreeModule,
    loader: import('three').TextureLoader,
    url: string,
    colorSpace: typeof import('three').SRGBColorSpace,
): Promise<import('three').Texture | null> {
    try {
        const tex = await loader.loadAsync(url);
        tex.colorSpace = colorSpace;
        tex.anisotropy = 4;
        return tex;
    } catch {
        return null;
    }
}

export async function buildSolarSystemScene(
    THREE: ThreeModule,
    opts: { baseUrl: string; tier: CosmosTier },
): Promise<{
    scene: import('three').Scene;
    handles: SolarSystemHandles;
}> {
    const scene = new THREE.Scene();
    const disposables: Array<{ dispose: () => void }> = [];
    const textures: import('three').Texture[] = [];

    const track = <T extends { dispose: () => void }>(obj: T): T => {
        disposables.push(obj);
        return obj;
    };

    // HDR environment
    try {
        const { HDRLoader } = await import('three/addons/loaders/HDRLoader.js');
        const hdr = new HDRLoader();
        const envMap = await hdr.loadAsync(assetUrl(opts.baseUrl, 'hdr_blue_nebulae.hdr'));
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = envMap;
        scene.environment = envMap;
        textures.push(envMap);
    } catch {
        scene.background = new THREE.Color(0x05060f);
    }

    const root = new THREE.Group();
    scene.add(root);

    scene.add(new THREE.AmbientLight(0x93a3c8, 0.7));

    const texLoader = new THREE.TextureLoader();

    const sunGeo = track(new THREE.SphereGeometry(SUN_RADIUS, 32, 24));
    const sunTex = await loadTexture(
        THREE,
        texLoader,
        assetUrl(opts.baseUrl, 'sun.jpg'),
        THREE.SRGBColorSpace,
    );
    if (sunTex) textures.push(sunTex);
    const sunMat = track(
        new THREE.MeshBasicMaterial({
            map: sunTex ?? undefined,
            color: sunTex ? 0xffffff : 0xffe6a0,
        }),
    );
    const sunPivot = new THREE.Group();
    const sunTilt = new THREE.Group();
    sunTilt.rotation.z = SUN.axialTilt;
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sunTilt.add(sun);
    sunPivot.add(sunTilt);
    root.add(sunPivot);

    // decay 0: constant falloff so the compressed outer orbits stay readable
    const sunLight = new THREE.PointLight(0xfff2d0, 2.2, 0, 0);
    sunPivot.add(sunLight);

    // Soft camera-facing halo (radial gradient sprite); replaces the old
    // translucent shell whose hard silhouette read as a yellow ring.
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const glowCtx = glowCanvas.getContext('2d');
    if (glowCtx) {
        const g = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,214,130,0.55)');
        g.addColorStop(0.28, 'rgba(255,178,80,0.14)');
        g.addColorStop(0.55, 'rgba(255,150,60,0.04)');
        g.addColorStop(1, 'rgba(255,150,60,0)');
        glowCtx.fillStyle = g;
        glowCtx.fillRect(0, 0, 128, 128);
        const glowTex = track(new THREE.CanvasTexture(glowCanvas));
        const glowMat = track(
            new THREE.SpriteMaterial({
                map: glowTex,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            }),
        );
        const glow = new THREE.Sprite(glowMat);
        glow.scale.setScalar(SUN_RADIUS * 3.2);
        sunPivot.add(glow);
    }

    const planets = new Map<
        PlanetId,
        {
            group: import('three').Group;
            body: import('three').Mesh;
            extras: import('three').Object3D[];
        }
    >();

    const segs = opts.tier === 'mobile' ? 24 : 40;

    for (const p of PLANETS) {
        const group = new THREE.Group();
        group.name = p.id;
        root.add(group);

        // Real obliquity: body, clouds, and ring all live in the tilted frame
        const tilt = new THREE.Group();
        tilt.rotation.z = p.axialTilt;
        group.add(tilt);

        const radius = 1; // scaled each frame via planetState
        const geo = track(new THREE.SphereGeometry(radius, segs, Math.floor(segs * 0.75)));
        const map = await loadTexture(
            THREE,
            texLoader,
            assetUrl(opts.baseUrl, SURFACE_FILES[p.id]),
            THREE.SRGBColorSpace,
        );
        if (map) textures.push(map);

        const mat = track(
            new THREE.MeshStandardMaterial({
                map: map ?? undefined,
                color: map ? 0xffffff : p.fallbackColor,
                roughness: 0.85,
                metalness: 0.05,
            }),
        );
        const body = new THREE.Mesh(geo, mat);
        tilt.add(body);
        const extras: import('three').Object3D[] = [];

        if (p.id === 'earth') {
            const night = await loadTexture(
                THREE,
                texLoader,
                assetUrl(opts.baseUrl, 'earth_night.jpg'),
                THREE.SRGBColorSpace,
            );
            if (night) {
                textures.push(night);
                mat.emissiveMap = night;
                mat.emissive = new THREE.Color(0xffffff);
                mat.emissiveIntensity = 0.55;
            }
            const cloudsMap = await loadTexture(
                THREE,
                texLoader,
                assetUrl(opts.baseUrl, 'earth_clouds.jpg'),
                THREE.SRGBColorSpace,
            );
            if (cloudsMap) {
                textures.push(cloudsMap);
                const cloudGeo = track(
                    new THREE.SphereGeometry(1.02, segs, Math.floor(segs * 0.75)),
                );
                // clouds jpg is white-on-black: use as alphaMap so land stays visible
                const cloudMat = track(
                    new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        alphaMap: cloudsMap,
                        transparent: true,
                        opacity: 0.85,
                        depthWrite: false,
                    }),
                );
                const clouds = new THREE.Mesh(cloudGeo, cloudMat);
                tilt.add(clouds);
                extras.push(clouds);
            }
        }

        if (p.id === 'venus') {
            const atm = await loadTexture(
                THREE,
                texLoader,
                assetUrl(opts.baseUrl, 'venus_atmosphere.jpg'),
                THREE.SRGBColorSpace,
            );
            if (atm) {
                textures.push(atm);
                const atmGeo = track(
                    new THREE.SphereGeometry(1.04, segs, Math.floor(segs * 0.75)),
                );
                const atmMat = track(
                    new THREE.MeshStandardMaterial({
                        map: atm,
                        transparent: true,
                        opacity: 0.5,
                        depthWrite: false,
                    }),
                );
                const shell = new THREE.Mesh(atmGeo, atmMat);
                tilt.add(shell);
                extras.push(shell);
            }
        }

        if (p.id === 'saturn') {
            const ringMap = await loadTexture(
                THREE,
                texLoader,
                assetUrl(opts.baseUrl, 'saturn_ring.png'),
                THREE.SRGBColorSpace,
            );
            if (ringMap) {
                textures.push(ringMap);
            }
            const ringGeo = track(new THREE.RingGeometry(1.4, 2.4, 64));
            const pos = ringGeo.attributes.position;
            const uv = ringGeo.attributes.uv;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const len = Math.hypot(x, y);
                uv.setXY(i, (len - 1.4) / (2.4 - 1.4), 0.5);
            }
            uv.needsUpdate = true;
            const ringMat = track(
                new THREE.MeshBasicMaterial({
                    map: ringMap ?? undefined,
                    color: ringMap ? 0xffffff : 0xc9b68a,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: ringMap ? 0.9 : 0.55,
                    depthWrite: false,
                }),
            );
            // Flat in the planet's equatorial plane; the tilt group supplies
            // Saturn's real 26.7° obliquity.
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            tilt.add(ring);
        }

        planets.set(p.id, { group, body, extras });
    }

    // Moon lives on the earth group so it tracks earth automatically
    const earthEntry = planets.get('earth');
    const moonGroup = new THREE.Group();
    moonGroup.name = 'moon';
    if (earthEntry) {
        earthEntry.group.add(moonGroup);
    } else {
        root.add(moonGroup);
    }
    const moonGeo = track(new THREE.SphereGeometry(1, 24, 18));
    const moonMap = await loadTexture(
        THREE,
        texLoader,
        assetUrl(opts.baseUrl, 'moon.jpg'),
        THREE.SRGBColorSpace,
    );
    if (moonMap) textures.push(moonMap);
    const moonMat = track(
        new THREE.MeshStandardMaterial({
            map: moonMap ?? undefined,
            color: moonMap ? 0xffffff : MOON.fallbackColor,
            roughness: 0.95,
            metalness: 0,
        }),
    );
    const moonBody = new THREE.Mesh(moonGeo, moonMat);
    const moonTilt = new THREE.Group();
    moonTilt.rotation.z = MOON.axialTilt;
    moonTilt.add(moonBody);
    moonGroup.add(moonTilt);

    const handles: SolarSystemHandles = {
        root,
        sun,
        sunLight,
        planets,
        moon: { group: moonGroup, body: moonBody },
        dispose: () => {
            for (const tex of textures) tex.dispose();
            for (const d of disposables) d.dispose();
            scene.background = null;
            scene.environment = null;
            while (scene.children.length) scene.remove(scene.children[0]);
        },
    };

    return { scene, handles };
}

export function applyPlanetStates(
    handles: SolarSystemHandles,
    states: PlanetState[],
    highlight: ReadonlySet<PlanetId>,
    tDays: number,
): void {
    let earthScale = 1;
    for (const state of states) {
        const entry = handles.planets.get(state.id);
        if (!entry) continue;
        const lit = highlight.has(state.id);
        const scale = state.radius * (lit ? 1.14 : 1);
        entry.group.position.set(state.x, state.y, state.z);
        entry.group.scale.setScalar(scale);
        entry.body.rotation.y = state.spin;
        for (const extra of entry.extras) {
            extra.rotation.y = state.spin * 1.15;
        }
        if (state.id === 'earth') earthScale = scale;
    }

    const m = moonStateAt(tDays);
    handles.moon.group.position.set(m.dx, m.dy, m.dz);
    // Counter parent earth scale so moon keeps its absolute visual radius
    handles.moon.group.scale.setScalar(m.radius / Math.max(earthScale, 1e-6));
    handles.moon.body.rotation.y = m.spin;

    handles.sun.rotation.y = sunSpinAt(tDays);
}
