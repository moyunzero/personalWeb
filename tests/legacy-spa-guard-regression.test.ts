import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { removedDirectDeps } from './fixtures/legacy-spa-paths';
import { findBannedImportsInSource } from './lib/legacy-spa-import-scan';

const root = path.resolve('.');
const PACKAGE_JSON = 'package.json';

let packageJsonBackup: string | null = null;

function readJson(relativePath: string) {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };
}

afterEach(() => {
    if (packageJsonBackup !== null) {
        writeFileSync(path.join(root, PACKAGE_JSON), packageJsonBackup, 'utf8');
        packageJsonBackup = null;
    }
});

describe('legacy SPA guard regression', () => {
    it('detects a banned import from src source text (AC-4)', () => {
        const source = "import Home from './pages/_Home.jsx';\n";
        const hits = findBannedImportsInSource('src/main.jsx', source);
        expect(hits).toEqual([{ specifier: './pages/_Home.jsx', resolved: 'src/pages/_Home.jsx' }]);
    });

    it('detects a banned import from tests source text (AC-4, AC-5)', () => {
        const source = "import App from '../src/App.jsx';\n";
        const hits = findBannedImportsInSource('tests/example.test.ts', source);
        expect(hits).toEqual([{ specifier: '../src/App.jsx', resolved: 'src/App.jsx' }]);
    });

    it('detects a removed SPA package reintroduced in package.json (AC-3)', () => {
        packageJsonBackup = readFileSync(path.join(root, PACKAGE_JSON), 'utf8');
        const pkg = readJson(PACKAGE_JSON);
        pkg.devDependencies = pkg.devDependencies ?? {};
        pkg.devDependencies.vite = '6.0.0';
        writeFileSync(path.join(root, PACKAGE_JSON), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

        const direct = new Set([
            ...Object.keys(readJson(PACKAGE_JSON).dependencies ?? {}),
            ...Object.keys(readJson(PACKAGE_JSON).devDependencies ?? {}),
        ]);
        expect(removedDirectDeps).toContain('vite');
        expect(direct.has('vite')).toBe(true);
    });
});
