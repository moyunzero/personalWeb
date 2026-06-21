# Phase 4: 内容优化与上线 - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 16 new/modified targets
**Analogs found:** 14 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/related.ts` | utility | transform | `src/blog/getRelatedPosts.js` | exact |
| `src/components/blog/RelatedPosts.astro` | component | transform | `_BlogDetail.jsx` related section (lines 183–207) | exact |
| `src/pages/blog/[...slug].astro` | route (SSG) | transform | `[...slug].astro` (self) + `_BlogDetail.jsx` | exact |
| `src/lib/posts.ts` | utility | transform | `src/blog/filterPosts.js` + `collectTags` | exact |
| `src/pages/blog/category/[id].astro` | route (SSG) | transform | RESEARCH static hub (chosen; not BlogFilterIsland) | role-match |
| `src/pages/blog/index.astro` | route (SSG) | request-response | `blog/index.astro` (self) + `_Blog.jsx` | exact |
| `scripts/lib/top-n-scoring.mjs` | utility / service | transform / batch | `getRelatedPosts.js` scoring + `meta-rules.mjs` heuristics | partial |
| `scripts/top-n-score.mjs` | utility / CLI | batch / file-I/O | `scripts/seo-audit.mjs` + `seo-meta-batch.mjs` | role-match |
| `content/posts/*.md` (Top N subset) | content | file-I/O | Phase 3 meta-batch apply pattern | role-match |
| `src/pages/index.astro` | route (SSG) | event-driven | `index.astro` (self) + `02-RESEARCH.md` island directives | exact |
| `src/components/islands/HomeMotion.tsx` | island | event-driven | `HomeMotion.tsx` (self) + `02-RESEARCH.md` `client:visible` | exact |
| `src/components/islands/ParticleIsland.tsx` | island | event-driven | `ParticleIsland.tsx` + `GameIsland.tsx` gating | role-match |
| `src/components/islands/MouseTrailIsland.tsx` | island | event-driven | `MouseTrailIsland.tsx` + `GameIsland.tsx` gating | role-match |
| `docs/LAUNCH.md` | doc | — | `docs/SEO-MIGRATION-DESIGN.md` §6–§7 + `robots.txt.ts` | partial |
| `README.md` | doc | — | `README.md` (self) + `DEPLOYMENT.md` structure | role-match |
| `package.json` | config | batch | `package.json` Phase 3 scripts block | exact |
| `tests/related-posts.test.ts` | test | transform | `tests/frontmatter.test.ts` | role-match |
| `tests/e2e/phase4-launch-uat.spec.ts` | test | request-response | `tests/e2e/phase3-seo-uat.spec.ts` | role-match |

**Optional (SEO-08):** ~~BlogFilterIsland~~ — **not used**; static `src/pages/blog/category/[id].astro` is the locked pattern (D-P4-02).

---

## Pattern Assignments

### `src/lib/related.ts` (utility, transform)

**Analog:** `src/blog/getRelatedPosts.js` (full file)

**Weights + scoring** (getRelatedPosts.js lines 1–24):

```javascript
const CATEGORY_WEIGHT = 2;
const TAG_WEIGHT = 3;
const MIN_RELATED_SCORE = TAG_WEIGHT;

export function scoreRelatedPost(current, candidate) {
    const categoryOverlap = countOverlap(current.categories, candidate.categories);
    const tagOverlap = countOverlap(current.tags, candidate.tags);
    return categoryOverlap * CATEGORY_WEIGHT + tagOverlap * TAG_WEIGHT;
}
```

**Selection + fallback** (getRelatedPosts.js lines 32–64):

```javascript
export function getRelatedPosts(current, allPosts, options = {}) {
    const limit = options.limit ?? 3;
    const others = allPosts.filter((post) => post.id !== current.id);
    // ...
    if (maxScore >= MIN_RELATED_SCORE) {
        return { posts, heading: '相关文章', isRelated: true };
    }
    const posts = [...others]
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, limit);
    return { posts, heading: '更多文章', isRelated: false };
}
```

**Apply:** Port to TypeScript accepting `PostEntry` from `src/lib/blog.ts`. Map fields: `post.id` → `post.data.slug`, `publishDate` → `data.publishedAt`, `categories`/`tags` from `post.data`. Re-export `scoreRelatedPost` for Top N `hub_score`. Keep algorithm identical — do not re-tune weights in Phase 4.

**Import pattern** (blog.ts lines 1–12):

```typescript
import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;
```

---

### `src/components/blog/RelatedPosts.astro` (component, transform)

**Analog:** `_BlogDetail.jsx` related section (lines 183–207)

**Markup pattern:**

```jsx
{relatedSection.heading && relatedSection.posts.length > 0 && (
    <section className="mt-12 border-t border-zinc-800/80 pt-10">
        <h2 className="mb-5 text-lg font-semibold text-zinc-300">
            {relatedSection.heading}
        </h2>
        <ul className="space-y-3">
            {relatedSection.posts.map((relatedBlog) => (
                <li key={relatedBlog.id}>
                    <Link
                        to={`/blog/${relatedBlog.id}`}
                        className="group block rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 ..."
                    >
                        <h3 className="text-sm font-medium ...">{relatedBlog.title}</h3>
                        {relatedBlog.description && (
                            <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                                {relatedBlog.description}
                            </p>
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    </section>
)}
```

**Apply:** Convert to Astro — use `<a href={postHref(slug)}>` from `src/lib/blog.ts` (lines 14–16). Props: `{ heading, posts: PostEntry[] }`. Match BlogLayout zinc palette; section sits below article in detail page.

**Href pattern** (BlogPostCard.astro lines 34–35):

```astro
const base = import.meta.env.BASE_URL;
const href = `${base}blog/${slug}/`;
```

---

### `src/pages/blog/[...slug].astro` (route, transform) — MODIFY

**Analog:** `[...slug].astro` (self) + `_BlogDetail.jsx` data wiring

**Current static path + render** (lines 9–19):

```astro
export async function getStaticPaths() {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    return posts.map((post) => ({
        params: { slug: post.data.slug },
        props: { post },
    }));
}

const { post } = Astro.props;
```

**Apply (SEO-07):** In frontmatter, after `getStaticPaths` scope or in page body:

```astro
import { getPublishedPosts } from '../../lib/blog';
import { getRelatedPosts } from '../../lib/related';
import RelatedPosts from '../../components/blog/RelatedPosts.astro';

const allPosts = await getPublishedPosts();
const related = getRelatedPosts(post, allPosts, { limit: 3 });
```

Render `<RelatedPosts heading={related.heading} posts={related.posts} />` after `<article>`. Related links are **build-time static HTML** — no island. Optional: add `scoreRelatedPost` unit tests without page test.

---

### `src/lib/posts.ts` (utility, transform) — MODIFY

**Analog:** `src/blog/filterPosts.js` + existing `groupPostsByYear`

**filterPosts** (filterPosts.js lines 5–31):

```javascript
export function filterPosts(posts, { category = 'all', tag = '', query = '' } = {}) {
    let result = posts;
    if (category && category !== 'all') {
        result = result.filter((post) => post.categories.includes(category));
    }
    if (tag) {
        const normalizedTag = tag.toLowerCase();
        result = result.filter((post) =>
            post.tags.some((item) => item.toLowerCase() === normalizedTag)
        );
    }
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery) {
        result = result.filter((post) => {
            const inTitle = post.title.toLowerCase().includes(trimmedQuery);
            const inDescription = post.description.toLowerCase().includes(trimmedQuery);
            const inTags = post.tags.some((item) =>
                item.toLowerCase().includes(trimmedQuery)
            );
            return inTitle || inDescription || inTags;
        });
    }
    return result;
}
```

**collectTags** (filterPosts.js lines 38–58):

```javascript
export function collectTags(posts, { limit = 24 } = {}) {
    // Map lowercase key → { label, count }; sort by count desc; slice limit
}
```

**Apply:** Add TS versions operating on `PostEntry[]` — access `post.data.categories`, `post.data.tags`, `post.data.title`, `post.data.description`. Keep `groupPostsByYear` as-is (posts.ts lines 3–20). Export all from `posts.ts` for island import.

**Categories source** (getCategories.js lines 14–18):

```javascript
export function getCategories() {
    if (!cached) {
        cached = [...categoriesData].sort((a, b) => a.order - b.order);
    }
    return cached;
}
```

Island imports `getCategories()` from `../../blog/getCategories.js` — same as BlogPostCard.astro line 2.

---

### `src/components/islands/BlogFilterIsland.tsx` (island, event-driven) — NEW

**Analog:** `_Blog.jsx` (lines 16–193)

**State + filter wiring** (lines 17–34):

```jsx
const [activeCategory, setActiveCategory] = useState('all');
const [query, setQuery] = useState('');
const activeTag = searchParams.get('tag') || '';
const filteredPosts = useMemo(
    () => filterPosts(allPosts, { category: activeCategory, tag: activeTag, query }),
    [allPosts, activeCategory, activeTag, query]
);
```

**Category pill UI** (lines 123–148):

```jsx
<button
    type="button"
    onClick={() => setActiveCategory('all')}
    className={`px-4 py-2 rounded-full text-sm transition-colors ${
        activeCategory === 'all' ? 'bg-sky-600 text-white' : 'bg-zinc-800 ...'
    }`}
>
    全部
</button>
{categories.map((category) => (
    <button key={category.id} onClick={() => setActiveCategory(category.id)} ...>
        {category.label}
    </button>
))}
```

**Apply:** Accept serialized post list as props from Astro (`posts` JSON: slug, title, description, publishedAt, categories, tags, coverImage). Client-side only — **do not** use `getCollection` in island. Use `filterPosts` from `src/lib/posts.ts`. Tag filter via `URLSearchParams` + `history.replaceState` (no react-router). Grid renders links matching BlogPostCard classes or reuse card markup inline.

**Featured / year grouping when filtered** (_Blog.jsx lines 36–57):

```jsx
const hasActiveFilters = activeCategory !== 'all' || Boolean(activeTag) || Boolean(query.trim());
const featuredPosts = useMemo(() => {
    if (hasActiveFilters) return [];
    return getFeaturedPosts(filteredPosts);
}, [filteredPosts, hasActiveFilters]);
const yearSections = useMemo(() => {
    if (hasActiveFilters) return null;
    return groupPostsByYear(listPosts);
}, [listPosts, hasActiveFilters]);
```

**Apply:** Mirror behavior — flat grid when filters active; year sections when `all` and no search/tag.

**Island hydration** — use `client:load` on blog index (above-fold filters). Blog pages must not load home islands (BlogLayout.astro has no Phaser/GSAP).

---

### `src/pages/blog/index.astro` (route) — MODIFY

**Analog:** `blog/index.astro` (self) + `_Blog.jsx` data prep

**Current pattern** (index.astro lines 1–9):

```astro
import { getPublishedPosts } from '../../lib/blog';
import { groupPostsByYear } from '../../lib/posts';

const posts = await getPublishedPosts();
const yearGroups = groupPostsByYear(posts);
```

**Apply (SEO-08):** Pass posts to island; keep static H1/SEO in Astro shell:

```astro
import BlogFilterIsland from '../../components/islands/BlogFilterIsland';

const posts = await getPublishedPosts();
const serialized = posts.map((p) => ({
    slug: p.data.slug,
    title: p.data.title,
    description: p.data.description,
    publishedAt: p.data.publishedAt,
    categories: p.data.categories,
    tags: p.data.tags,
    coverImage: p.data.coverImage,
    featured: p.data.featured,
}));
---

<BlogLayout seo={...}>
    <div class="mb-10">...</div>
    <BlogFilterIsland client:load posts={serialized} />
</BlogLayout>
```

Alternative for topic-cluster SEO: add static `src/pages/blog/category/[id].astro` with `getStaticPaths` from `getCategories()` — no analog in repo; planner chooses one or both.

---

### `scripts/lib/top-n-scoring.mjs` (utility, transform) — NEW

**Analog:** `docs/SEO-MIGRATION-DESIGN.md` §5 (lines 100–120) + `meta-rules.mjs` heuristics

**Scoring formula** (SEO-MIGRATION-DESIGN.md):

```
score = traffic_rank × 3 + keyword_score × 2 + quality_score × 2 + hub_score × 1
```

**Fallback heuristics** (same doc, line 120):

> 标题含明确技术关键词、字数 > 1500、非 `36ddf5c0` 类随机 slug、category 为 tech

**Reuse from meta-rules.mjs** (lines 19–23):

```javascript
function isHashSlug(slug) {
    if (/^[a-f0-9]{8}$/i.test(slug)) return true;
    if (/-[a-f0-9]{8}$/i.test(slug)) return true;
    return false;
}
```

**Reuse from getRelatedPosts.js** — export `scoreRelatedPost` logic for `hub_score`: count of other posts sharing category/tag with candidate (inbound link potential).

**Keyword list** — inline array from design doc signals: `react`, `typescript`, `javascript`, `ai`, `node`, `css`, `html` (case-insensitive title match → 0–10 keyword_score).

**quality_score** — `content.replace(/\s+/g, '').length > 1500` → 10, else proportional; +2 if `description` length 120–160.

**traffic_rank** — default 0 when ANAL-01 not implemented; accept optional `--traffic csv.json` for future GA import (file-I/O optional).

**Apply:** Export `scorePost(post)` and `rankPosts(posts, { limit: 20 })` returning sorted `{ file, slug, title, score, breakdown }[]`.

---

### `scripts/top-n-score.mjs` (CLI, batch) — NEW

**Analog:** `scripts/seo-audit.mjs` (lines 1–23)

**Shebang + main loop:**

```javascript
#!/usr/bin/env node
import { scanPosts } from './lib/scan-posts.mjs';
import { rankPosts } from './lib/top-n-scoring.mjs';

async function main() {
    const posts = await scanPosts();
    const published = posts.filter((p) => !p.data.draft);
    const ranked = rankPosts(published, { limit: 20 });

    for (const row of ranked) {
        console.log(`${row.score.toFixed(1)}\t${row.slug}\t${row.title}`);
    }
    console.log(`\nTop ${ranked.length} candidates for deep optimization`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

**CLI flags pattern** (seo-meta-batch.mjs lines 8–27):

```javascript
function parseArgs(argv) {
    const flags = { dryRun: true, apply: false, limit: 20 };
    for (const arg of argv) {
        if (arg === '--apply') { /* future: write queue file */ }
        else if (arg.startsWith('--limit=')) flags.limit = Number(arg.slice(8));
    }
    return flags;
}
```

**Apply:** Default `--limit=20`; output markdown checklist path optional (`--out .planning/top-n-queue.md`). No file writes in v1 unless planner adds queue artifact. Use `scanPosts()` from Phase 3 — do not duplicate directory walk.

**Depth optimization checklist** (SEO-MIGRATION-DESIGN.md lines 122–129) — document in script header comment; manual edits to `content/posts/*.md` per OPT-04.

---

### `content/posts/*.md` (Top N subset) — MODIFY

**Analog:** Phase 3 `seo-meta-batch.mjs` apply loop (lines 57–76)

**Safe frontmatter mutation:**

```javascript
const { data, content } = parseFrontmatter(raw);
// mutate title, description, tags only
const fileContent = stringifyFrontmatter(content, data);
await writeFile(postPath, fileContent, 'utf8');
```

**Apply for OPT-04:** Manual or scripted per-post checklist — title ≤60 chars, description 120–160, H2 structure in body, 2–3 outbound internal links to related slugs, cover alt in markdown `![alt](cover.jpg)`. Cross-link using slugs from `getRelatedPosts` / Top N queue. Run `yarn seo:audit` after each batch.

---

### `src/pages/index.astro` (route) — MODIFY (performance)

**Analog:** `index.astro` (self) + `02-RESEARCH.md` island directives

**Current hydration** (index.astro lines 28–34):

```astro
<ContactIsland client:load />
<HomeMotion client:only="react" />
<ParticleIsland client:only="react" />
<MouseTrailIsland client:only="react" />
<GameIsland client:only="react" />
```

**Target pattern** (02-RESEARCH.md lines 26–31):

```astro
<HomeMotion client:visible />
<ParticleIsland client:visible />
<MouseTrailIsland client:idle />
<GameIsland client:only="react" />
```

**Apply (LAUNCH-02, MIGR-06/MIGR-07):**

| Island | Change | Rationale |
|--------|--------|-----------|
| `HomeMotion` | `client:only` → `client:visible` | GSAP below fold; hero static first |
| `ParticleIsland` | `client:only` → `client:visible` | Canvas not in critical path |
| `MouseTrailIsland` | `client:only` → `client:idle` | Decorative; lowest priority |
| `GameIsland` | keep `client:only` + click gate | Phaser already dynamic-import gated |
| `ContactIsland` | consider `client:visible` | Form below fold |

**GameIsland gating** (GameIsland.tsx lines 9–44) — already correct; verify no top-level `import 'phaser'`.

**HomeMotion reduced motion** (HomeMotion.tsx lines 14–17, 54–59):

```typescript
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
// skip ScrollTrigger when true
```

**Particle count cap** (ParticleIsland.tsx lines 39–40):

```typescript
const count = Math.min(150, Math.floor(window.innerWidth / 12));
```

**Apply:** Reduce default particle count on mobile (e.g. 80) for LCP; defer `requestAnimationFrame` until `client:visible` fires.

---

### `docs/LAUNCH.md` (doc) — NEW

**Analog:** `docs/SEO-MIGRATION-DESIGN.md` §6–§7 + `src/pages/robots.txt.ts`

**Sitemap URL** (robots.txt.ts lines 4–9):

```typescript
const sitemapUrl = `${SITE.origin}${SITE.basePath}/sitemap-index.xml`;
```

**Site origin** (site-config.mjs lines 6–10):

```javascript
origin: 'https://moyunzero.github.io',
basePath: '/personalWeb',
```

**Apply (LAUNCH-01):** Document step-by-step for three free platforms:

1. **Google Search Console** — property URL `https://moyunzero.github.io/personalWeb/`, submit `https://moyunzero.github.io/personalWeb/sitemap-index.xml`, URL inspection for 1 blog post
2. **必应站长** — same sitemap URL
3. **百度站长** — sitemap + 主动推送（可选）; note github.io 收录天花板 per PROJECT.md

**Launch checklist** (SEO-MIGRATION-DESIGN.md §7 table):

| 类型 | 检查项 |
|------|--------|
| 构建 | `yarn build` 0 error |
| SEO 静态 | view-source title/description/JSON-LD |
| 爬虫模拟 | Rich Results Test × 3 posts |
| 性能 | Lighthouse 首页 Performance ≥ 85, LCP < 2.5s |
| 功能 | 分类筛选、相关文章 3 链、游戏点击启动 |

**Structure pattern** — mirror `DEPLOYMENT.md` sections: 部署前准备 → 站长提交 → 上线后监控 → 回滚.

---

### `README.md` (doc) — MODIFY

**Analog:** `README.md` (self) — update stale React/Vite stack section

**Current scripts block** (package.json lines 6–19) — README must list:

```json
"seo:audit": "node scripts/seo-audit.mjs",
"seo:meta-batch": "node scripts/seo-meta-batch.mjs",
"top-n:score": "node scripts/top-n-score.mjs"
```

**Apply:** Replace Vite-centric 技术栈 with Astro 5 + islands; link to `docs/LAUNCH.md` for post-deploy steps; keep blog:new / notion:sync sections (lines 120–179). Remove references to `BlogEditor` and `/blog/editor` if still present.

---

### `package.json` (config) — MODIFY

**Analog:** Phase 3 scripts (package.json lines 6–19)

**Add:**

```json
"top-n:score": "node scripts/top-n-score.mjs"
```

Do not chain into `build` — scoring is manual pre-optimization workflow.

---

### `tests/related-posts.test.ts` (test, transform) — NEW

**Analog:** `tests/frontmatter.test.ts`

**Structure:**

```typescript
import { describe, expect, it } from 'vitest';
import { getRelatedPosts, scoreRelatedPost } from '../src/lib/related';

describe('getRelatedPosts', () => {
  it('returns related heading when tag overlap meets threshold', () => { /* fixtures */ });
  it('falls back to 更多文章 sorted by date', () => { /* no overlap */ });
});
```

Build minimal `PostEntry`-shaped fixtures with `{ data: { slug, publishedAt, categories, tags, ... } }`.

---

### `tests/e2e/phase4-launch-uat.spec.ts` (test, request-response) — NEW

**Analog:** `tests/e2e/phase3-seo-uat.spec.ts`

**Pattern** (lines 1–36):

```typescript
import { expect, test } from '@playwright/test';

