import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPosts } from './scan-posts.mjs';
import { countKeywordMatches } from './top-n-score.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const queuePath = path.join(root, 'content/top-n-queue.json');

export function countH2(body) {
    return (body.match(/^##\s+/gm) ?? []).length;
}

export function countBlogLinks(body) {
    const matches = body.match(/\]\([^)]*\/blog\/[a-z0-9-]+\/?\)/gi) ?? [];
    return matches.length;
}

function countInboundLinks(slug, allPosts) {
    const pattern = new RegExp(`/blog/${slug}/?`, 'i');
    let count = 0;
    for (const post of allPosts) {
        if (post.data.slug === slug) continue;
        if (pattern.test(post.content)) count += 1;
    }
    return count;
}

/**
 * @param {Awaited<ReturnType<import('./scan-posts.mjs').scanPosts>>[number]} post
 */
export function checkPost(post, queueSlugs, allPosts) {
    const findings = [];
    const slug = String(post.data.slug ?? '');
    const title = String(post.data.title ?? '');
    const description = String(post.data.description ?? '');
    const body = String(post.content ?? '');

    if (title.length > 60) {
        findings.push({
            slug,
            rule: 'title-long',
            severity: 'warn',
            message: `title length ${title.length} > 60`,
        });
    }
    if (countKeywordMatches(title) === 0) {
        findings.push({
            slug,
            rule: 'title-keyword',
            severity: 'warn',
            message: 'title missing TECH_KEYWORD',
        });
    }
    if (description.length < 120 || description.length > 160) {
        findings.push({
            slug,
            rule: 'description-length',
            severity: 'warn',
            message: `description length ${description.length} not in 120–160`,
        });
    }
    if (countH2(body) < 2) {
        findings.push({
            slug,
            rule: 'headings-h2',
            severity: 'warn',
            message: `fewer than 2 ## headings (${countH2(body)})`,
        });
    }
    if (countBlogLinks(body) < 2) {
        findings.push({
            slug,
            rule: 'outbound-links',
            severity: 'warn',
            message: `fewer than 2 /blog/ markdown links (${countBlogLinks(body)})`,
        });
    }
    if (post.data.coverImage && !title.trim()) {
        findings.push({
            slug,
            rule: 'cover-alt',
            severity: 'error',
            message: 'coverImage set but title empty for alt fallback',
        });
    }

    const inbound = countInboundLinks(
        slug,
        allPosts.filter((p) => queueSlugs.has(p.data.slug))
    );
    if (inbound < 3) {
        findings.push({
            slug,
            rule: 'inbound-links',
            severity: 'info',
            message: `manual-review: inbound links from queue ${inbound} < 3`,
        });
    }

    return findings;
}

export async function runChecklist(queueFile = queuePath) {
    const raw = await readFile(queueFile, 'utf8');
    const queue = JSON.parse(raw);
    const queueSlugs = new Set(queue.posts.map((p) => p.slug));
    const posts = await scanPosts();
    const bySlug = new Map(posts.map((p) => [p.data.slug, p]));

    /** @type {Array<{ slug: string, rule: string, severity: string, message: string }>} */
    const findings = [];

    for (const slug of queueSlugs) {
        const post = bySlug.get(slug);
        if (!post) {
            findings.push({
                slug,
                rule: 'missing-post',
                severity: 'error',
                message: 'queued slug not found in corpus',
            });
            continue;
        }
        findings.push(...checkPost(post, queueSlugs, posts));
    }

    return findings;
}
