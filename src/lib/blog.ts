import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<PostEntry[]> {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    return posts.sort(
        (a, b) =>
            new Date(b.data.publishedAt).getTime() -
            new Date(a.data.publishedAt).getTime()
    );
}

export function postHref(slug: string): string {
    return `/blog/${slug}/`;
}

export function formatPostDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    // Content dates are calendar dates; format in UTC so `YYYY-MM-DD` does not shift.
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

/** Ledger column date: MM.DD (UTC calendar components). */
export function formatLedgerDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getUTCMonth() + 1)}.${pad2(date.getUTCDate())}`;
}

/** Editorial eyebrow date: YYYY.MM.DD (UTC calendar components). */
export function formatEditorialDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getUTCFullYear()}.${pad2(date.getUTCMonth() + 1)}.${pad2(date.getUTCDate())}`;
}

export function buildBlogSearchPayload(fields: {
    title: string;
    description?: string;
    tags?: string[];
}): string {
    return JSON.stringify({
        title: fields.title,
        description: fields.description ?? '',
        tags: fields.tags ?? [],
    });
}
