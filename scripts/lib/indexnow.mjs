/**
 * IndexNow 纯函数（无网络 I/O，便于单测）。
 *
 * 协议要点：
 * - 主机上放一个 `<key>.txt`，内容就是 key 本身；
 * - GitHub Pages 项目站点（/personalWeb/）控制不到主机根目录，因此请求里必须带 `keyLocation`，
 *   指向模块路径下的密钥文件，Bing 会先校验再收录；
 * - 一次请求最多 10,000 条 URL。
 *
 * @see https://www.indexnow.org/documentation
 * @see https://www.bing.com/indexnow/getstarted
 */

/** 单次提交的 URL 上限。 */
export const INDEXNOW_MAX_URLS = 10000;
/** key 允许的字符与长度（协议：8–128 位，字母数字与短横线）。 */
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

/**
 * @param {unknown} key
 * @returns {boolean}
 */
export function isValidIndexNowKey(key) {
    return KEY_RE.test(String(key ?? '').trim());
}

/**
 * 从 `<loc>` 里抽出 URL；去重并保持顺序。
 * @param {string} xml
 * @returns {string[]}
 */
export function extractLocs(xml) {
    const body = String(xml ?? '');
    const locs = [];
    const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
    let match;
    while ((match = re.exec(body)) !== null) {
        locs.push(decodeXmlEntities(match[1].trim()));
    }
    return locs;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function decodeXmlEntities(value) {
    return String(value)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

/**
 * 汇总多份 sitemap 的 URL，只保留同一 host 下、属于站点 base 路径的页面地址。
 *
 * @param {string[]} xmlDocs
 * @param {{ host: string, basePath?: string }} options
 * @returns {string[]}
 */
export function collectPageUrls(xmlDocs, { host, basePath = '' } = {}) {
    const wantedHost = String(host ?? '').toLowerCase();
    const base = String(basePath ?? '').replace(/\/$/, '');
    /** @type {Set<string>} */
    const seen = new Set();
    /** @type {string[]} */
    const urls = [];

    for (const xml of xmlDocs) {
        for (const loc of extractLocs(xml)) {
            let parsed;
            try {
                parsed = new URL(loc);
            } catch {
                continue;
            }
            if (parsed.host.toLowerCase() !== wantedHost) continue;
            if (base && !parsed.pathname.startsWith(`${base}/`) && parsed.pathname !== base) {
                continue;
            }
            // sitemap 索引里列的是 XML 自身，不是页面
            if (/\.xml$/i.test(parsed.pathname)) continue;
            const normalized = `${parsed.origin}${parsed.pathname}${parsed.search}`;
            if (seen.has(normalized)) continue;
            seen.add(normalized);
            urls.push(normalized);
        }
    }

    return urls;
}

/**
 * 按提交上限切分。
 * @template T
 * @param {T[]} list
 * @param {number} [size]
 * @returns {T[][]}
 */
export function chunk(list, size = INDEXNOW_MAX_URLS) {
    const items = Array.isArray(list) ? list : [];
    const max = Number.isFinite(size) && size > 0 ? Math.floor(size) : INDEXNOW_MAX_URLS;
    const out = [];
    for (let i = 0; i < items.length; i += max) {
        out.push(items.slice(i, i + max));
    }
    return out;
}

/**
 * 组装请求体。
 *
 * @param {{ urls: string[], key: string, host: string, keyLocation: string }} input
 * @returns {{ host: string, key: string, keyLocation: string, urlList: string[] }}
 */
export function buildIndexNowPayload({ urls, key, host, keyLocation }) {
    return {
        host,
        key,
        keyLocation,
        urlList: [...(urls ?? [])],
    };
}

/**
 * 校验线上密钥文件：内容去掉空白后应与 key 完全一致。
 *
 * @param {string} body
 * @param {string} key
 * @returns {boolean}
 */
export function isKeyFileValid(body, key) {
    return String(body ?? '').trim() === String(key ?? '').trim();
}

/**
 * 从 `[{ name, content }]` 里找密钥文件（文件名 === 内容，且 key 合法）。
 *
 * @param {Array<{ name: string, content: string }>} files
 * @returns {{ key: string, fileName: string } | null}
 */
export function findKeyFile(files) {
    for (const file of files ?? []) {
        const name = String(file?.name ?? '');
        if (!name.toLowerCase().endsWith('.txt')) continue;
        const key = String(file?.content ?? '').trim();
        if (!isValidIndexNowKey(key)) continue;
        if (`${key}.txt` !== name) continue;
        return { key, fileName: name };
    }
    return null;
}

/**
 * 拼接 keyLocation：项目站点落在 base 路径下。
 *
 * @param {string} siteUrl 例如 https://moyunzero.github.io/personalWeb
 * @param {string} key
 * @returns {string}
 */
export function buildKeyLocation(siteUrl, key) {
    return `${String(siteUrl ?? '').replace(/\/$/, '')}/${key}.txt`;
}
