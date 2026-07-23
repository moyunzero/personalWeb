#!/usr/bin/env node
/**
 * Build/CI gate: require committed web/ cosmos derivatives (AC-7)
 * and spectacle pyjama-shark pack ≤ 2.5 MB (spec 0005 AC-7).
 * Does not regenerate assets; run yarn assets:cosmos / assets:spectacle locally.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'public/threejs-assets/web');
const SPECTACLE_DIR = path.join(WEB, 'spectacle/pyjama-shark');
const BUDGET_BYTES = 8 * 1024 * 1024;
export const SPECTACLE_BUDGET_BYTES = Math.floor(2.5 * 1024 * 1024);

/** Files the runtime island and poster fallback request. */
export const REQUIRED_WEB_FILES = [
    'hdr_blue_nebulae.hdr',
    'hdr_blue_nebulae_poster.webp',
    'sun.jpg',
    'moon.jpg',
    'mercury.jpg',
    'venus.jpg',
    'venus_atmosphere.jpg',
    'earth_day.jpg',
    'earth_night.jpg',
    'earth_clouds.jpg',
    'mars.jpg',
    'jupiter.jpg',
    'saturn.jpg',
    'saturn_ring.png',
    'uranus.jpg',
    'neptune.jpg',
];

export const REQUIRED_SPECTACLE_FILES = ['model.glb'];

function fail(message) {
    console.error(`[check-cosmos-assets] ${message}`);
    console.error(
        'Fix: run `yarn assets:cosmos` (and `yarn assets:spectacle` for the shark), then commit public/threejs-assets/web/.',
    );
    process.exit(1);
}

function dirFileBytes(dir) {
    let total = 0;
    for (const name of readdirSync(dir)) {
        if (name.startsWith('.')) continue;
        const full = path.join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) {
            total += dirFileBytes(full);
        } else if (st.isFile()) {
            if (st.size <= 0) fail(`${path.relative(WEB, full)} is empty`);
            if (/^8k_/i.test(name) || /HDR_multi/i.test(name) || /\.blend$/i.test(name)) {
                fail(`forbidden source-like file in web/: ${path.relative(WEB, full)}`);
            }
            total += st.size;
        }
    }
    return total;
}

function main() {
    if (!existsSync(WEB)) {
        fail(`missing directory ${path.relative(ROOT, WEB)}`);
    }

    const names = new Set(readdirSync(WEB));
    const missing = REQUIRED_WEB_FILES.filter((name) => !names.has(name));
    if (missing.length) {
        fail(`missing files: ${missing.join(', ')}`);
    }

    let cosmosTotal = 0;
    for (const name of names) {
        if (name.startsWith('.')) continue;
        if (name === 'spectacle') continue;
        const full = path.join(WEB, name);
        const st = statSync(full);
        if (!st.isFile()) continue;
        if (st.size <= 0) fail(`${name} is empty`);
        if (/^8k_/i.test(name) || /HDR_multi/i.test(name) || /\.blend$/i.test(name)) {
            fail(`forbidden source-like file in web/: ${name}`);
        }
        cosmosTotal += st.size;
    }

    if (cosmosTotal > BUDGET_BYTES) {
        fail(
            `web/ cosmos total ${(cosmosTotal / (1024 * 1024)).toFixed(2)} MB exceeds ${(BUDGET_BYTES / (1024 * 1024)).toFixed(0)} MB budget`,
        );
    }

    if (!existsSync(SPECTACLE_DIR)) {
        fail(`missing directory ${path.relative(ROOT, SPECTACLE_DIR)}`);
    }
    const spectacleNames = new Set(readdirSync(SPECTACLE_DIR));
    const spectacleMissing = REQUIRED_SPECTACLE_FILES.filter((n) => !spectacleNames.has(n));
    if (spectacleMissing.length) {
        fail(`missing spectacle files: ${spectacleMissing.join(', ')}`);
    }
    const spectacleTotal = dirFileBytes(SPECTACLE_DIR);
    if (spectacleTotal > SPECTACLE_BUDGET_BYTES) {
        fail(
            `spectacle/pyjama-shark ${(spectacleTotal / (1024 * 1024)).toFixed(2)} MB exceeds ${(SPECTACLE_BUDGET_BYTES / (1024 * 1024)).toFixed(1)} MB budget`,
        );
    }

    console.log(
        `[check-cosmos-assets] ok: ${REQUIRED_WEB_FILES.length} cosmos files (${(cosmosTotal / (1024 * 1024)).toFixed(2)} MB / ${(BUDGET_BYTES / (1024 * 1024)).toFixed(0)} MB), spectacle ${(spectacleTotal / (1024 * 1024)).toFixed(2)} MB / ${(SPECTACLE_BUDGET_BYTES / (1024 * 1024)).toFixed(1)} MB`,
    );
}

main();
