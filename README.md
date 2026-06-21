# 墨韵 · 个人网站

个人作品集与博客站点，基于 **Astro 5** 静态生成，部署在 GitHub Pages。

**线上地址：** https://moyunzero.github.io/personalWeb/

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Astro 5（SSG）+ React 18 岛（首页交互） |
| 样式 | Tailwind CSS |
| 内容 | Markdown（`content/posts/`）+ Content Collections |
| 博客渲染 | remark/rehype、Shiki 高亮、Mermaid（文章页按需加载） |
| 动画 / 游戏 | GSAP、Lenis、Phaser（首页懒加载） |
| 部署 | GitHub Actions → GitHub Pages |
| 内容同步 | Notion → `yarn notion:sync` |

## 项目结构

```text
personalWeb/
├── content/
│   ├── categories.json      # 博客分类定义
│   └── posts/*.md           # 文章 Markdown
├── public/
│   ├── images/blog/         # 文章图片（按 slug 分子目录）
│   └── …                    # 验证文件、静态资源
├── src/
│   ├── pages/               # Astro 路由（首页、博客列表/详情/分类）
│   ├── layouts/             # BaseLayout、BlogLayout
│   ├── components/          # Astro 组件 + React 岛
│   ├── lib/                 # SEO、Markdown、博客工具
│   └── loaders/             # Content Collections loader
├── scripts/                 # notion-sync、seo-audit、new-post 等
├── docs/                    # 上线与站长文档
└── dist/                    # 构建产物（勿手改）
```

## 快速开始

```bash
git clone https://github.com/moyunzero/personalWeb.git
cd personalWeb
yarn install
yarn dev          # http://localhost:4321/personalWeb/
```

```bash
yarn build        # 含 seo:audit 门禁
yarn preview      # 本地预览 dist
yarn test         # Vitest
yarn lint         # ESLint
```

## 环境变量

复制模板并按需填写（**勿提交** `.env.local`）：

```bash
cp .env.example .env.local
```

| 变量 | 用途 |
|------|------|
| `VITE_CHAT_API_URL` | 首页聊天机器人 API（会打进前端 bundle） |
| `NOTION_TOKEN` | Notion 同步 Integration Token |
| `NOTION_DATABASE_ID` | Notion 博客数据库 ID |

详见 [.env.example](./.env.example) 中的可选 `NOTION_PROP_*` 覆盖项。

## 发布博客文章

文章以 Markdown 存放在仓库中；**推送到 `master` 后自动构建部署**。

### 方式 A：命令行新建

```bash
yarn blog:new "周末咖啡" --categories daily,photo
# 编辑 content/posts/xxx.md，将 draft 改为 false
# 图片放入 public/images/blog/<slug>/
git add content/posts public/images/blog
git commit -m "post: 周末咖啡"
git push
```

### 方式 B：从 Notion 同步（推荐长文）

**首次配置（只需一次）：**

1. [Notion Integrations](https://www.notion.so/my-integrations) 创建 Integration，复制 Token
2. 在 Notion 创建博客数据库，建议列名：

| 列名 | 类型 | 说明 |
|------|------|------|
| Title | 标题 | 文章标题 |
| Status | 选择 | `Published` 或 `已发布` 才会同步 |
| Date | 日期 | 发布日期 |
| Categories | 多选 | 与 `content/categories.json` 的 `id` 一致，如 `note`、`daily` |
| Tags | 多选 | 标签 |
| Description | 文本 | 摘要 |
| Slug | 文本 | 可选；留空则自动生成 |
| Cover | 文件 | 可选封面 |

3. 数据库 **··· → 连接** → 选择 Integration
4. 复制数据库 ID（URL 中 `notion.so/<ID>?v=` 那段 32 位字符）
5. 写入 `.env.local`：`NOTION_TOKEN`、`NOTION_DATABASE_ID`

**日常同步：**

```bash
yarn notion:sync              # 增量（新增或 Notion 有更新的文章）
yarn notion:sync --all        # 全量重拉全部已发布文章
yarn notion:sync --page <id>  # 只同步一篇（Notion 页面 URL 中的 id）
yarn notion:sync --dry-run    # 预览，不写文件

git add content/posts public/images/blog
git commit -m "post: sync from Notion"
git push
```

或在 GitHub **Actions → Sync blog from Notion** 手动运行（需已配置 Secrets：`NOTION_TOKEN`、`NOTION_DATABASE_ID`），工作流会自动 commit 并 push。

> Token 仅用于本地脚本或 CI，不会打进前端 bundle。

### Frontmatter 示例

```yaml
---
title: 周末咖啡
slug: 2025-05-27-weekend
description: 列表页摘要
author: 墨韵
date: 2025-05-27
categories:
  - daily
tags:
  - 生活
cover: images/blog/2025-05-27-weekend/cover.jpg
draft: false
---
正文 Markdown…
```

### 自定义分类

编辑 `content/categories.json`：

```json
[
  { "id": "note", "label": "技术记录", "order": 1 },
  { "id": "daily", "label": "日常", "order": 2 }
]
```

文章的 `categories` 填写对应 `id`。

## SEO 与质量门禁

| 命令 | 说明 |
|------|------|
| `yarn seo:audit` | 构建前元数据校验（已接入 `yarn build`） |
| `yarn seo:meta-batch --dry-run` | 全库元数据缺口报告 |
| `yarn seo:meta-batch --apply` | 批量补全 description 等 |
| `yarn seo:top-n-score` | Top N 文章评分队列 |
| `yarn seo:top-n-checklist` | Top N 深度优化 checklist |
| `yarn perf:audit` | Lighthouse 性能门禁（需 preview 或脚本自启） |
| `yarn verify:prod` | 生产环境冒烟（部署后 1–3 分钟） |
| `yarn test:uat:3` / `yarn test:uat:4` | 阶段性 UAT |

站长平台提交步骤：[docs/WEBMASTER-SUBMISSION.md](./docs/WEBMASTER-SUBMISSION.md)

上线检查清单：[docs/LAUNCH.md](./docs/LAUNCH.md)

## 部署

本站使用 **GitHub Pages**（子路径 `/personalWeb/`）。推送 `master` 触发 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)。

详细说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 相关文档

| 文档 | 说明 |
|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 构建、GitHub Pages、Notion CI |
| [docs/LAUNCH.md](./docs/LAUNCH.md) | 上线后检查与维护命令 |
| [docs/WEBMASTER-SUBMISSION.md](./docs/WEBMASTER-SUBMISSION.md) | Google / Bing 站长提交 |
| [docs/SEO-MIGRATION-DESIGN.md](./docs/SEO-MIGRATION-DESIGN.md) | Astro 迁移与 SEO 设计记录 |

## 许可证

MIT
