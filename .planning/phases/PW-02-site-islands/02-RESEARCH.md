# Phase 2: 整站页面与交互岛 - Research

**Researched:** 2026-06-21
**Domain:** Astro React islands + GSAP/Lenis/Phaser on static homepage
**Confidence:** HIGH

## Summary

Phase 2 replaces the placeholder `index.astro` with a full static homepage mirroring `src/components/home/*`, then hydrates motion via React islands. Astro 5 already has `@astrojs/react` wired (Phase 1). Use `client:visible` for GSAP/Lenis/ambient effects and a dedicated `GameIsland` with click-gated `import('phaser')` (existing pattern in `PhaserGame.jsx`).

**Primary recommendation:** `HomeLayout.astro` + static section markup in `index.astro` + `HomeMotion.tsx` (`client:visible`) + `GameIsland.tsx` (click → dynamic import). Extend `seo.ts` for `WebSite`/`Person` JSON-LD. Add `featured` to posts loader schema for OPT-05. Cleanup Vite SPA entry in plan 03.

## Standard Stack

| Need | Choice | Notes |
|------|--------|-------|
| Islands | `@astrojs/react` | Already installed |
| GSAP | `gsap` + `@gsap/react` | Reuse `_Home.jsx` ScrollTrigger pattern |
| Smooth scroll | `@studio-freight/lenis` | From `useScrollToTop.js` |
| Game | `phaser` dynamic import | ~1MB chunk; gate on user click |
| Home data | `src/data/*.js` | projects, about, skills |
| Featured posts | `getCollection('posts')` | Add `featured` to loader + filter at build |

## Astro Island Patterns

```astro
<!-- HomeMotion: defer until visible -->
<HomeMotion client:visible />

<!-- GameIsland: no Phaser until click -->
<GameIsland client:only="react" />
```

**`client:visible`** — GSAP/Lenis/ParticleCanvas load when home enters viewport; acceptable for below-fold animations if hero is static HTML first.

**Phaser gating** — Do NOT import Phaser in module top-level. Pattern from `PhaserGame.jsx`:

```javascript
const [{ default: Phaser }, { default: GameScene }] = await Promise.all([
  import('phaser'),
  import('../game/scenes/GameScene'),
]);
```

Mount canvas only after click; show placeholder + GameTooltip until then.

## SEO-03 / OPT-05 / OPT-06

- **WebSite + Person JSON-LD** on home via `personJsonLd()` + existing `websiteJsonLd()` in `BaseLayout` seo prop
- **Featured 3 posts:** `getPublishedPosts()` → filter `data.featured` → slice/fill to 3 → static `<a href={base}blog/{slug}/">` with title + description anchor text
- **Projects:** extend `projects.js` with `description`; render in `ProjectCard` as visible text + `data-seo` or JSON-LD `ItemList`/`CreativeWork`

## Phase 1 Handoff Constraints

- Single `yarn build` → `astro build` only (D-01)
- Blog routes stay Astro; do not reintroduce `react-router-dom` for blog
- `BlogLayout` vs `HomeLayout` — blog pages should not load Phaser/Chat islands
- `trailingSlash: 'always'` — all internal links use `import.meta.env.BASE_URL`

## Cleanup Scope

| Artifact | Action |
|----------|--------|
| `index.html` + `src/main.jsx` | Remove from production path; Astro is entry |
| `BlogEditor.jsx` + route | Delete component; no `/blog/editor` page |
| `vite.config.js` | Keep for reference or remove in 02-03 if unused |
| `_Home.jsx`, `_Blog.jsx` | Delete after Astro parity or keep until 02-03 |

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Separate portfolio/about routes? | No — home sections `#work` / `#about` |
| Chat island? | Deferred (D-22) |
| Blog visual parity? | Optional; not blocking Phase 2 success criteria |

## Sources

- [Astro client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives) — HIGH
- Existing `PhaserGame.jsx`, `_Home.jsx`, `MainLayout.jsx` — HIGH
- `docs/SEO-MIGRATION-DESIGN.md` §3 — HIGH
