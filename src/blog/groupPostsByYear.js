/**
 * 按发布年份分组（posts 需已按日期降序）
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>[]} posts
 * @returns {{ year: number, posts: typeof posts }[]}
 */
export function groupPostsByYear(posts) {
    /** @type {Map<number, typeof posts>} */
    const groups = new Map();

    for (const post of posts) {
        const year = new Date(post.publishDate).getFullYear();
        const safeYear = Number.isNaN(year) ? 0 : year;
        const bucket = groups.get(safeYear) ?? [];
        bucket.push(post);
        groups.set(safeYear, bucket);
    }

    return [...groups.entries()]
        .sort(([yearA], [yearB]) => yearB - yearA)
        .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}
