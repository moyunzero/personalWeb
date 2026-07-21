import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');

function readText(relativePath: string) {
    return readFileSync(path.join(root, relativePath), 'utf8');
}

describe('legacy SPA CI workflow contract', () => {
    it('ci.yml runs yarn test on pull_request and push to master (AC-6)', () => {
        const ci = readText('.github/workflows/ci.yml');
        expect(ci).toMatch(/pull_request:/);
        expect(ci).toMatch(/push:\s*\n\s*branches:\s*\["master"\]/);
        expect(ci).toMatch(/node-version:\s*22/);
        expect(ci).toMatch(/yarn install --frozen-lockfile/);
        expect(ci).toMatch(/run:\s*yarn test/);
    });

    it('uses yarn test as the only local guard command (AC-7)', () => {
        const pkg = JSON.parse(readText('package.json')) as { scripts: Record<string, string> };
        const guardLikeScripts = Object.keys(pkg.scripts).filter((name) =>
            /guard|legacy/i.test(name),
        );
        expect(guardLikeScripts).toEqual([]);
        expect(pkg.scripts.test).toBe('vitest --run');
    });

    it('keeps Deploy deploy only without PR test gating (AC-8)', () => {
        const deploy = readText('.github/workflows/deploy.yml');
        expect(deploy).not.toMatch(/pull_request:/);
        expect(deploy).not.toMatch(/yarn test/);
        expect(deploy).toMatch(/yarn build/);
        expect(deploy).toMatch(/deploy-pages/);
    });
});
