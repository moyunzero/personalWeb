# Scope: 墨韵 · 个人网站

Personal portfolio and blog site for 墨韵. Astro static site with React islands, deployed on GitHub Pages.

**Build approach:** Tracer Bullet (thin vertical slices end to end through every layer).
**Workflow:** Medium (after develop: check verify, then test).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Remove legacy Vite SPA | Cleanup | done |
| 2 | CI guard against legacy imports | Hardening | done |
| 3 | Cosmic starfield home background | Experience | done |
| 4 | Expand ESLint to TypeScript and Astro | Hardening | done |
| 5 | Home status rift and beast spectacle | Experience | done |

## Cleanup

### 1. Remove legacy Vite SPA · done
Delete the unused Vite SPA path so the repo has one production front end (Astro pages and React islands). Keep shared chat and game island code.
**Done when:** legacy SPA entry, duplicate JSX trees, and SPA only helpers are gone; SPA only packages are removed; `yarn build`, `yarn test`, and preview smoke for home, blog list, and one post detail all pass.
- [x] Design it (spec): `/architect remove legacy Vite SPA`
- [x] Build it: `/develop remove legacy Vite SPA`
   - [x] Delete legacy files per frozen matrix (AC-1, AC-2, AC-3)
   - [x] Strip ChatBubble PropTypes, drop SPA deps, update Tailwind globs (AC-4, AC-5)
   - [x] Validate build, tests, frozen lockfile install, and preview smoke (AC-6, AC-7)
- [x] Verify it: `/check verify remove legacy Vite SPA`
- [x] Test it: `/test remove legacy Vite SPA`
Spec [0001](../specs/0001-remove-legacy-vite-spa.md)

## Hardening

### 2. CI guard against legacy imports · done
Block new imports from removed SPA paths so the cleanup cannot quietly regress.
**Done when:** CI fails on a PR that reintroduces imports from deleted legacy SPA entry points or duplicate trees; green PRs still pass.
- [x] Design it (spec): `/architect CI guard against legacy imports`
- [x] Build it: `/develop CI guard against legacy imports`
   - [x] Shared banned list fixture from 0001 matrix (AC-1)
   - [x] Refactor cleanup tests onto the shared list (AC-1, AC-2, AC-3)
   - [x] Import scan with resolve rules across src, scripts, and tests (AC-4, AC-5)
   - [x] Add `ci.yml` for PR and push; keep Deploy deploy only (AC-6, AC-7, AC-8)
   - code in `tests/fixtures/legacy-spa-paths.ts`, `tests/legacy-spa-import-scan.test.ts`, `tests/legacy-vite-spa-cleanup.test.ts`, `.github/workflows/ci.yml`
- [x] Verify it: `/check verify CI guard against legacy imports`
- [x] Test it: `/test CI guard against legacy imports`
Spec [0002](../specs/0002-ci-guard-against-legacy-imports.md)

### 4. Expand ESLint to TypeScript and Astro · done
Extend lint to `.ts`, `.tsx`, and `.astro`, and mirror the legacy SPA ban list in the editor so bad imports show up before CI, alongside the existing import scan tests.
**Done when:** `yarn lint` covers TS/Astro without noisy false positives; banned legacy SPA paths are restricted in ESLint; contributors get editor feedback that matches the CI import guard.
- [x] Design it (spec): `/architect Expand ESLint to TypeScript and Astro`
- [x] Build it: `/develop Expand ESLint to TypeScript and Astro`
   - [x] Shared banned list + guard helpers (`scripts/lib/`, AC-5, AC-8)
   - [x] TS/TSX/Astro flat config + dependencies (AC-1–AC-3)
   - [x] AST legacy import rule + baseline lint green (AC-4, AC-6, AC-9)
   - [x] CI lint step after build (AC-7)
   - code in `scripts/lib/legacy-spa-paths.mjs`, `scripts/lib/legacy-spa-import-guard.mjs`, `eslint-rules/no-legacy-spa-imports.mjs`, `eslint.config.js`, `.github/workflows/ci.yml`, `tests/fixtures/legacy-spa-paths.ts`, `tests/lib/legacy-spa-import-scan.ts`
- [x] Verify it: `/check verify Expand ESLint to TypeScript and Astro`
- [x] Test it: `/test Expand ESLint to TypeScript and Astro`
Spec [0004](../specs/0004-expand-eslint-typescript-astro.md)

## Experience

