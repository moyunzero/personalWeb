---
phase: 1
slug: astro-ssg
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (declared in package.json) |
| **Config file** | none — Wave 0 installs `vitest.config.js` |
| **Quick run command** | `yarn test` |
| **Full suite command** | `yarn test && yarn build` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** `yarn test` (once Wave 0 exists); `yarn build` for build-touching tasks
- **After every plan wave:** `yarn build && yarn test`
- **Before `/gsd-verify-work`:** Full suite green; manual view-source on one blog URL
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01 | 01 | 1 | MIGR-01 | integration | `yarn build` | ❌ W0 | ⬜ pending |
| 01-02 | 02 | 1 | MIGR-02, MIGR-03 | unit+integration | `yarn test tests/content.schema.test.ts` | ❌ W0 | ⬜ pending |
| 01-03 | 03 | 1 | SEO-01, SEO-02, SEO-06 | integration | `yarn test tests/seo-head.test.ts` | ❌ W0 | ⬜ pending |
| 01-04 | 04 | 2 | MIGR-04, SEO-04 | smoke+integration | `yarn test tests/sitemap.test.ts` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `vitest.config.js` — Node env, path aliases
- [ ] `tests/frontmatter.test.ts` — Notion YAML edge cases (D-09)
- [ ] `tests/seo-head.test.ts` — parse `dist/**/index.html` meta + JSON-LD
- [ ] `tests/sitemap.test.ts` — sitemap URLs with trailing slash
- [ ] `tests/content.schema.test.ts` — Zod schema fixtures (MIGR-03)
- [ ] Astro + integrations install in plan 01-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GH Pages live deploy | MIGR-04 | Needs GitHub | Push to master; open deployed `/blog/` and one post |
| View-source body text | MIGR-02 | Human SEO check | Confirm article markdown in HTML without JS |

---

## Phase Gate Checklist

- [ ] `yarn build` exits 0
- [ ] `yarn test` exits 0
- [ ] Sitemap URL count = published posts + home + blog index
- [ ] One blog post Rich Results Test / view-source passes
