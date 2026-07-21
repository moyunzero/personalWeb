# 0001. Remove legacy Vite SPA surface

**Date**: 2026-07-21
**Status**: Accepted

## Summary

This decision removes old Vite SPA code that is no longer used in production. The site already runs on Astro pages and React islands, so the old SPA path now adds maintenance cost and confusion. We will remove legacy entry files, duplicate JSX views, and SPA only helpers, while keeping shared chat and game code used by islands. This keeps one clear runtime path and lowers future risk.

## Context

The repository contains two front end paths. One is Astro with static pages and islands, which is the production path for `yarn dev` and `yarn build`. The other is a legacy Vite SPA path with `index.html`, `src/main.jsx`, `src/App.jsx`, `src/routes`, and underscore page files. The legacy path is not used for current deploy.

Keeping both paths increases cognitive load and can cause accidental edits in dead code. It also keeps unused dependencies in `package.json`, and it makes code search noisy because many components exist in both `.astro` and `.jsx` forms.

The team goal is a single production path with clear ownership. This change should not touch active island code, chat logic, game scenes, content files, or SEO scripts.

## Requirements

**User stories**:
- As a maintainer, I want one active front end path so that I can change features without touching dead code.
- As a maintainer, I want legacy SPA dependencies removed so that install size and security surface are smaller.

**Acceptance criteria**:
- **AC-1**: Legacy Vite SPA entry, routing, and config surface is removed, including `index.html`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/routes/index.js`, `src/layouts/MainLayout.jsx`, and `src/pages/_Home.jsx`, `src/pages/_Blog.jsx`, `src/pages/_BlogDetail.jsx`.
- **AC-2**: Duplicate SPA only UI component trees listed in the deletion matrix are removed where Astro or islands already provide the production path.
- **AC-3**: SPA only blog helper files listed in the deletion matrix are removed, while shared parsing utilities still needed by Astro loader, lib, scripts, and tests are kept.
- **AC-4**: Dependencies no longer needed after cleanup are removed from `package.json` and `yarn.lock`: `react-router-dom`, `react-tsparticles`, `tsparticles`, `prop-types`, `@vitejs/plugin-react`, `vite`, `terser`. `react-markdown` stays because `src/components/chat/ChatBubble.jsx` still uses it.
- **AC-5**: `tailwind.config.js` no longer scans legacy `index.html` content.
- **AC-6**: Baseline passes before cleanup (`yarn build` and `yarn test`). After cleanup, `yarn build`, `yarn test`, and `yarn install --frozen-lockfile` pass. Preview smoke at `http://localhost:4321/personalWeb/` confirms home, `/blog/`, and one published post detail page render with HTTP 200 and no fatal browser console errors on home (islands hydrate).
- **AC-7**: If any post cleanup validation fails, only files in the frozen deletion matrix and related dependency or config edits are rolled back. Unrelated worktree changes are preserved. Cleanup does not merge until AC-6 passes.

## Options considered

### Option 1: Keep legacy surface and only add notes

Keep old files in place and add comments that they are deprecated.

**Pros**:
- Lowest immediate effort.
- No deletion risk.

**Cons**:
- Dead code remains in daily workflow.
- Future contributors still need to reason about two paths.
- Dependency and maintenance cost stay high.

### Option 2: Remove legacy surface in one focused cleanup

Delete disconnected SPA files and duplicate trees in one controlled batch, then verify build and preview.

**Pros**:
- Clears confusion quickly.
- Reduces dependency surface and long term maintenance.
- Aligns repository with actual runtime path.

**Cons**:
- Requires careful keep or delete boundaries.
- Needs solid verification before merge.

### Option 3: Strangler style staged removal

Remove legacy files in multiple phases with temporary adapters.

**Pros**:
- Lower per change risk if systems are still coupled.
- Easier rollback at each phase.

**Cons**:
- Slower time to clean state.
- More process overhead.
- Not necessary here because coupling is already low.

## Decision

**Chosen option**: Option 2: Remove legacy surface in one focused cleanup

