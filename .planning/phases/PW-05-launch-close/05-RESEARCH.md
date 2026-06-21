# Phase 5: v1.0 上线收尾 - Research

**Researched:** 2026-06-21
**Domain:** GitHub Pages production deploy + webmaster verification + Rich Results UAT + milestone close
**Confidence:** HIGH

## Summary

Phase 5 closes the v1.0 milestone by shipping the **already-built** Astro site to production, completing **external** webmaster and Rich Results checkpoints deferred from Phase 4 UAT (tests 11–12), and marking all 27 v1.0 requirements complete.

**Critical blocker discovered:** Production at `https://moyunzero.github.io/personalWeb/` is still the **legacy React SPA** (`lang="en"`, SPA redirect script, old `sitemap.xml` with `/blog` without trailing slash) [VERIFIED: `curl` 2026-06-21]. Google/Bing verification URLs return **404**; `sitemap-index.xml` returns **404**. Locally, `yarn build` correctly emits verification files and Astro routes in `dist/` [VERIFIED: local build]. The Astro migration implementation exists in the working tree but **~132 files are uncommitted**; `astro.config.mjs` and `src/pages/index.astro` are **not tracked in git** [VERIFIED: `git ls-files`, `git status`]. `master` is 7 commits ahead of `origin/master` but those commits are **planning docs only** — not application code.

