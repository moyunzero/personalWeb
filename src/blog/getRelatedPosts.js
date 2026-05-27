const CATEGORY_WEIGHT = 2;
const TAG_WEIGHT = 3;
/** 至少 1 个共同标签，或 2+ 个共同分类 */
const MIN_RELATED_SCORE = TAG_WEIGHT;

function normalizeKey(value) {
    return String(value).trim().toLowerCase();
}

function countOverlap(valuesA, valuesB) {
    if (!valuesA?.length || !valuesB?.length) return 0;
    const setB = new Set(valuesB.map(normalizeKey));
    return valuesA.filter((value) => setB.has(normalizeKey(value))).length;
}

/**
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>} current
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>} candidate
 */
export function scoreRelatedPost(current, candidate) {
    const categoryOverlap = countOverlap(current.categories, candidate.categories);
    const tagOverlap = countOverlap(current.tags, candidate.tags);
    return categoryOverlap * CATEGORY_WEIGHT + tagOverlap * TAG_WEIGHT;
}

/**
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>} current
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>[]} allPosts
 * @param {{ limit?: number }} [options]
 * @returns {{ posts: import('./parsePost').ReturnType<import('./parsePost').parsePost>[], heading: string | null, isRelated: boolean }}
 */
export function getRelatedPosts(current, allPosts, options = {}) {
    const limit = options.limit ?? 3;
    const others = allPosts.filter((post) => post.id !== current.id);

    if (others.length === 0) {
        return { posts: [], heading: null, isRelated: false };
    }

    const scored = others.map((post) => ({
        post,
        score: scoreRelatedPost(current, post),
    }));

    const maxScore = Math.max(...scored.map((item) => item.score));

    if (maxScore >= MIN_RELATED_SCORE) {
        const posts = scored
            .filter((item) => item.score >= MIN_RELATED_SCORE)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return new Date(b.post.publishDate) - new Date(a.post.publishDate);
            })
            .slice(0, limit)
            .map((item) => item.post);

        return { posts, heading: '相关文章', isRelated: true };
    }

    const posts = [...others]
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, limit);

    return { posts, heading: '更多文章', isRelated: false };
}
