/**
 * 将博客资源路径解析为带 BASE_URL 的完整路径
 * @param {string | undefined} path
 * @returns {string | undefined}
 */
export function resolveBlogAsset(path) {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const base = import.meta.env.BASE_URL;
    const stripped = path.replace(/^\//, '');
    const withoutBasePrefix = stripped.startsWith(base.replace(/^\//, ''))
        ? stripped.slice(base.replace(/^\//, '').length).replace(/^\//, '')
        : stripped;

    return `${base}${withoutBasePrefix}`.replace(/\/{2,}/g, '/');
}

/**
 * 根据正文字数估算阅读时间（分钟）
 * @param {string} content
 * @returns {number}
 */
export function estimateReadTime(content) {
    const words = content.replace(/\s+/g, '').length;
    return Math.max(1, Math.ceil(words / 400));
}
