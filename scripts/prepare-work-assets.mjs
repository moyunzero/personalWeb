#!/usr/bin/env node
/**
 * Derive work-card AVIF/WebP from public/images/{stem}.png (allowlist only).
 * Local encode → commit derivatives; yarn build only checks (D-01, D-04).
 * T-08-01: hardcoded stems + ROOT; no arbitrary CLI output roots.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'public/images');

/** Exactly the 12 curated stems in src/data/projects.js — never glob public/images/. */
const WORK_STEMS = [
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

const TARGET_WIDTH = 640;
const AVIF_QUALITY = 50;
const WEBP_QUALITY = 78;

async function encodeStem(stem) {
    const input = path.join(IMAGES, `${stem}.png`);
    if (!existsSync(input)) {
        throw new Error(`missing source: public/images/${stem}.png`);
    }
    const srcStat = statSync(input);
    if (srcStat.size <= 0) {
        throw new Error(`empty source: public/images/${stem}.png`);
    }

    const outAvif = path.join(IMAGES, `${stem}.avif`);
    const outWebp = path.join(IMAGES, `${stem}.webp`);

    // salary.png may be JPEG bytes; sharp(input) decodes by content, not extension.
    await sharp(input)
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .avif({ quality: AVIF_QUALITY })
        .toFile(outAvif);

    await sharp(input)
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outWebp);

    const avifKb = (statSync(outAvif).size / 1024).toFixed(1);
    const webpKb = (statSync(outWebp).size / 1024).toFixed(1);
    console.log(`  ${stem}: avif ${avifKb} KB, webp ${webpKb} KB`);
}

async function main() {
    console.log(`Preparing work assets → ${path.relative(ROOT, IMAGES)}/ (${WORK_STEMS.length} stems)…`);
    for (const stem of WORK_STEMS) {
        await encodeStem(stem);
    }
    console.log('OK — commit public/images/*.{avif,webp}; PNG sources kept.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
