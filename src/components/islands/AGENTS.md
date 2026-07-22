# React islands

## Overview

Interactive UI loaded as Astro islands. Static markup stays in `.astro` files; anything needing React state, animation, or heavy client libs lives here with an explicit hydration directive on the parent page.

## Key files

| File | Owns |
|---|---|
| `HomeMotion.tsx` | GSAP scroll reveals (`client:load`) |
| `HomeHeader.tsx` | Mobile nav, anchor scroll |
| `ContactIsland.tsx` | Contact form interactivity (`client:visible`) |
| `CosmicStarfieldIsland.tsx` / `MouseTrailIsland.tsx` | Home cosmos WebGL + mouse trail (`client:visible` / `client:idle`) |
| `GameIsland.tsx` | Lazy Phaser game (`client:only="react"`) |
| `BlogSearch.tsx` | Client side blog list filter |
| `MermaidHydrator.tsx` | Mermaid diagrams in posts |

## Conventions

- Pick hydration by cost: `client:visible` or `client:idle` for below the fold; `client:load` only when needed on first paint.
- Heavy libs (Phaser, GSAP, Three) must stay behind dynamic `import()` inside the island.
- Do not add new SPA routing. Islands enhance static pages only.
- Home cosmos: Astro `data-cosmos-fallback` is always first paint; `CosmicStarfieldIsland` only upgrades after WebGL init. Background mounts via `HomeLayout` `background` slot (outside `z-10` content). Desktop zoom: Ctrl/Cmd + wheel only. Home hides native scrollbar (`html.home-cosmos-scroll` in `index.css`). Blog routes must not import it.

## Agent skills

- [threejs-fundamentals](../../../.agents/skills/threejs-fundamentals/): scene, camera, renderer for home WebGL background
- [threejs-animation](../../../.agents/skills/threejs-animation/): idle drift / rAF loop patterns
- [threejs-interaction](../../../.agents/skills/threejs-interaction/): pointer orbit / zoom (advisory; review before copying)
- Pending install (GitHub timeout): `greensock/gsap-skills@gsap-core`, `greensock/gsap-skills@gsap-scrolltrigger`, `mengto/skills@cinematic-gsap-lenis-motion-system` for HomeMotion scroll and Lenis pairing

## Gotchas

- Home page has several `client:load` / `client:only` islands. Lighthouse perf gate targets ≥ 0.85 and LCP ≤ 2500ms.
- `GameIsland` sprite paths must use `import.meta.env.BASE_URL`. Mark GameIsland roots with `data-no-cosmos` so cosmos explore ignores them.
- Chat uses `VITE_CHAT_API_URL` from env; URL is visible in the bundle.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
