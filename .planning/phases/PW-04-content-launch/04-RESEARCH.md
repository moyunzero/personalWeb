# Phase 4: 内容优化与上线 - Research

**Researched:** 2026-06-21
**Domain:** Astro SSG internal linking + Node CLI Top N scoring + Lighthouse performance + webmaster launch docs
**Confidence:** HIGH

## Summary

Phase 4 completes the SEO migration loop: **internal link graph** (related posts + category hubs), **Top 15–20 deep content optimization**, **home performance gate**, and **webmaster readiness**. Phase 3 delivered strict metadata CI (`yarn seo:audit` 0 errors, 96 published posts with descriptions) [VERIFIED: codebase scan]. The Astro blog detail page (`src/pages/blog/[...slug].astro`) renders article HTML but has **no related-posts section**; the list page (`src/pages/blog/index.astro`) groups by year only — legacy React logic in `src/blog/getRelatedPosts.js`, `filterPosts.js`, and `getCategories.js` is **not wired into Astro routes** [VERIFIED: codebase].

**Corpus snapshot (2026-06-21):** 96 published posts; categories `{ note: 89, reading: 5, psychology: 1, daily: 1 }`; 19 hash-like slugs; 27 posts with body length > 6000 chars; all posts have tags [VERIFIED: `scan-posts.mjs` script run]. No Google Analytics in v1.0 — Top N scoring must use the design-doc **no-analytics fallback rules**, not `traffic_rank` [CITED: `docs/SEO-MIGRATION-DESIGN.md` §5].

**Performance baseline (local `yarn preview`, Lighthouse mobile simulated throttling):** Home Performance **77**, LCP **3753 ms** — both below LAUNCH-02 targets (≥ 85, < 2500 ms) [VERIFIED: `npx lighthouse` run against `http://localhost:4321/personalWeb/`]. Phaser is already click-to-load via `GameIsland.tsx` (MIGR-07 satisfied) [VERIFIED: codebase]; remaining gap is likely render-blocking Google Fonts + multiple React islands hydrating on first paint (`HomeHeader client:load`, `ContactIsland client:load`, `HomeMotion`/`ParticleIsland`/`MouseTrailIsland client:only`).

**Primary recommendation:** Three-wave execution matching ROADMAP — (1) port related posts + static category hub pages with zero new npm deps; (2) `scripts/seo-top-n-score.mjs` + manual checklist-driven content edits on queue output; (3) targeted home perf fixes + `docs/WEBMASTER-SUBMISSION.md` + optional `@lhci/cli` gate script (not in `yarn build` chain).

<user_constraints>
## User Constraints (from design doc + prior phases — no CONTEXT.md)

### Locked Decisions

