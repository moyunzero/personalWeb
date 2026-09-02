import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractSentence } from '../scripts/lib/listening-blocks.mjs';
import { validateListeningData } from '../scripts/lib/listening-schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/listening');

function loadBlocksFixture() {
    return JSON.parse(
        readFileSync(path.join(fixturesDir, 'minimal-page-blocks.json'), 'utf8')
    );
}

describe('listening-blocks extractSentence', () => {
    it('prefers English paragraph after 内容摘要 heading (D-16)', () => {
        const { withSummaryHeading } = loadBlocksFixture();
        const result = extractSentence(withSummaryHeading);
        expect(result).toEqual({
            sentence: 'The summary English sentence comes first.',
        });
    });

    it('falls back to first English paragraph when summary heading missing (D-16)', () => {
        const { fallbackFirstEnglish } = loadBlocksFixture();
        const result = extractSentence(fallbackFirstEnglish);
        expect(result).toEqual({
            sentence:
                'Fallback English paragraph when summary heading is missing.',
        });
    });

    it('returns skip when no English paragraph exists (D-06)', () => {
        const { noEnglish } = loadBlocksFixture();
        const result = extractSentence(noEnglish);
        expect(result).toEqual({ skip: true });
    });

    it('tracer path: extractSentence → object → validateListeningData succeeds', () => {
        const { withSummaryHeading } = loadBlocksFixture();
        const extracted = extractSentence(withSummaryHeading);
        expect('sentence' in extracted).toBe(true);
        if (!('sentence' in extracted)) return;

        const entry = {
            id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            date: '2026-09-01',
            title: 'Tracer card',
            sentence: extracted.sentence,
            vocab: [],
            takeaways: '',
            notionSyncedAt: '2026-09-01T12:00:00.000Z',
        };
        expect(validateListeningData(entry).success).toBe(true);
    });
});
