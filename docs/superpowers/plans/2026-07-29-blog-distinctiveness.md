# Blog Distinctiveness Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the blog visually distinctive with a year-rail + ledger list and an editorial article opening, without changing routes, SEO, search logic, or related-posts.

**Architecture:** Add pure date/search helpers in `src/lib/blog.ts`, three Astro components (`YearRail`, `LedgerRow`, `EditorialHeader`), blog CSS tokens (Lora + ledger/rail utilities), then rewire list/category/article pages and delete `BlogPostCard`.

**Tech Stack:** Astro 5, Tailwind 3 + `@tailwindcss/typography`, existing React `BlogSearch` island, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-29-blog-distinctiveness-design.md`

## Global Constraints

- Phase A visual re-layout only — no Featured strip, no TOC, no BlogLayout chrome overhaul, no RelatedPosts restyle
- No new Content Collection fields; no Notion sync changes
- No search algorithm changes (`filterPosts` / `BlogSearch` behavior stays); keep `data-blog-search` on rows
- No new client libraries; YearRail uses plain `#year-YYYY` anchors only
- Do not change Lighthouse thresholds
- Dual rhythm: list browsable (rail + ledger); article quiet (editorial header + Lora prose)
- Tokens: `zinc-900` canvas, `sky-400` accent, Montserrat headlines, Lora for ledger titles + article body, `ui-monospace` dates
- Desktop year rail is **static** (not sticky); sticky is out of scope

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/blog.ts` | Add `formatLedgerDate`, `formatEditorialDate`, `buildBlogSearchPayload` |
| `tests/blog-format.test.ts` | Unit tests for those helpers |
| `src/styles/global.css` | `font-serif`/prose-blog Lora, ledger/rail utility classes |
| `tailwind.config.js` | Extend `fontFamily.serif` → Lora |
| `src/components/blog/YearRail.astro` | Year anchor nav |
| `src/components/blog/LedgerRow.astro` | One ledger link row + search payload |
| `src/components/blog/EditorialHeader.astro` | Article opening block |
| `src/pages/blog/index.astro` | Assemble rail + ledger |
| `src/pages/blog/category/[id].astro` | Same language; hide rail if single year |
| `src/pages/blog/[...slug].astro` | Use EditorialHeader |
| `src/components/blog/BlogPostCard.astro` | Delete after pages migrate |
| `tests/legacy-vite-spa-cleanup.test.ts` | Replace BlogPostCard keep-list entry with LedgerRow |
| `tests/legacy-spa-import-scan.test.ts` | Point “kept” Astro path at LedgerRow |
| `tests/eslint-expand.test.ts` | Point BlogPostCard.astro fixtures at LedgerRow.astro |

---

### Task 1: Date and search payload helpers

**Files:**
- Modify: `src/lib/blog.ts`
- Create: `tests/blog-format.test.ts`

**Interfaces:**
- Consumes: existing `formatPostDate` neighbors in `src/lib/blog.ts`
- Produces:
  - `formatLedgerDate(value: string): string` — `MM.DD` (zero-padded); invalid → original string
  - `formatEditorialDate(value: string): string` — `YYYY.MM.DD`; invalid → original string
  - `buildBlogSearchPayload(fields: { title: string; description?: string; tags?: string[] }): string` — `JSON.stringify` of `{ title, description: description ?? '', tags: tags ?? [] }`

- [ ] **Step 1: Write the failing test**

Create `tests/blog-format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
    formatLedgerDate,
    formatEditorialDate,
    buildBlogSearchPayload,
} from '../src/lib/blog';

describe('formatLedgerDate', () => {
    it('formats as MM.DD', () => {
        expect(formatLedgerDate('2026-07-22')).toBe('07.22');
        expect(formatLedgerDate('2026-01-05T12:00:00.000Z')).toMatch(/^\d{2}\.\d{2}$/);
    });

    it('returns original string when invalid', () => {
        expect(formatLedgerDate('not-a-date')).toBe('not-a-date');
    });
});

describe('formatEditorialDate', () => {
    it('formats as YYYY.MM.DD', () => {
        expect(formatEditorialDate('2026-07-22')).toBe('2026.07.22');
    });

    it('returns original string when invalid', () => {
        expect(formatEditorialDate('bad')).toBe('bad');
    });
});

