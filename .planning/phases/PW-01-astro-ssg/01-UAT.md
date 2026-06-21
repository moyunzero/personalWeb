---
status: complete
phase: PW-01-astro-ssg
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md
started: 2026-06-21T18:45:00.000Z
updated: 2026-06-21T19:30:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Placeholder Homepage
expected: Open http://localhost:4321/personalWeb/ — dark page with H1「墨韵」, crawlable Chinese intro paragraphs, and「进入博客」link. No interactive homepage island.
result: pass

### 2. Blog List Page
expected: Open http://localhost:4321/personalWeb/blog/ — heading「博客」, posts listed in year groups (e.g. 2026, 2025), each card shows title, excerpt, categories/tags, date. Draft posts should not appear.
result: pass

### 3. Blog Article Body
expected: Open http://localhost:4321/personalWeb/blog/2026-06-14-mocode-phase-1/ — article shows title, meta row (author, date, read time), and full markdown body (headings, paragraphs, code blocks). Content visible without waiting for client-side fetch.
result: pass

### 4. SEO Head in Page Source
expected: On blog list or any article, View Source shows html lang="zh-CN", meta description, link rel="canonical" ending with trailing slash, og:title tags; article pages include og:type article and BlogPosting JSON-LD.
result: pass

### 5. 404 Page
expected: Open a non-existent URL like http://localhost:4321/personalWeb/blog/does-not-exist/ — shows「页面未找到」with links to home and blog. No redirect loop or SPA ?/ query hack.
result: pass

### 6. Sitemap and Robots
expected: http://localhost:4321/personalWeb/robots.txt lists Sitemap pointing to sitemap-index.xml. http://localhost:4321/personalWeb/sitemap-index.xml (or sitemap-0.xml) lists home, blog index, and published post URLs with trailing slashes.
result: pass

### 7. Cross-Navigation
expected: From homepage,「进入博客」opens blog list. From blog header/nav,「博客」link works. Article cards link to correct /blog/{slug}/ URLs.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
