# Phase 1: Astro 基础与博客 SSG - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 18 new/modified targets
**Analogs found:** 16 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `astro.config.mjs` | config | transform | `vite.config.js` | exact |
| `src/content/config.ts` | config / model | file-I/O | `src/blog/parsePost.js` | role-match |
| `src/pages/index.astro` | route | request-response (SSG) | `src/components/home/Main.jsx` + `index.html` | partial |
| `src/pages/blog/index.astro` | route | CRUD (list) | `src/pages/Blog.jsx` | exact |
| `src/pages/blog/[...slug].astro` | route | file-I/O | `src/pages/BlogDetail.jsx` | exact |
| `src/layouts/BaseLayout.astro` | layout | transform | `index.html` + `src/hooks/useDocumentMeta.js` | role-match |
| `src/layouts/BlogLayout.astro` | layout | transform | `src/pages/Blog.jsx` (wrapper div) | partial |
| `src/lib/site.ts` (or `.mjs`) | utility | transform | `scripts/lib/site-config.mjs` | exact |
| `src/lib/blog.ts` (helpers) | utility | transform | `src/blog/utils.js` + `getCategories.js` | exact |
| `src/lib/posts.ts` (filter/group) | utility | transform | `src/blog/filterPosts.js` + `groupPostsByYear.js` | exact |
| `src/styles/global.css` | config | transform | `src/index.css` | exact |
| `tailwind.config.js` | config | transform | `tailwind.config.js` | exact |
| `package.json` | config | batch | `package.json` | exact |
| `.github/workflows/deploy.yml` | config | batch | `.github/workflows/deploy.yml` | exact |
| `public/404.html` | static asset | request-response | `public/404.html` | exact |
| `scripts/generate-static.mjs` | utility / integration | file-I/O | `scripts/generate-static.mjs` | exact |
| `src/env.d.ts` | config | transform | — | no analog |
| Astro frontmatter YAML hook | middleware / integration | transform | `src/blog/frontmatter.js` | role-match |

**Note:** `src/constants/styles.js` referenced in CONTEXT does not exist; use Tailwind utility classes from `Blog.jsx` / `BlogPostCard.jsx` and `src/index.css` instead.

---

## Pattern Assignments

### `astro.config.mjs` (config, transform)

**Analog:** `vite.config.js`

**Base path pattern** (lines 5-10):

```javascript
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/personalWeb/' : '/',
```

**Apply to Astro:** `base: '/personalWeb/'`, `site: SITE.url` from `site-config.mjs`, `output: 'static'`, `trailingSlash: 'always'`, `@astrojs/react`, `@astrojs/tailwind`, `@astrojs/mdx` or markdown + Shiki. Mirror Vite's production-only base — Astro uses single `base` for build.

**Chunk/splitting reference** (lines 11-26) — not needed in Phase 1 blog-only build; defer Phaser/GSAP splits to Phase 2.

---

### `src/content/config.ts` (config / model, file-I/O)

**Analog:** `src/blog/parsePost.js` + sample post `content/posts/2026-06-14-mocode-phase-1.md`

**Field mapping pattern** (parsePost.js lines 31-79):

```javascript
export function parsePost(filePath, raw) {
    const { data, content } = parseFrontmatter(raw);
    const fileSlug = filePath
        .split('/')
        .pop()
        ?.replace(/\.md$/, '') ?? '';

    const slug = data.slug || fileSlug;
    const categories = Array.isArray(data.categories)
        ? data.categories
        : data.category
          ? [data.category]
          : [];

    const tags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

    const publishDate =
        normalizeDate(data.date || data.publishDate) || dateFromFileSlug(fileSlug);
    const draft = Boolean(data.draft);
    const featured = Boolean(data.featured);
```

**Schema fields to mirror:** `title`, `description`, `slug`, `author`, `date`/`publishDate`, `categories`, `tags`, `cover`, `gallery`, `draft`, `featured`, `readTime`, `updateDate`, optional `notionId`/`notionSyncedAt` (passthrough, not validated).

**Draft filter pattern** (loadPosts.js lines 19-25):

```javascript
function getIndexEntries() {
    return postsIndex.filter((post) => {
        if (import.meta.env.PROD && post.draft) {
            return false;
        }
        return true;
    });
}
```

