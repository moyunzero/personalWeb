# SEO 提升与 Astro 整站迁移设计

> 状态：**已实施**（v1.0 已上线，2026-06-21）  
> 日期：2026-06-21  
> 运维文档：[LAUNCH.md](./LAUNCH.md)、[WEBMASTER-SUBMISSION.md](./WEBMASTER-SUBMISSION.md)

## Understanding Summary

1. **目标**：在 GitHub Pages（`moyunzero.github.io/personalWeb`）上提高搜索收录与排名潜力。
2. **优先级**：博客自然流量（B）> 作品集曝光（C）> 个人品牌（A）。
3. **受众**：国内开发者为主（百度/必应中国优先），兼顾 Google。
4. **约束**：不买域名、不做 CDN/双轨部署；整站迁 Astro SSG；保留 GSAP/Lenis/Phaser/视觉/Notion 同步；去掉 web editor。
5. **内容**：全库元数据批量优化 + 10–20 篇 Top N 深度优化。
6. **成功标准（软性）**：技术 SEO 基础到位，无硬 KPI。
7. **非目标**：短期流量暴涨、域名/备案/国内镜像。

## Assumptions

| 维度 | 假设 |
|------|------|
| 性能 | 迁移后首屏与交互不低于现状 |
| 规模 | 个人站，96+ 篇文，日 UV 数百级以内 |
| 安全 | 纯静态站，无用户数据变更 |
| 可用性 | 依赖 GitHub Pages SLA；接受国内访问不稳定 |
| 维护 | 单人维护；Notion 同步为主发布路径 |
| 框架 | Astro 优先（静态输出 + React 岛） |
| 国内 SEO | 无独立域名下百度收录有平台天花板 |

## Decision Log

| 决策 | 备选 | 理由 |
|------|------|------|
| 目标 B > C > A | — | 用户明确 |
| 国内搜索优先 | 仅 Google | 用户选择 |
| 维持 github.io 子路径 | 域名/CDN/双轨 | 零额外成本 |
| 整站迁 Astro | Next / 预渲染插件 | GH Pages + 博客 SSG + 轻 JS |
| 保留全部交互 | 简化交互 | GSAP/Lenis/Phaser 保留 |
| 游戏留首页 | 独立路由 | 用户确认 |
| CLI + Notion 发布 | 保留 editor | 减少维护 |
| Top N 按流量+关键词潜力选题 | 手动指定 | 用户确认 |
| Head 构建时静态输出 | useDocumentMeta | 百度抓取弱 JS |
| Phaser 点击后加载 | 自动加载 | 保 LCP |
| description 必填 | 可选 | 批量优化前提 |
| slug 默认不批量改 | 全库重命名 | 避免链接失效 |

---

## §1 整体架构

```
content/posts/*.md          ← Notion sync / yarn blog:new
scripts/                    ← notion-sync, new-post, seo-audit, meta-batch
astro.config.mjs            ← base: '/personalWeb/', output: 'static'
src/
  layouts/                  ← BaseLayout（统一 head SEO）
  pages/
    index.astro             ← 首页 + React 岛
    blog/
      index.astro
      [...slug].astro
  components/islands/       ← HomeMotion.tsx, GameIsland.tsx
  content/config.ts         ← Content Collections schema
public/                     ← sitemap.xml, robots.txt（构建生成）
```

构建链路：`notion:sync` → `astro build` → `dist/` → GitHub Actions → GH Pages。

---

## §2 SEO 层

- 每页构建时输出：title、description、canonical、og:*、JSON-LD（BlogPosting / WebSite）。
- `lang="zh-CN"`；文章正文在首屏 HTML（非 JS 渲染）。
- sitemap.xml + robots.txt 构建生成；`seo-audit` CI 门禁。
- 搜索引擎：Google Search Console、必应站长、百度站长（免费提交 sitemap）。
- 内链：相关文章、分类聚合、首页精选 Top N 锚文本。

---

## §3 首页交互岛

- 静态层：H1、简介、作品集摘要、精选文章 3 篇（爬虫可见）。
- `HomeMotion.tsx`：`client:visible`（GSAP + Lenis）。
- `GameIsland.tsx`：`client:idle` 或点击启动；Phaser 动态 import。
- 博客页纯静态，无 React 岛；代码高亮构建时处理。

---

## §4 内容工作流

- **路径 1**：`yarn blog:new` → 编辑 md → git push。
- **路径 2**：Notion → `yarn notion:sync` → git push / Actions。
- 删除 `BlogEditor.jsx` 与 `/blog/editor` 路由。
- `yarn seo:meta-batch`：扫描、半自动补 description、slug 建议（默认不改已有 slug）。
- Frontmatter schema：`description` 必填；分阶段启用严格校验。

