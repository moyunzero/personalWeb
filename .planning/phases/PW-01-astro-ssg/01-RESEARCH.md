# Phase 1: Astro 基础与博客 SSG - Research

**Researched:** 2026-06-21
**Domain:** Astro SSG + Content Collections + GitHub Pages subdirectory deployment
**Confidence:** HIGH

## Summary

Phase 1 replaces the Vite SPA production build with a single **Astro static output** targeting GitHub Pages at `https://moyunzero.github.io/personalWeb/`. The existing `content/posts/*.md` corpus (96 files) stays in place; Astro Content Collections with a `glob` loader (or custom loader wrapping `parseFrontmatter`) becomes the data layer. Blog list and detail pages render full HTML at build time with Shiki code highlighting, build-time SEO head, and sitemap/robots generation via `@astrojs/sitemap` plus a prerendered `robots.txt` endpoint.

**Version note:** npm `latest` for `astro` is **6.4.8** (published 2026-06-17); the latest **Astro 5** line is **5.18.2**. Both support the Content Layer API (`glob` loader in `src/content.config.ts`). This research targets **Astro 5.18.x** per phase scope; pin explicitly in `package.json` to avoid accidental v6 upgrade. [VERIFIED: npm registry]

**Primary recommendation:** Initialize Astro 5 with `@astrojs/react` + `@astrojs/tailwind`, configure `site`/`base`/`trailingSlash: 'always'`/`build.format: 'directory'`, implement a custom posts loader reusing `src/blog/frontmatter.js`, render blog pages as pure `.astro` (no React islands in Phase 1), use `@astrojs/sitemap` for sitemap (retire `generate-static.mjs` sitemap/posts-index), and switch CI to `yarn build` → `astro build`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 部署与构建边界（D-01）
- **D-01:** Phase 1 结束时 `yarn build` 与 GitHub Actions **仅使用 Astro 单一构建**产出 `dist/`
- **D-02:** 提供**占位静态首页**（H1、简短简介、链到博客）；**不**包含 GSAP/Lenis/Phaser（Phase 2 恢复）
- **D-03:** 旧 Vite SPA 入口在本 Phase 部署切换后不再作为生产构建；不接受双构建合并 dist

#### 博客 UI（D-04）
- **D-04:** Phase 1 博客列表/详情采用 **SEO 优先的简化深色模板**（复用 Tailwind 与现有色彩/间距常量）
- **D-05:** 不要求与现 `Blog.jsx` / `BlogDetail.jsx` 像素级一致；视觉统一延至 Phase 2

#### Markdown 与内容管线（D-06）
- **D-06:** 博客 Markdown 使用 **Astro + Shiki** 构建时代码高亮（代码块写入静态 HTML）
- **D-07:** 博客数据路径使用 **Content Collections**，读取 `content/posts/**/*.md`
- **D-08:** **停止生成** `public/posts-index.json`；`notion-sync` / `blog:new` 仍只写 md 文件
- **D-09:** 复用 `src/blog/frontmatter.js` 的 YAML 解析逻辑（Notion 非标准 YAML 兼容）于构建脚本或 Astro 集成

#### URL 与 SEO（D-10）
- **D-10:** Astro `trailingSlash: 'always'`；canonical URL 带尾部斜杠（如 `/personalWeb/blog/{slug}/`）
- **D-11:** 每页 head 在构建时输出：`title`、`description`、`canonical`、`og:*`、博客文 `BlogPosting` JSON-LD
- **D-12:** `html lang="zh-CN"`；站点 URL 以 `scripts/lib/site-config.mjs` 的 `SITE.url` 为 canonical 基准

#### sitemap 与部署（D-13）
- **D-13:** 构建时生成 `sitemap.xml`、`robots.txt`（覆盖占位首页、博客列表、全部已发布文章）
- **D-14:** GitHub Actions `deploy.yml` 的 build 步骤改为 `astro build`（或等价 `yarn build` 调用 astro）
- **D-15:** 保留 GitHub Pages SPA 回退：`public/404.html` 或 Astro 等价方案，确保 `/blog` 深链可访问

#### 从里程碑/设计已锁定（本 Phase 不重新讨论）
- 框架：Astro SSG，`base: '/personalWeb/'`
- 托管：GitHub Pages 免费，无自定义域名
- 内容源：`content/posts/` + `content/categories.json`
- Phase 1 不包含：web editor、seo-audit CI 门禁、批量元数据、相关文章内链组件（Phase 4）

