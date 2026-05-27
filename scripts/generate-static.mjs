#!/usr/bin/env node
/**
 * 构建时生成 sitemap.xml 与 robots.txt → public/（Vite 会复制到 dist）
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './lib/site-config.mjs';
import { loadPostsForBuild } from './lib/load-posts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(root, 'public');

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function siteUrl(pathname = '') {
    const base = SITE.url.replace(/\/$/, '');
    const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${base}${suffix}`;
}

function toIsoDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date.toISOString().slice(0, 10);
}

function buildSitemap(posts) {
    const staticPages = [
        { loc: siteUrl('/'), changefreq: 'weekly', priority: '1.0' },
        { loc: siteUrl('/blog'), changefreq: 'daily', priority: '0.9' },
    ];

    const postEntries = posts.map((post) => {
        const lastmod = toIsoDate(post.updateDate || post.publishDate);
        let entry = `  <url>\n    <loc>${escapeXml(siteUrl(`/blog/${encodeURIComponent(post.id)}`))}</loc>`;
        if (lastmod) {
            entry += `\n    <lastmod>${lastmod}</lastmod>`;
        }
        entry += `\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
        return entry;
    });

    const urls = [
        ...staticPages.map(
            (page) =>
                `  <url>\n    <loc>${escapeXml(page.loc)}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
        ),
        ...postEntries,
    ].join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots() {
    return `User-agent: *
Allow: /

Sitemap: ${siteUrl('/sitemap.xml')}
`;
}

async function main() {
    const posts = await loadPostsForBuild();
    await mkdir(PUBLIC_DIR, { recursive: true });

    await writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemap(posts), 'utf8');
    await writeFile(path.join(PUBLIC_DIR, 'robots.txt'), buildRobots(), 'utf8');

    console.log(`[static] Wrote sitemap (${posts.length + 2} URLs) and robots.txt`);
}

main().catch((error) => {
    console.error('[static] Failed:', error);
    process.exit(1);
});
