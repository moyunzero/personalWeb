# Phase 3: 元数据流水线与 CI - Research

**Researched:** 2026-06-21
**Domain:** Node CLI metadata pipeline + Astro Content Collections Zod schema + GitHub Actions SEO gate
**Confidence:** HIGH

## Summary

Phase 3 closes the gap between “SEO-capable build” (Phases 1–2) and “SEO-regression-proof CI.” Today the corpus has **96 posts**, **32 with empty `description:` in frontmatter**, **10 with titles > 60 chars**, and **19 with hash/random slugs** — verified by scanning `content/posts/` with existing `parseFrontmatter` [VERIFIED: codebase scan]. The Astro loader schema still has `description: z.string().optional()`, and `parsePost()` silently backfills missing descriptions via `extractExcerpt()` — so builds pass even when frontmatter is empty, blocking OPT-02.

**Primary recommendation:** Extract a **single shared Zod post schema** (`scripts/lib/post-schema.mjs`, imported by `posts-loader.ts` and CLI scripts). Implement `scripts/seo-meta-batch.mjs` (`--dry-run` / `--apply`, slug frozen unless `--force-slug`) and `scripts/seo-audit.mjs` (error-level rules, exit code 1). Chain `"build": "yarn seo:audit && astro build"`. Execute in three waves matching ROADMAP: meta-batch tooling → audit + CI wiring → batch `--apply` on all 96 posts → flip schema to require frontmatter `description` for published posts (drafts exempt or auto-stubbed). Do **not** reintroduce homepage featured posts (Phase 2 UAT declined OPT-05 on home).

<user_constraints>
## User Constraints (from design doc — no CONTEXT.md)

### Locked Decisions

| ID | Decision | Source |
|----|----------|--------|
| D-P3-01 | `description` **必填** for published posts; enable strict schema **after** batch fill (分阶段) | `docs/SEO-MIGRATION-DESIGN.md` Decision Log, §4, §5 |
| D-P3-02 | **默认不批量改 slug**; only `--force-slug` may rename | Design doc Decision Log, REQUIREMENTS Out of Scope |
| D-P3-03 | Content paths: `yarn blog:new`, `yarn notion:sync`, `yarn seo:meta-batch` | §4 内容工作流 |
| D-P3-04 | `yarn seo:audit` CI 门禁; build fails on **error**-level issues | §2, §6, §7; SEO-05 |
| D-P3-05 | `yarn build` includes seo-audit (local + Actions) | §6 构建与部署 |
| D-P3-06 | Remove web editor (done Phase 2); CLI + Notion only | §4 |
| D-P3-07 | ~96 posts batch metadata before strict validation | §5 批量元数据; OPT-01 |
| D-P3-08 | Phase 2 UAT: **no homepage featured posts block** — do not plan OPT-05 on `index.astro` | `02-UAT.md` test 1 & 5 |

### Claude's Discretion

- Shared schema file location (`scripts/lib/post-schema.mjs` vs dual TS/JS)
- Audit: source-only pre-build vs additional post-build HTML scan
- Description length bounds (min 30 / target 120–160 as warn vs error)
- Whether `blog:new` drafts require description stub or draft-only exemption in schema
- Title auto-trim on `--apply` (warn-only vs optional fix)

### Deferred Ideas (OUT OF SCOPE)

