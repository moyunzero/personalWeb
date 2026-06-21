import { describe, expect, it } from 'vitest';
import {
    validatePostData,
    enableStrictPublishedDescription,
    disableStrictPublishedDescription,
} from '../scripts/lib/post-schema.mjs';
import { extractExcerpt } from '../src/blog/excerpt.js';

describe('post-schema', () => {
    it('accepts published post with non-empty description', () => {
        const result = validatePostData({
            slug: '2024-01-01-test',
            title: 'Test',
            description: 'A valid description for the post.',
            publishedAt: '2024-01-01',
            draft: false,
        });
        expect(result.success).toBe(true);
    });

    it('accepts draft with empty description when not strict', () => {
        const result = validatePostData({
            slug: 'draft-post',
            title: 'Draft',
            description: '',
            publishedAt: '2024-01-01',
            draft: true,
        });
        expect(result.success).toBe(true);
    });

    describe('strict', () => {
        it('rejects published post with empty description when strict', () => {
            enableStrictPublishedDescription();
            const result = validatePostData({
                slug: '2024-01-01-test',
                title: 'Test',
                description: '',
                publishedAt: '2024-01-01',
                draft: false,
            });
            disableStrictPublishedDescription();
            expect(result.success).toBe(false);
        });

        it('still accepts draft with empty description when strict', () => {
            enableStrictPublishedDescription();
            const result = validatePostData({
                slug: 'draft-post',
                title: 'Draft',
                description: '',
                publishedAt: '2024-01-01',
                draft: true,
            });
            disableStrictPublishedDescription();
            expect(result.success).toBe(true);
        });
    });

    describe('blog:new', () => {
        it('template stub description validates as draft', () => {
            const title = '新文章标题';
            const body = `# ${title}\n\n在这里开始写作…`;
            const description = extractExcerpt(body, 120);
            const result = validatePostData({
                slug: '2024-01-01-test',
                title,
                description,
                publishedAt: '2024-01-01',
                draft: true,
            });
            expect(description.length).toBeGreaterThan(0);
            expect(result.success).toBe(true);
        });
    });

    describe('notion', () => {
        it('typical sync frontmatter validates', () => {
            const result = validatePostData({
                slug: '2024-01-01-notion',
                title: 'From Notion',
                description: 'Excerpt filled from body when Notion description empty.',
                publishedAt: '2024-01-01',
                categories: ['note'],
                tags: [],
                draft: false,
            });
            expect(result.success).toBe(true);
        });
    });
});
