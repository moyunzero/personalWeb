import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * 修复 Notion 同步等产生的非标准 YAML（如 `description:中文` 冒号后缺空格）
 * @param {string} yaml
 */
export function normalizeFrontmatterYaml(yaml) {
    return yaml.replace(/^([A-Za-z][\w-]*):(?=\S)/gm, '$1: ');
}

/**
 * 解析 Markdown 文件的 YAML frontmatter（浏览器 / Node 通用，不依赖 Buffer）
 * @param {string} raw
 * @returns {{ data: Record<string, unknown>, content: string }}
 */
export function parseFrontmatter(raw) {
    if (!raw) {
        return { data: {}, content: '' };
    }

    const match = raw.match(FRONTMATTER_RE);
    if (!match) {
        return { data: {}, content: raw };
    }

    const yamlBlock = normalizeFrontmatterYaml(match[1]);

    try {
        const data = parseYaml(yamlBlock);
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { data: {}, content: match[2] };
        }
        return { data, content: match[2] };
    } catch {
        return { data: {}, content: match[2] };
    }
}

/**
 * @param {string} content
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
export function stringifyFrontmatter(content, data) {
    const yaml = stringifyYaml(data).trimEnd();
    const body = content.replace(/^\n+/, '');
    return `---\n${yaml}\n---\n\n${body}`;
}
