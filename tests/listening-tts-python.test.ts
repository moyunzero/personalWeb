import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolvePiperPython } from '../scripts/lib/listening-tts.mjs';

const scratchRoots: string[] = [];

afterEach(() => {
    while (scratchRoots.length > 0) {
        const root = scratchRoots.pop();
        if (root) rmSync(root, { recursive: true, force: true });
    }
});

function makeRepoWithVenvPython(binName: 'python3' | 'python') {
    const root = mkdtempSync(path.join(tmpdir(), 'piper-resolve-'));
    scratchRoots.push(root);
    const binDir = path.join(root, 'tools/piper-venv/bin');
    mkdirSync(binDir, { recursive: true });
    const pythonPath = path.join(binDir, binName);
    writeFileSync(pythonPath, '');
    return { root, pythonPath };
}

describe('resolvePiperPython', () => {
    it('prefers PIPER_PYTHON env when set', () => {
        expect(
            resolvePiperPython('/tmp/missing-repo', {
                PIPER_PYTHON: '/custom/bin/python',
            }),
        ).toBe('/custom/bin/python');
    });

    it('prefers tools/piper-venv/bin/python3 when present in repo', () => {
        const { root, pythonPath } = makeRepoWithVenvPython('python3');
        expect(resolvePiperPython(root, {})).toBe(pythonPath);
    });

    it('falls back to python3 when venv missing', () => {
        expect(resolvePiperPython('/tmp/no-piper-venv-here', {})).toBe('python3');
    });
});
