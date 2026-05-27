import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';
import { extractExcerpt } from '../../src/blog/excerpt.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const POSTS_DIR = path.join(root, 'content/posts');

/**
 * @param {{ includeDrafts?: boolean }} [options]
 */
export async function loadPostsForBuild({ includeDrafts = false } = {}) {
    const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md'));
    /** @type {Array<{ id: string, title: string, description: string, author: string, publishDate: string, updateDate?: string, draft: boolean, featured: boolean }>} */
    const posts = [];

    for (const file of files) {
        const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
        const { data, content } = parseFrontmatter(raw);
        const draft = Boolean(data.draft);
        if (draft && !includeDrafts) continue;

        const fileSlug = file.replace(/\.md$/, '');
        const slug = data.slug || fileSlug;
        const body = content.trim();

        posts.push({
            id: slug,
            title: String(data.title || slug),
            description: String(data.description || '').trim() || extractExcerpt(body),
            author: String(data.author || '墨韵'),
            publishDate: String(data.date || data.publishDate || ''),
            updateDate: data.updateDate ? String(data.updateDate) : undefined,
            draft,
            featured: Boolean(data.featured),
        });
    }

    return posts.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
    );
}
