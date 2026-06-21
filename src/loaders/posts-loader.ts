import type { Loader } from 'astro/loaders';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '../blog/frontmatter.js';
import { parsePost } from '../blog/parsePost.js';
import { postDataSchema } from '../../scripts/lib/post-schema.mjs';

const POSTS_DIR = './content/posts';

export function postsLoader(): Loader {
    return {
        name: 'posts-loader',
        load: async ({ store, parseData }) => {
            const dir = path.resolve(POSTS_DIR);
            const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));

            for (const file of files) {
                const filepath = `content/posts/${file}`;
                const raw = await readFile(path.join(dir, file), 'utf8');
                const { data: fm } = parseFrontmatter(raw);
                const parsed = parsePost(filepath, raw);
                const rawDesc = String(fm.description ?? '').trim();

                const data = await parseData({
                    id: parsed.id,
                    data: {
                        slug: parsed.id,
                        title: parsed.title,
                        description: rawDesc,
                        publishedAt: parsed.publishDate,
                        updatedAt: parsed.updateDate
                            ? String(parsed.updateDate)
                            : undefined,
                        categories: parsed.categories,
                        tags: parsed.tags,
                        coverImage: parsed.coverImage,
                        draft: parsed.draft,
                        featured: parsed.featured,
                        author: parsed.author,
                        readTime: parsed.readTime,
                    },
                });

                store.set({
                    id: parsed.id,
                    data,
                    body: parsed.content,
                });
            }
        },
        schema: postDataSchema,
    };
}
