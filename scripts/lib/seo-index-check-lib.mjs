/**
 * Pure helpers for `yarn seo:index-check` (spec 0006).
 * No network I/O here — callers fetch and pass strings.
 */

/**
 * @typedef {{ id: string, severity: 'error' | 'warning' | 'info', message: string }} CheckFinding
 */

/**
 * @param {string} robotsBody
 * @param {string} baseUrl production base without trailing slash, e.g. https://host/personalWeb
 * @returns {CheckFinding[]}
 */
export function assertRobotsAllowsCrawl(robotsBody, baseUrl) {
    /** @type {CheckFinding[]} */
    const findings = [];
    const text = String(robotsBody ?? '');
    const lines = text.split(/\r?\n/).map((l) => l.trim());

    const hasAllowRoot = lines.some((l) => /^Allow:\s*\/\s*$/i.test(l));
    const hasDisallowAll = lines.some((l) => /^Disallow:\s*\/\s*$/i.test(l));

    if (hasDisallowAll && !hasAllowRoot) {
        findings.push({
            id: 'robots-allow',
            severity: 'error',
            message: 'robots.txt Disallow: / blocks the site root',
        });
    } else if (!hasAllowRoot && hasDisallowAll) {
        findings.push({
            id: 'robots-allow',
            severity: 'error',
            message: 'robots.txt does not allow crawling the site root',
        });
    } else if (!hasAllowRoot) {
        // No explicit Allow: / is OK if nothing Disallow: /'s the root
        const disallowPaths = lines
            .filter((l) => /^Disallow:\s*/i.test(l))
            .map((l) => l.replace(/^Disallow:\s*/i, '').trim());
        const blocksRoot = disallowPaths.some((p) => p === '/' || p === '/*');
        if (blocksRoot) {
            findings.push({
                id: 'robots-allow',
                severity: 'error',
                message: 'robots.txt blocks site root without Allow: /',
            });
        }
    }

    const sitemapLines = lines.filter((l) => /^Sitemap:\s*\S+/i.test(l));
    if (sitemapLines.length === 0) {
        findings.push({
            id: 'robots-sitemap',
            severity: 'error',
            message: 'robots.txt missing Sitemap: line',
        });
    } else {
        const base = baseUrl.replace(/\/$/, '');
        const ok = sitemapLines.some((l) => {
            const url = l.replace(/^Sitemap:\s*/i, '').trim();
            return url.startsWith(base);
        });
        if (!ok) {
            findings.push({
                id: 'robots-sitemap',
                severity: 'error',
                message: `robots.txt Sitemap: does not point under ${base}`,
            });
        }
    }

    return findings;
}

/**
 * Extract Sitemap: URL from robots.txt, or null.
 * @param {string} robotsBody
 * @returns {string | null}
 */
export function extractSitemapUrlFromRobots(robotsBody) {
    const line = String(robotsBody ?? '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => /^Sitemap:\s*\S+/i.test(l));
    if (!line) return null;
    return line.replace(/^Sitemap:\s*/i, '').trim();
}

/**
 * @param {string} xml
 * @returns {string[]}
 */
export function extractLocsFromXml(xml) {
    const body = String(xml ?? '');
    const locs = [];
    const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
    let m;
    while ((m = re.exec(body)) !== null) {
        locs.push(m[1].trim());
    }
    return locs;
}

/**
 * Blog article URLs: path contains /blog/ but not /blog/category/
 * @param {string[]} locs
 * @returns {string[]}
 */
export function filterBlogArticleUrls(locs) {
    return locs.filter((url) => {
        try {
            const u = new URL(url);
            const path = u.pathname;
            if (!path.includes('/blog/')) return false;
            if (path.includes('/blog/category/')) return false;
            // list page /blog/ or /blog
            if (/\/blog\/?$/.test(path)) return false;
            return true;
        } catch {
            return false;
        }
    });
}

/**
 * Take the last `n` URLs (sitemap order; date-prefixed slugs ≈ newest at end when sorted).
 * @param {string[]} urls
 * @param {number} n
 * @returns {string[]}
 */
export function selectSampleUrls(urls, n) {
    const list = Array.isArray(urls) ? urls : [];
    const count = Number.isFinite(n) && n > 0 ? Math.floor(n) : 5;
    if (list.length <= count) return [...list];
    return list.slice(list.length - count);
}

/**
 * @param {string} html
 * @returns {CheckFinding[]}
 */
export function assertHtmlIndexable(html) {
    /** @type {CheckFinding[]} */
    const findings = [];
    const body = String(html ?? '');

    if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(body)) {
        findings.push({
            id: 'html-noindex',
            severity: 'error',
            message: 'HTML has meta robots noindex',
        });
    } else if (/content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(body)) {
        findings.push({
            id: 'html-noindex',
            severity: 'error',
            message: 'HTML has meta robots noindex',
        });
    }

    if (!hasBlogPostingJsonLd(body)) {
        findings.push({
            id: 'html-blogposting',
            severity: 'error',
            message: 'HTML missing BlogPosting JSON-LD',
        });
    }

    return findings;
}

