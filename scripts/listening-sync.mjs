#!/usr/bin/env node
/**
 * 从 Notion 听力打卡库同步「完成」页到 content/listening/*.json
 *
 * 环境变量（.env.local / .env）:
 *   NOTION_TOKEN                    - Integration Token（仅本 CLI / Actions）
 *   NOTION_LISTENING_DATABASE_ID    - 听力库 ID（须与博客库不同，SYNC-03）
 *   NOTION_DATABASE_ID              - 博客库 ID（用于双库隔离校验）
 *   NOTION_LISTENING_DATA_SOURCE_ID - 可选 data source 覆盖
 *   NOTION_LISTENING_PROP_*         - 可选属性名覆盖
 *   NOTION_LISTENING_STATUS_DONE    - 可选「完成」枚举 CSV（默认 完成）
 *
 * 用法:
 *   yarn listening:sync                    # 增量：仅新增或 Notion 有更新的页
 *   yarn listening:sync --all              # 全量 + D-13 清理本地孤儿
 *   yarn listening:sync --page <page_id>   # 仅同步单页
 *   yarn listening:sync --dry-run          # 预览不写文件 / 不删除
 *
 * TTS: Piper + ffmpeg via synthesizeListeningMp3（失败仍写 JSON，无 audioSrc）。
 */
import { access, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@notionhq/client';
import { validateListeningData } from './lib/listening-schema.mjs';
import {
    extractSentence,
    extractTakeaways,
    extractVocab,
} from './lib/listening-blocks.mjs';
import { assertDistinctListeningDatabaseId } from './lib/listening-env-guard.mjs';
import { planStaleListeningDeletes } from './lib/listening-stale.mjs';
import {
    getStatusOrSelectName,
    isListeningDone,
    parseListeningDoneStatuses,
} from './lib/listening-status.mjs';
import { synthesizeListeningMp3 } from './lib/listening-tts.mjs';
import { getDate, getEnv, getTitle, getUrl } from './lib/notion-helpers.mjs';
import { sleep, withRetry } from './lib/retry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const JSON_DIR = path.join(root, 'content/listening');
const AUDIO_DIR = path.join(root, 'public/audio/listening');

async function loadEnvFiles() {
    for (const file of ['.env.local', '.env']) {
        const filePath = path.join(root, file);
        try {
            await access(filePath);
        } catch {
            continue;
        }
        const text = await readFile(filePath, 'utf8');
        for (const line of text.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            let value = trimmed.slice(eq + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = value;
        }
    }
}

await loadEnvFiles();

const PROP = {
    title: getEnv('NOTION_LISTENING_PROP_TITLE') || '听力材料',
    date: getEnv('NOTION_LISTENING_PROP_DATE') || '日期',
    status: getEnv('NOTION_LISTENING_PROP_STATUS') || '打卡状态',
    youtube: getEnv('NOTION_LISTENING_PROP_YOUTUBE') || '来源 / 链接',
};

function parseCli(argv) {
    let dryRun = false;
    let pageId = null;
    let fullSync = false;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--dry-run') dryRun = true;
        if (arg === '--all') fullSync = true;
        if (arg === '--page' && argv[i + 1]) {
            pageId = argv[i + 1];
            i += 1;
        }
    }

    return { dryRun, pageId, fullSync };
}

/**
 * Allow only http/https for youtubeUrl (T-2-03 / D-03).
 * @param {string | null | undefined} url
 * @returns {string | undefined}
 */
function httpOrHttpsUrl(url) {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return undefined;
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return undefined;
        }
        return trimmed;
    } catch {
        return undefined;
    }
}

/**
 * Incremental gate: last_edited_time vs local notionSyncedAt.
 * @param {object[]} pages
 * @param {Map<string, { notionSyncedAt?: string }>} localIndex
 * @param {{ fullSync: boolean }} opts
 */
