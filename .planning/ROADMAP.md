# Roadmap: 墨韵个人网站

## Milestones

- 🚧 **v1.0 SEO 提升与 Astro 迁移** — Phases 1–5（Phase 5 planned）

## Overview

将现有 React+Vite SPA 整站迁移至 Astro 静态站点，优先交付博客 SSG 与构建时 SEO head，再迁移首页/作品集并保留 GSAP/Lenis/Phaser 交互岛。随后建立元数据批量工具与 CI 门禁，最后完成 Top N 内容深度优化、内链与站长平台上线文档。全程维持 GitHub Pages 免费托管与 `/personalWeb/` URL 结构。

## Phases

- [x] **Phase 1: Astro 基础与博客 SSG** — Astro 骨架、博客静态页、SEO head、sitemap、GH Pages 部署
- [x] **Phase 2: 整站页面与交互岛** — 首页/作品集/关于迁移，GSAP/Lenis/Phaser，去掉 editor
- [x] **Phase 3: 元数据流水线与 CI** — meta-batch、seo-audit、schema 严格校验
- [x] **Phase 4: 内容优化与上线** — Top N 选题与深度优化、内链、性能与站长提交
- [ ] **Phase 5: v1.0 上线收尾** — 生产部署、站长验证、Rich Results、里程碑归档

## Phase Details

### Phase 1: Astro 基础与博客 SSG

**Goal**: 博客可独立静态部署，每篇文章具备完整 SEO 与可抓取 HTML
**Depends on**: Nothing (first phase)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04, SEO-01, SEO-02, SEO-04, SEO-06
**Success Criteria** (what must be TRUE):

1. `yarn build` 产出 Astro `dist/`，`base` 为 `/personalWeb/`
2. 任意已发布博客 URL view-source 可见完整正文 HTML 与 meta/JSON-LD
3. `sitemap.xml` 包含首页、博客列表及全部已发布文章 URL
4. GitHub Actions 成功部署至 GitHub Pages，博客路由可访问

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — 初始化 Astro 5（React/Tailwind/sitemap 集成）、Wave 0 Vitest + frontmatter 测试、目录与 `astro.config.mjs`

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Content Collections 自定义 loader（D-09）+ 博客列表/详情 SSG + Shiki 正文

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — BaseLayout/BlogLayout 构建时 SEO head（canonical、OG、BlogPosting JSON-LD、`lang=zh-CN`）

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — sitemap/robots 集成、占位首页、404 处理、deploy.yml 切换 `astro build`

### Phase 2: 整站页面与交互岛

**Goal**: 非博客页面迁移完成，首页交互与视觉达标，发布路径去掉 web editor
**Depends on**: Phase 1
**Requirements**: MIGR-05, MIGR-06, MIGR-07, MIGR-08, SEO-03, OPT-05, OPT-06
**Success Criteria** (what must be TRUE):

1. 首页、作品集、关于页视觉与现站一致，导航与路由正常
2. 首页 GSAP/Lenis 动画正常；Phaser 未点击前不加载 Phaser chunk
3. `/blog/editor` 不可访问；README 仅描述 CLI + Notion 发布
4. 首页有 3 篇精选文章静态区块；作品集项目有独立 meta

**Plans**: 3 plans

Plans:

**Wave 1**

- [x] `02-01-PLAN.md` — 首页静态层 + HomeMotion 岛（GSAP/Lenis `client:visible`）

**Wave 2** *(blocked on Wave 1 completion)*

- [x] `02-02-PLAN.md` — GameIsland 点击加载 Phaser + 作品集 description/SEO

**Wave 3** *(blocked on Wave 2 completion)*

- [x] `02-03-PLAN.md` — 移除 BlogEditor/路由；清理 Vite SPA 入口；更新 README

### Phase 3: 元数据流水线与 CI

**Goal**: 全库元数据可批量维护，CI 阻止 SEO 回归
**Depends on**: Phase 2
**Requirements**: FLOW-01, FLOW-02, FLOW-03, SEO-05, OPT-01, OPT-02
**Success Criteria** (what must be TRUE):

