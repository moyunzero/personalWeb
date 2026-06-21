import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadPostsForBuild } from '../scripts/lib/load-posts.mjs';

const distRoot = path.resolve('dist');

function readDist(relative: string): string {
    const filePath = path.join(distRoot, relative);
    if (!existsSync(filePath)) {
        throw new Error(`Missing built file: ${filePath}. Run yarn build first.`);
    }
    return readFileSync(filePath, 'utf8');
}

function readUrlsetXml(): string {
    if (existsSync(path.join(distRoot, 'sitemap-0.xml'))) {
        return readDist('sitemap-0.xml');
    }
    throw new Error('Missing sitemap-0.xml in dist. Run yarn build first.');
}

describe('sitemap and robots', () => {
    it('dist contains sitemap XML files', () => {
        expect(existsSync(path.join(distRoot, 'sitemap-index.xml'))).toBe(true);
        expect(existsSync(path.join(distRoot, 'sitemap-0.xml'))).toBe(true);
    });

    it('sitemap includes home and blog index with trailing slashes', async () => {
        const xml = readUrlsetXml();
        expect(xml).toContain('https://moyunzero.github.io/personalWeb/');
        expect(xml).toContain('https://moyunzero.github.io/personalWeb/blog/');
    });

    it('sitemap URL count matches published posts + home + blog index', async () => {
        const posts = await loadPostsForBuild();
        const published = posts.filter((p) => !p.draft);
        const xml = readUrlsetXml();
        const locCount = (xml.match(/<loc>/g) ?? []).length;
        expect(locCount).toBe(published.length + 2);
    });

    it('robots.txt references sitemap-index.xml', () => {
        const robots = readDist('robots.txt');
        expect(robots).toContain('Sitemap:');
        expect(robots).toContain('sitemap-index.xml');
    });

    it('no draft post slug appears in sitemap', async () => {
        const posts = await loadPostsForBuild();
        const draft = posts.find((p) => p.draft);
        if (!draft) return;
        const xml = readUrlsetXml();
        expect(xml).not.toContain(`/blog/${draft.id}`);
    });
});
