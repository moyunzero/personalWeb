#!/usr/bin/env node
/**
 * 向 IndexNow 提交线上 URL（Bing / Yandex / Naver 等共用同一接口）。
 *
 * 为什么需要它：GitHub Pages 没有服务端钩子，Bing 只能靠自然爬取等待新文章被发现；
 * IndexNow 让部署完成后主动告知搜索引擎「这些 URL 变了」。
 *
 * 用法：
 *   yarn seo:indexnow                # 校验线上密钥文件后提交 dist sitemap 里的全部 URL
 *   yarn seo:indexnow --dry-run      # 只打印将要提交的 URL 与请求体
 *   yarn seo:indexnow --limit 20     # 只提交前 20 条（试跑用）
 *   yarn seo:indexnow --skip-verify  # 跳过密钥文件在线校验
 *   yarn seo:indexnow --strict       # 密钥文件暂时不可达也判失败（默认只告警）
 *
 * 环境变量：
 *   INDEXNOW_KEY       覆盖密钥（默认从 public/<key>.txt 自动发现）
 *   INDEXNOW_ENDPOINT  覆盖接口地址（默认 https://api.indexnow.org/indexnow，可逗号分隔多个）
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './lib/site-config.mjs';
import {
    buildIndexNowPayload,
    buildKeyLocation,
    chunk,
    collectPageUrls,
    findKeyFile,
    isKeyFileValid,
} from './lib/indexnow.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const SITE_URL = String(process.env.PRODUCTION_URL || SITE.url).replace(/\/$/, '');
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';

/** @param {string[]} argv */
function parseArgs(argv) {
    const flags = {
        dryRun: false,
        skipVerify: false,
        strict: false,
        limit: 0,
        key: '',
        endpoints: [],
        verifyAttempts: 6,
        verifyDelayMs: 10000,
        help: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--dry-run') flags.dryRun = true;
        else if (arg === '--skip-verify') flags.skipVerify = true;
        else if (arg === '--strict') flags.strict = true;
        else if (arg === '--help' || arg === '-h') flags.help = true;
        else if (arg === '--limit') flags.limit = Number(argv[++i]) || 0;
        else if (arg === '--key') flags.key = String(argv[++i] ?? '').trim();
        else if (arg === '--endpoint') {
            const value = String(argv[++i] ?? '').trim();
            if (value) flags.endpoints.push(value);
        } else if (arg === '--verify-attempts') {
            flags.verifyAttempts = Math.max(1, Number(argv[++i]) || 1);
        } else if (arg === '--verify-delay') {
            flags.verifyDelayMs = Math.max(0, Number(argv[++i]) || 0);
        } else if (arg.startsWith('--')) {
            throw new Error(`未知参数: ${arg}`);
        }
    }

    if (!flags.endpoints.length) {
        const fromEnv = String(process.env.INDEXNOW_ENDPOINT ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        flags.endpoints = fromEnv.length ? fromEnv : [DEFAULT_ENDPOINT];
    }

    return flags;
}

function printHelp() {
    console.log(`IndexNow 提交
用法: yarn seo:indexnow [--dry-run] [--limit N] [--skip-verify] [--strict] [--key KEY] [--endpoint URL]

默认读取 dist/sitemap*.xml 的 URL，校验 ${SITE_URL}/<key>.txt 可访问后提交。
密钥文件放在 public/<key>.txt（文件名与内容一致）。`);
}

/**
 * @returns {Promise<{ key: string, keyLocation: string }>}
 */
async function resolveKey(override) {
    if (override) {
        return { key: override, keyLocation: buildKeyLocation(SITE_URL, override) };
    }

    const files = await readdir(publicDir);
    const candidates = [];
    for (const name of files) {
        if (!name.toLowerCase().endsWith('.txt')) continue;
        const content = await readFile(path.join(publicDir, name), 'utf8');
        candidates.push({ name, content });
    }

    const found = findKeyFile(candidates);
    if (!found) {
        throw new Error(
            '未找到 IndexNow 密钥文件：请在 public/ 放置 <key>.txt（文件名与内容一致，8–128 位字母数字），或用 INDEXNOW_KEY 指定'
        );
    }
    return { key: found.key, keyLocation: buildKeyLocation(SITE_URL, found.key) };
}

/**
 * @returns {Promise<string[]>}
 */
async function readDistSitemaps() {
    let entries;
    try {
        entries = await readdir(distDir);
    } catch {
        throw new Error('缺少 dist/：请先执行 yarn build');
    }

    const sitemaps = entries.filter((name) => /^sitemap.*\.xml$/i.test(name));
    if (!sitemaps.length) {
        throw new Error('dist/ 下没有 sitemap*.xml：请先执行 yarn build');
    }

    const docs = [];
    for (const name of sitemaps) {
        docs.push(await readFile(path.join(distDir, name), 'utf8'));
    }
    return docs;
}

/**
 * 线上密钥文件必须可访问，否则 IndexNow 会拒绝整批 URL。
 *
 * @param {string} keyLocation
 * @param {string} key
 * @param {{ attempts: number, delayMs: number }} options
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
async function verifyKeyLocation(keyLocation, key, { attempts, delayMs }) {
    let lastReason = '';
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(`${keyLocation}?t=${Date.now()}`, {
                headers: { 'cache-control': 'no-cache' },
            });
            const body = await res.text();
            if (res.status === 200 && isKeyFileValid(body, key)) {
                return { ok: true };
            }
            lastReason = `status ${res.status}${res.status === 200 ? ', 内容与 key 不一致' : ''}`;
        } catch (err) {
            lastReason = err instanceof Error ? err.message : String(err);
        }
        if (attempt < attempts) {
            console.log(
                `  … 密钥文件暂不可用（${lastReason}），${Math.round(delayMs / 1000)}s 后重试 ${attempt}/${attempts}`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return { ok: false, reason: lastReason };
}

/**
 * @param {string} endpoint
 * @param {ReturnType<typeof buildIndexNowPayload>} payload
 * @returns {Promise<{ ok: boolean, status: number, body: string }>}
 */
async function submitPayload(endpoint, payload) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
    });
    const body = await res.text();
    // IndexNow: 200 OK / 202 Accepted 均视为成功（202 = key 校验排队中）
    const ok = res.status === 200 || res.status === 202;
    return { ok, status: res.status, body: body.slice(0, 500) };
}

