import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePiperPython } from '../scripts/lib/listening-tts.mjs';

describe('resolvePiperPython', () => {
    it('prefers PIPER_PYTHON env when set', () => {
        expect(
            resolvePiperPython('/tmp/missing-repo', {
                PIPER_PYTHON: '/custom/bin/python',
            }),
        ).toBe('/custom/bin/python');
    });

    it('prefers tools/piper-venv/bin/python3 when present in repo', () => {
        const root = path.resolve('.');
        const resolved = resolvePiperPython(root, {});
        expect(resolved).toBe(path.join(root, 'tools/piper-venv/bin/python3'));
    });

    it('falls back to python3 when venv missing', () => {
        expect(resolvePiperPython('/tmp/no-piper-venv-here', {})).toBe('python3');
    });
});