/**
 * @param {string} html
 * @returns {boolean}
 */
export function hasBlogPostingJsonLd(html) {
    const re =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const raw = m[1].trim();
        try {
            const data = JSON.parse(raw);
            if (jsonLdHasType(data, 'BlogPosting')) return true;
        } catch {
            if (/BlogPosting/i.test(raw)) return true;
        }
    }
    return false;
}

/**
 * @param {unknown} data
 * @param {string} type
 * @returns {boolean}
 */
function jsonLdHasType(data, type) {
    if (data == null) return false;
    if (Array.isArray(data)) {
        return data.some((item) => jsonLdHasType(item, type));
    }
    if (typeof data !== 'object') return false;
    const obj = /** @type {Record<string, unknown>} */ (data);
    const t = obj['@type'];
    if (typeof t === 'string' && t === type) return true;
    if (Array.isArray(t) && t.includes(type)) return true;
    if (obj['@graph']) return jsonLdHasType(obj['@graph'], type);
    return false;
}

/**
 * @param {string | undefined} credentialsPath
 * @param {{ existsSync?: (p: string) => boolean }} [fs]
 * @returns {boolean}
 */
export function shouldRunGscLayer(credentialsPath, fs = {}) {
    const path = String(credentialsPath ?? '').trim();
    if (!path) return false;
    const exists = fs.existsSync ?? (() => false);
    try {
        return exists(path);
    } catch {
        return false;
    }
}

/**
 * @param {{ coverageState?: string, indexingState?: string, verdict?: string } | null | undefined} indexStatus
 * @returns {boolean}
 */
export function isUrlIndexed(indexStatus) {
    const coverage = String(indexStatus?.coverageState ?? '');
    if (!coverage) return false;
    if (/not indexed/i.test(coverage)) return false;
    return /indexed/i.test(coverage);
}

/**
 * @param {string[]} argv
 * @returns {{ sample: number, strict: boolean }}
 */
export function parseIndexCheckArgs(argv) {
    let sample = 5;
    let strict = false;
    const args = argv ?? [];
    for (let i = 0; i < args.length; i += 1) {
        const a = args[i];
        if (a === '--strict') {
            strict = true;
        } else if (a === '--sample' && args[i + 1]) {
            const n = Number(args[i + 1]);
            if (Number.isFinite(n) && n > 0) sample = Math.floor(n);
            i += 1;
        } else if (a.startsWith('--sample=')) {
            const n = Number(a.slice('--sample='.length));
            if (Number.isFinite(n) && n > 0) sample = Math.floor(n);
        }
    }
    return { sample, strict };
}

/**
 * Decide process exit code from findings.
 * @param {CheckFinding[]} findings
 * @param {{ strict?: boolean }} [opts]
 * @returns {number}
 */
export function exitCodeFromFindings(findings, opts = {}) {
    const strict = Boolean(opts.strict);
    const hasError = findings.some((f) => f.severity === 'error');
    if (hasError) return 1;
    if (strict && findings.some((f) => f.severity === 'warning')) return 1;
    return 0;
}
