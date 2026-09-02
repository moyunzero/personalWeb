import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');

function readText(relativePath: string) {
    return readFileSync(path.join(root, relativePath), 'utf8');
}

describe('listening sync build/CI isolation (D-14)', () => {
    it('does not wire listening:sync into package.json build', () => {
        const pkg = JSON.parse(readText('package.json')) as { scripts: Record<string, string> };
        expect(pkg.scripts.build).toBeDefined();
        expect(pkg.scripts.build).not.toMatch(/listening:sync/);
        expect(pkg.scripts['listening:sync']).toBe('node scripts/listening-sync.mjs');
    });

    it('does not invoke listening sync from ci.yml or deploy.yml', () => {
        const ci = readText('.github/workflows/ci.yml');
        const deploy = readText('.github/workflows/deploy.yml');
        for (const [name, text] of [
            ['ci.yml', ci],
            ['deploy.yml', deploy],
        ] as const) {
            expect(text, name).not.toMatch(/listening-sync\.yml/);
            expect(text, name).not.toMatch(/listening:sync/);
            expect(text, name).not.toMatch(/yarn listening/);
        }
    });

    it('documents manual listening:sync and D-10 amy attribution obligation', () => {
        const rootAgents = readText('AGENTS.md');
        const scriptsAgents = readText('scripts/AGENTS.md');

        expect(rootAgents).toMatch(/yarn listening:sync/);
        expect(rootAgents).toMatch(/not (?:part of |in )?yarn build|manual.*(?:not|never).*build|not.*yarn build/i);

        expect(scriptsAgents).toMatch(/NOTION_LISTENING_DATABASE_ID/);
        expect(scriptsAgents).toMatch(/piper-tts|Piper/i);
        expect(scriptsAgents).toMatch(/en_US-amy-medium/);
        expect(scriptsAgents).toMatch(/CC BY-SA/);
        expect(scriptsAgents).toMatch(/Phase 3/);
        expect(scriptsAgents).toMatch(/D-10|D-14/);
    });

    it('requires NOTION_DATABASE_ID in Actions/local listening secrets docs (SYNC-03)', () => {
        const scriptsAgents = readText('scripts/AGENTS.md');
        // Must list all three required envs for both Actions and local — not TOKEN+LISTENING only
        expect(scriptsAgents).toMatch(
            /Listening[\s\S]*NOTION_TOKEN[\s\S]*NOTION_LISTENING_DATABASE_ID[\s\S]*NOTION_DATABASE_ID/,
        );
        expect(scriptsAgents).not.toMatch(
            /Actions secrets\s*\/\s*local env are \*\*only\*\* `NOTION_TOKEN` \+ `NOTION_LISTENING_DATABASE_ID`/,
        );
        expect(scriptsAgents).toMatch(/NOTION_DATABASE_ID[\s\S]*(?:dual-DB|SYNC-03|inequality)/i);
    });

    it('keeps listening-sync.yml env parity with required getEnv names', () => {
        const syncSrc = readText('scripts/listening-sync.mjs');
        const workflow = readText('.github/workflows/listening-sync.yml');

        const requiredNames = [
            ...syncSrc.matchAll(/getEnv\(\s*['"]([A-Z0-9_]+)['"]\s*,\s*true\s*\)/g),
        ].map((m) => m[1]);

        expect(requiredNames.length).toBeGreaterThan(0);
        expect(requiredNames).toEqual(
            expect.arrayContaining([
                'NOTION_TOKEN',
                'NOTION_LISTENING_DATABASE_ID',
                'NOTION_DATABASE_ID',
            ]),
        );

        for (const name of new Set(requiredNames)) {
            expect(workflow, `workflow missing required getEnv ${name}`).toContain(name);
        }
    });
});
