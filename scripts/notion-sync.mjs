#!/usr/bin/env node
/**
 * 从 Notion 数据库同步文章到 content/posts/*.md
 *
 * 环境变量（.env.local）:
 *   NOTION_TOKEN          - Integration Token
 *   NOTION_DATABASE_ID    - 博客数据库 ID
 *
 * 用法:
 *   yarn notion:sync                    # 增量：仅新增或 Notion 有更新的文章
 *   yarn notion:sync --all              # 全量：重新同步全部已发布文章
 *   yarn notion:sync --page <page_id>   # 仅同步单页（Notion 页面 URL 里的 id）
 *   yarn notion:sync --dry-run          # 预览不写文件
 */
import { access, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { stringifyFrontmatter, parseFrontmatter } from '../src/blog/frontmatter.js';
import {
    buildPostSlug,
    buildSlugRegistry,
    ensureUniqueSlug,
    getCoverUrl,
    getDate,
    getEnv,
    getMultiSelect,
    getRichText,
    getSelect,
    getTitle,
    isPublishedStatus,
    loadCategoryIndex,
    normalizeCategories,
    parsePublishedStatuses,
} from './lib/notion-helpers.mjs';
import {
    downloadCoverImage,
    downloadMarkdownImages,
} from './lib/download-markdown-images.mjs';
import { sleep, withRetry } from './lib/retry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
    title: getEnv('NOTION_PROP_TITLE') || 'Title',
    slug: getEnv('NOTION_PROP_SLUG') || 'Slug',
    date: getEnv('NOTION_PROP_DATE') || 'Date',
    categories: getEnv('NOTION_PROP_CATEGORIES') || 'Categories',
    tags: getEnv('NOTION_PROP_TAGS') || 'Tags',
    description: getEnv('NOTION_PROP_DESCRIPTION') || 'Description',
    status: getEnv('NOTION_PROP_STATUS') || 'Status',
    cover: getEnv('NOTION_PROP_COVER') || 'Cover',
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
 * 对比 Notion last_edited_time 与本地 notionSyncedAt，筛出需要同步的页面
 */
function selectPagesToSync(pages, notionIdIndex, { fullSync }) {
    if (fullSync) {
        return { toSync: pages, skipped: [] };
    }

    const toSync = [];
    const skipped = [];

    for (const page of pages) {
        const existing = notionIdIndex.get(page.id);

        if (!existing) {
            toSync.push(page);
            continue;
        }

        if (!existing.notionSyncedAt) {
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

function extractPageMeta(page, categoryIndex) {
    const props = page.properties;
    const title = getTitle(props[PROP.title]) || '未命名';
    const status = getSelect(props[PROP.status]);
    const description = getRichText(props[PROP.description]);
    const date =
        getDate(props[PROP.date]) || new Date().toISOString().slice(0, 10);
    const slugFromProp = getRichText(props[PROP.slug]).trim();
    const { categories, warnings } = normalizeCategories(
        getMultiSelect(props[PROP.categories]),
        categoryIndex
    );
    const tags = getMultiSelect(props[PROP.tags]);
    const coverUrl = getCoverUrl(props[PROP.cover]);

    return {
        notionId: page.id,
        title,
        status,
        description,
        date,
        slugFromProp,
        categories,
        tags,
        coverUrl,
        warnings,
    };
}

async function resolveDataSourceId(notion, databaseId) {
    const explicit = getEnv('NOTION_DATA_SOURCE_ID');
    if (explicit) return explicit;

    const db = await withRetry(
        () => notion.databases.retrieve({ database_id: databaseId }),
        { label: '获取 Notion 数据库', retries: 5, delayMs: 1500 }
    );
    const sources = db.data_sources;
    if (sources?.length) {
        return sources[0].id;
    }

    // 兼容：用户可能直接粘贴了 data source ID
    return databaseId;
}

function buildStatusFilter(publishedStatuses) {
    if (publishedStatuses.length === 0) return undefined;
    if (publishedStatuses.length === 1) {
        return {
            property: PROP.status,
            select: { equals: publishedStatuses[0] },
        };
    }
    return {
        or: publishedStatuses.map((name) => ({
            property: PROP.status,
            select: { equals: name },
        })),
    };
}

async function fetchDatabasePages(notion, databaseId, publishedStatuses) {
    const dataSourceId = await resolveDataSourceId(notion, databaseId);
    const statusFilter = buildStatusFilter(publishedStatuses);
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
                    ...(statusFilter ? { filter: statusFilter } : {}),
                }),
            { label: '查询 Notion 页面列表', retries: 5, delayMs: 1500 }
        );
        for (const page of response.results) {
            if (page.object !== 'page') continue;
            pages.push(page);
        }
        cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return pages;
}

async function removeStalePostFile(existing, newSlug, rootDir) {
    if (!existing?.filePath || !existing.slug) return;
    if (existing.slug === newSlug) return;

    try {
        await unlink(existing.filePath);
        console.log(`  ✓ 已删除旧文件 ${path.basename(existing.filePath)}（slug 已更新）`);
    } catch {
        // 文件可能已被覆盖或不存在
    }
}

async function syncPage(page, ctx) {
    const {
        notion,
        n2m,
        notionToken,
        categoryIndex,
        notionIdIndex,
        usedSlugs,
        dryRun,
        publishedStatuses,
    } = ctx;

    const meta = extractPageMeta(page, categoryIndex);

    if (meta.status && !isPublishedStatus(meta.status, publishedStatuses)) {
        console.log(`  跳过（未发布）: ${meta.title}`);
        return { skipped: true };
    }

    const existing = notionIdIndex.get(meta.notionId);
    if (existing?.slug) {
        usedSlugs.delete(existing.slug);
    }

    let slug = buildPostSlug({
        title: meta.title,
        date: meta.date,
        notionId: meta.notionId,
        slugFromProp: meta.slugFromProp,
        existingSlug: existing?.slug,
    });
    slug = ensureUniqueSlug(slug, usedSlugs, meta.notionId);

    const imageDir = path.join(root, 'public/images/blog', slug);
    const postPath = path.join(root, 'content/posts', `${slug}.md`);

    console.log(`→ ${meta.title} (${slug})`);

    for (const w of meta.warnings) {
        console.warn(`  ⚠ ${w}`);
    }

    const mdBlocks = await withRetry(
        () => n2m.pageToMarkdown(meta.notionId),
        { label: '拉取正文', retries: 4, delayMs: 2500 }
    );
    const mdString = n2m.toMarkdownString(mdBlocks);
    let body = (mdString.parent || '').trim();

    if (!dryRun) {
        await removeStalePostFile(existing, slug, root);

        const imgResult = await downloadMarkdownImages(body, {
            slug,
            imageDir,
            notionToken,
        });
        body = imgResult.markdown;
        if (imgResult.downloaded > 0) {
            console.log(`  ✓ 已下载 ${imgResult.downloaded} 张正文图片`);
        }

        let coverPath;
        if (meta.coverUrl) {
            coverPath = await downloadCoverImage(meta.coverUrl, {
                slug,
                imageDir,
                notionToken,
            });
        }

        const frontmatter = {
            title: meta.title,
            slug,
            description: meta.description,
            author: getEnv('NOTION_DEFAULT_AUTHOR') || '墨韵',
            date: meta.date,
            categories: meta.categories,
            tags: meta.tags,
            ...(coverPath ? { cover: coverPath } : {}),
            draft: false,
            notionId: meta.notionId,
            notionSyncedAt: new Date().toISOString(),
        };

        const fileContent = stringifyFrontmatter(body, frontmatter);
        await mkdir(path.dirname(postPath), { recursive: true });
        await mkdir(imageDir, { recursive: true });
        await writeFile(postPath, fileContent, 'utf8');
        console.log(`  ✓ 已写入 content/posts/${slug}.md`);

        notionIdIndex.set(meta.notionId, { slug, filePath: postPath });
    } else {
        console.log(`  （dry-run，未写入文件，正文约 ${body.length} 字符）`);
    }

    return { skipped: false, slug };
}

/** 删除 slug 迁移后遗留的重复 Notion 文章文件 */
async function cleanupDuplicateNotionFiles(notionIdIndex) {
    const postsDir = path.join(root, 'content/posts');
    let files = [];
    try {
        files = (await readdir(postsDir)).filter((f) => f.endsWith('.md'));
    } catch {
        return 0;
    }

    let removed = 0;
    for (const file of files) {
        const filePath = path.join(postsDir, file);
        const raw = await readFile(filePath, 'utf8');
        const { data } = parseFrontmatter(raw);
        if (!data.notionId) continue;

        const canonical = notionIdIndex.get(data.notionId);
        if (canonical?.filePath === filePath) continue;

        await unlink(filePath);
        removed += 1;
        console.log(`  ✓ 已清理过期文件 ${file}`);
    }

    return removed;
}

async function main() {
    const { dryRun, pageId, fullSync } = parseCli(process.argv.slice(2));
    const notionToken = getEnv('NOTION_TOKEN', true);
    const databaseId = getEnv('NOTION_DATABASE_ID', !pageId);

    const notion = new Client({ auth: notionToken });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    const publishedStatuses = parsePublishedStatuses();
    const categoryIndex = await loadCategoryIndex();
    const { notionIdIndex, usedSlugs } = await buildSlugRegistry();

    const ctx = {
        notion,
        n2m,
        notionToken,
        categoryIndex,
        notionIdIndex,
        usedSlugs,
        dryRun,
        publishedStatuses,
    };

    let pages = [];

    if (pageId) {
        const page = await withRetry(
            () => notion.pages.retrieve({ page_id: pageId }),
            { label: '获取 Notion 页面', retries: 5, delayMs: 1500 }
        );
        pages = [page];
        console.log('Notion 单页同步');
    } else {
        console.log('Notion 数据库同步');
        console.log(`数据库: ${databaseId}`);
        pages = await fetchDatabasePages(notion, databaseId, publishedStatuses);
    }

    if (pages.length === 0) {
        console.log('没有可同步的页面。请确认数据库已分享给 Integration，且 Status 为「Published」或「已发布」。');
        return;
    }

    let pagesToProcess = pages;

    if (!pageId) {
        const { toSync, skipped } = selectPagesToSync(pages, notionIdIndex, { fullSync });

        if (fullSync) {
            console.log(`全量同步：${pages.length} 篇${dryRun ? '（预览）' : ''}\n`);
        } else if (toSync.length === 0) {
            console.log(`已检查 ${pages.length} 篇，本地均已是最新，无需同步。`);
            console.log('  强制全量: yarn notion:sync --all');
            console.log('  单篇同步: yarn notion:sync --page <notion_page_id>');
            return;
        } else {
            console.log(
                `增量同步：${toSync.length} 篇需更新，${skipped.length} 篇未变更已跳过${dryRun ? '（预览）' : ''}\n`
            );
        }

        pagesToProcess = toSync;
    } else {
        console.log(`共 ${pages.length} 篇待同步${dryRun ? '（预览）' : ''}\n`);
    }

    let synced = 0;
    const failed = [];

    for (const page of pagesToProcess) {
        try {
            const result = await syncPage(page, ctx);
            if (!result.skipped) synced += 1;
            await sleep(350);
        } catch (err) {
            const title = getTitle(page.properties[PROP.title]) || page.id;
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

    if (!dryRun) {
        const removed = await cleanupDuplicateNotionFiles(notionIdIndex);
        if (removed > 0) {
            console.log(`\n已清理 ${removed} 个过期/重复的 Markdown 文件`);
        }
    }
    if (!dryRun) {
        console.log('\n下一步:');
        console.log('  yarn dev          # 本地预览');
        console.log('  git add content/posts public/images/blog');
        console.log('  git commit -m "post: sync from Notion" && git push');
    }
}

main().catch((err) => {
    console.error('Notion 同步失败:', err.message);
    if (err.code === 'object_not_found') {
        console.error('提示: 请确认 NOTION_DATABASE_ID 正确，且已在 Notion 中将数据库「连接」到你的 Integration。');
    } else if (
        err.message === 'fetch failed' ||
        err.cause?.code === 'ECONNRESET' ||
        err.cause?.code === 'ETIMEDOUT'
    ) {
        console.error('提示: 连接 Notion API 时网络中断，请检查网络/代理后重试。');
    }
    process.exit(1);
});
