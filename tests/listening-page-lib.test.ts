import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getListeningEntries } from '../src/lib/listening';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/listening');

function copyFixture(dir: string, name: string, destName = name) {
    writeFileSync(
        path.join(dir, destName),
        readFileSync(path.join(fixturesDir, name), 'utf8'),
    );
}

describe('getListeningEntries (LISTEN-01)', () => {
    it('returns newest date first from a fixture dir with two valid JSON files', async () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'listening-lib-'));
        copyFixture(dir, 'valid-entry.json', 'older.json');
        copyFixture(dir, 'entry-newer.json', 'newer.json');

        const entries = await getListeningEntries(dir);
        expect(entries).toHaveLength(2);
        expect(entries[0].date).toBe('2026-09-02');
        expect(entries[0].title).toBe('Newer listening card');
        expect(entries[1].date).toBe('2026-09-01');
    });

    it('returns [] for empty dir or only non-json files', async () => {
        const empty = mkdtempSync(path.join(tmpdir(), 'listening-empty-'));
        expect(await getListeningEntries(empty)).toEqual([]);

        const mixed = mkdtempSync(path.join(tmpdir(), 'listening-mixed-'));
        writeFileSync(path.join(mixed, 'notes.txt'), 'not json');
        expect(await getListeningEntries(mixed)).toEqual([]);
    });

    it('returns [] when dir is missing', async () => {
        const missing = path.join(tmpdir(), `listening-missing-${Date.now()}`);
        expect(await getListeningEntries(missing)).toEqual([]);
    });

    it('skips corrupt JSON and Zod failures without throwing', async () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'listening-skip-'));
        copyFixture(dir, 'valid-entry.json', 'valid.json');
        copyFixture(dir, 'invalid-skip.json', 'bad.json');
        writeFileSync(path.join(dir, 'corrupt.json'), '{not-json');

        const entries = await getListeningEntries(dir);
        expect(entries).toHaveLength(1);
        expect(entries[0].id).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    });
});
