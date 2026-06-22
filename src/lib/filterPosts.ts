export interface PostSearchFields {
    title: string;
    description?: string;
    tags?: string[];
    categories?: string[];
}

export function filterPosts<T extends PostSearchFields>(
    posts: T[],
    {
        category = 'all',
        tag = '',
        query = '',
    }: { category?: string; tag?: string; query?: string } = {}
): T[] {
    let result = posts;

    if (category && category !== 'all') {
        result = result.filter((post) =>
            post.categories?.includes(category)
        );
    }

    if (tag) {
        const normalizedTag = tag.toLowerCase();
        result = result.filter((post) =>
            post.tags?.some((item) => item.toLowerCase() === normalizedTag)
        );
    }

    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery) {
        result = result.filter((post) => matchesPostQuery(post, trimmedQuery));
    }

    return result;
}

export function matchesPostQuery(
    post: PostSearchFields,
    query: string
): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    if (post.title.toLowerCase().includes(q)) return true;
    if (post.description?.toLowerCase().includes(q)) return true;
    if (post.tags?.some((item) => item.toLowerCase().includes(q))) return true;

    return false;
}

export function postSearchText(post: PostSearchFields): string {
    return [post.title, post.description ?? '', ...(post.tags ?? [])]
        .join(' ')
        .toLowerCase();
}
