# Requirements: 墨韵个人网站 — Milestone v1.0

**Defined:** 2026-06-21
**Milestone:** v1.0 SEO 提升与 Astro 迁移
**Core Value:** 访客能通过搜索发现高质量技术博客内容，并顺畅阅读与探索作者的作品与技能。
**Design reference:** `docs/SEO-MIGRATION-DESIGN.md`

## v1.0 Requirements

### Migration — Astro 整站

- [x] **MIGR-01**: 构建产出 Astro 静态站点，`base` 为 `/personalWeb/`，输出至 `dist/`
- [x] **MIGR-02**: 每篇博客在 `/blog/{slug}/` 生成独立静态 HTML（正文在首屏 HTML，非 JS 渲染）
- [x] **MIGR-03**: Content Collections 校验 frontmatter schema（title、slug、description、date、categories）
- [x] **MIGR-04**: GitHub Actions 使用 `astro build` 并将 `dist/` 部署到 GitHub Pages
- [x] **MIGR-05**: 首页、作品集、关于页迁移完成，Tailwind 视觉与现站一致
- [x] **MIGR-06**: 首页 GSAP + Lenis 通过 React 岛 `client:visible` 工作
- [x] **MIGR-07**: 首页 Phaser 游戏保留，点击或 idle 后才加载 Phaser bundle
- [x] **MIGR-08**: 移除 `BlogEditor` 组件与 `/blog/editor` 路由及相关 DEV 配置

### SEO — 技术层

- [x] **SEO-01**: 每个页面构建时输出 `title`、`description`、`canonical`（非客户端注入）
- [x] **SEO-02**: 博客文章页输出完整 Open Graph 标签与 `BlogPosting` JSON-LD
- [x] **SEO-03**: 首页输出 `WebSite` + `Person` JSON-LD
- [x] **SEO-04**: 构建时生成有效 `sitemap.xml` 与 `robots.txt`（含全站 URL）
- [x] **SEO-05**: `yarn seo:audit` 校验 meta 规则，CI 构建失败于 error 级问题
- [x] **SEO-06**: 全站 `html lang="zh-CN"`
- [x] **SEO-07**: 博客详情页展示 3 篇相关文章内链（同 category/tag）
- [x] **SEO-08**: 博客列表支持按分类浏览或聚合展示（topic cluster 入口）

### Workflow — 内容发布

- [x] **FLOW-01**: `yarn blog:new` 生成符合 schema 的 frontmatter 模板
- [x] **FLOW-02**: `yarn notion:sync` 输出与 Astro Content Collections 兼容
- [x] **FLOW-03**: `yarn seo:meta-batch` 支持 `--dry-run` 与 `--apply`（默认不改已有 slug）

### Optimization — 内容优化

- [x] **OPT-01**: 全库 96 篇通过 batch 补全 `description` 等元数据
- [x] **OPT-02**: batch 完成后启用 `description` 必填严格校验（构建失败）
- [x] **OPT-03**: 按流量+关键词潜力评分选出 Top 15–20 篇深度优化队列
- [x] **OPT-04**: Top N 篇满足深度优化 checklist（title、结构、内链、alt）
- [x] **OPT-05**: 首页静态展示 3 篇精选文章，带描述性锚文本
- [x] **OPT-06**: 作品集各项目有独立 SEO title/description

### Launch — 验证与上线

- [x] **LAUNCH-01**: 文档记录 Google / 必应 / 百度站长 sitemap 提交步骤（免费）
- [x] **LAUNCH-02**: 首页 Lighthouse Performance ≥ 85，LCP < 2.5s（4G 模拟）
- [x] **LAUNCH-03**: Astro `dist/` 部署至 GitHub Pages；验证文件与 sitemap 生产可访问
- [x] **LAUNCH-04**: Google / 必应 / 百度 三平台所有权验证 + sitemap 已提交
- [ ] **LAUNCH-05**: Rich Results Test 抽查 3 篇博客通过

### Milestone — v1.0 收尾

- [x] **MILE-01**: `REQUIREMENTS.md` 27 项 v1.0 全部勾选完成
- [x] **MILE-02**: `MILESTONES.md` v1.0 标记为已完成

## v2 Requirements

Deferred to future milestones.

### Infrastructure

- **INFRA-01**: 自定义域名 + DNS 配置
- **INFRA-02**: 国内 CDN 或双轨部署（Gitee Pages 等）

### Analytics

- **ANAL-01**: 接入 GA / 百度统计并用于 Top N 自动选题

## Out of Scope

| Feature | Reason |
|---------|--------|
| 自定义域名 / CDN | 用户明确零额外成本（v1.0） |
| 国内镜像 / 双轨部署 | 用户明确不做 |
| Web 博客编辑器 | 改为 CLI + Notion |
| 硬 KPI 流量目标 | 软性技术基础成功标准 |
| 批量修改已有 slug | 避免丢收录；仅 `--force-slug` 例外 |
| Next.js SSR / 非静态托管 | Astro SSG 已决策 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | Phase 1 | Done |
| MIGR-02 | Phase 1 | Done |
| MIGR-03 | Phase 1 | Done |
| MIGR-04 | Phase 1 | Done |
| SEO-01 | Phase 1 | Done |
| SEO-02 | Phase 1 | Done |
| SEO-04 | Phase 1 | Done |
| SEO-06 | Phase 1 | Done |
| MIGR-05 | Phase 2 | Done |
| MIGR-06 | Phase 2 | Done |
| MIGR-07 | Phase 2 | Done |
| MIGR-08 | Phase 2 | Done |
| SEO-03 | Phase 2 | Done |
| OPT-05 | Phase 2 | Done |
| OPT-06 | Phase 2 | Done |
| FLOW-01 | Phase 3 | Done |
| FLOW-02 | Phase 3 | Done |
| FLOW-03 | Phase 3 | Done |
| SEO-05 | Phase 3 | Done |
| OPT-01 | Phase 3 | Done |
| OPT-02 | Phase 3 | Done |
| SEO-07 | Phase 4 | Done |
| SEO-08 | Phase 4 | Done |
| OPT-03 | Phase 4 | Done |
| OPT-04 | Phase 4 | Done |
| LAUNCH-01 | Phase 4 / 5 | Done |
| LAUNCH-02 | Phase 4 | Done |
| LAUNCH-03 | Phase 5 | Done |
| LAUNCH-04 | Phase 5 | Done |
| LAUNCH-05 | Phase 5 | Pending |
| MILE-01 | Phase 5 | Done |
| MILE-02 | Phase 5 | Done |

**Coverage:**

- v1.0 requirements: 32 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-21*
*Last updated: 2026-06-21 after Phase 5 launch-close (31/32 v1.0 complete; LAUNCH-05 pending)*
