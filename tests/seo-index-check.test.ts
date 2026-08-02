import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
} from '../scripts/lib/seo-index-check-lib.mjs';
import { runSeoIndexCheck } from '../scripts/seo-index-check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://moyunzero.github.io/personalWeb';

const goodArticleHtml = `<!doctype html><html><head>
<meta name="description" content="x"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":"Hi"}</script>
</head><body><article>hi</article></body></html>`;

describe('seo-index-check-lib', () => {
    // covers: AC-2
    it('AC-2 assertRobotsAllowsCrawl accepts Allow and Sitemap under base', () => {
        const robots = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap-index.xml\n`;
        expect(assertRobotsAllowsCrawl(robots, base)).toEqual([]);
    });

    // covers: AC-2
    it('AC-2 assertRobotsAllowsCrawl errors on Disallow all and missing Sitemap', () => {
        const robots = `User-agent: *\nDisallow: /\n`;
        const findings = assertRobotsAllowsCrawl(robots, base);
        expect(findings.some((f) => f.id === 'robots-allow')).toBe(true);
        expect(findings.some((f) => f.id === 'robots-sitemap')).toBe(true);
    });

    // covers: AC-3
    it('AC-3 extractSitemapUrlFromRobots and extractLocsFromXml', () => {
        expect(
            extractSitemapUrlFromRobots(
                `Sitemap: ${base}/sitemap-index.xml\n`
            )
        ).toBe(`${base}/sitemap-index.xml`);
        expect(
            extractLocsFromXml(
                `<urlset><url><loc>${base}/blog/a/</loc></url></urlset>`
            )
        ).toEqual([`${base}/blog/a/`]);
    });

    // covers: AC-3
    it('AC-3 filterBlogArticleUrls drops list and category pages', () => {
        const locs = [
            `${base}/`,
            `${base}/blog/`,
            `${base}/blog/category/note/`,
            `${base}/blog/2024-01-01-hello/`,
        ];
        expect(filterBlogArticleUrls(locs)).toEqual([
            `${base}/blog/2024-01-01-hello/`,
        ]);
    });

    // covers: AC-4
    it('AC-4 selectSampleUrls takes last N', () => {
        const urls = ['a', 'b', 'c', 'd', 'e', 'f'];
        expect(selectSampleUrls(urls, 5)).toEqual(['b', 'c', 'd', 'e', 'f']);
        expect(selectSampleUrls(['only'], 5)).toEqual(['only']);
    });

    // covers: AC-4
    it('AC-4 assertHtmlIndexable requires BlogPosting and rejects noindex', () => {
        expect(assertHtmlIndexable(goodArticleHtml)).toEqual([]);
        expect(
            assertHtmlIndexable(
                `<meta name="robots" content="noindex, nofollow"/>${goodArticleHtml}`
            ).some((f) => f.id === 'html-noindex')
        ).toBe(true);
        expect(
            assertHtmlIndexable('<html><body>no ld</body></html>').some(
                (f) => f.id === 'html-blogposting'
            )
        ).toBe(true);
    });

    // covers: AC-6
    it('AC-6 shouldRunGscLayer depends on readable credentials path', () => {
        expect(shouldRunGscLayer(undefined, { existsSync: () => true })).toBe(
            false
        );
        expect(
            shouldRunGscLayer('/tmp/sa.json', { existsSync: () => true })
        ).toBe(true);
        expect(
            shouldRunGscLayer('/tmp/missing.json', { existsSync: () => false })
        ).toBe(false);
    });

    // covers: AC-6, AC-7
    it('AC-6/AC-7 isUrlIndexed reads coverageState', () => {
        expect(
            isUrlIndexed({ coverageState: 'Submitted and indexed' })
        ).toBe(true);
        expect(
            isUrlIndexed({
                coverageState: 'Crawled - currently not indexed',
            })
        ).toBe(false);
        expect(isUrlIndexed({})).toBe(false);
    });

    // covers: AC-4, AC-7
    it('AC-4/AC-7 parseIndexCheckArgs and exitCodeFromFindings', () => {
        expect(parseIndexCheckArgs(['--sample', '10', '--strict'])).toEqual({
            sample: 10,
            strict: true,
        });
        expect(
            exitCodeFromFindings([{ id: 'x', severity: 'error', message: 'e' }])
        ).toBe(1);
        expect(
            exitCodeFromFindings(
                [{ id: 'x', severity: 'warning', message: 'w' }],
                { strict: false }
            )
        ).toBe(0);
        expect(
            exitCodeFromFindings(
                [{ id: 'x', severity: 'warning', message: 'w' }],
                { strict: true }
            )
        ).toBe(1);
    });
});

describe('runSeoIndexCheck (mocked network)', () => {
    const article = `${base}/blog/2024-01-01-hello/`;
    const article2 = `${base}/blog/2024-02-02-world/`;

    function mockFetch(map: Record<string, { status: number; body: string }>) {
        return async (url: string) => {
            const hit = map[url];
            if (!hit) throw new Error(`unexpected fetch ${url}`);
            return hit;
        };
    }

    // covers: AC-2, AC-3, AC-4, AC-5, AC-6
    it('AC-2…AC-6 happy path A without credentials skips B and exits 0', async () => {
        const prev = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-index.xml\n`,
            },
            [`${base}/sitemap-index.xml`]: {
                status: 200,
                body: `<?xml version="1.0"?><sitemapindex><sitemap><loc>${base}/sitemap-0.xml</loc></sitemap></sitemapindex>`,
            },
            [`${base}/sitemap-0.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${base}/blog/</loc></url><url><loc>${article}</loc></url><url><loc>${article2}</loc></url></urlset>`,
            },
            [article]: { status: 200, body: goodArticleHtml },
            [article2]: { status: 200, body: goodArticleHtml },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'google-site-verification: googleef60eaecd43955c6.html',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<?xml version="1.0"?><users><user>4A7B2111</user></users>',
            },
        });

        const result = await runSeoIndexCheck({
            sample: 5,
            strict: false,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
        });

        expect(result.exitCode).toBe(0);
        expect(result.findings.some((f) => f.id === 'gsc-skip')).toBe(true);
        expect(result.findings.some((f) => f.severity === 'error')).toBe(false);

        if (prev === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        else process.env.GOOGLE_APPLICATION_CREDENTIALS = prev;
    });

    // covers: AC-3
    it('AC-3 fails when sitemap has no blog article URLs', async () => {
        const prev = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-0.xml\n`,
            },
            [`${base}/sitemap-0.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${base}/blog/</loc></url><url><loc>${base}/blog/category/note/</loc></url></urlset>`,
            },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'google-site-verification: x',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<user>x</user>',
            },
        });

        const result = await runSeoIndexCheck({
            sample: 5,
            strict: false,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
        });

        expect(result.exitCode).toBe(1);
        expect(result.findings.some((f) => f.id === 'sitemap-blog')).toBe(true);

        if (prev === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        else process.env.GOOGLE_APPLICATION_CREDENTIALS = prev;
    });

    // covers: AC-5
    it('AC-5 fails when google verify file is missing token', async () => {
        const prev = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-0.xml\n`,
            },
            [`${base}/sitemap-0.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${article}</loc></url></urlset>`,
            },
            [article]: { status: 200, body: goodArticleHtml },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'not a verification file',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<user>x</user>',
            },
        });

        const result = await runSeoIndexCheck({
            sample: 1,
            strict: false,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
        });

        expect(result.exitCode).toBe(1);
        expect(result.findings.some((f) => f.id === 'google-verify')).toBe(
            true
        );

        if (prev === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        else process.env.GOOGLE_APPLICATION_CREDENTIALS = prev;
    });

    // covers: AC-4
    it('AC-4 fails A when article has noindex', async () => {
        const prev = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

        const badHtml = `<meta name="robots" content="noindex">${goodArticleHtml}`;
        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-index.xml\n`,
            },
            [`${base}/sitemap-index.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${article}</loc></url></urlset>`,
            },
            [article]: { status: 200, body: badHtml },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'google-site-verification: x',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<user>x</user>',
            },
        });

        const result = await runSeoIndexCheck({
            sample: 1,
            strict: false,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
        });

        expect(result.exitCode).toBe(1);
        expect(result.findings.some((f) => f.id === 'html-noindex')).toBe(true);

        if (prev === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        else process.env.GOOGLE_APPLICATION_CREDENTIALS = prev;
    });

    // covers: AC-6, AC-7
    it('AC-6/AC-7 B layer indexed sample exits 0', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/fake-gsc.json';

        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-0.xml\n`,
            },
            [`${base}/sitemap-0.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${article}</loc></url></urlset>`,
            },
            [article]: { status: 200, body: goodArticleHtml },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'google-site-verification: x',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<user>x</user>',
            },
        });

        const result = await runSeoIndexCheck({
            sample: 1,
            strict: false,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
            credentialsExist: () => true,
            readCredentials: async () => ({
                client_email: 'sa@test.iam.gserviceaccount.com',
                private_key: 'unused',
            }),
            getTokenImpl: async () => 'token',
            inspectImpl: async () => ({
                inspectionResult: {
                    indexStatusResult: {
                        indexingState: 'INDEXING_ALLOWED',
                        coverageState: 'Submitted and indexed',
                    },
                },
            }),
        });

        expect(result.exitCode).toBe(0);
        expect(result.findings.some((f) => f.id === 'gsc-not-indexed')).toBe(
            false
        );

        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    });

    // covers: AC-6, AC-7
    it('AC-6/AC-7 B layer not indexed warns unless --strict', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/fake-gsc.json';

        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-0.xml\n`,
            },
            [`${base}/sitemap-0.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${article}</loc></url></urlset>`,
            },
            [article]: { status: 200, body: goodArticleHtml },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'google-site-verification: x',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<user>x</user>',
            },
        });

        const gscOpts = {
            sample: 1,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
            credentialsExist: () => true,
            readCredentials: async () => ({
                client_email: 'sa@test.iam.gserviceaccount.com',
                private_key: 'unused-in-mock',
            }),
            getTokenImpl: async () => 'token',
            inspectImpl: async () => ({
                inspectionResult: {
                    indexStatusResult: {
                        indexingState: 'INDEXING_ALLOWED',
                        coverageState: 'Discovered - currently not indexed',
                    },
                },
            }),
        };

        const soft = await runSeoIndexCheck({ ...gscOpts, strict: false });
        expect(soft.exitCode).toBe(0);
        expect(soft.findings.some((f) => f.id === 'gsc-not-indexed')).toBe(
            true
        );

        const hard = await runSeoIndexCheck({ ...gscOpts, strict: true });
        expect(hard.exitCode).toBe(1);

        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    });

    // covers: AC-7
    it('AC-7 B layer 403 is warning without strict', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/fake-gsc.json';

        const fetchImpl = mockFetch({
            [`${base}/robots.txt`]: {
                status: 200,
                body: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap-0.xml\n`,
            },
            [`${base}/sitemap-0.xml`]: {
                status: 200,
                body: `<urlset><url><loc>${article}</loc></url></urlset>`,
            },
            [article]: { status: 200, body: goodArticleHtml },
            [`${base}/googleef60eaecd43955c6.html`]: {
                status: 200,
                body: 'google-site-verification: x',
            },
            [`${base}/BingSiteAuth.xml`]: {
                status: 200,
                body: '<user>x</user>',
            },
        });

        const result = await runSeoIndexCheck({
            sample: 1,
            strict: false,
            baseUrl: base,
            gscSiteUrl: `${base}/`,
            fetchImpl,
            credentialsExist: () => true,
            readCredentials: async () => ({
                client_email: 'sa@test.iam.gserviceaccount.com',
                private_key: 'unused',
            }),
            getTokenImpl: async () => 'token',
            inspectImpl: async () => {
                const err = new Error('Forbidden') as Error & { status: number };
                err.status = 403;
                throw err;
            },
        });

        expect(result.exitCode).toBe(0);
        expect(
            result.findings.some(
                (f) => f.id === 'gsc-inspect' && /GSC property/i.test(f.message)
            )
        ).toBe(true);

        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    });
});

describe('package + docs registration', () => {
    // covers: AC-1
    it('AC-1 package.json registers seo:index-check', async () => {
        const pkg = JSON.parse(
            await readFile(path.join(root, 'package.json'), 'utf8')
        );
        expect(pkg.scripts['seo:index-check']).toContain('seo-index-check');
    });

    // covers: AC-10
    it('AC-10 WEBMASTER and scripts AGENTS document seo:index-check', async () => {
        const webmaster = await readFile(
            path.join(root, 'docs/WEBMASTER-SUBMISSION.md'),
            'utf8'
        );
        expect(webmaster).toContain('yarn seo:index-check');
        expect(webmaster).toContain('GOOGLE_APPLICATION_CREDENTIALS');
        expect(webmaster).toContain('--strict');
        expect(webmaster).toContain('GSC_SITE_URL');

        const scriptsAgents = await readFile(
            path.join(root, 'scripts/AGENTS.md'),
            'utf8'
        );
        expect(scriptsAgents).toContain('seo:index-check');
        expect(scriptsAgents).toContain('GOOGLE_APPLICATION_CREDENTIALS');
    });
});