**Apply in Astro:** `getCollection('posts', ({ data }) => import.meta.env.PROD ? !data.draft : true)` or equivalent filter in page frontmatter.

**Sample frontmatter** (`content/posts/2026-06-14-mocode-phase-1.md` lines 1-19):

```yaml
---
title: "MoCode Phase 1 开发笔记 "
slug: 2026-06-14-mocode-phase-1
description: ""
author: 墨韵
date: 2026-06-14
categories:
  - note
tags:
  - LLM
draft: false
---
```

---

### Astro frontmatter YAML integration (middleware / integration, transform)

**Analog:** `src/blog/frontmatter.js`

**Notion YAML normalize** (lines 9-11):

```javascript
export function normalizeFrontmatterYaml(yaml) {
    return yaml.replace(/^([A-Za-z][\w-]*):(?=\S)/gm, '$1: ');
}
```

**Parse pattern** (lines 18-38):

```javascript
export function parseFrontmatter(raw) {
    const match = raw.match(FRONTMATTER_RE);
    // ...
    const yamlBlock = normalizeFrontmatterYaml(match[1]);
    try {
        const data = parseYaml(yamlBlock);
        return { data, content: match[2] };
    } catch {
        return { data: {}, content: match[2] };
    }
}
```

**Build-script reuse** (load-posts.mjs lines 4-5):

```javascript
import { parseFrontmatter } from '../../src/blog/frontmatter.js';
import { extractExcerpt } from '../../src/blog/excerpt.js';
```

**Apply:** Custom Astro integration or `remark`/`rehype` preprocessor that runs `normalizeFrontmatterYaml` before Astro's default YAML parser; or keep importing `frontmatter.js` in a `astro:config:setup` hook. Do not duplicate YAML logic — import from `src/blog/frontmatter.js`.

---

### `src/pages/index.astro` (route, SSG)

**Analog:** `src/components/home/Main.jsx` (content tone) + `index.html` (document shell)

**Placeholder content pattern** — simplified from Main.jsx (lines 38-40, intro text):

```jsx
<h2 className="headline-1 max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto lg:mx-0 mt-5 mb-10 lg:mb-12 leading-tight">
    用代码创造有趣的东西 ✨
```

**Site intro from site-config** (site-config.mjs lines 2-9):

```javascript
export const SITE = {
    name: '墨韵',
    title: '墨韵 · 博客',
    description: '日常、笔记与思考 — 技术文章、阅读笔记与开发实践。',
    url: (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://moyunzero.github.io/personalWeb').replace(/\/$/, ''),
    author: '墨韵',
    language: 'zh-CN',
    basePath: '/personalWeb',
};
```

**Apply:** Static H1 + ~200 words body (D-02, design §3). Link to `/blog/` with trailing slash. No GSAP/Lenis/Phaser. Use `BaseLayout` with `title` = site name, `description` from SITE.

**Dark page shell** (Blog.jsx lines 77-78):

```jsx
<div className="relative z-10 bg-zinc-900 text-white">
```

---

### `src/pages/blog/index.astro` (route, CRUD list)

**Analog:** `src/pages/Blog.jsx`

**Page meta pattern** (lines 59-62):

```javascript
    useDocumentMeta({
        title: '博客',
        description: '日常、笔记与思考 — 技术文章、阅读笔记与开发实践。',
    });
```

**List data flow** (lines 22-34):

```javascript
    const categories = getCategories();
    const allPosts = useMemo(() => getAllPosts(), []);
    const filteredPosts = useMemo(
        () =>
            filterPosts(allPosts, {
                category: activeCategory,
                tag: activeTag,
                query,
            }),
        [allPosts, activeCategory, activeTag, query]
    );
```

**Year grouping** (lines 54-57, 214-226):

```javascript
    const yearSections = useMemo(() => {
        if (hasActiveFilters) return null;
        return groupPostsByYear(listPosts);
    }, [listPosts, hasActiveFilters]);
```

**Apply in Astro:** Build-time `getCollection` → sort by date → optional static category sections. Phase 1 may simplify client filter (category/tag/search) to static HTML lists grouped by year; copy Tailwind classes from Blog.jsx. Skip DEV-only editor link (lines 95-105).

**Category pills** (lines 123-148):

```jsx
<button
    type="button"
    className={`px-4 py-2 rounded-full text-sm transition-colors ${
        activeCategory === 'all'
            ? 'bg-sky-600 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
    }`}
>
```

