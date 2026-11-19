import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * dist 级回归：Bing Webmaster 的「标题过短 / 描述过短」是按渲染后的 HTML 判定的，
 * 所以这里直接量测产物，而不是只看 frontmatter。
 *
 * 阈值与 `src/blog/seo-text.js` 保持一致：
 * - <title>：20–65 字符（含 ` · 墨韵`；Bing 阈值为 15，这里留 5 字符余量）
 * - meta description：100–200 字符
 */
const DIST = path.resolve(import.meta.dirname, '../dist');
const TITLE_MIN = 20;
const TITLE_MAX = 65;
const DESC_MIN = 100;
const DESC_MAX = 200;

const charLength = (value: string) => [...value].length;

async function collectHtml(dir: string, out: string[] = []): Promise<string[]> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await collectHtml(full, out);
        else if (entry.name.endsWith('.html')) out.push(full);
    }
    return out;
}

interface PageMeta {
    file: string;
    title: string;
    description: string;
}

/** 三个断言共用一次 dist 扫描，避免重复读 300+ 个 HTML 拖慢整个测试进程。 */
let cachedPages: Promise<PageMeta[]> | null = null;

function loadIndexablePages(): Promise<PageMeta[]> {
    cachedPages ??= scanIndexablePages();
    return cachedPages;
}

async function scanIndexablePages(): Promise<PageMeta[]> {
    const files = await collectHtml(DIST);
    const pages: PageMeta[] = [];

    for (const file of files) {
        const html = await readFile(file, 'utf8');
        // 站长验证文件与 noindex 页面不参与搜索结果，跳过
        if (/google-site-verification/i.test(html)) continue;
        if (/<meta name="robots" content="noindex/i.test(html)) continue;

        const title = (html.match(/<title>([\s\S]*?)<\/title>/i) ?? ['', ''])[1].trim();
        const description = (
            html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ?? ['', '']
        )[1];

        pages.push({ file: path.relative(DIST, file), title, description });
    }

    return pages;
}

describe('dist 级 SEO 长度（Bing 建议）', () => {
    it('每个可索引页面的标题都在 15–65 字符之间', async () => {
        const pages = await loadIndexablePages();
        expect(pages.length).toBeGreaterThan(0);

        const offenders = pages
            .filter((page) => {
                const length = charLength(page.title);
                return length < TITLE_MIN || length > TITLE_MAX;
            })
            .map((page) => `${page.file} (${charLength(page.title)}): ${page.title}`);

        expect(offenders, `标题长度越界：\n${offenders.join('\n')}`).toEqual([]);
    });

    it('每个可索引页面的 description 都在 100–200 字符之间', async () => {
        const pages = await loadIndexablePages();

        const offenders = pages
            .filter((page) => {
                const length = charLength(page.description);
                return length < DESC_MIN || length > DESC_MAX;
            })
            .map(
                (page) =>
                    `${page.file} (${charLength(page.description)}): ${page.description.slice(0, 40)}…`
            );

        expect(offenders, `description 长度越界：\n${offenders.join('\n')}`).toEqual([]);
    });

    it('标题互不重复（重复标题会被搜索引擎视为低质量）', async () => {
        const pages = await loadIndexablePages();
        const seen = new Map<string, string>();
        const duplicates: string[] = [];

        for (const page of pages) {
            const previous = seen.get(page.title);
            if (previous) duplicates.push(`${page.title} → ${previous} / ${page.file}`);
            else seen.set(page.title, page.file);
        }

        expect(duplicates, `重复标题：\n${duplicates.join('\n')}`).toEqual([]);
    });
});
