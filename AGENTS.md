# 墨韵 · 个人网站 (zero-web)

## Stack

- **Language / Runtime**: JavaScript and TypeScript, Node 22 (CI), ESM (`"type": "module"`)
- **Framework**: Astro 5 (static SSG) + React 18 islands
- **Key dependencies**: Tailwind CSS, Content Collections, GSAP/Lenis, Phaser 3, Three.js (home cosmos), Notion sync, Zod
- **Package manager**: yarn

## Build approach

Tracer Bullet (thin vertical slices end to end through every layer).

## Commands

```bash
# Install
yarn install

# Dev server (base path /personalWeb/)
yarn dev

# Build (cosmos asset gate, then seo:audit; fails on missing web/ textures or SEO errors)
yarn build

# Test (also the CI gate; no separate legacy guard script)
yarn test
yarn test:e2e

# Home cosmos textures (local source → public/threejs-assets/web/; commit web/ derivatives)
yarn assets:cosmos
yarn assets:cosmos:check

# Blog
yarn blog:new "标题" --categories note
yarn notion:sync
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Engineering workflow

Default path: [JavaScript-Mastery-Pro/skills](https://github.com/JavaScript-Mastery-Pro/skills) in `.agents/skills/` (`scope` · `audit` · `architect` · `develop` · `check` · `test` · `document` · `sync` · `debug`).

```
idea → /scope → /audit → /architect → /develop → /check verify → /test → /check review → /document → /sync
```

Project workflow depth: **Medium** (see `docs/scope/scope.md`). Cursor always applies `.cursor/rules/jsm-workflow.mdc` (read the matching `SKILL.md` before running a skill; end replies with a **下一步** skill suggestion).

## Rules

- **Language with the human**: reply to the user in **Chinese** (简体中文). Skill progress notes, decision summaries, and PR/commit message drafts for this repo should also be Chinese unless the user asks otherwise. Keep code identifiers, file paths, commands, and acceptance IDs (`AC-1`, …) in their original form. Specs under `docs/specs/` for this project should be written in Chinese when newly authored or when the user asks to convert them.
- Production site is **Astro only** (`yarn dev` / `yarn build`). The legacy Vite SPA entry and duplicate JSX trees were removed; do not reintroduce them.
- Legacy SPA ban list lives in `tests/fixtures/legacy-spa-paths.ts`. Cleanup and import scan tests enforce it; keep that module the single authoring place for banned paths and removed packages.
- CI: `.github/workflows/ci.yml` runs `yarn build` then `yarn test` on `pull_request` and on push to `master`. Deploy (`.github/workflows/deploy.yml`) stays build and GitHub Pages only.
- Always use `import.meta.env.BASE_URL` for links and assets. Site lives at `/personalWeb/` on GitHub Pages.
- URLs use trailing slashes (`/blog/slug/`).
- New interactivity goes in `src/components/islands/*.tsx` with an explicit `client:*` directive.
- Blog source of truth: `content/posts/*.md`. Published posts need valid frontmatter or `yarn build` fails.
- Category IDs in posts must match `content/categories.json`.
- No path alias (`@/`). Use relative imports.
- ESLint covers `.js` / `.jsx` only, not `.ts` or `.astro`.
- Shared site config: `scripts/lib/site-config.mjs` (`SITE.origin`, `SITE.basePath`, `SITE.url`).
- Home cosmos runtime only loads `public/threejs-assets/web/` (never source 8K/HDR). `yarn build` runs `scripts/check-cosmos-assets.mjs` first. Blog routes must not import the cosmos island or those assets.
- Outside blog article/list body (`BlogLayout` `main.blog-copyable`), pages use `user-select: none`; form fields stay selectable for editing.

## Agent skills

- [astro](.agents/skills/astro/): `astrolicious/agent-skills`, Astro conventions and patterns
- [vitest](.agents/skills/vitest/): `antfu/skills`, unit test patterns
- [playwright-best-practices](.agents/skills/playwright-best-practices/): `currents-dev/playwright-best-practices-skill`, E2E test conventions
- [tailwind-design-system](.agents/skills/tailwind-design-system/): `wshobson/agents`, Tailwind design system patterns
- [phaser-best-practices](.agents/skills/phaser-best-practices/): `onmax/nuxt-skills`, Phaser 3 game patterns (GameIsland)
- [game-setup-and-config](.agents/skills/game-setup-and-config/): `phaserjs/phaser`, official Phaser game setup
- [threejs-fundamentals](.agents/skills/threejs-fundamentals/): `cloudai-x/threejs-skills`, home cosmos WebGL (see islands AGENTS.md)
- [threejs-animation](.agents/skills/threejs-animation/): `cloudai-x/threejs-skills`, idle drift / rAF
- [threejs-interaction](.agents/skills/threejs-interaction/): `cloudai-x/threejs-skills`, orbit / zoom (advisory)

## Context files

- [content/AGENTS.md](content/AGENTS.md) (blog Markdown and taxonomy)
- [scripts/AGENTS.md](scripts/AGENTS.md) (Notion sync, SEO gates, perf audit)
- [src/blog/AGENTS.md](src/blog/AGENTS.md) (shared post parsing for loader, scripts, and tests)
- [src/components/islands/AGENTS.md](src/components/islands/AGENTS.md) (React hydration boundaries)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
