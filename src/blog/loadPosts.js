import { parsePost } from './parsePost';

const postModules = import.meta.glob('../../content/posts/**/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
});

/**
 * @returns {import('./parsePost').ReturnType<typeof parsePost>[]}
 */
function loadAllRawPosts() {
    return Object.entries(postModules).map(([path, raw]) =>
        parsePost(path, raw)
    );
}

/**
 * 获取已发布文章（生产环境排除 draft）
 * @returns {ReturnType<typeof parsePost>[]}
 */
export function loadPosts() {
    const posts = loadAllRawPosts().filter((post) => {
        if (import.meta.env.PROD && post.draft) {
            return false;
        }
        return true;
    });

    return posts.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
    );
}

/**
 * @param {string} slug
 */
export function loadPostBySlug(slug) {
    return loadPosts().find((post) => post.id === slug) ?? null;
}
