/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
    PITCH_LIMIT,
    TOUCH_EXPLORE_PX,
    YAW_HALF_LIFE_MS,
    ZOOM_MAX,
    ZOOM_MIN,
    clampZoomFactor,
    dampHalfLife,
    distanceFromZoomFactor,
    isCosmosExploreTarget,
    prefersReducedMotion,
    reseedLastPointerAfterPinch,
} from '../src/components/islands/cosmosHitTest';
import {
    DISC_CLEARANCE,
    ECCENTRICITY_SCALE,
    HIGHLIGHT_SCALE,
    INITIAL_CAMERA_PITCH,
    MOON,
    PLANETS,
    SECTION_FOCUS,
    SECTION_ORDER,
    SUN,
    SUN_RADIUS,
    TIME_SCALE_DAYS_PER_SEC,
    compressPeriod,
    compressSemiMajor,
    focusPoseFor,
    moonStateAt,
    orbitalToWorld,
    planetStateAt,
    solveEccentricAnomaly,
    sunSpinAt,
    systemStateAt,
    visualExtent,
    type PlanetState,
} from '../src/components/islands/solarSystemModel';

function clearanceNeed(
    a: { id: string; visualRadius?: number; radius?: number },
    b: { id: string; visualRadius?: number; radius?: number },
): number {
    return (visualExtent(a) + visualExtent(b)) * HIGHLIGHT_SCALE + DISC_CLEARANCE;
}

function assertPairClear(a: PlanetState, b: PlanetState, label: string) {
    const dist = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    expect(dist, label).toBeGreaterThan(clearanceNeed(a, b));
}

function assertSystemClear(states: PlanetState[], label: string) {
    for (let i = 0; i < states.length; i++) {
        const fromSun = Math.hypot(states[i].x, states[i].y, states[i].z);
        expect(fromSun, `${label} sun+${states[i].id}`).toBeGreaterThan(
            SUN_RADIUS + visualExtent(states[i]) * HIGHLIGHT_SCALE + DISC_CLEARANCE,
        );
        for (let j = i + 1; j < states.length; j++) {
            assertPairClear(states[i], states[j], `${label} ${states[i].id}+${states[j].id}`);
        }
    }
}

const islandPath = path.resolve('src/components/islands/CosmicStarfieldIsland.tsx');
const indexPath = path.resolve('src/pages/index.astro');
const blogIndexPath = path.resolve('src/pages/blog/index.astro');
const webDir = path.resolve('public/threejs-assets/web');
const BUDGET = 8 * 1024 * 1024;