- Top N 深度优化 queue/scoring (OPT-03, OPT-04) → Phase 4
- 相关文章内链、分类聚合 (SEO-07, SEO-08) → Phase 4
- 站长平台提交文档 (LAUNCH-01) → Phase 4
- 批量 slug 重命名（无 `--force-slug`）→ explicitly out of scope
- Homepage 精选文章静态区块 (OPT-05 home) → user declined Phase 2 UAT
- 自定义域名 / CDN / 分析工具接入 → v2 / out of scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-01 | `yarn blog:new` 生成符合 schema 的 frontmatter | Update `new-post.mjs` template: non-empty `description` stub + required fields aligned with shared schema; vitest template parse |
| FLOW-02 | `yarn notion:sync` 输出与 Content Collections 兼容 | Post-sync validation via shared schema; fill empty Notion description from body excerpt before write |
| FLOW-03 | `yarn seo:meta-batch` 支持 `--dry-run` / `--apply` | New `scripts/seo-meta-batch.mjs` + `scripts/lib/scan-posts.mjs`; slug protected by default |
| SEO-05 | `yarn seo:audit` 校验 meta 规则; CI fails on error | New `scripts/seo-audit.mjs`; wire into `package.json` `build`; `deploy.yml` unchanged (runs `yarn build`) |
| OPT-01 | 全库 96 篇 batch 补全 description 等 | `--apply` uses `extractExcerpt(body, 160)`; corpus gap report from dry-run |
| OPT-02 | batch 后 `description` 必填严格校验 | Loader schema `z.string().min(1)` + stop `parsePost` fallback **before** `parseData`; build fails on empty frontmatter |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Frontmatter read/write | Node CLI scripts (`scripts/`) | — | Batch/sync/new-post already ESM `.mjs`; writes `content/posts/*.md` |
| Schema validation | Build-time Astro loader (`parseData`) | CLI pre-build audit | Single Zod schema; Astro fails build on invalid entries [CITED: docs.astro.build/en/reference/content-loader-reference/] |
| Description generation | Node (`extractExcerpt`) | — | Reuse `src/blog/excerpt.js`; no LLM |
| SEO meta in HTML | Astro layouts (SSG) | Post-build HTML audit (optional) | Already in `BaseLayout.astro`; audit verifies output |
| CI gate | GitHub Actions `yarn build` | — | Pre-build audit + astro build; no new Actions steps if `build` script chains audit |
| Slug stability | meta-batch policy | notion-sync existing slug registry | Default immutability prevents link rot / 丢收录 |
| Draft handling | Frontmatter `draft: true` | Build filters `!data.draft` on blog routes | Schema may relax description for drafts only |

## Project Constraints (from .cursor/rules/)

- **Codegraph MCP:** Use `codegraph_context` with `task` param; `codegraph_search` with `query`. Structure questions via Codegraph before grep loops.
- **Karpathy guidelines:** Minimal scope; no new abstractions beyond shared schema + two scripts; surgical edits to existing `new-post.mjs`, `notion-sync.mjs`, `posts-loader.ts`.
- **Frontend design:** Not applicable — no UI in this phase.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | **4.4.3** (existing `^4.4.3`) | Post schema + audit validation | Already used via `astro/zod` in loader; scripts import `zod` directly [VERIFIED: npm registry] |
| `yaml` | **2.9.0** (existing) | Frontmatter parse/stringify | Shared with `frontmatter.js` [VERIFIED: npm registry] |
| `astro` | **5.18.x** (existing) | Build-time `parseData()` validation | Content Loader API enforces schema at build [CITED: /withastro/docs content collections] |
| Node.js `fs/promises` | **20+** (CI pin) | Batch scan/write | Matches `deploy.yml` `node-version: 20` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/blog/frontmatter.js` | existing | Parse/stringify md | All scripts — Notion YAML quirk fix already here |
| `src/blog/excerpt.js` | existing | Description candidates | meta-batch `--apply`, notion-sync fallback |
| `src/blog/parsePost.js` | existing | Normalized post shape | Loader mapping (after raw description validated) |
| `scripts/lib/site-config.mjs` | existing | `SITE.url`, `basePath` | Canonical URL checks in audit |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CLI audit | `html-validate`, `linkinator`, Lighthouse CI | Heavy deps; overkill for meta frontmatter gate; HTML layout already stable |
| `cheerio` for dist parse | Regex on built HTML | No new dependency; regex sufficient for `<meta name="description">` spot-check |
| Duplicate Zod in TS + JS | `tsx` to import `.ts` from scripts | Adds devDep; `.mjs` canonical + TS import matches `site-config.mjs` pattern |
| Astro `schema` in `content.config.ts` | Schema only on loader | Either works; **one export** from `post-schema.mjs` imported in both places avoids drift |

**Installation:** None required — use existing dependencies.

**Version verification (2026-06-21):**

```bash
npm view zod version    # 4.4.3
npm view yaml version   # 2.9.0
npm view astro@5 version # 5.18.2
```

## Package Legitimacy Audit

> Phase 3 adds **no new npm packages**. Existing packages verified.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `zod` | npm | 5+ yrs | ~203M/wk | github.com/colinhacks/zod | OK | Approved (existing) |
| `yaml` | npm | 5+ yrs | ~169M/wk | github.com/eemeli/yaml | OK | Approved (existing) |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ yarn blog:new   │     │ yarn notion:sync │     │ yarn seo:meta-batch │
│ new-post.mjs    │     │ notion-sync.mjs  │     │ --dry-run / --apply │
└────────┬────────┘     └────────┬─────────┘     └──────────┬──────────┘
         │                       │                            │
         └───────────────────────┼────────────────────────────┘
                                 ▼
                    ┌────────────────────────────┐
                    │  content/posts/*.md        │
                    │  (YAML frontmatter)        │
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────────┐
│ yarn seo:audit  │   │ astro build      │   │ posts-loader.ts     │
│ (pre-build)     │   │ getCollection    │   │ parseData(schema)   │
│ exit 1 on error │   │ static dist/     │   │ strict description  │
└────────┬────────┘   └────────┬─────────┘   └─────────────────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
         ┌──────────────────────┐
         │ GitHub Actions       │
         │ yarn build → deploy  │
         └──────────────────────┘
```

