#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPosts } from './lib/scan-posts.mjs';
import { rankPosts } from './lib/top-n-score.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const queuePath = path.join(root, 'content/top-n-queue.json');

function parseArgs(argv) {
    const flags = { dryRun: true, write: false, limit: 20 };
    for (const arg of argv) {
        if (arg === '--write') {
            flags.write = true;
            flags.dryRun = false;
        } else if (arg === '--dry-run') {
            flags.dryRun = true;
            flags.write = false;
        } else if (arg.startsWith('--limit=')) {
            flags.limit = Number(arg.slice('--limit='.length));
        }
    }
    return flags;
}

async function main() {
    const flags = parseArgs(process.argv.slice(2));
    const posts = await scanPosts();
    const ranked = rankPosts(posts, { limit: flags.limit });

    console.log(`Top ${ranked.length} posts (no-ga-fallback-v1)\n`);
    console.log('score\tslug\ttitle');
    for (const row of ranked) {
        console.log(
            `${row.score}\t${row.post.data.slug}\t${String(row.post.data.title).slice(0, 50)}`
        );
    }

    if (flags.write) {
        const payload = {
            generatedAt: new Date().toISOString().slice(0, 10),
            method: 'no-ga-fallback-v1',
            posts: ranked.map((row, index) => ({
                slug: row.post.data.slug,
                score: row.score,
                rank: index + 1,
                title: row.post.data.title,
            })),
        };
        await writeFile(queuePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        console.log(`\nWrote ${queuePath}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