We will perform one focused cleanup pass using the frozen deletion matrix below, keep active Astro and island paths, and enforce scoped rollback if validation fails.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Rationale

The legacy SPA path is already disconnected from production commands. This means a single batch removal gives high value with limited risk, as long as boundaries are explicit and validation is strict. A strangler rollout is usually best for tightly coupled live systems, but here the coupling map shows low dependence from Astro paths to legacy entry files.

The chosen approach also matches the maintainer goal of reducing confusion now, not in several follow up cycles. Scoped rollback on failure protects stability and avoids landing a half cleaned state.

## Feature design

**Data model sketch**:
- No persistent data model change.
- No schema migration.

**State transitions** (if applicable):
- Not applicable.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Render home page after cleanup | static page and islands render | Astro pages under `src/pages` plus island components under `src/components/islands` |
| Render blog list and post pages | published post list and detail output | `content/posts` through `src/loaders/posts-loader.ts` and `src/lib/blog.ts` |
| Chat bubble markdown rendering | assistant message HTML | `react-markdown` in `src/components/chat/ChatBubble.jsx` (kept) |
| Dependency set after cleanup | installed packages used by source | `package.json` and `yarn.lock` after removal list in AC-4 |
| Tailwind scan paths | class extraction input files | `tailwind.config.js` content globs after legacy removal |
| Preview smoke post slug | one published post detail URL | first entry from `getPublishedPosts()` in `src/lib/blog.ts` at build time, or any `draft: false` post in `content/posts/` |

**Key invariants**:
- Astro entry path remains the only production path.
- Shared chat and game island runtime files remain intact.
- Shared blog parsing files still used by loader, scripts, and tests remain intact.

**Security model**:
- No auth or permission model change.
- Reduced dependency surface by removing unused packages.

**Configuration required**:
- No new environment variables.

**Critical test scenarios**:
- Baseline gate: run `yarn build` and `yarn test` before any deletion, verifies **AC-6** baseline.
- Happy path: after cleanup, run `yarn build`, `yarn test`, `yarn install --frozen-lockfile`, then preview smoke home, `/blog/`, and one post detail page, verifies **AC-6**.
- Failure case: if post cleanup validation fails, revert only matrix files and related package or config edits, verifies **AC-7**.
- Dependency check: ensure removed packages have no remaining imports and lockfile install succeeds, verifies **AC-4**.

### Frozen deletion matrix

**Delete (legacy SPA entry and config)**:
- `index.html`
- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `src/routes/index.js`
- `src/layouts/MainLayout.jsx`
- `src/pages/_Home.jsx`
- `src/pages/_Blog.jsx`
- `src/pages/_BlogDetail.jsx`

**Delete (SPA only blog helpers)**:
- `src/blog/loadPosts.js`
- `src/blog/index.js`
- `src/blog/filterPosts.js`
- `src/blog/groupPostsByYear.js`
- `src/blog/getFeaturedPosts.js`
- `src/blog/getAdjacentPosts.js`
- `src/blog/normalizeMarkdown.js`
- `src/blog/buildMarkdown.js`

**Delete (SPA only components and hooks)**:
- `src/hooks/` (entire directory)
- `src/services/api.js`
- `src/game/PhaserGame.jsx`
- `src/components/ErrorBoundary.jsx`
- `src/components/common/Header.jsx`
- `src/components/common/Footer.jsx`
- `src/components/common/Navbar.jsx`
- `src/components/common/Button.jsx`
- `src/components/common/LoadingSpinner.jsx`
- `src/components/common/ParticleCanvas.jsx`
- `src/components/common/MouseTrail.jsx`
- `src/components/home/Main.jsx`
- `src/components/home/About.jsx`
- `src/components/home/Skill.jsx`
- `src/components/home/Work.jsx`
- `src/components/home/ProjectCard.jsx`
- `src/components/home/SkillCard.jsx`
- `src/components/blog/BlogNavbar.jsx`
- `src/components/blog/BlogPostCard.jsx`
- `src/components/blog/BlogFeaturedCard.jsx`
- `src/components/blog/BlogFooter.jsx`
- `src/components/blog/MarkdownContent.jsx`
- `src/components/blog/MermaidDiagram.jsx`
- `src/components/blog/BlogPostNav.jsx`
- `src/components/blog/ReadingProgressBar.jsx`

