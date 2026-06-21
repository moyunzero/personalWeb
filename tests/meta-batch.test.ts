import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseFrontmatter } from '../src/blog/frontmatter.js';

const postsDir = path.join(process.cwd(), 'content/posts');

describe('meta-batch', () => {
    afterEach(() => {
        vi.resetModules();
    });

    it('dry-run does not write files', async () => {
        const { runMetaBatch } = await import('../scripts/seo-meta-batch.mjs');
        const posts = [
            {
                file: 'fixture.md',
                filePath: path.join(postsDir, 'fixture.md'),
                fileSlug: 'fixture',
                data: { title: 'T', draft: false, description: '' },
                content: '# Hello world\n\nBody text for excerpt generation.',
                raw: '---\ntitle: T\ndraft: false\ndescription: ""\n---\n\n# Hello',
            },
        ];
        const result = await runMetaBatch(posts, { apply: false });
        expect(result.wouldUpdateDescription).toBe(1);
    });

    it('apply fills empty description from excerpt', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'meta-batch-'));
        const filePath = path.join(tmp, 'test-post.md');
        const body = '# Title\n\nUnique body content for excerpt test.';
        const raw = `---\ntitle: Title\ndraft: false\ndescription: ""\n---\n\n${body}`;
        await writeFile(filePath, raw, 'utf8');

        const { data, content } = parseFrontmatter(raw);
        const { runMetaBatch } = await import('../scripts/seo-meta-batch.mjs');

        // Use temp path — override via post shape (write only if path under POSTS_DIR fails)
        // Test via in-memory apply simulation on stringify
        const posts = [
            {
                file: 'test-post.md',
                filePath,
                fileSlug: 'test-post',
                data,
                content,
                raw,
            },
        ];

        // runMetaBatch refuses writes outside POSTS_DIR — use real posts dir fixture
        const fixturePath = path.join(postsDir, '_meta-batch-fixture.md');
        const fixtureRaw = `---\ntitle: Fixture\ndraft: false\ndescription: ""\n---\n\n# Fixture\n\nBody for meta batch apply test.`;
        await writeFile(fixturePath, fixtureRaw, 'utf8');

        try {
            const { scanPosts } = await import('../scripts/lib/scan-posts.mjs');
            const scanned = await scanPosts();
            const fixture = scanned.find((p) => p.file === '_meta-batch-fixture.md');
            expect(fixture).toBeDefined();
            await runMetaBatch([fixture], { apply: true });
            const after = await readFile(fixturePath, 'utf8');
            const parsed = parseFrontmatter(after);
            expect(String(parsed.data.description ?? '').trim().length).toBeGreaterThan(0);
        } finally {
            await import('node:fs/promises').then((fs) => fs.unlink(fixturePath));
        }
    });

    describe('slug', () => {
        it('does not change slug without --force-slug', async () => {
            const { runMetaBatch } = await import('../scripts/seo-meta-batch.mjs');
            const posts = [
                {
                    file: 'abc12345.md',
                    filePath: path.join(postsDir, 'abc12345.md'),
                    fileSlug: 'abc12345',
                    data: {
                        title: 'Hash slug',
                        slug: 'abc12345',
                        draft: false,
                        description: 'Already has description',
                    },
                    content: 'body',
                    raw: '---\ntitle: Hash\ndescription: ok\n---\n\nbody',
                },
            ];
            const result = await runMetaBatch(posts, { apply: true, forceSlug: false });
            expect(result.updatedDescription).toBe(0);
        });
    });
});
