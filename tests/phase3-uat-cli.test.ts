import { execSync } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '../src/blog/frontmatter.js';

const root = path.resolve(import.meta.dirname, '..');

function run(cmd: string) {
    return execSync(cmd, { cwd: root, encoding: 'utf8' });
}

describe('Phase 3 UAT — CLI pipeline', () => {
    it('meta-batch dry-run: 96 scanned, 0 description updates', () => {
        const out = run('yarn seo:meta-batch --dry-run');
        expect(out).toMatch(/Posts scanned: 96/);
        expect(out).toMatch(/Would update \(description\): 0/);
    });

    it('seo:audit exits 0 with zero errors', () => {
        const out = run('yarn seo:audit');
        expect(out).toMatch(/Audit: 0 error/);
    });

    it('batch apply did not rename post files', () => {
        const out = run('git diff --name-status content/posts');
        const renames = out.split('\n').filter((line) => line.startsWith('R'));
        expect(renames.length).toBe(0);
    });

    it('package.json chains seo:audit in build', () => {
        const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
        expect(pkg.scripts.build).toContain('seo:audit');
        expect(pkg.scripts['build:astro']).toBe('astro build');
    });

    it('deploy.yml runs yarn build', () => {
        const deploy = readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
        expect(deploy).toContain('yarn build');
    });

    it('blog:new creates non-empty description stub', async () => {
        const title = `UAT自动化${Date.now()}`;
        let slugFile = '';
        try {
            const out = run(`yarn blog:new "${title}"`);
            const match = out.match(/content\/posts\/([^\s]+\.md)/);
            expect(match).toBeTruthy();
            slugFile = match![1];
            const raw = await readFile(path.join(root, 'content/posts', slugFile), 'utf8');
            const { data } = parseFrontmatter(raw);
            expect(String(data.description ?? '').trim().length).toBeGreaterThan(0);
            expect(data.draft).toBe(true);
        } finally {
            if (slugFile) {
                await unlink(path.join(root, 'content/posts', slugFile));
            }
        }
    });
});
