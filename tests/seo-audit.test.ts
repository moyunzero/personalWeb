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

describe('seo-audit — Bing 长度建议', () => {
    const body = '正文 '.repeat(80);

    function findingsFor(data: Record<string, unknown>) {
        return runAuditRules([
            {
                file: 'case.md',
                fileSlug: 'case',
                data: { draft: false, date: '2024-01-01', ...data },
                content: body,
                raw: '',
                filePath: '/tmp/case.md',
            },
        ]);
    }

    it('标题（含站点后缀）仍少于 20 字符是 error', async () => {
        const findings = await findingsFor({ title: 'Node', description: '' });
        expect(findings.some((f) => f.rule === 'title-short' && f.severity === 'error')).toBe(true);
    });

    it('seoTitle 补足长度后不再报 title-short', async () => {
        const findings = await findingsFor({
            title: 'Node',
            seoTitle: 'Node.js 入门：异步 I/O、模块系统与错误处理',
            description: '',
        });
        expect(findings.some((f) => f.rule === 'title-short')).toBe(false);
    });

    it('站点名后缀计入标题长度（15 字标题 + 「 · 墨韵」= 20 字不算过短）', async () => {
        const findings = await findingsFor({ title: 'JavaScript 基础入门', description: '' });
        expect(findings.some((f) => f.rule === 'title-short')).toBe(false);
    });

    it('占位描述给出 desc-placeholder 警示', async () => {
        const findings = await findingsFor({ title: '一条足够长的正常文章标题示例', description: 'workBuddy-3' });
        expect(
            findings.some((f) => f.rule === 'desc-placeholder' && f.severity === 'warn')
        ).toBe(true);
    });

    it('占位描述不再触发旧的 desc-short（正文摘要已兜底）', async () => {
        const findings = await findingsFor({ title: '一条足够长的正常文章标题示例', description: 'AgentGuide-2' });
        expect(findings.some((f) => f.rule === 'desc-short')).toBe(false);
    });

    it('正文也过短时仍报 desc-short', async () => {
        const findings = await runAuditRules([
            {
                file: 'thin.md',
                fileSlug: 'thin',
                data: {
                    title: '一条足够长的正常文章标题示例',
                    draft: false,
                    description: '短',
                    date: '2024-01-01',
                },
                content: '短正文。',
                raw: '',
                filePath: '/tmp/thin.md',
            },
        ]);
        expect(findings.some((f) => f.rule === 'desc-short' && f.severity === 'warn')).toBe(true);
    });
});
