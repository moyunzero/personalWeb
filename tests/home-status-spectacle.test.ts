/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
    AUTO_INITIAL_DELAY_MS,
    AUTO_WINDOW_MAX_MS,
    AUTO_WINDOW_MIN_MS,
    COPY_DEAD,
    COPY_FISHING,
    PHASE_MS,
    PORTAL_MAX_RETRIES,
    PORTAL_PAD_PX,
    beastArcLength,
    beastBodyLength,
    canStart,
    copyLiteral,
    discHitsForbidden,
    discIntersectsRect,
    expandRect,
    nextPhase,
    portalRadius,
    sampleAutoDelayMs,
    sampleBeastDurationMs,
    samplePortalAnchor,
    shouldAffectStatus,
    type RectLike,
} from '../src/components/islands/spectacleModel';

const indexPath = path.resolve('src/pages/index.astro');
const blogIndexPath = path.resolve('src/pages/blog/index.astro');
const blogSlugPath = path.resolve('src/pages/blog/[...slug].astro');
const mainPath = path.resolve('src/components/home/Main.astro');
const islandPath = path.resolve('src/components/islands/StatusSpectacleIsland.tsx');
const spectacleDir = path.resolve('public/threejs-assets/web/spectacle/pyjama-shark');
const SPECTACLE_BUDGET = 2.5 * 1024 * 1024;

describe('spectacleModel pure helpers', () => {
    it('canStart only when idle (AC-3 lock)', () => {
        expect(canStart('idle')).toBe(true);
        expect(canStart('splitting')).toBe(false);
        expect(canStart('portal')).toBe(false);
        expect(canStart('beast')).toBe(false);
        expect(canStart('healing')).toBe(false);
    });

    it('shouldAffectStatus only for click (AC-2)', () => {
        expect(shouldAffectStatus('click')).toBe(true);
        expect(shouldAffectStatus('auto')).toBe(false);
    });

    it('copy literals match contract (AC-2)', () => {
        expect(copyLiteral('fishing')).toBe(COPY_FISHING);
        expect(copyLiteral('dead')).toBe(COPY_DEAD);
        expect(COPY_FISHING).toBe('正在摸鱼中 🐟');
        expect(COPY_DEAD).toBe('已 dead');
    });

    it('phase durations match AC-1 defaults', () => {
        expect(PHASE_MS.splitting).toBe(1200);
        expect(PHASE_MS.portal).toBe(1500);
        expect(PHASE_MS.beastMin).toBe(5000);
        expect(PHASE_MS.beastMax).toBe(7000);
        expect(PHASE_MS.healing).toBe(1500);
        expect(PHASE_MS.copyFadeBack).toBe(800);
        const beast = sampleBeastDurationMs(() => 0.5);
        expect(beast).toBeGreaterThanOrEqual(PHASE_MS.beastMin);
        expect(beast).toBeLessThanOrEqual(PHASE_MS.beastMax);
        const totalMin =
            PHASE_MS.splitting + PHASE_MS.portal + PHASE_MS.beastMin + PHASE_MS.healing;
        const totalMax =
            PHASE_MS.splitting + PHASE_MS.portal + PHASE_MS.beastMax + PHASE_MS.healing;
        expect(totalMin).toBeGreaterThanOrEqual(8000);
        expect(totalMax).toBeLessThanOrEqual(12000);
    });

    it('auto schedule windows match AC-3', () => {
        expect(AUTO_INITIAL_DELAY_MS).toBe(30_000);
        expect(AUTO_WINDOW_MIN_MS).toBe(120_000);
        expect(AUTO_WINDOW_MAX_MS).toBe(300_000);
        expect(sampleAutoDelayMs(() => 0)).toBe(AUTO_WINDOW_MIN_MS);
        expect(sampleAutoDelayMs(() => 1)).toBe(AUTO_WINDOW_MAX_MS);
    });

    it('portal radius formula (AC-4)', () => {
        expect(portalRadius(1000, 800)).toBe(Math.min(120, 0.12 * 800));
        expect(portalRadius(2000, 2000)).toBe(120);
    });

    it('disc / forbidden geometry (AC-4)', () => {
        const rect: RectLike = { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 };
        expect(discIntersectsRect(50, 20, 10, rect)).toBe(true);
        expect(discIntersectsRect(200, 200, 10, rect)).toBe(false);
        const padded = expandRect(rect, PORTAL_PAD_PX);
        expect(padded.left).toBe(-PORTAL_PAD_PX);
        expect(discHitsForbidden(50, 20, 10, [padded])).toBe(true);
    });

    it('samplePortalAnchor retries then safe point (AC-4)', () => {
        const nav: RectLike = { left: 0, top: 0, right: 400, bottom: 64, width: 400, height: 64 };
        const status: RectLike = {
            left: 40,
            top: 120,
            right: 280,
            bottom: 160,
            width: 240,
            height: 40,
        };
        // Always land inside the status band so retries fail.
        let calls = 0;
        const anchor = samplePortalAnchor(
            { vw: 400, vh: 800 },
            [nav, status],
            () => {
                calls += 1;
                return 0.2;
            },
        );
        expect(calls).toBeGreaterThanOrEqual(PORTAL_MAX_RETRIES);
        expect(anchor.x).toBeCloseTo(200, 5);
        expect(anchor.y).toBeCloseTo(0.62 * 800, 5);
        expect(anchor.r).toBeGreaterThan(0);
        expect(
            discHitsForbidden(
                anchor.x,
                anchor.y,
                anchor.r,
                [nav, status].map((r) => expandRect(r, PORTAL_PAD_PX)),
            ),
        ).toBe(false);
    });

    it('phase order for click and auto', () => {
        expect(nextPhase('idle', 'click')).toBe('splitting');
        expect(nextPhase('splitting', 'click')).toBe('portal');
        expect(nextPhase('portal', 'click')).toBe('beast');
        expect(nextPhase('beast', 'click')).toBe('healing');
        expect(nextPhase('healing', 'click')).toBe('idle');
        expect(nextPhase('idle', 'auto')).toBe('portal');
        expect(nextPhase('portal', 'auto')).toBe('beast');
        expect(nextPhase('beast', 'auto')).toBe('idle');
    });

    it('3D narrative constants', () => {
        expect(beastBodyLength(50)).toBe(1.8 * 2 * 50);
        expect(beastArcLength(1000)).toBe(400);
    });
});