### Claude's Discretion
- Astro 目录结构（`src/pages` vs `src/content` 布局细节）
- Shiki 主题选择（对齐现站深色代码块即可）
- 占位首页具体文案与布局（保持简洁、含可抓取正文）
- `generate-static.mjs` 并入 Astro integration vs 保留 pre-build 脚本的实现方式

### Deferred Ideas (OUT OF SCOPE)
- 首页 GSAP/Lenis/Phaser 交互岛 → Phase 2
- 博客像素级 UI 与现站一致 → Phase 2
- `posts-index.json` 若其他工具仍依赖 → Phase 2/3 清理时确认并删除生成脚本
- 相关文章内链、分类 topic cluster → Phase 4
- `seo:audit` CI 门禁 → Phase 3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGR-01 | Astro 静态站点，`base` 为 `/personalWeb/`，输出 `dist/` | `astro.config.mjs` with `output: 'static'`, `base`, `site`; GH Pages deploy unchanged artifact path |
| MIGR-02 | 每篇博客 `/blog/{slug}/` 独立静态 HTML | `getStaticPaths` from `getCollection('posts')`; `render()` for body; `build.format: 'directory'` |
| MIGR-03 | Content Collections schema 校验 frontmatter | `src/content.config.ts` Zod schema; custom loader using `parseFrontmatter` |
| MIGR-04 | GitHub Actions 使用 `astro build` | Update `deploy.yml` build step; remove Vite pre-script |
| SEO-01 | 构建时输出 title/description/canonical | `BaseLayout.astro` props + `<link rel="canonical">` via `new URL(Astro.url.pathname, Astro.site)` |
| SEO-02 | 博客页 OG + BlogPosting JSON-LD | `BlogLayout.astro` with og:article tags + `set:html` JSON-LD script |
| SEO-04 | 构建时 sitemap.xml + robots.txt | `@astrojs/sitemap` integration + `src/pages/robots.txt.ts` prerendered |
| SEO-06 | 全站 `html lang="zh-CN"` | `<html lang="zh-CN">` in `BaseLayout.astro`; value from `SITE.language` |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Blog HTML generation | Build-time SSG (Astro) | — | Crawlers need static HTML; no client render |
| Frontmatter parsing | Build-time loader | Node scripts (`notion-sync`) | Notion YAML quirks handled once in `frontmatter.js` |
| SEO meta / JSON-LD | Astro layouts (SSG) | — | Must be in initial HTML, not `useDocumentMeta` |
| Code highlighting | Astro markdown (Shiki) | — | Build-time HTML; replaces `rehype-highlight` |
| Sitemap / robots | Astro integration + prerendered endpoint | — | Replaces `generate-static.mjs` |
| Asset serving | CDN / Static (GH Pages) | — | `public/` copied to `dist/` |
| Draft filtering | Content Collection query | — | Filter at build, not runtime |
| Placeholder homepage | Astro page (SSG) | — | Static crawlable content; no React islands in P1 |
| 404 handling | Static file (`404.html` or `404.astro`) | GH Pages server | Real routes exist for blog; 404 only for unknown URLs |
| Content authoring | CLI scripts (Node) | Notion sync | Unchanged; writes md only |

## Project Constraints (from .cursor/rules/)

