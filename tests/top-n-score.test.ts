import { describe, expect, it } from 'vitest';
import {
    rankPosts,
    scorePost,
    TECH_KEYWORDS,
} from '../scripts/lib/top-n-score.mjs';

const TEST_DESCRIPTION = '测'.repeat(125);

function makePost(
    slug,
    overrides = {},
    content = '## Section one\n\nBody.\n\n## Section two\n\nMore body.'
) {
    return {
        file: `${slug}.md`,
        fileSlug: slug,
        filePath: `content/posts/${slug}.md`,
        data: {
            slug,
            title: 'JavaScript TypeScript guide',
            description: TEST_DESCRIPTION,
            publishedAt: '2024-06-01',
            categories: ['note'],
            tags: ['javascript', 'react', 'html'],
            draft: false,
            ...overrides,
        },
        content,
        raw: '',
    };
}

describe('scorePost', () => {
    it('scores keyword matches 0–3 from title', () => {
        const post = makePost('kw-test', {
            title: 'JavaScript React TypeScript AI RAG Node',
        });
        const { breakdown } = scorePost(post);
        expect(breakdown.keyword).toBe(3);
    });

    it('scores quality: long body, description range, non-hash slug', () => {
        const longBody = 'x'.repeat(7000);
        const post = makePost('quality-test', {}, longBody);
        const { breakdown } = scorePost(post);
        expect(breakdown.quality).toBe(4);
    });

    it('penalizes hash slug in quality score', () => {
        const post = makePost('abc12345', {
            slug: 'abc12345',
            title: 'hash slug post',
        });
        const { breakdown } = scorePost(post);
        expect(breakdown.quality).toBeLessThan(4);
    });

    it('scores hub: note category and ≥3 tags', () => {
        const post = makePost('hub-test');
        const { breakdown } = scorePost(post);
        expect(breakdown.hub).toBe(2);
    });

    it('total = keyword×2 + quality×2 + hub×1', () => {
        const post = makePost('total-test');
        const { score, breakdown } = scorePost(post);
        expect(score).toBe(
            breakdown.keyword * 2 + breakdown.quality * 2 + breakdown.hub
        );
    });
});

describe('rankPosts', () => {
    it('returns top N sorted by score then publishedAt', () => {
        const posts = [
            makePost('low', {
                title: 'daily note',
                publishedAt: '2024-01-01',
                tags: [],
                categories: ['daily'],
            }),
            makePost('high', {
                title: 'JavaScript React TypeScript',
                publishedAt: '2024-06-01',
            }),
        ];
        const ranked = rankPosts(posts, { limit: 15 });
        expect(ranked[0].post.data.slug).toBe('high');
        expect(ranked.length).toBeGreaterThanOrEqual(2);
    });
});

describe('TECH_KEYWORDS', () => {
    it('includes core stack keywords', () => {
        expect(TECH_KEYWORDS).toContain('javascript');
        expect(TECH_KEYWORDS).toContain('astro');
    });
});
