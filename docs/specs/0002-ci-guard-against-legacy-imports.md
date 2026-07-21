# 0002. CI guard against legacy SPA imports

**Date**: 2026-07-21
**Status**: Accepted

## Summary

This decision adds a continuous integration guard so the removed Vite SPA surface cannot quietly come back. The guard reuses one shared path list from the cleanup matrix, fails unit tests when banned files or packages return, and fails when source, script, or test code statically imports those paths. Path matching uses resolved relative paths with extensions, not bare basenames, so kept Astro twins stay allowed. A small GitHub Actions workflow runs the same tests on pull requests and on pushes to master, before anything merges.

## Context

Spec 0001 removed the legacy Vite SPA entry, duplicate JSX trees, SPA only blog helpers, and unused packages. A cleanup test already asserts those files are gone and those packages are absent. That check only proves the current tree is clean. It does not stop a future change from adding an import of a deleted module, recreating a deleted file, or putting a removed package back into package.json.

Deploy today runs only on push to master and runs build, not the unit suite as a PR gate. A regressing change can land on a branch and only surface after merge, or never if nobody runs tests. Without a shared list, any new check risks drifting from the 0001 deletion matrix.

Not deciding means the cleanup can erode one commit at a time and the dual front end confusion returns.

## Requirements

**User stories**:
- As a maintainer, I want CI to fail when legacy SPA paths are reintroduced so that the Astro only production path stays the single front end.
- As a contributor, I want the same failure locally via `yarn test` so that I can fix the problem before opening a PR.