### Recommended Project Structure

```
scripts/
├── seo-meta-batch.mjs       # FLOW-03, OPT-01
├── seo-audit.mjs            # SEO-05
├── new-post.mjs             # FLOW-01 (update template)
├── notion-sync.mjs          # FLOW-02 (description fallback)
└── lib/
    ├── post-schema.mjs      # Single Zod schema (canonical)
    ├── scan-posts.mjs       # Enumerate + parse all posts
    ├── meta-rules.mjs       # Audit rule defs + severity
    └── site-config.mjs      # (existing)

src/
├── loaders/posts-loader.ts  # Import postSchema; raw description for parseData
├── blog/parsePost.js        # Keep excerpt fallback for display ONLY after validation
└── content.config.ts        # Optional: re-export schema on defineCollection

tests/
├── frontmatter.test.ts      # (existing)
├── post-schema.test.ts      # Schema + draft exemption
├── meta-batch.test.ts       # dry-run/apply/slug guard
└── seo-audit.test.ts        # error vs warn, exit codes
```

### Pattern 1: Shared Post Schema (Single Source of Truth)

**What:** One Zod object exported from `scripts/lib/post-schema.mjs`, imported by loader, audit, and batch scripts.

**When to use:** Any validation of post frontmatter — never duplicate field lists.

**Example:**

```javascript
// scripts/lib/post-schema.mjs
import { z } from 'zod';

/** Strict mode: set via POST_SCHEMA_STRICT=1 or after OPT-02 wave */
const strict = process.env.POST_SCHEMA_STRICT === '1';

export const postDataSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    publishedAt: z.string().min(1),
    updatedAt: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    author: z.string().default('墨韵'),
    readTime: z.number().optional(),
    canonical: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    noindex: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!strict || data.draft) return;
    const desc = data.description.trim();
    if (!desc) {
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'description is required for published posts',
      });
    }
  });

export function validatePostData(data) {
  return postDataSchema.safeParse(data);
}
```

```typescript
// src/loaders/posts-loader.ts — pass RAW frontmatter description (no excerpt fallback)
import { postDataSchema } from '../../scripts/lib/post-schema.mjs';

// In load():
const rawDesc = String(parsed.data.description ?? '').trim(); // from parseFrontmatter, not parsePost
const data = await parseData({
  id: parsed.id,
  data: { ...mappedFields, description: rawDesc },
});
// schema: postDataSchema on loader object
```

