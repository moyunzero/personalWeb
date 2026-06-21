# 墨韵 - 个人网站

基于 React 18 和 Vite 构建的现代化个人网站，展示作品集、博客和个人技能。项目采用最新的前端技术栈，注重性能优化和用户体验。

## 🚀 技术栈

- **核心框架**: React 18
- **构建工具**: Vite
- **路由管理**: React Router v7
- **样式解决方案**: TailwindCSS
- **动画效果**: GSAP
- **滚动优化**: Lenis
- **代码规范**: ESLint
- **类型检查**: PropTypes
- **Markdown 解析**: react-markdown
- **代码高亮**: highlight.js

## 📁 项目结构

```
zero-web/
├── src/
│   ├── assets/            # 静态资源（图片、字体等）
│   ├── components/        # 组件目录
│   │   ├── common/       # 通用组件
│   │   └── home/         # 首页相关组件
│   ├── constants/        # 常量配置
│   │   └── styles.js     # 样式常量（颜色、间距、字体等）
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useScrollToTop.js  # 滚动处理
│   │   └── useMediaQuery.js   # 响应式布局
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   │   ├── Home.jsx     # 首页
│   │   ├── Blog.jsx     # 博客列表页
│   │   └── BlogDetail.jsx # 博客详情页
│   ├── components/       # 组件目录
│   │   ├── blog/        # 博客相关组件
│   │   │   ├── BlogNavbar.jsx # 博客导航栏
│   │   │   └── BlogEditor.jsx # 博客编辑器
│   ├── blog/            # 博客加载逻辑（content/posts）
│   ├── data/            # 静态数据（如 projects.js）
│   ├── routes/          # 路由配置
│   ├── utils/           # 工具函数（防抖、节流等）
│   ├── App.jsx          # 应用入口
│   └── main.jsx         # 主入口文件
```

## ✨ 核心特性

- 🎯 **性能优化**
  - 路由懒加载
  - 组件记忆化
  - 图片懒加载
  - 滚动性能优化

- 📱 **响应式设计**
  - 移动端优先
  - 断点管理
  - 媒体查询封装

- 🎨 **现代化 UI**
  - TailwindCSS 样式
  - GSAP 动画
  - 平滑滚动
  - 主题定制

- 🛡️ **可靠性**
  - 错误边界处理
  - PropTypes 类型检查
  - 统一的错误处理
  - 加载状态反馈

- ✍️ **博客系统**
  - Markdown 编辑器
  - 实时预览
  - 一键发布
  - 代码高亮
  - 标签管理


## 🚀 快速开始

1. **克隆项目**
```bash
git clone [repository-url]
```

2. **安装依赖**
```bash
yarn install
```

3. **开发环境运行**
```bash
yarn dev
```

4. **生产环境构建**
```bash
yarn build
```

## ⚙️ 环境配置

在项目根目录创建 `.env` 文件：

```env
# API配置
VITE_API_URL=http://localhost:3000

# 环境标识
VITE_ENV=development

# 应用配置
VITE_APP_TITLE=墨韵
VITE_APP_DESCRIPTION=展示作品、博客和技能的个人网站
```

## 📝 博客功能使用指南

文章以 **Markdown 文件** 存放在仓库中，构建时自动加载，推送到 GitHub 后由 Actions 部署到 GitHub Pages。

### 目录结构

```text
content/
  categories.json       # 自定义分类（可随意增删）
  posts/*.md            # 文章
public/images/blog/     # 图片，按 slug 分子目录
```

### 发布一篇文章

使用命令行创建本地 Markdown，或通过 Notion 同步：

```bash
yarn blog:new "周末咖啡" --categories daily,photo
# 编辑 content/posts/xxx.md，将 draft 改为 false
# 图片放入 public/images/blog/xxx/
git add content public/images/blog && git commit -m "post: 周末咖啡" && git push
```

**从 Notion 同步（推荐写长文）**

在 Notion 里维护一篇「博客数据库」，本地或 GitHub Actions 一键拉取为 Markdown + 图片。

