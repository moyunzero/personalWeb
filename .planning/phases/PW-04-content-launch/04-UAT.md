---
status: partial
phase: PW-04-content-launch
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md
started: 2026-06-21T22:22:00.000Z
updated: 2026-06-21T22:25:00.000Z
---

## Current Test

[testing paused — 2 manual LAUNCH-01 items outstanding]

number: 11
name: Webmaster Sitemap Submission
expected: |
  Follow docs/WEBMASTER-SUBMISSION.md: submit sitemap-index.xml to Google Search Console, Bing Webmaster, and 百度站长平台.
awaiting: user confirmation (reply yes when done, or describe blockers)

## Tests

### 1. Related Posts on Blog Detail (SEO-07)
expected: Every published blog detail shows exactly 3 related internal links in static HTML (`data-testid="related-posts"`).
result: pass
note: Auto — dist HTML + `tests/e2e/phase4-launch-uat.spec.ts`

### 2. Category Hub Pages (SEO-08)
expected: Static pages at `/blog/category/note/` (and daily, reading, psychology) list filtered posts; build emits `dist/blog/category/*/index.html`.
result: pass
note: Auto — dist file check + Playwright category hub test

### 3. Category Navigation on Blog List
expected: `/blog/` shows pill nav with links to all category hub URLs (e.g. `blog/category/note`).
result: pass
note: Auto — dist grep + Playwright

### 4. Category Badges Link on Detail
expected: Category badges on article detail link to matching `/blog/category/{id}/` URLs.
result: pass
note: Auto — implemented in `[...slug].astro`; covered by build

### 5. Top N Queue (OPT-03)
expected: `content/top-n-queue.json` contains 15–20 ranked slugs; `yarn seo:top-n-score --dry-run` exits 0.
result: pass
note: Auto — queue has 20 posts, method `no-ga-fallback-v1`

### 6. Top N Checklist (OPT-04)
expected: `yarn seo:top-n-checklist` exits 0 (0 errors on queue slugs); warnings acceptable.
result: pass
note: Auto — 0 errors, 11 warnings (MoCode title-keyword)

### 7. Build + SEO Audit Gate
expected: `yarn build` completes; `yarn seo:audit` reports 0 errors.
result: pass
note: Auto — 103 pages, 34 warnings acceptable

### 8. Home Performance (LAUNCH-02)
expected: `yarn perf:audit` passes — Lighthouse Performance ≥ 85, LCP < 2500 ms (mobile simulated, 3 runs).
result: pass
note: Auto — LHCI autorun green (2026-06-21 verify run)

### 9. Game Island Click-to-Load (D-P4-10)
expected: Home shows「点击启动忍者」button before click; hero text visible without island delay.
result: pass
note: Auto — Playwright phase4 game smoke tests

### 10. Webmaster Documentation (LAUNCH-01 docs)
expected: `docs/WEBMASTER-SUBMISSION.md` exists with Google/Bing/Baidu sections; README links to it.
result: pass
note: Auto — file + README grep

### 11. Webmaster Sitemap Submission (LAUNCH-01 manual)
expected: Sitemap submitted to Google Search Console, Bing Webmaster Tools, and 百度站长平台 per doc.
result: pending
note: Requires user accounts — cannot automate in CI

### 12. Rich Results Test — 3 Posts (ROADMAP criterion)
expected: Google Rich Results Test passes for 3 URLs in WEBMASTER-SUBMISSION.md (BlogPosting valid).
result: pending
note: External Google tool — user manual verification

### 13. Phase 4 Automated UAT Suite
expected: `yarn test:uat:4` — 15 vitest + 5 Playwright tests pass.
result: pass
note: Auto — 20/20 passed on verify run

## Summary

total: 13
passed: 11
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

[none — automated scope complete; pending items are external manual checkpoints]

## Automation

```bash
yarn build
yarn seo:audit
yarn seo:top-n-checklist
yarn test:uat:4
yarn perf:audit   # ~2 min, needs preview on :4321
```

Manual after deploy:

1. Submit sitemap per [docs/WEBMASTER-SUBMISSION.md](docs/WEBMASTER-SUBMISSION.md)
2. Rich Results Test on 3 documented blog URLs
