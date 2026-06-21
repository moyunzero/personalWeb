# Phase 3: 元数据流水线与 CI - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 14 new/modified targets
**Analogs found:** 12 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/lib/post-schema.mjs` | model / utility | transform | `src/loaders/posts-loader.ts` (schema block) | exact |
| `scripts/lib/scan-posts.mjs` | utility | file-I/O | `scripts/lib/load-posts.mjs` | exact |
| `scripts/lib/meta-rules.mjs` | utility / service | transform | `src/blog/getCategories.js` + `scripts/notion-sync.mjs` warnings | partial |
| `scripts/seo-meta-batch.mjs` | utility / CLI | batch / file-I/O | `scripts/notion-sync.mjs` + `scripts/new-post.mjs` | role-match |
| `scripts/seo-audit.mjs` | utility / CLI | batch / transform | `scripts/new-post.mjs` (exit) + `scripts/lib/load-posts.mjs` | role-match |
| `scripts/new-post.mjs` | utility / CLI | file-I/O | `scripts/new-post.mjs` (self) | exact |
| `scripts/notion-sync.mjs` | utility / CLI | file-I/O / batch | `scripts/notion-sync.mjs` (self) | exact |
| `src/loaders/posts-loader.ts` | middleware / integration | file-I/O / transform | `src/loaders/posts-loader.ts` + `scripts/lib/load-posts.mjs` | exact |
| `src/content.config.ts` | config / model | transform | `src/content.config.ts` + loader schema | exact |
| `src/blog/parsePost.js` | utility | transform | `src/blog/parsePost.js` (self) | exact |
| `package.json` | config | batch | `package.json` | exact |
| `tests/post-schema.test.ts` | test | transform | `tests/frontmatter.test.ts` | exact |
| `tests/meta-batch.test.ts` | test | batch / file-I/O | `tests/frontmatter.test.ts` | role-match |
| `tests/seo-audit.test.ts` | test | transform | `tests/frontmatter.test.ts` | role-match |

**Unchanged (consumed, not modified):** `.github/workflows/deploy.yml` (runs `yarn build`), `scripts/lib/site-config.mjs` (audit `site-config` rule).

---

## Pattern Assignments

### `scripts/lib/post-schema.mjs` (model / utility, transform)

**Analog:** `src/loaders/posts-loader.ts` schema (lines 48-65)

**Field list to mirror** (posts-loader.ts lines 48-65):

```typescript
        schema: z.object({
            slug: z.string(),
            title: z.string(),
            description: z.string().optional(),
            publishedAt: z.string(),
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
        }),
