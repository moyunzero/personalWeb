/**
 * 将表单数据序列化为带 frontmatter 的 Markdown 字符串
 * @param {object} data
 * @returns {string}
 */
export function buildMarkdownFile(data) {
    const categories = Array.isArray(data.categories)
        ? data.categories
        : [];
    const tags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

    const lines = [
        '---',
        `title: ${yamlString(data.title)}`,
        `slug: ${yamlString(data.slug)}`,
        `description: ${yamlString(data.description)}`,
        `author: ${yamlString(data.author || '墨韵')}`,
        `date: ${data.publishDate || data.date || ''}`,
        'categories:',
        ...categories.map((c) => `  - ${c}`),
        'tags:',
        ...tags.map((t) => `  - ${yamlString(t)}`),
    ];

    if (data.cover) {
        lines.push(`cover: ${yamlString(data.cover)}`);
    }
    if (data.readTime) {
        lines.push(`readTime: ${Number(data.readTime)}`);
    }
    lines.push('draft: false', '---', '', data.content || '');

    return lines.join('\n');
}

function yamlString(value) {
    const str = String(value ?? '');
    if (str.includes(':') || str.includes('#') || str.includes('\n')) {
        return JSON.stringify(str);
    }
    return str;
}

/**
 * @param {string} slug
 */
export function getRecommendedImageDir(slug) {
    return `public/images/blog/${slug}/`;
}

/**
 * @param {string} slug
 * @param {string} [filename]
 */
export function getRecommendedCoverPath(slug, filename = 'cover.jpg') {
    return `images/blog/${slug}/${filename}`;
}
