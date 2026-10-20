#!/usr/bin/env node
/**
 * Build/CI gate: require committed work-card AVIF/WebP + PNG sources (D-02, D-04).
 * Does not encode; run yarn assets:work locally then commit public/images/.
 * T-08-01: hardcoded stems under public/images only.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = path.join(ROOT, 'public/images');

export const WORK_STEMS = [
    'mocode',
    'gpt',
    'vitadex',
    'blue-ai',
    'xqmo',
    'saleme',
    'keelbook',
    'wlb',
    'salary',
    'lookjob',
    'xiuxian',
    'travel',
];

/** 12× .avif + 12× .webp required for visitors (IMG-01). Literal names for source-scan tests. */
export const REQUIRED_DERIVATIVES = [
    'mocode.avif',
    'mocode.webp',
    'gpt.avif',
    'gpt.webp',
    'vitadex.avif',
    'vitadex.webp',
    'blue-ai.avif',
    'blue-ai.webp',
    'xqmo.avif',
    'xqmo.webp',
    'saleme.avif',
    'saleme.webp',
    'keelbook.avif',
    'keelbook.webp',
    'wlb.avif',
    'wlb.webp',
    'salary.avif',
    'salary.webp',
    'lookjob.avif',
    'lookjob.webp',
    'xiuxian.avif',
    'xiuxian.webp',
    'travel.avif',
    'travel.webp',
];

/** Source PNGs must remain for regen (D-02). */
export const REQUIRED_SOURCES = [
    'mocode.png',
    'gpt.png',
    'vitadex.png',
    'blue-ai.png',
    'xqmo.png',
    'saleme.png',
    'keelbook.png',
    'wlb.png',
    'salary.png',
    'lookjob.png',
    'xiuxian.png',
    'travel.png',
];

function fail(message) {
    console.error(`[check-work-assets] ${message}`);
    console.error(
        'Fix: run `yarn assets:work`, then commit public/images/ (keep .png sources).',
    );
    process.exit(1);
}

function assertPresentNonEmpty(relName) {
    const full = path.join(IMAGES, relName);
    if (!existsSync(full)) {
        fail(`missing ${path.relative(ROOT, full)}`);
    }
    const st = statSync(full);
    if (!st.isFile() || st.size <= 0) {
        fail(`${path.relative(ROOT, full)} is empty or not a file`);
    }
}

function main() {
    if (!existsSync(IMAGES)) {
        fail(`missing directory ${path.relative(ROOT, IMAGES)}`);
    }

    for (const name of REQUIRED_SOURCES) {
        assertPresentNonEmpty(name);
    }
    for (const name of REQUIRED_DERIVATIVES) {
        assertPresentNonEmpty(name);
    }

    console.log(
        `[check-work-assets] ok: ${WORK_STEMS.length} stems × png+avif+webp under public/images/`,
    );
}

main();