```

**Import pattern for Node scripts** — use `zod` directly (not `astro/zod`):

```javascript
import { z } from 'zod';
```

**TS import from `.mjs`** — follow `site-config.mjs` cross-tier pattern (astro.config.mjs lines 5-5, src/lib/site.ts lines 1-1):

```javascript
import { SITE } from './scripts/lib/site-config.mjs';
```

```typescript
export { SITE } from '../../scripts/lib/site-config.mjs';
```

**Apply:** Export `postDataSchema` + `validatePostData()` from `scripts/lib/post-schema.mjs`. Loader imports `postDataSchema` and sets `schema: postDataSchema` on loader object. Use `superRefine` for draft exemption + strict published `description` (RESEARCH Pattern 1). Scripts use `import { z } from 'zod'`; loader may use same export (Zod 4.x compatible).

**safeParse wrapper pattern:**

```javascript
export function validatePostData(data) {
  return postDataSchema.safeParse(data);
}
```

---

### `scripts/lib/scan-posts.mjs` (utility, file-I/O)

**Analog:** `scripts/lib/load-posts.mjs` (lines 1-42)

**Directory + import pattern** (load-posts.mjs lines 1-8):

```javascript
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/blog/frontmatter.js';
import { extractExcerpt } from '../../src/blog/excerpt.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const POSTS_DIR = path.join(root, 'content/posts');
```

**Scan loop pattern** (load-posts.mjs lines 13-21):

```javascript
export async function loadPostsForBuild({ includeDrafts = false } = {}) {
    const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md'));
    const posts = [];

    for (const file of files) {
        const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
        const { data, content } = parseFrontmatter(raw);
        const draft = Boolean(data.draft);
        if (draft && !includeDrafts) continue;
```

**Apply:** Extend return shape with `file`, `filePath`, `fileSlug`, `raw` for batch write/audit. Do **not** call `extractExcerpt` here — audit and schema need raw frontmatter `description`. Richer field normalization lives in `scripts/lib/build-posts-index.mjs` (lines 43-60) if meta-batch needs categories/tags:

```javascript
        const fileSlug = file.replace(/\.md$/, '');
        const slug = data.slug || fileSlug;
```

---

### `scripts/lib/meta-rules.mjs` (utility / service, transform)

**Analog:** `src/blog/getCategories.js` (validateCategoryIds) + `scripts/notion-sync.mjs` (category warnings)

**Category validation** (getCategories.js lines 35-42):

```javascript
export function validateCategoryIds(categoryIds) {
    const known = new Set(getCategories().map((c) => c.id));
    const unknown = categoryIds.filter((id) => !known.has(id));
    if (unknown.length > 0 && import.meta.env.DEV) {
        console.warn(
            `[blog] 未在 content/categories.json 中注册的分类: ${unknown.join(', ')}`
        );
    }
}
```

**Apply in audit:** Import `getCategories()` from `src/blog/getCategories.js`; emit **error** (not warn) for unknown category ids per RESEARCH audit table. Reuse `content/categories.json` ids Set — same source as loader.

**Warning emission pattern** (notion-sync.mjs lines 281-283):

```javascript
    for (const w of meta.warnings) {
        console.warn(`  ⚠ ${w}`);
    }
```

**Apply:** Export `runAuditRules(posts)` returning `{ file, rule, severity: 'error'|'warn', message }[]`. No existing audit-rules file — implement rule table from RESEARCH Pattern 3; structure findings for seo-audit exit code.

**Site config check** — import `SITE` from `./site-config.mjs` (lines 2-10):

```javascript
export const SITE = {
    name: '墨韵',
    title: '墨韵 · 博客',
    description: '日常、笔记与思考 — 技术文章、阅读笔记与开发实践。',
    // ...
};
```

---

### `scripts/seo-meta-batch.mjs` (utility / CLI, batch / file-I/O)

**Analog:** `scripts/notion-sync.mjs` (dry-run + write) + `scripts/new-post.mjs` (CLI args)

**CLI flag parsing** (notion-sync.mjs lines 86-102):

```javascript
function parseCli(argv) {
    let dryRun = false;
    // ...
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--dry-run') dryRun = true;
        // ...
    }
    return { dryRun, pageId, fullSync };
}
```

**Apply:** Default to dry-run; `--apply` sets write mode; `--force-slug` opt-in only (D-P3-02).

**Frontmatter write pattern** (notion-sync.mjs lines 314-331):

```javascript
        const frontmatter = {
            title: meta.title,
            slug,
            description: meta.description,
            author: getEnv('NOTION_DEFAULT_AUTHOR') || '墨韵',
            date: meta.date,
            categories: meta.categories,
            tags: meta.tags,
            ...(coverPath ? { cover: coverPath } : {}),
            draft: false,
            notionId: meta.notionId,
            notionSyncedAt: new Date().toISOString(),
        };

        const fileContent = stringifyFrontmatter(body, frontmatter);
        await mkdir(path.dirname(postPath), { recursive: true });
        await writeFile(postPath, fileContent, 'utf8');
```

**Apply:** Always `parseFrontmatter(raw)` → mutate `data.description` only (unless `--force-slug`) → `stringifyFrontmatter(content, data)`. Preserve `notionId`, `notionSyncedAt`, and all other keys — never regex-splice `---` blocks (RESEARCH Pitfall 4).

**Description fill** (load-posts.mjs lines 30-31):

```javascript
            description: String(data.description || '').trim() || extractExcerpt(body),
```

**Apply on `--apply` only:** if `!data.description?.trim()`, set `data.description = extractExcerpt(content, 160)`.

**Slug immutability** — contrast with notion-sync slug migration (notion-sync.mjs lines 231-241, 267-274): meta-batch must **not** call `removeStalePostFile` or rename files by default. Hash-slug detection analog: `buildPostSlug` / `notionIdSuffix` in notion-helpers.mjs (lines 52-71) for **suggest-only** dry-run output.

**Entry point + exit** (new-post.mjs lines 58-60):

```javascript
if (await exists(postPath)) {
    console.error(`已存在: content/posts/${slug}.md`);
    process.exit(1);
}
```

**Apply:** Exit 1 only on IO/parse failures; dry-run always exit 0.

---

### `scripts/seo-audit.mjs` (utility / CLI, batch / transform)

**Analog:** `scripts/new-post.mjs` (shebang + exit) + scan from `load-posts.mjs`

**Shebang + root resolution** (new-post.mjs lines 1-12):

```javascript
#!/usr/bin/env node
/**
 * ...
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
```

**Fatal exit pattern** (notion-sync.mjs lines 473-485):

```javascript
main().catch((err) => {
    console.error('Notion 同步失败:', err.message);
    // ...
    process.exit(1);
});
```

**Apply:** After `runAuditRules`, filter errors vs warnings; `process.exit(errors.length > 0 ? 1 : 0)`. No new GitHub Actions steps — CI inherits via `yarn build` chain.

**Core loop** (from RESEARCH — implement using `scanPosts` + `meta-rules`):

```javascript
const posts = await scanPosts();
const findings = runAuditRules(posts);
const errors = findings.filter((f) => f.severity === 'error');
console.log(`\nAudit: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);
```

---

### `scripts/new-post.mjs` (utility / CLI, file-I/O) — MODIFY

**Analog:** `scripts/new-post.mjs` (self)

**Current template problem** (lines 66-77):

```javascript
const template = `---
title: ${JSON.stringify(title)}
slug: ${slug}
description: ""
author: 墨韵
date: ${new Date().toISOString().slice(0, 10)}
categories:
${categoryYaml}
tags: []
draft: true
featured: false
---

# ${title}

在这里开始写作…
```

**Apply (FLOW-01):** Import `extractExcerpt` from `../src/blog/excerpt.js`. After building body stub, set:

```javascript
description: ${JSON.stringify(extractExcerpt(`# ${title}\n\n在这里开始写作…`, 120))}
```

Keep `draft: true`. Use `JSON.stringify(title)` for YAML safety (existing pattern line 67). Optionally call `validatePostData()` on generated frontmatter in test.

**Slug generation** (lines 34-42) — keep as-is; readable slugs, not hash.

---

### `scripts/notion-sync.mjs` (utility / CLI, file-I/O) — MODIFY

**Analog:** `scripts/notion-sync.mjs` (self) + excerpt fallback from `load-posts.mjs`

**Description from Notion** (lines 145-145, 317-317):

```javascript
    const description = getRichText(props[PROP.description]);
    // ...
            description: meta.description,
```

**Apply (FLOW-02):** After body fetch (line 290), before frontmatter object:

```javascript
import { extractExcerpt } from '../src/blog/excerpt.js';

let description = meta.description.trim();
if (!description) {
    description = extractExcerpt(body, 160);
}
// frontmatter: { ..., description, ... }
```

**Post-sync validation:** Import `validatePostData` from `./lib/post-schema.mjs`; log Zod errors before write (non-blocking in sync, or fail loudly — prefer warn + still write filled description).

**Existing imports to preserve** (lines 20-20):

```javascript
import { stringifyFrontmatter, parseFrontmatter } from '../src/blog/frontmatter.js';
```

---

### `src/loaders/posts-loader.ts` (middleware / integration, file-I/O) — MODIFY

**Analog:** `src/loaders/posts-loader.ts` (self) + raw-description read from `load-posts.mjs`

**Current loader loop** (lines 12-39):

```typescript
        load: async ({ store, parseData }) => {
            const dir = path.resolve(POSTS_DIR);
            const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));

            for (const file of files) {
                const filepath = `content/posts/${file}`;
                const raw = await readFile(path.join(dir, file), 'utf8');
                const parsed = parsePost(filepath, raw);

                const data = await parseData({
                    id: parsed.id,
                    data: {
                        slug: parsed.id,
                        title: parsed.title,
                        description: parsed.description,
                        publishedAt: parsed.publishDate,
                        // ...
                    },
                });
```

**Critical fix (OPT-02):** Import `parseFrontmatter` from `../blog/frontmatter.js` and `postDataSchema` from `../../scripts/lib/post-schema.mjs`. Pass **raw** YAML description to `parseData`:

```typescript
import { parseFrontmatter } from '../blog/frontmatter.js';
import { postDataSchema } from '../../scripts/lib/post-schema.mjs';

const { data: fm } = parseFrontmatter(raw);
const rawDesc = String(fm.description ?? '').trim();
// parseData({ data: { ..., description: rawDesc, ... } })
// Still use parsePost() for body, categories, coverImage, readTime mapping
```

**Schema replacement** (line 48): `schema: postDataSchema` — remove inline `z.object({...})`.

**Excerpt fallback location** — `parsePost.js` line 58 must NOT feed schema validation:

```javascript
    const description = String(data.description || '').trim() || extractExcerpt(body);
```

Keep for display/runtime only post-OPT-02, or remove fallback entirely once strict schema ships.

---

### `src/content.config.ts` (config / model) — MODIFY (optional)

**Analog:** `src/content.config.ts` (lines 1-8)

```typescript
import { defineCollection } from 'astro:content';
import { postsLoader } from './loaders/posts-loader';

const posts = defineCollection({
    loader: postsLoader(),
});

export const collections = { posts };
```

**Apply:** Optional mirror — if schema stays on loader only, no change required. If duplicating for Astro docs parity:

```typescript
import { postDataSchema } from '../scripts/lib/post-schema.mjs';

const posts = defineCollection({
    loader: postsLoader(),
    schema: postDataSchema,
});
```

Prefer single definition on loader `schema` property to avoid drift (RESEARCH Anti-Pattern: separate TS/JS schemas).

---

### `src/blog/parsePost.js` (utility, transform) — MODIFY

**Analog:** `src/blog/parsePost.js` (lines 31-79)

**Excerpt backfill to isolate** (lines 57-58):

```javascript
    const body = content.trim();
    const description = String(data.description || '').trim() || extractExcerpt(body);
```

**Apply:** Post OPT-02 wave, either (a) remove `|| extractExcerpt(body)` so description reflects frontmatter only, or (b) keep fallback strictly for client/display paths that read parsed posts outside Content Collections. Loader must not use `parsed.description` for schema input.

**Category validation to reuse in audit** (lines 45-45):

```javascript
    validateCategoryIds(categories);
```

---

### `package.json` (config, batch) — MODIFY

**Analog:** `package.json` (lines 6-14)

**Current scripts** (lines 6-14):

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "lint": "eslint .",
    "preview": "astro preview",
    "test": "vitest --run",
    "test:watch": "vitest",
    "blog:new": "node scripts/new-post.mjs",
    "notion:sync": "node scripts/notion-sync.mjs"
  },
```

**Apply (SEO-05, D-P3-05):**

```json
    "seo:audit": "node scripts/seo-audit.mjs",
    "seo:meta-batch": "node scripts/seo-meta-batch.mjs",
    "build": "yarn seo:audit && astro build",
    "build:astro": "astro build",
```

**CI unchanged** — `.github/workflows/deploy.yml` lines 41-42 already runs `yarn build`:

```yaml
      - name: Build
        run: yarn build
```

---

### `tests/post-schema.test.ts` (test, transform) — NEW

**Analog:** `tests/frontmatter.test.ts`

**Structure** (frontmatter.test.ts lines 1-4):

```typescript
import { describe, expect, it } from 'vitest';
import { parseFrontmatter, normalizeFrontmatterYaml } from '../src/blog/frontmatter.js';

describe('parseFrontmatter', () => {
```

**Apply:**

```typescript
import { describe, expect, it } from 'vitest';
import { postDataSchema, validatePostData } from '../scripts/lib/post-schema.mjs';

describe('postDataSchema', () => {
  it('allows empty description for draft posts', () => { /* draft: true */ });
  it('rejects empty description for published when strict', () => { /* POST_SCHEMA_STRICT=1 */ });
});
```

Use `process.env.POST_SCHEMA_STRICT = '1'` in test scope for strict-mode cases.

---

### `tests/meta-batch.test.ts` (test, batch / file-I/O) — NEW

**Analog:** `tests/frontmatter.test.ts` + write patterns from `notion-sync.mjs`

**Apply:** Use Vitest `describe/it/expect`. Create temp dir with fixture `.md` files; import batch functions or spawn CLI. Assert:

- dry-run does not mutate files
- `--apply` fills empty `description` via excerpt
- slug unchanged without `--force-slug`

**Frontmatter round-trip assertion** (frontmatter.test.ts lines 19-30):

```typescript
    it('parses Notion-style YAML without space after colon', () => {
        const raw = `---
title: Notion Post
description:中文摘要
---
正文`;

        const { data } = parseFrontmatter(raw);
        expect(data.description).toBe('中文摘要');
    });