describe('Status spectacle wiring (source)', () => {
    it('Main.astro exposes hit and copy data attrs (AC-1, AC-2)', () => {
        const source = readFileSync(mainPath, 'utf8');
        expect(source).toMatch(/data-status-spectacle-hit/);
        expect(source).toMatch(/data-status-spectacle-copy/);
        expect(source).toMatch(/正在摸鱼中 🐟/);
    });

    it('home mounts StatusSpectacleIsland with client:idle (cold-start bandwidth)', () => {
        const source = readFileSync(indexPath, 'utf8');
        expect(source).toMatch(/StatusSpectacleIsland/);
        expect(source).toMatch(/StatusSpectacleIsland\s+client:idle/);
        expect(source).not.toMatch(/StatusSpectacleIsland\s+client:load/);
    });

    it('blog routes do not import the spectacle island (AC-6)', () => {
        for (const p of [blogIndexPath, blogSlugPath]) {
            if (!existsSync(p)) continue;
            const source = readFileSync(p, 'utf8');
            expect(source).not.toMatch(/StatusSpectacleIsland/);
            expect(source).not.toMatch(/web\/spectacle/);
        }
    });

    it('island does not top-level import three (AC-5)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).not.toMatch(/from\s+['"]three['"]/);
        expect(source).toMatch(/import\s*\(\s*['"]three['"]\s*\)/);
        expect(source).toMatch(/spectacle:start/);
        expect(source).toMatch(/spectacle:end/);
    });

    it('cosmos listens for spectacle events (AC-8)', () => {
        const cosmos = readFileSync(
            path.resolve('src/components/islands/CosmicStarfieldIsland.tsx'),
            'utf8',
        );
        expect(cosmos).toMatch(/spectacle:start/);
        expect(cosmos).toMatch(/spectacle:end/);
    });

    it('beginPortalBeast enables overlay for click and auto (AC-8 regression)', () => {
        const source = readFileSync(islandPath, 'utf8');
        const begin = source.indexOf('const beginPortalBeast');
        expect(begin).toBeGreaterThan(-1);
        const nextFn = source.indexOf('const healSplit', begin);
        const body = source.slice(begin, nextFn);
        expect(body).toMatch(/setOverlayActive\(true\)/);
        // Auto shares beginPortalBeast; must not rely on runSplit for overlay.
        expect(source).toMatch(/startRun\('auto'\)|trigger === 'auto'|startRun\("auto"\)|void startRun\('auto'\)/);
        expect(source).toMatch(/await beginPortalBeast\(trigger/);
    });

    it('spectacle:start waits until scene ready (AC-1 load outside budget)', () => {
        const source = readFileSync(islandPath, 'utf8');
        const begin = source.indexOf('const beginPortalBeast');
        const nextFn = source.indexOf('const healSplit', begin);
        const body = source.slice(begin, nextFn);
        const readyAt = body.indexOf('await sceneHandles.ready');
        const startAt = body.indexOf("dispatchSpectacle('spectacle:start'");
        expect(readyAt).toBeGreaterThan(-1);
        expect(startAt).toBeGreaterThan(readyAt);
    });

    it('beast narrative fits sampled duration instead of a 9s+ floor (AC-1 regression)', () => {
        const scenePath = path.resolve('src/components/islands/spectacleScene.ts');
        const source = readFileSync(scenePath, 'utf8');
        expect(source).toMatch(/BEAST_WEIGHT/);
        expect(source).toMatch(/SURGE_W\s*\/\s*BEAST_WEIGHT/);
        // Old bug: Math.max(beastDurationMs/1000, SURGE+TURN+SWIM+EXIT) with ~9.55s floor.
        expect(source).not.toMatch(
            /Math\.max\(\s*beastDurationMs\s*\/\s*1000\s*,\s*SURGE/,
        );
        expect(source).toMatch(/portalNarrativeT0/);
        expect(source).toMatch(/PHASE_MS\.portal/);
    });

    it('registers webglcontextlost and fatal unlock path (AC-5, AC-8 regression)', () => {
        const scene = readFileSync(
            path.resolve('src/components/islands/spectacleScene.ts'),
            'utf8',
        );
        const island = readFileSync(islandPath, 'utf8');
        expect(scene).toMatch(/webglcontextlost/);
        expect(scene).toMatch(/onFatalError/);
        expect(island).toMatch(/onFatalError/);
        const tickAt = island.indexOf('const tick =');
        const startLoopAt = island.indexOf('const startLoop', tickAt);
        const tickBody = island.slice(tickAt, startLoopAt);
        expect(tickBody).toMatch(/try\s*\{/);
        expect(tickBody).toMatch(/catch/);
        expect(tickBody).toMatch(/forceCancel/);
        // After update(), do not re-arm RAF when scene was disposed mid-frame (auto complete).
        expect(tickBody).toMatch(/if\s*\(\s*!sceneHandles\s*\)/);
        expect(tickBody).toMatch(/rafId\s*=\s*0/);
    });

    it('rejects ready when disposed mid-load (AC-9 regression)', () => {
        const scene = readFileSync(
            path.resolve('src/components/islands/spectacleScene.ts'),
            'utf8',
        );
        expect(scene).toMatch(/if\s*\(\s*disposed\s*\)\s*\{[\s\S]*?rejectReady/);
        const disposeAt = scene.lastIndexOf('const dispose =');
        expect(disposeAt).toBeGreaterThan(-1);
        const disposeBody = scene.slice(disposeAt, disposeAt + 400);
        expect(disposeBody).toMatch(/rejectReady/);
    });

    it('cosmos locks on spectacle events before async Three init (AC-8 regression)', () => {
        const cosmos = readFileSync(
            path.resolve('src/components/islands/CosmicStarfieldIsland.tsx'),
            'utf8',
        );
        const effectStart = cosmos.indexOf('useEffect(() => {');
        const asyncStart = cosmos.indexOf('(async () => {', effectStart);
        const syncChunk = cosmos.slice(effectStart, asyncStart);
        expect(syncChunk).toMatch(/spectacle:start/);
        expect(syncChunk).toMatch(/spectacle:end/);
        // Must not only register inside the post-await listener block.
        const afterAsync = cosmos.slice(asyncStart);
        const lateStart = afterAsync.indexOf("addEventListener('spectacle:start'");
        expect(lateStart).toBe(-1);
        expect(cosmos).toMatch(/spectacleLocked\s*=\s*true/);
        expect(cosmos).toMatch(/spectacleLocked\s*=\s*false/);
        expect(cosmos).toMatch(/removeEventListener\(['"]spectacle:start['"]/);
        expect(cosmos).toMatch(/removeEventListener\(['"]spectacle:end['"]/);
    });

    it('tick re-arms RAF only while the scene is alive (AC-9)', () => {
        const island = readFileSync(islandPath, 'utf8');
        const tickAt = island.indexOf('const tick =');
        const startLoopAt = island.indexOf('const startLoop', tickAt);
        const tickBody = island.slice(tickAt, startLoopAt);
        expect(tickBody).toMatch(/if\s*\(\s*!sceneHandles\s*\)/);
        expect(tickBody).toMatch(/rafId\s*=\s*requestAnimationFrame\(\s*tick\s*\)/);
        const startLoopBody = island.slice(
            startLoopAt,
            island.indexOf('const beginPortalBeast', startLoopAt),
        );
        // Clearing rafId on dispose lets the next auto run startLoop again.
        expect(startLoopBody).toMatch(/if\s*\(\s*rafId\s*\)\s*return/);
    });

    it('status hit is a non-button row (AC-1)', () => {
        const source = readFileSync(mainPath, 'utf8');
        const hitAt = source.indexOf('data-status-spectacle-hit');
        const hitBlock = source.slice(Math.max(0, hitAt - 160), hitAt + 40);
        expect(hitBlock).toMatch(/<div[\s\S]*data-status-spectacle-hit/);
        expect(hitBlock).not.toMatch(/<button/);
        expect(hitBlock).not.toMatch(/role=["']button["']/);
    });

    it('overlay is z-50 and idle pointer-events none (AC-1)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/z-\[50\]/);
        expect(source).toMatch(/pointer-events-none fixed inset-0 z-\[50\]/);
        expect(source).toMatch(/setOverlayActive\(false\)/);
        expect(source).toMatch(/pointerType !== 'mouse' && event\.pointerType !== 'touch'/);
    });

    it('shortCopyOnly skips spectacle events (AC-5, AC-8)', () => {
        const source = readFileSync(islandPath, 'utf8');
        const start = source.indexOf('const shortCopyOnly');
        const end = source.indexOf('const startRun', start);
        const body = source.slice(start, end);
        expect(body).toMatch(/setCopy\(copyNode, 'dead'\)/);
        expect(body).toMatch(/setCopy\(copyNode, 'fishing'\)/);
        expect(body).not.toMatch(/dispatchSpectacle/);
        expect(source).toMatch(/prefersReducedMotion\(\).*shortCopyOnly|shortCopyOnly[\s\S]*prefersReducedMotion/);
        expect(source).toMatch(/void shortCopyOnly\(\)/);
    });

    it('visibility cancel restores fishing and reschedules with gate (AC-9)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/visibilitychange/);
        expect(source).toMatch(/document\.hidden[\s\S]*forceCancel|forceCancel[\s\S]*document\.hidden/);
        const force = source.slice(
            source.indexOf('const forceCancel'),
            source.indexOf('const scheduleAuto'),
        );
        expect(force).toMatch(/copy === 'dead'/);
        expect(force).toMatch(/setCopy\(copyNode, 'fishing'\)/);
        expect(force).toMatch(/endSpectacleEvent/);
        expect(source).toMatch(/scheduleAuto\(true\)/);
    });

    it('runtime glTF URL and Swim clip preference (AC-7)', () => {
        const scene = readFileSync(
            path.resolve('src/components/islands/spectacleScene.ts'),
            'utf8',
        );
        expect(scene).toMatch(
            /threejs-assets\/web\/spectacle\/pyjama-shark\/model\.glb/,
        );
        expect(scene).not.toMatch(/pyjama-shark-free|\.blend|4K_Pyjama/);
        expect(scene).toMatch(/c\.name === ['"]Swim['"]/);
    });

    it('spectacle events carry bubbling detail.trigger (AC-8)', () => {
        const source = readFileSync(islandPath, 'utf8');
        expect(source).toMatch(/bubbles:\s*true/);
        expect(source).toMatch(/detail:\s*\{\s*trigger/);
    });

    it('spectacle stays a separate island from cosmos (AC-10)', () => {
        const index = readFileSync(indexPath, 'utf8');
        expect(index).toMatch(/StatusSpectacleIsland/);
        expect(index).toMatch(/CosmicStarfieldIsland/);
        const island = readFileSync(islandPath, 'utf8');
        expect(island).not.toMatch(/solarSystemScene|buildSolarSystem/);
        expect(island).toMatch(/buildSpectacleScene/);
    });
});

describe('spectacle assets (AC-7)', () => {
    it('web/spectacle/pyjama-shark stays under 2.5 MB and has model.glb', () => {
        expect(existsSync(spectacleDir)).toBe(true);
        const glb = path.join(spectacleDir, 'model.glb');
        expect(existsSync(glb)).toBe(true);
        const sumFiles = (dir: string): number => {
            let total = 0;
            for (const name of readdirSync(dir)) {
                if (name.startsWith('.')) continue;
                const full = path.join(dir, name);
                const st = statSync(full);
                if (st.isDirectory()) total += sumFiles(full);
                else if (st.isFile()) total += st.size;
            }
            return total;
        };
        const total = sumFiles(spectacleDir);
        expect(total).toBeLessThanOrEqual(SPECTACLE_BUDGET);
        expect(total).toBeGreaterThan(0);
    });

    it('check script lists spectacle files and budget', () => {
        const check = readFileSync(path.resolve('scripts/check-cosmos-assets.mjs'), 'utf8');
        expect(check).toMatch(/spectacle\/pyjama-shark/);
        expect(check).toMatch(/2\.5\s*\*\s*1024\s*\*\s*1024|2621440|SPECTACLE_BUDGET/);
        expect(check).toMatch(/REQUIRED_SPECTACLE_FILES|model\.glb/);
    });

    it('prepare-spectacle script writes web pack under budget (AC-7)', () => {
        const prep = readFileSync(path.resolve('scripts/prepare-spectacle-assets.mjs'), 'utf8');
        expect(prep).toMatch(/web\/spectacle\/pyjama-shark/);
        expect(prep).toMatch(/SPECTACLE_BUDGET_BYTES/);
        expect(prep).toMatch(/assets\/spectacle-source/);
        expect(prep).not.toMatch(/public\/threejs-assets\/pyjama-shark-free/);
        expect(prep).toMatch(/model\.glb/);
    });

    it('shark source is outside public and gitignored (AC-7 deploy)', () => {
        expect(existsSync(path.resolve('public/threejs-assets/pyjama-shark-free'))).toBe(false);
        const ignore = readFileSync(path.resolve('.gitignore'), 'utf8');
        expect(ignore).toMatch(/assets\/spectacle-source\/?/);
    });
});
