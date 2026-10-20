/**
 * Wave 0 / IMG-01 — work card AVIF/WebP asset contracts (D-01…D-04).
 * Source-scan style (see cosmic-starfield-island.test.ts). Red until 08-01 lands.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

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
] as const;

const projectCardPath = path.resolve('src/components/home/ProjectCard.astro');
const projectsPath = path.resolve('src/data/projects.js');
const checkPath = path.resolve('scripts/check-work-assets.mjs');
const preparePath = path.resolve('scripts/prepare-work-assets.mjs');
const packagePath = path.resolve('package.json');
const imagesDir = path.resolve('public/images');
const distIndex = path.resolve('dist/index.html');

/** Forbidden image encoder package names (sharp is already locked). */
const FORBIDDEN_ENCODERS = [
    'imagemin',
    'squoosh',
    '@squoosh/lib',
    'jimp',
    'canvas',
    'gm',
    'graphicsmagick',
    'fluent-ffmpeg',
    'ffmpeg-static',
    'avif',
    'webp-converter',
    'cwebp',
    'sharp-cli',
] as const;

describe('ProjectCard work image markup (IMG-01, D-02, D-03)', () => {
    it('uses picture + AVIF source, lazy load, aspect and contain (not cover crop)', () => {
        const source = readFileSync(projectCardPath, 'utf8');
        expect(source).toMatch(/<picture>/);
        expect(source).toMatch(/type=["']image\/avif["']/);
        expect(source).toMatch(/loading=["']lazy["']/);
        expect(source).toMatch(/aspect-\[16\/10\]/);
        expect(source).toMatch(/object-contain/);
        expect(source).not.toMatch(/object-cover/);
    });
});

describe('projects.js imgSrc paths (D-02)', () => {
    it('points every imgSrc at .webp and not stem PNGs', () => {
        const source = readFileSync(projectsPath, 'utf8');
        const imgSrcLines = source
            .split('\n')
            .filter((line) => /imgSrc\s*:/.test(line));

        expect(imgSrcLines.length).toBe(WORK_STEMS.length);

        for (const line of imgSrcLines) {
            expect(line).toMatch(/\.webp[`'"]?\s*,?\s*$/);
            expect(line).not.toMatch(/images\/[a-z0-9-]+\.png/i);
        }

        for (const stem of WORK_STEMS) {
            expect(source).toMatch(
                new RegExp(`imgSrc:\\s*\`\\$\\{base\\}images/${stem}\\.webp\``),
            );
        }
    });
});

describe('check-work-assets.mjs gate (D-04)', () => {
    it('exists, hard-fails, requires 12 stem avif+webp and png sources, hints yarn assets:work', () => {
        expect(existsSync(checkPath)).toBe(true);
        const gate = readFileSync(checkPath, 'utf8');
        expect(gate).toMatch(/process\.exit\(1\)/);
        expect(gate).toMatch(/yarn assets:work/);

        for (const stem of WORK_STEMS) {
            expect(gate).toContain(`${stem}.avif`);
            expect(gate).toContain(`${stem}.webp`);
            expect(gate).toContain(`${stem}.png`);
        }
    });
});

describe('prepare-work-assets.mjs encode contract (D-01, D-04)', () => {
    it('uses sharp resize 640 withoutEnlargement and writes avif/webp under public/images allowlist', () => {
        expect(existsSync(preparePath)).toBe(true);
        const prep = readFileSync(preparePath, 'utf8');
        expect(prep).toMatch(/sharp/);
        expect(prep).toMatch(/640/);
        expect(prep).toMatch(/withoutEnlargement/);
        expect(prep).toMatch(/\.avif|avif\s*\(/);
        expect(prep).toMatch(/\.webp|webp\s*\(/);
        expect(prep).toMatch(/public\/images/);

        for (const stem of WORK_STEMS) {
            expect(prep).toContain(stem);
        }
    });
});

describe('package.json work asset scripts (D-04, T-08-SC)', () => {
    it('wires assets:work / assets:work:check scripts', () => {
        const pkgText = readFileSync(packagePath, 'utf8');
        const pkg = JSON.parse(pkgText) as {
            scripts: Record<string, string>;
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };

        expect(pkg.scripts['assets:work']).toBeTruthy();
        expect(pkg.scripts['assets:work:check']).toBeTruthy();
        expect(pkg.scripts['assets:work']).toMatch(/prepare-work-assets\.mjs/);
        expect(pkg.scripts['assets:work:check']).toMatch(/check-work-assets\.mjs/);
        // build gate wired in 08-01 task 3 — must never call prepare
        expect(pkg.scripts.build).not.toMatch(/prepare-work-assets\.mjs/);
    });

    // Restored + asserted in 08-01 task 3 (build gate wiring).
    it.skip('build runs check-work-assets after cosmos and never prepares', () => {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as {
            scripts: Record<string, string>;
        };
        expect(pkg.scripts.build).toMatch(/check-work-assets\.mjs/);
        expect(pkg.scripts.build).not.toMatch(/prepare-work-assets\.mjs/);
    });

    it('does not add encoder packages beyond locked sharp', () => {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };
        const names = new Set([
            ...Object.keys(pkg.dependencies ?? {}),
            ...Object.keys(pkg.devDependencies ?? {}),
        ]);
        expect(names.has('sharp')).toBe(true);
        for (const name of FORBIDDEN_ENCODERS) {
            expect(names.has(name), `unexpected encoder package: ${name}`).toBe(false);
        }
    });
});

describe('public/images work derivatives on disk (D-01, D-04)', () => {
    it('keeps png sources and non-empty avif+webp for all 12 stems', () => {
        for (const stem of WORK_STEMS) {
            const png = path.join(imagesDir, `${stem}.png`);
            const avif = path.join(imagesDir, `${stem}.avif`);
            const webp = path.join(imagesDir, `${stem}.webp`);

            expect(existsSync(png), `missing source ${stem}.png`).toBe(true);

            expect(existsSync(avif), `missing ${stem}.avif`).toBe(true);
            expect(statSync(avif).size, `${stem}.avif empty`).toBeGreaterThan(0);

            expect(existsSync(webp), `missing ${stem}.webp`).toBe(true);
            expect(statSync(webp).size, `${stem}.webp empty`).toBeGreaterThan(0);
        }
    });
});

describe('built home HTML work cards (optional)', () => {
    it('does not serve stem PNGs from work card markup when dist exists', () => {
        if (!existsSync(distIndex)) {
            return;
        }
        const html = readFileSync(distIndex, 'utf8');
        for (const stem of WORK_STEMS) {
            expect(html).not.toMatch(
                new RegExp(`(?:src|srcset)=["'][^"']*images/${stem}\\.png`, 'i'),
            );
        }
    });
});
