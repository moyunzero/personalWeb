/**
 * SEO 标题 / 描述的有效值规则。
 *
 * 构建期（Astro 页面）与 Node 脚本（`yarn seo:audit`、`yarn seo:meta-batch`）共用这一份逻辑，
 * 避免「门禁认为合格、线上仍是短标题」的双标。
 *
 * 阈值依据 Bing Webmaster Tools 的判定：
 * - 标题少于 15 个字符记为 too short，超过 65 个字符会被截断（本站门禁取 20 作下限）；
 * - 描述过短（我们取 100 个字符为下限）会用正文摘要兜底。
 *
 * @see https://learn.microsoft.com/previous-versions/visualstudio/design-tools/expression-studio-4/ff724042(v=expression.40)
 */

/**
 * 标题下限（按 Unicode 码点计）。
 * Bing 判定「too short」的临界值是 15，这里取 20 留 5 个字符余量，
 * 避免标题正好贴线后又被判过短。
 */
export const TITLE_MIN_CHARS = 20;
/** Bing Webmaster 判「标题过短」的原始阈值，仅用于文档与说明。 */
export const BING_TITLE_SHORT_THRESHOLD = 15;
/** 搜索结果里标题的实际上限，超过即被截断。 */
export const TITLE_MAX_CHARS = 65;
/**
 * 描述过短的下限。中文按字符计，100 字约等于英文 200 字符的信息量，
 * 稳妥越过 Bing「too short」的判定，同时仍在搜索结果展示范围内。
 */
export const DESCRIPTION_MIN_CHARS = 100;
/** 正文兜底摘要的截断长度。 */
export const DESCRIPTION_EXCERPT_CHARS = 160;
/** 描述上限，超过则门禁报警（`desc-long`）。 */
export const DESCRIPTION_MAX_CHARS = 200;
/** 站点名与标题之间统一使用的分隔符。 */
export const SITE_TITLE_SEPARATOR = ' · ';

const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const LEADING_NOISE_RE = /^[\s，。、；：！？…·\-—－_/|)）\]】」』”’"'’]+/;
/** 已知会被写进 Notion Description 的项目代号前缀。 */
const PLACEHOLDER_PREFIX_RE = /^(workbuddy|agentguide|agentic ai course|personal gpt)\b/i;
/** `foo-12` 这类「单词 + 序号」的占位。 */
const CODE_WITH_NUMBER_RE = /^[A-Za-z][A-Za-z0-9._]*-\d+$/;

/**
 * 按 Unicode 码点统计长度（emoji、全角标点都算 1）。
 * @param {unknown} value
 * @returns {number}
 */
export function charLength(value) {
    return [...String(value ?? '')].length;
}

/**
 * 压缩空白并去掉开头的孤立标点（Notion 摘录常以「，」起头）。
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeMetaText(value) {
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .replace(LEADING_NOISE_RE, '')
        .trim();
}

/**
 * 只有正文没有描述时，Notion 会把项目代号写进 description（如 `workBuddy-3`、
 * `AgentGuide-12`、`Personal GPT Phase 1`）。这类值对搜索与读者都没有意义。
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlaceholderDescription(value) {
    const text = String(value ?? '').trim();
    if (!text) return true;
    if (CJK_RE.test(text)) return false;
    if (charLength(text) >= 40) return false;
    if (PLACEHOLDER_PREFIX_RE.test(text)) return true;
    return CODE_WITH_NUMBER_RE.test(text);
}

/**
 * 描述是否需要用正文摘要兜底。
 * @param {unknown} value
 * @returns {boolean}
 */
export function needsDescriptionFallback(value) {
    const text = normalizeMetaText(value);
    if (!text) return true;
    if (isPlaceholderDescription(text)) return true;
    return charLength(text) < DESCRIPTION_MIN_CHARS;
}

/**
 * @param {string} text
 * @returns {string}
 */
function clampDescription(text) {
    if (charLength(text) <= DESCRIPTION_MAX_CHARS) return text;
    return `${[...text].slice(0, DESCRIPTION_MAX_CHARS - 1).join('').trim()}…`;
}

const SENTENCE_END_RE = /[。！？.!?]/;

/**
 * 生成 meta description 专用摘要。
 *
 * 与列表摘要（`src/blog/excerpt.js`）的区别：**保留行内代码里的标识符**。
 * 把 `input_schema` 抹掉会得到「把全部完整 塞进 ，」这种断句，搜索摘要读起来像乱码。
 *
 * @param {unknown} markdown
 * @param {number} [maxChars]
 * @returns {string}
 */