async function main() {
    const flags = parseArgs(process.argv.slice(2));
    if (flags.help) {
        printHelp();
        return 0;
    }

    const { key, keyLocation } = await resolveKey(flags.key);
    const host = new URL(SITE_URL).host;
    const xmlDocs = await readDistSitemaps();
    let urls = collectPageUrls(xmlDocs, { host, basePath: SITE.basePath });
    if (flags.limit > 0) urls = urls.slice(0, flags.limit);

    console.log(`IndexNow 目标站点: ${SITE_URL}`);
    console.log(`密钥文件: ${keyLocation}`);
    console.log(`待提交 URL: ${urls.length} 条`);

    if (!urls.length) {
        console.log('没有可提交的 URL，跳过。');
        return 0;
    }

    if (flags.dryRun) {
        const payload = buildIndexNowPayload({ urls, key, host, keyLocation });
        console.log('\n[dry-run] 请求体:');
        console.log(JSON.stringify(payload, null, 2));
        return 0;
    }

    if (!flags.skipVerify) {
        const verified = await verifyKeyLocation(keyLocation, key, {
            attempts: flags.verifyAttempts,
            delayMs: flags.verifyDelayMs,
        });
        if (!verified.ok) {
            console.log(
                `⚠ 密钥文件校验未通过（${verified.reason}）。GitHub Pages 刚部署时可能有缓存延迟，稍后可重跑 yarn seo:indexnow。`
            );
            return flags.strict ? 1 : 0;
        }
        console.log('✓ 密钥文件可访问');
    }

    let failures = 0;
    for (const [index, batch] of chunk(urls).entries()) {
        const payload = buildIndexNowPayload({ urls: batch, key, host, keyLocation });
        for (const endpoint of flags.endpoints) {
            try {
                const result = await submitPayload(endpoint, payload);
                if (result.ok) {
                    console.log(
                        `✓ 提交 ${batch.length} 条 → ${endpoint}（${result.status}）${index > 0 ? ` 批次 ${index + 1}` : ''}`
                    );
                } else {
                    failures += 1;
                    console.log(`✗ 提交失败 → ${endpoint}（${result.status}）${result.body}`);
                }
            } catch (err) {
                failures += 1;
                console.log(
                    `✗ 提交异常 → ${endpoint}：${err instanceof Error ? err.message : String(err)}`
                );
            }
        }
    }

    return failures > 0 ? 1 : 0;
}

main()
    .then((code) => {
        process.exit(code);
    })
    .catch((err) => {
        console.error(`IndexNow 提交失败: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    });
