# Review, uncommitted (spec 0004 Expand ESLint to TypeScript and Astro), 2026-07-22

**Reviewed by**: Claude Opus 4.8 (author model unknown)
**Scope**: 20 files (15 modified + 5 new), uncommitted on `master`
**Verdict**: Changes requested

## Summary

The change extends the flat ESLint config to TS/TSX/Astro, adds a local `no-legacy-spa-imports` rule backed by a single shared ban list, wires `yarn lint` into CI after build, and fixes the baseline lint errors so the gate starts green. The ban-list single-source refactor (AC-5/AC-8) is clean and well tested. However two defects mean the config does not actually deliver what the spec claims: the TS/TSX blocks pull the wrong `typescript-eslint` sub-config so **no real `@typescript-eslint` rules are active** (AC-2 unmet), and the local rule **misses dynamic `import()`** (AC-4 partially unmet). Both slipped through because the tests only assert config text and happy-path AST shapes, not effective rule behavior. `yarn lint` and `tests/eslint-expand.test.ts` both pass locally, but green here reflects weak assertions rather than a correct config.

## Major

### 🟠 TS/TSX blocks apply `eslint-recommended` overrides, not the real typescript-eslint recommended rules, `eslint.config.js:39`

**Problem**: `const tsRecommendedRules = { ...tseslint.configs.recommended[1].rules }` indexes position `[1]` of the recommended array. That array is `[base, eslint-recommended, recommended]`; index `[1]` is `typescript-eslint/eslint-recommended`, whose job is to **turn off** 19 core rules that TS supposedly handles (plus enable only `no-var`, `prefer-const`, `prefer-rest-params`, `prefer-spread`). The actual rule set (`@typescript-eslint/no-explicit-any`, `no-unused-vars`, `ban-ts-comment`, `no-non-null-asserted-optional-chain`, etc.) lives at index `[2]` and is never applied. Verified with `eslint --print-config src/components/islands/HomeMotion.tsx`: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, and even core `no-unused-vars` all resolve to "(absent)". The TS blocks also never spread `js.configs.recommended.rules` (only the JS and config-file blocks do), so TS/TSX files effectively get only React rules, `no-var`/`prefer-const`, and the local legacy rule.
**Why it matters**: AC-2 ("TypeScript and TSX blocks use `recommended` rules") is not met. TS islands and shared TS helpers — the files the spec says carry most new work — get almost no linting: unused vars, `any`, `@ts-ignore`, and other recommended violations pass silently. There is no `tsc --noEmit` gate in CI either, so nothing else catches them. The lint gate is green but hollow for the feature's primary target. The stale `src/env.d.ts` override for `@typescript-eslint/triple-slash-reference` (a rule that only exists in `recommended[2]`) is currently a no-op, which corroborates that `[2]` was intended.
**Suggested fix**: Spread the full recommended array into the flat config instead of hand-picking one block, e.g. include `...tseslint.configs.recommended` (scoped via its `files`, or re-scoped to `src/**`+`tests/**`), and keep the React/local overrides layered after it. Then add a test that asserts a representative rule (e.g. `@typescript-eslint/no-unused-vars`) is actually enabled for a `.tsx` file via `--print-config`, not just that the string `typescript-eslint` appears.

### 🟠 Local rule does not flag dynamic `import()` of banned paths, `eslint-rules/no-legacy-spa-imports.mjs:61`

**Problem**: Dynamic imports are handled inside the `CallExpression` visitor via `node.callee.type === 'Import'`. In ESLint 9 / espree (and the astro/ts parsers), `import('...')` parses to an **`ImportExpression`** node, not a `CallExpression`, so that branch is dead. Verified two ways: espree emits `ImportExpression` (no `CallExpression`) for `import('./x.js')`, and running the rule through `RuleTester` on `const m = import('../../App.jsx')` from a known importer produces **0 errors** ("Should have 1 error but had 0"). Only static `import`, `export ... from`, and `require()` are actually caught.
**Why it matters**: AC-4 explicitly lists "dynamic `import()` string specifiers", and a key spec invariant is that editor warnings match the Vitest guard. The Vitest regex scan *does* catch `import('./App.jsx')`, so the two guards diverge exactly where the spec says they should agree — a contributor gets no editor signal for a dynamically-imported legacy path. (CI still fails via the Vitest scan, so this is not a production regression, but the rule does not meet its stated contract.)
**Suggested fix**: Add an `ImportExpression(node)` visitor that checks `literalValue(node.source)`, and drop the now-dead `callee.type === 'Import'` branch. Add an `invalid` RuleTester case for a dynamic `import()` so the gap can't reopen.

## Minor

### 🟡 Config-contract tests assert text/shape, not effective rules, `tests/eslint-expand.test.ts:129`