describe('buildBlogSearchPayload', () => {
    it('stringifies title, description, tags with defaults', () => {
        const raw = buildBlogSearchPayload({ title: 'JWT' });
        expect(JSON.parse(raw)).toEqual({
            title: 'JWT',
            description: '',
            tags: [],
        });
    });

    it('preserves description and tags', () => {
        const raw = buildBlogSearchPayload({
            title: 'A',
            description: 'B',
            tags: ['css'],
        });
        expect(JSON.parse(raw)).toEqual({
            title: 'A',
            description: 'B',
            tags: ['css'],
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest --run tests/blog-format.test.ts`

Expected: FAIL — `formatLedgerDate` / `formatEditorialDate` / `buildBlogSearchPayload` not exported

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/blog.ts`:

```ts
function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

/** Ledger column date: MM.DD */
export function formatLedgerDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

/** Editorial eyebrow date: YYYY.MM.DD */
export function formatEditorialDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

export function buildBlogSearchPayload(fields: {
    title: string;
    description?: string;
    tags?: string[];
}): string {
    return JSON.stringify({
        title: fields.title,
        description: fields.description ?? '',
        tags: fields.tags ?? [],
    });
}
```

Note: `getMonth()` / `getDate()` use local timezone (same as existing `formatPostDate` via `toLocaleDateString`). Do not switch to UTC-only formatting unless tests in this repo already require it.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest --run tests/blog-format.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/blog.ts tests/blog-format.test.ts
git commit -m "feat(blog): add ledger and editorial date helpers"
```

---

### Task 2: Blog typography tokens

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: existing `.prose-blog`, `.headline-*`, Google Fonts Lora preload in `BaseLayout.astro`
- Produces: `font-serif` → Lora; `.prose-blog` uses serif body; utility classes `.blog-ledger-title`, `.blog-eyebrow` for components

- [ ] **Step 1: Extend Tailwind serif stack**

In `tailwind.config.js`, set:

```js
fontFamily: {
  sans: ['Montserrat', 'sans-serif'],
  serif: ['Lora', 'Georgia', 'serif'],
},
```

- [ ] **Step 2: Update global blog styles**

In `src/styles/global.css`, replace/extend `.prose-blog` and add utilities:

```css
.prose-blog {
  @apply prose prose-invert prose-lg max-w-none font-serif;
}

.prose-blog pre,
.prose-blog code {
  @apply font-sans;
}

.prose-blog pre {
  @apply bg-zinc-800 rounded-lg;
}

.prose-blog .mermaid-diagram-host svg,
.prose-blog .mermaid-diagram svg {
  @apply max-w-full h-auto;
}

.blog-ledger-title {
  @apply font-serif text-base text-zinc-50 sm:text-lg;
}

.blog-eyebrow {
  @apply font-mono text-xs uppercase tracking-[0.1em] text-sky-400;
}
```

Keep existing mermaid rules; merge rather than duplicate if already present.

- [ ] **Step 3: Sanity check (no visual regression gate)**

Run: `yarn vitest --run tests/blog-format.test.ts`

Expected: PASS (styles are CSS-only)

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js src/styles/global.css
git commit -m "style(blog): add Lora serif tokens for ledger and prose"
```

---

### Task 3: `LedgerRow` and `YearRail` components

**Files:**
- Create: `src/components/blog/LedgerRow.astro`
- Create: `src/components/blog/YearRail.astro`

**Interfaces:**
- Consumes: `formatLedgerDate`, `buildBlogSearchPayload` from `../../lib/blog`; `getCategoryLabel` from `../../blog/getCategories.js`
- Produces:
  - `LedgerRow` props: `{ slug, title, description?: string, publishedAt, categories?: string[], tags?: string[] }`
  - Root: `<a href="{base}blog/{slug}/" data-blog-search={payload} class="blog-ledger-row …">`
  - `YearRail` props: `{ years: number[], activeYear?: number }`
  - Links: `href="#year-{year}"`; active year uses `text-sky-400`

- [ ] **Step 1: Create `LedgerRow.astro`**

```astro
---
import { formatLedgerDate, buildBlogSearchPayload } from '../../lib/blog';
import { getCategoryLabel } from '../../blog/getCategories.js';

interface Props {
    slug: string;
    title: string;
    description?: string;
    publishedAt: string;
    categories?: string[];
    tags?: string[];
}

const {
    slug,
    title,
    description,
    publishedAt,
    categories = [],
    tags = [],
} = Astro.props;

const base = import.meta.env.BASE_URL;
const href = `${base}blog/${slug}/`;
const searchPayload = buildBlogSearchPayload({ title, description, tags });
const mmdd = formatLedgerDate(publishedAt);
const primaryCat = categories[0];
const catLabel = primaryCat ? getCategoryLabel(primaryCat) : '—';
---

<a
    href={href}
    data-blog-search={searchPayload}
    class="blog-ledger-row group grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1 border-b border-zinc-800/80 py-3 sm:grid-cols-[3.5rem_1fr_auto] sm:items-baseline"
>
    <time
        datetime={publishedAt}
        class="font-mono text-xs text-zinc-400 tabular-nums group-hover:text-sky-400 sm:text-sm"
    >
        {mmdd}
    </time>
    <span class="min-w-0">
        <span class="blog-ledger-title line-clamp-2 group-hover:text-white">
            {title}
        </span>
        {
            description ? (
                <span class="mt-1 line-clamp-1 block font-sans text-xs text-zinc-500 sm:text-sm">
                    {description}
                </span>
            ) : null
        }
    </span>
    <span class="col-start-2 font-sans text-xs text-zinc-500 sm:col-start-auto sm:justify-self-end">
        {catLabel}
    </span>
</a>
```

- [ ] **Step 2: Create `YearRail.astro`**

```astro
---
interface Props {
    years: number[];
    activeYear?: number;
}

const { years, activeYear } = Astro.props;
const current = activeYear ?? years[0];
---

<nav
    class="blog-year-rail flex gap-2 overflow-x-auto pb-2 sm:flex-col sm:overflow-visible sm:border-r sm:border-zinc-800 sm:pb-0 sm:pr-4"
    aria-label="按年份浏览"
>
    {
        years.map((year) => (
            <a
                href={`#year-${year}`}
                class:list={[
                    'shrink-0 rounded-full px-3 py-1 font-mono text-sm transition-colors sm:rounded-none sm:px-0 sm:py-2',
                    year === current
                        ? 'bg-zinc-800 text-sky-400 sm:bg-transparent'
                        : 'text-zinc-500 hover:text-zinc-200',
                ]}
            >
                {year}
            </a>
        ))
    }
</nav>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/LedgerRow.astro src/components/blog/YearRail.astro
git commit -m "feat(blog): add YearRail and LedgerRow components"
```

---

### Task 4: Wire blog index to rail + ledger

**Files:**
- Modify: `src/pages/blog/index.astro`

**Interfaces:**
- Consumes: `YearRail`, `LedgerRow`, existing `groupPostsByYear`, `BlogSearch`, `getCategories`
- Produces: sections with `id={`year-${year}`}` and `data-blog-year`; no `BlogPostCard`; no Featured strip

- [ ] **Step 1: Replace card grid with rail + ledger**

Full `src/pages/blog/index.astro`:

```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';
import LedgerRow from '../../components/blog/LedgerRow.astro';
import YearRail from '../../components/blog/YearRail.astro';
import BlogSearch from '../../components/islands/BlogSearch.tsx';
import { getPublishedPosts } from '../../lib/blog';
import { groupPostsByYear } from '../../lib/posts';
import { getCategories } from '../../blog/getCategories.js';
import { SITE } from '../../lib/site';

const posts = await getPublishedPosts();
const yearGroups = groupPostsByYear(posts);
const years = yearGroups.map((g) => g.year).filter((y) => y > 0);
const categories = getCategories();
const base = import.meta.env.BASE_URL;
---

<BlogLayout
    seo={{
        title: `${SITE.title}`,
        description: SITE.description,
        path: '/blog/',
    }}
>
    <div class="mb-10">
        <h1 class="headline-1 mb-4">博客</h1>
        <p class="mb-6 max-w-2xl text-zinc-400">
            技术文章、阅读笔记与开发实践。
        </p>
        <nav class="flex flex-wrap gap-2 text-sm">
            <a
                href={`${base}blog/`}
                class="rounded-full bg-zinc-800 px-3 py-1 text-zinc-200"
            >
                全部
            </a>
            {
                categories.map(({ id, label }) => (
                    <a
                        href={`${base}blog/category/${id}/`}
                        class="rounded-full px-3 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                        {label}
                    </a>
                ))
            }
        </nav>
    </div>
    <BlogSearch client:load totalCount={posts.length} />
    <div id="blog-post-list" class="flex flex-col gap-8 sm:flex-row sm:gap-10">
        {
            years.length > 0 ? (
                <aside class="sm:w-16 sm:shrink-0">
                    <YearRail years={years} activeYear={years[0]} />
                </aside>
            ) : null
        }
        <div class="min-w-0 flex-1">
            {
                yearGroups.map(({ year, posts: yearPosts }) => (
                    <section
                        class="mb-12"
                        id={year > 0 ? `year-${year}` : undefined}
                        data-blog-year
                    >
                        <h2 class="mb-4 font-mono text-sm text-zinc-500">
                            {year > 0 ? `${year} · ${yearPosts.length} 篇` : '未知日期'}
                        </h2>
                        <div>
                            {yearPosts.map((post) => (
                                <LedgerRow
                                    slug={post.data.slug}
                                    title={post.data.title}
                                    description={post.data.description}
                                    publishedAt={post.data.publishedAt}
                                    categories={post.data.categories}
                                    tags={post.data.tags}
                                />
                            ))}
                        </div>
                    </section>
                ))
            }
        </div>
    </div>
    <p id="blog-post-list-empty" class="!hidden py-12 text-center text-zinc-500">
        没有符合搜索条件的文章，试试其他关键词。
    </p>
</BlogLayout>
```

- [ ] **Step 2: Run unit tests that do not need dist**

Run: `yarn vitest --run tests/blog-format.test.ts tests/filter-posts.test.ts tests/home-status-spectacle.test.ts tests/cosmic-starfield-island.test.ts`

Expected: PASS (blog index still must not import cosmos/spectacle)

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat(blog): render index as year rail and ledger"
```

---

### Task 5: Wire category page; remove `BlogPostCard`

**Files:**
- Modify: `src/pages/blog/category/[id].astro`
- Delete: `src/components/blog/BlogPostCard.astro`
- Modify: `tests/legacy-vite-spa-cleanup.test.ts`
- Modify: `tests/legacy-spa-import-scan.test.ts`
- Modify: `tests/eslint-expand.test.ts`

**Interfaces:**
- Consumes: `groupPostsByYear`, `YearRail`, `LedgerRow`
- Produces: YearRail only when `years.length > 1`; category active pill uses `bg-sky-500/20 text-sky-300` (existing)

- [ ] **Step 1: Rewrite category page**

Full `src/pages/blog/category/[id].astro`:

```astro
---
import BlogLayout from '../../../layouts/BlogLayout.astro';
import LedgerRow from '../../../components/blog/LedgerRow.astro';
import YearRail from '../../../components/blog/YearRail.astro';
import BlogSearch from '../../../components/islands/BlogSearch.tsx';
import { getCategories } from '../../../blog/getCategories.js';
import { getPublishedPosts } from '../../../lib/blog';
import { groupPostsByYear } from '../../../lib/posts';
import { SITE } from '../../../lib/site';

export async function getStaticPaths() {
    const categories = getCategories();
    const posts = await getPublishedPosts();

    return categories.map(({ id, label }) => ({
        params: { id },
        props: {
            category: { id, label },
            posts: posts.filter((p) => p.data.categories?.includes(id)),
        },
    }));
}

const { category, posts } = Astro.props;
const base = import.meta.env.BASE_URL;
const yearGroups = groupPostsByYear(posts);
const years = yearGroups.map((g) => g.year).filter((y) => y > 0);
const showRail = years.length > 1;
---

<BlogLayout
    seo={{
        title: `${category.label} · 博客 · ${SITE.name}`,
        description: `${category.label}分类下的技术文章与笔记 — ${SITE.name}`,
        path: `/blog/category/${category.id}/`,
    }}
>
    <div class="mb-10">
        <nav class="mb-6 flex flex-wrap gap-2 text-sm">
            <a
                href={`${base}blog/`}
                class="rounded-full px-3 py-1 text-zinc-400 transition-colors hover:text-zinc-200"
            >
                全部
            </a>
            {
                getCategories().map(({ id, label }) => (
                    <a
                        href={`${base}blog/category/${id}/`}
                        class:list={[
                            'rounded-full px-3 py-1 transition-colors',
                            id === category.id
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'text-zinc-400 hover:text-zinc-200',
                        ]}
                    >
                        {label}
                    </a>
                ))
            }
        </nav>
        <h1 class="headline-1 mb-2">{category.label}</h1>
        <p class="text-zinc-400">
            {posts.length} 篇文章
            <span class="mx-2" aria-hidden="true">·</span>
            <a
                href={`${base}blog/`}
                class="text-zinc-500 hover:text-zinc-300"
            >
                返回博客
            </a>
        </p>
    </div>
    {
        posts.length > 0 ? (
            <>
                <BlogSearch client:load totalCount={posts.length} />
                <div
                    id="blog-post-list"
                    class:list={[
                        'flex flex-col gap-8 sm:gap-10',
                        showRail ? 'sm:flex-row' : null,
                    ]}
                >
                    {
                        showRail ? (
                            <aside class="sm:w-16 sm:shrink-0">
                                <YearRail years={years} activeYear={years[0]} />
                            </aside>
                        ) : null
                    }
                    <div class="min-w-0 flex-1">
                        {
                            yearGroups.map(({ year, posts: yearPosts }) => (
                                <section
                                    class="mb-12"
                                    id={
                                        showRail && year > 0
                                            ? `year-${year}`
                                            : undefined
                                    }
                                    data-blog-year
                                >
                                    {
                                        showRail ? (
                                            <h2 class="mb-4 font-mono text-sm text-zinc-500">
                                                {year > 0
                                                    ? `${year} · ${yearPosts.length} 篇`
                                                    : '未知日期'}
                                            </h2>
                                        ) : null
                                    }
                                    <div>
                                        {yearPosts.map((post) => (
                                            <LedgerRow
                                                slug={post.data.slug}
                                                title={post.data.title}
                                                description={post.data.description}
                                                publishedAt={post.data.publishedAt}
                                                categories={post.data.categories}
                                                tags={post.data.tags}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))
                        }
                    </div>
                </div>
                <p
                    id="blog-post-list-empty"
                    class="!hidden py-12 text-center text-zinc-500"
                >
                    没有符合搜索条件的文章，试试其他关键词。
                </p>
            </>
        ) : (
            <p class="text-zinc-500">该分类下暂无文章。</p>
        )
    }
</BlogLayout>
```

- [ ] **Step 2: Delete `BlogPostCard.astro`**

```bash
rm src/components/blog/BlogPostCard.astro
```

- [ ] **Step 3: Update legacy keep-list tests**

In `tests/legacy-vite-spa-cleanup.test.ts`, replace the keep entry:

- From: `'src/components/blog/BlogPostCard.astro'`
- To: `'src/components/blog/LedgerRow.astro'`

In `tests/legacy-spa-import-scan.test.ts`, update the resolve fixtures:

```ts
const importer = 'src/pages/blog/index.astro';
const kept = resolveToRepoPath(importer, '../../components/blog/LedgerRow.astro');
const banned = resolveToRepoPath(importer, '../../components/blog/BlogPostCard.jsx');
expect(kept).toBe('src/components/blog/LedgerRow.astro');
expect(banned).toBe('src/components/blog/BlogPostCard.jsx');
```

In `tests/eslint-expand.test.ts`, make the same path swaps wherever `BlogPostCard.astro` is the “kept” Astro file (including ESLint fixture `code` import and `runEslint('src/components/blog/BlogPostCard.astro')` → `LedgerRow.astro`). Leave any references to deleted SPA `BlogPostCard.jsx` as banned legacy paths.

- [ ] **Step 4: Run affected tests**

Run:

```bash
yarn vitest --run \
  tests/legacy-vite-spa-cleanup.test.ts \
  tests/legacy-spa-import-scan.test.ts \
  tests/eslint-expand.test.ts \
  tests/blog-format.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/blog/category/[id].astro \
  tests/legacy-vite-spa-cleanup.test.ts \
  tests/legacy-spa-import-scan.test.ts \
  tests/eslint-expand.test.ts
git add -u src/components/blog/BlogPostCard.astro
git commit -m "feat(blog): ledger category pages and remove BlogPostCard"
```

---

### Task 6: `EditorialHeader` and article page

**Files:**
- Create: `src/components/blog/EditorialHeader.astro`
- Modify: `src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `formatEditorialDate` from `../../lib/blog`; `getCategoryLabel` from `../../blog/getCategories.js`
- Produces: props `{ title, description?: string, publishedAt, categories?: string[], author?: string, readTime?: number, coverImage?: string }`
- Order: eyebrow → title → deck → cover → secondary meta (author · read time only)

- [ ] **Step 1: Create `EditorialHeader.astro`**

```astro
---
import { formatEditorialDate } from '../../lib/blog';
import { getCategoryLabel } from '../../blog/getCategories.js';

interface Props {
    title: string;
    description?: string;
    publishedAt: string;
    categories?: string[];
    author?: string;
    readTime?: number;
    coverImage?: string;
}

const {
    title,
    description,
    publishedAt,
    categories = [],
    author,
    readTime,
    coverImage,
} = Astro.props;

const base = import.meta.env.BASE_URL;
const dateLabel = formatEditorialDate(publishedAt);
const catParts = categories.map((id) => getCategoryLabel(id));
---

<header class="mb-10">
    <p class="blog-eyebrow mb-4">
        {
            catParts.length > 0 ? (
                <>
                    {catParts.map((label, i) => (
                        <>
                            {i > 0 ? <span aria-hidden="true"> · </span> : null}
                            <a
                                href={`${base}blog/category/${categories[i]}/`}
                                class="hover:text-sky-300"
                            >
                                {label}
                            </a>
                        </>
                    ))}
                    <span aria-hidden="true"> · </span>
                </>
            ) : null
        }
        <time datetime={publishedAt}>{dateLabel}</time>
    </p>
    <h1 class="headline-2 mb-4 max-w-[18ch] sm:max-w-[22ch]">{title}</h1>
    {
        description ? (
            <p class="mb-8 max-w-2xl border-l-2 border-zinc-700 pl-4 font-sans text-lg text-zinc-400">
                {description}
            </p>
        ) : null
    }
    {
        coverImage ? (
            <img
                src={coverImage}
                alt=""
                class="mb-8 w-full rounded-md object-cover"
            />
        ) : null
    }
    {
        author || readTime ? (
            <div class="flex flex-wrap items-center gap-3 font-sans text-sm text-zinc-500">
                {author ? <span>{author}</span> : null}
                {author && readTime ? (
                    <span aria-hidden="true">·</span>
                ) : null}
                {readTime ? <span>{readTime} 分钟阅读</span> : null}
            </div>
        ) : null
    }
</header>
```

- [ ] **Step 2: Simplify `[...slug].astro` article body**

Replace the article header/cover block with:

```astro
---
import { getCollection } from 'astro:content';
import BlogLayout from '../../layouts/BlogLayout.astro';
import RelatedPosts from '../../components/blog/RelatedPosts.astro';
import EditorialHeader from '../../components/blog/EditorialHeader.astro';
import { getPublishedPosts } from '../../lib/blog';
import { getRelatedForEntry } from '../../lib/related';
import { renderMarkdown } from '../../lib/markdown';
import { SITE } from '../../lib/site';
import MermaidHydrator from '../../components/islands/MermaidHydrator';

export async function getStaticPaths() {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    return posts.map((post) => ({
        params: { slug: post.data.slug },
        props: { post },
    }));
}

const { post } = Astro.props;
const { data, body } = post;
const html = await renderMarkdown(body);
const allPosts = await getPublishedPosts();
const related = getRelatedForEntry(post, allPosts, 3);
const hasMermaid = html.includes('mermaid-diagram-host');
---

<BlogLayout
    seo={{
        title: `${data.title} · ${SITE.name}`,
        description: data.description,
        path: `/blog/${data.slug}/`,
        canonical: data.canonical,
        ogImage: data.ogImage ?? data.coverImage,
        noindex: data.noindex,
        type: 'article',
        publishedAt: data.publishedAt,
        updatedAt: data.updatedAt,
        keywords: data.keywords,
    }}
>
    <article class="mx-auto max-w-3xl">
        <EditorialHeader
            title={data.title}
            description={data.description}
            publishedAt={data.publishedAt}
            categories={data.categories}
            author={data.author}
            readTime={data.readTime}
            coverImage={data.coverImage}
        />
        <div class="prose-blog" set:html={html} />
    </article>
    <RelatedPosts heading={related.heading} posts={related.posts} />
    {hasMermaid ? <MermaidHydrator client:idle /> : null}
</BlogLayout>
```

Do not change SEO props, RelatedPosts, or Mermaid gating.

- [ ] **Step 3: Run focused unit tests**

Run: `yarn vitest --run tests/blog-format.test.ts tests/related-posts.test.ts tests/home-status-spectacle.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/blog/EditorialHeader.astro src/pages/blog/[...slug].astro
git commit -m "feat(blog): editorial article opening header"
```

---

### Task 7: Build verification and smoke checks

**Files:**
- None required unless build reveals fixes
- Optional assert via dist grep (no new Playwright file required in Phase A)

**Interfaces:**
- Consumes: full static build
- Produces: confirmation that list HTML contains `blog-year-rail` / `data-blog-search`, article HTML contains `blog-eyebrow`

- [ ] **Step 1: Run unit suite subset + lint on touched paths**

Run:

```bash
yarn vitest --run tests/blog-format.test.ts tests/filter-posts.test.ts \
  tests/related-posts.test.ts tests/legacy-vite-spa-cleanup.test.ts \
  tests/legacy-spa-import-scan.test.ts tests/eslint-expand.test.ts \
  tests/home-status-spectacle.test.ts tests/cosmic-starfield-island.test.ts
yarn eslint src/lib/blog.ts src/components/blog src/pages/blog src/styles/global.css
```

Expected: tests PASS; eslint clean (or only pre-existing unrelated warnings)

- [ ] **Step 2: Production build**

Run: `yarn build`

Expected: exit 0 (includes `seo:audit`)

- [ ] **Step 3: Dist smoke (shell)**

Run:

```bash
rg -n "blog-year-rail|blog-ledger-row|blog-eyebrow|BlogPostCard" dist/blog/index.html dist/blog/*/index.html | head -40
```

Expected:
- `blog-year-rail` present on blog index
- `blog-ledger-row` or ledger markup / `data-blog-search` present
- `blog-eyebrow` present on at least one post HTML
- **no** `BlogPostCard` string in dist

- [ ] **Step 4: Final commit only if Step 3 required fixes**

If fixes were needed:

```bash
git add -A
git commit -m "fix(blog): address distinctiveness build smoke gaps"
```

If no fixes, skip commit.

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Year rail + ledger list, no Featured | 3, 4 |
| Category same language; hide rail if single year | 5 |
| Editorial opening order | 6 |
| Lora + shared tokens | 2 |
| Keep search payload / BlogSearch | 1, 3, 4 |
| Remove BlogPostCard dual UI | 5 |
| No SEO/route/Notion/related changes | 4–6 (explicit non-touch) |
| Helper tests | 1 |
| Build + audit still pass | 7 |
| Update tests that required BlogPostCard.astro | 5 |

## Placeholder / consistency self-review

- No TBD/TODO left in tasks
- Helper names consistent: `formatLedgerDate`, `formatEditorialDate`, `buildBlogSearchPayload`
- Component prop names match page wiring
- Legacy tests updated when deleting `BlogPostCard.astro`