**Card grid** (lines 220-223):

```jsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {posts.map((blog) => (
        <BlogPostCard key={blog.id} blog={blog} />
    ))}
</div>
```

**Card component analog:** `src/components/blog/BlogPostCard.jsx` — use as Astro component or inline markup.

---

### `src/pages/blog/[...slug].astro` (route, file-I/O)

**Analog:** `src/pages/BlogDetail.jsx`

**Load-by-slug pattern** (BlogDetail.jsx lines 19-38):

```javascript
    useEffect(() => {
        loadPostBySlug(id).then((post) => {
            if (!post) {
                setNotFound(true);
            } else {
                setBlog(post);
            }
        });
    }, [id]);
```

**Apply in Astro:** `getStaticPaths` from all non-draft posts; `params.slug` matches `data.slug || file stem`. No client fetch — full HTML in template.

**Article structure** (lines 98-178):

```jsx
<article>
    {blog.coverImage && (
        <img src={blog.coverImage} alt="" className="mb-10 max-h-[420px] w-full rounded-2xl object-cover ring-1 ring-zinc-800" loading="eager" />
    )}
    <header className="mb-10">
        <h1 className="text-3xl font-bold leading-snug tracking-tight text-white sm:text-4xl">
            {blog.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500">
            <span className="text-zinc-400">{blog.author}</span>
            <time dateTime={blog.publishDate}>{blog.publishDate}</time>
            <span>{blog.readTime} 分钟阅读</span>
        </div>
    </header>
    <div className="border-t border-zinc-800/80 pt-10">
        <MarkdownContent content={blog.content} />
    </div>
</article>
```

**Skip in Phase 1:** `getRelatedPosts` section (lines 183-208), `ReadingProgressBar`, `BlogPostNav` adjacent posts — deferred per CONTEXT (Phase 4 / not Phase 1).

**Markdown / code highlight analog:** `MarkdownContent.jsx` — Shiki replaces `rehype-highlight` at build time; copy `PROSE_CLASS` (lines 14-27):

```javascript
const PROSE_CLASS = `prose prose-invert prose-lg max-w-none
    prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight
    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-zinc-700/60
    prose-p:text-zinc-300 prose-p:leading-[1.85] prose-p:my-5
    prose-a:text-sky-400 prose-a:no-underline hover:prose-a:text-sky-300 hover:prose-a:underline
    prose-code:text-sky-300 prose-code:bg-zinc-950 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-700/80`;
```

Use `github-dark` theme to align with `highlight.js/styles/github-dark.css` import in MarkdownContent.jsx line 12.

---

### `src/layouts/BaseLayout.astro` (layout, transform)

**Analog:** `index.html` + `src/hooks/useDocumentMeta.js`

**HTML shell** (index.html lines 1-7):

```html
<!doctype html>
<html lang="en" class="scrollbar-thin scrollbar-track-zinc-800 scrollbar-thumb-zinc-500">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>墨韵</title>
    <link rel="shortcut icon" href="./images/favicon.svg" type="image/svg+xml">
```

**Apply:** `lang="zh-CN"` (D-12), favicon via `import.meta.env.BASE_URL + 'images/favicon.svg'`, Google fonts from index.html lines 10-15.

**Title pattern** (useDocumentMeta.js lines 9-12):

```javascript
export function useDocumentMeta({ title, description }) {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
```

**Static head props:** `title`, `description`, `canonical` (with trailing slash, D-10), `og:title`, `og:description`, `og:url`, `og:type`, `article:published_time` for posts. BlogPosting JSON-LD (D-11) — no existing implementation; build from post fields mirroring parsePost output.

**Canonical URL helper** (generate-static.mjs lines 24-28):

```javascript
function siteUrl(pathname = '') {
    const base = SITE.url.replace(/\/$/, '');
    const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${base}${suffix}`;
}
```

Post URL pattern (generate-static.mjs line 46):

```javascript
siteUrl(`/blog/${encodeURIComponent(post.id)}`)
```

**Apply with trailing slash:** `/personalWeb/blog/{slug}/` via Astro `trailingSlash: 'always'`.

---

### `src/layouts/BlogLayout.astro` (layout, transform)

**Analog:** `src/pages/Blog.jsx` wrapper + `src/layouts/MainLayout.jsx` blog branch

**Blog route isolation** (MainLayout.jsx lines 14-30):

```javascript
    const isBlogRoute = pathname === '/blog' || pathname.startsWith('/blog/');
    // ...
    {!isBlogRoute && <Header />}
    <Outlet />
    {isBlogRoute ? <BlogFooter /> : <Footer />}
