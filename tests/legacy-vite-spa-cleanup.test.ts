import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
    legacyBlogHelpers,
    legacyDirSentinels,
    legacyEntryFiles,
    legacySpaOnlyFiles,
    removedDirectDeps,
} from './fixtures/legacy-spa-paths';

const root = path.resolve('.');

const productionKeepFiles = [
    'src/pages/index.astro',
    'src/pages/blog/index.astro',
    'src/layouts/HomeLayout.astro',
    'src/layouts/BlogLayout.astro',
    'src/components/islands/GameIsland.tsx',
    'src/components/blog/BlogPostCard.astro',
    'src/components/home/Main.astro',
    'src/components/chat/ChatBubble.jsx',
    'src/game/scenes/GameScene.js',
    'src/services/chatApi.js',
    'src/blog/frontmatter.js',
    'src/blog/parsePost.js',
    'src/blog/excerpt.js',
    'src/blog/getCategories.js',
    'src/blog/getRelatedPosts.js',
    'src/blog/utils.js',
];

function readJson(relativePath: string) {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };
}

describe('legacy Vite SPA cleanup', () => {
    it('removes legacy SPA entry and config files (AC-1)', () => {
        for (const file of legacyEntryFiles) {
            expect(existsSync(path.join(root, file)), file).toBe(false);
        }
    });

    it('removes SPA only UI trees and deprecated scripts (AC-2)', () => {
        for (const file of legacySpaOnlyFiles) {
            expect(existsSync(path.join(root, file)), file).toBe(false);
        }
        for (const dir of legacyDirSentinels) {
            expect(existsSync(path.join(root, dir)), dir).toBe(false);
        }
    });

    it('keeps production Astro and island paths (AC-2)', () => {
        for (const file of productionKeepFiles) {
            expect(existsSync(path.join(root, file)), file).toBe(true);
        }
    });

    it('removes SPA only blog helpers but keeps shared parsers (AC-3)', () => {
        for (const file of legacyBlogHelpers) {
            expect(existsSync(path.join(root, file)), file).toBe(false);
        }
    });

    it('removes direct SPA dependencies from package.json (AC-4)', () => {
        const pkg = readJson('package.json');
        const direct = new Set([
            ...Object.keys(pkg.dependencies ?? {}),
            ...Object.keys(pkg.devDependencies ?? {}),
        ]);

        for (const dep of removedDirectDeps) {
            expect(direct.has(dep), dep).toBe(false);
        }
        expect(direct.has('react-markdown')).toBe(true);
    });

    it('removes PropTypes from ChatBubble (AC-4)', () => {
        const source = readFileSync(path.join(root, 'src/components/chat/ChatBubble.jsx'), 'utf8');
        expect(source).not.toMatch(/prop-types/);
        expect(source).not.toMatch(/\.propTypes\s*=/);
    });

    it('stops Tailwind from scanning legacy index.html (AC-5)', () => {
        const tailwind = readFileSync(path.join(root, 'tailwind.config.js'), 'utf8');
        expect(tailwind).not.toContain('./index.html');
        expect(tailwind).toMatch(/content:\s*\["\.\/src\/\*\*\/\*\.\{js,ts,jsx,tsx,astro,html\}"\]/);
    });
});
