# 0004. Expand ESLint to TypeScript and Astro

**Date**: 2026-07-22
**Status**: Accepted

## Summary

This decision extends the existing ESLint flat config so TypeScript, TSX, and Astro files in `src/` and `tests/` are linted locally and in CI. It adds a local ESLint rule that mirrors the legacy SPA import ban from spec 0002 using resolved relative paths, not basename guessing. The Vitest import scan stays the authoritative CI guard; ESLint gives earlier editor feedback. CI runs `yarn lint` after `yarn build` and before `yarn test`. This feature also fixes the thirteen existing JavaScript lint errors so the new gate starts green.

## Context

Spec 0002 added a Vitest import scan and a shared banned list in `tests/fixtures/legacy-spa-paths.ts`. That guard runs in CI through `yarn test` and catches reintroduced legacy SPA imports with resolved path rules. ESLint today only configures rules for `.js` and `.jsx`. TypeScript islands, shared blog helpers, and Astro pages are invisible to `yarn lint`.

AGENTS.md notes ESLint covers JavaScript and JSX only. Contributors editing `.ts`, `.tsx`, or `.astro` get no ESLint signal in the editor for general issues or banned legacy imports. Spec 0002 deliberately deferred ESLint expansion to keep the first guard small.

The repo already runs `yarn lint`, but CI does not gate on it. The current tree fails lint with thirteen errors on legacy JSX and config files. Turning on CI lint without fixing those errors would block every PR.

Not deciding leaves a blind spot on the files that now carry most new work, and keeps editor feedback misaligned with the 0002 ban list.

## Requirements

**User stories**:
- As a contributor, I want ESLint on TypeScript and Astro sources so that mistakes surface while I edit, not only in CI tests.
- As a maintainer, I want ESLint to flag banned legacy SPA imports with the same resolved path rules as spec 0002 so that editor warnings match the Vitest guard.
- As a maintainer, I want CI to fail on lint regressions so that broken style or banned imports cannot merge quietly.

**Acceptance criteria**:
- **AC-1**: Flat config file globs lint `src/**` and `tests/**` for `.ts`, `.tsx`, `.astro`, `.js`, and `.jsx`, plus repo root config files `vitest.config.js`, `eslint.config.js`, and `astro.config.mjs` with Node globals. `scripts/**`, `dist/**`, and `.astro/**` stay ignored. The `yarn lint` script may stay `eslint .`; ignores and per block `files` must enforce this scope (no silent lint of `scripts/**`).
- **AC-2**: `typescript-eslint` parser and plugin are installed. TypeScript and TSX blocks use `recommended` rules without type aware `projectService` or `parserOptions.project`.
- **AC-3**: `eslint-plugin-astro` and `astro-eslint-parser` are installed. Astro blocks set `parser: astro-eslint-parser` with the astro plugin processor so frontmatter script regions lint without type aware TypeScript project linting.
- **AC-4**: A local ESLint rule (for example `eslint-rules/no-legacy-spa-imports.mjs`) walks ESLint AST nodes for static import, reexport, `require()`, and dynamic `import()` string specifiers. It calls shared `resolveToRepoPath` and `isBannedResolvedPath` helpers. A resolved repo relative path equal to a banned file or under a `legacyDirSentinels` prefix reports at `error` severity with a message naming the resolved path. Basename only matching is forbidden. Extensionless relative specifiers follow the same limitation as spec 0002 (no new extension guessing in this feature).
- **AC-5**: Banned path membership lives in one plain ESM module `scripts/lib/legacy-spa-paths.mjs` (data only exports). `tests/fixtures/legacy-spa-paths.ts` re-exports those arrays for Vitest typing. `scripts/lib/legacy-spa-import-guard.mjs` imports the list and exports resolution helpers shared by the Vitest scan and the ESLint rule. No second handwritten list.
- **AC-6**: `yarn lint` exits zero on the clean tree after this feature, including fixes for all pre existing lint errors on in scope files (JSX under `src/` and `tests/`, plus root config files named in AC-1). Warnings may remain for rules configured as `warn` (for example `react-refresh/only-export-components`); CI does not use `--max-warnings 0`.
- **AC-7**: `.github/workflows/ci.yml` adds a `yarn lint` step after `yarn build` and before `yarn test`.
- **AC-8**: Existing Vitest legacy SPA tests stay green unchanged in intent. ESLint complements the scan; it does not remove or weaken `tests/legacy-spa-import-scan.test.ts`.
- **AC-9**: Removed SPA package names from `removedDirectDeps` are not enforced through ESLint in this feature (Vitest cleanup tests still own package absence).

## Options considered

### Option 1: typescript-eslint plus eslint-plugin-astro plus local resolved path rule plus CI lint gate

Extend flat config for TS and Astro, add a local rule that reuses the 0002 resolution helpers and fixture, fix the baseline errors, and gate CI on `yarn lint` after build.

**Pros**:
- Editor and CI feedback align with 0002 path rules.
- Reuses one banned list fixture.
- Closes the TS and Astro coverage gap without type aware lint cost.

**Cons**:
- New ESLint dependencies and a small local rule to maintain.
- Baseline cleanup is required before CI can gate lint.

### Option 2: Built in `no-restricted-imports` patterns only

Add path string patterns for each banned file in ESLint config without a custom rule.

**Pros**:
- No local rule file.

**Cons**:
- Cannot match resolved relative imports reliably; violates the 0002 parity goal.
- High false negative risk on real relative specifiers.

### Option 3: ESLint expansion without CI gate

Expand local lint and editor coverage but keep CI on `yarn test` only.

**Pros**:
- No CI workflow change.

**Cons**:
- Contributors can merge lint regressions if they skip local lint.
- Does not meet the engineer's chosen goal for a hard local and CI gate.

