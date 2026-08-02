#!/usr/bin/env node
/**
 * SEO index check (spec 0006): layer A crawl readiness + optional GSC URL Inspection (B).
 */
import { createSign } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './lib/site-config.mjs';
import { withRetry } from './lib/retry.mjs';
import {
    assertHtmlIndexable,
    assertRobotsAllowsCrawl,
    exitCodeFromFindings,
    extractLocsFromXml,
    extractSitemapUrlFromRobots,
    filterBlogArticleUrls,
    isUrlIndexed,
    parseIndexCheckArgs,
    selectSampleUrls,
    shouldRunGscLayer,
} from './lib/seo-index-check-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GOOGLE_VERIFY = 'googleef60eaecd43955c6.html';
const BING_VERIFY = 'BingSiteAuth.xml';

/**
 * @param {string} url
 * @param {string} label
 * @returns {Promise<{ status: number, body: string }>}
 */
async function fetchText(url, label) {
    return withRetry(
        async () => {
            const res = await fetch(url, { method: 'GET' });
            const body = await res.text();
            return { status: res.status, body };
        },
        { label, retries: 3, delayMs: 1500 }
    );
}

/**
 * @returns {Promise<string | null>}
 */
async function findBaiduVerifyFile() {
    const publicDir = path.join(root, 'public');
    if (!existsSync(publicDir)) return null;
    const entries = await readdir(publicDir);
    return entries.find((f) => f.startsWith('baidu_verify_') && f.endsWith('.html')) ?? null;
}

/**
 * Service account JWT → access token (no googleapis dependency).
 * @param {Record<string, string>} sa
 * @returns {Promise<string>}
 */
