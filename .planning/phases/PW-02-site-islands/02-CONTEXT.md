# Phase 2: 整站页面与交互岛 - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Source:** `docs/SEO-MIGRATION-DESIGN.md` §3、§5 作品集、ROADMAP Phase 2、Phase 1 交付物

<domain>
## Phase Boundary

将 Phase 1 占位首页替换为**完整单页首页**（Hero、关于、技能、作品集、联系），并通过 React 交互岛恢复 GSAP/Lenis 滚动动画与 Phaser 游戏（点击后加载）。博客保持 Astro SSG，不在本 Phase 重做博客列表/详情路由。移除 web editor 与 Vite SPA 生产入口残留。

**范围澄清：**「作品集」「关于」为首页内锚点区块（`#work`、`#about`），非独立 `/portfolio` 路由（与现 React SPA 一致）。

不包含：meta-batch、seo-audit CI、Top N 深度优化、博客相关文章内链（Phase 3–4）。
</domain>

<decisions>
## Implementation Decisions

### 首页结构（D-16）
- **D-16:** `src/pages/index.astro` 替换占位页，静态输出 Main/About/Skill/Work/Contact 区块 HTML（爬虫可见）
- **D-17:** 首页精选文章（OPT-05）：构建时 `getCollection` 取 `featured: true`；不足 3 篇时用最近发布文章补足
- **D-18:** 首页使用 `HomeLayout.astro`（Header/Footer/导航），博客继续 `BlogLayout.astro`

### 交互岛（D-19）
- **D-19:** `HomeMotion.tsx` — `client:visible`；承载 GSAP ScrollTrigger reveal（自 `_Home.jsx`）+ Lenis（自 `useScrollToTop.js`）
- **D-20:** `GameIsland.tsx` — Phaser **点击启动**后 `dynamic import`；未点击前不加载 `phaser` chunk（MIGR-07）
- **D-21:** `ParticleCanvas`、`MouseTrail` 可并入 HomeMotion 或独立 `client:visible` 岛；保持现站视觉
- **D-22:** 聊天组件（ChatTrigger/ChatPanel）**本 Phase 不迁移**；CI 已移除 `VITE_CHAT_API_URL`，避免半成品上线

### 作品集 SEO（D-23）
- **D-23:** `src/data/projects.js` 每项增加 `description`（构建时 meta）；首页 Work 区块输出语义化 HTML + 可选 `CreativeWork` JSON-LD 条目（OPT-06）

### 首页 SEO（D-24）
- **D-24:** 首页 head 增加 `WebSite` + `Person` JSON-LD（SEO-03）；扩展 `src/lib/seo.ts`

### 清理（D-25）
- **D-25:** 删除/停用 `BlogEditor`、`/blog/editor`（生产 404）；README 仅描述 `blog:new` + `notion:sync`
- **D-26:** 移除 Vite SPA 生产路径：`index.html` + `src/main.jsx` 不再参与 `astro build`；可保留 `_*.jsx` 作参考直至迁移完成再删
- **D-27:** sitemap 仍由 `@astrojs/sitemap` 覆盖首页；无需 posts-index.json

### Claude's Discretion
- Astro 组件 vs 纯 HTML 复刻 home sections 的拆分粒度
- GameTooltip 是否随 GameIsland 迁移
- 是否在本 Phase 统一博客 UI 与旧 `Blog.jsx` 视觉（ROADMAP 未强制博客像素级一致，优先首页/作品集）
</decisions>

<canonical_refs>
## Canonical References

- `docs/SEO-MIGRATION-DESIGN.md` — §3 首页交互岛、§5 作品集、Decision Log
- `.planning/phases/PW-01-astro-ssg/01-CONTEXT.md` — D-02 占位首页由本 Phase 替换
- `.planning/phases/PW-01-astro-ssg/01-SUMMARY.md` — Astro 构建链、博客 SSG 现状
- `src/pages/_Home.jsx` — GSAP reveal 逻辑
- `src/layouts/MainLayout.jsx` — 首页 chrome 与 Phaser 挂载方式
- `src/game/PhaserGame.jsx` — Phaser 懒加载模式
- `src/hooks/useScrollToTop.js` — Lenis 初始化
- `src/data/projects.js`、`src/data/about.js`、`src/data/skills.js`
- `src/components/home/*` — 各 section 组件
- `src/layouts/BaseLayout.astro`、`src/lib/seo.ts` — SEO 扩展点
</canonical_refs>

<success_criteria>
## Success Criteria (from ROADMAP)

1. 首页、作品集（#work）、关于（#about）视觉与现站一致，锚点导航正常
2. GSAP/Lenis 动画正常；Phaser 未点击前 network 无 phaser chunk
3. `/blog/editor` 不可访问；README 仅 CLI + Notion
4. 首页 3 篇精选文章静态 HTML；作品集项目有 description 与独立 SEO 语义
</success_criteria>
