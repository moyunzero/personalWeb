---
phase: PW-01-astro-ssg
plan: 04
status: complete
---

# 01-04 Summary

## Delivered

- `@astrojs/sitemap` → `sitemap-index.xml` + `sitemap-0.xml`
- `robots.txt.ts` (sitemap-index), `sitemap.xml.ts` (legacy alias)
- Placeholder homepage (~200 字 crawlable text), `404.astro`, static `public/404.html`
- Removed stale `public/posts-index.json`, `public/sitemap.xml`, `public/robots.txt`
- `package.json`: `dev`/`build`/`preview` → Astro only; `deploy.yml` simplified
- `tests/sitemap.test.ts`

## Verification

- `yarn test && yarn build` pass
- No SPA `replaceState` in `dist/404.html`
- CI runs `yarn build` only (no Vite / generate-static)