**Delete (deprecated scripts)**:
- `scripts/generate-static.mjs`
- `scripts/lib/build-posts-index.mjs`

**Keep (production Astro and islands)**:
- `src/pages/*.astro`, `src/pages/blog/**`, `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts`
- `src/layouts/{Base,Home,Blog}Layout.astro`
- `src/components/islands/**`
- `src/components/home/*.astro`, `src/components/home/Contact.jsx`
- `src/components/blog/{BlogPostCard,RelatedPosts}.astro`
- `src/components/chat/**`
- `src/game/{GameTooltip.jsx,scenes/GameScene.js}`
- `src/services/chatApi.js`
- `src/data/**`, `src/utils/index.js`, `src/lib/**`, `src/loaders/**`, `src/content.config.ts`
- `src/blog/{frontmatter,parsePost,excerpt,getCategories,getRelatedPosts,utils}.js`
- `scripts/` except the two deprecated files above
- `content/**`, `public/**`, `tests/**`

**PropTypes replacement (AC-4)**:
- In `src/components/chat/ChatBubble.jsx`, remove `prop-types` import and the `ChatBubble.propTypes` block. Do not convert the file to TypeScript in this cleanup.

**Preview smoke oracle (AC-6)**:
1. Run `yarn preview` (default `http://localhost:4321/personalWeb/`).
2. Load `/personalWeb/` and confirm HTTP 200, page title contains site name, and no fatal console errors.
3. Load `/personalWeb/blog/` and confirm HTTP 200 with at least one post link visible.
4. Load one published post detail URL (`/personalWeb/blog/<slug>/`) and confirm HTTP 200 with article title in body.
5. On home, confirm at least one island hydrates (game trigger or chat trigger visible and interactive).

## Build plan

1. Record baseline: run `yarn build` and `yarn test` before any deletion. Stop if baseline fails, satisfies **AC-6** baseline and **AC-7**.
2. Delete all files in the frozen deletion matrix, satisfies **AC-1**, **AC-2**, **AC-3**.
3. Remove PropTypes from `src/components/chat/ChatBubble.jsx`, satisfies **AC-4**.
4. Remove dependencies in AC-4 from `package.json`, run `yarn install`, and commit updated `yarn.lock`, satisfies **AC-4**.
5. Update `tailwind.config.js` to remove `./index.html` from content globs, satisfies **AC-5**.
6. Run `yarn build`, `yarn test`, and `yarn install --frozen-lockfile`, satisfies **AC-6**.
7. Run preview smoke per the oracle above, satisfies **AC-6**.
8. If step 6 or 7 fails, revert only matrix deletions and related package or config edits from this batch, satisfies **AC-7**.

## Consequences

**Positive**:
- One clear front end path.
- Smaller dependency and maintenance surface.
- Faster onboarding and safer edits.

**Negative / tradeoffs**:
- No quick fallback to legacy SPA path.
- Cleanup batch needs careful review before merge.

**Neutral**:
- No runtime behavior change is intended for users.
- No content or database migration is involved.

## Follow-up

- [ ] Run `/sync` after implementation to refresh context docs if file map changed materially.
- [ ] Consider adding a lightweight CI check that blocks new imports from removed legacy paths.

## Migration plan

**Strategy**: no migration needed
**Phases**:
1. Confirm baseline build and tests pass.
2. Remove legacy surface and dependencies in one batch per the frozen matrix.
3. Validate build, tests, frozen lockfile install, and preview smoke before merge.
**Rollback**: Revert only files in the frozen deletion matrix plus related `package.json`, `yarn.lock`, and `tailwind.config.js` edits when post cleanup validation fails.
**Risks**: Accidental deletion of shared files, hidden import from legacy tree, missed dependency still used by kept code, island hydration regression on home page.