Source: Astro Content Loader `parseData()` + Zod schema [CITED: docs.astro.build/en/reference/content-loader-reference/]; tutorial required `description: z.string()` [CITED: /withastro/docs tutorial 6-islands/4.mdx].

### Pattern 2: meta-batch CLI

**What:** Scan all posts, emit gap report; `--apply` writes frontmatter updates in place.

**Flags:**

| Flag | Behavior |
|------|----------|
| `(default)` | Same as `--dry-run` |
| `--dry-run` | Report only; exit 0 |
| `--apply` | Write files; exit 0 unless IO error |
| `--force-slug` | Also apply slug rename + file rename (opt-in) |
| `--min-desc=30` | Minimum length for generated description (optional) |

**Apply rules (prescriptive):**

| Field | Dry-run | Apply (default) |
|-------|---------|-----------------|
| `description` | Flag empty / whitespace | Fill from `extractExcerpt(body, 160)` if empty |
| `title` | Warn if `length > 60` | **Do not auto-truncate** (human edit); report only |
| `slug` | Suggest readable slug if hash-like | **Never change** unless `--force-slug` |
| `date` / `categories` | Report missing | Do not invent |

**Output format:**

```
SEO Meta Batch — dry-run
Posts scanned: 96
Would update: 32 (description)
Warnings: 10 (title length), 19 (hash slug — suggestion only)

content/posts/2024-01-01-abc12345.md
  description: "" → "从正文提取的前 160 字…"
  slug: 2024-01-01-abc12345 (unchanged; suggest --force-slug to rename)
```

### Pattern 3: seo-audit CLI + build chain

**What:** Fast source-level audit before `astro build`; non-zero exit on errors.

**package.json:**

```json
{
  "scripts": {
    "seo:audit": "node scripts/seo-audit.mjs",
    "seo:meta-batch": "node scripts/seo-meta-batch.mjs",
    "build": "yarn seo:audit && astro build",
    "build:astro": "astro build"
  }
}
```

**Audit rules:**

| Rule | Severity | Condition |
|------|----------|-----------|
| `desc-missing` | **error** | Published post: `description.trim()` empty in frontmatter |
| `desc-short` | warn | Published: `description.length < 30` |
| `desc-long` | warn | `description.length > 200` |
| `title-missing` | **error** | No title |
| `title-long` | warn | `title.length > 60` |
| `slug-filename` | warn | `data.slug !== basename(file, '.md')` |
| `slug-hash` | warn | Slug matches `/^[a-f0-9]{8}$/` or date-hash pattern |
| `date-missing` | **error** | No `date` / `publishedAt` |
| `categories-invalid` | **error** | Unknown category id (reuse `validateCategoryIds`) |
| `site-config` | **error** | `SITE.description` empty |

**CI:** `.github/workflows/deploy.yml` already runs `yarn build` — no workflow edit required once `build` script chains audit [VERIFIED: `.github/workflows/deploy.yml`].

