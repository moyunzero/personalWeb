# Phase 2: 整站页面与交互岛 - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 15 targets
**Analogs found:** 14 / 15

## File Classification

| New/Modified File | Role | Closest Analog | Match Quality |
|-------------------|------|----------------|---------------|
| `src/pages/index.astro` | route (SSG) | placeholder `index.astro` + `_Home.jsx` sections | exact |
| `src/layouts/HomeLayout.astro` | layout | `MainLayout.jsx` (non-blog chrome) | exact |
| `src/components/islands/HomeMotion.tsx` | island | `_Home.jsx` + `useScrollToTop.js` | exact |
| `src/components/islands/GameIsland.tsx` | island | `PhaserGame.jsx` + `GameTooltip.jsx` | exact |
| `src/components/home/*.astro` | UI | `src/components/home/*.jsx` | exact |
| `src/lib/seo.ts` | utility | existing `seo.ts` + `useDocumentMeta.js` | partial |
| `src/lib/featured.ts` | utility | `getFeaturedPosts.js` + `getPublishedPosts` | exact |
| `src/data/projects.js` | data | `projects.js` | exact |
| `index.html` / `main.jsx` | legacy | Vite SPA entry | delete target |

## Pattern Assignments

### Home static + islands split

**Analog:** Astro docs — static HTML first, islands second.

Hero/About/Work markup in `.astro` for SEO; `reveal-up` classes preserved for GSAP targets in HomeMotion.

### Phaser click-gate

**Analog:** `src/game/PhaserGame.jsx` lines 18-56 — dynamic import, RESIZE scale, destroy on unmount.

**Change:** mount only after click; initial UI = tooltip/placeholder.

### Featured posts on home

**Analog:** `_Blog.jsx` featured section + `getFeaturedPosts.js`

```typescript
const featured = posts.filter(p => p.data.featured);
const picks = featured.length >= 3 ? featured.slice(0, 3) : [...featured, ...rest].slice(0, 3);
```

### Project SEO (OPT-06)

Add `description` to each project; render in card + optional JSON-LD `ItemList` on home.
