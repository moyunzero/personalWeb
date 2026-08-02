# 0006. 博客收录验收自动化（可收录 + GSC 可选真收录）

**Date**: 2026-08-01
**Status**: Accepted

## Summary

增加一条本地命令 `yarn seo:index-check`，用来验收博客是否「可被搜索引擎收录」，并在配置了 Google Search Console（站长工具）服务账号时，抽查若干篇是否「已被编入索引」。没有密钥时只做可收录层，不把未收录当成默认失败。不改 CI，也不爬取 Google 搜索结果页。

## Context

站点已在 GitHub Pages（`moyunzero.github.io/personalWeb`）上线，具备 robots、sitemap、canonical、BlogPosting JSON-LD，以及 `yarn verify:prod` 生产冒烟。人工仍难快速判断：技术门禁是否仍绿，以及 Google 是否真的收录了文章。

`verify:prod` 只覆盖首页、站长验证文件、博客列表链接与单篇可访问性，不解析 sitemap，也不查询索引状态。用浏览器抓 `site:` 结果不稳定且易被反爬。真收录状态需要 Search Console 的 URL Inspection API，并依赖本机服务账号密钥。

若不做决策，维护者只能反复手工打开站长后台，也无法用一条命令做发布后验收。

## Requirements

**User stories**:
- As a 维护者, I want 一条命令检查 robots / sitemap / 抽样文章可抓取且无 noindex, so that 我能确认站点仍具备被收录的技术条件。
- As a 维护者, I want 在配置了 GSC 服务账号时自动抽查若干 URL 的索引状态, so that 我能区分「可收录」与「已收录」。
- As a 维护者, I want 默认不因「尚未收录」而失败, so that 个人站异步收录不会误报成构建/验收失败。

**Acceptance criteria**:
- **AC-1**: `package.json` 注册 `seo:index-check`，指向新脚本（建议 `scripts/seo-index-check.mjs`）。命令可独立运行，不修改 `.github/workflows/ci.yml`。
- **AC-2**: A 层（始终运行）：拉取生产 `robots.txt`，断言允许抓取（`Allow: /` 或等价未禁止站点根路径），并包含指向本站 sitemap 的 `Sitemap:` 行。
- **AC-3**: A 层：拉取 sitemap index 与其引用的 urlset，解析出博客文章 URL（路径含 `/blog/` 且非分类列表页），数量 ≥ 1；失败则 exit 1。
- **AC-4**: A 层：从博客 URL 中选取样本（默认 5 篇，可用 `--sample N` 覆盖；不足则全取），对每篇 GET：HTTP 200、HTML 中无 `noindex`、存在 `BlogPosting` JSON-LD（或等价 `application/ld+json` 且 `@type` 含 BlogPosting）。任一样本失败则 exit 1。
- **AC-5**: A 层：复用或对齐现有站长验证可达性检查（Google / Bing 验证文件 200 且内容标记存在）。失败则 exit 1。
- **AC-6**: B 层：当环境变量 `GOOGLE_APPLICATION_CREDENTIALS` 指向可读 JSON 密钥文件时，对同一批样本调用 Search Console URL Inspection API；打印每篇 `indexingState` / `coverageState`（或 API 等价字段）。未设置或文件不可读时跳过 B 层，打印明确 `SKIP` 说明，且不因此 exit 1。
- **AC-7**: B 层默认：样本「未收录」只计 warning，进程 exit 0（A 层全绿时）。提供 `--strict`：此时未收录或 Inspection 调用失败改为 exit 1。API 鉴权/权限错误在非 `--strict` 下为 warning + exit 0，并打印可操作提示（检查服务账号是否已加入 GSC 资源）。
- **AC-8**: 默认生产基址来自 `SITE.url`（`scripts/lib/site-config.mjs`），可用 `PRODUCTION_URL` 覆盖（与 `verify:prod` 一致）。GSC 资源 URL 默认 `${base}/`，可用 `GSC_SITE_URL` 覆盖（须与 Search Console 中「网址前缀」资源一致，含尾斜杠约定与文档一致）。
- **AC-9**: 单元测试覆盖纯函数：sitemap XML 解析、博客 URL 筛选、样本选取、robots 断言、HTML 可收录断言、以及「有/无凭证时是否进入 B 层」的分支逻辑。网络与 Google API 用 mock，不在 `yarn test` 默认路径打真实外网。
- **AC-10**: 在 `docs/WEBMASTER-SUBMISSION.md`（及必要时 `docs/LAUNCH.md` / `scripts/AGENTS.md`）补充：`yarn seo:index-check` 用法、A/B 两层含义、`GOOGLE_APPLICATION_CREDENTIALS` / `GSC_SITE_URL` / `--sample` / `--strict`，以及服务账号加入 GSC 的步骤摘要。密钥文件不得写入仓库。

