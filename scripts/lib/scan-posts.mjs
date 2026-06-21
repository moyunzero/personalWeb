import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const POSTS_DIR = path.join(root, 'content/posts');

/**
 * @returns {Promise<Array<{
 *   file: string,
 *   filePath: string,
 *   fileSlug: string,
 *   data: Record<string, unknown>,
 *   content: string,
 *   raw: string,
 * }>>}
 */
export async function scanPosts() {
    const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
    const posts = [];

    for (const file of files) {
        const filePath = path.join(POSTS_DIR, file);
        const raw = await readFile(filePath, 'utf8');
        const { data, content } = parseFrontmatter(raw);
        posts.push({
            file,
            filePath,
            fileSlug: file.replace(/\.md$/, ''),
            data,
            content,
            raw,
        });
    }

    return posts;
}
