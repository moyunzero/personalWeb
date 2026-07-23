import { expect, test } from '@playwright/test';

test.describe('Home status rift and beast spectacle (spec 0005)', () => {
    test('home SSR exposes status hit and fishing copy (AC-1, AC-2)', async ({ page }) => {
        await page.goto('./');
        const hit = page.locator('[data-status-spectacle-hit]');
        const copy = page.locator('[data-status-spectacle-copy]');
        await expect(hit).toBeAttached();
        await expect(copy).toHaveText('正在摸鱼中 🐟');
        await expect(hit).not.toHaveRole('button');
        const overlay = page.locator('[data-status-spectacle-overlay]');
        await expect(overlay).toBeAttached();
        await expect
            .poll(async () =>
                overlay.evaluate((el) => (el as HTMLElement).style.pointerEvents || 'none'),
            )
            .toBe('none');
    });

    test('click path flips copy, pairs spectacle events, and finishes in budget (AC-1, AC-2, AC-8)', async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto('./');
        await page.waitForSelector('[data-status-spectacle-hit]');

        await page.evaluate(() => {
            const w = window as Window & {
                __specLog?: { t: string; trigger?: string; at: number }[];
            };
            w.__specLog = [];
            document.addEventListener('spectacle:start', ((e: CustomEvent) => {
                w.__specLog!.push({
                    t: 'start',
                    trigger: e.detail?.trigger,
                    at: performance.now(),
                });
            }) as EventListener);
            document.addEventListener('spectacle:end', ((e: CustomEvent) => {
                w.__specLog!.push({
                    t: 'end',
                    trigger: e.detail?.trigger,
                    at: performance.now(),
                });
            }) as EventListener);
        });

        const box = await page.locator('[data-status-spectacle-hit]').boundingBox();
        expect(box).toBeTruthy();
        const t0 = await page.evaluate(() => performance.now());
        await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

        await expect(page.locator('[data-status-spectacle-copy]')).toHaveText('已 dead', {
            timeout: 3_000,
        });
        await expect
            .poll(async () =>
                page.evaluate(
                    () =>
                        (window as Window & { __specLog?: { t: string }[] }).__specLog?.some(
                            (e) => e.t === 'start',
                        ) ?? false,
                ),
            )
            .toBe(true);

        await expect
            .poll(async () =>
                page.locator('[data-status-spectacle-overlay]').evaluate(
                    (el) => (el as HTMLElement).style.pointerEvents,
                ),
            )
            .toBe('auto');

        await expect(page.locator('[data-status-spectacle-copy]')).toHaveText('正在摸鱼中 🐟', {
            timeout: 16_000,
        });

        const result = await page.evaluate((started) => {
            const log =
                (window as Window & { __specLog?: { t: string; trigger?: string; at: number }[] })
                    .__specLog ?? [];
            const start = log.find((e) => e.t === 'start');
            const end = log.find((e) => e.t === 'end');
            return {
                clickToEndMs: Math.round(performance.now() - started),
                startToEndMs: start && end ? Math.round(end.at - start.at) : null,
                starts: log.filter((e) => e.t === 'start').length,
                ends: log.filter((e) => e.t === 'end').length,
                startTrigger: start?.trigger ?? null,
                endTrigger: end?.trigger ?? null,
                glb: performance
                    .getEntriesByType('resource')
                    .map((e) => e.name)
                    .filter((n) => /web\/spectacle\/pyjama-shark\/model\.glb/.test(n)),
                banned: performance
                    .getEntriesByType('resource')
                    .map((e) => e.name)
                    .filter((n) => /\.blend|4K_Pyjama|pyjama-shark-free/.test(n)),
            };
        }, t0);

        expect(result.starts).toBe(1);
        expect(result.ends).toBe(1);
        expect(result.startTrigger).toBe('click');
        expect(result.endTrigger).toBe('click');
        expect(result.clickToEndMs).toBeGreaterThanOrEqual(8_000);
        expect(result.clickToEndMs).toBeLessThanOrEqual(14_000);
        expect(result.glb.length).toBeGreaterThan(0);
        expect(result.banned).toEqual([]);
    });

    test('reduced motion does short copy flip without 3D or events (AC-5)', async ({ page }) => {
        await page.addInitScript(() => {
            const orig = window.matchMedia.bind(window);
            window.matchMedia = ((query: string) => {
                if (String(query).includes('prefers-reduced-motion')) {
                    return {
                        matches: true,
                        media: query,
                        onchange: null,
                        addListener() {},
                        removeListener() {},
                        addEventListener() {},
                        removeEventListener() {},
                        dispatchEvent() {
                            return false;
                        },
                    } as MediaQueryList;
                }
                return orig(query);
            }) as typeof window.matchMedia;
        });
        await page.goto('./');
        await page.evaluate(() => {
            const w = window as Window & { __specLog?: string[] };
            w.__specLog = [];
            document.addEventListener('spectacle:start', () => w.__specLog!.push('start'));
            document.addEventListener('spectacle:end', () => w.__specLog!.push('end'));
        });
        const box = await page.locator('[data-status-spectacle-hit]').boundingBox();
        await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        await expect(page.locator('[data-status-spectacle-copy]')).toHaveText('已 dead', {
            timeout: 2_000,
        });
        await expect(page.locator('[data-status-spectacle-copy]')).toHaveText('正在摸鱼中 🐟', {
            timeout: 3_000,
        });
        const probe = await page.evaluate(() => ({
            log: (window as Window & { __specLog?: string[] }).__specLog ?? [],
            glb: performance
                .getEntriesByType('resource')
                .map((e) => e.name)
                .filter((n) => /model\.glb|web\/spectacle/.test(n)),
        }));
        expect(probe.log).toEqual([]);
        expect(probe.glb).toEqual([]);
    });

    test('blog never loads spectacle island or web pack (AC-6)', async ({ page }) => {
        const hits: string[] = [];
        page.on('request', (req) => {
            const url = req.url();
            if (/StatusSpectacle|web\/spectacle|pyjama-shark/.test(url)) hits.push(url);
        });

        await page.goto('./blog/');
        await expect(page.locator('[data-status-spectacle-hit]')).toHaveCount(0);
        await expect(page.locator('[data-status-spectacle-overlay]')).toHaveCount(0);
        expect(hits).toEqual([]);

        await page.goto('./blog/2023-03-12-html/');
        await expect(page.locator('[data-status-spectacle-hit]')).toHaveCount(0);
        await expect(page.locator('[data-status-spectacle-overlay]')).toHaveCount(0);
        expect(hits).toEqual([]);
    });
});