## Decision

**Chosen option**: Option 1: typescript-eslint plus eslint-plugin-astro plus local resolved path rule plus CI lint gate

Extend ESLint for TS and Astro with `typescript-eslint` recommended (non type aware) and `eslint-plugin-astro`. Enforce legacy SPA imports through a local rule backed by the shared fixture and shared resolution module. Fix all current lint errors. Run `yarn lint` in CI after build and before test.

**Implementation skills**: none beyond existing repo conventions (`AGENTS.md` ESLint note will update at `/sync` after ship)

## Rationale

Option 2 cannot reproduce AC-4 style resolved matching, which was the reason spec 0002 chose Vitest first. Option 3 leaves merge risk. Option 1 is the smallest path that satisfies editor feedback, shared ban list parity, and CI enforcement without turning on heavy type aware lint across Astro and React islands.

Disabling `react/prop-types` for JSX is the right baseline fix because spec 0001 removed the `prop-types` package. Config files like `vitest.config.js` should use Node globals instead of silencing `no-undef` file by file.

## Feature design

**Config and module sketch** (no database):

| Artifact | Role |
|---|---|
| `eslint.config.js` | Flat config blocks for JS, TS, TSX, Astro; registers local legacy SPA rule |
| `eslint-rules/no-legacy-spa-imports.mjs` | AST based local rule calling shared guard helpers |
| `scripts/lib/legacy-spa-import-guard.mjs` | Shared `extractImportSpecifiers`, `resolveToRepoPath`, `isBannedResolvedPath` |
| `scripts/lib/legacy-spa-paths.mjs` | Single banned list source (plain ESM, unchanged membership) |
| `tests/fixtures/legacy-spa-paths.ts` | Re-exports list for typed Vitest imports |
| `tests/lib/legacy-spa-import-scan.ts` | Thin wrapper importing guard helpers for existing tests |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Lint a source file | Whether an import is banned | `resolveToRepoPath(importerRel, specifier)` compared against `bannedFilePaths` and `legacyDirSentinels` from `scripts/lib/legacy-spa-paths.mjs` |
| ESLint rule message | Human readable banned resolved path | Rule context filename plus matched specifier from shared guard helper output |
| CI pass or fail | Lint step status | Exit code of `yarn lint` in `.github/workflows/ci.yml` |

**Key invariants**:
- Banned list membership never diverges between Vitest and ESLint.
- Resolved path matching keeps file extensions; kept Astro twins must not false positive against banned JSX paths.
- Vitest remains the guard for `scripts/**` import scans; ESLint intentionally does not lint `scripts/**` in this feature.

**Security model**: Not applicable (developer tooling only).

**Configuration required**: None (no new env vars).

**Critical test scenarios**:
- Happy path: `yarn lint` on the repo exits zero after implementation, verifies **AC-6**
- Ban parity: a test file or eslint rule unit check feeds a sample import of `../../App.jsx` from a known importer and reports `src/App.jsx`, verifies **AC-4**
- Basename safety: import resolving to `BlogPostCard.astro` does not fire when only `BlogPostCard.jsx` is banned, verifies **AC-4**
- CI ordering: `ci.yml` contains build, then lint, then test steps, verifies **AC-7**
- Regression: `yarn test` still passes including `legacy-spa-import-scan.test.ts`, verifies **AC-8**

## Build plan

1. [x] Move banned list data to `scripts/lib/legacy-spa-paths.mjs`. Make `tests/fixtures/legacy-spa-paths.ts` re-export it. Extract shared guard helpers to `scripts/lib/legacy-spa-import-guard.mjs`. Point `tests/lib/legacy-spa-import-scan.ts` at the guard module without changing test behavior, satisfies **AC-5**, **AC-8**.
2. [x] Add dev dependencies `typescript-eslint`, `eslint-plugin-astro`, and `astro-eslint-parser`. Extend `eslint.config.js` with scoped globs for `src/**`, `tests/**`, and root config files; add TS, TSX, and Astro blocks using recommended non type aware settings, satisfies **AC-1**, **AC-2**, **AC-3**.
3. [x] Add AST based `eslint-rules/no-legacy-spa-imports.mjs` at `error` severity and register it in flat config for all linted extensions, satisfies **AC-4**, **AC-5**.
4. [x] Fix all existing lint errors on in scope files until `yarn lint` is green. Turn off `react/prop-types`, add Node globals for root config files, and remove or fix unused symbols, satisfies **AC-6**, **AC-9**.
5. [x] Update `.github/workflows/ci.yml` to run `yarn lint` after `yarn build` and before `yarn test`. Run `yarn lint` and `yarn test` locally to confirm green, satisfies **AC-7**, **AC-8**.

## Consequences

**Positive**:
- TypeScript and Astro edits get ESLint signal in editor and CI.
- Legacy SPA import mistakes surface before `yarn test` in many cases.
- One banned list stays authoritative across Vitest and ESLint.

**Negative / tradeoffs**:
- More ESLint dependencies and a local rule to maintain.
- CI pipeline adds one step; PR time grows slightly.
- Regex based Vitest scan and AST based ESLint rule may diverge on edge cases; Vitest remains authoritative for CI import guard (same broad tradeoff as 0002).

**Neutral**:
- No visitor facing runtime change.
- `scripts/**` remains Vitest scanned only until a future scope item expands ESLint there.

## Follow-up

- [ ] After ship, run `/sync` to update AGENTS.md ESLint coverage note and CI description.
- [ ] Tick the optional ESLint follow up checkbox in spec 0002 when this feature closes.
- [ ] Optional later: lint `scripts/**` or add ESLint checks for removed package names in imports.
