import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

describe('verify-production offline (dist)', () => {
    it('dist contains google verification file', async () => {
        const file = path.join(dist, 'googleef60eaecd43955c6.html');
        expect(existsSync(file)).toBe(true);
        const body = await readFile(file, 'utf8');
        expect(body).toContain('google-site-verification:');
    });

    it('dist contains BingSiteAuth.xml', async () => {
        const file = path.join(dist, 'BingSiteAuth.xml');
        expect(existsSync(file)).toBe(true);
        const body = await readFile(file, 'utf8');
        expect(body).toContain('4A7B2111');
    });

    it('package.json registers verify:prod', async () => {
        const pkg = JSON.parse(
            await readFile(path.join(root, 'package.json'), 'utf8')
        );
        expect(pkg.scripts['verify:prod']).toContain('verify-production');
    });
});
