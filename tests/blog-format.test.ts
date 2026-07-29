import { describe, expect, it } from 'vitest';
import {
    formatLedgerDate,
    formatEditorialDate,
    buildBlogSearchPayload,
} from '../src/lib/blog';

describe('formatLedgerDate', () => {
    it('formats as MM.DD', () => {
        expect(formatLedgerDate('2026-07-22')).toBe('07.22');
        expect(formatLedgerDate('2026-01-05T12:00:00.000Z')).toMatch(/^\d{2}\.\d{2}$/);
    });

    it('returns original string when invalid', () => {
        expect(formatLedgerDate('not-a-date')).toBe('not-a-date');
    });
});

describe('formatEditorialDate', () => {
    it('formats as YYYY.MM.DD', () => {
        expect(formatEditorialDate('2026-07-22')).toBe('2026.07.22');
    });

    it('returns original string when invalid', () => {
        expect(formatEditorialDate('bad')).toBe('bad');
    });
});

describe('buildBlogSearchPayload', () => {
    it('stringifies title, description, tags with defaults', () => {
        const raw = buildBlogSearchPayload({ title: 'JWT' });
        expect(JSON.parse(raw)).toEqual({
            title: 'JWT',
            description: '',
            tags: [],
        });
    });

    it('preserves description and tags', () => {
        const raw = buildBlogSearchPayload({
            title: 'A',
            description: 'B',
            tags: ['css'],
        });
        expect(JSON.parse(raw)).toEqual({
            title: 'A',
            description: 'B',
            tags: ['css'],
        });
    });
});