**Optional `--dist` mode (Claude's discretion):** After build, regex-scan `dist/**/*.html` for `<meta name="description" content="...">` on index + blog list + sample posts — catches layout regressions. Not required for SEO-05 if source audit + Astro schema are enforced.

### Pattern 4: Phased Schema Migration (OPT-01 → OPT-02)

| Wave | Action | `description` in frontmatter | Build behavior |
|------|--------|------------------------------|----------------|
| **3a** | Ship meta-batch + audit (schema still optional) | 32 empty | Audit errors on published empty desc; build may pass if audit not wired |
| **3b** | `seo:meta-batch --apply` on full corpus | 0 empty | Audit passes |
| **3c** | Enable strict schema (`POST_SCHEMA_STRICT=1` in CI + local build) | Required for `draft: false` | `parseData` throws → build fails |

**Critical fix:** Remove excerpt backfill **before** `parseData` in loader. Keep `parsePost()` excerpt fallback for **runtime display** only when reading already-validated collection data, or drop fallback entirely post-OPT-02 so missing desc is impossible.

### Anti-Patterns to Avoid

- **Validating after excerpt backfill:** Masks OPT-02; empty YAML passes as filled description.
- **Applying slug changes in default batch:** Breaks URLs and violates D-P3-02.
- **Adding cheerio/lighthouse for Phase 3 gate:** Over-engineering; source + Zod sufficient.
- **Separate schema in TS and JS:** Drift between audit and build guaranteed.
- **Re-adding homepage featured block:** User explicitly removed in Phase 2 UAT.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parse | Custom regex parser | `frontmatter.js` + `yaml` | Notion colon quirks already handled |
| Schema validation | Manual if-checks per field | Zod `postDataSchema` | Consistent errors; Astro integrates natively |
| Description text extraction | Strip markdown by hand | `extractExcerpt()` | Battle-tested in loader path |
| CI failure signaling | Custom GitHub Action | `process.exit(1)` in audit + `yarn build` chain | Zero infra change |
| Slug uniqueness (Notion) | Reimplement | `notion-helpers.mjs` `ensureUniqueSlug` | Already in sync path |

**Key insight:** The project already has 80% of the pipeline; Phase 3 is **policy + wiring**, not a new content system.

## Common Pitfalls

### Pitfall 1: Excerpt Fallback Masks Empty Frontmatter

**What goes wrong:** `parsePost()` sets `description` from body when YAML empty; loader passes that to `parseData`; strict schema never triggers.

**Why it happens:** Phase 1 loader reused parsePost for convenience.

**How to avoid:** In loader, read `parseFrontmatter` directly for `description` field passed to schema; use excerpt only in meta-batch `--apply`.

**Warning signs:** `yarn seo:audit` reports 32 errors but `astro build` still passes before OPT-02.

### Pitfall 2: blog:new Creates `description: ""`

**What goes wrong:** New drafts fail strict schema immediately.

**Why it happens:** Current template line 69: `description: ""`.

**How to avoid:** Generate stub: `description: ${JSON.stringify(extractExcerpt(templateBody, 120))}` or title-based one-liner; keep `draft: true`.

**Warning signs:** `yarn blog:new "test"` then `yarn build` fails on new file.

### Pitfall 3: notion:sync Writes Empty Description

**What goes wrong:** Notion posts without Description property sync with empty string.

**Why it happens:** `meta.description` from Notion can be blank.

**How to avoid:** Before `stringifyFrontmatter`, if `!meta.description.trim()`, set from `extractExcerpt(body, 160)`.

**Warning signs:** Synced posts appear in audit error list.

### Pitfall 4: Batch Apply Corrupts YAML / Body

**What goes wrong:** Regex replacement breaks frontmatter or drops Notion metadata (`notionId`).

**Why it happens:** Naive string splice on `---` blocks.

**How to avoid:** Always `parseFrontmatter` → mutate `data` → `stringifyFrontmatter(content, data)`.

**Warning signs:** Lost `notionSyncedAt`; broken YAML; tests fail.

### Pitfall 5: Enabling Strict Schema Before Batch

**What goes wrong:** CI blocked on 32 posts; cannot deploy.

**Why it happens:** Wrong plan task order (OPT-02 before OPT-01 apply).

**How to avoid:** ROADMAP wave 3-03: apply batch **then** flip schema in same PR or immediately after verified dry-run is clean.

**Warning signs:** `astro build` fails with 32 Zod errors on description.

## Code Examples

### scan-posts helper

```javascript
// scripts/lib/scan-posts.mjs
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';

const POSTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../content/posts'
);

export async function scanPosts() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = await readFile(filePath, 'utf8');
    const { data, content } = parseFrontmatter(raw);
    posts.push({
      file,
      filePath,
      fileSlug: file.replace(/\.md$/, ''),
      data,
      content,
      raw,
    });
  }
  return posts;
}
```

### seo-audit exit code

```javascript
// scripts/seo-audit.mjs (core loop)
import { scanPosts } from './lib/scan-posts.mjs';
import { runAuditRules } from './lib/meta-rules.mjs';

const posts = await scanPosts();
const findings = runAuditRules(posts);
const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warn');

for (const f of findings) {
  console.log(`${f.severity.toUpperCase()} ${f.file}: ${f.message}`);
}
console.log(`\nAudit: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);
```

Source: Standard Node CLI CI pattern [ASSUMED: common practice].

### Astro required description in collection schema

```typescript
// After OPT-02 — content.config.ts optional mirror
import { defineCollection } from 'astro:content';
import { postsLoader } from './loaders/posts-loader';
import { postDataSchema } from '../scripts/lib/post-schema.mjs';