```

Use after apply to verify YAML not corrupted.

---

### `tests/seo-audit.test.ts` (test, transform) — NEW

**Analog:** `tests/frontmatter.test.ts`

**Apply:** Unit-test `runAuditRules()` from `meta-rules.mjs` with fixture post objects (no subprocess). Test matrix:

| Fixture | Expected |
|---------|----------|
| published, empty description | error `desc-missing` |
| published, description present | no error |
| draft, empty description | no error (draft exempt) |
| title length > 60 | warn |

For exit-code integration, optional single test spawning `node scripts/seo-audit.mjs` via `child_process` — keep minimal per Karpathy scope.

---

## Shared Patterns

### Frontmatter parse/stringify (all scripts)
**Source:** `src/blog/frontmatter.js`
**Apply to:** `scan-posts.mjs`, `seo-meta-batch.mjs`, `notion-sync.mjs`, `new-post.mjs` (via template only)

**Parse** (lines 18-38):

```javascript
export function parseFrontmatter(raw) {
    const match = raw.match(FRONTMATTER_RE);
    const yamlBlock = normalizeFrontmatterYaml(match[1]);
    const data = parseYaml(yamlBlock);
    return { data, content: match[2] };
}
```

**Stringify** (lines 46-49):

```javascript
export function stringifyFrontmatter(content, data) {
    const yaml = stringifyYaml(data).trimEnd();
    const body = content.replace(/^\n+/, '');
    return `---\n${yaml}\n---\n\n${body}`;
}
```

### Description extraction
**Source:** `src/blog/excerpt.js`
**Apply to:** meta-batch `--apply`, notion-sync fallback, blog:new stub

```javascript
export function extractExcerpt(markdown, maxLength = 120) {
    const text = markdown
        .replace(/```[\s\S]*?```/g, ' ')
        // ...
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}…`;
}
```

