import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './site-config.mjs';
import {
    BING_TITLE_SHORT_THRESHOLD,
    DESCRIPTION_MIN_CHARS,
    TITLE_MIN_CHARS,
    charLength,
    effectiveDescription,
    effectiveTitle,
    isPlaceholderDescription,
    withSiteName,
} from '../../src/blog/seo-text.js';

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
        const { file, fileSlug, data, content } = post;
        const draft = Boolean(data.draft);
        const title = String(data.title ?? '').trim();
        // 与页面渲染共用同一条规则：seoTitle 优先，缺失时才看 frontmatter title；
        // 长度按实际输出的 <title>（含「 · 墨韵」后缀）计算。
        const metaTitle = withSiteName(
            effectiveTitle({ title, seoTitle: data.seoTitle }),
            SITE.name
        );
        const rawDescription = String(data.description ?? '').trim();
        const description = effectiveDescription({
            description: data.seoDescription ?? rawDescription,
            body: content,
        });
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
        } else if (!draft && charLength(metaTitle) < TITLE_MIN_CHARS) {
            // Bing Webmaster 把 < 15 字符记为 too short；本站门禁取 20 留余量。
            findings.push({
                file,
                rule: 'title-short',
                severity: 'error',
                message: `effective title length ${charLength(metaTitle)} < ${TITLE_MIN_CHARS} (Bing flags < ${BING_TITLE_SHORT_THRESHOLD}); add seoTitle to frontmatter`,
            });
        } else if (charLength(metaTitle) > 60) {
            findings.push({
                file,
                rule: 'title-long',
                severity: 'warn',
                message: `title length ${charLength(metaTitle)} > 60`,
            });
        }

        if (!draft && !rawDescription) {
            findings.push({
                file,
                rule: 'desc-missing',
                severity: 'error',
                message: 'published post has empty description in frontmatter',
            });
        } else if (!draft && isPlaceholderDescription(rawDescription)) {
            findings.push({
                file,
                rule: 'desc-placeholder',
                severity: 'warn',
                message: `description "${rawDescription}" is a Notion placeholder; the build falls back to the post body excerpt`,
            });
        }
        if (!draft && charLength(description) < DESCRIPTION_MIN_CHARS) {
            findings.push({
                file,
                rule: 'desc-short',
                severity: 'warn',
                message: `effective description length ${charLength(description)} < ${DESCRIPTION_MIN_CHARS} (Bing flags too short); add seoDescription or more body text`,
            });
        }
        if (charLength(description) > 200) {
            findings.push({
                file,
                rule: 'desc-long',
                severity: 'warn',
                message: `description length ${charLength(description)} > 200`,
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
