#!/usr/bin/env node
/**
 * Build/CI gate: require committed web/ cosmos derivatives (AC-7).
 * Does not regenerate assets; run `yarn assets:cosmos` locally when sources change.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'public/threejs-assets/web');
const BUDGET_BYTES = 8 * 1024 * 1024;

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

function fail(message) {
    console.error(`[check-cosmos-assets] ${message}`);
    console.error('Fix: run `yarn assets:cosmos` (needs assets/threejs-source locally), then commit public/threejs-assets/web/.');
    process.exit(1);
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

    let total = 0;
    for (const name of names) {
        if (name.startsWith('.')) continue;
        const full = path.join(WEB, name);
        const size = statSync(full).size;
        if (size <= 0) {
            fail(`${name} is empty`);
        }
        if (/^8k_/i.test(name) || /HDR_multi/i.test(name) || /\.blend$/i.test(name)) {
            fail(`forbidden source-like file in web/: ${name}`);
        }
        total += size;
    }

    if (total > BUDGET_BYTES) {
        fail(`web/ total ${(total / (1024 * 1024)).toFixed(2)} MB exceeds ${(BUDGET_BYTES / (1024 * 1024)).toFixed(0)} MB budget`);
    }

    console.log(
        `[check-cosmos-assets] ok: ${REQUIRED_WEB_FILES.length} required files, ${(total / (1024 * 1024)).toFixed(2)} MB / ${(BUDGET_BYTES / (1024 * 1024)).toFixed(0)} MB`,
    );
}

main();
