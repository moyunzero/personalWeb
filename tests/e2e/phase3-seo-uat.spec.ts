import { expect, test } from '@playwright/test';

test.describe('Phase 3 SEO — built HTML meta', () => {
    test('home has non-empty meta description and zh-CN lang', async ({ page }) => {
        await page.goto('./');
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description?.trim().length ?? 0).toBeGreaterThan(10);
    });

    test('blog index has meta description', async ({ page }) => {
        await page.goto('./blog/');
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description?.trim().length ?? 0).toBeGreaterThan(5);
    });

    test('sample post has meta description from frontmatter', async ({ page }) => {
        await page.goto('./blog/2023-03-12-html/');
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description?.trim().length ?? 0).toBeGreaterThan(20);
        expect(description).toMatch(/HTML|超文本/i);
    });

    test('hash-slug post has meta description after batch apply', async ({ page }) => {
        await page.goto('./blog/2024-06-08-36fdf5c0/');
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description?.trim().length ?? 0).toBeGreaterThan(5);
    });

    test('home and blog still render primary content', async ({ page }) => {
        await page.goto('./');
        await expect(page.locator('body')).toContainText('用代码创造有趣的东西');

        await page.goto('./blog/');
        await expect(page.locator('body')).not.toBeEmpty();
    });
});
