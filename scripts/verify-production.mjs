#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './lib/site-config.mjs';
import { withRetry } from './lib/retry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const skipNetwork = process.argv.includes('--skip-network');
const baseUrl = (process.env.PRODUCTION_URL || SITE.url).replace(/\/$/, '');

/** @type {Array<{ id: string, url: string, validate: (body: string, status: number) => string | null }>} */
const CHECKS = [
    {
        id: 'home-200',
        url: `${baseUrl}/`,
        validate: (body, status) => {
            if (status !== 200) return `status ${status}`;
            if (!body.includes('lang="zh-CN"') && !body.includes('lang=zh-CN')) {
                return 'missing zh-CN (legacy SPA?)';
            }
            return null;
        },
    },
    {
        id: 'google-verify',
        url: `${baseUrl}/googleef60eaecd43955c6.html`,
        validate: (body, status) => {
            if (status !== 200) return `status ${status}`;
            if (!body.includes('google-site-verification:')) {
                return 'missing google-site-verification token';
            }
            return null;
        },
    },
    {
        id: 'bing-verify',
        url: `${baseUrl}/BingSiteAuth.xml`,
        validate: (body, status) => {
            if (status !== 200) return `status ${status}`;
            if (!body.includes('<user>')) return 'missing <user> in BingSiteAuth.xml';
            return null;
        },
    },
    {
        id: 'blog-index-links',
        url: `${baseUrl}/blog/`,
        validate: (body, status) => {
            if (status !== 200) return `status ${status}`;
            const prefix = `${baseUrl}/blog/`;
            if (!body.includes(`href="${prefix}`)) {
                return 'missing absolute blog article links under base path';
            }
            if (body.includes('href="/blog/') && !body.includes(`href="${prefix}`)) {
                return 'found /blog/ links without personalWeb base';
            }
            return null;
        },
    },
    {
        id: 'blog-article-200',
        url: `${baseUrl}/blog/2026-06-21-mocode-phase-9/`,
        validate: (body, status) => {
            if (status !== 200) return `status ${status}`;
            if (!body.includes('<article') && !body.includes('prose-blog')) {
                return 'missing article body';
            }
            return null;
        },
    },
];

async function findBaiduVerifyPath() {
    const publicDir = path.join(root, 'public');
    const entries = await readdir(publicDir);
    return entries.find((f) => f.startsWith('baidu_verify_') && f.endsWith('.html'));
}

async function checkOffline(check) {
    const rel = check.url.replace(baseUrl, '').replace(/^\//, '');
    let target;
    if (!rel) {
        target = path.join(distDir, 'index.html');
    } else if (rel.includes('.')) {
        target = path.join(distDir, rel);
    } else {
        target = path.join(distDir, rel, 'index.html');
    }
    if (!existsSync(target)) {
        return { id: check.id, severity: 'error', message: `missing dist file: ${rel || 'index.html'}` };
    }
    const body = await readFile(target, 'utf8');
    const err = check.validate(body, 200);
    if (err) return { id: check.id, severity: 'error', message: err };
    return null;
}

async function checkLive(check) {
    const result = await withRetry(
        async () => {
            const res = await fetch(check.url, { method: 'GET' });
            const body = await res.text();
            const err = check.validate(body, res.status);
            if (err) throw new Error(err);
            return res;
        },
        { label: check.id, retries: 3, delayMs: 2000 }
    );
    return result;
}

async function main() {
    const baiduFile = await findBaiduVerifyPath();
    if (baiduFile) {
        CHECKS.push({
            id: 'baidu-verify',
            url: `${baseUrl}/${baiduFile}`,
            validate: (body, status) => {
                if (status !== 200) return `status ${status}`;
                if (!body.includes('baidu_verify') && !body.trim()) {
                    return 'empty baidu verify file';
                }
                return null;
            },
        });
    }

    /** @type {Array<{ id: string, severity: string, message: string }>} */
    const findings = [];

    for (const check of CHECKS) {
        try {
            if (skipNetwork) {
                const offline = await checkOffline(check);
                if (offline) findings.push(offline);
            } else {
                await checkLive(check);
            }
        } catch (err) {
            findings.push({
                id: check.id,
                severity: 'error',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }

    for (const f of findings) {
        console.log(`ERROR ${f.id}: ${f.message}`);
    }

    const errors = findings.filter((f) => f.severity === 'error');
    console.log(`\nProduction verify: ${errors.length} error(s)`);
    process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
