# React islands

## Overview

Interactive UI loaded as Astro islands. Static markup stays in `.astro` files; anything needing React state, animation, or heavy client libs lives here with an explicit hydration directive on the parent page.

## Key files

| File | Owns |
|---|---|
| `HomeMotion.tsx` | GSAP scroll reveals (`client:load`) |
| `HomeHeader.tsx` | Mobile nav, anchor scroll |
| `ContactIsland.tsx` | Contact form interactivity (`client:visible`) |
| `CosmicStarfieldIsland.tsx` | Home solar system WebGL (`client:visible`); module scope `import('three')`; progressive textures + async HDR via `solarSystemScene.ts` |
| `cosmosHitTest.ts` / `solarSystemModel.ts` / `solarSystemScene.ts` | Explore hit test, Kepler packing, Three scene build/dispose |
| `MouseTrailIsland.tsx` | Mouse trail (`client:idle`) |
| `GameIsland.tsx` | Lazy Phaser game (`client:visible`); Chat/Tooltip dynamic import on start; pointerenter/focus prefetches Phaser |
| `BlogSearch.tsx` | Client side blog list filter |
| `MermaidHydrator.tsx` | Mermaid diagrams in posts |

## Conventions

- Pick hydration by cost: `client:visible` or `client:idle` for below the fold; `client:load` only when needed on first paint.
- Heavy libs (Phaser, GSAP, Three) must stay behind dynamic `import()` inside the island.
- Do not add new SPA routing. Islands enhance static pages only.
- Home cosmos: Astro `data-cosmos-fallback` (HDR poster) is always first paint; `index.astro` preloads poster and prefetches HDR/sun; `CosmicStarfieldIsland` fades in after WebGL skeleton (fallback colors first, textures/HDR apply async). Background mounts via `HomeLayout` `background` slot (outside `z-10` content). Visual Kepler packing in `solarSystemModel.ts` must keep discs clear (incl. Saturn rings / highlight scale). Desktop zoom: Ctrl/Cmd + wheel only (persistent `zoomFactor`). Home hides native scrollbar (`html.home-cosmos-scroll`). Blog routes must not import cosmos modules or `threejs-assets/web/`. `ParticleIsland` is removed; do not reintroduce it.

## Agent skills

- [threejs-fundamentals](../../../.agents/skills/threejs-fundamentals/): scene, camera, renderer for home WebGL background
- [threejs-animation](../../../.agents/skills/threejs-animation/): idle drift / rAF loop patterns
- [threejs-interaction](../../../.agents/skills/threejs-interaction/): pointer orbit / zoom (advisory; review before copying)
- Pending install (GitHub timeout): `greensock/gsap-skills@gsap-core`, `greensock/gsap-skills@gsap-scrolltrigger`, `mengto/skills@cinematic-gsap-lenis-motion-system` for HomeMotion scroll and Lenis pairing

## Gotchas

- Home page has several `client:load` / `client:visible` islands. Lighthouse perf gate targets ≥ 0.85 and LCP ≤ 2500ms.
- `GameIsland` sprite paths must use `import.meta.env.BASE_URL`. Mark GameIsland roots with `data-no-cosmos` so cosmos explore ignores them.
- Chat uses `VITE_CHAT_API_URL` from env; URL is visible in the bundle.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
