# Roadmap: 墨韵个人网站

## Milestones

- 🚧 **v1.0 SEO 提升与 Astro 迁移** — Phases 1–4（in progress）

## Overview

将现有 React+Vite SPA 整站迁移至 Astro 静态站点，优先交付博客 SSG 与构建时 SEO head，再迁移首页/作品集并保留 GSAP/Lenis/Phaser 交互岛。随后建立元数据批量工具与 CI 门禁，最后完成 Top N 内容深度优化、内链与站长平台上线文档。全程维持 GitHub Pages 免费托管与 `/personalWeb/` URL 结构。

## Phases

- [ ] **Phase 1: Astro 基础与博客 SSG** — Astro 骨架、博客静态页、SEO head、sitemap、GH Pages 部署
- [ ] **Phase 2: 整站页面与交互岛** — 首页/作品集/关于迁移，GSAP/Lenis/Phaser，去掉 editor
- [ ] **Phase 3: 元数据流水线与 CI** — meta-batch、seo-audit、schema 严格校验
- [ ] **Phase 4: 内容优化与上线** — Top N 选题与深度优化、内链、性能与站长提交

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

- [ ] 01-01-PLAN.md — 初始化 Astro 5（React/Tailwind/sitemap 集成）、Wave 0 Vitest + frontmatter 测试、目录与 `astro.config.mjs`

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Content Collections 自定义 loader（D-09）+ 博客列表/详情 SSG + Shiki 正文

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — BaseLayout/BlogLayout 构建时 SEO head（canonical、OG、BlogPosting JSON-LD、`lang=zh-CN`）

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-04-PLAN.md — sitemap/robots 集成、占位首页、404 处理、deploy.yml 切换 `astro build`

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

- [ ] 02-01: 首页静态层 + HomeMotion 岛（GSAP/Lenis `client:visible`）
- [ ] 02-02: GameIsland 点击加载 Phaser + 作品集/关于页迁移
- [ ] 02-03: 移除 BlogEditor/路由；清理旧 Vite SPA 入口与依赖

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

- [ ] 03-01: 实现 `seo:meta-batch` 脚本（扫描、建议、apply、slug 保护）
- [ ] 03-02: 实现 `seo:audit` + 接入 `yarn build` 与 GitHub Actions
- [ ] 03-03: 执行 batch apply + 启用严格 schema；修复 audit 报错

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

- [ ] 04-01: 相关文章组件 + 分类聚合（SEO-07、SEO-08）
- [ ] 04-02: Top N 选题评分 + 深度优化执行（OPT-03、OPT-04）
- [ ] 04-03: 性能验收 + 站长提交文档 + 上线检查清单（LAUNCH-01、LAUNCH-02）

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Astro 基础与博客 SSG | 0/4 | Not started | - |
| 2. 整站页面与交互岛 | 0/3 | Not started | - |
| 3. 元数据流水线与 CI | 0/3 | Not started | - |
| 4. 内容优化与上线 | 0/3 | Not started | - |

---
*Roadmap created: 2026-06-21 — Milestone v1.0*