### 3. Cosmic starfield home background · done · Full
Replace the home page 2D `ParticleIsland` with an immersive cosmos: optimized blue-nebula HDR sky, a procedural sun, and eight planets on a scaled Kepler model that auto-advances; scroll shifts camera focus by section narrative; keep explore UX, fallbacks, and blog exclusion.
**Done when:** home shows HDR + sun + eight moving planets with section focus mapping; visitors can drag and Ctrl/Cmd-zoom without breaking page scroll; reduced motion and weak devices get poster/CSS fallback; blog routes stay free of the 3D island and planet assets; web derivative textures stay within budget; Full pipeline (verify, test, review, document) and Lighthouse floors pass.
- [x] Design it (spec): `/architect Cosmic starfield home background`
- [x] Build it: `/develop Cosmic starfield home background`（Phase A 星场壳）
   - [x] Fallback + CosmicStarfieldIsland shell, remove ParticleIsland (AC-1, AC-4, AC-5)
   - [x] WebGL gate, Three scene, idle drift (AC-1, AC-2, AC-5)
   - [x] Explore hit test, orbit, zoom (AC-2, AC-3, AC-4)
   - [x] Unit tests, blog exclusion, islands AGENTS (AC-5, AC-6)
   - [x] Build + perf:audit home gates (AC-7)
   - [x] UX: stacking slot, round stars, Ctrl/Cmd zoom, hide scrollbar (AC-1, AC-2, AC-4, AC-8)
- [x] Build it (Phase B 太阳系): `/develop Cosmic starfield home background`
   - [x] Asset pipeline → `public/threejs-assets/web/` + budget gate (AC-1, AC-7)
   - [x] Kepler model + solar system scene modules (AC-1, AC-9, AC-10)
   - [x] Island wiring: auto time, section focus, poster fallback (AC-1–AC-5, AC-9, AC-10)
   - [x] Tests + blog asset exclusion + perf:audit (AC-6, AC-7, AC-8)
   - code in `src/components/islands/CosmicStarfieldIsland.tsx`, `src/components/islands/cosmosHitTest.ts`, `src/components/islands/solarSystemModel.ts`, `src/components/islands/solarSystemScene.ts`, `scripts/prepare-threejs-assets.mjs`, `src/pages/index.astro`, `src/layouts/HomeLayout.astro`, `tests/cosmic-starfield-island.test.ts`, `public/threejs-assets/web/`
- [x] Verify it: `/check verify Cosmic starfield home background`
- [x] Test it: `/test Cosmic starfield home background`
Spec [0003](../specs/0003-cosmic-starfield-home-background.md)

### 5. Home status rift and beast spectacle · done · Journey · Full
On the home hero, clicking the avatar chip and the “正在摸鱼中” status runs an anime grade sequence: the hit region splits, a black hole or vortex appears in a random on page region, a giant creature emerges from it, swims, then exits back through the portal; during the click path the status copy flips to “已 dead”, and after the spectacle the split heals back slowly. Occasional auto triggers reuse the portal and creature spectacle only; they must not change the avatar chip or status copy. Black hole look follows gravitational lensing and accretion disk principles (reference demo for ideas only). Creature pack is Pyjama Shark Free under Sketchfab Free Standard (no on-site credit; web glTF under budget).
**Done when:** click on those two home controls plays split → portal → creature enter/wander/exit → status “已 dead” → split heal then back to fishing; auto triggers play the same portal and creature path without touching those controls; reduced motion and weak devices get a safe skip; blog routes stay free of the spectacle assets; license rules for the creature pack are followed; Full pipeline (verify, test, review, document) passes.
- [x] Design it (spec): `/architect Home status rift and beast spectacle`
- [x] Build it: `/develop Home status rift and beast spectacle`
   - [x] Runtime model + portal sampling pure helpers (AC-2, AC-3, AC-4)
   - [x] Journey path 1 shell: status DOM bind, GSAP split/heal, island lock (AC-1, AC-2)
   - [x] Journey path 1 3D: shark glTF + portal shader + swim narrative (AC-1, AC-7)
   - [x] Journey path 2 auto schedule shared 3D segment (AC-3)
   - [x] Harden: cosmos events, visibility dispose, blog exclusion, budget + perf (AC-5…AC-10)
   - code in `src/components/islands/StatusSpectacleIsland.tsx`, `src/components/islands/spectacleModel.ts`, `src/components/islands/spectacleScene.ts`, `src/components/home/Main.astro`, `src/pages/index.astro`, `src/components/islands/CosmicStarfieldIsland.tsx`, `scripts/prepare-spectacle-assets.mjs`, `scripts/check-cosmos-assets.mjs`, `public/threejs-assets/web/spectacle/pyjama-shark/`, `tests/home-status-spectacle.test.ts`, `tests/e2e/home-status-spectacle-uat.spec.ts`
- [x] Verify it: `/check verify Home status rift and beast spectacle`
- [x] Test it: `/test Home status rift and beast spectacle`
Spec [0005](../specs/0005-home-status-rift-beast.md)

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- Confirm `threejs-assets` source licensing and site attribution · from spec 0003 follow-up
- Optional weak device tier for home cosmos (`deviceMemory` / `hardwareConcurrency`) · from spec 0003 follow-up
- Cosmic background on blog shell or beyond home · deferred from feature 3 scope choice (home only)

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`.

**Feature lifecycle**: `planned` → `in-progress` → `done`, plus `existing` and `dropped`.

- **Next step** = the first unticked box.
- **Atomic build tasks live in the spec's `## Build plan`, not here**.