const posts = defineCollection({
  loader: postsLoader(),
  schema: postDataSchema,
});
```

Source: [CITED: docs.astro.build/en/guides/content-collections/] — `description: z.string()` in collection schema.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `description` optional + runtime excerpt | Frontmatter required for published | Phase 3 OPT-02 | Build fails on SEO gaps |
| No CI SEO gate | `seo:audit` in `yarn build` | Phase 3 SEO-05 | Regressions block deploy |
| Manual per-file metadata | `seo:meta-batch --apply` | Phase 3 FLOW-03 | 96-post maintenance scalable |
| Vite `generate-static.mjs` | Astro Content Collections | Phase 1 | Scripts target md + loader only |

**Deprecated/outdated:**

- Relying on `parsePost()` excerpt as SEO description source for validation — replace with explicit frontmatter in Phase 3.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CI needs only `package.json` `build` change, not `deploy.yml` edit | Pattern 3 | Low — verified deploy runs `yarn build` |
| A2 | 30 char minimum description is reasonable error threshold | Audit rules | Medium — may need user preference for 120–160 strict |
| A3 | Draft posts exempt from required description in strict schema | Schema migration | Medium — if user wants all posts strict, update `blog:new` stub |
| A4 | Title auto-trim on apply is **out** (warn only) | meta-batch | Low — design says "修正 title 过长" but manual review safer |
| A5 | Regex dist audit optional, not required for SEO-05 | Pattern 3 | Low — source audit + Zod sufficient |

## Open Questions

1. **Strict description min length: error or warn?**
   - What we know: Design target 120–160 for Top N; batch uses excerpt ~120–160.
   - Recommendation: **warn** for `< 30` chars in audit; **error** only for empty. Planner can tighten in Phase 4.

2. **Should `POST_SCHEMA_STRICT` be env var or hard-coded after wave 3-03?**
   - Recommendation: Hard-code strict in schema after batch merged; remove env toggle to avoid CI/local drift.

3. **Commit batch-applied 96 files in one plan or split?**
   - Recommendation: Single atomic commit in 03-03 with audit green — easier rollback.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts + Astro build | ✓ | v24.12.0 local; CI 20 | — |
| yarn | install/build | ✓ | 1.22.22 | npm |
| GitHub Actions | CI deploy | ✓ | ubuntu-latest | — |
| Notion API | `notion:sync` only | ✓ (local `.env.local`) | — | Skip sync in CI; md files in git |
| zod / yaml | schema + frontmatter | ✓ | 4.4.3 / 2.9.0 | — |

**Missing dependencies with no fallback:** none for Phase 3 core tasks.

**Missing dependencies with fallback:**

- Notion credentials in CI — not needed; content committed to git.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest **4.1.5** (existing) |
| Config file | none — Vitest defaults |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-01 | blog:new template parses + validates | unit | `yarn test tests/post-schema.test.ts -t blog:new` | ❌ Wave 0 |
| FLOW-02 | notion frontmatter shape validates | unit | `yarn test tests/post-schema.test.ts -t notion` | ❌ Wave 0 |
| FLOW-03 | meta-batch dry-run counts gaps; apply fills desc; slug unchanged | unit | `yarn test tests/meta-batch.test.ts` | ❌ Wave 0 |
| SEO-05 | audit exits 1 on error, 0 when clean | unit | `yarn test tests/seo-audit.test.ts` | ❌ Wave 0 |
| OPT-01 | excerpt fill length bounds | unit | `yarn test tests/meta-batch.test.ts -t excerpt` | ❌ Wave 0 |
| OPT-02 | strict schema rejects empty published description | unit | `yarn test tests/post-schema.test.ts -t strict` | ❌ Wave 0 |
| MIGR-03 | loader integration (build) | integration | `POST_SCHEMA_STRICT=1 yarn build` | ❌ manual gate |

### Sampling Rate

- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn seo:audit`
- **Phase gate:** `yarn seo:meta-batch --dry-run` shows 0 would-update **then** `POST_SCHEMA_STRICT=1 yarn build` green

