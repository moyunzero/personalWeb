import { describe, expect, it } from 'vitest';
import { getUrl } from '../scripts/lib/notion-helpers.mjs';

describe('getUrl (D-03)', () => {
    it('returns string from url property', () => {
        expect(
            getUrl({
                type: 'url',
                url: 'https://www.youtube.com/watch?v=abc123',
            })
        ).toBe('https://www.youtube.com/watch?v=abc123');
    });

    it('returns null for empty url property', () => {
        expect(getUrl({ type: 'url', url: null })).toBeNull();
        expect(getUrl({ type: 'url', url: '' })).toBeNull();
        expect(getUrl({ type: 'url', url: '   ' })).toBeNull();
    });

    it('extracts first http(s) token from rich_text plain_text', () => {
        expect(
            getUrl({
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        plain_text: '看这里 https://youtu.be/xyz 以及说明',
                        href: null,
                    },
                ],
            })
        ).toBe('https://youtu.be/xyz');
    });

    it('prefers rich_text href when it is http(s)', () => {
        expect(
            getUrl({
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        plain_text: '来源',
                        href: 'https://www.youtube.com/watch?v=from-href',
                    },
                ],
            })
        ).toBe('https://www.youtube.com/watch?v=from-href');
    });

    it('rejects non-http(s) tokens in rich_text', () => {
        expect(
            getUrl({
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        plain_text: 'ftp://example.com/file javascript:alert(1)',
                        href: null,
                    },
                ],
            })
        ).toBeNull();
    });

    it('returns null for missing or unsupported property types', () => {
        expect(getUrl(null)).toBeNull();
        expect(getUrl(undefined)).toBeNull();
        expect(getUrl({ type: 'select', select: { name: 'x' } })).toBeNull();
    });
});
