import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './site-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {Set<string> | null} */
let categoryIds = null;

async function getCategoryIds() {
    if (categoryIds) return categoryIds;
    const raw = await readFile(path.join(root, 'content/categories.json'), 'utf8');
    const list = JSON.parse(raw);
    categoryIds = new Set(list.map((c) => c.id));
    return categoryIds;
}

function isHashSlug(slug) {
    if (/^[a-f0-9]{8}$/i.test(slug)) return true;
    if (/-[a-f0-9]{8}$/i.test(slug)) return true;
    return false;
}

export { isHashSlug };

function normalizeDate(value) {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    return String(value).trim();
}

/**
 * @param {Awaited<ReturnType<import('./scan-posts.mjs').scanPosts>>} posts
 */
export async function runAuditRules(posts) {
    const knownCategories = await getCategoryIds();
    /** @type {Array<{ file: string, rule: string, severity: 'error' | 'warn', message: string }>} */
    const findings = [];

    if (!SITE.description?.trim()) {
        findings.push({
            file: 'site-config',
            rule: 'site-config',
            severity: 'error',
            message: 'SITE.description is empty',
        });
    }

    for (const post of posts) {
        const { file, fileSlug, data } = post;
        const draft = Boolean(data.draft);
        const title = String(data.title ?? '').trim();
        const description = String(data.description ?? '').trim();
        const slug = String(data.slug ?? fileSlug);
        const date = normalizeDate(data.date || data.publishDate);
        const categories = Array.isArray(data.categories)
            ? data.categories
            : data.category
              ? [data.category]
              : [];

        if (!title) {
            findings.push({
                file,
                rule: 'title-missing',
                severity: 'error',
                message: 'title is missing',
            });
        } else if (title.length > 60) {
            findings.push({
                file,
                rule: 'title-long',
                severity: 'warn',
                message: `title length ${title.length} > 60`,
            });
        }

        if (!draft && !description) {
            findings.push({
                file,
                rule: 'desc-missing',
                severity: 'error',
                message: 'published post has empty description in frontmatter',
            });
        } else if (!draft && description.length < 30) {
            findings.push({
                file,
                rule: 'desc-short',
                severity: 'warn',
                message: `description length ${description.length} < 30`,
            });
        }
        if (description.length > 200) {
            findings.push({
                file,
                rule: 'desc-long',
                severity: 'warn',
                message: `description length ${description.length} > 200`,
            });
        }

        if (!date) {
            findings.push({
                file,
                rule: 'date-missing',
                severity: 'error',
                message: 'date / publishDate missing',
            });
        }

        if (slug !== fileSlug) {
            findings.push({
                file,
                rule: 'slug-filename',
                severity: 'warn',
                message: `slug "${slug}" !== filename "${fileSlug}"`,
            });
        }

        if (isHashSlug(slug)) {
            findings.push({
                file,
                rule: 'slug-hash',
                severity: 'warn',
                message: `slug looks hash-like: ${slug}`,
            });
        }

        const unknown = categories.filter((id) => !knownCategories.has(id));
        if (unknown.length) {
            findings.push({
                file,
                rule: 'categories-invalid',
                severity: 'error',
                message: `unknown categories: ${unknown.join(', ')}`,
            });
        }
    }

    return findings;
}