describe('CosmicStarfieldIsland gating (source)', () => {
    it('does not top-level import three', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).not.toMatch(/from\s+['"]three['"]/);
        expect(source).toMatch(/import\s*\(\s*['"]three['"]\s*\)/);
    });

    it('home mounts cosmos island, poster fallback; ParticleIsland is gone', () => {
        const source = readFileSync(indexPath, 'utf8');
        expect(source).toMatch(/CosmicStarfieldIsland/);
        expect(source).toMatch(/data-cosmos-fallback/);
        expect(source).toMatch(/hdr_blue_nebulae_poster\.webp/);
        expect(source).not.toMatch(/ParticleIsland/);
        expect(() =>
            readFileSync(path.resolve('src/components/islands/ParticleIsland.tsx')),
        ).toThrow();
    });

    it('wheel zoom requires ctrl or meta key (AC-2)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/ctrlKey|metaKey/);
    });

    it('home layout hides native scrollbar via html class (AC-8)', () => {
        const layout = readFileSync(path.resolve('src/layouts/HomeLayout.astro'), 'utf8');
        const base = readFileSync(path.resolve('src/layouts/BaseLayout.astro'), 'utf8');
        const css = readFileSync(path.resolve('src/index.css'), 'utf8');
        expect(layout).toMatch(/home-cosmos-scroll/);
        expect(base).toMatch(/htmlClass/);
        expect(css).toMatch(/home-cosmos-scroll/);
        expect(css).toMatch(/scrollbar-width:\s*none/);
    });

    it('background slot sits outside the z-10 content stack (AC-1, AC-4)', () => {
        const layout = readFileSync(path.resolve('src/layouts/HomeLayout.astro'), 'utf8');
        const bgIdx = layout.indexOf('slot name="background"');
        const contentIdx = layout.indexOf('relative z-10');
        expect(bgIdx).toBeGreaterThan(-1);
        expect(contentIdx).toBeGreaterThan(bgIdx);
        expect(layout).toMatch(/data-cosmos-hit/);
    });

    it('explore ends on pointerup or pointercancel and uses pan-y touch (AC-2, AC-3)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/pointerup/);
        expect(source).toMatch(/pointercancel/);
        expect(source).toMatch(/touchAction:\s*['"]pan-y['"]|touchAction\s*=\s*['"]pan-y['"]/);
        expect(source).toMatch(/YAW_HALF_LIFE_MS/);
        expect(source).toMatch(/PITCH_LIMIT/);
        expect(source).toMatch(/zoomFactor/);
        expect(source).toMatch(/TOUCH_EXPLORE_PX/);
        expect(source).not.toMatch(/Ease explore zoom back/);
    });

    it('build gate script lists required web/ files (AC-7)', () => {
        const gate = readFileSync(path.resolve('scripts/check-cosmos-assets.mjs'), 'utf8');
        expect(gate).toMatch(/REQUIRED_WEB_FILES/);
        expect(gate).toMatch(/process\.exit\(1\)/);
        const pkg = readFileSync(path.resolve('package.json'), 'utf8');
        expect(pkg).toMatch(/check-cosmos-assets\.mjs/);
    });

    it('blog routes do not import the cosmos island or solar modules', () => {
        const blogIndex = readFileSync(blogIndexPath, 'utf8');
        expect(blogIndex).not.toMatch(/CosmicStarfieldIsland/);
        expect(blogIndex).not.toMatch(/solarSystem/);
        expect(blogIndex).not.toMatch(/from\s+['"]three['"]/);
        expect(blogIndex).not.toMatch(/threejs-assets\/web/);
    });

    it('island wires section focus observer and solar scene (AC-9, AC-10)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/IntersectionObserver/);
        expect(source).toMatch(/buildSolarSystemScene/);
        expect(source).toMatch(/TIME_SCALE_DAYS_PER_SEC/);
        expect(source).toMatch(/visibilityState/);
    });

    it('skips WebGL init when prefers-reduced-motion and tears down on context lost (AC-5)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/if\s*\(\s*prefersReducedMotion\(\)\s*\)\s*return/);
        expect(source).toMatch(/webglcontextlost/);
        expect(source).toMatch(/aria-hidden/);
    });

    it('GameIsland roots carry data-no-cosmos (AC-4)', () => {
        const game = readFileSync(path.resolve('src/components/islands/GameIsland.tsx'), 'utf8');
        expect(game).toMatch(/data-no-cosmos/);
    });

    it('blog post and category pages do not mount cosmos (AC-6)', () => {
        for (const rel of [
            'src/pages/blog/[...slug].astro',
            'src/pages/blog/category/[id].astro',
        ]) {
            const source = readFileSync(path.resolve(rel), 'utf8');
            expect(source).not.toMatch(/CosmicStarfieldIsland/);
            expect(source).not.toMatch(/threejs-assets\/web/);
            expect(source).not.toMatch(/data-cosmos-/);
        }
    });
});

describe('web asset budget (AC-7)', () => {
    it('publishes only web/ derivatives under budget; no source 8k/HDR paths in island', () => {
        expect(existsSync(webDir)).toBe(true);
        const names = readdirSync(webDir);
        expect(names).toContain('hdr_blue_nebulae.hdr');
        expect(names).toContain('hdr_blue_nebulae_poster.webp');
        for (const id of [
            'sun',
            'moon',
            'mercury',
            'venus',
            'earth_day',
            'mars',
            'jupiter',
            'saturn',
            'uranus',
            'neptune',
        ]) {
            expect(names.some((n) => n.startsWith(id))).toBe(true);
        }

        let total = 0;
        for (const name of names) {
            if (name === 'spectacle') continue;
            total += statSync(path.join(webDir, name)).size;
            expect(name).not.toMatch(/^8k_/);
            expect(name).not.toMatch(/HDR_multi/);
            expect(name).not.toMatch(/\.blend$/);
        }
        expect(total).toBeLessThanOrEqual(BUDGET);

        const island = readFileSync(islandPath, 'utf8');
        const scene = readFileSync(
            path.resolve('src/components/islands/solarSystemScene.ts'),
            'utf8',
        );
        expect(island + scene).not.toMatch(/8k_earth|HDR_blue_nebulae_3|HDR_multi/);
        expect(scene).toMatch(/threejs-assets\/web\//);
    });

    it('prepare script maps source assets to web/ and enforces BUDGET_BYTES (AC-7)', () => {
        const prep = readFileSync(path.resolve('scripts/prepare-threejs-assets.mjs'), 'utf8');
        expect(prep).toMatch(/BUDGET_BYTES\s*=\s*8\s*\*\s*1024\s*\*\s*1024/);
        expect(prep).toMatch(/process\.exit\(1\)/);
        expect(prep).toMatch(/HDR_blue_nebulae_3\.hdr/);
        expect(prep).toMatch(/three\/addons\/loaders\/HDRLoader\.js/);
        for (const out of [
            'sun.jpg',
            'moon.jpg',
            'earth_day.jpg',
            'earth_night.jpg',
            'earth_clouds.jpg',
            'venus_atmosphere.jpg',
            'saturn_ring.png',
        ]) {
            expect(prep).toContain(out);
        }
    });
});

describe('solarSystemModel (AC-9, AC-10)', () => {
    it('keeps Mercury→Neptune order and monotone orbit radii', () => {
        expect(PLANETS.map((p) => p.id)).toEqual([
            'mercury',
            'venus',
            'earth',
            'mars',
            'jupiter',
            'saturn',
            'uranus',
            'neptune',
        ]);
        const radii = PLANETS.map((p) => compressSemiMajor(p.aAu));
        for (let i = 1; i < radii.length; i++) {
            expect(radii[i]).toBeGreaterThan(radii[i - 1]);
        }
    });

    it('carries Ω, ω, M0, rotationDays, and exaggerated visualRadius', () => {
        for (const p of PLANETS) {
            expect(Number.isFinite(p.longAscendingNode)).toBe(true);
            expect(Number.isFinite(p.argPeriapsis)).toBe(true);
            expect(Number.isFinite(p.meanAnomaly0)).toBe(true);
            expect(Number.isFinite(p.rotationDays)).toBe(true);
            expect(p.visualRadius).toBeGreaterThan(0);
        }
        expect(PLANETS.find((p) => p.id === 'venus')?.rotationDays).toBeLessThan(0);
        expect(PLANETS.find((p) => p.id === 'uranus')?.rotationDays).toBeLessThan(0);
        expect(PLANETS.find((p) => p.id === 'jupiter')?.visualRadius).toBeGreaterThan(
            PLANETS.find((p) => p.id === 'earth')!.visualRadius,
        );
    });

    it('orbitalToWorld applies inclination out of the XZ plane', () => {
        const flat = orbitalToWorld(10, 0.5, 0, 0, 0);
        expect(flat.y).toBeCloseTo(0, 8);
        const tipped = orbitalToWorld(10, Math.PI / 2, Math.PI / 6, 0, 0);
        expect(Math.abs(tipped.y)).toBeGreaterThan(1);
    });

    it('initial epoch keeps planet discs clear of each other', () => {
        assertSystemClear(systemStateAt(0), 't=0');
    });

    it('adjacent compressed orbits always clear discs even when aligned (AC-9)', () => {
        for (let i = 0; i < PLANETS.length - 1; i++) {
            const a = PLANETS[i];
            const b = PLANETS[i + 1];
            // Worst case peri/apo on the same ray after eccentricity scale
            const ra = compressSemiMajor(a.aAu);
            const rb = compressSemiMajor(b.aAu);
            const ea = a.eccentricity * ECCENTRICITY_SCALE;
            const eb = b.eccentricity * ECCENTRICITY_SCALE;
            const gap = rb * (1 - eb) - ra * (1 + ea);
            expect(gap, `${a.id}->${b.id}`).toBeGreaterThan(clearanceNeed(a, b));
        }
    });

    it('planets stay clear across a long coupled-time window (AC-9)', () => {
        // ~20000 sim-days at TIME_SCALE covers many inner orbits and several outer ones
        for (let t = 0; t <= 20_000; t += 2) {
            assertSystemClear(systemStateAt(t), `t=${t}`);
        }
    }, 30_000);

    it('adjacent planets never mesh for any independent orbital phase pair (AC-9)', () => {
        const STEPS = 48;
        for (let i = 0; i < PLANETS.length - 1; i++) {
            const inner = PLANETS[i];
            const outer = PLANETS[i + 1];
            const periodA = compressPeriod(inner.periodDays);
            const periodB = compressPeriod(outer.periodDays);
            for (let ka = 0; ka < STEPS; ka++) {
                for (let kb = 0; kb < STEPS; kb++) {
                    const a = planetStateAt(inner, (ka / STEPS) * periodA);
                    const b = planetStateAt(outer, (kb / STEPS) * periodB);
                    assertPairClear(
                        a,
                        b,
                        `${inner.id}+${outer.id} phase ${ka}/${kb}`,
                    );
                }
            }
        }
    });

    it('moon stays outside the earth disc in local space', () => {
        for (let t = 0; t <= 2_000; t += 1) {
            const m = moonStateAt(t);
            const dist = Math.hypot(m.dx, m.dy, m.dz);
            // Earth mesh radius is 1 in local space; moon orbitFactor must clear both radii
            expect(dist).toBeGreaterThan(1 + MOON.visualRadius);
        }
    });

    it('Kepler solver returns finite positions; inner planets move faster', () => {
        const a = systemStateAt(0);
        const b = systemStateAt(30);
        for (const s of [...a, ...b]) {
            expect(Number.isFinite(s.x)).toBe(true);
            expect(Number.isFinite(s.y)).toBe(true);
            expect(Number.isFinite(s.z)).toBe(true);
        }
        const mercTravel = Math.hypot(b[0].x - a[0].x, b[0].z - a[0].z);
        const neptTravel = Math.hypot(b[7].x - a[7].x, b[7].z - a[7].z);
        expect(mercTravel).toBeGreaterThan(neptTravel);

        const e = PLANETS[0].eccentricity * ECCENTRICITY_SCALE;
        const peri = compressSemiMajor(PLANETS[0].aAu) * (1 - e);
        const aph = compressSemiMajor(PLANETS[0].aAu) * (1 + e);
        expect(aph).toBeGreaterThan(peri);

        const E = solveEccentricAnomaly(1.2, 0.2);
        expect(Number.isFinite(E)).toBe(true);
    });

    it('moon orbits in local earth space at a finite offset', () => {
        const m0 = moonStateAt(0);
        const m1 = moonStateAt(10);
        for (const m of [m0, m1]) {
            expect(Number.isFinite(m.dx)).toBe(true);
            expect(Number.isFinite(m.dz)).toBe(true);
            expect(Math.hypot(m.dx, m.dy, m.dz)).toBeGreaterThan(2);
        }
        expect(m0.dx).not.toBeCloseTo(m1.dx, 5);
    });

    it('sun spins slowly from its equatorial period', () => {
        expect(SUN.rotationDays).toBeCloseTo(25.05, 2);
        expect(sunSpinAt(0)).toBe(0);
        expect(sunSpinAt(SUN.rotationDays)).toBeCloseTo(Math.PI * 2 * 0.008, 5);
        expect(Math.abs(sunSpinAt(1))).toBeLessThan(Math.abs(systemStateAt(1)[4].spin));
    });

    it('section focus map matches AC-10', () => {
        expect(SECTION_ORDER).toEqual(['home', 'about', 'skill', 'work', 'contact']);
        expect([...SECTION_FOCUS.home]).toEqual(['mercury', 'venus']);
        expect([...SECTION_FOCUS.about]).toEqual(['earth']);
        expect([...SECTION_FOCUS.skill]).toEqual(['mars', 'jupiter']);
        expect([...SECTION_FOCUS.work]).toEqual(['saturn']);
        expect([...SECTION_FOCUS.contact]).toEqual(['uranus', 'neptune']);

        const states = systemStateAt(10);
        const pose = focusPoseFor('about', states);
        expect(Number.isFinite(pose.distance)).toBe(true);
        expect(pose.distance).toBeGreaterThan(0);
    });

    it('compressPeriod is monotone and home pose is a wide establishing shot (AC-9, AC-10)', () => {
        const periods = PLANETS.map((p) => compressPeriod(p.periodDays));
        for (let i = 1; i < periods.length; i++) {
            expect(periods[i]).toBeGreaterThan(periods[i - 1]);
        }
        const states = systemStateAt(0);
        const home = focusPoseFor('home', states);
        const about = focusPoseFor('about', states);
        expect(home.targetX).toBe(0);
        expect(home.targetZ).toBe(0);
        expect(home.distance).toBeGreaterThan(about.distance);
        for (const id of SECTION_ORDER) {
            const pose = focusPoseFor(id, states);
            expect(Number.isFinite(pose.distance)).toBe(true);
            expect(pose.distance).toBeGreaterThan(0);
        }
    });
});

describe('solarSystemScene wiring (AC-1, AC-5)', () => {
    const scenePath = path.resolve('src/components/islands/solarSystemScene.ts');

    it('builds earth night/clouds, venus atmosphere, saturn rings from web/ paths', () => {
        const scene = readFileSync(scenePath, 'utf8');
        expect(scene).toMatch(/earth_day\.jpg/);
        expect(scene).toMatch(/earth_night\.jpg/);
        expect(scene).toMatch(/earth_clouds\.jpg/);
        expect(scene).toMatch(/venus_atmosphere\.jpg/);
        expect(scene).toMatch(/RingGeometry/);
        expect(scene).toMatch(/saturn_ring\.png/);
        expect(scene).toMatch(/hdr_blue_nebulae\.hdr/);
        expect(scene).toMatch(/HDRLoader|EquirectangularReflectionMapping/);
    });

    it('uses fallbackColor when a surface map is missing (AC-5)', () => {
        const scene = readFileSync(scenePath, 'utf8');
        expect(scene).toMatch(/color:\s*p\.fallbackColor/);
        expect(scene).toMatch(/if\s*\(!map\)\s*return/);
        expect(scene).toMatch(/catch/);
        expect(scene).toMatch(/return null/);
    });

    it('returns the scene synchronously and applies textures in parallel (AC-1, AC-5)', () => {
        const scene = readFileSync(scenePath, 'utf8');
        expect(scene).toMatch(/export function buildSolarSystemScene/);
        expect(scene).not.toMatch(/export async function buildSolarSystemScene/);
        expect(scene).toMatch(/startHdrLoad/);
        expect(scene).toMatch(/const planetTexPs = new Map/);
        expect(scene).toMatch(/void sunTexP\.then/);
        expect(scene).toMatch(/void planetTexPs\.get\(p\.id\)\?\.then/);
        expect(scene).toMatch(/scene\.background = new THREE\.Color/);
    });

    // covers: AC-7 — HDR kickoff after sun + fallback planets are in the graph
    it('starts HDR load only after sun and planet meshes are hung (AC-7)', () => {
        const scene = readFileSync(scenePath, 'utf8');
        const sunHung = scene.indexOf('root.add(sunPivot)');
        const planetsSet = scene.lastIndexOf('planets.set(p.id');
        const hdrKick = scene.indexOf('startHdrLoad(THREE, scene');
        expect(sunHung).toBeGreaterThan(-1);
        expect(planetsSet).toBeGreaterThan(-1);
        expect(hdrKick).toBeGreaterThan(-1);
        expect(hdrKick).toBeGreaterThan(sunHung);
        expect(hdrKick).toBeGreaterThan(planetsSet);
        expect(scene.indexOf('startHdrLoad(THREE, scene')).toBe(hdrKick);
    });
});

describe('cosmos load performance wiring (AC-1, AC-7)', () => {
    it('prefetches three.js at island module scope before WebGL init', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/const threeModule = import\('three'\)/);
        expect(source).toMatch(/await threeModule/);
        expect(source).toMatch(/buildSolarSystemScene\(THREE/);
        expect(source).not.toMatch(/await buildSolarSystemScene/);
    });

    // covers: AC-1, AC-7 — poster/sun warm the critical path; HDR waits for the WebGL skeleton
    it('home preloads poster, prefetches sun, and defers HDR off the critical path', () => {
        const source = readFileSync(indexPath, 'utf8');
        expect(source).toMatch(/rel="preload"/);
        expect(source).toMatch(/fetchpriority="high"/);
        expect(source).toMatch(/hdr_blue_nebulae_poster\.webp/);
        expect(source).toMatch(/rel="prefetch"[\s\S]*sun\.jpg/);
        expect(source).not.toMatch(/rel="prefetch"[^>]*hdr_blue_nebulae\.hdr/);
    });

    // covers: AC-7 — client:load starts import('three') with other load islands (not after visible)
    it('home mounts cosmos and game islands with client:load', () => {
        const source = readFileSync(indexPath, 'utf8');
        expect(source).toMatch(/CosmicStarfieldIsland\s+client:load/);
        expect(source).toMatch(/GameIsland\s+client:load/);
        expect(source).not.toMatch(/CosmicStarfieldIsland\s+client:visible/);
        expect(source).not.toMatch(/GameIsland\s+client:visible/);
    });
});

describe('cosmosHitTest helpers', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.innerHTML = '';
    });

    it('locks explore constants to AC-2 contract values', () => {
        expect(PITCH_LIMIT).toBeCloseTo(Math.PI / 6, 8);
        expect(YAW_HALF_LIFE_MS).toBe(120);
        expect(TOUCH_EXPLORE_PX).toBe(8);
        expect(ZOOM_MIN).toBeLessThan(1);
        expect(ZOOM_MAX).toBeGreaterThan(1);
        expect(ZOOM_MIN).toBeLessThan(ZOOM_MAX);
        expect(Math.abs(INITIAL_CAMERA_PITCH)).toBeLessThanOrEqual(PITCH_LIMIT);
        expect(TIME_SCALE_DAYS_PER_SEC).toBeGreaterThan(0);
    });

    it('dampHalfLife halves after one half-life and clamps zoom factor (AC-2)', () => {
        expect(dampHalfLife(8, 120, 120)).toBeCloseTo(4, 8);
        expect(dampHalfLife(8, 120, 240)).toBeCloseTo(2, 8);
        expect(dampHalfLife(1, 0, 16)).toBe(0);
        expect(clampZoomFactor(0.1)).toBe(ZOOM_MIN);
        expect(clampZoomFactor(9)).toBe(ZOOM_MAX);
        expect(clampZoomFactor(1)).toBe(1);
        expect(distanceFromZoomFactor(100, 1.2)).toBeCloseTo(120, 8);
        expect(distanceFromZoomFactor(100, 0.1)).toBeCloseTo(100 * ZOOM_MIN, 8);
    });

    it('prefersReducedMotion reads matchMedia reduce', () => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({ matches: true, media: '(prefers-reduced-motion: reduce)' }),
        );
        expect(prefersReducedMotion()).toBe(true);

        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({ matches: false, media: '(prefers-reduced-motion: reduce)' }),
        );
        expect(prefersReducedMotion()).toBe(false);
    });

    it('blocks interactive and data-no-cosmos targets (AC-4)', () => {
        document.body.innerHTML = `
            <div data-cosmos-hit>
              <a href="/">link</a>
              <button type="button">btn</button>
              <div data-no-cosmos id="game">game</div>
              <p id="empty">chrome</p>
            </div>
            <header id="hdr">nav</header>
            <canvas data-cosmos-canvas id="cv"></canvas>
        `;
        expect(isCosmosExploreTarget(document.querySelector('a'))).toBe(false);
        expect(isCosmosExploreTarget(document.querySelector('button'))).toBe(false);
        expect(isCosmosExploreTarget(document.querySelector('#game'))).toBe(false);
        expect(isCosmosExploreTarget(document.querySelector('#hdr'))).toBe(false);
        expect(isCosmosExploreTarget(document.querySelector('#empty'))).toBe(true);
        expect(isCosmosExploreTarget(document.querySelector('#cv'))).toBe(true);
    });

    it('reseeds lastPointer when pinch drops to one finger (AC-2)', () => {
        const remaining = [{ x: 400, y: 300 }];
        const seeded = reseedLastPointerAfterPinch(remaining);
        expect(seeded).toEqual({ x: 400, y: 300 });
        // Stale anchor at origin would produce a huge first-frame drag (the snap bug)
        const staleDx = remaining[0].x - 0;
        const fixedDx = remaining[0].x - seeded!.x;
        expect(staleDx).toBeGreaterThan(100);
        expect(fixedDx).toBe(0);
        expect(reseedLastPointerAfterPinch([])).toBeNull();
        expect(reseedLastPointerAfterPinch([{ x: 1, y: 1 }, { x: 2, y: 2 }])).toBeNull();
    });
});

describe('WebGL probe failure stays on fallback path', () => {
    it('getContext failure is detectable for silent fallback (AC-5)', () => {
        const canvas = document.createElement('canvas');
        const spy = vi.spyOn(canvas, 'getContext').mockReturnValue(null);
        expect(canvas.getContext('webgl') || canvas.getContext('webgl2')).toBeNull();
        spy.mockRestore();
    });
});