### Cross-tier `.mjs` import from TypeScript
**Source:** `astro.config.mjs`, `src/lib/site.ts`
**Apply to:** `posts-loader.ts` → `post-schema.mjs`, optional `content.config.ts`

```typescript
import { postDataSchema } from '../../scripts/lib/post-schema.mjs';
```

Node scripts import from `src/blog/*.js` via relative path — established in `load-posts.mjs` line 4.

### Post directory enumeration
**Source:** `scripts/lib/load-posts.mjs`, `scripts/lib/build-posts-index.mjs`, `scripts/lib/notion-helpers.mjs` (`buildNotionIdIndex`)
**Apply to:** `scan-posts.mjs`, audit, meta-batch

```javascript
const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md'));
```

### Slug identity
**Source:** `src/blog/parsePost.js` (lines 33-38), `scripts/lib/notion-helpers.mjs` (`buildPostSlug`)

```javascript
const slug = data.slug || fileSlug;
```

Audit rule `slug-filename`: compare `data.slug` to `file.replace(/\.md$/, '')`.

### YAML-safe string fields in templates
**Source:** `scripts/new-post.mjs` (line 67)

```javascript
title: ${JSON.stringify(title)}
```

Apply to any generated frontmatter string in blog:new and meta-batch.

### CLI exit codes for CI
**Source:** `scripts/new-post.mjs` (line 60), `scripts/notion-sync.mjs` (line 484)

```javascript
process.exit(1); // on fatal error
process.exit(errors.length > 0 ? 1 : 0); // audit
```

### Vitest conventions
**Source:** `tests/frontmatter.test.ts`
**Apply to:** all new test files

- ESM imports with `.js` / `.mjs` extensions
- `describe` / `it` / `expect` from `vitest`
- Run via `yarn test` (`vitest --run`)

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/lib/meta-rules.mjs` | utility | transform | No existing SEO audit rule engine — implement from RESEARCH Pattern 3 rule table |
| `scripts/seo-audit.mjs` | CLI | batch | No pre-build audit script in repo; compose from scan + rules + exit pattern |

**Planner fallback:** RESEARCH.md Patterns 2–3 for meta-batch flags, audit severity table, and phased OPT-01→OPT-02 migration.

---

## Metadata

**Analog search scope:** `scripts/`, `scripts/lib/`, `src/loaders/`, `src/blog/`, `src/content.config.ts`, `tests/`, `package.json`, `.github/workflows/deploy.yml`, `astro.config.mjs`, `src/lib/site.ts`
**Files scanned:** ~22
**Pattern extraction date:** 2026-06-21
