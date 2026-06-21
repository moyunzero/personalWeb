---
phase: 4
slug: content-launch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 + Playwright 1.49.0 |
| **Config file** | `playwright.config.ts` (baseURL `/personalWeb/`) |
| **Quick run command** | `yarn test --run tests/top-n-score.test.ts` |
| **Full suite command** | `yarn test:uat:4` (vitest + phase4 e2e + optional perf) |
| **Perf command** | `yarn perf:audit` (LHCI against preview) |
| **Estimated runtime** | ~120–300 seconds |

---

## Sampling Rate

- **After every task commit:** unit tests for scoring/checklist helpers
- **After every plan wave:** `yarn build && yarn test:e2e tests/e2e/phase4-launch-uat.spec.ts`
- **Before `/gsd-verify-work`:** `yarn perf:audit` green + `yarn seo:audit` + build green
- **Max feedback latency:** 300 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-T1 | 01 | 1 | SEO-07 | — | Related adapter maps slug→id | unit | `yarn test tests/related-posts.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-T2 | 01 | 1 | SEO-07 | — | RelatedPosts renders 3 links | e2e | `playwright test -g related` | ❌ W0 | ⬜ pending |
| 04-01-T3 | 01 | 1 | SEO-08 | — | Category hub + nav HTML | integration | `yarn build:astro && test -f dist/blog/category/note/index.html` | ❌ | ⬜ pending |
| 04-01-T4 | 01 | 1 | SEO-07/08 | — | e2e related + category + game | e2e | `yarn test:e2e tests/e2e/phase4-launch-uat.spec.ts` | ❌ W0 | ⬜ pending |
| 04-02-T1 | 02 | 2 | OPT-03 | — | Scoring ranks 15–20 slugs | unit | `yarn test tests/top-n-score.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-T2 | 02 | 2 | OPT-03 | — | CLI writes queue JSON | integration | `yarn seo:top-n-score --write` | ❌ | ⬜ pending |
| 04-02-T3 | 02 | 2 | OPT-04 | — | Checklist script on queue | unit/cli | `node scripts/seo-top-n-checklist.mjs` | ❌ W0 | ⬜ pending |
| 04-02-T4 | 02 | 2 | OPT-04 | — | Content + cross-links pass checklist | integration | `yarn build && node scripts/seo-top-n-checklist.mjs` | ❌ | ⬜ pending |
| 04-03-T1 | 03 | 3 | LAUNCH-02 | — | Island deferral no UAT regression | e2e | `yarn test:uat:4` (in T3) | ❌ W0 | ⬜ pending |
| 04-03-T2 | 03 | 3 | LAUNCH-02 | — | Performance ≥ 85, LCP < 2.5s | perf | `yarn build && yarn perf:audit` | ❌ W0 | ⬜ pending |
| 04-03-T3 | 03 | 3 | LAUNCH-01 | — | Webmaster doc + UAT | manual+e2e | `yarn test:uat:4` + doc exists | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/related-posts.test.ts` — adapter + scoring parity
- [ ] `tests/top-n-score.test.ts` — keyword/quality/hub scoring
- [ ] `tests/e2e/phase4-launch-uat.spec.ts` — SEO-07/08 smoke
- [ ] `lighthouserc.json` + `yarn perf:audit` script
- [ ] `scripts/seo-top-n-score.mjs` + `scripts/seo-top-n-checklist.mjs`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Webmaster sitemap submit | LAUNCH-01 | Needs G/Bing/Baidu accounts | Follow `docs/WEBMASTER-SUBMISSION.md` |
| Rich Results Test | ROADMAP | Google external tool | Test 3 URLs from doc table |
| Top N content quality | OPT-04 | Human editorial judgment | Spot-read 5 optimized posts |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 gaps tracked and closed before wave execution
