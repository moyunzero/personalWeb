import { afterEach, describe, expect, it } from 'vitest';
import {
    getStatusOrSelectName,
    isListeningDone,
    parseListeningDoneStatuses,
    stripLeadingStatusDecorators,
} from '../scripts/lib/listening-status.mjs';

describe('listening-status', () => {
    afterEach(() => {
        delete process.env.NOTION_LISTENING_STATUS_DONE;
    });

    it('stripLeadingStatusDecorators removes leading emoji/symbols', () => {
        expect(stripLeadingStatusDecorators('✅ 完成')).toBe('完成');
        expect(stripLeadingStatusDecorators('完成')).toBe('完成');
    });

    it('isListeningDone matches emoji-prefixed 完成 against done list', () => {
        expect(isListeningDone('✅ 完成', ['完成'])).toBe(true);
    });

    it('isListeningDone rejects non-done labels', () => {
        expect(isListeningDone('进行中', ['完成'])).toBe(false);
    });

    it('getStatusOrSelectName reads status property shape (D-15)', () => {
        expect(
            getStatusOrSelectName({
                type: 'status',
                status: { name: '✅ 完成' },
            })
        ).toBe('✅ 完成');
    });

    it('getStatusOrSelectName reads select property shape (D-15)', () => {
        expect(
            getStatusOrSelectName({
                type: 'select',
                select: { name: '进行中' },
            })
        ).toBe('进行中');
    });

    it('getStatusOrSelectName returns null for missing/unsupported props', () => {
        expect(getStatusOrSelectName(null)).toBeNull();
        expect(getStatusOrSelectName({ type: 'title', title: [] })).toBeNull();
    });

    it('parseListeningDoneStatuses defaults to 完成 (D-02)', () => {
        expect(parseListeningDoneStatuses()).toEqual(['完成']);
    });

    it('parseListeningDoneStatuses reads NOTION_LISTENING_STATUS_DONE CSV (D-02)', () => {
        process.env.NOTION_LISTENING_STATUS_DONE = '完成, Done';
        expect(parseListeningDoneStatuses()).toEqual(['完成', 'Done']);
    });
});
