import { describe, expect, it } from 'vitest';
import { runAuditRules } from '../scripts/lib/meta-rules.mjs';

describe('seo-audit', () => {
    it('errors on published empty description', async () => {
        const findings = await runAuditRules([
            {
                file: 'empty.md',
                fileSlug: 'empty',
                data: { title: 'T', draft: false, description: '', date: '2024-01-01' },
                content: 'body',
                raw: '',
                filePath: '/tmp/empty.md',
            },
        ]);
        expect(findings.some((f) => f.rule === 'desc-missing' && f.severity === 'error')).toBe(
            true
        );
    });

    it('draft empty description is not desc-missing error', async () => {
        const findings = await runAuditRules([
            {
                file: 'draft.md',
                fileSlug: 'draft',
                data: { title: 'T', draft: true, description: '', date: '2024-01-01' },
                content: 'body',
                raw: '',
                filePath: '/tmp/draft.md',
            },
        ]);
        expect(findings.some((f) => f.rule === 'desc-missing')).toBe(false);
    });

    it('title missing is error', async () => {
        const findings = await runAuditRules([
            {
                file: 'no-title.md',
                fileSlug: 'no-title',
                data: { draft: false, description: 'desc', date: '2024-01-01' },
                content: 'body',
                raw: '',
                filePath: '/tmp/no-title.md',
            },
        ]);
        expect(findings.some((f) => f.rule === 'title-missing' && f.severity === 'error')).toBe(
            true
        );
    });

    it('title long is warn only', async () => {
        const longTitle = 'A'.repeat(61);
        const findings = await runAuditRules([
            {
                file: 'long.md',
                fileSlug: 'long',
                data: {
                    title: longTitle,
                    draft: false,
                    description: 'Valid description here.',
                    date: '2024-01-01',
                },
                content: 'body',
                raw: '',
                filePath: '/tmp/long.md',
            },
        ]);
        expect(findings.some((f) => f.rule === 'title-long' && f.severity === 'warn')).toBe(true);
        expect(findings.some((f) => f.severity === 'error')).toBe(false);
    });
});
