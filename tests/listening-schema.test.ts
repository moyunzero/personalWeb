import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateListeningData } from '../scripts/lib/listening-schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/listening');

function loadFixture(name: string) {
    return JSON.parse(readFileSync(path.join(fixturesDir, name), 'utf8'));
}

describe('listening-schema', () => {
    it('accepts valid-entry.json with empty vocab/takeaways and no audioSrc', () => {
        const entry = loadFixture('valid-entry.json');
        const result = validateListeningData(entry);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.vocab).toEqual([]);
            expect(result.data.takeaways).toBe('');
            expect(result.data.audioSrc).toBeUndefined();
        }
    });

    it('rejects missing sentence', () => {
        const entry = loadFixture('invalid-entry-missing-sentence.json');
        const result = validateListeningData(entry);
        expect(result.success).toBe(false);
    });

    it('rejects missing id', () => {
        const entry = { ...loadFixture('valid-entry.json') };
        delete entry.id;
        expect(validateListeningData(entry).success).toBe(false);
    });

    it('rejects missing date', () => {
        const entry = { ...loadFixture('valid-entry.json') };
        delete entry.date;
        expect(validateListeningData(entry).success).toBe(false);
    });

    it('accepts relative audioSrc audio/listening/{id}.mp3', () => {
        const entry = loadFixture('valid-entry.json');
        const result = validateListeningData({
            ...entry,
            audioSrc: `audio/listening/${entry.id}.mp3`,
        });
        expect(result.success).toBe(true);
    });

    it('rejects audioSrc with site base path prefix', () => {
        const entry = loadFixture('valid-entry.json');
        const result = validateListeningData({
            ...entry,
            audioSrc: `/personalWeb/audio/listening/${entry.id}.mp3`,
        });
        expect(result.success).toBe(false);
    });

    it('rejects non-URL youtubeUrl strings', () => {
        const entry = loadFixture('valid-entry.json');
        const result = validateListeningData({
            ...entry,
            youtubeUrl: 'not-a-url',
        });
        expect(result.success).toBe(false);
    });
});
