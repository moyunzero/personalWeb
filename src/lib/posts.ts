import type { PostEntry } from './blog';

export function groupPostsByYear(posts: PostEntry[]): {
    year: number;
    posts: PostEntry[];
}[] {
    const groups = new Map<number, PostEntry[]>();

    for (const post of posts) {
        const year = new Date(post.data.publishedAt).getFullYear();
        const safeYear = Number.isNaN(year) ? 0 : year;
        const bucket = groups.get(safeYear) ?? [];
        bucket.push(post);
        groups.set(safeYear, bucket);
    }

    return [...groups.entries()]
        .sort(([yearA], [yearB]) => yearB - yearA)
        .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}
