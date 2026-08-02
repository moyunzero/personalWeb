import { expect, test } from '@playwright/test';

test.describe('Cosmic starfield home background (spec 0003)', () => {
    test('home SSR poster fallback is present (AC-1)', async ({ page }) => {
        await page.goto('./');
        const fallback = page.locator('[data-cosmos-fallback]');
        await expect(fallback).toBeAttached();
        await expect(fallback.locator('img[src*="hdr_blue_nebulae_poster"]')).toBeAttached();
        await expect(page.locator('body')).toContainText('用代码创造有趣的东西');
    });

    // covers: AC-1, AC-7 — built HTML must not race ~2MB HDR against three.js on first paint
    test('home head warms poster and sun without early HDR prefetch (AC-1, AC-7)', async ({
        page,
    }) => {
        await page.goto('./');
        const headLinks = await page.evaluate(() =>
            Array.from(document.head.querySelectorAll('link')).map((link) => ({
                rel: link.rel,
                href: link.href,
                as: link.getAttribute('as'),
                fetchpriority: link.getAttribute('fetchpriority'),
            })),
        );

        const posterPreload = headLinks.find(
            (link) =>
                link.rel === 'preload' &&
                link.href.includes('hdr_blue_nebulae_poster') &&
                (link.as === 'image' || link.as === null),
        );
        expect(posterPreload).toBeTruthy();
        expect(posterPreload?.fetchpriority).toBe('high');

        expect(
            headLinks.some((link) => link.rel === 'prefetch' && link.href.includes('sun.jpg')),
        ).toBe(true);

        expect(
            headLinks.some(
                (link) => link.rel === 'prefetch' && link.href.includes('hdr_blue_nebulae.hdr'),
            ),
        ).toBe(false);

        await expect(page.getByRole('button', { name: '点击启动忍者小游戏' })).toBeVisible({
            timeout: 8_000,
        });
        await expect(page.locator('[data-cosmos-canvas]')).toBeVisible({ timeout: 12_000 });
    });

    test('home mounts cosmos canvas when motion is allowed (AC-1)', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto('./');
        const canvas = page.locator('[data-cosmos-canvas]');
        await expect(canvas).toBeVisible({ timeout: 20_000 });
        await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    });

    test('reduced motion keeps poster and skips cosmos canvas (AC-5)', async ({ page }) => {
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
        await expect(page.locator('[data-cosmos-fallback] img[src*="poster"]')).toBeAttached();
        await expect
            .poll(async () => page.locator('[data-cosmos-canvas]').count(), { timeout: 5_000 })
            .toBe(0);
    });

    test('blog index and a post never load cosmos island or web assets (AC-6)', async ({ page }) => {
        const cosmosHits: string[] = [];
        page.on('request', (req) => {
            const url = req.url();
            if (/threejs-assets|CosmicStarfieldIsland|solarSystem/.test(url)) {
                cosmosHits.push(url);
            }
        });

        await page.goto('./blog/');
        await expect(page.locator('[data-cosmos-fallback]')).toHaveCount(0);
        await expect(page.locator('[data-cosmos-canvas]')).toHaveCount(0);
        expect(cosmosHits).toEqual([]);

        await page.goto('./blog/2023-03-12-html/');
        await expect(page.locator('[data-cosmos-fallback]')).toHaveCount(0);
        await expect(page.locator('[data-cosmos-canvas]')).toHaveCount(0);
        expect(cosmosHits).toEqual([]);
    });

    test('game chrome is marked data-no-cosmos (AC-4)', async ({ page }) => {
        await page.goto('./');
        const gameBtn = page.getByRole('button', { name: '点击启动忍者小游戏' });
        await expect(gameBtn).toBeVisible();
        await expect(gameBtn).toHaveAttribute('data-no-cosmos', /.*/);
    });

    test('home hides native scrollbar class while blog does not (AC-8)', async ({ page }) => {
        await page.goto('./');
        await expect
            .poll(async () => page.evaluate(() => document.documentElement.className))
            .toContain('home-cosmos-scroll');

        await page.goto('./blog/');
        const blogClass = await page.evaluate(() => document.documentElement.className);
        expect(blogClass).not.toContain('home-cosmos-scroll');
    });

    test('home exposes narrative section anchors for focus mapping (AC-10)', async ({ page }) => {
        await page.goto('./');
        for (const id of ['home', 'about', 'skill', 'work', 'contact']) {
            await expect(page.locator(`#${id}`)).toBeAttached();
        }
    });

    test('plain wheel scrolls the page without requiring Ctrl (AC-2)', async ({ page }) => {
        await page.goto('./');
        await expect(page.locator('#about')).toBeAttached();
        const before = await page.evaluate(() => window.scrollY);
        await page.mouse.wheel(0, 900);
        await expect
            .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5_000 })
            .toBeGreaterThan(before);
    });
});
