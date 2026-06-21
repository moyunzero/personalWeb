import {
    getRelatedPosts,
    scoreRelatedPost,
} from '../blog/getRelatedPosts.js';
import type { PostEntry } from './blog';

export type RelatedPostShape = {
    id: string;
    categories: string[];
    tags: string[];
    publishDate: string;
    title: string;
    description?: string;
};

export function entryToRelatedShape(entry: PostEntry): RelatedPostShape {
    return {
        id: entry.data.slug,
        categories: entry.data.categories ?? [],
        tags: entry.data.tags ?? [],
        publishDate: entry.data.publishedAt,
        title: entry.data.title,
        description: entry.data.description,
    };
}

export function getRelatedForEntry(
    current: PostEntry,
    all: PostEntry[],
    limit = 3
) {
    const currentShape = entryToRelatedShape(current);
    const allShapes = all.map(entryToRelatedShape);
    return getRelatedPosts(currentShape, allShapes, { limit });
}

export { getRelatedPosts, scoreRelatedPost };
