---
phase: PW-01-astro-ssg
plan: 02
status: complete
---

# 01-02 Summary

## Delivered

- Custom `posts-loader` using `parsePost` / `parseFrontmatter` (D-09)
- `src/content.config.ts` with Zod schema
- Blog list (`/blog/`) grouped by year; detail SSG for all published posts
- `BlogPostCard.astro`, `src/lib/blog.ts`, `src/lib/posts.ts`
- Markdown body via `src/lib/markdown.ts` (remark + rehype-highlight)

## Verification

- 96 published posts built as static HTML with body content
- `yarn test tests/content.schema.test.ts` passes