**Problem**: The AC-2 test only checks that the config source string contains `typescript-eslint`/`eslint-plugin-astro` and lacks `projectService`. The AC-4 RuleTester cases cover static import and `require()` but not dynamic `import()`. Neither verifies that intended rules actually fire.
**Why it matters**: These weak assertions are why both Major defects pass CI. `TESTS = configured`, so the new config logic is under-covered where it matters.
**Suggested fix**: Assert a real `@typescript-eslint/*` rule is active for a `.tsx` file (via `ESLint.calculateConfigForFile` / `--print-config`), and add an invalid dynamic-`import()` RuleTester case.

### 🟡 `apply` test writes a fixture into the real, globally-scanned `content/posts/`, `tests/meta-batch.test.ts:33`

**Problem**: The test writes `_meta-batch-fixture.md` into `content/posts/`, then calls `scanPosts()` which enumerates that whole directory, and unlinks only in a `finally`. This replaced the previous `mkdtemp` isolation (dropped because `runMetaBatch` refuses writes outside POSTS_DIR).
**Why it matters**: Vitest runs test files in parallel; any other test (or a future one) that scans `content/posts` can transiently observe the fixture, and a crash/kill between write and unlink leaves a stray draft-less post in the tree. Low probability, but it's real flakiness plus a repo-hygiene risk. This is orthogonal to spec 0004 but is part of the reviewed diff.
**Suggested fix**: Prefer a fixture filename clearly namespaced and excluded from other scans, or refactor `runMetaBatch`/`scanPosts` to accept an injectable posts dir so the temp-dir isolation can return.

### 🟡 `isTest` detection is now always false, defeating its purpose, `src/game/GameTooltip.jsx:84`

**Problem**: `const isTest = import.meta.env?.VITEST === true` replaced the old `typeof process !== 'undefined' && process.env.NODE_ENV === 'test'`. Verified under vitest: `import.meta.env.VITEST` is **undefined** (vitest sets `process.env.VITEST = 'true'` as a string and `import.meta.env.MODE = 'test'`), so `undefined === true` is always false. The documented "shorter timeout in jsdom" branch never activates.
**Why it matters**: Production behavior is unchanged (isTest correctly false in the browser), but the test-mode shortcut is now dead code. The co-located test `src/game/GameTooltip.test.jsx` is not picked up by the vitest include (`tests/**/*.test.ts`), so nothing currently fails — but if that test is ever wired in, it will use the full 1s timeout and may hang. The likely motivation (avoid `process` `no-undef` in the browser JS block) is legitimate; the chosen expression is just wrong.
**Suggested fix**: Use `import.meta.env.MODE === 'test'` (defined and equal to `test` under vitest and in Vite), or check `import.meta.env.VITEST` truthiness rather than strict `=== true`.

## Nits
- ⚪ `eslint.config.js:97`, `...eslintPluginAstro.configs.recommended` applies to `**/*.astro` repo-wide, slightly broader than the AC-1 `src/**`+`tests/**` scope (harmless today since ignores cover the rest and `.astro` only lives under `src/`).
- ⚪ `eslint.config.js:103`, the `src/env.d.ts` `triple-slash-reference` override is currently a no-op because that rule isn't enabled; it will start working once the Major-1 fix lands.
- ⚪ `.github/workflows/ci.yml:26`, lint runs after the (expensive) build per AC-7; a lint-before-build order would fail faster on style/import regressions. Spec mandates this order, so this is only a note.

## Strengths
- Single-source ban list (AC-5) is done right: `scripts/lib/legacy-spa-paths.mjs` is the sole data source, `tests/fixtures/legacy-spa-paths.ts` re-exports it, and a test asserts `bannedFromFixture` deep-equals `bannedFromMjs`, so drift is impossible.
- Guard extraction into `scripts/lib/legacy-spa-import-guard.mjs` cleanly de-duplicates the resolver/comment-stripper that used to be inlined in the Vitest scan, and `tests/lib/legacy-spa-import-scan.ts` re-exports it without behavior change (AC-8 preserved).
- The resolved-path (not basename) matching is well covered: the `BlogPostCard.astro` vs `.jsx` twin test directly guards the spec's false-positive invariant.
- The `vitest.config.js` `__dirname` fix (deriving it from `import.meta.url`) is the correct ESM form and removes reliance on Vite's config-loader shim while satisfying lint; the `GRAVITY` removal in `GameScene.js` is safe (no remaining references, stale "used locally" comment notwithstanding).

## Test coverage

`TESTS = configured`. Well covered: ban-list single-source equality, resolved-path/basename safety, static-import + `require()` rule firing, CI step ordering, `yarn lint` exit-zero, and `scripts/**` ignore. Gaps that let the two Majors through: (1) no assertion that `@typescript-eslint` recommended rules are *effective* on TS files (only that the config text mentions the plugin), and (2) no RuleTester case for dynamic `import()`. Both should be added alongside the fixes. `src/game/GameTooltip.test.jsx` is outside the `tests/**/*.test.ts` include and does not run, so the `isTest` regression is unguarded.