- **Codegraph MCP:** Use `codegraph_context` with `task` param (not `query`); use `codegraph_search` with `query` param. Structure questions should use Codegraph before grep loops.
- **Karpathy guidelines:** Minimal scope; no over-engineering; surgical changes only.
- **Frontend design:** Phase 1 blog uses simplified dark template (D-04/D-05); full design polish deferred to Phase 2.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | **5.18.2** (pin `^5.18.0`) | SSG framework | Locked scope; Content Layer API; GH Pages docs [CITED: docs.astro.build/en/guides/deploy/github/] |
| `@astrojs/react` | **5.0.7** | React islands (Phase 2 prep) | Official integration; minimal P1 use [VERIFIED: npm registry] |
| `@astrojs/tailwind` | **6.0.2** | Tailwind in Astro | Reuses existing `tailwind.config.js` + `@tailwindcss/typography` [VERIFIED: npm registry] |
| `@astrojs/sitemap` | **3.7.3** | Sitemap generation | Respects `site`/`base`/`trailingSlash`; replaces hand-rolled sitemap [CITED: docs.astro.build/en/guides/integrations-guide/sitemap/] |
| `zod` (via `astro/zod`) | bundled | Content schema | Required by Content Collections [CITED: docs.astro.build/en/guides/content-collections/] |
| `yaml` | **2.9.0** (existing) | Notion YAML parse | Already in `frontmatter.js` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` / `react-dom` | **18.3.1** (existing) | Phase 2 islands | Keep dep; no islands in P1 blog pages |
| `@tailwindcss/typography` | **0.5.19** (existing) | Prose styling | Blog article body (`prose prose-invert`) |
| `tailwind-scrollbar` | **3.1.0** (existing) | Scrollbar styling | Global layout |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@astrojs/sitemap` | Adapt `generate-static.mjs` | Manual script lacks `trailingSlash` sync, draft filtering, base-path handling; must duplicate URL logic |
| Custom loader + `parseFrontmatter` | Plain `glob` loader | Astro built-in YAML parser may fail on Notion `key:value` (no space) — violates D-09 |
| `astro-seo` component | Hand-rolled layout head | Extra dep; hand-rolled `<meta>` is trivial and matches D-11 exactly |
| Astro 6.x | Astro 5.x | v6 is npm latest but out of stated scope; v5.18.x has all needed APIs |

**Installation:**

```bash
yarn add astro@^5.18.0 @astrojs/react@^5.0.0 @astrojs/tailwind@^6.0.0 @astrojs/sitemap@^3.7.0
yarn astro add react tailwind sitemap --yes   # alternative interactive setup
```

**Version verification (2026-06-21):**