function selectPagesToSync(pages, localIndex, { fullSync }) {
    if (fullSync) {
        return { toSync: pages, skipped: [] };
    }

    const toSync = [];
    const skipped = [];

    for (const page of pages) {
        const existing = localIndex.get(page.id);

        if (!existing?.notionSyncedAt) {
            toSync.push(page);
            continue;
        }

        const editedAt = new Date(page.last_edited_time).getTime();
        const syncedAt = new Date(existing.notionSyncedAt).getTime();

        if (Number.isNaN(editedAt) || Number.isNaN(syncedAt) || editedAt > syncedAt) {
            toSync.push(page);
        } else {
            skipped.push(page);
        }
    }

    return { toSync, skipped };
}

async function resolveDataSourceId(notion, databaseId) {
    const explicit = getEnv('NOTION_LISTENING_DATA_SOURCE_ID');
    if (explicit) return explicit;

    const db = await withRetry(
        () => notion.databases.retrieve({ database_id: databaseId }),
        { label: '获取听力 Notion 数据库', retries: 5, delayMs: 1500 }
    );
    const sources = db.data_sources;
    if (sources?.length) {
        return sources[0].id;
    }

    return databaseId;
}

async function fetchDatabasePages(notion, databaseId) {
    const dataSourceId = await resolveDataSourceId(notion, databaseId);
    const pages = [];
    let cursor;

    do {
        const response = await withRetry(
            () =>
                notion.dataSources.query({
                    data_source_id: dataSourceId,
                    start_cursor: cursor,
                    page_size: 100,
                    result_type: 'page',
                }),
            { label: '查询听力 Notion 页面列表', retries: 5, delayMs: 1500 }
        );
        for (const page of response.results) {
            if (page.object !== 'page') continue;
            pages.push(page);
        }
        cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return pages;
}

/**
 * @param {object[]} blocks
 * @returns {string | null}
 */
function findVocabTableBlockId(blocks) {
    const list = Array.isArray(blocks) ? blocks : [];
    let afterVocab = false;

    for (const block of list) {
        const type = block?.type;
        let heading = '';
        if (type && String(type).startsWith('heading_')) {
            const rich = block[type]?.rich_text;
            heading = Array.isArray(rich)
                ? rich.map((t) => t.plain_text || '').join('').trim()
                : '';
        }
        if (heading.includes('词汇')) {
            afterVocab = true;
            continue;
        }
        if (!afterVocab) continue;
        if (block?.type === 'table') return block.id || null;
        if (heading) return null;
    }
    return null;
}

async function listAllChildren(notion, blockId, label) {
    const blocks = [];
    let cursor;

    do {
        const response = await withRetry(
            () =>
                notion.blocks.children.list({
                    block_id: blockId,
                    start_cursor: cursor,
                    page_size: 100,
                }),
            { label, retries: 4, delayMs: 1500 }
        );
        blocks.push(...response.results);
        cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return blocks;
}

async function buildLocalListeningIndex() {
    /** @type {Map<string, { notionSyncedAt?: string, filePath: string }>} */
    const index = new Map();
    let files = [];
    try {
        files = (await readdir(JSON_DIR)).filter((f) => f.endsWith('.json'));
    } catch {
        return index;
    }

    for (const file of files) {
        const filePath = path.join(JSON_DIR, file);
        try {
            const data = JSON.parse(await readFile(filePath, 'utf8'));
            const id = typeof data.id === 'string' && data.id ? data.id : path.basename(file, '.json');
            index.set(id, {
                notionSyncedAt: data.notionSyncedAt,
                filePath,
            });
        } catch {
            // skip unreadable / invalid JSON
        }
    }

    return index;
}

/**
 * @param {object} page
 * @param {string[]} doneList
 */
function isPageListeningDone(page, doneList) {
    const props = page.properties || {};
    const statusName = getStatusOrSelectName(props[PROP.status]);
    return isListeningDone(statusName, doneList);
}

async function syncPage(page, ctx) {
    const { notion, dryRun } = ctx;
    const props = page.properties || {};
    const title = getTitle(props[PROP.title]) || '未命名';
    const date = getDate(props[PROP.date]) || new Date().toISOString().slice(0, 10);
    const pageId = page.id;

    console.log(`→ ${title} (${pageId})`);

    const pageBlocks = await listAllChildren(notion, pageId, '拉取听力页块');
    const sentenceResult = extractSentence(pageBlocks);
    if ('skip' in sentenceResult && sentenceResult.skip) {
        console.log('  跳过（无可用 sentence）');
        return { skipped: true };
    }

    let tableRowBlocks = [];
    const tableId = findVocabTableBlockId(pageBlocks);
    if (tableId) {
        tableRowBlocks = await listAllChildren(notion, tableId, '拉取词汇表格行');
    }

    const vocab = extractVocab(pageBlocks, tableRowBlocks);
    const takeaways = extractTakeaways(pageBlocks);
    const youtubeUrl = httpOrHttpsUrl(getUrl(props[PROP.youtube]));

    /** @type {Record<string, unknown>} */
    const entry = {
        id: pageId,
        date,
        title,
        sentence: sentenceResult.sentence,
        vocab,
        takeaways,
        notionSyncedAt: new Date().toISOString(),
    };
    if (youtubeUrl) {
        entry.youtubeUrl = youtubeUrl;
    }

    const validation = validateListeningData(entry);
    if (!validation.success) {
        console.warn(`  ⚠ Zod 校验失败，跳过写入: ${validation.error.message}`);
        return { skipped: true };
    }

    /** @type {Record<string, unknown>} */
    let payload = { ...validation.data };

    if (!dryRun) {
        const tts = synthesizeListeningMp3({
            id: pageId,
            sentence: validation.data.sentence,
            outDir: AUDIO_DIR,
        });
        if (tts.ok) {
            payload = { ...payload, audioSrc: tts.audioSrc };
            console.log(`  ✓ TTS ${tts.audioSrc}`);
        } else {
            // SYNC-02 soft-fail: publish JSON without audioSrc
            console.warn(`  ⚠ TTS 失败，继续写 JSON（无 audioSrc）: ${tts.error}`);
        }
    }

    const outPath = path.join(JSON_DIR, `${pageId}.json`);

    if (dryRun) {
        console.log(`  （dry-run，未写入 ${path.relative(root, outPath)}）`);
        return { skipped: false };
    }

    await mkdir(JSON_DIR, { recursive: true });
    await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`  ✓ 已写入 ${path.relative(root, outPath)}`);
    return { skipped: false };
}

async function applyStaleDeletes(localIds, remoteDoneIds, { dryRun }) {
    const candidates = planStaleListeningDeletes(localIds, remoteDoneIds, {
        jsonDir: JSON_DIR,
        audioDir: AUDIO_DIR,
    });

    if (candidates.length === 0) {
        console.log('无过期听力产物需清理。');
        return;
    }

    if (dryRun) {
        console.log(`--all dry-run：将删除 ${candidates.length} 个路径（未执行）:`);
        for (const p of candidates) {
            console.log(`  - ${path.relative(root, p)}`);
        }
        return;
    }

    for (const p of candidates) {
        try {
            await unlink(p);
            console.log(`  ✓ 已删除过期 ${path.relative(root, p)}`);
        } catch (err) {
            if (err && err.code === 'ENOENT') continue;
            throw err;
        }
    }
}

async function main() {
    const { dryRun, pageId, fullSync } = parseCli(process.argv.slice(2));
    const notionToken = getEnv('NOTION_TOKEN', true);
    const listeningDatabaseId = getEnv('NOTION_LISTENING_DATABASE_ID', true);
    const blogDatabaseId = getEnv('NOTION_DATABASE_ID', true);

    assertDistinctListeningDatabaseId(listeningDatabaseId, blogDatabaseId);

    const notion = new Client({ auth: notionToken });
    const doneList = parseListeningDoneStatuses();
    const localIndex = await buildLocalListeningIndex();

    let pages = [];

    if (pageId) {
        const page = await withRetry(
            () => notion.pages.retrieve({ page_id: pageId }),
            { label: '获取听力 Notion 页面', retries: 5, delayMs: 1500 }
        );
        pages = [page];
        console.log('听力 Notion 单页同步');
    } else {
        console.log('听力 Notion 数据库同步');
        console.log(`数据库: ${listeningDatabaseId}`);
        pages = await fetchDatabasePages(notion, listeningDatabaseId);
    }

    const donePages = pages.filter((page) => isPageListeningDone(page, doneList));

    if (donePages.length === 0) {
        console.log(
            '没有「完成」状态的听力页。请确认库已分享给 Integration，且打卡状态为「完成」。'
        );
        if (fullSync) {
            await applyStaleDeletes([...localIndex.keys()], [], { dryRun });
        }
        return;
    }

    let pagesToProcess = donePages;

    if (!pageId) {
        const { toSync, skipped } = selectPagesToSync(donePages, localIndex, { fullSync });

        if (fullSync) {
            console.log(`全量同步：${donePages.length} 篇完成页${dryRun ? '（预览）' : ''}\n`);
        } else if (toSync.length === 0) {
            console.log(`已检查 ${donePages.length} 篇完成页，本地均已是最新，无需同步。`);
            console.log('  强制全量: yarn listening:sync --all');
            console.log('  单篇同步: yarn listening:sync --page <notion_page_id>');
            return;
        } else {
            console.log(
                `增量同步：${toSync.length} 篇需更新，${skipped.length} 篇未变更已跳过${dryRun ? '（预览）' : ''}\n`
            );
        }

        pagesToProcess = toSync;
    } else {
        if (!isPageListeningDone(pages[0], doneList)) {
            console.log('单页打卡状态不是「完成」，跳过写入。');
            return;
        }
        console.log(`共 1 篇待同步${dryRun ? '（预览）' : ''}\n`);
    }

    let synced = 0;
    const failed = [];

    for (const page of pagesToProcess) {
        try {
            const result = await syncPage(page, { notion, dryRun });
            if (!result.skipped) synced += 1;
            await sleep(350);
        } catch (err) {
            const title = getTitle(page.properties?.[PROP.title]) || page.id;
            failed.push({ title, error: err.message });
            console.error(`  ✗ 同步失败: ${title}`);
            console.error(`    ${err.message}`);
        }
    }

    console.log(`\n完成：${synced} 篇已处理${failed.length ? `，${failed.length} 篇失败` : ''}`);
    if (failed.length) {
        console.log('\n失败列表:');
        for (const item of failed) {
            console.log(`  - ${item.title}: ${item.error}`);
        }
    }

    if (fullSync && !pageId) {
        console.log('\nD-13 过期产物清理（--all）:');
        await applyStaleDeletes(
            [...localIndex.keys()],
            donePages.map((p) => p.id),
            { dryRun }
        );
    }

    if (!dryRun) {
        console.log('\n下一步:');
        console.log('  yarn listening:sync --dry-run   # 预览');
        console.log('  git add content/listening public/audio/listening');
        console.log('  # 勿提交 *.onnx / Piper cache（D-09）');
    }
}

main().catch((err) => {
    console.error('听力 Notion 同步失败:', err.message);
    if (err.code === 'object_not_found') {
        console.error(
            '提示: 请确认 NOTION_LISTENING_DATABASE_ID 正确，且已在 Notion 中将数据库「连接」到你的 Integration。'
        );
    } else if (
        err.message === 'fetch failed' ||
        err.cause?.code === 'ECONNRESET' ||
        err.cause?.code === 'ETIMEDOUT'
    ) {
        console.error('提示: 连接 Notion API 时网络中断，请检查网络/代理后重试。');
    }
    process.exit(1);
});
