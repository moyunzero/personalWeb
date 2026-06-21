---
phase: 2
slug: site-islands
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + `yarn build` dist inspection |
| **Config file** | `vitest.config.js` (from Phase 1) |
| **Quick run command** | `yarn test` |
| **Full suite command** | `yarn test && yarn build` |
| **Estimated runtime** | ~60–120 seconds |

---

## Sampling Rate

- **After every task commit:** `yarn test` for test-touching tasks; `yarn build` for page/island tasks
- **After every plan wave:** `yarn build && yarn test`
- **Before `/gsd-verify-work`:** Full suite; manual Phaser click-gate + anchor nav on home
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-T1 | 01 | 1 | SEO-03 | unit+integration | `yarn test tests/home-seo.test.ts` | ✅ pass |
| 02-01-T2 | 01 | 1 | MIGR-05 | integration | `yarn build && grep id="about"/id="work"` | ✅ pass |
| 02-01-T3 | 01 | 1 | OPT-05 | integration | `yarn build` + featured links in dist | ✅ pass |
| 02-01-T4 | 01 | 1 | MIGR-06 | build | `yarn build` (HomeMotion chunk exists) | ✅ pass |
| 02-02-T1 | 02 | 2 | MIGR-07 | unit+build | `yarn test tests/game-island.test.ts` | ✅ pass |
| 02-02-T2 | 02 | 2 | OPT-06 | integration | `yarn build && grep 心晴` | ✅ pass |
| 02-03-T1 | 03 | 3 | MIGR-08 | integration | `yarn test tests/editor-route.test.ts` | ✅ pass |
| 02-03-T2 | 03 | 3 | MIGR-08 | doc | README has blog:new + notion:sync | ✅ pass |

---

## Wave 0 Requirements

- [x] `vitest.config.js` — from Phase 1
- [x] `tests/home-seo.test.ts`
- [x] `tests/game-island.test.ts`
- [x] `tests/editor-route.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phaser chunk gating | MIGR-07 | Network tab | Open home; confirm no phaser request until click |
| Anchor navigation | MIGR-05 | Lenis interaction | Click 了解更多 / nav to #about, #work |
| GSAP reveal | MIGR-06 | Visual | Scroll home; sections fade in |
| Particle + trail | D-21 | Visual | Ambient canvas effects visible on home |

---

## Phase Gate Checklist

- [x] `yarn build` exits 0
- [x] `yarn test` exits 0
- [ ] Home view-source: WebSite + Person JSON-LD (automated grep pass)
- [ ] `/blog/editor` 404 in preview (no dist path)
- [x] README: CLI + Notion only
