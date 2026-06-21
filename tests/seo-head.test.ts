import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve('dist');
const blogIndex = path.join(distRoot, 'blog/index.html');
const samplePost = path.join(
    distRoot,
    'blog/2026-06-14-mocode-phase-1/index.html'
);

function readDist(filePath: string): string {
    if (!existsSync(filePath)) {
        throw new Error(`Missing built file: ${filePath}. Run yarn build first.`);
    }
    return readFileSync(filePath, 'utf8');
}

describe('SEO head in built HTML', () => {
    it('blog index has lang, description, canonical with trailing slash', () => {
        const html = readDist(blogIndex);
        expect(html).toMatch(/lang="zh-CN"/);
        expect(html).toMatch(/<meta name="description"/);
        expect(html).toMatch(
            /<link rel="canonical" href="https:\/\/moyunzero\.github\.io\/personalWeb\/blog\/"/
        );
    });

    it('blog post has og tags and BlogPosting JSON-LD', () => {
        const html = readDist(samplePost);
        expect(html).toMatch(/property="og:title"/);
        expect(html).toMatch(/property="og:type" content="article"/);
        expect(html).toMatch(/application\/ld\+json/);
        expect(html).toMatch(/BlogPosting/);
    });

    it('canonical href ends with trailing slash', () => {
        const html = readDist(samplePost);
        const match = html.match(/<link rel="canonical" href="([^"]+)"/);
        expect(match).not.toBeNull();
        expect(match![1].endsWith('/')).toBe(true);
    });
});
