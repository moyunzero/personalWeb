import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

export function getEnv(name, required = false) {
    const value = process.env[name]?.trim();
    if (required && !value) {
        throw new Error(`缺少环境变量 ${name}，请在 .env.local 中配置`);
    }
    return value || '';
}

export function parsePublishedStatuses() {
    const raw = getEnv('NOTION_STATUS_PUBLISHED') || 'Published,已发布';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function isPublishedStatus(statusName, publishedList) {
    if (!statusName) return true;
    return publishedList.some(
        (p) => p.toLowerCase() === statusName.toLowerCase()
    );
}

export function sanitizeSlug(slug) {
    return String(slug)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

/**
 * 从标题提取 ASCII slug 片段（中文标题会返回空字符串）
 */
export function slugifyAscii(title) {
    return title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

export function notionIdSuffix(notionId) {
    return notionId.replace(/-/g, '').slice(0, 8);
}

/**
 * 生成文章 slug：优先已有/Notion 字段，否则 date + 英文标题或 date + notionId
 */
export function buildPostSlug({ title, date, notionId, slugFromProp, existingSlug }) {
    if (slugFromProp) return sanitizeSlug(slugFromProp);
    if (existingSlug) return sanitizeSlug(existingSlug);

    const d = date || new Date().toISOString().slice(0, 10);
    const ascii = slugifyAscii(title);
    const suffix = notionIdSuffix(notionId);

    if (ascii.length >= 3) {
        return sanitizeSlug(`${d}-${ascii}`);
    }

    return sanitizeSlug(`${d}-${suffix}`);
}

/** @deprecated 使用 buildPostSlug */
export function slugify(title) {
    const date = new Date().toISOString().slice(0, 10);
    const ascii = slugifyAscii(title);
    return sanitizeSlug(`${date}-${ascii || 'post'}`);
}

/**
 * 同批次/已有文件中保证 slug 唯一
 */
export function ensureUniqueSlug(slug, usedSlugs, notionId) {
    if (!usedSlugs.has(slug)) {
        usedSlugs.add(slug);
        return slug;
    }

    const suffix = notionIdSuffix(notionId);
    let candidate = sanitizeSlug(`${slug}-${suffix}`);
    if (!usedSlugs.has(candidate)) {
        usedSlugs.add(candidate);
        return candidate;
    }

    let n = 2;
    while (usedSlugs.has(`${candidate}-${n}`)) n += 1;
    candidate = sanitizeSlug(`${candidate}-${n}`);
    usedSlugs.add(candidate);
    return candidate;
}

export async function buildSlugRegistry() {
    const notionIdIndex = await buildNotionIdIndex();
    const usedSlugs = new Set();

    for (const entry of notionIdIndex.values()) {
        if (entry.slug) usedSlugs.add(entry.slug);
    }

    return { notionIdIndex, usedSlugs };
}

export function getTitle(prop) {
    if (!prop || prop.type !== 'title') return '';
    return prop.title.map((t) => t.plain_text).join('');
}

export function getRichText(prop) {
    if (!prop || prop.type !== 'rich_text') return '';
    return prop.rich_text.map((t) => t.plain_text).join('');
}

export function getMultiSelect(prop) {
    if (!prop || prop.type !== 'multi_select') return [];
    return prop.multi_select.map((o) => o.name);
}

export function getSelect(prop) {
    if (!prop || prop.type !== 'select') return null;
    return prop.select?.name ?? null;
}

export function getDate(prop) {
    if (!prop || prop.type !== 'date') return null;
    return prop.date?.start?.slice(0, 10) ?? null;
}

export function getCoverUrl(prop) {
    if (!prop || prop.type !== 'files') return null;
    const file = prop.files[0];
    if (!file) return null;
    return file.type === 'external' ? file.external.url : file.file?.url;
}

export async function loadCategoryIndex() {
    const filePath = path.join(root, 'content/categories.json');
    const list = JSON.parse(await readFile(filePath, 'utf8'));
    const ids = new Set(list.map((c) => c.id));
    const labelToId = Object.fromEntries(list.map((c) => [c.label, c.id]));
    return { list, ids, labelToId };
}

export function normalizeCategories(names, { ids, labelToId }) {
    const result = [];
    const warnings = [];

    for (const name of names) {
        const trimmed = name.trim();
        if (!trimmed) continue;

        let id = trimmed;
        if (ids.has(trimmed)) {
            id = trimmed;
        } else if (labelToId[trimmed]) {
            id = labelToId[trimmed];
        } else {
            const guess = trimmed.toLowerCase().replace(/\s+/g, '-');
            if (ids.has(guess)) {
                id = guess;
            } else {
                warnings.push(`未知分类「${trimmed}」，已写入 slug「${guess}」`);
                id = guess;
            }
        }
        if (!result.includes(id)) result.push(id);
    }

    return { categories: result.length ? result : ['note'], warnings };
}

export async function buildNotionIdIndex() {
    const postsDir = path.join(root, 'content/posts');
    const { readdir, readFile: rf } = await import('node:fs/promises');
    const index = new Map();

    let files = [];
    try {
        files = (await readdir(postsDir)).filter((f) => f.endsWith('.md'));
    } catch {
        return index;
    }

    for (const file of files) {
        const raw = await rf(path.join(postsDir, file), 'utf8');
        const { data } = parseFrontmatter(raw);
        if (data.notionId) {
            index.set(data.notionId, {
                slug: data.slug || file.replace(/\.md$/, ''),
                filePath: path.join(postsDir, file),
                notionSyncedAt: data.notionSyncedAt
                    ? String(data.notionSyncedAt)
                    : undefined,
            });
        }
    }

    return index;
}

export function hashUrl(url) {
    return createHash('md5').update(url).digest('hex').slice(0, 10);
}

export function extFromUrl(url, contentType) {
    if (contentType?.includes('png')) return '.png';
    if (contentType?.includes('gif')) return '.gif';
    if (contentType?.includes('webp')) return '.webp';
    if (contentType?.includes('svg')) return '.svg';
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) {
        const ext = `.${match[1].toLowerCase()}`;
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            return ext === '.jpeg' ? '.jpg' : ext;
        }
    }
    return '.jpg';
}