```bash
npm view astro@5 version          # 5.18.2
npm view @astrojs/react version   # 5.0.7
npm view @astrojs/tailwind version # 6.0.2
npm view @astrojs/sitemap version  # 3.7.3
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `astro` | npm | 5.x line mature; latest publish recent | ~3.5M/wk | github.com/withastro/astro | SUS (too-new flag on latest) | Approved — official framework; pin `@^5.18.0` not `@latest` (6.x) |
| `@astrojs/react` | npm | mature | ~1.2M/wk | github.com/withastro/astro | SUS (too-new flag) | Approved — official integration |
| `@astrojs/tailwind` | npm | mature | ~390K/wk | github.com/withastro/astro | OK | Approved |
| `@astrojs/sitemap` | npm | mature | ~1.7M/wk | github.com/withastro/astro | SUS (too-new flag) | Approved — official integration |
| `@astrojs/mdx` | npm | mature | ~1.1M/wk | github.com/withastro/astro | SUS (too-new flag) | Not needed Phase 1 — `.md` only |

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious [SUS]:** `astro`, `@astrojs/react`, `@astrojs/sitemap` — all official `@withastro/*` packages; SUS is false positive from "too-new" publish date on latest semver. No human checkpoint required beyond pinning Astro 5.x.

**Postinstall scripts:** none on audited packages [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
content/posts/*.md ──► Custom Posts Loader (parseFrontmatter)
                              │
                              ▼
                    Content Collection Store
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      src/pages/index.astro  blog/index.astro  blog/[...slug].astro
      (placeholder home)     (list SSG)        (detail SSG + Shiki body)
              │               │               │
              └───────────────┴───────────────┘
                              │
                    BaseLayout / BlogLayout
                    (canonical, OG, JSON-LD, lang=zh-CN)
                              │
                              ▼
                      astro build (static)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
           dist/         sitemap-index.xml   robots.txt
              │
              ▼
         GitHub Actions ──► GitHub Pages (/personalWeb/)
```

### Recommended Project Structure

```
/
├── astro.config.mjs              # site, base, trailingSlash, integrations
├── src/
│   ├── content.config.ts         # posts collection + Zod schema
│   ├── loaders/
│   │   └── posts-loader.ts       # wraps parseFrontmatter (D-09)
│   ├── layouts/
│   │   ├── BaseLayout.astro      # html lang, canonical, default OG
│   │   └── BlogLayout.astro      # BlogPosting JSON-LD, og:article
│   ├── pages/
│   │   ├── index.astro           # placeholder home (D-02)
│   │   ├── 404.astro             # static 404 (replaces SPA redirect)
│   │   ├── robots.txt.ts         # prerendered robots
│   │   └── blog/
│   │       ├── index.astro       # list
│   │       └── [...slug].astro   # detail
│   ├── components/
│   │   └── blog/                 # Astro components (simplified dark UI)
│   ├── styles/
│   │   └── global.css            # @tailwind directives
│   └── lib/
│       └── site.ts               # re-export SITE from site-config.mjs
├── content/posts/                # unchanged (96 md files)
├── content/categories.json       # unchanged
├── public/                       # favicon, images (no posts-index.json)
├── scripts/
│   ├── lib/site-config.mjs       # canonical URL source (D-12)
│   └── generate-static.mjs       # RETIRE in P1 (sitemap + posts-index)
└── .github/workflows/deploy.yml  # yarn build → astro build
```

### Pattern 1: Astro + GitHub Pages Subpath Config

**What:** Single config block drives asset URLs, canonical, sitemap.
**When to use:** All builds targeting `moyunzero.github.io/personalWeb/`.

```js
// Source: https://docs.astro.build/en/guides/deploy/github/
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { SITE } from './scripts/lib/site-config.mjs';

export default defineConfig({
  site: SITE.url, // https://moyunzero.github.io/personalWeb
  base: '/personalWeb/',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/draft/'),
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});
```

**Note on `site` value:** Existing `SITE.url` already includes `/personalWeb` path (`https://moyunzero.github.io/personalWeb`). Astro docs typically set `site` to origin only (`https://moyunzero.github.io`) + separate `base`. Either works if canonical generation is consistent — **recommend splitting** in `site-config.mjs`:

```js
export const SITE = {
  origin: 'https://moyunzero.github.io',
  basePath: '/personalWeb',
  url: 'https://moyunzero.github.io/personalWeb', // canonical base (no trailing slash)
  language: 'zh-CN',
  // ...
};
```

Then `astro.config.mjs`: `site: SITE.origin`, `base: SITE.basePath + '/'`.

### Pattern 2: Custom Posts Loader (Notion YAML)

**What:** Loader reads raw md, applies `normalizeFrontmatterYaml` + `parseFrontmatter`, populates content store.
**When to use:** D-09 — Astro default YAML parser may reject Notion `description:中文` format.

```ts
// Source: https://docs.astro.build/en/reference/content-loader-reference/
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';

const POSTS_DIR = './content/posts';

export function postsLoader(): Loader {
  return {
    name: 'posts-loader',
    load: async ({ store, parseData, logger }) => {
      store.clear();
      const dir = path.resolve(POSTS_DIR);
      const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const raw = await readFile(path.join(dir, file), 'utf8');
        const { data, content } = parseFrontmatter(raw);
        const fileSlug = file.replace(/\.md$/, '');
        const slug = String(data.slug || fileSlug);
        const id = slug;

        const entry = await parseData({
          id,
          data: {
            title: data.title ?? slug,
            slug,
            description: data.description ?? '',
            date: data.date ?? data.publishDate ?? '',
            categories: data.categories ?? [],
            tags: data.tags ?? [],
            draft: Boolean(data.draft),
            author: data.author ?? '墨韵',
            cover: data.cover,
            body: content,
          },
        });

        store.set({ id, data: entry, body: content });
      }
    },
    schema: z.object({
      title: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      date: z.coerce.string(),
      categories: z.array(z.string()),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().default(false),
      author: z.string().default('墨韵'),
      cover: z.string().optional(),
    }),
  };
}
```

**Fallback:** If custom loader complexity is high, use `glob({ base: './content/posts' })` + pre-build `normalize-frontmatter.mjs` script — less ideal but satisfies D-09.

### Pattern 3: Blog Detail SSG with Draft Filter

```astro
---
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getCollection, render } from 'astro:content';
import BlogLayout from '../../layouts/BlogLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<BlogLayout post={post}>
  <Content />
</BlogLayout>
```

### Pattern 4: SEO Head in Layout

```astro
---
// Source: https://docs.astro.build/en/guides/configuring-astro/
const { title, description, image, type = 'website' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
---
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:type" content={type} />
  <meta property="og:locale" content="zh_CN" />
  {image && <meta property="og:image" content={image} />}
</head>
```

**BlogPosting JSON-LD** (blog detail only):

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.data.title,
  description: post.data.description,
  datePublished: post.data.date,
  author: { "@type": "Person", name: post.data.author },
  url: canonical,
  inLanguage: "zh-CN",
})} />
```

### Pattern 5: Sitemap + Robots (Replace generate-static.mjs)

**Recommendation:** Use `@astrojs/sitemap` integration (Claude's discretion resolved).

```ts
// src/pages/robots.txt.ts
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}\n`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
};
```

**Retire from `generate-static.mjs`:** sitemap.xml, robots.txt, posts-index.json (D-08). Keep file temporarily for reference; remove from `package.json` build chain.

**URL trailing slash:** Existing sitemap emits `/blog` and `/blog/{slug}` **without** trailing slash. Astro `@astrojs/sitemap` with `trailingSlash: 'always'` emits `/personalWeb/blog/` and `/personalWeb/blog/{slug}/` — matches D-10.

### Pattern 6: 404 / Deep Link Handling

**With Astro SSG + `build.format: 'directory'`:** Each blog URL becomes `dist/blog/{slug}/index.html`. GitHub Pages serves these **directly** — no SPA redirect needed for valid blog routes. [CITED: docs.astro.build/en/reference/configuration-reference/]

**D-15 interpretation for Phase 1:**
- Replace SPA `public/404.html` (redirects to React `index.html`) with **`src/pages/404.astro`** — static page linking to home and blog.
- Remove rafgraph SPA redirect scripts from production path (conflicts with D-03).
- Keep a minimal `public/404.html` copy of Astro 404 output only if GH Pages requires root-level 404 file (GH Pages uses `404.html` at site root for unknown URLs).

**Internal links:** Always use trailing slashes: `<a href={`${import.meta.env.BASE_URL}blog/`}>`. Consider helper `withTrailingSlash(href)`. [CITED: docs.astro.build/en/reference/configuration-reference/]

### Anti-Patterns to Avoid

- **Client-side meta injection (`useDocumentMeta`):** Current SPA pattern; invisible to Baidu. Phase 1 must use Astro layouts.
- **Dual build (Vite + Astro → merged dist):** Explicitly forbidden (D-03).
- **Keeping `posts-index.json`:** Forbidden (D-08); blog list reads collection at build time.
- **Hardcoded `/personalWeb` paths:** Use `import.meta.env.BASE_URL`.
- **SPA 404 redirect to React app:** Breaks Phase 1 static-only production.
- **`description` required in schema now:** Blocks build on 96 posts; defer strict validation to Phase 3 (OPT-02).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap XML | Custom XML builder | `@astrojs/sitemap` | Handles base, trailing slash, lastmod, i18n |
| Syntax highlighting | Client highlight.js | Astro Shiki (`markdown.shikiConfig`) | Static HTML at build; matches D-06 |
| Markdown → HTML | react-markdown pipeline | Astro `<Content />` / `render()` | Zero JS on blog pages |
| YAML frontmatter | Duplicate parser | Reuse `src/blog/frontmatter.js` | Notion compat already solved |
| Canonical URLs | String concat | `new URL(Astro.url.pathname, Astro.site)` | Handles base/trailing slash |
| GitHub Pages deploy | Custom deploy script | Existing Actions + `astro build` | Already working; swap build cmd only |

**Key insight:** Phase 1 goal is crawlable static HTML. Every hand-rolled client solution from the Vite era works against SEO requirements.

## Common Pitfalls

### Pitfall 1: Notion YAML Breaks Content Collection Build

**What goes wrong:** Astro default frontmatter parser throws on `description:中文` (missing space after colon).
**Why it happens:** Notion-to-md sync produces non-standard YAML; `normalizeFrontmatterYaml` fixes this in existing pipeline.
**How to avoid:** Custom loader calling `parseFrontmatter` (D-09); test build against all 96 posts early.
**Warning signs:** `YAMLException` during `astro build`; single post blocks entire build.

### Pitfall 2: Trailing Slash Mismatch

**What goes wrong:** Canonical URLs, sitemap entries, and internal links disagree on trailing slash; GH Pages 301 redirects.
**Why it happens:** Old sitemap used `/blog/{slug}`; D-10 requires trailing slash; GH Pages prefers directory indexes.
**How to avoid:** `trailingSlash: 'always'` + `build.format: 'directory'` + audit all `<a href>`.
**Warning signs:** Lighthouse redirect chains; Search Console "Page with redirect" warnings.

### Pitfall 3: `site` vs `base` Confusion

**What goes wrong:** CSS/JS 404, wrong canonical domain, sitemap URLs missing `/personalWeb`.
**Why it happens:** `site` set to full path when it should be origin, or vice versa.
**How to avoid:** Follow GH Pages guide: origin in `site`, repo name in `base`; test `import.meta.env.BASE_URL` in preview.
**Warning signs:** Unstyled pages on GH Pages; canonical pointing to wrong host.

### Pitfall 4: Draft Posts Leak into Production

**What goes wrong:** Draft articles appear in sitemap and blog list.
**Why it happens:** Missing filter in `getCollection` and sitemap `filter`.
**How to avoid:** Filter `!data.draft` in list, `getStaticPaths`, and sitemap integration.
**Warning signs:** Draft slugs reachable via direct URL or sitemap.

### Pitfall 5: Keeping Vite Build in CI

**What goes wrong:** Deploy still serves SPA without static blog HTML.
**Why it happens:** Forgetting to update `package.json` scripts and `deploy.yml`.
**How to avoid:** Single `yarn build` → `astro build`; remove `generate-static.mjs && vite build`.
**Warning signs:** view-source shows empty `<div id="root">` on blog pages.

### Pitfall 6: Schema Too Strict for 96 Posts

**What goes wrong:** Build fails on missing `description` across library.
**Why it happens:** MIGR-03 requires schema fields but OPT-02 (strict description) is Phase 3.
**How to avoid:** `description: z.string().optional()` in Phase 1; fallback to `extractExcerpt` in loader.
**Warning signs:** Zod validation errors listing dozens of posts.

## Code Examples

### astro.config.mjs (Complete Phase 1 Baseline)

```js
// Source: https://docs.astro.build/en/guides/deploy/github/
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { SITE } from './scripts/lib/site-config.mjs';

export default defineConfig({
  site: 'https://moyunzero.github.io',
  base: '/personalWeb/',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: 'github-dark' },
  },
});
```

### Content Collection Schema (Phase 1 Relaxed)

```ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { postsLoader } from './loaders/posts-loader';

const posts = defineCollection({
  loader: postsLoader(),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    date: z.string(),
    categories: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    author: z.string().default('墨韵'),
  }),
});

export const collections = { posts };
```

### Tailwind Config Update

```js
// Extend existing tailwind.config.js content globs:
content: [
  './src/**/*.{astro,html,js,jsx,ts,tsx}',
],
```

### Placeholder Homepage (D-02)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SITE } from '../lib/site';
---
<BaseLayout
  title={`${SITE.name} · 个人网站`}
  description={SITE.description}
>
  <main class="mx-auto max-w-3xl px-6 py-16 text-zinc-100">
    <h1 class="text-4xl font-bold mb-6">{SITE.name}</h1>
    <p class="text-zinc-400 leading-relaxed mb-8">
      这里是墨韵的个人网站。日常、笔记与思考 — 技术文章、阅读笔记与开发实践。
      本站正在迁移至静态站点架构，以提升搜索收录与阅读体验。
      你可以从博客开始阅读已发布的文章。
    </p>
    <a href={`${import.meta.env.BASE_URL}blog/`} class="text-sky-400 hover:text-sky-300">
      进入博客 →
    </a>
  </main>
</BaseLayout>
```

