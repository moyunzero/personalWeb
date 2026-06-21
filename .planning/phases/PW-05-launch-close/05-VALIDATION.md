---
phase: 5
slug: launch-close
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 5 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest + optional live `fetch` |
| Quick run | `yarn test tests/verify-production.test.ts` |
| Production gate | `yarn verify:prod` |
| Pre-deploy | `yarn build && yarn test:uat:4` |

## Per-Task Verification Map

| Task ID | Plan | Requirement | Automated Command | Status |
|---------|------|-------------|-------------------|--------|
| 05-01-T1 | 01 | LAUNCH-03 | git has astro src + public verify files | ⬜ |
| 05-01-T2 | 01 | LAUNCH-03 | GH Actions deploy success | ⬜ |
| 05-01-T3 | 01 | LAUNCH-03 | `yarn verify:prod` | ⬜ |
| 05-02-T1 | 02 | LAUNCH-04 | baidu file in public/ | ⬜ |
| 05-02-T4 | 02 | LAUNCH-04/05 | human checkpoint | ⬜ manual |
| 05-03-T1 | 03 | MILE-01 | REQUIREMENTS 27/27 `[x]` | ⬜ |
| 05-03-T2 | 03 | MILE-02 | MILESTONES v1.0 complete | ⬜ |

## Manual-Only

| Behavior | Why |
|----------|-----|
| 三平台 sitemap 提交 | External accounts |
| Rich Results Test 3 URLs | Google external tool |
