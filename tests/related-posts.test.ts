import { describe, expect, it } from 'vitest';
import {
    entryToRelatedShape,
    getRelatedForEntry,
    scoreRelatedPost,
} from '../src/lib/related';
import type { PostEntry } from '../src/lib/blog';

function makeEntry(
    slug: string,
    overrides: Partial<PostEntry['data']> = {}
): PostEntry {
    return {
        id: slug,
        collection: 'posts',
        data: {
            slug,
            title: `Title ${slug}`,
            description: 'A description for testing related posts.',
            publishedAt: '2024-01-01',
            categories: ['note'],
            tags: ['javascript'],
            draft: false,
            author: '墨韵',
            ...overrides,
        },
        body: '',
    } as PostEntry;
}

describe('entryToRelatedShape', () => {
    it('maps slug to id and publishedAt to publishDate', () => {
        const entry = makeEntry('test-slug', {
            categories: ['reading'],
            tags: ['react', 'typescript'],
        });
        const shape = entryToRelatedShape(entry);
        expect(shape.id).toBe('test-slug');
        expect(shape.publishDate).toBe('2024-01-01');
        expect(shape.categories).toEqual(['reading']);
        expect(shape.tags).toEqual(['react', 'typescript']);
    });
});

describe('scoreRelatedPost', () => {
    it('uses category×2 + tag×3 weights', () => {
        const current = entryToRelatedShape(
            makeEntry('a', { categories: ['note'], tags: ['react'] })
        );
        const candidate = entryToRelatedShape(
            makeEntry('b', { categories: ['note'], tags: ['react'] })
        );
        expect(scoreRelatedPost(current, candidate)).toBe(2 + 3);
    });
});

describe('getRelatedForEntry', () => {
    it('returns 相关文章 when tag overlap score ≥ 3', () => {
        const current = makeEntry('current', { tags: ['javascript', 'html'] });
        const related = makeEntry('related', {
            slug: 'related',
            tags: ['javascript', 'css'],
            publishedAt: '2024-06-01',
        });
        const other = makeEntry('other', {
            slug: 'other',
            tags: ['python'],
            publishedAt: '2024-07-01',
        });
        const result = getRelatedForEntry(current, [current, related, other], 3);
        expect(result.heading).toBe('相关文章');
        expect(result.isRelated).toBe(true);
        expect(result.posts[0].id).toBe('related');
    });

    it('falls back to 更多文章 with 3 recent posts when no overlap', () => {
        const current = makeEntry('current', { tags: ['unique-tag-a'] });
        const p1 = makeEntry('p1', {
            slug: 'p1',
            tags: ['x'],
            publishedAt: '2024-03-01',
        });
        const p2 = makeEntry('p2', {
            slug: 'p2',
            tags: ['y'],
            publishedAt: '2024-02-01',
        });
        const p3 = makeEntry('p3', {
            slug: 'p3',
            tags: ['z'],
            publishedAt: '2024-01-01',
        });
        const result = getRelatedForEntry(
            current,
            [current, p1, p2, p3],
            3
        );
        expect(result.heading).toBe('更多文章');
        expect(result.isRelated).toBe(false);
        expect(result.posts.length).toBe(3);
        expect(result.posts[0].id).toBe('p1');
    });
});
