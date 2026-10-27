import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateTimelineFile } from '../../scripts/lib/timeline-schema.mjs';

const DEFAULT_FILE = './content/timeline/events.json';

export type TimelineTrack = 'intl' | 'cn' | 'fw' | 'term';

export type TimelineEvent = {
    id: string;
    date: string;
    year: string;
    sort: number;
    category: string;
    title: string;
    summary: string;
    tracks: TimelineTrack[];
    tier: 0 | 2 | 3;
    sourceUrl?: string;
};

export async function getTimelineEvents(
    file: string = DEFAULT_FILE,
): Promise<TimelineEvent[]> {
    try {
        const raw = await readFile(path.resolve(file), 'utf8');
        const parsed = validateTimelineFile(JSON.parse(raw));
        if (!parsed.success) return [];
        return parsed.data.events as TimelineEvent[];
    } catch {
        return [];
    }
}
