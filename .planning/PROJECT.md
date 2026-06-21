# 墨韵个人网站 (personalWeb)

## What This Is

基于现代前端技术栈的个人网站，展示作品集、技术博客与个人技能。目标读者为国内开发者；内容以中文技术文章为主。当前托管于 GitHub Pages 子路径 `moyunzero.github.io/personalWeb`。

## Core Value

访客能通过搜索发现高质量技术博客内容，并顺畅阅读与探索作者的作品与技能。

## Requirements

### Validated

- ✓ React 18 + Vite SPA 个人站 — pre-GSD baseline
- ✓ Markdown 博客（`content/posts`）构建时加载 — pre-GSD baseline
- ✓ Notion → Markdown 同步工作流 — pre-GSD baseline
- ✓ `yarn blog:new` CLI 脚手架 — pre-GSD baseline
- ✓ GitHub Actions 部署至 GitHub Pages — pre-GSD baseline
- ✓ GSAP 动画 + Lenis 平滑滚动 — pre-GSD baseline
- ✓ 首页 Phaser 小游戏 — pre-GSD baseline
- ✓ 构建时 sitemap.xml / robots.txt 生成 — pre-GSD baseline
- ✓ 博客页客户端 `useDocumentMeta` — pre-GSD baseline（待本里程碑替换为静态 head）

### Active

<!-- Milestone v1.0 — see REQUIREMENTS.md for REQ-IDs -->

- [ ] 整站迁移至 Astro 静态站点（GitHub Pages 兼容）
- [ ] 博客每篇独立静态 HTML + 完整 SEO head
- [ ] 保留首页交互（GSAP/Lenis/Phaser 点击加载）
- [ ] 去掉 web 博客编辑器，CLI + Notion 唯一发布路径
- [ ] 全库元数据批量优化 + Top N 深度优化
- [ ] seo-audit CI 门禁

### Out of Scope

- 自定义域名、ICP 备案 — 用户明确零额外成本
- 国内 CDN / Gitee 双轨部署 — 用户明确不做
- 硬 KPI 流量目标 — 软性成功标准即可
- Web 博客编辑器 `/blog/editor` — 改为 CLI/Notion
- Next.js SSR 或非静态托管 — Astro SSG 已决策

## Current Milestone: v1.0 SEO 提升与 Astro 迁移

**Goal:** 在免费 GitHub Pages 上，通过 Astro 整站 SSG 与内容 SEO 体系化，提升国内/国际搜索引擎收录与排名潜力。

**Target features:**

- Astro 整站静态构建，`base: /personalWeb/`
- 博客 SSG：每篇文章完整 HTML + meta + JSON-LD
- 首页/作品集/关于页迁移，保留视觉与交互岛
- Phaser 首页点击加载；去掉 BlogEditor
- `seo:meta-batch` + `seo:audit` + 分阶段 schema 校验
- Top 15–20 篇深度优化 + 内链 + 站长平台提交文档

**Design reference:** `docs/SEO-MIGRATION-DESIGN.md`

## Context

- 约 96 篇博客，部分 slug 随机（如 `36ddf5c0`）
- 国内搜索优先，兼顾 Google；`github.io` 子路径对百度收录有平台天花板
- 实施节奏：分 4 阶段（P0 博客 SEO → P1 整站页 → P2 元数据 CI → P3 内容优化）
- brainstorming 已确认决策见 `docs/SEO-MIGRATION-DESIGN.md` Decision Log

## Constraints

- **Hosting**: GitHub Pages only — 零托管费用
- **URL**: 保持 `/personalWeb/` 子路径，已有 slug 默认不改
- **Stack**: Astro + React 岛（非整站 React SPA）
- **Performance**: 首页 LCP < 2.5s，Lighthouse Performance ≥ 85
- **Content**: `description` 最终必填；先 batch 再 strict

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro over Next static export | GH Pages + 博客 SSG + 更轻 JS | — Pending |
| 维持 github.io 子路径 | 零成本 | — Pending |
| Phaser 点击后加载 | 保 LCP，游戏仍留首页 | — Pending |
| CLI + Notion only | 减少维护面 | — Pending |
| Top N 按流量+关键词潜力选题 | 用户确认 | — Pending |
| slug 默认不批量改 | 避免丢收录 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-21 after milestone v1.0 started*