## Options considered

### Option 1: A 层可收录门禁 + 可选 GSC URL Inspection（B 层）

本地 CLI：无密钥只跑 A；有密钥再抽查索引状态。默认未收录不失败，`--strict` 可选硬失败。不进 CI。

**Pros**:
- 无密钥也能做有意义的验收。
- 真收录有官方数据源，不依赖爬搜索页。
- 与现有 `verify:prod` / SITE 配置对齐。

**Cons**:
- B 层需要维护者自行配置 GCP 服务账号与 GSC 权限。
- URL Inspection 有配额，全量不合适。

### Option 2: 仅扩展 `verify:prod` 做 A 层

把 robots/sitemap/样本 HTML 并入现有冒烟，不做 GSC。

**Pros**:
- 改动面小，无新依赖。

**Cons**:
- 仍无法回答「有没有被 Google 收录」。
- 与用户已确认的 A+B 目标不符。

### Option 3: 爬取 Google `site:` 搜索结果

用 HTTP 抓取搜索页推断收录。

**Pros**:
- 无需 GSC 配置。

**Cons**:
- 不稳定、易被反爬，不符合服务条款风险，结果不可靠。

## Decision

**Chosen option**: Option 1: A 层可收录门禁 + 可选 GSC URL Inspection（B 层）

新增 `yarn seo:index-check`（独立于 CI）。默认样本 5；未收录默认 warning；`--strict` 才把未收录当失败。密钥通过 `GOOGLE_APPLICATION_CREDENTIALS` 注入，永不入库。

**Implementation skills**: `vitest`（`.agents/skills/vitest/`）

## Rationale

维护者已确认「按推荐」：A+B、未收录默认不失败、样本 5、仅本地、References 只要项目内来源。Option 1 同时覆盖「技术可抓」与「官方索引状态」，并避免把个人站常见的延迟收录变成硬失败。Option 2 达不到真收录；Option 3 不可靠。

`verify:prod` 继续做部署冒烟；收录验收单独成命令，避免把可选 Google 依赖绑进每次冒烟。

## Feature design

**Data model sketch**:
- 无持久化实体。运行期结构（内存）：
  - `CheckFinding`: `{ id, severity: 'error' | 'warning' | 'info', message }`
  - `SampleUrl`: 绝对 URL 字符串
  - `IndexResult`（B 层）: `{ url, indexingState?, coverageState?, rawError? }`

**State transitions**:
- 不适用。进程结果：exit 0 或 exit 1。

**API surface**:
| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| CLI `yarn seo:index-check` | run | `--sample N`, `--strict`, env | 控制台报告 + exit code | 本地；B 层需服务账号 | A 失败 exit 1；B 未收录默认 warning |
| 生产 HTTP | GET | robots / sitemap / 文章 HTML / 验证文件 | body + status | 公开 | 非 200、缺字段 |
| GSC URL Inspection | API | `inspectionUrl`, `siteUrl` | indexing / coverage | Google ADC JSON | 401/403/配额 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| 生产基址 | 请求用的 origin+base | `PRODUCTION_URL` 或 `SITE.url`（site-config） |
| GSC siteUrl | Inspection 的站点资源 | `GSC_SITE_URL` 或 `${baseUrl}/` |
| Sitemap 入口 | robots 中的 Sitemap URL 或约定 `${base}/sitemap-index.xml` | 生产 robots 正文；回退 SITE 约定 |
| 博客 URL 列表 | 候选文章 | 解析 sitemap urlset 的 `<loc>` |
| 样本集合 | 实际检查的 URL | 默认取列表末尾/最新 5 个（或均匀抽样，实现时固定一种并测）；`--sample` 覆盖 |
| noindex / BlogPosting | A 层 HTML 断言 | 响应 HTML 字符串 |
| 是否跑 B 层 | 布尔 | `GOOGLE_APPLICATION_CREDENTIALS` 文件可读 |
| 索引状态文案 | Indexed / 未收录等 | URL Inspection API 响应字段 |
| exit code | 0 / 1 | A 层 error → 1；B 未收录仅在 `--strict` → 1 |

**Key invariants**:
- 无凭证时命令仍可完成 A 层并给出可操作报告。
- 默认（无 `--strict`）不因「未收录」或「跳过 B」而失败。
- 密钥路径只读环境变量，脚本不得把密钥内容写入仓库或日志（可打印「已加载服务账号邮箱」若 JSON 含 `client_email`）。
- 不爬取 google.com/search。

