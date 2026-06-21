# Phase 1: Astro 基础与博客 SSG - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

交付 Astro 静态站点骨架，使**博客列表与详情**以 SSG 产出可抓取 HTML，并具备完整构建时 SEO head、sitemap/robots 与 GitHub Pages 部署。包含**占位静态首页**（非 Phase 2 的完整交互首页）。不包含首页 GSAP/Lenis/Phaser、作品集/关于页完整迁移、meta-batch/seo-audit、Top N 内容优化。

</domain>

<decisions>
## Implementation Decisions

### 部署与构建边界（D-01）
- **D-01:** Phase 1 结束时 `yarn build` 与 GitHub Actions **仅使用 Astro 单一构建**产出 `dist/`
- **D-02:** 提供**占位静态首页**（H1、简短简介、链到博客）；**不**包含 GSAP/Lenis/Phaser（Phase 2 恢复）
- **D-03:** 旧 Vite SPA 入口在本 Phase 部署切换后不再作为生产构建；不接受双构建合并 dist

### 博客 UI（D-04）
- **D-04:** Phase 1 博客列表/详情采用 **SEO 优先的简化深色模板**（复用 Tailwind 与现有色彩/间距常量）
- **D-05:** 不要求与现 `Blog.jsx` / `BlogDetail.jsx` 像素级一致；视觉统一延至 Phase 2

### Markdown 与内容管线（D-06）
- **D-06:** 博客 Markdown 使用 **Astro + Shiki** 构建时代码高亮（代码块写入静态 HTML）
- **D-07:** 博客数据路径使用 **Content Collections**，读取 `content/posts/**/*.md`
- **D-08:** **停止生成** `public/posts-index.json`；`notion-sync` / `blog:new` 仍只写 md 文件
- **D-09:** 复用 `src/blog/frontmatter.js` 的 YAML 解析逻辑（Notion 非标准 YAML 兼容）于构建脚本或 Astro 集成

### URL 与 SEO（D-10）
- **D-10:** Astro `trailingSlash: 'always'`；canonical URL 带尾部斜杠（如 `/personalWeb/blog/{slug}/`）
- **D-11:** 每页 head 在构建时输出：`title`、`description`、`canonical`、`og:*`、博客文 `BlogPosting` JSON-LD
- **D-12:** `html lang="zh-CN"`；站点 URL 以 `scripts/lib/site-config.mjs` 的 `SITE.url` 为 canonical 基准

### sitemap 与部署（D-13）
- **D-13:** 构建时生成 `sitemap.xml`、`robots.txt`（覆盖占位首页、博客列表、全部已发布文章）
- **D-14:** GitHub Actions `deploy.yml` 的 build 步骤改为 `astro build`（或等价 `yarn build` 调用 astro）
- **D-15:** 保留 GitHub Pages SPA 回退：`public/404.html` 或 Astro 等价方案，确保 `/blog` 深链可访问

### 从里程碑/设计已锁定（本 Phase 不重新讨论）
- 框架：Astro SSG，`base: '/personalWeb/'`
- 托管：GitHub Pages 免费，无自定义域名
- 内容源：`content/posts/` + `content/categories.json`
- Phase 1 不包含：web editor、seo-audit CI 门禁、批量元数据、相关文章内链组件（Phase 4）

### Claude's Discretion
- Astro 目录结构（`src/pages` vs `src/content` 布局细节）
- Shiki 主题选择（对齐现站深色代码块即可）
- 占位首页具体文案与布局（保持简洁、含可抓取正文）
- `generate-static.mjs` 并入 Astro integration vs 保留 pre-build 脚本的实现方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 里程碑与设计
- `docs/SEO-MIGRATION-DESIGN.md` — §1 架构、§2 SEO 层、§6 P0 阶段、Decision Log
- `.planning/PROJECT.md` — 约束、Core Value、Key Decisions
- `.planning/REQUIREMENTS.md` — MIGR-01–04、SEO-01/02/04/06 验收标准
- `.planning/ROADMAP.md` — Phase 1 Goal、Success Criteria、Plans 01-01–01-04

### 站点与构建配置
- `scripts/lib/site-config.mjs` — `SITE.url`、`basePath`、`language`
- `vite.config.js` — 现有 `base: '/personalWeb/'` 参考
- `.github/workflows/deploy.yml` — 当前 CI 构建与 Pages 部署

### 博客内容管线（迁移参考）
- `src/blog/frontmatter.js` — YAML 解析与 Notion 兼容
- `src/blog/parsePost.js` — 字段映射参考
- `scripts/lib/load-posts.mjs` — 构建时读 posts 逻辑
- `scripts/generate-static.mjs` — 现有 sitemap/robots 逻辑（需迁移或替换）
- `content/categories.json` — 分类 label 映射

### UI 参考（简化复用，非像素级复制）
- `src/pages/Blog.jsx` — 列表布局与筛选逻辑参考
- `src/pages/BlogDetail.jsx` — 详情结构、元信息展示参考
- `src/constants/styles.js` — 色彩/间距常量

### GitHub Pages
- `public/404.html` — SPA 深链回退模式
- `index.html` — 现有 GH Pages redirect 脚本参考

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter` / `normalizeFrontmatterYaml` — Notion 同步产生的非标准 YAML
- `scripts/lib/site-config.mjs` — 单一站点 URL 与语言配置
- `buildPostsIndex` / `loadPostsForBuild` — slug、date、draft 过滤逻辑可迁到 Content Collection `getCollection` 过滤
- `getCategoryLabel`（`src/blog/getCategories.js`）— 分类展示 label
- `public/404.html` — GH Pages 路由回退

### Established Patterns
- 文章 slug：`frontmatter.slug` 或文件名；生产环境过滤 `draft: true`
- 资源路径：`import.meta.env.BASE_URL` / `resolveBlogAsset` 处理 cover 图
- 构建前脚本链：`generate-static.mjs` 在 vite build 前写 sitemap

### Integration Points
- `package.json` scripts：`build` 需从 `vite build` 切到 `astro build`
- `yarn build` 前置：可保留 `node scripts/generate-static.mjs` 或迁入 Astro hook
- Notion sync 不变：仍写入 `content/posts/*.md`；无需 posts-index.json

</code_context>

<specifics>
## Specific Ideas

- 占位首页需有 **H1 + 200 字左右可抓取正文**（设计 §3 SEO 要求），即使无动画
- 博客页 view-source 是 Phase 1 主要验收手段
- 用户明确接受 Phase 1 首页暂时无 GSAP/Phaser

</specifics>

<deferred>
## Deferred Ideas

- 首页 GSAP/Lenis/Phaser 交互岛 → Phase 2
- 博客像素级 UI 与现站一致 → Phase 2
- `posts-index.json` 若其他工具仍依赖 → Phase 2/3 清理时确认并删除生成脚本
- 相关文章内链、分类 topic cluster → Phase 4
- `seo:audit` CI 门禁 → Phase 3

</deferred>

---

*Phase: 1-Astro 基础与博客 SSG*
*Context gathered: 2026-06-21*
