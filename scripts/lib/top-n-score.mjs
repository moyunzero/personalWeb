import { isHashSlug } from './meta-rules.mjs';

export const TECH_KEYWORDS = [
    'javascript',
    'typescript',
    'react',
    'vue',
    'node',
    'html',
    'css',
    'ai',
    'rag',
    'astro',
    'langchain',
    'python',
    'docker',
    'git',
    'webpack',
    'next',
    'nuxt',
    'sql',
    'redis',
    'mongodb',
];

function countKeywordMatches(title) {
    const lower = String(title ?? '').toLowerCase();
    let count = 0;
    for (const kw of TECH_KEYWORDS) {
        if (lower.includes(kw)) count += 1;
    }
    return Math.min(count, 3);
}

function scoreKeyword(title) {
    return countKeywordMatches(title);
}

function scoreQuality(post) {
    const { data, content } = post;
    const slug = String(data.slug ?? '');
    const description = String(data.description ?? '');
    const body = String(content ?? '').replace(/^---[\s\S]*?---\s*/, '');
    let quality = 0;
    if (body.replace(/\s+/g, '').length > 6000) quality += 2;
    if (description.length >= 120 && description.length <= 160) quality += 1;
    if (!isHashSlug(slug)) quality += 1;
    return quality;
}

function scoreHub(post) {
    const categories = Array.isArray(post.data.categories) ? post.data.categories : [];
    const tags = Array.isArray(post.data.tags) ? post.data.tags : [];
    let hub = 0;
    if (categories.includes('note')) hub += 1;
    if (tags.length >= 3) hub += 1;
    return hub;
}

/**
 * @param {Awaited<ReturnType<import('./scan-posts.mjs').scanPosts>>[number]} post
 */
export function scorePost(post) {
    const keyword = scoreKeyword(post.data.title);
    const quality = scoreQuality(post);
    const hub = scoreHub(post);
    const score = keyword * 2 + quality * 2 + hub * 1;
    return { score, breakdown: { keyword, quality, hub } };
}

/**
 * @param {Awaited<ReturnType<import('./scan-posts.mjs').scanPosts>>} posts
 * @param {{ limit?: number }} [options]
 */
export function rankPosts(posts, options = {}) {
    const limit = Math.min(Math.max(options.limit ?? 20, 15), 20);
    const published = posts.filter((p) => !p.data.draft);

    const ranked = published
        .map((post) => ({
            post,
            ...scorePost(post),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const dateA = String(a.post.data.publishedAt ?? '');
            const dateB = String(b.post.data.publishedAt ?? '');
            return dateB.localeCompare(dateA);
        })
        .slice(0, limit);

    return ranked;
}

export { countKeywordMatches };
