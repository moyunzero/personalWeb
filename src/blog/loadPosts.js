import { parsePost } from './parsePost';
import { resolveBlogAsset } from './utils';
import postsIndex from '../../public/posts-index.json';

/** @type {Record<string, () => Promise<string>>} */
const postModules = import.meta.glob('../../content/posts/**/*.md', {
    query: '?raw',
    import: 'default',
});

/**
 * @typedef {import('./parsePost').ReturnType<typeof parsePost>} BlogPost
 * @typedef {Omit<BlogPost, 'content'> & { source: string }} PostListItem
 */

/**
 * @returns {PostListItem[]}
 */
function getIndexEntries() {
    return postsIndex.filter((post) => {
        if (import.meta.env.PROD && post.draft) {
            return false;
        }
        return true;
    });
}

/**
 * 列表用元数据（不含正文）
 * @returns {BlogPost[]}
 */
export function loadPosts() {
    return getIndexEntries()
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .map((entry) => ({
            id: entry.id,
            title: entry.title,
            description: entry.description,
            author: entry.author,
            publishDate: entry.publishDate,
            updateDate: entry.updateDate,
            categories: entry.categories,
            tags: entry.tags,
            coverImage: entry.cover ? resolveBlogAsset(entry.cover) : undefined,
            gallery: (entry.gallery ?? []).map((src) => resolveBlogAsset(src)).filter(Boolean),
            readTime: entry.readTime,
            draft: entry.draft,
            featured: entry.featured,
            content: '',
        }));
}

/**
 * 按需加载单篇文章全文
 * @param {string} slug
 * @returns {Promise<BlogPost | null>}
 */
export async function loadPostBySlug(slug) {
    const entry = getIndexEntries().find((post) => post.id === slug);
    if (!entry?.source) return null;

    const modulePath = `../../content/posts/${entry.source}`;
    const loader = postModules[modulePath];
    if (!loader) return null;

    const raw = await loader();
    return parsePost(`content/posts/${entry.source}`, raw);
}