1. `yarn seo:meta-batch --dry-run` 输出全库缺口报告
2. `--apply` 补全 description 等字段且默认不改 slug
3. `yarn notion:sync` 与 `yarn blog:new` 产出通过 schema
4. `yarn seo:audit` 在 CI 中失败于 error；全库 build 通过严格 `description` 校验

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — `seo:meta-batch` 脚本（扫描、建议、apply、slug 保护）— Wave 1

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — `seo:audit` + blog:new / notion:sync 对齐 schema（build 链在 03-03 apply 后接入）

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — 全库 batch apply + 启用严格 description schema — Wave 3

### Phase 4: 内容优化与上线

**Goal**: Top N 深度优化、内链体系、性能达标与站长平台就绪
**Depends on**: Phase 3
**Requirements**: SEO-07, SEO-08, OPT-03, OPT-04, LAUNCH-01, LAUNCH-02
**Success Criteria** (what must be TRUE):

1. 博客详情有 3 篇相关内链；列表可按分类浏览
2. Top 15–20 篇按评分选出并完成深度优化 checklist
3. 首页 Lighthouse Performance ≥ 85，LCP < 2.5s
4. `docs/` 或 README 含三平台站长提交指南；Rich Results Test 抽查 3 篇通过

**Plans**: 3 plans

Plans:

**Wave 1**

- [x] 04-01-PLAN.md — 相关文章 adapter + RelatedPosts + 静态分类 hub 页 + e2e（SEO-07、SEO-08）

**Wave 2** *(depends on 04-01)*

- [x] 04-02-PLAN.md — Top N 评分 CLI + checklist + 15–20 篇深度优化（OPT-03、OPT-04）

**Wave 3** *(depends on 04-02)*

- [x] 04-03-PLAN.md — 首页性能 + LHCI + 站长文档 + 上线验收（LAUNCH-01、LAUNCH-02）— human checkpoint pending

### Phase 5: v1.0 上线收尾

**Goal**: Astro 站点生产上线、三平台站长验证与 Rich Results 通过、v1.0 里程碑正式关闭
**Depends on**: Phase 4
**Requirements**: LAUNCH-03, LAUNCH-04, LAUNCH-05, MILE-01, MILE-02
**Success Criteria** (what must be TRUE):

1. `origin/master` 部署 Astro `dist/` 至 GitHub Pages；验证文件与 `sitemap-index.xml` 生产可访问
2. Google / 必应 / 百度 三平台完成所有权验证并提交 sitemap
3. Rich Results Test 抽查 3 篇博客通过
4. `REQUIREMENTS.md` 27 项全部 `[x]`；`MILESTONES.md` v1.0 标记完成

**Plans**: 3 plans

Plans:

**Wave 1**

- [ ] 05-01-PLAN.md — 提交实现 + 推送部署 + `verify-production.mjs` 生产冒烟（LAUNCH-03）

**Wave 2** *(depends on 05-01)*

- [ ] 05-02-PLAN.md — 百度验证文件 + 站长/Rich Results 人工验收 + 关闭 04-UAT 11–12（LAUNCH-04、LAUNCH-05）

**Wave 3** *(depends on 05-02)*

- [ ] 05-03-PLAN.md — REQUIREMENTS 勾选 + ROADMAP/MILESTONES/STATE 更新 + 05-UAT（MILE-01、MILE-02）

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Astro 基础与博客 SSG | 4/4 | Complete | 2026-06-21 |
| 2. 整站页面与交互岛 | 3/3 | Complete | 2026-06-21 |
| 3. 元数据流水线与 CI | 3/3 | Complete | 2026-06-21 |
| 4. 内容优化与上线 | 3/3 | Complete (UAT 11–12 → Phase 5) | 2026-06-21 |
| 5. v1.0 上线收尾 | 0/3 | Planned | - |

---
*Roadmap created: 2026-06-21 — Milestone v1.0*