async function getAccessTokenFromServiceAccount(sa) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
        JSON.stringify({ alg: 'RS256', typ: 'JWT' })
    ).toString('base64url');
    const claim = Buffer.from(
        JSON.stringify({
            iss: sa.client_email,
            scope: 'https://www.googleapis.com/auth/webmasters.readonly',
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600,
        })
    ).toString('base64url');
    const unsigned = `${header}.${claim}`;
    const sign = createSign('RSA-SHA256');
    sign.update(unsigned);
    sign.end();
    const signature = sign.sign(sa.private_key, 'base64url');
    const jwt = `${unsigned}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
        const msg = data.error_description || data.error || `token HTTP ${res.status}`;
        throw new Error(String(msg));
    }
    return data.access_token;
}

/**
 * @param {string} accessToken
 * @param {string} inspectionUrl
 * @param {string} siteUrl
 */
async function inspectUrl(accessToken, inspectionUrl, siteUrl) {
    const res = await fetch(
        'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inspectionUrl, siteUrl }),
        }
    );
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(
            data.error?.message || `URL Inspection HTTP ${res.status}`
        );
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

/**
 * @param {{ sample: number, strict: boolean, baseUrl: string, gscSiteUrl: string, fetchImpl?: typeof fetchText, inspectImpl?: typeof inspectUrl, getTokenImpl?: typeof getAccessTokenFromServiceAccount, readCredentials?: () => Promise<Record<string, string> | null>, credentialsExist?: (p: string) => boolean }} opts
 */
export async function runSeoIndexCheck(opts) {
    const {
        sample,
        strict,
        baseUrl,
        gscSiteUrl,
        fetchImpl = fetchText,
        inspectImpl = inspectUrl,
        getTokenImpl = getAccessTokenFromServiceAccount,
        readCredentials,
        credentialsExist = existsSync,
    } = opts;

    /** @type {import('./lib/seo-index-check-lib.mjs').CheckFinding[]} */
    const findings = [];
    const base = baseUrl.replace(/\/$/, '');
    /** @type {string[]} */
    let samples = [];

    console.log(`SEO index check → ${base}`);
    console.log(`Layer A: crawl readiness (sample=${sample})`);

    // --- robots ---
    const robotsUrl = `${base}/robots.txt`;
    try {
        const { status, body } = await fetchImpl(robotsUrl, 'robots');
        if (status !== 200) {
            findings.push({
                id: 'robots-http',
                severity: 'error',
                message: `robots.txt status ${status}`,
            });
        } else {
            findings.push(...assertRobotsAllowsCrawl(body, base));
        }

        let sitemapIndexUrl =
            status === 200 ? extractSitemapUrlFromRobots(body) : null;
        if (!sitemapIndexUrl) {
            sitemapIndexUrl = `${base}/sitemap-index.xml`;
            console.log(`  info: using fallback sitemap ${sitemapIndexUrl}`);
        }

        // --- sitemap ---
        const { status: smStatus, body: smBody } = await fetchImpl(
            sitemapIndexUrl,
            'sitemap-index'
        );
        if (smStatus !== 200) {
            findings.push({
                id: 'sitemap-http',
                severity: 'error',
                message: `sitemap status ${smStatus}: ${sitemapIndexUrl}`,
            });
        } else {
            let locs = extractLocsFromXml(smBody);
            const childSitemaps = locs.filter((u) =>
                /sitemap.*\.xml/i.test(u)
            );
            const looksLikeIndex =
                smBody.includes('<sitemapindex') || childSitemaps.length > 0;

            if (looksLikeIndex && childSitemaps.length > 0) {
                locs = [];
                for (const child of childSitemaps) {
                    const childRes = await fetchImpl(child, 'sitemap-urlset');
                    if (childRes.status !== 200) {
                        findings.push({
                            id: 'sitemap-child',
                            severity: 'error',
                            message: `child sitemap status ${childRes.status}: ${child}`,
                        });
                        continue;
                    }
                    locs.push(...extractLocsFromXml(childRes.body));
                }
            }

            const blogUrls = filterBlogArticleUrls(locs);
            if (blogUrls.length < 1) {
                findings.push({
                    id: 'sitemap-blog',
                    severity: 'error',
                    message: 'no blog article URLs in sitemap',
                });
            } else {
                console.log(`  sitemap blog articles: ${blogUrls.length}`);
                samples = selectSampleUrls(blogUrls, sample);
                console.log(`  sampling ${samples.length} URL(s)`);

                for (const url of samples) {
                    try {
                        const page = await fetchImpl(url, `article ${url}`);
                        if (page.status !== 200) {
                            findings.push({
                                id: 'article-http',
                                severity: 'error',
                                message: `${url} status ${page.status}`,
                            });
                            continue;
                        }
                        const htmlFindings = assertHtmlIndexable(page.body);
                        for (const f of htmlFindings) {
                            findings.push({
                                ...f,
                                message: `${url}: ${f.message}`,
                            });
                        }
                        if (htmlFindings.length === 0) {
                            console.log(`  OK article ${url}`);
                        }
                    } catch (err) {
                        findings.push({
                            id: 'article-fetch',
                            severity: 'error',
                            message: `${url}: ${err instanceof Error ? err.message : String(err)}`,
                        });
                    }
                }
            }
        }
    } catch (err) {
        findings.push({
            id: 'layer-a',
            severity: 'error',
            message: err instanceof Error ? err.message : String(err),
        });
    }

    // --- verify files (AC-5) ---
    try {
        const google = await fetchImpl(`${base}/${GOOGLE_VERIFY}`, 'google-verify');
        if (google.status !== 200 || !google.body.includes('google-site-verification:')) {
            findings.push({
                id: 'google-verify',
                severity: 'error',
                message:
                    google.status !== 200
                        ? `google verify status ${google.status}`
                        : 'missing google-site-verification token',
            });
        } else {
            console.log('  OK google verify file');
        }

        const bing = await fetchImpl(`${base}/${BING_VERIFY}`, 'bing-verify');
        if (bing.status !== 200 || !bing.body.includes('<user>')) {
            findings.push({
                id: 'bing-verify',
                severity: 'error',
                message:
                    bing.status !== 200
                        ? `bing verify status ${bing.status}`
                        : 'missing <user> in BingSiteAuth.xml',
            });
        } else {
            console.log('  OK bing verify file');
        }

        const baiduFile = await findBaiduVerifyFile();
        if (baiduFile) {
            const baidu = await fetchImpl(`${base}/${baiduFile}`, 'baidu-verify');
            if (baidu.status !== 200) {
                findings.push({
                    id: 'baidu-verify',
                    severity: 'error',
                    message: `baidu verify status ${baidu.status}`,
                });
            }
        }
    } catch (err) {
        findings.push({
            id: 'verify-files',
            severity: 'error',
            message: err instanceof Error ? err.message : String(err),
        });
    }

    // --- Layer B ---
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const runB = shouldRunGscLayer(credPath, { existsSync: credentialsExist });

    if (!runB) {
        console.log(
            'SKIP layer B: set GOOGLE_APPLICATION_CREDENTIALS to a readable service account JSON to query GSC'
        );
        findings.push({
            id: 'gsc-skip',
            severity: 'info',
            message: 'GSC layer skipped (no credentials)',
        });
    } else if (samples.length === 0) {
        console.log('SKIP layer B: no sample URLs from layer A');
        findings.push({
            id: 'gsc-skip-samples',
            severity: 'warning',
            message: 'GSC layer skipped (no sample URLs)',
        });
    } else {
        console.log(`Layer B: GSC URL Inspection (${samples.length} URL(s))`);
        console.log(`  siteUrl=${gscSiteUrl}`);
        try {
            let sa;
            if (readCredentials) {
                sa = await readCredentials();
            } else {
                const raw = await readFile(credPath, 'utf8');
                sa = JSON.parse(raw);
            }
            if (!sa?.client_email || !sa?.private_key) {
                throw new Error('credentials JSON missing client_email or private_key');
            }
            console.log(`  service account: ${sa.client_email}`);

            const token = await getTokenImpl(sa);
            for (const url of samples) {
                try {
                    const data = await inspectImpl(token, url, gscSiteUrl);
                    const status = data?.inspectionResult?.indexStatusResult ?? {};
                    const indexingState = status.indexingState ?? '(none)';
                    const coverageState = status.coverageState ?? '(none)';
                    console.log(
                        `  ${url}\n    indexingState=${indexingState} coverageState=${coverageState}`
                    );
                    if (!isUrlIndexed(status)) {
                        findings.push({
                            id: 'gsc-not-indexed',
                            severity: 'warning',
                            message: `not indexed: ${url} (${coverageState})`,
                        });
                    }
                } catch (err) {
                    const status = err?.status;
                    const msg = err instanceof Error ? err.message : String(err);
                    const authHint =
                        status === 401 || status === 403
                            ? ' — add the service account email as a user on the GSC property (Full)'
                            : '';
                    findings.push({
                        id: 'gsc-inspect',
                        severity: 'warning',
                        message: `${url}: ${msg}${authHint}`,
                    });
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            findings.push({
                id: 'gsc-auth',
                severity: 'warning',
                message: `GSC auth/setup failed: ${msg}. Add the service account to GSC Users and Permissions.`,
            });
        }
    }

    for (const f of findings) {
        const tag = f.severity.toUpperCase();
        if (f.severity === 'info') continue;
        console.log(`${tag} ${f.id}: ${f.message}`);
    }

    const code = exitCodeFromFindings(findings, { strict });
    const errors = findings.filter((f) => f.severity === 'error').length;
    const warnings = findings.filter((f) => f.severity === 'warning').length;
    console.log(
        `\nSEO index check: ${errors} error(s), ${warnings} warning(s)${strict ? ' [strict]' : ''} → exit ${code}`
    );
    return { findings, exitCode: code };
}

async function main() {
    const { sample, strict } = parseIndexCheckArgs(process.argv.slice(2));
    const baseUrl = (process.env.PRODUCTION_URL || SITE.url).replace(/\/$/, '');
    const gscSiteUrl = (
        process.env.GSC_SITE_URL || `${baseUrl}/`
    ).replace(/\/*$/, '/');

    const result = await runSeoIndexCheck({
        sample,
        strict,
        baseUrl,
        gscSiteUrl,
    });
    process.exit(result.exitCode);
}

const isMain =
    process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
