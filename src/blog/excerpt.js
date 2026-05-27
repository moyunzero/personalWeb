/**
 * 从 Markdown 正文生成列表摘要（无 description 时使用）
 * @param {string} markdown
 * @param {number} [maxLength=120]
 */
export function extractExcerpt(markdown, maxLength = 120) {
    if (!markdown?.trim()) return '';

    const text = markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]+`/g, ' ')
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/[*_~>|`-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}…`;
}
