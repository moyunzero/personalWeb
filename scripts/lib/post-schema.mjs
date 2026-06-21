import { z } from 'zod';

/** Strict published description required after Phase 3 batch apply (D-P3-01). */
export let STRICT_PUBLISHED_DESCRIPTION = true;

export const postDataSchema = z
    .object({
        slug: z.string().min(1),
        title: z.string().min(1),
        description: z.string(),
        publishedAt: z.string().min(1),
        updatedAt: z.string().optional(),
        categories: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
        coverImage: z.string().optional(),
        draft: z.boolean().default(false),
        featured: z.boolean().default(false),
        author: z.string().default('墨韵'),
        readTime: z.number().optional(),
        canonical: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        ogImage: z.string().optional(),
        noindex: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
        if (!STRICT_PUBLISHED_DESCRIPTION || data.draft) return;
        if (!data.description.trim()) {
            ctx.addIssue({
                code: 'custom',
                path: ['description'],
                message: 'description is required for published posts',
            });
        }
    });

export function enableStrictPublishedDescription() {
    STRICT_PUBLISHED_DESCRIPTION = true;
}

export function disableStrictPublishedDescription() {
    STRICT_PUBLISHED_DESCRIPTION = false;
}

export function validatePostData(data) {
    return postDataSchema.safeParse(data);
}
