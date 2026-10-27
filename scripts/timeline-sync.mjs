#!/usr/bin/env node
/**
 * 从 Notion「大模型时间轴」库同步 Published 行到 content/timeline/events.json
 *
 * 环境变量（.env.local / .env）:
 *   NOTION_TOKEN
 *   NOTION_DATABASE_ID
 *   NOTION_TIMELINE_DATABASE_ID
 *   NOTION_LISTENING_DATABASE_ID     - 可选，仅用于三库隔离校验
 *   NOTION_TIMELINE_DATA_SOURCE_ID   - 可选
 *
 * 用法:
 *   yarn timeline:sync
 *   yarn timeline:sync --dry-run
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@notionhq/client';
import { getEnv, getRichText, getSelect, getTitle, getUrl, isPublishedStatus, parsePublishedStatuses } from './lib/notion-helpers.mjs';
import { getStatusOrSelectName } from './lib/listening-status.mjs';
import { sleep, withRetry } from './lib/retry.mjs';
import { assertDistinctTimelineDatabaseId } from './lib/timeline-env-guard.mjs';
import { tracksFromNotion, timelineSortKey, HEAT_TO_TIER } from './lib/timeline-map.mjs';
import { validateTimelineFile } from './lib/timeline-schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const OUT_DIR = path.join(root, 'content/timeline');
const OUT_FILE = path.join(OUT_DIR, 'events.json');

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
    title: getEnv('NOTION_TIMELINE_PROP_TITLE') || '事件',
    date: getEnv('NOTION_TIMELINE_PROP_DATE') || '日期标注',
    year: getEnv('NOTION_TIMELINE_PROP_YEAR') || '年份',
    sort: getEnv('NOTION_TIMELINE_PROP_SORT') || '排序日期',
    category: getEnv('NOTION_TIMELINE_PROP_CATEGORY') || '分类',
    tracks: getEnv('NOTION_TIMELINE_PROP_TRACKS') || '赛道',
    heat: getEnv('NOTION_TIMELINE_PROP_HEAT') || '热度',
    summary: getEnv('NOTION_TIMELINE_PROP_SUMMARY') || '摘要',
    status: getEnv('NOTION_TIMELINE_PROP_STATUS') || '状态',
    sourceUrl: getEnv('NOTION_TIMELINE_PROP_SOURCE_URL') || '官方链接',
};

function parseCli(argv) {
    return { dryRun: argv.includes('--dry-run') };
}

function getNumber(prop) {
    if (!prop || prop.type !== 'number') return null;
    return typeof prop.number === 'number' ? prop.number : null;
}

function getMultiSelectNames(prop) {
    if (!prop || prop.type !== 'multi_select') return [];
    return prop.multi_select.map((o) => o.name);
}

async function resolveDataSourceId(notion, databaseId) {
    const explicit = getEnv('NOTION_TIMELINE_DATA_SOURCE_ID');
    if (explicit) return explicit;

    const db = await withRetry(
        () => notion.databases.retrieve({ database_id: databaseId }),
        { label: '获取时间轴 Notion 数据库', retries: 5, delayMs: 1500 }
    );
    const sources = db.data_sources;
    if (sources?.length) return sources[0].id;
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
            { label: '查询时间轴 Notion 页面列表', retries: 5, delayMs: 1500 }
        );
        for (const page of response.results) {
            if (page.object !== 'page') continue;
            pages.push(page);
        }
        cursor = response.has_more ? response.next_cursor : undefined;
        if (cursor) await sleep(200);
    } while (cursor);

    return pages;
}

function pageToEvent(page, publishedList) {
    const props = page.properties || {};
    const statusName = getStatusOrSelectName(props[PROP.status]);
    if (!isPublishedStatus(statusName, publishedList)) return null;

    const title = getTitle(props[PROP.title]).trim();
    if (!title) return null;

    const date = (getRichText(props[PROP.date]) || '').trim();
    const yearNum = getNumber(props[PROP.year]);
    const year = yearNum ? String(Math.trunc(yearNum)) : date.match(/\d{4}/)?.[0] || '';
    const tracks = tracksFromNotion(getMultiSelectNames(props[PROP.tracks]));
    const heat = getSelect(props[PROP.heat]) || '谱系';
    const tier = HEAT_TO_TIER[heat] ?? 0;

    if (!date || !year || tracks.length === 0) return null;

    const sourceUrl = getUrl(props[PROP.sourceUrl]) || undefined;

    return {
        id: page.id,
        date,
        year,
        sort: timelineSortKey(date, year),
        category: getSelect(props[PROP.category]) || '术语/范式',
        title,
        summary: getRichText(props[PROP.summary]) || '',
        tracks,
        tier,
        ...(sourceUrl ? { sourceUrl } : {}),
    };
}

async function main() {
    const { dryRun } = parseCli(process.argv.slice(2));
    const notionToken = getEnv('NOTION_TOKEN', true);
    const blogDatabaseId = getEnv('NOTION_DATABASE_ID', true);
    const timelineDatabaseId = getEnv('NOTION_TIMELINE_DATABASE_ID', true);
    const listeningDatabaseId = getEnv('NOTION_LISTENING_DATABASE_ID');
    assertDistinctTimelineDatabaseId(timelineDatabaseId, blogDatabaseId, listeningDatabaseId);

    const notion = new Client({ auth: notionToken });
    const publishedList = parsePublishedStatuses();
    const pages = await fetchDatabasePages(notion, timelineDatabaseId);
    const events = [];

    for (const page of pages) {
        const event = pageToEvent(page, publishedList);
        if (event) events.push(event);
    }

    events.sort((a, b) => a.sort - b.sort || a.date.localeCompare(b.date, 'zh'));

    const payload = {
        generatedAt: new Date().toISOString(),
        events,
    };
    const parsed = validateTimelineFile(payload);
    if (!parsed.success) {
        console.error(parsed.error.flatten());
        throw new Error('时间轴 JSON 校验失败');
    }

    console.log(`Notion 行 ${pages.length} · 已发布 ${events.length}`);
    if (dryRun) {
        console.log('dry-run：不写文件');
        return;
    }

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(OUT_FILE, `${JSON.stringify(parsed.data, null, 2)}\n`);
    console.log(`已写入 ${path.relative(root, OUT_FILE)}`);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
