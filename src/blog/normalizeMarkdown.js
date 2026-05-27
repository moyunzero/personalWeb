import { resolveBlogAsset } from './utils';

/**
 * 整理从 Notion 等来源粘贴的 Markdown，避免预览/渲染异常
 */

const FENCE_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;

/**
 * Notion callout → GFM 引用块
 * @param {string} markdown
 */
function convertAsideToBlockquote(markdown) {
    return markdown.replace(/<aside>\s*([\s\S]*?)\s*<\/aside>/gi, (_, body) => {
        const lines = body.trim().split('\n');
        return lines.map((line) => `> ${line}`).join('\n');
    });
}

/**
 * 将正文中的内联 HTML 标签名用反引号包裹，避免 rehype-raw 误解析
 * @param {string} segment
 */
function escapeInlineHtmlTags(segment) {
    return segment.replace(
        /(?<!`)(<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+[^>`\n]*)?\/?>)(?!`)/g,
        '`$1`'
    );
}

/**
 * 统一空白字符（Notion 常带 NBSP / 特殊空格）
 * @param {string} text
 */
function normalizeUnicodeSpaces(text) {
    return text
        .replace(/\u00a0/g, ' ')
        .replace(/\u200b/g, '')
        .replace(/\u202f/g, ' ')
        .replace(/\u3000/g, ' ');
}

/**
 * 处理代码块以外的段落
 * @param {string} markdown
 */
function escapeHtmlTagsOutsideFences(markdown) {
    const parts = markdown.split(FENCE_RE);
    return parts
        .map((part, index) => {
            const isFence = index % 2 === 1;
            if (isFence) return part;
            return escapeInlineHtmlTags(part);
        })
        .join('');
}

/**
 * Notion 导出常带多余空行，合并为 Markdown 标准段落间距
 * @param {string} markdown
 */
function collapseExtraBlankLines(markdown) {
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 将正文中的本地图片路径加上 Vite BASE_URL（GitHub Pages 子路径）
 * @param {string} markdown
 */
function rewriteLocalImagePaths(markdown) {
    let result = markdown.replace(
        /!\[([^\]]*)\]\(([^)\s]+)\)/g,
        (full, alt, url) => {
            if (/^https?:\/\//i.test(url)) return full;
            const resolved = resolveBlogAsset(decodeURIComponent(url));
            return resolved ? `![${alt}](${resolved})` : full;
        }
    );

    result = result.replace(
        /(<img[^>]*\ssrc=["'])([^"']+)(["'])/gi,
        (full, prefix, url, suffix) => {
            if (/^https?:\/\//i.test(url)) return full;
            const resolved = resolveBlogAsset(decodeURIComponent(url));
            return resolved ? `${prefix}${resolved}${suffix}` : full;
        }
    );

    return result;
}

/**
 * @param {string} markdown
 * @returns {string}
 */
export function normalizeMarkdown(markdown) {
    if (!markdown) return '';

    let result = normalizeUnicodeSpaces(markdown);
    result = convertAsideToBlockquote(result);
    result = escapeHtmlTagsOutsideFences(result);
    result = rewriteLocalImagePaths(result);
    result = collapseExtraBlankLines(result);
    return result;
}

/**
 * 检测 Notion 外链图片（易过期，建议下载到本地）
 * @param {string} markdown
 * @returns {string[]}
 */
export function findNotionHostedImages(markdown) {
    const urls = [];
    const re = /!\[[^\]]*\]\((https:\/\/[^)]+)\)/g;
    let match = re.exec(markdown);
    while (match) {
        const url = match[1];
        if (
            url.includes('notion.so') ||
            url.includes('prod-files-secure.s3') ||
            url.includes('amazonaws.com')
        ) {
            urls.push(url);
        }
        match = re.exec(markdown);
    }
    return urls;
}
