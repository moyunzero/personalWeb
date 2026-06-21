import { expect, test } from '@playwright/test';

test.describe('Phase 4 — SEO internal linking', () => {
    test('blog detail shows 3 related links', async ({ page }) => {
        await page.goto('./blog/2023-03-12-html/');
        const links = page.locator('[data-testid="related-posts"] a');
        await expect(links).toHaveCount(3);
    });

    test('category hub lists filtered posts', async ({ page }) => {
        await page.goto('./blog/category/note/');
        const cards = page.locator('a[href*="blog/"]');
        await expect(cards.first()).toBeVisible();
        expect(await cards.count()).toBeGreaterThan(0);
    });

    test('blog index category nav hrefs', async ({ page }) => {
        await page.goto('./blog/');
        await expect(page.locator('a[href*="blog/category/note"]')).toBeVisible();
    });
});

test.describe('Phase 4 — game smoke (D-P4-10)', () => {
    test('home game button visible before click', async ({ page }) => {
        await page.goto('./');
        await expect(
            page.getByRole('button', { name: '点击启动忍者小游戏' })
        ).toBeVisible();
    });

    test('home hero static text visible immediately', async ({ page }) => {
        await page.goto('./');
        await expect(page.locator('body')).toContainText('用代码创造有趣的东西');
    });
});
