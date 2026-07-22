import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
    extractImportSpecifiers,
    findBannedImportsInSource,
    isBannedResolvedPath,
    resolveToRepoPath,
    root,
} from '../../scripts/lib/legacy-spa-import-guard.mjs';

export {
    extractImportSpecifiers,
    findBannedImportsInSource,
    isBannedResolvedPath,
    resolveToRepoPath,
    root,
};

export const SCAN_ROOTS = ['src', 'scripts', 'tests'] as const;
export const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.astro']);

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
        for (const hit of findBannedImportsInSource(file, source)) {
            hits.push({ file, ...hit });
        }
    }
    return hits;
}
