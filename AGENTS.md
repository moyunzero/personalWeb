# 墨韵 · 个人网站 (zero-web)

## Stack

- **Language / Runtime**: JavaScript and TypeScript, Node 22 (CI), ESM (`"type": "module"`)
- **Framework**: Astro 5 (static SSG) + React 18 islands
- **Key dependencies**: Tailwind CSS, Content Collections, GSAP/Lenis, Phaser 3, Three.js (home cosmos + status spectacle), Notion sync, Zod
- **Package manager**: yarn

## Build approach

Tracer Bullet (thin vertical slices end to end through every layer).

## Commands

```bash
# Install
yarn install

# Dev server (base path /personalWeb/)
yarn dev

# Build (cosmos + spectacle asset gate, then seo:audit; fails on missing web/ assets or SEO errors)
yarn build

# Lint (src/ and tests/ only; scripts/ ignored)
yarn lint

# Test (also the CI gate after build and lint)
yarn test
yarn test:e2e

# Home cosmos textures (local source → public/threejs-assets/web/; commit web/ derivatives)
yarn assets:cosmos
yarn assets:cosmos:check

# Home status spectacle shark glTF (assets/spectacle-source → public/threejs-assets/web/spectacle/)
yarn assets:spectacle

# Blog
yarn blog:new "标题" --categories note
yarn notion:sync

# SEO / production smoke (local; seo:index-check is not in CI)
yarn verify:prod
yarn seo:index-check
```

## Rules

- **Language with the human**: reply to the user in **Chinese** (简体中文). Keep code identifiers, file paths, commands, and acceptance IDs (`AC-1`, …) in their original form.
- Production site is **Astro only** (`yarn dev` / `yarn build`). The legacy Vite SPA entry and duplicate JSX trees were removed; do not reintroduce them.
- Legacy SPA ban list canonical source: `scripts/lib/legacy-spa-paths.mjs` (`tests/fixtures/legacy-spa-paths.ts` re-exports for Vitest). Vitest import scan and ESLint rule `eslint-rules/no-legacy-spa-imports.mjs` share `scripts/lib/legacy-spa-import-guard.mjs`.
- CI: `.github/workflows/ci.yml` runs `yarn build`, then `yarn lint`, then `yarn test` on `pull_request` and on push to `master`. Deploy (`.github/workflows/deploy.yml`) stays build and GitHub Pages only.
- Always use `import.meta.env.BASE_URL` for links and assets. Site lives at `/personalWeb/` on GitHub Pages.
- URLs use trailing slashes (`/blog/slug/`).
- New interactivity goes in `src/components/islands/*.tsx` with an explicit `client:*` directive.
- Blog source of truth: `content/posts/*.md`. Published posts need valid frontmatter or `yarn build` fails.
- Category IDs in posts must match `content/categories.json`.
- No path alias (`@/`). Use relative imports.
- ESLint (`yarn lint`) covers `src/**` and `tests/**` for `.js`, `.jsx`, `.ts`, `.tsx`, and `.astro`, plus root config files; uses `typescript-eslint` recommended (non type aware) and `eslint-plugin-astro`. `scripts/**` is Vitest scanned only, not ESLint linted.
- Shared site config: `scripts/lib/site-config.mjs` (`SITE.origin`, `SITE.basePath`, `SITE.url`).
- Home cosmos runtime only loads `public/threejs-assets/web/` (never source 8K/HDR). Home status spectacle runtime only loads `public/threejs-assets/web/spectacle/` (shark source in gitignored `assets/spectacle-source/`). `yarn build` runs `scripts/check-cosmos-assets.mjs` first (cosmos budget + spectacle ≤2.5 MB). Blog routes must not import the cosmos or spectacle islands or those assets.
- Outside blog article/list body (`BlogLayout` `main.blog-copyable`), pages use `user-select: none`; form fields stay selectable for editing.

## Context files

- [content/AGENTS.md](content/AGENTS.md) (blog Markdown and taxonomy)
- [scripts/AGENTS.md](scripts/AGENTS.md) (Notion sync, SEO gates, index check, perf audit)
- [src/blog/AGENTS.md](src/blog/AGENTS.md) (shared post parsing for loader, scripts, and tests)
- [src/components/islands/AGENTS.md](src/components/islands/AGENTS.md) (React hydration boundaries)