**Baidu gap:** Google (`public/googleef60eaecd43955c6.html`) and Bing (`public/BingSiteAuth.xml`) verification files exist in repo [VERIFIED: codebase]. **No Baidu verification file** — user must download `baidu_verify_*.html` from [百度搜索资源平台](https://ziyuan.baidu.com/) and place in `public/` before Baidu file verification [CITED: ziyuan.baidu.com/college/courseinfo?id=267].

**Rich Results:** Google provides **no official public API** for Rich Results Test [CITED: Google Search Central Community thread 106228067]. v1.0 uses **manual** Google tool per `docs/WEBMASTER-SUBMISSION.md` plus existing build-time proxy `tests/seo-head.test.ts` (BlogPosting JSON-LD in `dist/`) [VERIFIED: codebase].

**Primary recommendation:** Three-wave execution — (1) commit all implementation + push `master` + production smoke script; (2) Baidu file + human webmaster/Rich Results UAT; (3) mark `REQUIREMENTS.md` complete + ROADMAP/STATE/milestone close.

<user_constraints>
## User Constraints (from orchestrator + Phase 4 carryover — no CONTEXT.md)

### Locked Decisions

| ID | Decision | Source |
|----|----------|--------|
| D-P5-01 | **GitHub Pages** remains host; URL prefix `/personalWeb/` unchanged | PROJECT.md Out of Scope; INFRA-01 deferred |
| D-P5-02 | Deploy via existing **`deploy.yml`** (`yarn build` → `dist/` → `deploy-pages`) | MIGR-04; `.github/workflows/deploy.yml` |
| D-P5-03 | Google + Bing verification files **already in `public/`** — deploy, do not regenerate | User context; `docs/WEBMASTER-SUBMISSION.md` |
| D-P5-04 | **Baidu file verification** — user downloads from 百度站长, add to `public/`, redeploy if needed | LAUNCH-01; no file in repo yet |
| D-P5-05 | **Manual**三平台 sitemap submit + **manual** Rich Results 3 URLs | Phase 4 UAT tests 11–12 pending; not CI-automatable |
| D-P5-06 | Complete Phase 4 UAT **11–12** before claiming LAUNCH-01 / ROADMAP criterion 4 done | `04-UAT.md` |
| D-P5-07 | Mark all **27 v1.0 requirements** `[x]` in `REQUIREMENTS.md` on milestone close | Phase 5 goal |
| D-P5-08 | **Zero extra cost** — no custom domain, CDN, analytics (INFRA/ANAL deferred v2) | PROJECT.md |

### Claude's Discretion

- Whether to use one mega-commit vs phased commits for uncommitted implementation
- Production smoke: shell script vs Vitest `fetch` test vs Playwright against production URL
- Baidu: file verification vs HTML meta tag in `BaseLayout.astro` (if file upload blocked)
- `05-UAT.md` structure: extend 04-UAT vs standalone phase UAT
- Git tag `v1.0.0` on milestone close (config `git.create_tag: false` — optional human ask)
- Post-close ROADMAP: add Phase 5 entry or annotate Phase 4 human items complete

### Deferred Ideas (OUT OF SCOPE)

- Custom domain / CDN (INFRA-01/02)
- GA / 百度统计 (ANAL-01)
- Rich Results Test API / third-party paid validators
- Lighthouse in GitHub Actions deploy gate
- Automating Search Console / Bing / Baidu sitemap submission
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 5 does not introduce new requirement IDs — it **closes** all v1.0 items still marked Pending in `REQUIREMENTS.md` after production deploy and human UAT.

| ID | Description | Research Support |
|----|-------------|------------------|
| LAUNCH-01 | 三平台站长 sitemap 提交（文档 + 实际提交） | `docs/WEBMASTER-SUBMISSION.md` exists (Phase 4); tests 11 pending until user submits after production deploy |
| LAUNCH-02 | 首页 Performance ≥ 85, LCP < 2.5s | Phase 4 `yarn perf:audit` passed locally; re-verify post-deploy optional smoke |
| MIGR-01–08 | Astro migration + islands + no editor | Implemented in working tree; blocked on commit + deploy |
| SEO-01–08 | Build-time SEO, sitemap, related posts, categories | Implemented; production 404 until deploy |
| FLOW-01–03 | CLI meta-batch, notion, audit | Implemented in working tree |
| OPT-01–06 | Batch metadata, Top N, perf, project meta | Phase 4 complete per UAT |
</phase_requirements>

## Phase Scope

| Wave | Plan | Focus | Deliverables |
|------|------|-------|--------------|
| 05-01 | 提交 + 生产部署 + 冒烟 | Uncommitted code → git; push `master`; GH Actions green; production URL checks | All implementation committed; verification URLs 200; `sitemap-index.xml` live |
| 05-02 | 百度验证 + 站长/Rich Results UAT | Baidu file in `public/`; human三平台 sitemap; Rich Results 3 posts | `04-UAT.md` tests 11–12 pass; optional `05-UAT.md` |
| 05-03 | 需求勾选 + 里程碑收尾 | `REQUIREMENTS.md` 27/27 `[x]`; ROADMAP/STATE/PROJECT update; milestone summary | v1.0 formally closed |

**Explicitly out of scope:** New features, perf re-tuning, custom domain, analytics, CI Rich Results gate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Application code in git | Developer / git | — | Source of truth before deploy |
| Static build (`yarn build`) | CI runner (GitHub Actions) | Local dev | `seo:audit` gate then `astro build` |
| Production hosting | CDN / GitHub Pages | — | Serves `dist/` at `/personalWeb/` |
| Verification files (G/Bing/Baidu) | CDN / static (`public/` → `dist/`) | — | Must be fetchable at documented URLs |
| Sitemap discovery | Build-time `@astrojs/sitemap` | Webmaster UIs | `sitemap-index.xml` submitted manually |
| Webmaster ownership proof | External platform UIs | — | User credentials; not in repo |
| Rich Results validation | External Google tool | Build-time JSON-LD tests | Google is authoritative; tests are proxy |
| Requirements traceability | `.planning/REQUIREMENTS.md` | ROADMAP | Milestone close artifact |
| Milestone state | `.planning/STATE.md` | PROJECT.md | GSD orchestration |

## Project Constraints (from .cursor/rules/)

- **Codegraph MCP:** Use `codegraph_explore` / correct param names (`task` vs `query`) for structure questions before grep loops.
- **Karpathy guidelines:** Minimal scope — Phase 5 is deploy + UAT + docs, not new features; no "顺便" refactors; surgical commits only.
- **Frontend design:** N/A for launch-close (no UI work).

## Standard Stack

### Core (existing — no new installs)

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Astro | **5.18.x** | SSG output | Entire v1.0 migration target [VERIFIED: `package.json`] |
| `@astrojs/sitemap` | **3.7.x** | `sitemap-index.xml` | Already integrated [VERIFIED: `astro.config.mjs`] |
| GitHub Actions `deploy-pages` | v4 | Production deploy | Project standard [VERIFIED: `deploy.yml`] |
| `docs/WEBMASTER-SUBMISSION.md` | — | Operator runbook | Phase 4 deliverable [VERIFIED: file exists] |
| Vitest + Playwright | 4.1.5 / 1.49.0 | Pre-deploy regression | `yarn test:uat:4` [VERIFIED: `package.json`] |
| `tests/seo-head.test.ts` | — | JSON-LD build proxy | BlogPosting in built HTML [VERIFIED: codebase] |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `curl` / `fetch` smoke | Production URL 200 checks | After deploy (verification files, blog sample, sitemap) |
| [Rich Results Test](https://search.google.com/test/rich-results) | Authoritative structured data | Manual UAT test 12 |
| [Google Search Console](https://search.google.com/search-console) | Verify + sitemap | Manual UAT test 11 |
| [Bing Webmaster](https://www.bing.com/webmasters) | Verify + sitemap | Manual UAT test 11 |
| [百度搜索资源平台](https://ziyuan.baidu.com/) | Baidu verify + sitemap | Manual UAT test 11 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Rich Results | `schema-guard` / third-party API | Adds dep + not Google-authoritative; rejected for v1.0 |
| Baidu file in `public/` | HTML meta in `BaseLayout.astro` | Meta works when file upload awkward; file preferred per Baidu docs |
| Single deploy commit | Multi-commit history | User discretion; single commit simpler for first Astro ship |

**Installation:** None — Phase 5 installs **zero** new packages.

## Package Legitimacy Audit

> Phase 5 adds no external packages. Audit skipped.

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Working tree (uncommitted Astro) ──git commit──► master branch
        │
        ▼
push master ──► GitHub Actions deploy.yml
        │              │
        │              ├── yarn install
        │              ├── yarn build (seo:audit + astro build)
        │              └── upload dist/ ──► GitHub Pages CDN
        │                                        │
        │                                        ├── /personalWeb/ (home, blog/*)
        │                                        ├── /personalWeb/googleef60eaecd43955c6.html
        │                                        ├── /personalWeb/BingSiteAuth.xml
        │                                        ├── /personalWeb/baidu_verify_*.html (05-02)
        │                                        └── /personalWeb/sitemap-index.xml
        │
        ▼
User (manual) ──► GSC / Bing / Baidu: verify ownership → submit sitemap-index.xml
        │
        ▼
User (manual) ──► Rich Results Test × 3 blog URLs
        │
        ▼
Planner ──► REQUIREMENTS.md all [x] + STATE/ROADMAP milestone close
```

### Pattern 1: Astro `public/` → production verification assets

**What:** Files in `public/` copy as-is to `dist/` root; with `base: '/personalWeb/'`, URLs are `https://moyunzero.github.io/personalWeb/{filename}` [CITED: /withastro/docs — publicDir, imports guide].

**When:** Any site verification file (Google HTML, Bing XML, Baidu HTML).

**Example:**

```bash
# After deploy — must return 200 + correct body
curl -s "https://moyunzero.github.io/personalWeb/googleef60eaecd43955c6.html"
# google-site-verification: googleef60eaecd43955c6.html
```

### Pattern 2: Pre-deploy gate → push → post-deploy smoke

**What:** Run full automated UAT locally; push only when green; smoke production URLs before webmaster UI steps.

**When:** Every production deploy in Phase 5.

**Anti-pattern:** Submit sitemap before deploy — webmaster verification and sitemap URLs 404 (current state).

### Pattern 3: Human checkpoint for external platforms

**What:** Pause UAT at tests 11–12; resume when user confirms or describes blockers (Phase 4 pattern).

**When:** LAUNCH-01 completion and ROADMAP Rich Results criterion.

### Anti-Patterns to Avoid

- **Claiming LAUNCH-01 done with docs only:** Phase 4 test 10 passed; test 11 requires actual submission.
- **Skipping commit of implementation:** Planning-only commits do not change production.
- **Deleting verification files after verify:** Baidu/Google periodically re-check [CITED: ziyuan.baidu.com].
- **Using old `sitemap.xml` URL:** Astro emits `sitemap-index.xml`; update webmaster submissions accordingly.
- **Automating Rich Results in CI:** No official API; flaky third-party tools add cost and false confidence.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Production deploy | Custom FTP/rsync | GitHub Actions `deploy-pages` | Already configured; idempotent |
| Verification file hosting | Server middleware | `public/` static copy | Astro standard; zero code |
| Webmaster API integration | Scraping GSC | Documented manual steps | No stable free API; user owns accounts |
| Rich Results validation | Custom Schema.org linter only | Google Rich Results Test + `seo-head.test.ts` | Google eligibility rules change; build test catches regressions |
| Requirements tracking | Spreadsheet | `REQUIREMENTS.md` checkboxes | Project traceability standard |

## Common Pitfalls

### Pitfall 1: Production still on legacy SPA

**What goes wrong:** Verification files 404; blog routes 404; webmaster steps fail; Rich Results tests wrong HTML.

**Why:** Implementation never pushed to `origin/master` [VERIFIED: production curl vs local dist].

**How to avoid:** Commit application code; push `master`; wait for Actions green; smoke before webmaster UI.

**Warning signs:** Home `lang="en"`; SPA redirect script in view-source; `sitemap-index.xml` 404.

### Pitfall 2: Baidu verification file missing or wrong path

**What goes wrong:** 百度站长无法完成文件验证; LAUNCH-01 incomplete for third platform.

**Why:** Baidu issues site-specific `baidu_verify_*.html`; not generated by Google/Bing flow.

**How to avoid:** User downloads from 百度平台 → `public/` → commit → redeploy → curl check → verify in UI [CITED: ziyuan.baidu.com].

**Warning signs:** Only G/Bing files in `public/`; Baidu section in doc says "文件验证" but no file in repo.

### Pitfall 3: Sitemap URL mismatch after Astro migration

**What goes wrong:** Submitted old `sitemap.xml` (SPA generator) instead of `sitemap-index.xml` (Astro).

**Why:** Production still serves legacy sitemap with different URL set [VERIFIED: production `sitemap.xml` content].

**How to avoid:** After deploy, submit `https://moyunzero.github.io/personalWeb/sitemap-index.xml` per `WEBMASTER-SUBMISSION.md`.

### Pitfall 4: Rich Results tested on stale production

**What goes wrong:** Test passes on old SPA or fails on new Astro due to testing before deploy.

**How to avoid:** Run Rich Results only after production smoke confirms Astro blog HTML with JSON-LD.

### Pitfall 5: Marking REQUIREMENTS complete before human UAT

**What goes wrong:** LAUNCH-01 still Pending while milestone declared done.

**How to avoid:** 05-03 blocked on 05-02 user confirmation; tests 11–12 `pass` in `04-UAT.md` first.

## Code Examples

### Production smoke checks (post-deploy)

```bash
SITE="https://moyunzero.github.io/personalWeb"
curl -sf "$SITE/googleef60eaecd43955c6.html" | grep -q 'google-site-verification'
curl -sf "$SITE/BingSiteAuth.xml" | grep -q 'users'
curl -sfI "$SITE/sitemap-index.xml" | grep -q '200'
curl -sf "$SITE/blog/2023-03-12-html/" | grep -q 'BlogPosting'
curl -sf "$SITE/" | grep -q 'lang="zh-CN"'
```

### Pre-deploy regression (unchanged from Phase 4)

```bash
yarn build && yarn seo:audit && yarn test:uat:4
```

### Baidu file placement

```bash
# User downloads baidu_verify_xxxx.html from 百度搜索资源平台
cp ~/Downloads/baidu_verify_xxxx.html public/
yarn build && test -f dist/baidu_verify_xxxx.html
# commit, push, curl production URL, then 完成验证 in Baidu UI
```

Source: [CITED: ziyuan.baidu.com/college/courseinfo?id=267]

### JSON-LD proxy test (pre-Rich Results)

```typescript
// tests/seo-head.test.ts — already asserts BlogPosting in dist HTML
expect(html).toMatch(/application\/ld\+json/);
expect(html).toMatch(/BlogPosting/);
```

## Recommendations for Three Plans

### 05-01: 提交实现 + 生产部署 + 冒烟验收

**Tasks:**
1. Audit working tree: stage all Phase 1–4 implementation (Astro src, scripts, content, tests, `public/` verification files, `deploy.yml`, `package.json`, etc.).
2. Pre-push gate: `yarn build && yarn seo:audit && yarn test:uat:4`.
3. Commit with message reflecting v1.0 Astro ship (user/planner discretion on single vs split commits).
4. Push `master` to `origin`; monitor GitHub Actions `Deploy static content to Pages` job.
5. Add lightweight production smoke (script or test): verification files 200, `sitemap-index.xml` 200, sample blog 200 with `BlogPosting`, home `lang="zh-CN"`.
6. Update `docs/WEBMASTER-SUBMISSION.md` deploy section if branch/commit notes needed.

**Verification:** Production URLs match local `dist/` behavior; legacy SPA symptoms gone.

**Checkpoint:** None — fully automatable except push approval.

### 05-02: 百度验证 + 站长提交 + Rich Results UAT

**Tasks:**
1. User: add site in 百度搜索资源平台 → download `baidu_verify_*.html` → place in `public/` → commit/push if not in 05-01.
2. User: follow `docs/WEBMASTER-SUBMISSION.md` — verify Google (HTML file), Bing (XML), Baidu (file); submit `sitemap-index.xml` on all three.
3. User: Rich Results Test on 3 documented URLs (html, typescript, rag posts).
4. Update `.planning/phases/PW-04-content-launch/04-UAT.md` tests 11–12 to `pass` with notes; optionally create `05-UAT.md` summarizing launch-close.
5. Capture screenshots or notes optional (not required by requirements).

**Verification:** User confirms三平台 sitemap submitted + 3 Rich Results pass; UAT 13/13.

**Checkpoint:** `checkpoint:human-verify` — required before 05-03.

### 05-03: 需求完成 + v1.0 里程碑收尾

**Tasks:**
1. Mark all 27 requirements `[x]` in `.planning/REQUIREMENTS.md`; update Traceability Status column to Complete.
2. Update `.planning/ROADMAP.md`: Phase 4 complete; add Phase 5 entry marked complete; note milestone v1.0 shipped.
3. Update `.planning/STATE.md`: `status: v1.0 complete`, `completed_phases: 5`, clear blockers.
4. Review `.planning/PROJECT.md` per `/gsd-complete-milestone` checklist (Core Value, Out of Scope, Key Decisions).
5. Write `05-01-SUMMARY.md` / `05-02-SUMMARY.md` / `05-03-SUMMARY.md` as plans execute.
6. Optional: ask user about git tag `v1.0.0` (`config.json` `git.create_tag: false`).

**Verification:** REQUIREMENTS 27/27 checked; STATE reflects closed milestone; no open UAT pending.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy SPA on GitHub Pages | Astro SSG `dist/` | Phase 1–4 built; Phase 5 deploys | SEO HTML, sitemap-index, zh-CN |
| `scripts/generate-static.mjs` sitemap | `@astrojs/sitemap` | Phase 1 | Webmaster must submit new URL |
| Phase 4 human checkpoint open | Phase 5 closes externally | 2026-06-21 | LAUNCH-01 fully satisfied |
| REQUIREMENTS all Pending | All Complete | Phase 5 end | Milestone traceability |

**Deprecated/outdated:**
- Production legacy SPA — replace on first successful Astro deploy.
- Submitting `/sitemap.xml` only — use `sitemap-index.xml` for Astro.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `deploy.yml` `on.push.branches: ["master"]` matches user's default deploy branch | Pattern 2 | High — push to wrong branch skips deploy |
| A2 | User has or can create GSC / Bing / Baidu accounts | 05-02 | Medium — blocks test 11 |
| A3 | GitHub Pages environment `github-pages` already configured for repo | deploy.yml | Medium — first deploy may need Settings enable |
| A4 | Baidu file verification works on `github.io` subpath | 05-02 | Medium — STATE notes Baidu ceiling accepted |
| A5 | Uncommitted working tree is complete Phase 1–4 implementation | Pitfall 1 | Low — UAT 11/13 automated pass locally |

## Open Questions

1. **Single commit vs multiple commits for ~132 files**
   - What we know: All changes interrelated for first Astro ship.
   - Recommendation: One `feat: ship Astro v1.0` commit unless user prefers history split.

2. **Is GitHub Pages enabled on repo Settings?**
   - What we know: Production serves *something* (legacy SPA).
   - Recommendation: Confirm Actions deploy succeeds; no code change if already working.

3. **Baidu file timing**
   - What we know: No file in repo; user must download after adding site.
   - Recommendation: 05-02 Task 1; optional redeploy after 05-01 if user obtains file quickly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20 | `deploy.yml`, local build | ✓ | 20 | — |
| yarn | build scripts | ✓ | — | — |
| GitHub Actions | production deploy | ✓ | — | Manual `dist` upload (not recommended) |
| `origin/master` push access | deploy trigger | ✓ assumed | — | User must push |
| Google Search Console | LAUNCH-01 | ✗ (user account) | — | Manual checkpoint |
| Bing Webmaster | LAUNCH-01 | ✗ (user account) | — | Manual checkpoint |
| 百度搜索资源平台 | LAUNCH-01 | ✗ (user account) | — | Manual checkpoint |
| Rich Results Test | UAT test 12 | ✗ (browser tool) | — | `seo-head.test.ts` build proxy only |

**Missing dependencies with no fallback:**
- User webmaster platform access (blocks LAUNCH-01 completion)

**Missing dependencies with fallback:**
- Rich Results manual tool — `tests/seo-head.test.ts` catches JSON-LD regressions pre-deploy, not a substitute for sign-off

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + Playwright 1.49.0 |
| Config file | `playwright.config.ts` (baseURL `/personalWeb/`) |
| Quick run command | `yarn test:uat:4` |
| Full suite command | `yarn build && yarn seo:audit && yarn test:uat:4 && yarn perf:audit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAUNCH-01 (docs) | Webmaster doc exists | static | `test -f docs/WEBMASTER-SUBMISSION.md` | ✅ |
| LAUNCH-01 (submit) |三平台 sitemap submitted | manual | User per `04-UAT.md` test 11 | — |
| LAUNCH-02 | Perf ≥ 85, LCP < 2.5s | perf | `yarn perf:audit` | ✅ |
| MIGR-04 | CI deploy config | config | `grep astro build .github/workflows/deploy.yml` | ✅ (modified) |
| SEO-02 | BlogPosting JSON-LD | unit/dist | `vitest tests/seo-head.test.ts` | ✅ |
| Deploy smoke | Production verification 200 | smoke | `curl` script (proposed 05-01) | ❌ Wave 0 |
| Rich Results | 3 URLs valid BlogPosting | manual | Google Rich Results Test | — |
| Milestone | 27/27 requirements `[x]` | doc | grep REQUIREMENTS.md | ❌ 05-03 |

### Sampling Rate

- **Pre-push:** `yarn build && yarn test:uat:4`
- **Post-deploy:** production smoke curls (all must pass before webmaster UI)
- **Phase gate:** `04-UAT.md` 13/13 + `REQUIREMENTS.md` 27/27

### Wave 0 Gaps

- [ ] Production smoke script or `tests/production-smoke.test.ts` — post-deploy URL checks
- [ ] `05-UAT.md` — launch-close UAT record (optional; can extend `04-UAT.md`)
- [ ] Baidu `baidu_verify_*.html` in `public/` — user-provided in 05-02

## Security Domain

Phase 5 is deploy + external verification — no new attack surface. Verification files are **intentionally public** ownership tokens.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | No | Public static site |
| V5 Input Validation | No new inputs | — |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Committing secrets in verification files | Information disclosure | Verification files are public by design; no API keys |
| Typosquat deploy branch | Tampering | Only push to `master`; review `deploy.yml` |
| Removing verification files post-verify | Denial of service | Keep files permanently in `public/` |

## Sources

### Primary (HIGH confidence)

- Production `curl` probes 2026-06-21 — legacy SPA live; verification 404
- Local `yarn build` — `dist/` verification + sitemap-index present
- `git status` / `git ls-files` — implementation uncommitted
- Codebase: `deploy.yml`, `WEBMASTER-SUBMISSION.md`, `04-UAT.md`, `tests/seo-head.test.ts`

### Secondary (MEDIUM confidence)

- [/withastro/docs](https://github.com/withastro/docs) — `public/` copy behavior [CITED: Context7]
- [百度搜索资源平台 网站验证](https://ziyuan.baidu.com/college/courseinfo?id=267) — file verification steps
- [Google Search Central Community](https://support.google.com/webmasters/thread/106228067) — no Rich Results API

### Tertiary (LOW confidence)

- GitHub Pages Actions environment first-time setup edge cases — verify on deploy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; reuse Phase 4 tooling
- Architecture: HIGH — clear deploy → smoke → manual UAT → close sequence
- Pitfalls: HIGH — production/state mismatch verified live
- Baidu subpath verification: MEDIUM — accepted project risk per STATE blockers

**Research date:** 2026-06-21  
**Valid until:** 2026-07-21 (stable deploy/UAT domain)
