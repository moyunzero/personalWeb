import { describe, expect, it } from 'vitest';
import { checkPost, runChecklist } from '../scripts/lib/top-n-checklist.mjs';

const TEST_DESCRIPTION = '测'.repeat(125);

function makePost(slug, data = {}, content = '## One\n\nA.\n\n## Two\n\nB.') {
    return {
        file: `${slug}.md`,
        data: {
            slug,
            title: 'JavaScript 入门指南',
            description: TEST_DESCRIPTION,
            ...data,
        },
        content,
    };
}

describe('checkPost', () => {
    it('passes fixture with title, description, H2, and blog links', () => {
        const body =
            '## Intro\n\nSee [html](/blog/2023-03-12-html/) and [ts](/blog/2023-04-20-typescript/).\n\n## More\n\nEnd.';
        const post = makePost('good', {}, body);
        const findings = checkPost(post, new Set(['good']), [post]);
        expect(findings.filter((f) => f.severity === 'error')).toHaveLength(0);
    });

    it('warns when description out of range', () => {
        const post = makePost('short-desc', {
            description: 'too short',
        });
        const findings = checkPost(post, new Set(['short-desc']), [post]);
        expect(findings.some((f) => f.rule === 'description-length')).toBe(true);
    });

    it('warns when fewer than 2 H2 headings', () => {
        const post = makePost('one-h2', {}, '## Only one\n\nBody.');
        const findings = checkPost(post, new Set(['one-h2']), [post]);
        expect(findings.some((f) => f.rule === 'headings-h2')).toBe(true);
    });

    it('only checks queued slugs via runChecklist scope', () => {
        const queued = makePost('queued');
        const other = makePost('other', { description: 'x' });
        const findings = checkPost(queued, new Set(['queued']), [queued, other]);
        expect(findings.every((f) => f.slug === 'queued')).toBe(true);
    });
});
