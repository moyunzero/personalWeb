import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';
import { extractExcerpt } from '../../src/blog/excerpt.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const POSTS_DIR = path.join(root, 'content/posts');

function normalizeDate(value) {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    return String(value).trim();
}

function dateFromFileSlug(fileSlug) {
    const match = fileSlug.match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? '';
}

function estimateReadTime(content) {
    const words = content.replace(/\s+/g, '').length;
    return Math.max(1, Math.ceil(words / 400));
}

/**
 * 构建博客列表索引（不含正文，供前端列表/筛选使用）
 * @param {{ includeDrafts?: boolean }} [options]
 */
export async function buildPostsIndex({ includeDrafts = false } = {}) {
    const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md'));
    /** @type {Array<Record<string, unknown>>} */
    const posts = [];

    for (const file of files) {
        const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
        const { data, content } = parseFrontmatter(raw);
        const draft = Boolean(data.draft);
        if (draft && !includeDrafts) continue;

        const fileSlug = file.replace(/\.md$/, '');
        const slug = data.slug || fileSlug;
        const body = content.trim();

        const categories = Array.isArray(data.categories)
            ? data.categories
            : data.category
              ? [data.category]
              : [];

        const tags = Array.isArray(data.tags)
            ? data.tags
            : typeof data.tags === 'string'
              ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
              : [];

        const publishDate =
            normalizeDate(data.date || data.publishDate) || dateFromFileSlug(fileSlug);

        posts.push({
            id: slug,
            source: file,
            title: String(data.title || slug),
            description: String(data.description || '').trim() || extractExcerpt(body),
            author: String(data.author || '墨韵'),
            publishDate,
            updateDate: data.updateDate ? String(data.updateDate) : undefined,
            categories,
            tags,
            cover: data.cover?.trim() ? String(data.cover).trim() : undefined,
            gallery: Array.isArray(data.gallery) ? data.gallery : [],
            readTime: data.readTime ?? estimateReadTime(body),
            draft,
            featured: Boolean(data.featured),
        });
    }

    return posts.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
    );
}
