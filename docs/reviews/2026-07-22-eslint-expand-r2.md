# Review (re-review), uncommitted (spec 0004 Expand ESLint to TypeScript and Astro), 2026-07-22

**Reviewed by**: Claude Opus 4.8 (author model unknown)
**Scope**: 21 files (15 modified + 6 new), uncommitted on `master` — re-review after fixes
**Verdict**: Approve with nits

## Summary

This is a re-review of spec 0004 after the two Majors from the prior review (`2026-07-22-eslint-expand.md`) were addressed. Both are now genuinely fixed, verified by runtime probes rather than config text: the TS/TSX blocks merge `tseslint.configs.recommended[1]` **and** `[2]`, so the real `@typescript-eslint` recommended rules are now effective; and the local rule gained an `ImportExpression` visitor, so dynamic `import()` of banned paths is flagged through the full pipeline. The prior test-weakness Minor is also resolved (the config test now asserts *effective* rules via `calculateConfigForFile`, and there are RuleTester + `lintText` cases for dynamic `import()`). All 144 tests pass and `yarn lint` is green. One carried-over Minor remains (test fixture written into the live `content/posts/` tree), orthogonal to spec 0004.

## Verification of prior Majors (both FIXED)

- **Major-1 (TS recommended rules inert)** — FIXED. `eslint.config.js:39-42` now spreads `recommended[1]` + `recommended[2]`. `eslint --print-config src/components/islands/HomeMotion.tsx` resolves `@typescript-eslint/no-unused-vars => [2]`, `@typescript-eslint/no-explicit-any => [2]`, `@typescript-eslint/ban-ts-comment => [2]`, `@typescript-eslint/no-non-null-asserted-optional-chain => [2]`, and `@typescript-eslint/triple-slash-reference => [2]` (so the `src/env.d.ts` override is no longer a no-op). Core `no-unused-vars => [0]` is correct — typescript-eslint's `eslint-recommended` disables it in favor of the TS-aware version.
- **Major-2 (dynamic `import()` missed)** — FIXED. `eslint-rules/no-legacy-spa-imports.mjs:61-63` adds an `ImportExpression` visitor and the dead `callee.type === 'Import'` branch is gone. A lint probe on `const m = import('../../App.jsx')` from `src/components/chat/` reports `local/no-legacy-spa-imports` at the `import()` call (plus static import, `require()`, and `export … from` all fire). RuleTester and full-pipeline `lintText` cases guard the gap.
- **GameTooltip `isTest`** — FIXED. `src/game/GameTooltip.jsx:84` now uses `import.meta.env?.MODE === 'test'`, which is defined and equals `test` under Vitest/Vite (the old `VITEST === true` was always false).

## Minor

### 🟡 `apply` test writes a fixture into the real, globally-scanned `content/posts/`, `tests/meta-batch.test.ts:33`

**Problem**: The test still writes `_meta-batch-fixture.md` into `content/posts/`, calls `scanPosts()` over that whole directory, and unlinks only in `finally`. This Minor was raised in the prior review and is unchanged.
**Why it matters**: Vitest runs files in parallel, so another test scanning `content/posts` can transiently observe the fixture, and a crash/kill between write and unlink leaves a stray post in the tree. Low probability, real hygiene/flakiness risk. Orthogonal to spec 0004 but part of the reviewed diff.
**Suggested fix**: Namespace the fixture out of other scans, or make `runMetaBatch`/`scanPosts` accept an injectable posts dir so `mkdtemp` isolation can return.

## Nits
- ⚪ `eslint.config.js:98`, `...eslintPluginAstro.configs.recommended` applies to `**/*.astro` repo-wide, slightly broader than the AC-1 `src/**`+`tests/**` scope (harmless: ignores cover the rest and `.astro` only lives under `src/`). Carried over.
- ⚪ `.github/workflows/ci.yml:26`, lint runs after the expensive build per AC-7; lint-before-build would fail faster. Spec mandates this order, so this is only a note. Carried over.
- ⚪ `src/game/GameTooltip.test.jsx` (if present) is outside the Vitest include (`tests/**/*.test.ts`) and does not run, so the corrected `isTest` branch is still unexercised by the suite — not a regression, just unguarded.

## Strengths
- Both prior Majors were fixed at the root cause, not papered over: the config change spreads the *full* recommended array and the rule adds the correct AST node, each backed by a new test that would catch a regression (`calculateConfigForFile` asserting `error` severity; a dynamic-`import()` RuleTester + `lintText` case).
- The test suite was strengthened exactly where it was weak — AC-2 now checks effective rules, not config text; AC-4 covers static import, `require()`, `export … from`, and dynamic `import()`.
- Single-source ban list (AC-5) remains clean: `scripts/lib/legacy-spa-paths.mjs` is the sole data source, `tests/fixtures/legacy-spa-paths.ts` and `tests/lib/legacy-spa-import-scan.ts` are thin re-export shims, and a deep-equal test makes drift impossible.
- Resolved-path (not basename) matching is well covered by the `BlogPostCard.astro` vs `.jsx` twin test, guarding the spec's false-positive invariant.

## Test coverage

`TESTS = configured`. All 144 tests pass; `yarn lint` exits zero. Coverage now includes: effective `@typescript-eslint` rules on `.tsx` (AC-2), all four import forms including dynamic `import()` at both unit and full-pipeline levels (AC-4), ban-list single-source equality (AC-5), resolved-path/basename safety, `scripts/**` ignore + Astro parse (AC-1/AC-3), CI step ordering (AC-7), `yarn lint` exit-zero (AC-6), and the Vitest scan regression (AC-8). The only remaining coverage note is the co-located `GameTooltip` test being outside the include, which predates this feature.
