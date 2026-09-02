import { z } from 'zod';

/** Relative public audio key — resolve BASE_URL in Phase 3 UI. */
const AUDIO_SRC_RE = /^audio\/listening\/[^/]+\.mp3$/;

export const listeningVocabItemSchema = z.object({
    word: z.string().min(1),
    phonetic: z.string().optional().default(''),
    meaning: z.string().optional().default(''),
    example: z.string().optional().default(''),
    practice: z.string().optional().default(''),
});

export const listeningEntrySchema = z
    .object({
        id: z.string().min(1),
        date: z.string().min(1),
        title: z.string().min(1),
        sentence: z.string().min(1),
        vocab: z.array(listeningVocabItemSchema).default([]),
        takeaways: z.string().default(''),
        youtubeUrl: z.string().url().optional(),
        audioSrc: z.string().regex(AUDIO_SRC_RE).optional(),
        notionSyncedAt: z.union([z.string().datetime(), z.string().min(1)]),
    })
    .superRefine((data, ctx) => {
        if (!data.audioSrc) return;
        const expected = `audio/listening/${data.id}.mp3`;
        if (data.audioSrc !== expected) {
            ctx.addIssue({
                code: 'custom',
                path: ['audioSrc'],
                message: `audioSrc must be ${expected} (no site base path prefix)`,
            });
        }
    });

export function validateListeningData(data) {
    return listeningEntrySchema.safeParse(data);
}
