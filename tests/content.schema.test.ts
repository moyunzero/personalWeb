import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseFrontmatter } from '../src/blog/frontmatter.js';
import { parsePost } from '../src/blog/parsePost.js';

const postSchema = z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string().optional(),
    publishedAt: z.string(),
    updatedAt: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    draft: z.boolean().default(false),
    author: z.string().default('墨韵'),
    readTime: z.number().optional(),
});

function mapParsePost(filepath: string, raw: string) {
    const parsed = parsePost(filepath, raw);
    return {
        slug: parsed.id,
        title: parsed.title,
        description: parsed.description,
        publishedAt: parsed.publishDate,
        updatedAt: parsed.updateDate ? String(parsed.updateDate) : undefined,
        categories: parsed.categories,
        tags: parsed.tags,
        coverImage: parsed.coverImage,
        draft: parsed.draft,
        author: parsed.author,
        readTime: parsed.readTime,
    };
}

describe('posts collection schema', () => {
    const validFixture = `---
title: Test Post
slug: test-post
date: 2026-01-15
categories:
  - note
tags:
  - astro
draft: false
---

Hello world.
`;

    it('valid fixture passes schema', () => {
        const data = mapParsePost('content/posts/test-post.md', validFixture);
        expect(postSchema.parse(data)).toMatchObject({
            slug: 'test-post',
            title: 'Test Post',
            publishedAt: '2026-01-15',
        });
    });

    it('missing title fails Zod validation', () => {
        expect(() =>
            postSchema.parse({
                slug: 'no-title',
                publishedAt: '2026-01-15',
            })
        ).toThrow();
    });

    it('assigns slug from frontmatter or file stem', () => {
        const fromFm = mapParsePost('content/posts/ignored.md', validFixture);
        expect(fromFm.slug).toBe('test-post');

        const fromStem = mapParsePost(
            'content/posts/2026-02-01-stem-slug.md',
            `---
title: Stem Slug
date: 2026-02-01
---

Body.
`
        );
        expect(fromStem.slug).toBe('2026-02-01-stem-slug');
    });

    it('parses Notion-style YAML without space after colon', () => {
        const raw = `---
title: Notion Style
description:中文简介无空格
date: 2026-03-01
---

Content.
`;
        const { data } = parseFrontmatter(raw);
        expect(data.description).toBe('中文简介无空格');
    });

    it('identifies draft entries', () => {
        const data = mapParsePost(
            'content/posts/draft-post.md',
            `---
title: Draft
slug: draft-post
date: 2026-01-01
draft: true
---

Secret.
`
        );
        expect(data.draft).toBe(true);
    });
});
