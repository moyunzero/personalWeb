# Content (blog)

## Overview

Authoritative blog source: Markdown posts, category taxonomy, and SEO queue data. Notion sync and `yarn blog:new` both write here. Astro Content Collections load from `content/posts/` at build time.

## Key files

| File | Owns |
|---|---|
| `content/posts/*.md` | Article bodies and frontmatter |
| `content/categories.json` | Category `id` / `label` / `order` / `seoTitle` / `description` |
| `content/top-n-queue.json` | Top N SEO optimization queue |
| `content/timeline/events.json` | 大模型时间轴数据（`yarn timeline:sync` 写入；slug `ai-timeline` 页读取） |

## Conventions

- Post images go in `public/images/blog/<slug>/`; reference as `images/blog/<slug>/cover.jpg` in frontmatter.
- `categories` in frontmatter must use `id` values from `categories.json`.
- New CLI posts default to `draft: true` until you set `draft: false`.
- Published posts (`draft: false`) need `title`, `date`, and `description` or `yarn build` fails the SEO audit.
- 可选 SEO 覆盖项：`seoTitle`（只改 `<title>`，用于标题过短/过长的文章）、`seoDescription`（只改 meta description）。两者都不动 H1 与页面文案，`yarn notion:sync` 会原样保留。
- `categories.json` 的 `seoTitle` / `description` 供分类页 `<title>` 与 meta description 使用，改文案时保持与分类实际内容一致。

## Gotchas

- Do not set `draft: false` without a real `description`.
- Notion sync only pulls pages with Status `Published` or `已发布`.
- Slug can be set in Notion; hash like slugs trigger SEO warnings.

## Related specs

- [docs/SEO-MIGRATION-DESIGN.md](../docs/SEO-MIGRATION-DESIGN.md)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