## Phase 1 Migration: Keep / Remove / Change

### Keep (unchanged or reused)

| Asset | Reason |
|-------|--------|
| `content/posts/*.md` | Content source (D-07) |
| `content/categories.json` | Category labels |
| `src/blog/frontmatter.js` | Notion YAML compat (D-09) |
| `src/blog/excerpt.js`, `getCategories.js` | Excerpt fallback, labels |
| `scripts/lib/site-config.mjs` | Canonical URL source (D-12) |
| `scripts/notion-sync.mjs`, `scripts/new-post.mjs` | Content workflow unchanged |
| `scripts/lib/load-posts.mjs` | Reference for loader logic; may wrap in tests |
| `tailwind.config.js`, `postcss.config.js` | Styling |
| `public/images/`, favicon | Static assets |
| React/GSAP/Phaser deps | Phase 2 islands; keep in package.json |

### Change

| Asset | Change |
|-------|--------|
| `package.json` scripts | `dev`: `astro dev`; `build`: `astro build`; `preview`: `astro preview` |
| `.github/workflows/deploy.yml` | Remove `VITE_CHAT_API_URL` from build (no chat on placeholder home); keep `yarn build` |
| `tailwind.config.js` | Add `.astro` to `content` globs |
| `public/404.html` | Replace SPA redirect with static 404 or remove in favor of `404.astro` |
| `scripts/lib/site-config.mjs` | Optionally split `origin` vs `basePath` for Astro config |