1. 打开 [Notion Integrations](https://www.notion.so/my-integrations) → 新建 Integration → 复制 **Internal Integration Token**
2. 在 Notion 新建数据库，建议列名：

| 列名 | 类型 | 说明 |
|------|------|------|
| Title | 标题 | 文章标题 |
| Status | 选择 | `Published` 或 `已发布` 才会同步 |
| Date | 日期 | 发布日期 |
| Categories | 多选 | 填 `daily` / `note` / `tech`（与 categories.json 一致） |
| Tags | 多选 | 标签 |
| Description | 文本 | 摘要 |
| Slug | 文本 | 可选，URL 路径；留空则自动生成 |
| Cover | 文件 | 可选封面图 |

3. 数据库页面 **··· → 连接** → 选择你的 Integration
4. 复制数据库 ID（URL 中 `notion.so/xxx?v=` 前面那段 32 位 ID）
5. 配置环境变量（复制 `.env.example` → `.env.local`）：

```bash
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=你的数据库ID
```

6. 同步：

```bash
yarn notion:sync              # 增量同步（仅新增或 Notion 有改动的文章）
yarn notion:sync --all        # 全量同步全部已发布文章
yarn notion:sync --page <id>  # 只同步一篇（Notion 页面 URL 中的 id）
yarn notion:sync --dry-run    # 仅预览，不写文件
git add content/posts public/images/blog && git commit -m "post: sync from Notion" && git push
```

**GitHub Actions 自动同步**：在仓库 Settings → Secrets 添加 `NOTION_TOKEN`、`NOTION_DATABASE_ID`，在 Actions 页运行 **Sync blog from Notion** 工作流即可自动提交。

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

编辑 `content/categories.json`，例如：

```json
[
  { "id": "daily", "label": "日常", "order": 1 },
  { "id": "note", "label": "笔记", "order": 2 }
]
```

文章的 `categories` 字段填写对应的 `id` 即可。

## 📖 开发指南

### 组件开发规范
- 使用函数组件和 Hooks
- 必要时使用 React.memo() 优化性能
- 使用 PropTypes 进行类型检查
- 组件文件使用 .jsx 扩展名
- 遵循单一职责原则

### 样式开发规范
- 优先使用 TailwindCSS 类名
- 遵循 styles.js 中的预定义常量
- 使用语义化的类名
- 保持样式的可复用性

### 性能优化实践
- 合理使用 React.lazy() 和 Suspense
- 使用 useCallback 和 useMemo 优化性能
- 图片使用 loading="lazy" 属性
- 使用防抖和节流控制事件频率

### 工具函数使用
- 从 utils/index.js 导入通用函数
- 使用 JSDoc 注释保持文档完整性
- 遵循函数式编程原则
- 保持函数的纯粹性

## 🔧 构建部署

### 本地构建

1. **构建项目**
```bash
yarn build
```
构建完成后，会在项目根目录生成 `dist` 文件夹，包含所有需要部署的静态文件。

2. **预览构建结果**
```bash
yarn preview
```
在浏览器中打开显示的地址（通常是 `http://localhost:4321/personalWeb/`），检查构建结果是否正常。

### SEO 与上线

- 站长平台提交步骤：[docs/WEBMASTER-SUBMISSION.md](./docs/WEBMASTER-SUBMISSION.md)
- `yarn seo:audit` — 构建前元数据校验（已接入 `yarn build`）
- `yarn seo:top-n-score` — Top N 文章评分队列
- `yarn seo:top-n-checklist` — Top N 深度优化 checklist
- `yarn perf:audit` — 首页 Lighthouse 门禁（需先 `yarn preview` 或脚本自动启动）
- `yarn test:uat:4` — Phase 4 自动化 UAT（内链 + 性能冒烟）

### 线上部署

详细的部署指南请查看 [**DEPLOYMENT.md**](./DEPLOYMENT.md) 文档。

**快速部署方案推荐：**

- 🌟 **Vercel**（推荐新手）- 零配置，5分钟完成部署
- 🚀 **Netlify** - 功能丰富，支持表单和函数
- 📄 **GitHub Pages** - 适合已有 GitHub 仓库的项目
- 🖥️ **云服务器 (Nginx)** - 完全控制，适合有服务器经验的开发者

**部署步骤概览：**
1. 构建项目：`yarn build`
2. 选择部署平台（推荐 Vercel）
3. 按照 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的详细步骤操作
4. 部署完成后检查路由、移动端适配等功能

详细步骤、配置说明、常见问题排查等，请查看 [**DEPLOYMENT.md**](./DEPLOYMENT.md)。

## 📄 许可证

MIT
