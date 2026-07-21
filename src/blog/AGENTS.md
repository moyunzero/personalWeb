# Blog parsing (shared JS)

## Overview

Shared post parsing utilities used by the Content Collection loader, CLI scripts, and tests. Astro pages should use Content Collections (`getCollection`, `getEntry`) via `src/lib/blog.ts`.

## Key files

| File | Owns |
|---|---|
| `src/blog/frontmatter.js` | YAML frontmatter parse (no Node Buffer) |
| `src/blog/parsePost.js` | Single file → structured post object |
| `src/blog/excerpt.js` | Excerpt helpers |
| `src/blog/getCategories.js` | Category helpers |
| `src/blog/getRelatedPosts.js` | Related post selection |
| `src/blog/utils.js` | Shared blog helpers |
| `src/loaders/posts-loader.ts` | Astro Content Collection loader |
| `src/lib/blog.ts` | Build time helpers for Astro pages |

## Conventions

- Loader reads `content/posts/*.md`, validates with `postDataSchema`, maps to collection fields (`publishedAt`, `draft`, etc.).
- `getPublishedPosts()` in `src/lib/blog.ts` filters out drafts for static paths.
- Frontmatter field `date` maps to collection `publishedAt`.

## Gotchas

- SPA era helpers (`loadPosts.js`, `normalizeMarkdown.js`, and related index builders) were removed; do not restore them.
- `src/lib/markdown.ts` rewrites relative image paths with hardcoded `/personalWeb/`. Update if base path changes.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