### Wave 0 Gaps

- [ ] `tests/post-schema.test.ts` — shared schema, draft exemption, strict mode
- [ ] `tests/meta-batch.test.ts` — dry-run/apply with temp fixture dir
- [ ] `tests/seo-audit.test.ts` — severity + exit code
- [ ] `scripts/lib/post-schema.mjs` — canonical schema export
- [ ] `scripts/lib/scan-posts.mjs` — shared enumeration
- [ ] `scripts/lib/meta-rules.mjs` — audit rule table
- [ ] `package.json` scripts: `seo:audit`, `seo:meta-batch`, updated `build`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | Static site |
| V5 Input Validation | **yes** | Zod schema on frontmatter; path-limited writes |
| V6 Cryptography | no | — |

### Known Threat Patterns for Node CLI + static site

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal on batch write | Tampering | Resolve paths; only write under `content/posts/`; reject `..` |
| YAML injection in frontmatter | Tampering | `JSON.stringify()` for string fields in templates; Zod types |
| Slug rename data loss | DoS | Default no slug change; `--force-slug` explicit |
| Committing `.env.local` | Info disclosure | Notion token stays local; CI does not run sync |

## Sources

### Primary (HIGH confidence)

- Codebase scan of `content/posts/` — 96 total, 32 empty description, 10 long titles, 19 hash slugs [VERIFIED: codebase]
- `/withastro/docs` via Context7 — Content Collections Zod schema, required `description` [CITED: withastro/docs content collections guides]
- `docs/SEO-MIGRATION-DESIGN.md` §4–§7 — workflow, batch, build, test strategy [VERIFIED: repo doc]
- `.github/workflows/deploy.yml` — `yarn build` CI step [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- [Astro Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/) — `parseData()`, loader `schema` [CITED]
- Phase 1 `01-RESEARCH.md` — script patterns, frontmatter reuse [VERIFIED: repo doc]

### Tertiary (LOW confidence)

- SEO audit regex-on-HTML approach — common static-site pattern [ASSUMED]

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — no new deps; existing zod/yaml/astro patterns
- Architecture: **HIGH** — clear extension of existing scripts + loader
- Pitfalls: **HIGH** — excerpt fallback issue confirmed in `parsePost.js` + loader code

**Research date:** 2026-06-21  
**Valid until:** 2026-07-21 (stable Node/Astro 5 ecosystem)

---

## RESEARCH COMPLETE

**Phase:** 3 - 元数据流水线与 CI  
**Confidence:** HIGH

### Key Findings

- 32/96 posts have empty frontmatter `description`; loader excerpt fallback currently hides this from strict validation.
- Single shared Zod schema in `scripts/lib/post-schema.mjs` should feed loader, audit, and batch scripts — matches existing `site-config.mjs` import pattern.
- `yarn build` → `yarn seo:audit && astro build` satisfies SEO-05 without editing `deploy.yml`.
- meta-batch must use `stringifyFrontmatter` for writes and never change slug unless `--force-slug`.
- OPT-02 requires fixing loader to validate raw YAML description before any excerpt backfill.

### File Created

`.planning/phases/PW-03-ci/03-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Zero new packages; verified zod/yaml/astro |
| Architecture | HIGH | Extends proven script + loader patterns |
| Pitfalls | HIGH | Root cause traced in parsePost + loader |

### Open Questions

- Description min-length as error vs warn (recommend warn < 30, error only empty).
- Hard-code strict schema after batch vs env toggle (recommend hard-code).

### Ready for Planning

Research complete. Planner can now create PLAN.md files (03-01 meta-batch, 03-02 audit+CI, 03-03 batch apply + strict schema).