### Remove from Phase 1 build path (defer file deletion to Phase 2)

| Asset | Reason |
|-------|--------|
| `scripts/generate-static.mjs` in build chain | Replaced by `@astrojs/sitemap` + `robots.txt.ts` |
| `public/posts-index.json` generation | D-08 |
| Vite production build (`vite build`) | D-01, D-03 |
| `index.html` SPA entry as production | D-03 |
| `useDocumentMeta` on blog pages | Replaced by Astro layouts |
| `react-markdown` + `rehype-highlight` on blog | Replaced by Astro markdown/Shiki |

### Phase 2 cleanup (do NOT remove yet)

- `vite.config.js`, `src/main.jsx`, React Router, `Blog.jsx`, `BlogDetail.jsx`
- `BlogEditor`, `/blog/editor` route
- Vite-specific devDependencies

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite SPA + client meta | Astro SSG + layout head | Phase 1 | Crawlers see full HTML |
| `posts-index.json` + fetch | Content Collections | Phase 1 | No runtime JSON; build-time only |
| `rehype-highlight` (client) | Shiki (build) | Phase 1 | Code blocks in static HTML |
| `generate-static.mjs` sitemap | `@astrojs/sitemap` | Phase 1 | Auto sync with routes |
| Astro `src/content/` folder only | Content Layer `glob`/custom loader | Astro 5+ | Can read `content/posts/` at repo root |

