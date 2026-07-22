import path from 'node:path';
import { bannedFilePaths, legacyDirSentinels } from './legacy-spa-paths.mjs';

export const root = path.resolve('.');

const bannedFiles = new Set(bannedFilePaths);

/** Strip line and block comments so commented-out imports do not fail the scan. */
export function stripComments(source) {
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

function findStringLiteralRegions(source) {
    const regions = [];
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

function isInsideStringLiteral(index, regions) {
    return regions.some(({ start, end }) => index >= start && index < end);
}

/** Static import / require / dynamic import string specifiers only. */
export function extractImportSpecifiers(source) {
    const code = stripComments(source);
    const stringRegions = findStringLiteralRegions(code);
    const found = [];
    const patterns = [
        /\bimport\s+(?:type\s+)?(?:[\w*\s{},$]+?\s+from\s+)?['"]([^'"]+)['"]/g,
        /\bexport\s+(?:type\s+)?(?:[\w*\s{},$]+?|\*)\s+from\s+['"]([^'"]+)['"]/g,
        /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const re of patterns) {
        re.lastIndex = 0;
        let match;
        while ((match = re.exec(code)) !== null) {
            if (isInsideStringLiteral(match.index, stringRegions)) continue;
            found.push(match[1]);
        }
    }
    return found;
}

/** Resolve a relative specifier to a repo-relative path that keeps the extension. */
export function resolveToRepoPath(importerRel, specifier) {
    if (!specifier.startsWith('.')) return null;

    const importerAbs = path.join(root, importerRel);
    const resolvedAbs = path.resolve(path.dirname(importerAbs), specifier);
    const rel = path.relative(root, resolvedAbs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    return rel.split(path.sep).join('/');
}

export function isBannedResolvedPath(resolved) {
    if (bannedFiles.has(resolved)) return true;
    for (const sentinel of legacyDirSentinels) {
        if (resolved === sentinel || resolved.startsWith(`${sentinel}/`)) return true;
    }
    return false;
}

export function findBannedImportsInSource(importerRel, source) {
    const hits = [];
    for (const specifier of extractImportSpecifiers(source)) {
        const resolved = resolveToRepoPath(importerRel, specifier);
        if (!resolved) continue;
        if (isBannedResolvedPath(resolved)) {
            hits.push({ specifier, resolved });
        }
    }
    return hits;
}
