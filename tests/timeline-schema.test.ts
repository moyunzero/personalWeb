import { describe, expect, it } from 'vitest';
import { validateTimelineFile } from '../scripts/lib/timeline-schema.mjs';
import { timelineSortKey, tracksFromNotion } from '../scripts/lib/timeline-map.mjs';

describe('timeline schema', () => {
    it('accepts a valid events file', () => {
        const result = validateTimelineFile({
            generatedAt: '2026-10-27T00:00:00.000Z',
            events: [
                {
                    id: 'abc',
                    date: '2017.06.12',
                    year: '2017',
                    sort: 20170612,
                    category: '架构',
                    title: 'Transformer',
                    summary: '底座',
                    tracks: ['term'],
                    tier: 3,
                },
            ],
        });
        expect(result.success).toBe(true);
    });

    it('rejects unknown tracks', () => {
        const result = validateTimelineFile({
            generatedAt: '2026-10-27T00:00:00.000Z',
            events: [
                {
                    id: 'abc',
                    date: '2017.06.12',
                    year: '2017',
                    sort: 1,
                    category: '架构',
                    title: 'Transformer',
                    summary: '',
                    tracks: ['nope'],
                    tier: 3,
                },
            ],
        });
        expect(result.success).toBe(false);
    });
});

describe('timelineSortKey', () => {
    it('orders day-level before month-only in the same month', () => {
        expect(timelineSortKey('2018.10.11', 2018)).toBe(20181011);
        expect(timelineSortKey('2018.10', 2018)).toBe(20181000);
        expect(timelineSortKey('2020年中', 2020)).toBe(20200600);
    });
});

describe('tracksFromNotion', () => {
    it('maps full Notion labels to track ids', () => {
        expect(tracksFromNotion(['国外模型', '框架/协议'])).toEqual(['intl', 'fw']);
    });
});
