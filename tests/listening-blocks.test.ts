import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    extractSentence,
    extractTakeaways,
    extractVocab,
} from '../scripts/lib/listening-blocks.mjs';
import { validateListeningData } from '../scripts/lib/listening-schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/listening');

function loadJson(name: string) {
    return JSON.parse(readFileSync(path.join(fixturesDir, name), 'utf8'));
}

function loadBlocksFixture() {
    return loadJson('minimal-page-blocks.json');
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

describe('listening-blocks extractVocab (D-04)', () => {
    it('maps Chinese headers and returns non-empty vocab from two-step fixture', () => {
        const { pageBlocks, tableRowBlocks } = loadJson('vocab-table-blocks.json');
        const vocab = extractVocab(pageBlocks, tableRowBlocks);
        expect(vocab.length).toBeGreaterThan(0);
        expect(vocab[0]).toMatchObject({
            word: 'breakthrough',
            phonetic: '/ˈbreɪkθruː/',
            meaning: '突破',
            example: 'She made a breakthrough.',
            practice: 'Say it aloud twice.',
        });
        expect(vocab[1].word).toBe('look up to');
        expect(vocab[1].meaning).toBe('钦佩');
    });

    it('returns empty array when vocab heading or table missing', () => {
        const { pageBlocksNoVocabHeading, tableRowBlocks } = loadJson(
            'vocab-table-blocks.json'
        );
        expect(extractVocab(pageBlocksNoVocabHeading, tableRowBlocks)).toEqual(
            []
        );
        expect(extractVocab(pageBlocksNoVocabHeading, [])).toEqual([]);
    });
});

describe('listening-blocks extractTakeaways (D-05)', () => {
    it('joins text under 收获 heading until next heading', () => {
        const { withTakeaways } = loadJson('takeaways-blocks.json');
        const text = extractTakeaways(withTakeaways);
        expect(text).toContain('学会了 breakthrough 的用法。');
        expect(text).toContain('难点在于连读。');
        expect(text).not.toContain('This should not be in takeaways.');
    });

    it('returns empty string when takeaways heading missing (D-06)', () => {
        const { missingTakeaways } = loadJson('takeaways-blocks.json');
        expect(extractTakeaways(missingTakeaways)).toBe('');
    });
});

describe('listening-blocks D-06 writable shape', () => {
    it('no-sentence fixture still signals skip', () => {
        const blocks = loadJson('no-sentence-blocks.json');
        expect(extractSentence(blocks)).toEqual({ skip: true });
    });

    it('sentence + empty vocab/takeaways remains schema-valid', () => {
        const { missingTakeaways } = loadJson('takeaways-blocks.json');
        const extracted = extractSentence(missingTakeaways);
        expect('sentence' in extracted).toBe(true);
        if (!('sentence' in extracted)) return;

        const entry = {
            id: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
            date: '2026-09-02',
            title: 'Empty optional sections',
            sentence: extracted.sentence,
            vocab: extractVocab(missingTakeaways, []),
            takeaways: extractTakeaways(missingTakeaways),
            notionSyncedAt: '2026-09-02T12:00:00.000Z',
        };
        expect(entry.vocab).toEqual([]);
        expect(entry.takeaways).toBe('');
        expect(validateListeningData(entry).success).toBe(true);
    });
});
