# Scope: 墨韵 · 个人网站

Personal portfolio and blog site for 墨韵. Astro static site with React islands, deployed on GitHub Pages.

**Build approach:** Tracer Bullet (thin vertical slices end to end through every layer).
**Workflow:** Medium (after develop: check verify, then test).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Remove legacy Vite SPA | Cleanup | done |
| 2 | CI guard against legacy imports | Hardening | done |

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

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- Expand ESLint to TypeScript and Astro and mirror the ban list for editor feedback · from spec 0002 · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`.

**Feature lifecycle**: `planned` → `in-progress` → `done`, plus `existing` and `dropped`.

- **Next step** = the first unticked box.
- **Atomic build tasks live in the spec's `## Build plan`, not here**.
