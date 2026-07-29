# Blog Distinctiveness Redesign

**Date:** 2026-07-29  
**Status:** Approved for planning  
**Scope phase:** Visual re-layout only (Phase A)

## Problem

The home page has a memorable dark + sky/emerald + playful voice. The blog is a generic zinc card grid with violet/sky badges: functional, but brand-weak and visually disconnected from the home. List browsing and article reading share the same “card/prose default” energy, so neither side feels distinctive.

## Goals

1. **Browse (list / category):** Memorable structure via year rail + ledger rows (no featured strip).
2. **Read (article):** Quiet editorial opening + serif body, magazine-like but calm.
3. **Shared tokens:** Same dark canvas and sky accent as home; dual *rhythm*, not dual brand.
4. **Minimal risk:** No changes to routes, SEO fields, Notion sync, search algorithm, or related-posts logic.

### Non-goals (Phase A)

- Featured / “本月精选” strip
- Table of contents
- Blog header/footer brand overhaul aligned to home nav
- Restyling RelatedPosts into ledger
- Heavy motion, new client libraries, 3D / cosmos on blog
- New Content Collection fields or Notion property changes
- Lighthouse threshold changes

## Approach

**Blog visual layer + small components** (chosen over in-place class churn or a full layout fork).

Introduce focused Astro components and blog CSS tokens; pages assemble them. Keep `BlogSearch`, `getPublishedPosts`, `groupPostsByYear`, SEO, and Mermaid hydration as today.

## Visual language

| Token | Use |
|---|---|
| Canvas `zinc-900`, hairlines `zinc-800` | Surfaces and dividers |
| Accent `sky-400` | Active year, subtle date highlight |
| Category labels | Compact text tags (violet/sky semantics kept; no badge wall) |
| Montserrat + gradient `headline-*` | Page / article titles |
| Lora (already preloaded) | Ledger titles + article body |
| `ui-monospace` | Dates (`MM.DD`, `YYYY.MM.DD`) |

Dual rhythm:

- List/category → browsable (rail + ledger density)
- Article → quiet (editorial header + prose)

## List & category pages

### Structure (`/blog/`)

1. Page title (`headline-1`) + one-line blurb  
2. Category pills (existing links; unify active styles with category page)  
3. `BlogSearch` island (behavior unchanged; styles follow tokens)  
4. Main: `YearRail` (left) + year-grouped ledger (right)

### Components

| Component | Responsibility |
|---|---|
| `YearRail` | Years that have posts; current year highlighted; plain `#year-YYYY` anchor links (no new JS) |
| `LedgerRow` | Replaces list use of `BlogPostCard`: mono date, Lora title, one-line description, short category label; keeps `data-blog-search` JSON for client filter |
| Year sections | Existing `groupPostsByYear`; wrap with `id="year-YYYY"` and `data-blog-year` |

### Category page (`/blog/category/[id]/`)

Same ledger language. Show `YearRail` only when the filtered set spans multiple years; otherwise full-width ledger.

### Responsive

- **Mobile:** Year rail becomes a horizontal scroll chip row (still hash anchors). Ledger stacks to two rows: date+cat, then title+description.
- **Desktop:** Static left year rail + ledger columns as in brainstorm mockup (`list-layout-ac-no-featured`). Sticky rail is a follow-up, not Phase A.

### Cleanup

Retire list usage of `BlogPostCard`. Remove the component if unused elsewhere; do not leave two list UIs.

## Article page

### Editorial opening order

Replace cover → title → meta with:

1. Eyebrow: category label(s) · `YYYY.MM.DD` (mono, tracked)  
2. Title: `headline-2` (optional tighter `max-w` for editorial feel)  
3. Deck: `description` with left border + muted color (omit if empty)  
4. Cover image if present (full width, restrained radius)  
5. Secondary meta: author · read time (omit empties; do not repeat date from eyebrow)  
6. Body: `prose-blog` with Lora body; code blocks stay dark zinc / Shiki; Mermaid remains on-demand

### Component

`EditorialHeader` accepts `title`, `description`, `publishedAt`, `categories`, `author`, `readTime`, `coverImage`. Page owns markdown HTML + `RelatedPosts` + `MermaidHydrator`.

### Unchanged

`BlogLayout` chrome, RelatedPosts markup/algorithm, SEO/`SeoInput` wiring, draft filtering.

## Data flow

```text
getPublishedPosts / getCategories / groupPostsByYear
        → Astro pages
        → YearRail | LedgerRow | EditorialHeader
BlogSearch reads data-blog-search on LedgerRow (unchanged filterPosts semantics)
```

No new collection schema; no Notion sync changes.

## Edge cases

| Case | Behavior |
|---|---|
| Missing cover / description / readTime | Skip that block |
| Single-year category | Hide year rail |
| Empty categories on a post | Cat column empty or em dash; grid intact |
| Long titles | List `line-clamp-2`; article title uncapped |
| Search hides all posts in a year | Year section hidden via existing `data-blog-year` logic; rail links may point at hidden anchors — acceptable in Phase A |
| Drafts | Existing publish filter only |

## Testing

- Keep: `filterPosts`, SEO audit, related-posts unit tests, existing UAT gates  
- Add light coverage if helpers are extracted (date format for ledger / search payload shape)  
- Optional Playwright smoke: list shows rail + ledger row; article shows eyebrow + deck  
- Do not change Lighthouse thresholds in this phase  

## File touch map (expected)

- `src/components/blog/YearRail.astro` (new)  
- `src/components/blog/LedgerRow.astro` (new)  
- `src/components/blog/EditorialHeader.astro` (new)  
- `src/components/blog/BlogPostCard.astro` (remove or stop using)  
- `src/pages/blog/index.astro`, `category/[id].astro`, `[...slug].astro`  
- `src/styles/global.css` (blog tokens / `prose-blog` Lora)  
- `tailwind.config.js` only if `fontFamily.serif` needs explicit Lora  
- Tests under `tests/` as needed for helpers / smoke  

## Success criteria

1. `/blog/` reads as year-rail + ledger, not a 3-column card grid; no Featured strip.  
2. Article first screen reads as editorial opening (eyebrow → title → deck → optional cover).  
3. Category pages share list language; search still filters rows.  
4. SEO audit and existing unit tests still pass; no route or frontmatter schema change.  

## Open follow-ups (out of Phase A)

- Light motion (rail scrollspy, ledger hover)  
- Blog chrome alignment with home  
- RelatedPosts ledger restyle  
- TOC for long posts  
- Search ↔ year-rail active-state sync  

## Decision log

- Priority: reading (B) + browsing (C)  
- Tone: dual face, shared tokens  
- List: A+C hybrid, **no** Featured  
- Article: editorial opening (B), no TOC in Phase A  
- Implementation scope: visual re-layout only  
- Implementation style: blog visual layer + small components  