**Security model**:
- 无终端用户鉴权。GSC 服务账号密钥仅本机/密钥管理器保存；文档明确禁止 commit。日志不打印私钥字段。

**Configuration required**:
- `GOOGLE_APPLICATION_CREDENTIALS`（可选）: 服务账号 JSON 绝对路径；有则启用 B 层
- `GSC_SITE_URL`（可选）: Search Console 网址前缀资源，默认 `${PRODUCTION_URL或SITE.url}/`
- `PRODUCTION_URL`（可选）: 覆盖生产基址，同 `verify:prod`

**Critical test scenarios**:
- Happy path A: mock robots + sitemap + 5 篇合格 HTML → exit 0，无 B，验证 **AC-2**–**AC-5**、**AC-6** SKIP
- Happy path A+B: mock Inspection 全 Indexed → exit 0，验证 **AC-6**、**AC-7**
- Failure A: 某篇含 `noindex` 或缺 BlogPosting → exit 1，验证 **AC-4**
- Failure A: sitemap 无博客 URL → exit 1，验证 **AC-3**
- Edge B: 无凭证 → SKIP B，A 绿则 exit 0，验证 **AC-6**、**AC-7**
- Edge B: 样本未收录、无 `--strict` → warning、exit 0，验证 **AC-7**
- Edge B: 未收录 + `--strict` → exit 1，验证 **AC-7**
- Edge B: 403 权限错误、无 `--strict` → warning + 提示加入 GSC 用户，exit 0，验证 **AC-7**
- 文档：WEBMASTER-SUBMISSION 含新命令与 env，验证 **AC-10**
- 注册：`package.json` 含 `seo:index-check`，验证 **AC-1**

## Build plan

1. [x] 抽出可单测的纯函数模块（建议 `scripts/lib/seo-index-check-lib.mjs`）：robots 解析断言、sitemap 解析与博客 URL 筛选、样本选取、HTML 可收录断言，satisfies **AC-2**、**AC-3**、**AC-4**、**AC-9**。
2. [x] 实现 `scripts/seo-index-check.mjs`：组装 A 层网络检查（robots、sitemap、样本 HTML、验证文件），复用 `SITE` / `withRetry` 模式，注册 `yarn seo:index-check`，satisfies **AC-1**、**AC-2**、**AC-3**、**AC-4**、**AC-5**、**AC-8**。
3. [x] 实现可选 B 层：读取 `GOOGLE_APPLICATION_CREDENTIALS`，调用 URL Inspection（可用 `googleapis` 或最小 JWT+fetch；优先已有依赖，若无则加明确依赖），处理 SKIP / warning / `--strict`，satisfies **AC-6**、**AC-7**、**AC-8**。
4. [x] 添加 Vitest：纯函数 + mock 网络/API 分支（`tests/seo-index-check.test.ts`），satisfies **AC-9**。
5. [x] 更新 `docs/WEBMASTER-SUBMISSION.md`、`scripts/AGENTS.md`（及必要时 `docs/LAUNCH.md`）说明用法与密钥配置，satisfies **AC-10**。

## Consequences

**Positive**:
- 一条命令完成发布后收录相关验收。
- 无密钥也能跑 A；有密钥可看真收录。
- 默认不因异步收录误报失败。

**Negative / tradeoffs**:
- B 层依赖维护者一次性 GCP + GSC 配置。
- 抽查 5 篇不能代表全库收录率。
- 若引入 `googleapis`，增加依赖体积（仅 scripts 使用）。

**Neutral**:
- CI 不变；`verify:prod` 职责不变。
- 不改变线上页面 HTML。

## Follow-up

- [ ] 合并后 `/sync`：在根或 `scripts/AGENTS.md` 记下 `seo:index-check` 与可选 env。
- [ ] 可选：日后用 Search Analytics 汇总「已收录 URL 数」报表（本规格不做）。

## References

**Project sources**:
- `scripts/verify-production.mjs`（生产冒烟与验证文件检查）
- `scripts/lib/site-config.mjs`（`SITE.url` / origin / basePath）
- `docs/WEBMASTER-SUBMISSION.md`（GSC / Bing 提交与验证）
- `src/pages/robots.txt.ts`、`src/pages/sitemap.xml.ts`

**Practices & standards**:
- 可抓取性（robots、sitemap、无 noindex、正文 HTML）与索引状态（Search Console）分层验收
- 密钥经 ADC 环境变量注入，不入库
