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
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

/** Ledger column date: MM.DD */
export function formatLedgerDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

/** Editorial eyebrow date: YYYY.MM.DD */
export function formatEditorialDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
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
