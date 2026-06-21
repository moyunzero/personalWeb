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
