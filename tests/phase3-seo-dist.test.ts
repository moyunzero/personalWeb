import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

function metaDescription(html: string) {
    const match = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    return match?.[1]?.trim() ?? '';
}

describe('Phase 3 SEO — dist HTML (no browser)', () => {
    it('home: zh-CN lang and meta description', async () => {
        const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
        expect(html).toMatch(/lang="zh-CN"/i);
        expect(metaDescription(html).length).toBeGreaterThan(10);
    });

    it('blog index has meta description', async () => {
        const html = await readFile(path.join(root, 'dist/blog/index.html'), 'utf8');
        expect(metaDescription(html).length).toBeGreaterThan(5);
    });

    it('sample post meta reflects frontmatter description', async () => {
        const html = await readFile(
            path.join(root, 'dist/blog/2023-03-12-html/index.html'),
            'utf8'
        );
        const desc = metaDescription(html);
        expect(desc.length).toBeGreaterThan(20);
        expect(desc).toMatch(/HTML|超文本/i);
    });

    it('hash-slug post has meta description after batch', async () => {
        const html = await readFile(
            path.join(root, 'dist/blog/2024-06-08-36fdf5c0/index.html'),
            'utf8'
        );
        expect(metaDescription(html).length).toBeGreaterThan(5);
    });
});
