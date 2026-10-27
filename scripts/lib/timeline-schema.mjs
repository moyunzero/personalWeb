import { z } from 'zod';

export const TRACKS = ['intl', 'cn', 'fw', 'term'];

export const timelineEventSchema = z.object({
    id: z.string().min(1),
    date: z.string().min(1),
    year: z.string().min(1),
    sort: z.number().int(),
    category: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().default(''),
    tracks: z.array(z.enum(TRACKS)).min(1),
    tier: z.union([z.literal(0), z.literal(2), z.literal(3)]),
    /** 官方博客 / arXiv / GitHub 等；无可靠来源则省略 */
    sourceUrl: z.string().url().optional(),
});

export const timelineFileSchema = z.object({
    generatedAt: z.string().min(1),
    events: z.array(timelineEventSchema),
});

export function validateTimelineFile(data) {
    return timelineFileSchema.safeParse(data);
}
