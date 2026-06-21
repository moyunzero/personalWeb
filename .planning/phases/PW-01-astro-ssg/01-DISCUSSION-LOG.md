# Phase 1: Astro 基础与博客 SSG - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md`.

**Date:** 2026-06-21
**Phase:** 1-Astro 基础与博客 SSG
**Areas discussed:** 部署边界, 博客 UI, Markdown 栈, posts-index, URL 规范

---

## Phase 1 上线边界

| Option | Description | Selected |
|--------|-------------|----------|
| 占位首页 + sole astro build | Phase 1 仅 Astro 构建；静态占位首页；Phase 2 恢复完整首页 | ✓ |
| 双构建合并 dist | Vite + Astro 合并产出 | |
| Phase 1 不切 CI | 仅本地验证 Astro | |

**User's choice:** 占位首页 + sole astro build
**Notes:** 接受 Phase 1 首页暂时无 GSAP/Phaser。

---

## 博客 UI 完成度

| Option | Description | Selected |
|--------|-------------|----------|
| SEO 优先简化模板 | 深色布局，复用 Tailwind/色彩常量；像素级延到 Phase 2 | ✓ |
| Phase 1 像素级迁移 | 直接迁 Blog.jsx 视觉 | |

**User's choice:** SEO 优先简化模板

---

## Markdown 代码高亮

| Option | Description | Selected |
|--------|-------------|----------|
| Shiki 构建时高亮 | 代码块在静态 HTML 中 | ✓ |
| highlight.js 客户端 | 对齐现站 MarkdownContent | |

**User's choice:** Shiki

---

## posts-index.json

| Option | Description | Selected |
|--------|-------------|----------|
| 纯 Content Collections | 停止生成 posts-index.json | ✓ |
| 保留过渡 | 继续生成供工具链 | |

**User's choice:** 纯 Content Collections

---

## URL / canonical

| Option | Description | Selected |
|--------|-------------|----------|
| trailingSlash always | canonical 带尾部斜杠 | ✓ |
| trailingSlash never | 无尾部斜杠 | |

**User's choice:** trailingSlash always

---

## Claude's Discretion

- Astro 目录细节、Shiki 主题、占位首页文案、`generate-static` 迁入方式

## Deferred Ideas

- 完整首页交互 → Phase 2
- 相关文章内链 → Phase 4
- seo-audit CI → Phase 3