| ID | Decision | Source |
|----|----------|--------|
| D-P4-01 | Related posts: **3 links** on blog detail, same category/tag scoring as legacy | REQUIREMENTS SEO-07; `getRelatedPosts.js` |
| D-P4-02 | Category browsing via **topic cluster entry** (static aggregation pages) | REQUIREMENTS SEO-08; design doc §2 内链 |
| D-P4-03 | Top N = **15–20 posts** selected by scoring; **no GA** in v1.0 | REQUIREMENTS OPT-03; design doc §5 fallback; ANAL-01 deferred v2 |
| D-P4-04 | Top N must pass **深度优化 checklist** (title, structure, inlinks, alt) | REQUIREMENTS OPT-04; design doc §5 |
| D-P4-05 | Home Lighthouse Performance **≥ 85**, LCP **< 2.5s** (4G simulated) | REQUIREMENTS LAUNCH-02; design doc §7 |
| D-P4-06 | Webmaster docs: **Google + Bing + Baidu** sitemap submission (free) | REQUIREMENTS LAUNCH-01; design doc §2 |
| D-P4-07 | Rich Results Test on **3 sample blog posts** | ROADMAP success criteria; design doc §7 |
| D-P4-08 | **No homepage featured posts block** (OPT-05 on home declined) | `02-UAT.md` test 1; Phase 3 deferred |
| D-P4-09 | **Slug immutability** — no batch slug renames | design doc Decision Log; Phase 3 D-P3-02 |
| D-P4-10 | Phaser **click-to-load** on home (already implemented — verify, don't regress) | MIGR-07; design doc §3 |
| D-P4-11 | `yarn build` keeps `seo:audit` gate; Phase 4 adds separate perf script | Phase 3 pattern |

### Claude's Discretion

- Category URL shape: `/blog/category/{id}/` vs query-param filter on index
- Related-post adapter location (`src/lib/related.ts` vs inline in page)
- Top N queue artifact path (`content/top-n-queue.json` vs `.planning/`)
- Checklist validation: extend `meta-rules.mjs` vs dedicated `seo-top-n-checklist.mjs`
- Perf fixes priority order (fonts vs island hydration vs particle count)
- Whether `@lhci/cli` is devDependency or `npx` only
- Playwright vs dist-HTML tests for related-post link count
- Category pages in sitemap (auto via `@astrojs/sitemap` when pages exist)

### Deferred Ideas (OUT OF SCOPE)

- GA / 百度统计 for automatic Top N (ANAL-01 → v2)
- Homepage static featured posts block (OPT-05 home — user declined)
- Custom domain / CDN / dual deploy (INFRA-01/02)
- Tag search UI with client-side filter (legacy React had it — not required by SEO-08)
- Bulk slug renames
- Lighthouse in GitHub Actions deploy gate (flaky on shared runners — document manual fallback)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-07 | 博客详情页展示 3 篇相关文章内链（同 category/tag） | Reuse `getRelatedPosts.js` scoring; `RelatedPosts.astro` in `[...slug].astro`; Playwright assert ≥3 links |
| SEO-08 | 博客列表支持按分类浏览或聚合展示 | Static `blog/category/[id].astro` from `categories.json`; nav pills on `blog/index.astro` |
| OPT-03 | 按流量+关键词潜力评分选出 Top 15–20 篇 | `seo-top-n-score.mjs` with no-GA fallback formula; outputs ranked queue JSON |
| OPT-04 | Top N 篇满足深度优化 checklist | Manual md edits + `seo-top-n-checklist.mjs` warn/error rules on queue slugs only |
| LAUNCH-01 | 三平台站长 sitemap 提交文档 | New `docs/WEBMASTER-SUBMISSION.md`; sitemap URL from `SITE` config |
| LAUNCH-02 | 首页 Performance ≥ 85, LCP < 2.5s | Baseline 77/3753ms; defer islands, font subsetting; `@lhci/cli` assert script |
</phase_requirements>

## Phase Scope

| Wave | Plan | Requirements | Deliverables |
|------|------|--------------|--------------|
| 04-01 | 相关文章 + 分类聚合 | SEO-07, SEO-08 | `RelatedPosts.astro`, `entryToRelatedShape()` adapter, `blog/category/[id].astro`, category nav on list + detail |
| 04-02 | Top N 评分 + 深度优化 | OPT-03, OPT-04 | `seo-top-n-score.mjs`, queue JSON, checklist script, content edits on 15–20 posts |
| 04-03 | 性能 + 站长文档 + 上线 | LAUNCH-01, LAUNCH-02 | Home perf fixes, `lighthouserc.json`, `docs/WEBMASTER-SUBMISSION.md`, Rich Results checklist, e2e tests |

**Explicitly out of scope:** homepage featured posts, GA integration, tag search UI, CI Lighthouse gate on every deploy.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Related post scoring | Build-time Astro SSG | — | Pure function at static generation; HTML links in first paint |
| Category hub pages | Build-time Astro SSG | — | Static HTML for Baidu/Google topic clusters |
| Top N scoring | Node CLI (`scripts/`) | — | Reads `content/posts/*.md` via `scan-posts.mjs`; no runtime |
| Checklist validation | Node CLI pre-build | — | Extends Phase 3 audit pattern; scoped to queue |
| Content edits (Top N) | Git-tracked markdown | — | Human-in-loop title/structure/inlinks/alt |
| Home performance | Browser / static assets | Astro island hydration policy | LCP owned by font + JS load order on client |
| Webmaster submission | External platforms + docs | — | Manual user action; repo documents steps |
| Rich Results validation | External Google tool | — | Manual or documented URLs; not automatable in CI |
| Sitemap | Build-time `@astrojs/sitemap` | — | Already generates `sitemap-index.xml`; category pages auto-included when built |

## Project Constraints (from .cursor/rules/)

- **Codegraph MCP:** Structure questions via `codegraph_explore` before grep loops; `codegraph_context` uses `task`, `codegraph_search` uses `query`.
- **Karpathy guidelines:** Minimal scope; port existing JS rather than rewrite; no new abstractions beyond adapter + one Astro component; surgical perf fixes only.
- **Frontend design:** Related posts and category nav should match existing zinc/violet blog aesthetic (`BlogPostCard.astro`, legacy `_BlogDetail.jsx` section).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing `getRelatedPosts.js` | — | Related scoring | Battle-tested; category×2 + tag×3 weights [VERIFIED: codebase] |
| Existing `getCategories.js` + `categories.json` | — | Category labels/ids | 4 registered categories; loader validates ids |
| Existing `scan-posts.mjs` | — | Corpus scan for Top N | Phase 3 pattern; shared with `seo-audit` |
| Astro `getStaticPaths` | **5.18.2** | Category static routes | Official SSG pattern for param pages [CITED: /withastro/docs routing] |
| `astro:content` `getCollection` | **5.18.2** | Post data at build | Already used in blog pages |

### Supporting (Phase 4 optional)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lighthouse` | **13.4.0** | Perf audit CLI | Local/`yarn perf:audit` baseline [VERIFIED: npm registry] |
| `@lhci/cli` | **0.15.1** | Assert perf thresholds | `lighthouserc.json` with minScore 0.85, LCP ≤ 2500 [VERIFIED: npm registry] |
| `@playwright/test` | **1.49.0** (existing) | E2E related links + category pages | Extend Phase 3 e2e pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static category pages | Client-side filter on `blog/index.astro` | Query-param filter is worse for SEO topic clusters; legacy React used client filter |
| Port `getRelatedPosts` | New ML/embedding similarity | Over-engineering; deterministic overlap works |
| GA traffic_rank | Manual keyword+quality scoring | Required — no analytics in v1.0 |
| Lighthouse in `yarn build` | Separate `yarn perf:audit` | CI runners flaky; keep build = seo-audit + astro only |
| `playwright-lighthouse` | `@lhci/cli` | Adds coupling; LHCI is official Google tool |

**Installation (04-03 only, devDependencies):**

```bash
yarn add -D @lhci/cli lighthouse
```

**Version verification (2026-06-21):**

```bash
npm view lighthouse version    # 13.4.0
npm view @lhci/cli version     # 0.15.1
npm view astro@5 version       # 5.18.2
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `lighthouse` | npm | 8+ yrs | ~4M/wk | github.com/GoogleChrome/lighthouse | OK | Approved (optional devDep) |
| `@lhci/cli` | npm | 5+ yrs | ~400K/wk | github.com/GoogleChrome/lighthouse-ci | OK | Approved (optional devDep) |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as [SUS]:** none  
**No new runtime dependencies for 04-01 or 04-02.**

## Codebase Patterns

### Legacy → Astro port map

| Legacy (React SPA) | Astro target | Status |
|--------------------|--------------|--------|
| `getRelatedPosts.js` | `src/lib/related.ts` wrapper + `RelatedPosts.astro` | Logic exists; not wired |
| `filterPosts.js` (category) | `blog/category/[id].astro` static filter at build | Replace client filter with SSG |
| `getCategories.js` | Reuse as-is in Astro frontmatter | Already imported in detail page |
| `_BlogDetail.jsx` related `<section>` | `[...slug].astro` footer section | UI reference |
| `_Blog.jsx` category pills | `blog/index.astro` nav links | Link to static category pages |
| `groupPostsByYear` | `src/lib/posts.ts` | Already in Astro list |

### Entry adapter for related posts

`getRelatedPosts` expects `parsePost()` shape (`id`, `categories`, `tags`, `publishDate`). Collection entries use `data.slug`, `data.publishedAt`:

```typescript
// src/lib/related.ts — pattern for planner
import { getRelatedPosts } from '../blog/getRelatedPosts.js';
import type { PostEntry } from './blog';

export function entryToRelatedShape(entry: PostEntry) {
    return {
        id: entry.data.slug,
        categories: entry.data.categories ?? [],
        tags: entry.data.tags ?? [],
        publishDate: entry.data.publishedAt,
        title: entry.data.title,
        description: entry.data.description,
    };
}

export function getRelatedForEntry(current: PostEntry, all: PostEntry[], limit = 3) {
    const currentShape = entryToRelatedShape(current);
    const allShapes = all.map(entryToRelatedShape);
    return getRelatedPosts(currentShape, allShapes, { limit });
}
```

### Category static pages

```astro
---
// src/pages/blog/category/[id].astro
// Source: [CITED: /withastro/docs/en/guides/routing.md]
import { getCollection } from 'astro:content';
import { getCategories } from '../../../blog/getCategories.js';
import BlogPostCard from '../../../components/blog/BlogPostCard.astro';
import BlogLayout from '../../../layouts/BlogLayout.astro';

export async function getStaticPaths() {
    const categories = getCategories();
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    return categories.map(({ id, label }) => ({
        params: { id },
        props: {
            category: { id, label },
            posts: posts.filter((p) => p.data.categories?.includes(id)),
        },
    }));
}

const { category, posts } = Astro.props;
---
```

Generate 4 pages: `/blog/category/note/`, `/blog/category/daily/`, etc. Add SEO title: `{label} · 博客 · 墨韵`.

### Top N scoring (no GA)

Design formula omits `traffic_rank` when analytics unavailable [CITED: `docs/SEO-MIGRATION-DESIGN.md` §5]:

```
score = keyword_score × 2 + quality_score × 2 + hub_score × 1
```

| Signal | Implementation | Max |
|--------|----------------|-----|
| `keyword_score` | Title matches `TECH_KEYWORDS` (javascript, typescript, react, ai, rag, node, html, css, astro, langchain, …) | 3 |
| `quality_score` | +2 if body > 6000 chars; +1 if description 120–160; +1 if non-hash slug (`meta-rules.isHashSlug`) | 4 |
| `hub_score` | +1 if category `note`; +1 if ≥3 tags | 2 |

Take **Top 15–20** by score; tie-break by `publishedAt` desc. Write `content/top-n-queue.json`:

```json
{
  "generatedAt": "2026-06-21",
  "method": "no-ga-fallback-v1",
  "posts": [{ "slug": "...", "score": 12, "rank": 1 }]
}
```

CLI: `yarn seo:top-n-score` (`--limit 20`, `--dry-run` default, `--write` saves JSON).

### Depth optimization checklist (OPT-04)

Per design doc §5, validate Top N slugs only via `seo-top-n-checklist.mjs`:

| Check | Rule | Severity |
|-------|------|----------|
| Title | ≤ 60 chars, contains keyword | warn |
| Description | 120–160 chars | warn |
| Structure | ≥ 2 `##` headings in body | warn |
| Outbound inlinks | ≥ 2 markdown links to other `/blog/{slug}/` posts | warn |
| Cover alt | `coverImage` set → `alt` non-empty on detail `<img>` | warn/error |
| Inbound inlinks | ≥ 3 other Top-N posts link to this slug | manual review |

Outbound inlinks: partially satisfied by auto related-posts section (1–3 links); authors add 1–2 contextual links in body for full checklist.

### Performance scope (home)

**Already done [VERIFIED: codebase]:**
- `GameIsland.tsx`: Phaser dynamic `import()` only after button click — not in initial bundle.

**Needs work (baseline 77 / 3753 ms LCP):**
- `BaseLayout.astro`: render-blocking Google Fonts (Montserrat, Lora, Material Symbols) — affects LCP on hero text.
- `HomeLayout.astro` / `index.astro`: `HomeHeader client:load`, `ContactIsland client:load` hydrate immediately.
- `HomeMotion`, `ParticleIsland`, `MouseTrailIsland`: `client:only="react"` — full React+GSAP+canvas JS on first load.

**Recommended fixes (04-03, ordered by impact/risk):**
1. Change non-critical islands to `client:visible` (HomeHeader, ParticleIsland, MouseTrailIsland, HomeMotion).
2. Subset Material Symbols or replace 4 home icons with inline SVG (remove full icon font).
3. Self-host or preload only Montserrat 600 + Lora 400 weights used above fold.
4. Reduce `ParticleIsland` max count (150 → 60) if still short of target.

**Do not:** remove Phaser; add service workers; introduce image CDN.

### Webmaster docs structure

New file: `docs/WEBMASTER-SUBMISSION.md`

```markdown
# 站长平台提交指南

## 站点信息
- 站点 URL: https://moyunzero.github.io/personalWeb/
- Sitemap: https://moyunzero.github.io/personalWeb/sitemap-index.xml
- robots.txt: https://moyunzero.github.io/personalWeb/robots.txt

## Google Search Console
1. 添加资源 → URL 前缀 → 上述站点 URL
2. 验证所有权（HTML 文件 / DNS — 用户自选）
3. 站点地图 → 提交 sitemap-index.xml
4. URL 检查 → 抽查 3 篇博客

## 必应 Webmaster Tools
…

## 百度站长平台
…

## Rich Results 抽查
| 文章 | URL | 预期类型 |
|------|-----|----------|
| HTML 入门 | …/blog/2023-03-12-html/ | BlogPosting |
| … | … | … |

## 上线检查清单
- [ ] yarn build 0 error
- [ ] yarn seo:audit 0 error
- [ ] yarn perf:audit 通过 (Performance ≥ 85, LCP < 2.5s)
- [ ] 三平台 sitemap 已提交
- [ ] Rich Results Test 3 篇通过
```

Link from `README.md` §部署/SEO section.

## Dependencies

| Dependency | Required By | Status | Notes |
|------------|-------------|--------|-------|
| Phase 3 complete (`seo:audit`, strict description) | OPT-03/04 scoring uses description length | ✓ Assumed complete per orchestrator | 0 audit errors at build |
| `content/categories.json` | SEO-08 category pages | ✓ 4 categories | note dominates (89 posts) |
| `getRelatedPosts.js` | SEO-07 | ✓ Pure functions | No Astro import issues (.js from .ts) |
| `scan-posts.mjs` | Top N script | ✓ Phase 3 | Reuse |
| `yarn preview` on `:4321/personalWeb/` | Lighthouse / Playwright | ✓ Running | Matches `playwright.config.ts` |
| Google/Bing/Baidu accounts | LAUNCH-01 submission | ✗ External | User manual; docs only |
| Rich Results Test | ROADMAP criterion | ✗ External | Manual browser tool |

## Architecture Patterns

### System Architecture Diagram

```
content/posts/*.md ──► astro build ──► dist/blog/{slug}/index.html
        │                      │              │
        │                      │              └──► RelatedPosts (3 links, build-time)
        │                      │
        ├── scan-posts.mjs ◄───┼── seo-top-n-score.mjs ──► top-n-queue.json
        │                      │
        └── seo-top-n-checklist.mjs (Top N slugs only)
                               │
content/categories.json ──► blog/category/[id].astro ──► dist/blog/category/{id}/
                               │
                               └── sitemap-index.xml (auto)

yarn preview ──► lhci autorun ──► assert Performance ≥ 85, LCP ≤ 2500
                     │
docs/WEBMASTER-SUBMISSION.md ──► user submits sitemap to G/Bing/Baidu
```

### Pattern 1: Build-time related links (SEO-07)

**What:** Compute related posts in `[...slug].astro` frontmatter; render static `<a href>` list.
**When:** Every blog detail page at build.
**Anti-pattern:** Client-side fetch or React island for related posts — hurts Baidu/SEO.

### Pattern 2: Category hub pages (SEO-08)

**What:** One static page per registered category with filtered post grid.
**When:** Topic cluster entry; link from list nav and detail category badges.
**Anti-pattern:** SPA `useState` category filter only — no crawlable URL per cluster.

### Pattern 3: Top N as CLI artifact + human edit

**What:** Script ranks corpus → JSON queue → author edits markdown → checklist script validates.
**When:** OPT-03/04; no LLM auto-rewrite.

### Anti-Patterns to Avoid

- **Rebuilding related-post algorithm:** Use existing `getRelatedPosts.js`.
- **GA-dependent scoring in v1.0:** ANAL-01 is v2; use keyword+quality+hub formula.
- **Homepage featured posts:** User declined OPT-05 on home in Phase 2 UAT.
- **Lighthouse in `yarn build`:** Flaky; separate `yarn perf:audit`.
- **Empty cover `alt=""`:** Detail page currently has `alt=""` on cover — OPT-04 requires fix (use title or `coverAlt` frontmatter).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Related post similarity | Embedding/LLM ranking | `getRelatedPosts.js` overlap scoring | Deterministic, fast, already tuned |
| Category registry | Hardcoded labels in Astro | `content/categories.json` + `getCategories.js` | Single source; loader validates |
| Corpus scan | Custom glob | `scan-posts.mjs` | Phase 3 shared infra |
| Perf measurement | Custom timing | Lighthouse / LHCI | Industry standard metrics |
| Sitemap for new routes | Manual XML | `@astrojs/sitemap` integration | Already configured |
| Rich Results validation | JSON-LD unit tests only | Google Rich Results Test (documented) | Google is authoritative validator |

## Common Pitfalls

### Pitfall 1: Related posts always show "更多文章" fallback

**What goes wrong:** Few tag overlaps → fallback recent posts; SEO-07 wants category/tag relevance when possible.
**Why:** 89/96 posts share `note` category only — category overlap alone insufficient.
**How to avoid:** Ensure posts retain diverse `tags` in frontmatter; scoring already weights tags×3.
**Warning signs:** Most pages show "更多文章" not "相关文章".

### Pitfall 2: Category page empty for `psychology` / `daily`

**What goes wrong:** Hub page with 1 post looks broken.
**How to avoid:** Still generate page; show count; link back to full blog index.

### Pitfall 3: Top N queue dominated by hash slugs

**What goes wrong:** Low-quality URLs in optimization queue.
**How to avoid:** `quality_score` penalizes hash slugs; prefer posts with keyword-rich titles.

### Pitfall 4: Performance fixes regress islands UAT

**What goes wrong:** `client:visible` delays header nav or game button.
**How to avoid:** Keep `GameIsland` click button visible in static HTML shell; test Phase 2 UAT items 4–6 after changes.

### Pitfall 5: Inbound inlink checklist incomplete

**What goes wrong:** Related posts add outbound links but OPT-04 requires inbound from other posts.
**How to avoid:** Plan explicit cross-link editing task across Top N set (hub-and-spoke).

## Code Examples

### Related section in blog detail

```astro
---
// src/pages/blog/[...slug].astro (append)
import RelatedPosts from '../../components/blog/RelatedPosts.astro';
import { getPublishedPosts } from '../../lib/blog';
import { getRelatedForEntry } from '../../lib/related';

const allPosts = await getPublishedPosts();
const related = getRelatedForEntry(post, allPosts, 3);
---
<!-- after </article> -->
<RelatedPosts heading={related.heading} posts={related.posts} />
```

### LHCI assert config

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4321/personalWeb/"],
      "numberOfRuns": 3,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }]
      }
    }
  }
}
```

Source: [CITED: github.com/GoogleChrome/lighthouse-ci configuration.md]

### Playwright related links test

```typescript
test('blog detail shows 3 related links', async ({ page }) => {
    await page.goto('./blog/2023-03-12-html/');
    const links = page.locator('[data-testid="related-posts"] a');
    await expect(links).toHaveCount(3);
});
```

## Recommendations for Three Plans

### 04-01: 相关文章组件 + 分类聚合 (SEO-07, SEO-08)

**Tasks:**
1. Add `src/lib/related.ts` adapter + `src/components/blog/RelatedPosts.astro` (match legacy list UI).
2. Wire into `[...slug].astro`; add `data-testid="related-posts"`.
3. Create `src/pages/blog/category/[id].astro` with `getStaticPaths` from `getCategories()`.
4. Add category pill nav to `blog/index.astro` (links, not buttons).
5. Make detail category badges link to `/blog/category/{id}/`.
6. Fix cover `alt` to use `data.title` (feeds OPT-04).
7. Playwright: 3 related links; category page renders posts; category nav hrefs.

**Verification:** `yarn build`; e2e; view-source on detail shows 3 `<a href="/personalWeb/blog/...">` in related section.

### 04-02: Top N 选题评分 + 深度优化 (OPT-03, OPT-04)

**Tasks:**
1. Add `scripts/seo-top-n-score.mjs` + `scripts/lib/top-n-score.mjs` (pure scoring fns).
2. Add `yarn seo:top-n-score` script; generate `content/top-n-queue.json` with `--write`.
3. Add `scripts/seo-top-n-checklist.mjs` reading queue file; warn on checklist gaps.
4. Human task: edit Top 15–20 markdown — titles, H2 structure, 2–3 contextual inlinks, cover alt.
5. Cross-link Top N posts to each other for inbound requirement.
6. Vitest: scoring function unit tests with fixture posts.

**Verification:** Queue has 15–20 slugs; checklist script 0 errors on optimized set; related sections contribute outbound links.

### 04-03: 性能验收 + 站长文档 + 上线 (LAUNCH-01, LAUNCH-02)

**Tasks:**
1. Perf: `client:visible` on non-critical islands; font/icon optimization per Performance scope.
2. Add `lighthouserc.json` + `yarn perf:audit` (`lhci autorun` against preview).
3. Write `docs/WEBMASTER-SUBMISSION.md`; link from README.
4. Document 3 Rich Results Test URLs in webmaster doc.
5. Add `tests/e2e/phase4-launch-uat.spec.ts` (related + category smoke).
6. Run manual Rich Results + webmaster submission (user checkpoint).

**Verification:** `yarn perf:audit` Performance ≥ 85, LCP < 2500ms (mobile simulated); docs complete; build+audit green.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React client related posts | Astro build-time static links | Phase 4 | Crawlable internal links |
| React client category filter | Static category hub pages | Phase 4 | Topic cluster URLs |
| GA-based Top N | Keyword+quality scoring | v1.0 scope | No analytics dependency |
| Manual perf check | LHCI assert script | Phase 4 | Repeatable LAUNCH-02 gate |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 3 strict schema + batch apply complete before Phase 4 | Dependencies | Medium — scoring uses description length |
| A2 | Tag overlap sufficient for "相关文章" on most posts | Pitfall 1 | Medium — may need tag enrichment pass |
| A3 | Font/island defer sufficient to reach 85/2.5s | Performance | Medium — may need deeper bundle analysis |
| A4 | `@astrojs/sitemap` auto-includes new category routes | Architecture | Low — standard Astro behavior |
| A5 | Site origin `moyunzero.github.io` in webmaster docs | Webmaster docs | Low — matches `site-config.mjs` |

## Open Questions

1. **Cover alt frontmatter field**
   - What we know: Detail uses `alt=""`; checklist requires alt text.
   - Recommendation: Use `data.title` as alt immediately; optional `coverAlt` in schema later.

2. **Tag pages (`/blog/tag/{tag}/`)**
   - What we know: Legacy had tag filter; SEO-08 doesn't require it.
   - Recommendation: Defer unless user requests in discuss-phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | scripts, build | ✓ | 20+ | — |
| `yarn preview` | Lighthouse, Playwright | ✓ | Astro 5.18.2 | — |
| Chrome | Lighthouse, Playwright | ✓ | channel: chrome | — |
| `@lhci/cli` | perf:audit | ✗ (not installed) | — | `npx @lhci/cli` or add devDep in 04-03 |
| Google Search Console | LAUNCH-01 | ✗ (user account) | — | Docs-only |
| 百度站长 / 必应站长 | LAUNCH-01 | ✗ (user account) | — | Docs-only |

**Missing dependencies with no fallback:**
- User webmaster accounts (manual checkpoint before claiming LAUNCH-01 done)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + Playwright 1.49.0 |
| Config file | `playwright.config.ts` (baseURL `/personalWeb/`) |
| Quick run command | `yarn test --run tests/top-n-score.test.ts` (Wave 0) |
| Full suite command | `yarn test:uat:4` (proposed: vitest + playwright phase4 spec) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-07 | Detail shows 3 related links | e2e | `playwright test tests/e2e/phase4-launch-uat.spec.ts -g related` | ❌ Wave 0 |
| SEO-08 | Category page lists filtered posts | e2e | `playwright test ... -g category` | ❌ Wave 0 |
| OPT-03 | Scoring ranks 15–20 slugs | unit | `vitest tests/top-n-score.test.ts` | ❌ Wave 0 |
| OPT-04 | Checklist passes on queue | unit/cli | `node scripts/seo-top-n-checklist.mjs` | ❌ Wave 0 |
| LAUNCH-02 | Performance ≥ 85, LCP < 2.5s | perf | `yarn perf:audit` | ❌ Wave 0 |
| LAUNCH-01 | Webmaster doc exists | manual | README link check | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** unit tests for scoring/checklist helpers
- **Per wave merge:** `yarn build && yarn test:e2e tests/e2e/phase4-launch-uat.spec.ts`
- **Phase gate:** `yarn perf:audit` green + manual Rich Results 3 posts

### Wave 0 Gaps

- [ ] `tests/top-n-score.test.ts` — scoring functions
- [ ] `tests/e2e/phase4-launch-uat.spec.ts` — SEO-07/08
- [ ] `lighthouserc.json` + `yarn perf:audit` script
- [ ] `scripts/seo-top-n-score.mjs` + `scripts/seo-top-n-checklist.mjs`

## Security Domain

Phase 4 is static SSG + CLI scripts — no auth, no user input endpoints, no secrets in repo.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Partial | Zod schema on posts (Phase 3); checklist reads known slugs only |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via markdown | Tampering | Existing `renderMarkdown` pipeline; no raw HTML expansion in Phase 4 |
| Slopsquatted npm packages | Spoofing | Package legitimacy gate before adding lighthouse deps |

## Sources

### Primary (HIGH confidence)

- `/withastro/docs` — `getStaticPaths`, category/tag dynamic routes
- `/googlechrome/lighthouse-ci` — assert configuration, performance thresholds
- Codebase: `getRelatedPosts.js`, `GameIsland.tsx`, `scan-posts.mjs`, Phase 3 test patterns
- Local Lighthouse run: Performance 77, LCP 3753 ms

### Secondary (MEDIUM confidence)

- `docs/SEO-MIGRATION-DESIGN.md` §5–7 — Top N formula, checklist, test strategy
- `.planning/REQUIREMENTS.md` — SEO-07 through LAUNCH-02
- `.planning/ROADMAP.md` — Phase 4 success criteria

### Tertiary (LOW confidence)

- Exact perf gain from each island deferral — requires A/B Lighthouse after implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuses existing blog modules + proven Phase 3 CLI patterns
- Architecture: HIGH — clear Astro SSG port path from legacy React
- Pitfalls: MEDIUM — perf target gap (~8 pts, ~1.25s LCP) may need iterative tuning
- Top N without GA: HIGH — design doc explicit fallback rules

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable Astro 5 + Lighthouse 13)
