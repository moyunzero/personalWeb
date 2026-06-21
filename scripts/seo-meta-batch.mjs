#!/usr/bin/env node
import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extractExcerpt } from '../src/blog/excerpt.js';
import { parseFrontmatter, stringifyFrontmatter } from '../src/blog/frontmatter.js';
import { POSTS_DIR, scanPosts } from './lib/scan-posts.mjs';

function parseArgs(argv) {
    const flags = {
        dryRun: true,
        apply: false,
        forceSlug: false,
    };

    for (const arg of argv) {
        if (arg === '--apply') {
            flags.apply = true;
            flags.dryRun = false;
        } else if (arg === '--dry-run') {
            flags.dryRun = true;
            flags.apply = false;
        } else if (arg === '--force-slug') {
            flags.forceSlug = true;
        }
    }

    return flags;
}

function isHashSlug(slug) {
    if (/^[a-f0-9]{8}$/i.test(slug)) return true;
    if (/-[a-f0-9]{8}$/i.test(slug)) return true;
    return false;
}

function assertPostsPath(filePath) {
    const resolvedPosts = path.resolve(POSTS_DIR);
    const resolvedFile = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedPosts + path.sep)) {
        throw new Error(`Refusing to write outside posts dir: ${filePath}`);
    }
}

/**
 * @param {Awaited<ReturnType<scanPosts>>} posts
 * @param {{ apply?: boolean, forceSlug?: boolean }} options
 */
export async function runMetaBatch(posts, options = {}) {
    const apply = Boolean(options.apply);
    const forceSlug = Boolean(options.forceSlug);
    const resolvedPosts = path.resolve(POSTS_DIR);

    let wouldUpdateDescription = 0;
    let updatedDescription = 0;
    let warnings = 0;

    for (const post of posts) {
        const { data, content, file, filePath, fileSlug } = post;
        const title = String(data.title ?? '').trim();
        const rawDesc = String(data.description ?? '').trim();
        const slug = String(data.slug ?? fileSlug);
        const lines = [];

        if (!rawDesc && !Boolean(data.draft)) {
            const excerpt = extractExcerpt(content, 160);
            if (excerpt) {
                if (apply) {
                    data.description = excerpt;
                    updatedDescription += 1;
                    lines.push(`  description: "" → "${excerpt.slice(0, 80)}…"`);
                } else {
                    wouldUpdateDescription += 1;
                    lines.push(`  description: "" → "${excerpt.slice(0, 80)}…"`);
                }
            }
        }

        if (title.length > 60) {
            warnings += 1;
            lines.push(`  warn: title length ${title.length} > 60`);
        }

        if (isHashSlug(slug)) {
            warnings += 1;
            lines.push(`  warn: hash-like slug ${slug} (use --force-slug to rename)`);
        }

        if (apply && forceSlug && slug !== fileSlug) {
            const newPath = path.join(resolvedPosts, `${slug}.md`);
            assertPostsPath(newPath);
            lines.push(`  slug rename: ${fileSlug} → ${slug}`);
        }

        if (lines.length) {
            console.log(`content/posts/${file}`);
            for (const line of lines) console.log(line);
        }

        if (apply && String(data.description ?? '').trim() !== rawDesc) {
            assertPostsPath(filePath);
            const { content: body } = parseFrontmatter(post.raw);
            const fileContent = stringifyFrontmatter(body, data);
            await writeFile(filePath, fileContent, 'utf8');

            if (forceSlug && slug !== fileSlug) {
                const newPath = path.join(resolvedPosts, `${slug}.md`);
                await rename(filePath, newPath);
            }
        }
    }

    return {
        scanned: posts.length,
        wouldUpdateDescription: apply ? updatedDescription : wouldUpdateDescription,
        updatedDescription,
        warnings,
    };
}

async function main() {
    const flags = parseArgs(process.argv.slice(2));
    const posts = await scanPosts();
    const result = await runMetaBatch(posts, {
        apply: flags.apply,
        forceSlug: flags.forceSlug,
    });

    console.log(`Posts scanned: ${result.scanned}`);
    if (flags.apply) {
        console.log(`Updated (description): ${result.updatedDescription}`);
    } else {
        console.log(`Would update (description): ${result.wouldUpdateDescription}`);
    }
    if (result.warnings > 0) {
        console.log(`Warnings: ${result.warnings}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
