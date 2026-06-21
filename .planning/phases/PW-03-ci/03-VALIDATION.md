---
phase: 3
slug: ci
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `vitest.config.js` (from Phase 1) |
| **Quick run command** | `yarn test` |
| **Full suite command** | `yarn test && yarn seo:audit && yarn build` |
| **Estimated runtime** | ~90–180 seconds |

---

## Sampling Rate

- **After every task commit:** `yarn test` for script/schema tasks; `yarn seo:audit` after audit wiring
- **After every plan wave:** `yarn test && yarn seo:audit`
- **Before `/gsd-verify-work`:** `yarn seo:meta-batch --dry-run` (0 would-update) + `yarn build` green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 01 | 1 | FLOW-03 | T-PW03-01 | Writes only under `content/posts/` | unit | `yarn test tests/post-schema.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-T2 | 01 | 1 | FLOW-03 | T-PW03-02 | Slug unchanged without `--force-slug` | unit | `yarn test tests/meta-batch.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-T3 | 01 | 1 | FLOW-03 | — | seo:meta-batch script registered | integration | `yarn seo:meta-batch --dry-run \| grep Posts scanned` | ❌ | ⬜ pending |
| 03-02-T1 | 02 | 2 | SEO-05 | — | Audit exits 1 on error | unit | `yarn test tests/seo-audit.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 02 | 2 | SEO-05 | — | seo:audit script only (build deferred) | integration | `node -e package.json seo:audit` | ❌ | ⬜ pending |
| 03-02-T3 | 02 | 2 | FLOW-01 | — | blog:new template validates | unit | `yarn test tests/post-schema.test.ts -t blog:new` | ❌ W0 | ⬜ pending |
| 03-02-T4 | 02 | 2 | FLOW-02 | — | notion shape validates | unit | `yarn test tests/post-schema.test.ts -t notion` | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03 | 3 | OPT-01 | — | batch apply + build chain | integration | `yarn seo:meta-batch --dry-run` + `yarn seo:audit` | ❌ | ⬜ pending |
| 03-03-T2 | 03 | 3 | OPT-02 | — | strict schema rejects empty desc | unit+build | `yarn test tests/post-schema.test.ts -t strict` | ❌ W0 | ⬜ pending |
| 03-03-T3 | 03 | 3 | OPT-02 | — | full build with strict schema | integration | `yarn build` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/lib/post-schema.mjs` — canonical Zod schema
- [ ] `scripts/lib/scan-posts.mjs` — post enumeration
- [ ] `scripts/lib/meta-rules.mjs` — audit rules
- [ ] `tests/post-schema.test.ts` — schema + strict mode + draft exemption
- [ ] `tests/meta-batch.test.ts` — dry-run/apply/slug guard
- [ ] `tests/seo-audit.test.ts` — severity + exit codes
- [ ] `package.json` scripts: `seo:audit`, `seo:meta-batch`, updated `build`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI deploy gate | SEO-05 | Needs push to Actions | Push branch; confirm failed build on intentional audit error |
| Batch corpus review | OPT-01 | Human quality check | Spot-read 5 applied descriptions for accuracy |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