export function excerptForDescription(markdown, maxChars = DESCRIPTION_EXCERPT_CHARS) {
    const limit =
        Number.isFinite(maxChars) && maxChars > 0
            ? Math.floor(maxChars)
            : DESCRIPTION_EXCERPT_CHARS;
    const raw = String(markdown ?? '');
    if (!raw.trim()) return '';

    const withoutFences = raw
        .replace(/```[\s\S]*?```/g, ' ') // 代码块整体丢弃
        .replace(/~~~[\s\S]*?~~~/g, ' ');

    // 行内代码单独保留：`input_schema`、`a | b` 这类内容被符号清洗改坏就成乱码了
    const text = withoutFences
        .split(/(`[^`\n]+`)/g)
        .map((part) =>
            part.length > 2 && part.startsWith('`') && part.endsWith('`')
                ? part.slice(1, -1)
                : stripMarkdownNoise(part)
        )
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return '';
    if (charLength(text) <= limit) return text;

    // 优先在句子边界截断（取上限内最后一个句末标点）；边界太靠前就硬截，
    // 但截断位置至少保证达到描述长度下限，否则会生成「过短」的描述。
    const head = [...text].slice(0, limit);
    let cutIndex = -1;
    for (let i = head.length - 1; i >= 0; i -= 1) {
        if (SENTENCE_END_RE.test(head[i])) {
            cutIndex = i;
            break;
        }
    }
    const shortestAcceptable =
        limit >= DESCRIPTION_MIN_CHARS
            ? Math.max(Math.floor(limit * 0.6), DESCRIPTION_MIN_CHARS - 1)
            : Math.floor(limit * 0.6);
    if (cutIndex >= shortestAcceptable) {
        return head.slice(0, cutIndex + 1).join('').trim();
    }
    // 硬截时给省略号留一个字符，保证总长不超过上限
    return `${head.slice(0, limit - 1).join('').trim()}…`;
}

/**
 * 去掉 Markdown 标记，只留可读文字。
 * @param {string} part
 * @returns {string}
 */
function stripMarkdownNoise(part) {
    return part
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ') // 图片
        .replace(/\[([^\]]*)]\([^)]*\)/g, '$1') // 链接保留文字
        .replace(/^\s{0,3}#{1,6}\s+/gm, '') // 标题符号
        .replace(/^\s{0,3}>\s?/gm, '') // 引用
        .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '') // 列表符号
        .replace(/\*\*|__|~~/g, '') // 粗体/删除线标记直接去掉，避免留下「层 ：」这种空格
        .replace(/[*_~|]+/g, ' '); // 残留的强调、表格分隔
}

/**
 * 生成实际写进 <meta name="description"> 的文本：
 * 优先人工描述；过短或为占位符时，用正文摘要补足。
 *
 * @param {{ description?: unknown, body?: unknown, title?: unknown }} input
 * @returns {string}
 */
export function effectiveDescription({ description, body } = {}) {
    const base = normalizeMetaText(description);
    if (!needsDescriptionFallback(base)) return clampDescription(base);

    const excerpt = normalizeMetaText(
        excerptForDescription(body, DESCRIPTION_EXCERPT_CHARS)
    );
    if (!excerpt) return clampDescription(base);
    if (charLength(excerpt) <= charLength(base)) return clampDescription(base);
    return clampDescription(excerpt);
}

/**
 * 生成实际写进 <title> 的主标题（不含站点名后缀）。
 * `seoTitle` 为人工改写入口，缺失时回落到 frontmatter title。
 *
 * @param {{ title?: unknown, seoTitle?: unknown }} input
 * @returns {string}
 */
export function effectiveTitle({ title, seoTitle } = {}) {
    const custom = normalizeMetaText(seoTitle);
    if (custom) return custom;
    return String(title ?? '').trim();
}

/**
 * 追加站点名后缀；超出 65 字符则不追加，避免标题被搜索结果截断。
 *
 * @param {string} title
 * @param {string} siteName
 * @param {string} [separator]
 * @returns {string}
 */
export function withSiteName(title, siteName, separator = SITE_TITLE_SEPARATOR) {
    const text = String(title ?? '').trim();
    const name = String(siteName ?? '').trim();
    if (!name) return text;
    if (!text) return name;
    if (text.endsWith(`${separator}${name}`)) return text;
    if (text.includes(separator)) {
        // 已经自带一处分隔符（例如分类页 `技术记录：… · 墨韵`）就不再叠加
        if (text.endsWith(name)) return text;
    }
    const composed = `${text}${separator}${name}`;
    if (charLength(composed) > TITLE_MAX_CHARS) return text;
    return composed;
}

/**
 * 门禁用：返回标题的问题代码（无问题返回 null）。
 * @param {unknown} title
 * @returns {'title-too-short' | 'title-too-long' | null}
 */
export function titleIssue(title) {
    const text = normalizeMetaText(title);
    const length = charLength(text);
    if (length < TITLE_MIN_CHARS) return 'title-too-short';
    if (length > TITLE_MAX_CHARS) return 'title-too-long';
    return null;
}

/**
 * 门禁用：返回描述的问题代码（无问题返回 null）。
 * @param {unknown} description
 * @returns {'desc-too-short' | 'desc-too-long' | null}
 */
export function descriptionIssue(description) {
    const text = normalizeMetaText(description);
    const length = charLength(text);
    if (length < DESCRIPTION_MIN_CHARS) return 'desc-too-short';
    if (length > DESCRIPTION_MAX_CHARS) return 'desc-too-long';
    return null;
}
