import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../src/lib/markdown';

describe('renderMarkdown mermaid', () => {
    it('renders ```mermaid blocks as hydration hosts, not code fences', async () => {
        const md = '```mermaid\nflowchart LR\n  A --> B\n```';
        const html = await renderMarkdown(md);
        expect(html).toContain('mermaid-diagram-host');
        expect(html).toContain('data-mermaid=');
        expect(html).not.toContain('language-mermaid');
    });

    it('renders mermaid from MoCode phase 9 sample', async () => {
        const body = readFileSync('content/posts/2026-06-21-mocode-phase-9.md', 'utf8');
        const start = body.indexOf('```mermaid');
        const end = body.indexOf('```', start + 3) + 3;
        const html = await renderMarkdown(body.slice(start, end));
        expect(html).toContain('mermaid-diagram-host');
        expect(html).not.toMatch(/<code[^>]*language-mermaid/);
    });
});