```

**Apply:** Phase 1 blog pages use minimal shell — no Phaser/Chat/Particles (lines 18-27). Optional simple nav from Blog.jsx back link (lines 82-90). Skip `BlogFooter` unless needed for parity.

**Page background** (BlogDetail.jsx lines 84-86):

```jsx
<div className="relative z-10 min-h-screen bg-zinc-950 text-white">
```

---

### `src/lib/site.ts` / shared site config (utility, transform)

**Analog:** `scripts/lib/site-config.mjs`

**Full config** (lines 1-10):

```javascript
/** @type {{ name: string, title: string, description: string, url: string, author: string, language: string, basePath: string }} */
export const SITE = {
    name: '墨韵',
    title: '墨韵 · 博客',
    description: '日常、笔记与思考 — 技术文章、阅读笔记与开发实践。',
    url: (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://moyunzero.github.io/personalWeb').replace(/\/$/, ''),
    author: '墨韵',
    language: 'zh-CN',
    basePath: '/personalWeb',
};
```

**Apply:** Re-export or duplicate minimally for Astro `site` in config; single source of truth should remain `site-config.mjs` — import in both Node scripts and Astro via relative path.

---

### `src/lib/blog.ts` — asset resolution & categories (utility, transform)

**Analog:** `src/blog/utils.js` + `src/blog/getCategories.js`

**resolveBlogAsset** (utils.js lines 6-18):

```javascript
export function resolveBlogAsset(path) {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const base = import.meta.env.BASE_URL;
    const stripped = path.replace(/^\//, '');
    const withoutBasePrefix = stripped.startsWith(base.replace(/^\//, ''))
        ? stripped.slice(base.replace(/^\//, '').length).replace(/^\//, '')
        : stripped;
    return `${base}${withoutBasePrefix}`.replace(/\/{2,}/g, '/');
}
```

**Categories** (getCategories.js lines 14-28):

```javascript
export function getCategories() {
    if (!cached) {
        cached = [...categoriesData].sort((a, b) => a.order - b.order);
    }
    return cached;
}

export function getCategoryLabel(categoryId) {
    const found = getCategories().find((c) => c.id === categoryId);
    return found?.label ?? categoryId;
}
```

**Apply:** Import `content/categories.json` in Astro; same sort/label logic.

**Read time** (utils.js lines 26-28):

```javascript
export function estimateReadTime(content) {
    const words = content.replace(/\s+/g, '').length;
    return Math.max(1, Math.ceil(words / 400));
}
```

**Excerpt fallback** (excerpt.js lines 6-21) when `description` empty — same as parsePost line 58.

---

### `src/lib/posts.ts` — filter & group (utility, transform)

**Analog:** `src/blog/filterPosts.js` + `groupPostsByYear.js` + `getFeaturedPosts.js`

**filterPosts** (filterPosts.js lines 5-31):

```javascript
export function filterPosts(posts, { category = 'all', tag = '', query = '' } = {}) {
    if (category && category !== 'all') {
        result = result.filter((post) => post.categories.includes(category));
    }
    if (tag) {
        result = result.filter((post) =>
            post.tags.some((item) => item.toLowerCase() === normalizedTag)
        );
    }
    // title / description / tags search...
}
```

**groupPostsByYear** (groupPostsByYear.js lines 6-20):

```javascript
export function groupPostsByYear(posts) {
    for (const post of posts) {
        const year = new Date(post.publishDate).getFullYear();
        const safeYear = Number.isNaN(year) ? 0 : year;
        // ...
    }
    return [...groups.entries()]
        .sort(([yearA], [yearB]) => yearB - yearA)
        .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}
```

**Sort order** (load-posts.mjs lines 40-42):

```javascript
    return posts.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
    );
```

---

### `src/styles/global.css` + `tailwind.config.js` (config, transform)

**Analog:** `src/index.css` + `tailwind.config.js`

**Global body** (index.css lines 13-15):

```css
body{
  @apply bg-zinc-900 text-zinc-50
}
```

**Headline utilities** (index.css lines 21-27):

```css
.headline-1,
.headline-2{
  @apply max-w-max;
  background: -webkit-linear-gradient(0deg,#fafafa,#a1a1a1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**Tailwind content paths** (tailwind.config.js lines 5-9):

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
```

**Apply:** Extend content to `./src/**/*.{astro,html,js,ts,jsx,tsx}`; keep `typography` and `tailwind-scrollbar` plugins (lines 17-17).

---

### `package.json` (config, batch)

**Analog:** `package.json`

**Current build chain** (lines 6-9):

```json
"scripts": {
    "dev": "node scripts/generate-static.mjs && vite",
    "build": "node scripts/generate-static.mjs && vite build",
```

**Apply:** Replace with `astro dev` / `astro build`. Remove `generate-static.mjs` from build when sitemap moves to `@astrojs/sitemap` or Astro hook. Keep `blog:new`, `notion:sync` unchanged (D-08). Stop writing `posts-index.json` (D-08).

---

### `.github/workflows/deploy.yml` (config, batch)

**Analog:** `.github/workflows/deploy.yml`

**Build step** (lines 41-48):

```yaml
      - name: Build
        env:
          VITE_CHAT_API_URL: ${{ vars.VITE_CHAT_API_URL || 'https://personal-emotion-gpt.vercel.app/api/chat' }}
        run: yarn build
```

**Artifact path** (lines 51-55):

```yaml
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
```

**Apply:** `yarn build` → Astro output still `./dist`. Phase 1 may drop `VITE_CHAT_API_URL` until Phase 2 chat island returns. No change to Pages permissions/concurrency block (lines 12-22).

---

### `public/404.html` (static asset, request-response)

**Analog:** `public/404.html` + `index.html` SPA redirect script

**404 redirect** (public/404.html lines 35-44):

```javascript
      var path = window.location.pathname;
      var repo = '/personalWeb/';
      if (path.startsWith(repo)) {
        var subPath = path.slice(repo.length);
        window.location.replace(repo + '?/' + subPath.replace(/&/g, '~and~') + window.location.hash);
```

**Query restore** (index.html lines 25-34):

```javascript
       (function(l) {
         if (l.search[1] === '/' ) {
           var decoded = l.search.slice(1).split('&').map(function(s) { 
             return s.replace(/~and~/g, '&')
           }).join('?');
           window.history.replaceState(null, null,
               l.pathname.slice(0, -1) + decoded + l.hash
           );
         }
       }(window.location))
```

**Apply (D-15):** With full SSG, `/blog/` and `/blog/{slug}/` are real files — 404 fallback mainly for future SPA routes (Phase 2). Keep `repo = '/personalWeb/'` pattern. Astro may copy `public/404.html` to `dist/404.html` automatically.

---

### `scripts/generate-static.mjs` (utility, file-I/O) — migrate or replace

**Analog:** `scripts/generate-static.mjs`

**Sitemap builder** (lines 38-66):

```javascript
function buildSitemap(posts) {
    const staticPages = [
        { loc: siteUrl('/'), changefreq: 'weekly', priority: '1.0' },
        { loc: siteUrl('/blog'), changefreq: 'daily', priority: '0.9' },
    ];
    const postEntries = posts.map((post) => {
        const lastmod = toIsoDate(post.updateDate || post.publishDate);
        let entry = `  <url>\n    <loc>${escapeXml(siteUrl(`/blog/${encodeURIComponent(post.id)}`))}</loc>`;
        // ...
    });
```

**Robots** (lines 69-74):

```javascript
function buildRobots() {
    return `User-agent: *
Allow: /

Sitemap: ${siteUrl('/sitemap.xml')}
`;
}
```

**Posts index to remove** (lines 84-88):

```javascript
    await writeFile(
        path.join(PUBLIC_DIR, 'posts-index.json'),
        `${JSON.stringify(index, null, 0)}\n`,
        'utf8'
    );
```

**Apply (D-13, D-08):** Use `@astrojs/sitemap` with `site` + `base`, or Astro `integration` hook copying this logic. Delete `posts-index.json` generation. Update URLs to trailing-slash form (`/blog/slug/`). `loadPostsForBuild` (load-posts.mjs) remains useful for custom integration.

**loadPostsForBuild** (load-posts.mjs lines 13-42):

```javascript
export async function loadPostsForBuild({ includeDrafts = false } = {}) {
    const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md'));
    for (const file of files) {
        const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
        const { data, content } = parseFrontmatter(raw);
        const draft = Boolean(data.draft);
        if (draft && !includeDrafts) continue;
        const slug = data.slug || fileSlug;
        // ...
    }
    return posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
}
```

---

### `src/components/blog/BlogPostCard` (component — inline in blog index)

**Analog:** `src/components/blog/BlogPostCard.jsx`

**Card link + layout** (lines 8-12):

```jsx
<Link
    to={`/blog/${blog.id}`}
    className="flex h-full flex-col overflow-hidden rounded-lg bg-zinc-800 transition-colors hover:bg-zinc-700"
>
```

**Apply:** Astro `<a href={import.meta.env.BASE_URL + 'blog/' + slug + '/'}>`. Badge colors: violet categories, sky tags (lines 36-37, 56-57).

---

## Shared Patterns

### Site URL & canonical base
**Source:** `scripts/lib/site-config.mjs`
**Apply to:** `astro.config.mjs`, `BaseLayout.astro`, sitemap integration

```javascript
export const SITE = {
    url: (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://moyunzero.github.io/personalWeb').replace(/\/$/, ''),
    language: 'zh-CN',
    basePath: '/personalWeb',
};
```

### Frontmatter parsing (Notion-compatible)
**Source:** `src/blog/frontmatter.js`
**Apply to:** Content Collection loader, `load-posts.mjs`, any pre-build script

```javascript
const yamlBlock = normalizeFrontmatterYaml(match[1]);
const data = parseYaml(yamlBlock);
```

### Draft filtering in production
**Source:** `src/blog/loadPosts.js` + `scripts/lib/load-posts.mjs`
**Apply to:** `getCollection` filters, `getStaticPaths`

```javascript
if (draft && !includeDrafts) continue;
// browser: import.meta.env.PROD && post.draft → skip
```

### Asset path resolution
**Source:** `src/blog/utils.js` — `resolveBlogAsset`
**Apply to:** Blog list cards, detail cover/gallery, markdown images

### Sort & slug identity
**Source:** `src/blog/parsePost.js`
**Apply to:** All post listings

```javascript
const slug = data.slug || fileSlug;
const publishDate = normalizeDate(data.date || data.publishDate) || dateFromFileSlug(fileSlug);
```

### Dark theme Tailwind vocabulary
**Source:** `Blog.jsx`, `BlogDetail.jsx`, `BlogPostCard.jsx`
**Apply to:** All Phase 1 Astro pages

| Token | Classes |
|-------|---------|
| Page bg | `bg-zinc-900`, `bg-zinc-950` |
| Card | `bg-zinc-800`, `hover:bg-zinc-700` |
| Muted text | `text-zinc-400`, `text-zinc-500` |
| Accent | `text-sky-400`, `bg-sky-600` |
| Category badge | `bg-violet-500/10 text-violet-300` |
| Tag badge | `bg-sky-500/10 text-sky-300` |

### SEO meta (runtime → static)
**Source:** `src/hooks/useDocumentMeta.js`
**Apply to:** `BaseLayout.astro` — replace client `useEffect` with build-time `<title>` and `<meta>` tags

```javascript
document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/env.d.ts` | config | transform | No TypeScript/Astro setup in repo yet — use Astro default `astro add` output |
| BlogPosting JSON-LD block | layout fragment | transform | No JSON-LD in codebase; derive fields from `parsePost` + SITE config (D-11) |

**Planner fallback:** `docs/SEO-MIGRATION-DESIGN.md` §2 for SEO field list; Astro `@astrojs/sitemap` docs for sitemap replacement.

---

## Metadata

**Analog search scope:** `src/blog/`, `src/pages/Blog*.jsx`, `src/components/blog/`, `scripts/lib/`, `scripts/generate-static.mjs`, `public/404.html`, `index.html`, `vite.config.js`, `tailwind.config.js`, `package.json`, `.github/workflows/deploy.yml`, `docs/SEO-MIGRATION-DESIGN.md`
**Files scanned:** ~35
**Pattern extraction date:** 2026-06-21