**Deprecated/outdated:**
- **rafgraph SPA 404 redirect:** Not needed when all routes are prerendered; harmful if it redirects to removed SPA.
- **Astro `src/content/` legacy API:** Replaced by `src/content.config.ts` + loaders in Astro 5+.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Astro 5.18.x preferred over npm latest 6.4.8 | Standard Stack | API differences if planner installs `@latest` |
| A2 | Custom loader is simplest D-09 compliance path | Pattern 2 | Build failures if glob loader + Notion YAML incompatible |
| A3 | `SITE.url` should split into `origin` + `base` for Astro | Pattern 1 | Wrong canonical/sitemap URLs if kept as-is |
| A4 | SPA 404.html should be replaced, not kept as redirect | Pattern 6 | Users hitting 404 get broken SPA redirect post-migration |
| A5 | `description` schema stays optional in Phase 1 | Pitfall 6 | Premature strict schema blocks all 96 posts |

## Open Questions

1. **Dev server base path:** Keep `base: '/personalWeb/'` in dev (matches prod) or use env switch (`'/'` locally)?
   - What we know: GH Pages prod requires subpath base [CITED: docs.astro.build/en/guides/deploy/github/]
   - What's unclear: Developer ergonomics preference
   - Recommendation: Match prod base in dev to avoid surprise; use `astro dev --base /personalWeb/` or consistent config

2. **Custom loader vs pre-build normalizer for Notion YAML**
   - What we know: D-09 requires `parseFrontmatter`; unknown count of affected files
   - Recommendation: Custom loader (cleaner); spike with `astro build` on full corpus in plan 01-02

3. **Sitemap filename:** `@astrojs/sitemap` emits `sitemap-index.xml` + `sitemap-0.xml`, not `sitemap.xml`
   - What we know: Existing `robots.txt` points to `/sitemap.xml`
   - Recommendation: Update robots to `sitemap-index.xml`; add redirect or configure integration if needed

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | ✓ | v24.12.0 | Requires ≥18.17 |
| Yarn | CI + local install | ✓ | 1.22.22 | npm works |
| Astro CLI | dev/build | ✗ (not global) | — | `yarn astro` via local dep after install |
| GitHub Actions | deploy | ✓ | ubuntu-latest, node 20 | — |
| GitHub Pages | hosting | ✓ | project site | — |

