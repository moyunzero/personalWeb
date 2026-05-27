/**
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>[]} posts
 * @param {{ category?: string, tag?: string, query?: string }} filters
 */
export function filterPosts(posts, { category = 'all', tag = '', query = '' } = {}) {
    let result = posts;

    if (category && category !== 'all') {
        result = result.filter((post) => post.categories.includes(category));
    }

    if (tag) {
        const normalizedTag = tag.toLowerCase();
        result = result.filter((post) =>
            post.tags.some((item) => item.toLowerCase() === normalizedTag)
        );
    }

    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery) {
        result = result.filter((post) => {
            const inTitle = post.title.toLowerCase().includes(trimmedQuery);
            const inDescription = post.description.toLowerCase().includes(trimmedQuery);
            const inTags = post.tags.some((item) =>
                item.toLowerCase().includes(trimmedQuery)
            );
            return inTitle || inDescription || inTags;
        });
    }

    return result;
}

/**
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>[]} posts
 * @param {{ limit?: number }} [options]
 */
export function collectTags(posts, { limit = 24 } = {}) {
    /** @type {Map<string, { label: string, count: number }>} */
    const counts = new Map();

    for (const post of posts) {
        for (const tag of post.tags) {
            const key = tag.toLowerCase();
            const existing = counts.get(key);
            if (existing) {
                existing.count += 1;
            } else {
                counts.set(key, { label: tag, count: 1 });
            }
        }
    }

    return [...counts.values()]
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh'))
        .slice(0, limit)
        .map((item) => item.label);
}
