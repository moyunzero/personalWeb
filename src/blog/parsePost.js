import { parseFrontmatter } from './frontmatter';
import { estimateReadTime, resolveBlogAsset } from './utils';
import { validateCategoryIds } from './getCategories';

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeDate(value) {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    return String(value).trim();
}

/**
 * @param {string} fileSlug
 * @returns {string}
 */
function dateFromFileSlug(fileSlug) {
    const match = fileSlug.match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? '';
}

/**
 * @param {string} filePath
 * @param {string} raw
 */
export function parsePost(filePath, raw) {
    const { data, content } = parseFrontmatter(raw);
    const fileSlug = filePath
        .split('/')
        .pop()
        ?.replace(/\.md$/, '') ?? '';

    const slug = data.slug || fileSlug;
    const categories = Array.isArray(data.categories)
        ? data.categories
        : data.category
          ? [data.category]
          : [];

    validateCategoryIds(categories);

    const tags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

    const publishDate =
        normalizeDate(data.date || data.publishDate) || dateFromFileSlug(fileSlug);
    const draft = Boolean(data.draft);
    const featured = Boolean(data.featured);
    const body = content.trim();
    const description = String(data.description || '').trim();
    const seoTitle = String(data.seoTitle || '').trim();
    const seoDescription = String(data.seoDescription || '').trim();

    return {
        id: slug,
        title: data.title || slug,
        seoTitle: seoTitle || undefined,
        description,
        seoDescription: seoDescription || undefined,
        canonical: data.canonical ? String(data.canonical).trim() : undefined,
        keywords: Array.isArray(data.keywords)
            ? data.keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
            : undefined,
        ogImage: data.ogImage ? String(data.ogImage).trim() : undefined,
        noindex: data.noindex === undefined ? undefined : Boolean(data.noindex),
        author: data.author || '墨韵',
        publishDate,
        updateDate: data.updateDate,
        categories,
        tags,
        coverImage: data.cover?.trim()
            ? resolveBlogAsset(String(data.cover).trim())
            : undefined,
        gallery: Array.isArray(data.gallery)
            ? data.gallery.map((src) => resolveBlogAsset(src))
            : [],
        readTime: data.readTime ?? estimateReadTime(content),
        draft,
        featured,
        content: body,
    };
}
