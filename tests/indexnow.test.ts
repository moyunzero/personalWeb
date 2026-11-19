import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { SITE } from '../scripts/lib/site-config.mjs';
import {
    INDEXNOW_MAX_URLS,
    buildIndexNowPayload,
    buildKeyLocation,
    chunk,
    collectPageUrls,
    extractLocs,
    findKeyFile,
    isKeyFileValid,
    isValidIndexNowKey,
} from '../scripts/lib/indexnow.mjs';

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://moyunzero.github.io/personalWeb/</loc></url>
  <url><loc>https://moyunzero.github.io/personalWeb/blog/</loc></url>
  <url><loc>https://moyunzero.github.io/personalWeb/blog/2026-06-21-mocode-phase-9/</loc></url>
  <url><loc>https://moyunzero.github.io/personalWeb/sitemap-0.xml</loc></url>
  <url><loc>https://other.example.com/personalWeb/oops/</loc></url>
  <url><loc>https://moyunzero.github.io/blog/outside-base/</loc></url>
</urlset>`;

describe('indexnow / URL 收集', () => {
    it('extractLocs 解析并还原实体', () => {
        expect(extractLocs('<loc>https://a.test/x/?a=1&amp;b=2</loc>')).toEqual([
            'https://a.test/x/?a=1&b=2',
        ]);
        expect(extractLocs('')).toEqual([]);
    });

    it('只保留同 host、base 路径下的页面，跳过 sitemap 自身与站外链接', () => {
        const urls = collectPageUrls([SITEMAP_XML], {
            host: 'moyunzero.github.io',
            basePath: '/personalWeb',
        });
        expect(urls).toEqual([
            'https://moyunzero.github.io/personalWeb/',
            'https://moyunzero.github.io/personalWeb/blog/',
            'https://moyunzero.github.io/personalWeb/blog/2026-06-21-mocode-phase-9/',
        ]);
    });

    it('多份 sitemap 合并去重并保持顺序', () => {
        const urls = collectPageUrls([SITEMAP_XML, SITEMAP_XML], {
            host: 'moyunzero.github.io',
            basePath: '/personalWeb',
        });
        expect(urls).toHaveLength(3);
    });
});

describe('indexnow / payload', () => {
    it('chunk 按 10000 条切分', () => {
        const list = Array.from({ length: INDEXNOW_MAX_URLS + 3 }, (_, i) => i);
        const batches = chunk(list);
        expect(batches).toHaveLength(2);
        expect(batches[0]).toHaveLength(INDEXNOW_MAX_URLS);
        expect(batches[1]).toHaveLength(3);
        expect(chunk([])).toEqual([]);
    });

    it('buildIndexNowPayload 带上 keyLocation 与 host', () => {
        const payload = buildIndexNowPayload({
            urls: ['https://moyunzero.github.io/personalWeb/blog/'],
            key: 'abc123abc123',
            host: 'moyunzero.github.io',
            keyLocation: 'https://moyunzero.github.io/personalWeb/abc123abc123.txt',
        });
        expect(payload).toEqual({
            host: 'moyunzero.github.io',
            key: 'abc123abc123',
            keyLocation: 'https://moyunzero.github.io/personalWeb/abc123abc123.txt',
            urlList: ['https://moyunzero.github.io/personalWeb/blog/'],
        });
    });

    it('buildKeyLocation 落在站点 base 路径下', () => {
        expect(buildKeyLocation('https://moyunzero.github.io/personalWeb/', 'k'.repeat(8))).toBe(
            `https://moyunzero.github.io/personalWeb/${'k'.repeat(8)}.txt`
        );
    });
});

describe('indexnow / 密钥文件', () => {
    it('校验 key 格式', () => {
        expect(isValidIndexNowKey('38b28dfd0832d1c55cec024f8ea1739e')).toBe(true);
        expect(isValidIndexNowKey('short')).toBe(false);
        expect(isValidIndexNowKey('bad key with spaces')).toBe(false);
    });

    it('key 文件内容必须与文件名一致', () => {
        const key = '38b28dfd0832d1c55cec024f8ea1739e';
        expect(
            findKeyFile([
                { name: 'robots.txt', content: 'User-agent: *' },
                { name: `${key}.txt`, content: `${key}\n` },
            ])
        ).toEqual({ key, fileName: `${key}.txt` });
        expect(findKeyFile([{ name: 'other.txt', content: key }])).toBe(null);
    });

    it('线上内容比较忽略首尾空白', () => {
        expect(isKeyFileValid('abc123abc123\n', 'abc123abc123')).toBe(true);
        expect(isKeyFileValid('abc123abc123', 'abc123abc124')).toBe(false);
    });

    it('仓库 public/ 里已提交合规的密钥文件', async () => {
        const entries = (await readdir(path.join(root, 'public'))).filter((f) =>
            f.toLowerCase().endsWith('.txt')
        );
        const files = [];
        for (const name of entries) {
            files.push({
                name,
                content: await readFile(path.join(root, 'public', name), 'utf8'),
            });
        }
        const found = findKeyFile(files);
        expect(found).not.toBe(null);
        expect(found?.fileName).toBe(`${found?.key}.txt`);
    });
});

describe('indexnow / CLI', () => {
    const sitemap = path.join(root, 'dist/sitemap-0.xml');

    it('package.json registers seo:indexnow', async () => {
        const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
        expect(pkg.scripts['seo:indexnow']).toContain('seo-indexnow-submit');
    });

    it('部署工作流在发布后提交 IndexNow', async () => {
        const workflow = await readFile(
            path.join(root, '.github/workflows/deploy.yml'),
            'utf8'
        );
        expect(workflow).toContain('seo-indexnow-submit.mjs');
        expect(workflow).toMatch(/Submit IndexNow/);
    });

    it('--dry-run 输出可提交的 payload 且不发请求', async () => {
        if (!existsSync(sitemap)) {
            throw new Error('Missing dist/sitemap-0.xml. Run yarn build first.');
        }
        const { stdout } = await execFileAsync(
            process.execPath,
            ['scripts/seo-indexnow-submit.mjs', '--dry-run'],
            { cwd: root }
        );
        expect(stdout).toContain('IndexNow 目标站点');
        expect(stdout).toContain('[dry-run] 请求体');
        const payloadText = stdout.slice(stdout.indexOf('[dry-run] 请求体'));
        const payload = JSON.parse(payloadText.slice(payloadText.indexOf('{')));
        const host = new URL(SITE.url).host;
        expect(payload.host).toBe(host);
        expect(payload.keyLocation.startsWith(`${SITE.url}/`)).toBe(true);
        expect(payload.keyLocation.endsWith('.txt')).toBe(true);
        expect(payload.urlList.length).toBeGreaterThan(0);
        expect(payload.urlList.every((url) => url.startsWith(`${SITE.url}/`))).toBe(true);
    });
});