test.describe('Phase 4 launch — related links and filters', () => {
    test('blog detail shows related section with 3 links', async ({ page }) => {
        await page.goto('./blog/2023-03-12-html/');
        await expect(page.locator('section')).toContainText(/相关文章|更多文章/);
        const links = page.locator('section ul li a');
        await expect(links).toHaveCount(3);
    });

    test('blog index category filter reduces visible cards', async ({ page }) => {
        await page.goto('./blog/');
        // click category pill, assert count changes
    });
});
```

**Performance (LAUNCH-02):** Manual Lighthouse on `yarn preview` home — document in LAUNCH.md; optional Playwright trace not required unless planner adds `@playwright/test` perf API.

---

## Shared Patterns

### Build-time blog data access
**Source:** `src/lib/blog.ts`
**Apply to:** `[...slug].astro`, `blog/index.astro`, related.ts

```typescript
export async function getPublishedPosts(): Promise<PostEntry[]> {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    return posts.sort(
        (a, b) =>
            new Date(b.data.publishedAt).getTime() -
            new Date(a.data.publishedAt).getTime()
    );
}
```

### Post scanning for CLI scripts
**Source:** `scripts/lib/scan-posts.mjs`
**Apply to:** `top-n-score.mjs`

```javascript
import { scanPosts } from './lib/scan-posts.mjs';
const posts = await scanPosts();
```

### Category labels in UI
**Source:** `src/blog/getCategories.js` + `BlogPostCard.astro`
**Apply to:** BlogFilterIsland, RelatedPosts, category pages

```javascript
import { getCategoryLabel } from '../../blog/getCategories.js';
```

### Internal link hrefs with base path
**Source:** `BlogPostCard.astro` lines 34–35, `blog.ts` `postHref()`
**Apply to:** RelatedPosts, filter grid, Top N inline links

```typescript
export function postHref(slug: string): string {
    return `/blog/${slug}/`;
}
// In Astro: `${import.meta.env.BASE_URL}blog/${slug}/`
```

### Island performance hierarchy
**Source:** `02-RESEARCH.md` + `GameIsland.tsx`
**Apply to:** `index.astro` hydration directives

- Static HTML first (Main, About, Work sections)
- `client:visible` for motion/canvas
- `client:idle` for mouse trail
- Click-gated dynamic import for Phaser

### CLI exit codes
**Source:** `scripts/seo-audit.mjs` lines 17–22
**Apply to:** `top-n-score.mjs`

```javascript
process.exit(0); // scoring is informational
main().catch((err) => { console.error(err); process.exit(1); });
```

### Vitest conventions
**Source:** `tests/frontmatter.test.ts`
**Apply to:** `related-posts.test.ts`, optional `top-n-scoring.test.ts`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/lib/top-n-scoring.mjs` | utility | transform | No existing traffic/keyword scoring engine — implement from `docs/SEO-MIGRATION-DESIGN.md` §5 |
| `src/pages/blog/category/[id].astro` | route (SSG) | transform | No static category aggregation routes; optional SEO-08 enhancement |

**Planner fallback:** RESEARCH/design doc for Top N formula weights; choose client island vs static category pages for SEO-08 based on topic-cluster priority.

---

## Metadata

**Analog search scope:** `src/blog/`, `src/lib/`, `src/pages/blog/`, `src/pages/index.astro`, `src/components/blog/`, `src/components/islands/`, `scripts/`, `scripts/lib/`, `docs/`, `tests/`, `tests/e2e/`, `.planning/phases/PW-02-site-islands/`, `.planning/phases/PW-03-ci/03-PATTERNS.md`
**Files scanned:** ~28
**Pattern extraction date:** 2026-06-21
