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
| 内容同步 | Notion 博客 `yarn notion:sync` · 听力打卡 `yarn listening:sync` |

## 项目结构

```text
personalWeb/
├── content/
│   ├── categories.json      # 博客分类定义
│   ├── posts/*.md           # 文章 Markdown
│   └── listening/*.json     # 听力打卡静态数据（sync 生成）
├── public/
│   ├── images/blog/         # 文章图片（按 slug 分子目录）
│   ├── audio/listening/     # 听力 TTS mp3（sync 生成，可提交）
│   └── …                    # 验证文件、静态资源
├── src/
│   ├── pages/               # Astro 路由（首页、博客、/listening/）
│   ├── layouts/             # BaseLayout、BlogLayout
│   ├── components/          # Astro 组件 + React 岛
│   ├── lib/                 # SEO、Markdown、博客、listening loader
│   └── loaders/             # Content Collections loader
├── scripts/                 # notion-sync、listening-sync、seo-audit、new-post 等
├── tools/piper-venv/        # 本机 Piper TTS（gitignore；勿提交）
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
| `NOTION_TOKEN` | Notion 同步 Integration Token（博客 + 听力共用） |
| `NOTION_DATABASE_ID` | Notion **博客**数据库 ID |
| `NOTION_LISTENING_DATABASE_ID` | Notion **听力打卡**数据库 ID（须与博客库不同） |

详见 [.env.example](./.env.example) 中的可选 `NOTION_PROP_*` / `NOTION_LISTENING_*` 覆盖项。

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

## 同步听力打卡（`/listening/`）

公开页 `/listening/` 只读仓库内静态文件：**不**在 `yarn build` 时拉 Notion。把 Notion「完成」打卡变成 JSON + 可选 mp3 后提交即可上线。

### 首次配置（只需一次）

1. 同一 Integration Token（`NOTION_TOKEN`）即可；在听力库页面 **··· → 连接** → 选中该 Integration  
2. 复制听力数据库 ID（URL 里 32 位，须 **≠** `NOTION_DATABASE_ID`）  
3. 写入 `.env.local`：

```bash
NOTION_TOKEN=…
NOTION_DATABASE_ID=…                 # 博客库（双库校验仍需要）
NOTION_LISTENING_DATABASE_ID=…       # 听力库
```

4. （可选，本机有声）准备 Piper：仓库已有 `tools/piper-venv/` 时，同步时把该 `bin` 放进 `PATH`（系统 `python3` 往往没有 `piper` 模块）。TTS 失败仍会写 JSON，卡片可揭晓，只是播放禁用。

默认只同步「打卡状态 = 完成」的页；正文需有「内容」/「内容摘要」下的英文句；词汇表列名支持「解释」→ 卡片「释义」。

### 一键日常同步（推荐）

```bash
# 全量：拉全部「完成」页 + 生成/更新 mp3（若 Piper 可用）
PATH="$(pwd)/tools/piper-venv/bin:$PATH" yarn listening:sync --all

# 提交产物（勿提交 .onnx / piper-venv / listening-tts-scratch）
git add content/listening public/audio/listening
git commit -m "listening: sync from Notion"
git push
```

本地预览：`yarn dev` → http://localhost:4321/personalWeb/listening/（或从博客「打卡」入口进入）。

### 其他常用命令

```bash
yarn listening:sync              # 增量（Notion 有更新才写）
yarn listening:sync --page <id>  # 单页
yarn listening:sync --dry-run    # 预览，不写文件
```

或在 GitHub **Actions → listening-sync**（`workflow_dispatch`）手动跑：需 Secrets `NOTION_TOKEN`、`NOTION_LISTENING_DATABASE_ID`、`NOTION_DATABASE_ID`。该工作流**不**挂在 `yarn build` 上。

> 与博客 sync 相同：Token 仅本机 / Actions，永不进前端。

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
