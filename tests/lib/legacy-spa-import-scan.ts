import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
    bannedFilePaths,
    legacyDirSentinels,
} from '../fixtures/legacy-spa-paths';

export const root = path.resolve('.');
export const SCAN_ROOTS = ['src', 'scripts', 'tests'] as const;
export const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.astro']);

const bannedFiles = new Set(bannedFilePaths);

/** Strip line and block comments so commented-out imports do not fail the scan (AC-4). */
export function stripComments(source: string): string {
    let out = '';
    let i = 0;
    while (i < source.length) {
        const ch = source[i];
        const next = source[i + 1];

        if (ch === '"' || ch === "'" || ch === '`') {
            const quote = ch;
            out += ch;
            i += 1;
            while (i < source.length) {
                if (source[i] === '\\') {
                    out += source[i];
                    i += 1;
                    if (i < source.length) {
                        out += source[i];
                        i += 1;
                    }
                    continue;
                }
                if (source[i] === quote) {
                    out += source[i];
                    i += 1;
                    break;
                }
                out += source[i];
                i += 1;
            }
            continue;
        }

        if (ch === '/' && next === '/') {
            i += 2;
            while (i < source.length && source[i] !== '\n') i += 1;
            continue;
        }

        if (ch === '/' && next === '*') {
            i += 2;
            while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
                i += 1;
            }
            i += 2;
            continue;
        }

        out += ch;
        i += 1;
    }
    return out;
}

function findStringLiteralRegions(source: string): Array<{ start: number; end: number }> {
    const regions: Array<{ start: number; end: number }> = [];
    let i = 0;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '"' || ch === "'" || ch === '`') {
            const quote = ch;
            const start = i;
            i += 1;
            while (i < source.length) {
                if (source[i] === '\\') {
                    i += 2;
                    continue;
                }
                if (source[i] === quote) {
                    i += 1;
                    regions.push({ start, end: i });
                    break;
                }
                i += 1;
            }
            continue;
        }
        i += 1;
    }
    return regions;
}

function isInsideStringLiteral(index: number, regions: Array<{ start: number; end: number }>): boolean {
    return regions.some(({ start, end }) => index >= start && index < end);
}

/** Static import / require / dynamic import string specifiers only. */
export function extractImportSpecifiers(source: string): string[] {
    const code = stripComments(source);
    const stringRegions = findStringLiteralRegions(code);
    const found: string[] = [];
    const patterns = [
        /\bimport\s+(?:type\s+)?(?:[\w*\s{},$]+?\s+from\s+)?['"]([^'"]+)['"]/g,
        /\bexport\s+(?:type\s+)?(?:[\w*\s{},$]+?|\*)\s+from\s+['"]([^'"]+)['"]/g,
        /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const re of patterns) {
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(code)) !== null) {
            if (isInsideStringLiteral(match.index, stringRegions)) continue;
            found.push(match[1]);
        }
    }
    return found;
}

/** Resolve a relative specifier to a repo-relative path that keeps the extension. */
export function resolveToRepoPath(importerRel: string, specifier: string): string | null {
    if (!specifier.startsWith('.')) return null;

    const importerAbs = path.join(root, importerRel);
    const resolvedAbs = path.resolve(path.dirname(importerAbs), specifier);
    const rel = path.relative(root, resolvedAbs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    return rel.split(path.sep).join('/');
}

export function isBannedResolvedPath(resolved: string): boolean {
    if (bannedFiles.has(resolved)) return true;
    for (const sentinel of legacyDirSentinels) {
        if (resolved === sentinel || resolved.startsWith(`${sentinel}/`)) return true;
    }
    return false;
}

export function walkScanFiles(dirRel: string, out: string[]): void {
    const abs = path.join(root, dirRel);
    let entries;
    try {
        entries = readdirSync(abs);
    } catch {
        return;
    }

    for (const name of entries) {
        if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
        const childRel = path.join(dirRel, name).split(path.sep).join('/');
        const childAbs = path.join(root, childRel);
        const st = statSync(childAbs);
        if (st.isDirectory()) {
            walkScanFiles(childRel, out);
            continue;
        }
        if (SCAN_EXTENSIONS.has(path.extname(name))) {
            out.push(childRel);
        }
    }
}

export function collectBannedImports(): Array<{ file: string; specifier: string; resolved: string }> {
    const files: string[] = [];
    for (const scanRoot of SCAN_ROOTS) {
        walkScanFiles(scanRoot, files);
    }

    const hits: Array<{ file: string; specifier: string; resolved: string }> = [];
    for (const file of files) {
        const source = readFileSync(path.join(root, file), 'utf8');
        for (const specifier of extractImportSpecifiers(source)) {
            const resolved = resolveToRepoPath(file, specifier);
            if (!resolved) continue;
            if (isBannedResolvedPath(resolved)) {
                hits.push({ file, specifier, resolved });
            }
        }
    }
    return hits;
}

export function findBannedImportsInSource(
    importerRel: string,
    source: string,
): Array<{ specifier: string; resolved: string }> {
    const hits: Array<{ specifier: string; resolved: string }> = [];
    for (const specifier of extractImportSpecifiers(source)) {
        const resolved = resolveToRepoPath(importerRel, specifier);
        if (!resolved) continue;
        if (isBannedResolvedPath(resolved)) {
            hits.push({ specifier, resolved });
        }
    }
    return hits;
}