**Missing dependencies with no fallback:**
- Astro packages (not yet installed) — Wave 0 task in plan 01-01

**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest **4.1.5** (in package.json) |
| Config file | none — Wave 0 gap |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

**Current state:** `package.json` declares `"test": "vitest --run"` but **no test files exist** in repo [VERIFIED: workspace grep].

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIGR-01 | `astro build` succeeds with base `/personalWeb/` | integration | `yarn build` (post-setup) | ❌ Wave 0 |
| MIGR-02 | Blog detail HTML contains article body text | integration | `node scripts/verify-static-blog.mjs` (to create) | ❌ Wave 0 |
| MIGR-03 | Schema rejects invalid frontmatter | unit | `yarn test src/content.schema.test.ts -x` | ❌ Wave 0 |
| MIGR-04 | CI workflow invokes astro build | smoke | `grep 'yarn build' .github/workflows/deploy.yml` | ✅ exists |
| SEO-01 | Built HTML has title, description, canonical | integration | `yarn test tests/seo-head.test.ts -x` | ❌ Wave 0 |
| SEO-02 | Blog page has BlogPosting JSON-LD + og:tags | integration | `yarn test tests/seo-head.test.ts -x` | ❌ Wave 0 |
| SEO-04 | dist contains sitemap + robots.txt | integration | `yarn test tests/sitemap.test.ts -x` | ❌ Wave 0 |
| SEO-06 | Built pages have `lang="zh-CN"` | integration | `yarn test tests/seo-head.test.ts -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn test` (once tests exist); `yarn build` for integration-heavy tasks
- **Per wave merge:** `yarn build && yarn test`
- **Phase gate:** `yarn build` green; view-source manual check on 1 blog post; sitemap URL count matches published post count

### Wave 0 Gaps

- [ ] `vitest.config.js` — configure Node environment, `@/` aliases if needed
- [ ] `tests/frontmatter.test.ts` — verify `parseFrontmatter` + Notion YAML edge cases (supports D-09)
- [ ] `tests/seo-head.test.ts` — parse built `dist/blog/*/index.html` for meta/JSON-LD (supports SEO-01/02/06)
- [ ] `tests/sitemap.test.ts` — verify sitemap contains home, blog index, N post URLs with trailing slash (SEO-04)
- [ ] `tests/content.schema.test.ts` — Zod schema validation fixtures (MIGR-03)
- [ ] Framework install: Astro deps in plan 01-01

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — static public site |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A — no private routes in P1 |
| V5 Input Validation | yes | Zod content schema; no user input endpoints |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for Static Astro Site

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via markdown | Tampering | Astro escapes HTML by default; avoid `rehype-raw` unless needed |
| Malicious frontmatter | Tampering | Zod schema bounds; no `set:html` on user content |
| Dependency supply chain | Spoofing | Pin Astro 5.x; official `@astrojs/*` only |
| Secrets in CI env | Information disclosure | Remove unused `VITE_*` from build; no secrets in static bundle |

## Sources

### Primary (HIGH confidence)
- [/withastro/docs via Context7] — GH Pages deploy, Content Collections, Shiki, sitemap, JSON-LD `set:html`
- [npm registry] — package version verification

### Secondary (MEDIUM confidence)
- [https://docs.astro.build/en/guides/deploy/github/] — GH Pages `site`/`base` configuration
- [https://docs.astro.build/en/reference/configuration-reference/] — `trailingSlash`, `build.format`
- [https://docs.astro.build/en/guides/integrations-guide/sitemap/] — sitemap + robots pattern
- [Existing codebase] — `frontmatter.js`, `generate-static.mjs`, `site-config.mjs`, `deploy.yml`

### Tertiary (LOW confidence)
- [WebSearch] — trailing slash behavior on GH Pages with Astro; community blog posts

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — official Astro docs + npm verification
- Architecture: **HIGH** — matches locked CONTEXT decisions and existing codebase patterns
- Pitfalls: **HIGH** — derived from known Notion YAML issue and GH Pages subpath deployment

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (Astro 5.x stable)

## RESEARCH COMPLETE
