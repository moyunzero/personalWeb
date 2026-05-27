/**
 * 按发布时间获取相邻文章（列表为日期降序：较新在前）
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>} current
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>[]} allPosts
 * @returns {{ prev: typeof current | null, next: typeof current | null }}
 */
export function getAdjacentPosts(current, allPosts) {
    const sorted = [...allPosts].sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
    );
    const index = sorted.findIndex((post) => post.id === current.id);
    if (index === -1) {
        return { prev: null, next: null };
    }

    return {
        prev: sorted[index + 1] ?? null,
        next: sorted[index - 1] ?? null,
    };
}