**Acceptance criteria**:
- **AC-1**: One shared module exports the banned file paths, the `src/hooks` directory sentinel, and the removed direct dependency names, taken from the frozen deletion matrix in spec 0001 (aligned with the lists already used by `tests/legacy-vite-spa-cleanup.test.ts`).
- **AC-2**: Unit tests fail if any banned file exists again, or if the `src/hooks` directory exists again.
- **AC-3**: Unit tests fail if any removed SPA package name appears again as a direct dependency or direct devDependency in `package.json`.
- **AC-4**: Unit tests scan `src/**`, `scripts/**`, and `tests/**` for `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, and `.astro` files. They fail when a static `import`, `from`, `require()`, or dynamic `import('…')` / `import("…")` string specifier, after resolving against the importing file directory to a repo relative path that keeps the file extension, equals a banned file path from the shared list, or when that resolved path starts with `src/hooks/` (directory sentinel). Basename only matching is forbidden (for example kept `BlogPostCard.astro` must not fail because deleted `BlogPostCard.jsx` is banned). Comments and non import string literals (for example `existsSync('src/main.jsx')`) do not count as imports.
- **AC-5**: Files under `tests/**` are included in the AC-4 scan so a real banned import there fails. Assertion helpers may still mention banned path strings as plain string literals without failing, because those are not import forms under AC-4.
- **AC-6**: A new GitHub Actions workflow (for example `.github/workflows/ci.yml`) runs on `pull_request` and on `push` to `master`, installs with yarn, and runs `yarn test` so the guard fails the job before merge when AC-2 through AC-5 fail.
- **AC-7**: Locally, `yarn test` is the only required command to reproduce the CI guard failure. No separate guard script is required.
- **AC-8**: The existing Deploy workflow stays deploy only (build and GitHub Pages). It does not become the PR test gate.

## Options considered

### Option 1: Vitest guard plus shared list plus CI workflow

Extend the existing Vitest cleanup coverage with import scanning, extract one shared list module, and add a CI workflow that runs `yarn test` on PRs and pushes to master.

**Pros**:
- Reuses tools the repo already runs (Vitest, yarn test).
- Single list stays aligned with cleanup evidence.
- PR gate fails before merge.

**Cons**:
- Import scan is regex based, not a full module graph, so unusual dynamic paths need care.

### Option 2: ESLint no-restricted-imports only

Encode banned paths in ESLint and fail lint in CI.

**Pros**:
- Catches imports at edit time in editors that run ESLint.

**Cons**:
- Current ESLint config only covers `.js` / `.jsx`, not `.ts` or `.astro`, so coverage would be incomplete without a larger lint expansion.
- Does not by itself assert deleted files stay deleted or packages stay removed.

### Option 3: Standalone Node script and separate CI step

Add `scripts/guard-legacy-imports.mjs` and a dedicated yarn script that CI calls.

**Pros**:
- Clear named entry for the guard alone.

**Cons**:
- Extra command to remember and keep green beside `yarn test`.
- Duplicates list maintenance unless still shared with Vitest tests.

## Decision

**Chosen option**: Option 1: Vitest guard plus shared list plus CI workflow

Use Vitest as the enforcement surface, one shared banned list module sourced from the 0001 matrix, and a new CI workflow that runs `yarn test` on pull requests and pushes to master. Keep Deploy focused on build and Pages.

**Implementation skills**: `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

The cleanup test already owns the absence checks. Extending that same suite with import scanning and a shared list is the smallest change that closes the PR gap without new dependencies. ESLint would need a broader file type expansion first, which is a separate concern. A standalone script adds another entry point for the same Medium workflow that already expects `yarn test`.

Deploy should stay deploy only so Pages deploys do not mix with test gating. A dedicated CI workflow gives clear PR signal.

## Feature design

**Data model sketch**:
- No persistent entities. The only structured data is the in memory banned list module: file path strings, one directory sentinel (`src/hooks`), and package name strings.

**State transitions**:
- Not applicable. CI job outcome is pass or fail only.

**API surface**:
| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Shared list module `tests/fixtures/legacy-spa-paths.ts` | export | none | `legacyEntryFiles`, `legacySpaOnlyFiles`, `legacyBlogHelpers`, `legacyDirSentinels`, `removedDirectDeps` | local | none |
| Vitest suite (cleanup + import scan) | `yarn test` | repo tree | pass / fail | local / CI | non zero exit on AC-2..AC-5 |
| GitHub Actions `ci.yml` | workflow | PR or push event | job status | GitHub | job fail when `yarn test` fails |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Build banned file list | path strings checked for existence and imports | Spec 0001 frozen deletion matrix, exported from shared fixture |
| Build package ban list | package names | Spec 0001 AC-4 / existing cleanup test `removedDirectDeps` |
| Decide scan roots | which dirs are scanned | Cross check fix: `src/**`, `scripts/**`, and `tests/**` |
| Decide path match algorithm | when a specifier is banned | Cross check fix: resolve relative to importer, compare repo relative path with extension; equality to banned file, or prefix `src/hooks/` |
| Decide test string exception | how assertion strings stay allowed | AC-4/AC-5: only import forms are matched; plain string literals are not |
| Decide CI triggers | when the guard runs | Stage (c): `pull_request` and `push` to `master` |
| Local reproduce command | how a human reruns the guard | Stage (d): `yarn test` only |
| Directory sentinel | how whole `src/hooks` is banned | Resolved path starts with `src/hooks/` |

**Key invariants**:
- The shared list is the only authoring place for banned paths and packages used by these tests.
- A green `yarn test` means no banned file or directory exists, no banned direct package is listed, and no scanned file under `src/**`, `scripts/**`, or `tests/**` statically imports a banned path under the resolve rules in AC-4.
- Comments and non import string literals do not fail the scan.
- Matching never uses basename alone.

**Security model**:
- No user auth. CI uses default read access to the repository contents. No new secrets.

**Configuration required**:
- None. No new environment variables.

**Critical test scenarios**:
- Happy path: clean tree after 0001 cleanup, `yarn test` passes including import scan, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-7**
- Failure case: a file under `src/` adds `import … from '../pages/_Home.jsx'` (or equivalent banned path after resolve), `yarn test` fails, verifies **AC-4**
- Failure case: a file under `tests/` adds a real `import` of a banned module, `yarn test` fails, verifies **AC-4**, **AC-5**
- Failure case: recreate `vite.config.js` or `src/hooks/`, `yarn test` fails, verifies **AC-2**
- Failure case: add `vite` back under `devDependencies`, `yarn test` fails, verifies **AC-3**
- Edge case: cleanup test file still contains banned path strings for `existsSync` assertions and still passes; kept Astro imports that share a basename with a deleted JSX file still pass, verifies **AC-4**, **AC-5**
- CI case: open a PR that violates AC-4, the new workflow job fails; Deploy workflow file unchanged in role, verifies **AC-6**, **AC-8**

## Build plan

1. [x] Add `tests/fixtures/legacy-spa-paths.ts` exporting the banned file lists, `src/hooks` directory sentinel, and removed dependency names from the 0001 matrix (same membership as today’s cleanup test arrays), satisfies **AC-1**.
2. [x] Refactor `tests/legacy-vite-spa-cleanup.test.ts` to import those exports instead of inlined arrays, keep behavior identical, satisfies **AC-1**, **AC-2**, **AC-3**.
3. [x] Add import scan coverage (same file or a sibling test) that walks `src/**`, `scripts/**`, and `tests/**` for the agreed extensions, extracts static import specifiers, resolves each to a repo relative path with extension, fails on equality to a banned file or on prefix `src/hooks/`, and leaves non import string literals alone, satisfies **AC-4**, **AC-5**.
4. [x] Add `.github/workflows/ci.yml` with Node 22, yarn install, and `yarn test` on `pull_request` and `push` to `master`. Do not change Deploy into a PR test gate, satisfies **AC-6**, **AC-7**, **AC-8**.
5. [x] Run `yarn test` on the clean tree and confirm green; document in the PR that a deliberate banned import fails the suite, satisfies **AC-7**.

## Consequences

**Positive**:
- Cleanup cannot silently regress on a PR.
- One list keeps cleanup absence checks and import bans aligned.
- Contributors use the same `yarn test` command locally and in CI.

**Negative / tradeoffs**:
- Regex import detection is not a full bundler resolve graph.
- A second workflow file must be kept next to Deploy.

**Neutral**:
- No runtime change for site visitors.
- No new npm dependencies expected.

## Follow-up

- [ ] After ship, run `/sync` so AGENTS.md notes the CI guard and the shared fixture path if useful.
- [ ] Optional later: expand ESLint to TypeScript and Astro and mirror the ban list there for editor feedback (out of scope for this feature).
