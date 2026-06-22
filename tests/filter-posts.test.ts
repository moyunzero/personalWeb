import { describe, expect, it } from 'vitest';
import {
    filterPosts,
    matchesPostQuery,
    postSearchText,
} from '../src/lib/filterPosts';

const posts = [
    {
        title: 'HTML基础',
        description: 'HTML 入门教程',
        tags: ['frontend'],
        categories: ['note'],
    },
    {
        title: 'Flex布局',
        description: '弹性盒模型',
        tags: ['css', 'frontend'],
        categories: ['note'],
    },
    {
        title: '周末咖啡',
        description: '生活随笔',
        tags: ['daily'],
        categories: ['daily'],
    },
];

describe('filterPosts', () => {
    it('filters by category', () => {
        expect(filterPosts(posts, { category: 'daily' })).toHaveLength(1);
    });

    it('filters by tag (exact match)', () => {
        expect(filterPosts(posts, { tag: 'css' })).toHaveLength(1);
    });

    it('filters by query in title, description, or tags', () => {
        expect(filterPosts(posts, { query: 'html' })).toHaveLength(1);
        expect(filterPosts(posts, { query: '弹性' })).toHaveLength(1);
        expect(filterPosts(posts, { query: 'frontend' })).toHaveLength(2);
    });

    it('returns all posts when filters are empty', () => {
        expect(filterPosts(posts)).toEqual(posts);
    });
});

describe('matchesPostQuery', () => {
    it('matches partial tag text', () => {
        expect(matchesPostQuery(posts[1], 'css')).toBe(true);
    });
});

describe('postSearchText', () => {
    it('lowercases combined searchable fields', () => {
        expect(postSearchText(posts[0])).toBe(
            'html基础 html 入门教程 frontend'
        );
    });
});
