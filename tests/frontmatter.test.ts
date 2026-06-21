import { describe, expect, it } from 'vitest';
import { parseFrontmatter, normalizeFrontmatterYaml } from '../src/blog/frontmatter.js';

describe('parseFrontmatter', () => {
    it('parses standard YAML with space after colon', () => {
        const raw = `---
title: Hello World
slug: hello-world
date: 2025-01-01
---
Body text here.`;

        const { data, content } = parseFrontmatter(raw);
        expect(data.title).toBe('Hello World');
        expect(data.slug).toBe('hello-world');
        expect(content.trim()).toBe('Body text here.');
    });

    it('parses Notion-style YAML without space after colon', () => {
        const yaml = normalizeFrontmatterYaml('description:中文摘要');
        expect(yaml).toBe('description: 中文摘要');

        const raw = `---
title: Notion Post
description:中文摘要
---
正文`;

        const { data } = parseFrontmatter(raw);
        expect(data.description).toBe('中文摘要');
    });

    it('returns empty data when frontmatter is missing', () => {
        const raw = 'Just markdown without frontmatter.';
        const { data, content } = parseFrontmatter(raw);
        expect(data).toEqual({});
        expect(content).toBe(raw);
    });
});
