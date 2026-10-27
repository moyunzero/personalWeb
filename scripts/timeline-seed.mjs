#!/usr/bin/env node
/**
 * 一次性：把 content/timeline/events.json 灌进 Notion「大模型时间轴」库。
 * 用法: node scripts/timeline-seed.mjs [--dry-run]
 */
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@notionhq/client';
import { getEnv } from './lib/notion-helpers.mjs';
import { sleep, withRetry } from './lib/retry.mjs';
import { TRACK_TO_NOTION, TIER_TO_HEAT } from './lib/timeline-map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const EVENTS_FILE = path.join(root, 'content/timeline/events.json');

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

function toIsoDate(dateLabel, year) {
    const nums = String(dateLabel).match(/\d+/g)?.map(Number) ?? [];
    const y = Number(year) || nums[0] || 2020;
    let m = nums[1] > 0 && nums[1] <= 12 ? nums[1] : 1;
    let d = nums[2] > 0 && nums[2] <= 31 ? nums[2] : 1;
    if (/上半年/.test(dateLabel)) m = 1;
    if (/(年中|中后)/.test(dateLabel)) m = 6;
    if (/年底/.test(dateLabel)) m = 12;
    if (/下旬/.test(dateLabel)) d = 20;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const token = getEnv('NOTION_TOKEN', true);
    const databaseId = getEnv('NOTION_TIMELINE_DATABASE_ID', true);
    const notion = new Client({ auth: token });
    const file = JSON.parse(await readFile(EVENTS_FILE, 'utf8'));
    const events = file.events || [];
    console.log(`将写入 ${events.length} 条到 Notion`);
    if (dryRun) return;

    let ok = 0;
    for (const event of events) {
        const tracks = (event.tracks || [])
            .map((t) => TRACK_TO_NOTION[t])
            .filter(Boolean);
        const heat = TIER_TO_HEAT[event.tier] || '谱系';
        await withRetry(
            () =>
                notion.pages.create({
                    parent: { database_id: databaseId },
                    properties: {
                        事件: {
                            title: [{ text: { content: event.title.slice(0, 2000) } }],
                        },
                        日期标注: {
                            rich_text: [{ text: { content: event.date.slice(0, 2000) } }],
                        },
                        年份: { number: Number(event.year) || null },
                        排序日期: {
                            date: { start: toIsoDate(event.date, event.year) },
                        },
                        分类: { select: { name: event.category } },
                        赛道: { multi_select: tracks.map((name) => ({ name })) },
                        热度: { select: { name: heat } },
                        摘要: {
                            rich_text: event.summary
                                ? [{ text: { content: event.summary.slice(0, 2000) } }]
                                : [],
                        },
                        状态: { status: { name: 'Published' } },
                    },
                }),
            { label: event.title.slice(0, 40), retries: 6, delayMs: 1200 }
        );
        ok += 1;
        if (ok % 20 === 0) console.log(`  … ${ok}/${events.length}`);
        await sleep(280);
    }
    console.log(`完成 ${ok}/${events.length}`);
}

main().catch((err) => {
    console.error(err.body || err.message || err);
    process.exit(1);
});
