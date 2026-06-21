import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve('dist');

describe('blog editor route', () => {
    it('does not produce blog/editor HTML in dist', () => {
        const editorPath = path.join(distRoot, 'blog/editor/index.html');
        expect(existsSync(editorPath)).toBe(false);
    });

    it('dist HTML does not reference BlogEditor', () => {
        const indexPath = path.join(distRoot, 'index.html');
        if (!existsSync(indexPath)) return;
        const html = readFileSync(indexPath, 'utf8');
        expect(html.toLowerCase()).not.toContain('blogeditor');
    });
});
