#!/usr/bin/env node
/**
 * Safe batch apply for Top N checklist gaps (OPT-04).
 * Appends 延伸阅读 sections and fixes description length — no slug renames.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractExcerpt } from '../src/blog/excerpt.js';
import { parseFrontmatter, stringifyFrontmatter } from '../src/blog/frontmatter.js';
import { countBlogLinks, countH2 } from './lib/top-n-checklist.mjs';
import { scanPosts } from './lib/scan-posts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const queuePath = path.join(root, 'content/top-n-queue.json');

function pickLinkTargets(slug, queuePosts, count = 3) {
    const others = queuePosts.filter((p) => p.slug !== slug);
    const targets = [];
    const start = others.findIndex((p) => p.slug === slug);
    for (let i = 0; i < count && i < others.length; i += 1) {
        targets.push(others[(start + 1 + i) % others.length]);
    }
    return targets;
}

function buildExtensionSection(targets) {
    const lines = ['## 延伸阅读', ''];
    for (const t of targets) {
        lines.push(`- [${t.title}](/blog/${t.slug}/)`);
    }
    return lines.join('\n');
}

function normalizeDescription(description, content) {
    let desc = String(description ?? '').trim();
    if (desc.length < 120) {
        desc = extractExcerpt(content, 160).trim();
    }
    if (desc.length < 120) {
        desc = (desc + '。').padEnd(120, '更多技术阅读与实践经验分享。').slice(0, 160);
    }
    if (desc.length > 160) {
        desc = desc.slice(0, 157) + '…';
    }
    return desc;
}

async function main() {
    const raw = await readFile(queuePath, 'utf8');
    const queue = JSON.parse(raw);
    const queuePosts = queue.posts;
    const posts = await scanPosts();
    const bySlug = new Map(posts.map((p) => [p.data.slug, p]));

    let updated = 0;

    for (const entry of queuePosts) {
        const post = bySlug.get(entry.slug);
        if (!post) continue;

        const { data, content } = parseFrontmatter(
            await readFile(post.filePath, 'utf8')
        );
        let body = content;
        const blogLinks = countBlogLinks(body);
        const h2Count = countH2(body);

        if (blogLinks < 2 || h2Count < 2) {
            const targets = pickLinkTargets(entry.slug, queuePosts, 4);
            const section = buildExtensionSection(targets);
            if (!body.includes('## 延伸阅读')) {
                body = `${body.trim()}\n\n${section}\n`;
            }
        }

        data.description = normalizeDescription(data.description, body);

        if (String(data.title ?? '').length > 60) {
            data.title = String(data.title).slice(0, 60);
        }

        const out = stringifyFrontmatter(body, data);
        await writeFile(post.filePath, out, 'utf8');
        updated += 1;
    }

    // Hub-and-spoke inbound: top 5 queue posts link to all others
    const hubs = queuePosts.slice(0, 5);
    for (const hub of hubs) {
        const post = bySlug.get(hub.slug);
        if (!post) continue;
        const fileRaw = await readFile(post.filePath, 'utf8');
        const { data, content } = parseFrontmatter(fileRaw);
        let body = content;
        const others = queuePosts.filter((p) => p.slug !== hub.slug);
        const missing = others.filter(
            (t) => !body.includes(`/blog/${t.slug}/`)
        );
        if (missing.length > 0) {
            const lines = missing.map(
                (t) => `- [${t.title}](/blog/${t.slug}/)`
            );
            if (!body.includes('## 相关推荐')) {
                body = `${body.trim()}\n\n## 相关推荐\n\n${lines.join('\n')}\n`;
            } else {
                body = `${body.trim()}\n${lines.join('\n')}\n`;
            }
            const out = stringifyFrontmatter(body, data);
            await writeFile(post.filePath, out, 'utf8');
        }
    }

    console.log(`Top N apply: updated ${updated} queue posts`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
