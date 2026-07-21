# Content (blog)

## Overview

Authoritative blog source: Markdown posts, category taxonomy, and SEO queue data. Notion sync and `yarn blog:new` both write here. Astro Content Collections load from `content/posts/` at build time.

## Key files

| File | Owns |
|---|---|
| `content/posts/*.md` | Article bodies and frontmatter |
| `content/categories.json` | Category `id` / `label` / `order` |
| `content/top-n-queue.json` | Top N SEO optimization queue |

## Conventions

- Post images go in `public/images/blog/<slug>/`; reference as `images/blog/<slug>/cover.jpg` in frontmatter.
- `categories` in frontmatter must use `id` values from `categories.json`.
- New CLI posts default to `draft: true` until you set `draft: false`.
- Published posts (`draft: false`) need `title`, `date`, and `description` or `yarn build` fails the SEO audit.

## Gotchas

- Do not set `draft: false` without a real `description`.
- Notion sync only pulls pages with Status `Published` or `已发布`.
- Slug can be set in Notion; hash like slugs trigger SEO warnings.

## Related specs

- [docs/SEO-MIGRATION-DESIGN.md](../docs/SEO-MIGRATION-DESIGN.md)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