---

## §5 内容优化策略

### Top N 选题（10–20 篇）

**第一步：数据筛选（迁移前可做）**

| 信号 | 来源 | 权重 |
|------|------|------|
| 已有流量 | Google Analytics / 百度统计（若有） | 高 |
| 关键词潜力 | 标题含 React/TypeScript/AI 等高频技术词 | 高 |
| 内容质量 | 原创深度 > 翻译/聚合 | 中 |
| 元数据质量 | 已有 description、非随机 slug | 中 |
| 内链价值 | 可作为其他文章的 hub 文 | 中 |

**第二步：打分公式（简化）**

```
score = traffic_rank × 3 + keyword_score × 2 + quality_score × 2 + hub_score × 1
```

取 Top 15–20 进入深度优化队列。

**无分析工具时的 fallback**：从 96 篇中选手动规则——标题含明确技术关键词、字数 > 1500、非 `36ddf5c0` 类随机 slug、category 为 tech。

### 深度优化清单（每篇 Top N）

- [ ] title：含主关键词，≤ 60 字符，避免堆砌
- [ ] description：120–160 字，含关键词 + 价值陈述
- [ ] 正文：H2/H3 结构清晰；首段 100 字内出现主关键词
- [ ] 内链：链出 2–3 篇相关文；从其他 3 篇链入
- [ ] 图片：cover + alt 文本
- [ ] 发布后：百度/Google URL 检查各抽查 1 次

### 批量元数据（全库 96 篇）

1. `yarn seo:meta-batch --dry-run` → 人工扫报告
2. `yarn seo:meta-batch --apply` → 补 description、修正 title 过长
3. 启用 schema 严格校验
4. 全量构建 + `seo-audit` 通过

### 作品集页（优先级 C）

- 每项目：独立 title/description（构建时 head）
- 项目卡片链到 GitHub demo；描述含技术栈关键词
- 首页作品集摘要静态输出，带锚文本

---

## §6 构建与部署

### 本地命令

```bash
yarn notion:sync          # 可选：拉取 Notion
yarn seo:meta-batch       # 元数据维护
yarn build                # astro build（内含 seo-audit）
yarn preview              # 本地预览 dist
```

### GitHub Actions（deploy.yml 变更要点）

```yaml
- run: yarn install
- run: yarn build          # 替换 vite build
- uses: peaceiris/actions-gh-pages@v3
  with:
    publish_dir: ./dist
```

### 迁移阶段建议（4 阶段）

| 阶段 | 内容 | 验证 |
|------|------|------|
| **P0** | Astro 骨架 + 博客 SSG + SEO head + sitemap | 构建通过；博客页 view-source 见完整 HTML |
| **P1** | 首页/作品集/关于页迁移 + 交互岛 | LCP < 2.5s；游戏点击加载 |
| **P2** | 批量元数据 + seo-audit CI + 搜索引擎提交 | audit 0 error |
| **P3** | Top N 深度优化 + 内链 + 首页精选 | 站长平台收录抽查 |

### 回滚策略

- `main` 保留迁移前 tag；Actions 失败不部署
- 子路径 URL 不变，旧链接不失效

---

## §7 测试策略

| 类型 | 检查项 |
|------|--------|
| **构建** | `astro build` 0 error；`seo-audit` 0 error |
| **SEO 静态** | 每模板 view-source：title、description、canonical、JSON-LD |
| **爬虫模拟** | Google Rich Results Test 抽 3 篇博客 |
| **性能** | Lighthouse 首页：LCP、CLS、Performance ≥ 85 |
| **路由** | `/blog`、`/blog/{slug}`、404 重定向正常 |
| **功能** | Notion sync、blog:new、游戏点击启动、GSAP 动画 |
| **移动端** | 375px 布局；触控可用 |

### 上线后监控（免费）

- Google Search Console：收录数、抓取错误
- 必应站长：索引状态
- 百度站长：收录量、抓取诊断（每周看一次即可）

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 百度收录慢 | 静态 HTML + sitemap 提交；接受平台限制 |
| 迁移周期长 | 分 4 阶段；P0 先上线博客 SEO |
| Phaser 拖慢首页 | 点击后加载 + 固定占位高度 |
| 96 篇缺 description 阻塞构建 | 分阶段 schema；先 batch 再 strict |
| slug 改动丢收录 | 默认不改已有 slug |

---

## Implementation Handoff

设计已完整。实施前确认：

1. 从 P0（博客 SSG + SEO）开始，还是一次性整站迁移？
2. 是否将本文档作为实施唯一参考？

确认后可进入实施计划拆分（Issue / 任务列表）。
