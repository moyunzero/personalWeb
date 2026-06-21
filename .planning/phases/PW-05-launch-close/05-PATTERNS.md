# Phase 5: 上线收尾 - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 10 new/modified targets
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/verify-production.mjs` | utility / CLI | request-response | `scripts/run-perf-audit.mjs` + `scripts/seo-audit.mjs` | role-match |
| `tests/verify-production.test.ts` | test | request-response | `tests/phase3-uat-cli.test.ts` | role-match |
| `public/googleef60eaecd43955c6.html` | static asset | file-I/O | `public/404.html` (Astro `public/` copy-through) | exact |
| `public/BingSiteAuth.xml` | static asset | file-I/O | `public/googleef60eaecd43955c6.html` | exact |
| `.github/workflows/deploy.yml` | config / CI | batch | `.github/workflows/deploy.yml` (self) + Phase 3 note | exact |
| `docs/WEBMASTER-SUBMISSION.md` | doc | — | `docs/WEBMASTER-SUBMISSION.md` (self) + `04-PATTERNS.md` LAUNCH doc | exact |
| `.planning/phases/PW-04-content-launch/04-UAT.md` | doc / UAT | — | `.planning/phases/PW-03-ci/03-UAT.md` closure | exact |
| `.planning/REQUIREMENTS.md` | doc / config | — | `.planning/REQUIREMENTS.md` (self) | exact |
| `package.json` | config | batch | `package.json` Phase 3/4 scripts block | exact |
| `.planning/ROADMAP.md` + `.planning/STATE.md` | doc | — | `ROADMAP.md` Phase 4 checkbox pattern | role-match |

**Out of scope for code changes:** Rich Results Test (external Google UI), webmaster account login — Phase 5 documents user attestation in UAT closure only.

---

## Pattern Assignments

### `scripts/verify-production.mjs` (utility / CLI, request-response) — NEW

**Analog:** `scripts/run-perf-audit.mjs` (fetch probe + exit) + `scripts/seo-audit.mjs` (findings loop + exit code)

**Site origin + URL list** (site-config.mjs lines 6–10):

```javascript
export const SITE = {
    origin: 'https://moyunzero.github.io',
    url: (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://moyunzero.github.io/personalWeb').replace(/\/$/, ''),
    basePath: '/personalWeb',
};
```

**Fetch probe pattern** (run-perf-audit.mjs lines 10–16):

```javascript
async function isPreviewUp() {
    try {
        const res = await fetch(PREVIEW_URL, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}
```

**Findings + exit code pattern** (seo-audit.mjs lines 5–17):

```javascript
async function main() {
    const findings = []; // { severity: 'error'|'warn', url, rule, message }
    const errors = findings.filter((f) => f.severity === 'error');
    for (const f of findings) {
        const prefix = f.severity === 'error' ? 'ERROR' : 'WARN';
        console.log(`${prefix} ${f.url}: [${f.rule}] ${f.message}`);
    }
    console.log(`\nProduction verify: ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(errors.length > 0 ? 1 : 0);
}
```

**Retry for Pages propagation** (retry.mjs lines 11–28):

```javascript
export async function withRetry(fn, { retries = 3, delayMs = 2000, label = '请求' } = {}) {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            return await fn();
        } catch (err) {
            if (attempt >= retries) throw err;
            await sleep(delayMs * attempt);
        }
    }
}
```

**Apply:** Create `scripts/verify-production.mjs`:

1. Import `SITE` from `./lib/site-config.mjs`; base = `${SITE.url}/` (trailing slash).
2. Define `CHECKS` array mirroring `docs/WEBMASTER-SUBMISSION.md` 站点信息 table + sample routes:

| rule | url | assert |
|------|-----|--------|
| `home-200` | `${SITE.url}/` | status 200, body contains `墨韵` or hero text |
| `blog-index-200` | `${SITE.url}/blog/` | status 200 |
| `sample-post-200` | `${SITE.url}/blog/2023-03-12-html/` | status 200, `<article` or `BlogPosting` |
| `sitemap-index` | `${SITE.url}/sitemap-index.xml` | status 200, contains `<sitemapindex` |
| `robots-txt` | `${SITE.url}/robots.txt` | status 200, contains `sitemap-index.xml` |
| `google-verify` | `${SITE.url}/googleef60eaecd43955c6.html` | status 200, body contains `google-site-verification:` |
| `bing-verify` | `${SITE.url}/BingSiteAuth.xml` | status 200, body contains `<user>4A7B2111` |

3. Use `fetch(url)` (GET, not HEAD — GH Pages may differ on HEAD). Optional `--skip-network` reads `dist/` only (offline CI fallback).
4. Wrap each check in `withRetry` when `--retries=3` (default) — Pages deploy lag 1–3 min per WEBMASTER-SUBMISSION.md.
5. Support `PRODUCTION_URL` env override (same pattern as `SITE_URL`).
6. **Do NOT** chain into `yarn build` — manual/post-deploy operator script (D-P4-11 parity).

**Shebang + main catch** (seo-audit.mjs lines 1, 20–22):

```javascript
#!/usr/bin/env node
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

---

### `tests/verify-production.test.ts` (test, request-response) — NEW

**Analog:** `tests/phase3-uat-cli.test.ts`

**Structure** (phase3-uat-cli.test.ts lines 1–12, 38–41):

```typescript
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

function run(cmd: string) {
    return execSync(cmd, { cwd: root, encoding: 'utf8' });
}
```

**Deploy wiring grep** (phase3-uat-cli.test.ts lines 38–41):

```typescript
    it('deploy.yml runs yarn build', () => {
        const deploy = readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
        expect(deploy).toContain('yarn build');
    });
```

**Apply:**

```typescript
describe('Phase 5 — production verify (offline)', () => {
    it('dist contains verification files copied from public/', () => {
        expect(readFileSync(path.join(root, 'dist/googleef60eaecd43955c6.html'), 'utf8'))
            .toMatch(/google-site-verification:/);
        expect(readFileSync(path.join(root, 'dist/BingSiteAuth.xml'), 'utf8'))
            .toMatch(/4A7B2111/);
    });

    it('package.json exposes verify:prod script', () => {
        const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
        expect(pkg.scripts['verify:prod']).toMatch(/verify-production/);
    });
});

describe('Phase 5 — production verify (network)', () => {
    it.skipIf(!process.env.PRODUCTION_VERIFY)('live URLs return 200', () => {
        const out = run('yarn verify:prod');
        expect(out).toMatch(/Production verify: 0 error/);
    });
});
```

Gate live test behind `PRODUCTION_VERIFY=1` — default CI runs offline dist checks only.

---

### `public/googleef60eaecd43955c6.html` + `public/BingSiteAuth.xml` (static asset, file-I/O)

**Analog:** Existing verification files + Astro `public/` passthrough

**Google file** (public/googleef60eaecd43955c6.html — full file):

```
google-site-verification: googleef60eaecd43955c6.html
```

**Bing file** (public/BingSiteAuth.xml lines 1–5):

```xml
<?xml version="1.0"?>
<users>
	<user>4A7B2111400C1BCBC41A6EDA43EA1AAC</user>
</users>
```

**404.html placement pattern** (public/404.html lines 1–7) — same `public/` root, copied to `dist/`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
```

**Apply:**

- Files **already exist** — Phase 5 verifies they appear in `dist/` after `yarn build`, not regenerate tokens.
- Filename must match Search Console / Bing dashboard exactly — **never rename** without re-verifying platforms.
- Document in WEBMASTER-SUBMISSION.md: files live at repo root `public/`, deploy via normal `git push` → Actions (lines 36–41 of doc).
- If adding Baidu HTML verification later: same pattern — single file in `public/`, one line or minimal HTML, table row in 站点信息.

**Dist assertion** (sitemap.test.ts lines 8–14):

```typescript
function readDist(relative: string): string {
    const filePath = path.join(distRoot, relative);
    if (!existsSync(filePath)) {
        throw new Error(`Missing built file: ${filePath}. Run yarn build first.`);
    }
    return readFileSync(filePath, 'utf8');
}
```

Apply to `dist/googleef60eaecd43955c6.html` and `dist/BingSiteAuth.xml`.

---

### `.github/workflows/deploy.yml` (config / CI, batch) — MODIFY (minimal)

**Analog:** Current deploy.yml (full file) + Phase 3 PATTERNS "CI unchanged" rule

**Current workflow** (deploy.yml lines 24–52):

```yaml
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install
      - name: Build
        run: yarn build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Apply:**

- **Keep** `yarn build` (includes `seo:audit`) — do not add `perf:audit` or `verify:prod` to CI (D-P4-11, flaky network on shared runners).
- **Optional:** Add workflow comment above Deploy step documenting post-deploy manual step: `yarn verify:prod` after Pages propagation.
- **Do NOT** add secrets, custom domain, or Baidu push tokens.
- Artifact path stays `./dist` — verification files must be inside artifact (confirmed via offline test).

**Phase 1 switch pattern** (01-04-PLAN.md verify):

```bash
grep -q 'yarn build' .github/workflows/deploy.yml && ! grep -q 'vite build' .github/workflows/deploy.yml
```

---

### `docs/WEBMASTER-SUBMISSION.md` (doc) — MODIFY

**Analog:** `docs/WEBMASTER-SUBMISSION.md` (self) + `04-PATTERNS.md` LAUNCH doc section

**站点信息 table** (WEBMASTER-SUBMISSION.md lines 5–13):

```markdown
| 项 | URL |
|----|-----|
| 站点首页 | https://moyunzero.github.io/personalWeb/ |
| Sitemap | https://moyunzero.github.io/personalWeb/sitemap-index.xml |
| robots.txt | https://moyunzero.github.io/personalWeb/robots.txt |
| Google 验证文件 | https://moyunzero.github.io/personalWeb/googleef60eaecd43955c6.html |
| Bing 验证文件 | https://moyunzero.github.io/personalWeb/BingSiteAuth.xml |
```

**Launch checklist** (WEBMASTER-SUBMISSION.md lines 63–70):

```markdown
## 上线检查清单

- [ ] `yarn build` 0 error
- [ ] `yarn seo:audit` 0 error
- [ ] `yarn perf:audit` 通过（Performance ≥ 85，LCP < 2.5s）
- [ ] Google / 必应 / 百度 三平台 sitemap 已提交
- [ ] Rich Results Test 上述 3 篇通过
- [ ] 生产环境抽查 `/blog/`、样本文章、分类页可访问
```

**Apply:**

1. Add **§生产环境验证** after 部署顺序:

```markdown
## 生产环境验证

部署完成并等待 1–3 分钟后：

\`\`\`bash
yarn verify:prod
\`\`\`

脚本检查首页、博客、样本文章、sitemap、robots、Google/Bing 验证文件 HTTP 200。失败时先确认 GitHub Actions 部署绿，再重试。
```

2. Update **本地维护命令** block — add `yarn verify:prod`.
3. Add checklist item: `- [ ] yarn verify:prod` 0 error.
4. Keep Rich Results table unchanged (manual external tool).

---

### `.planning/phases/PW-04-content-launch/04-UAT.md` (doc / UAT) — MODIFY (closure)

**Analog:** `.planning/phases/PW-03-ci/03-UAT.md` complete closure

**Closed UAT frontmatter** (03-UAT.md lines 1–11):

```yaml
---
status: complete
phase: PW-03-ci
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md
started: 2026-06-21T21:35:00.000Z
updated: 2026-06-21T21:12:30.000Z
---

## Current Test

[testing complete — automated via `yarn test:uat:3`]
```

**04-UAT pending items** (04-UAT.md lines 71–79):

```markdown
### 11. Webmaster Sitemap Submission (LAUNCH-01 manual)
result: pending
note: Requires user accounts — cannot automate in CI

### 12. Rich Results Test — 3 Posts (ROADMAP criterion)
result: pending
note: External Google tool — user manual verification
```

**Apply:**

1. After user confirms webmaster + Rich Results (Phase 5 human checkpoint), update tests 11–12:

```markdown
result: pass
note: User confirmed YYYY-MM-DD per Phase 5 launch-close checkpoint
```

2. Update frontmatter: `status: complete`, refresh `updated` timestamp.
3. Replace `## Current Test` with `[testing complete — Phase 5 launch-close]`.
4. Update Summary: `passed: 13`, `pending: 0`.
5. Add to Automation block:

```bash
yarn verify:prod   # post-deploy production URL smoke
```

**Do NOT** mark pass without user attestation — mirror 04-03-PLAN Task 4 `resume-signal: approved`.

---

### `.planning/REQUIREMENTS.md` (doc / config) — MODIFY

**Analog:** `.planning/REQUIREMENTS.md` (self) — checkbox + traceability table

**Checkbox format** (REQUIREMENTS.md lines 12–16):

```markdown
- [ ] **MIGR-01**: 构建产出 Astro 静态站点，`base` 为 `/personalWeb/`，输出至 `dist/`
```

**Traceability table** (REQUIREMENTS.md lines 78–106):

```markdown
| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | Phase 1 | Pending |
```

**Apply (Phase 5 milestone close):**

1. Flip **all 27 v1.0 requirement checkboxes** from `- [ ]` to `- [x]` when Phase 5 UAT passes (after 04-UAT closure + `yarn verify:prod` green).
2. Update Traceability **Status** column: `Pending` → `Done` for every mapped row.
3. Append footer:

```markdown
*Last updated: 2026-06-21 after Phase 5 launch-close*
```

4. **Do NOT** check v2 requirements (INFRA-01, ANAL-01) — Out of Scope section unchanged.

**ROADMAP sync** (ROADMAP.md lines 13–16, 104–114):

```markdown
- [x] **Phase 4: 内容优化与上线** — ...
- [ ] **Phase 5: 上线收尾** — 生产 URL 验证、UAT 关闭、需求清单归档
```

Mark Phase 4 complete checkbox; add Phase 5 line if not present; update milestone v1.0 to complete in STATE.md.

---

### `package.json` (config) — MODIFY

**Analog:** Phase 3/4 scripts block (package.json lines 6–23)

**Add:**

```json
"verify:prod": "node scripts/verify-production.mjs",
"test:uat:5": "vitest --run tests/verify-production.test.ts"
```

**Constraints** (Phase 3 pattern):

```json
"build": "yarn seo:audit && astro build"
```

- Do **not** append `verify:prod` to `build` or deploy.yml.
- Optional: document `PRODUCTION_VERIFY=1 yarn test:uat:5` for live network suite in README §SEO 与上线.

---

## Shared Patterns

### Site URL single source of truth
**Source:** `scripts/lib/site-config.mjs`
**Apply to:** `verify-production.mjs`, WEBMASTER-SUBMISSION.md tables, sitemap.test.ts expectations

```javascript
url: (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://moyunzero.github.io/personalWeb').replace(/\/$/, ''),
```

### CLI exit codes
**Source:** `scripts/seo-audit.mjs` lines 17–22
**Apply to:** `verify-production.mjs`

```javascript
process.exit(errors.length > 0 ? 1 : 0);
main().catch((err) => { console.error(err); process.exit(1); });
```

### Dist file presence checks (offline)
**Source:** `tests/sitemap.test.ts` lines 8–14, 24–27
**Apply to:** `verify-production.test.ts` verification file assertions

### UAT closure ceremony
**Source:** `03-UAT.md` + `04-UAT.md`
**Apply to:** 04-UAT closure, new `05-UAT.md`

| Field | Open | Closed |
|-------|------|--------|
| frontmatter `status` | `partial` | `complete` |
| `## Current Test` | paused / active | `[testing complete]` |
| Manual tests | `pending` | `pass` + user date note |
| Summary pending | > 0 | 0 |

### Post-deploy operator sequence
**Source:** `docs/WEBMASTER-SUBMISSION.md` 部署顺序 + `04-03-PLAN.md` Task 4

```bash
git push                    # → deploy.yml → GitHub Pages
# wait 1–3 min
yarn verify:prod            # production smoke
# manual: webmaster consoles + Rich Results (user attestation)
```

### Requirements ↔ Phase traceability
**Source:** `.planning/REQUIREMENTS.md` Traceability table
**Apply to:** Phase 5 closes all Phase 1–4 reqs atomically — verify each ID has passing UAT evidence before checking boxes.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Live production HTTP smoke script | utility / CLI | request-response | No existing `fetch` against github.io — `run-perf-audit.mjs` only hits localhost; implement new script from perf-audit + seo-audit patterns |

**Planner fallback:** RESEARCH deferred Lighthouse-in-CI; Phase 5 uses optional `PRODUCTION_VERIFY=1` for network tests, default offline dist checks.

---

## Metadata

**Analog search scope:** `scripts/`, `scripts/lib/`, `public/`, `docs/`, `tests/`, `.github/workflows/`, `.planning/phases/PW-03-ci/03-UAT.md`, `.planning/phases/PW-04-content-launch/04-UAT.md`, `.planning/phases/PW-04-content-launch/04-PATTERNS.md`, `.planning/REQUIREMENTS.md`
**Files scanned:** ~22
**Pattern extraction date:** 2026-06-21
