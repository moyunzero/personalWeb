# React islands

## Overview

Interactive UI loaded as Astro islands. Static markup stays in `.astro` files; anything needing React state, animation, or heavy client libs lives here with an explicit hydration directive on the parent page.

## Key files

| File | Owns |
|---|---|
| `HomeMotion.tsx` | GSAP scroll reveals (`client:idle`); keep in-view `.reveal-up` visible until GSAP is ready |
| `HomeHeader.tsx` | Mobile nav, anchor scroll |
| `ContactIsland.tsx` | Contact form interactivity (`client:visible`) |
| `CosmicStarfieldIsland.tsx` | Home solar system WebGL (`client:load` only; wins cold start bandwidth); module scope `import('three')`; WebGL probe falls back without performance caveat; hide `data-cosmos-fallback` when skeleton ready; progressive textures + async HDR via `solarSystemScene.ts`; listens for `spectacle:start` / `end` to pause explore |
| `cosmosHitTest.ts` / `solarSystemModel.ts` / `solarSystemScene.ts` | Explore hit test, Kepler packing, Three scene build/dispose |
| `StatusSpectacleIsland.tsx` | Home status rift + shark portal (`client:idle`); GSAP split; events `spectacle:start` / `end` |
| `spectacleModel.ts` / `spectacleScene.ts` | Portal sampling / phase helpers; Three portal shader + Pyjama Shark glTF |
| `MouseTrailIsland.tsx` | Mouse trail (`client:idle`) |
| `GameIsland.tsx` | Lazy Phaser game (`client:idle` start button; Phaser still on click); Phaser-only critical path with 90s timeout + retry; Chat/Tooltip after sprite; idle / pointerenter / focus warm Phaser |
| `BlogSearch.tsx` | Client side blog list filter |
| `MermaidHydrator.tsx` | Mermaid diagrams in posts |

## Conventions

- Pick hydration by cost: `client:visible` or `client:idle` for below the fold; `client:load` only when needed on first paint.
- Heavy libs (Phaser, GSAP, Three) must stay behind dynamic `import()` inside the island.
- Do not add new SPA routing. Islands enhance static pages only.
- Home cosmos: Astro `data-cosmos-fallback` (HDR poster) is always first paint; `index.astro` preloads poster only (no sun/HDR HTML prefetch: cold GitHub Pages bandwidth must go to `three.js` first). `CosmicStarfieldIsland` uses `client:load` and mounts before other home islands so `import('three')` is not starved by motion/spectacle/game; fades in after WebGL skeleton (fallback colors first, textures/HDR apply async); hide the poster when the skeleton is ready. WebGL init tries caveat free GL then plain WebGL so caveat GPUs still get planets. Background mounts via `HomeLayout` `background` slot (outside `z-10` content). Visual Kepler packing in `solarSystemModel.ts` must keep discs clear (incl. Saturn rings / highlight scale). Desktop zoom: Ctrl/Cmd + wheel only (persistent `zoomFactor`). Home hides native scrollbar (`html.home-cosmos-scroll`). Blog routes must not import cosmos modules or `threejs-assets/web/`. `ParticleIsland` is removed; do not reintroduce it.
- Home status spectacle: only on `index.astro` (`client:idle`). Status hit is a non button row (`data-status-spectacle-hit`); copy node `data-status-spectacle-copy`. Runtime glTF is `threejs-assets/web/spectacle/pyjama-shark/model.glb` only. Pair `spectacle:start` / `end` with cosmos lock; register cosmos listeners before async Three init. Blog must not import spectacle island or `web/spectacle/`.

## Agent skills

- [threejs-fundamentals](../../../.agents/skills/threejs-fundamentals/): scene, camera, renderer for home WebGL background
- [threejs-animation](../../../.agents/skills/threejs-animation/): idle drift / rAF loop patterns
- [threejs-interaction](../../../.agents/skills/threejs-interaction/): pointer orbit / zoom (advisory; review before copying)
- Pending install (GitHub timeout): `greensock/gsap-skills@gsap-core`, `greensock/gsap-skills@gsap-scrolltrigger`, `mengto/skills@cinematic-gsap-lenis-motion-system` for HomeMotion scroll and Lenis pairing

## Gotchas

- Home cold start: only cosmos is `client:load`; HomeMotion, StatusSpectacle, and GameIsland are `client:idle`. Do not reintroduce sun/HDR HTML prefetch or extra `client:load` peers that starve `three.js` on GitHub Pages. Lighthouse perf gate targets ≥ 0.85 and LCP ≤ 2500ms; keep poster as LCP.
- `GameIsland` sprite paths must use `import.meta.env.BASE_URL`. Mark GameIsland roots with `data-no-cosmos` so cosmos explore ignores them. On slow loads show retry instead of hanging on「忍者登场中…」.
- Chat uses `VITE_CHAT_API_URL` from env; URL is visible in the bundle.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
