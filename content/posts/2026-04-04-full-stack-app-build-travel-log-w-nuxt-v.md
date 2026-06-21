---
title: Full Stack App Build | Travel Log w/ Nuxt, Vue, Better Auth,
slug: 2026-04-04-full-stack-app-build-travel-log-w-nuxt-v
description: "1. 核心框架与基础架构 Nuxt.js (Nuxt 3): 采用混合渲染模式（SSR 初始加载 + CSR
  客户端导航），利用其基于文件的路由系统、布局系统 ( ) 和自动导入功能。 Vue.js 3: 使用组合式 API ( )、 、 、 、 等核心钩子。
  Nitro & H3: Nuxt 底层的服务器框架，…"
author: 墨韵
date: 2026-04-04
categories:
  - note
tags:
  - Vue
  - Nuxt
draft: false
notionId: 36ddf5c0-26f4-80d9-8a58-f7fe6fd1587a
notionSyncedAt: 2026-05-27T04:39:15.152Z
---

### 1. 核心框架与基础架构

- **Nuxt.js (Nuxt 3):** 采用混合渲染模式（SSR 初始加载 + CSR 客户端导航），利用其基于文件的路由系统、布局系统 (`NuxtLayout`) 和自动导入功能。
- **Vue.js 3:** 使用组合式 API (`script setup`)、`ref`、`computed`、`watchEffect`、`onMounted` 等核心钩子。
- **Nitro & H3:** Nuxt 底层的服务器框架，用于构建跨运行时的 API 路由和事件处理器。
- **类型安全:** 全程使用 **TypeScript**，并利用 **Zod** 进行环境变量校验、API 提交数据校验及表单验证。

### 2. 前端 UI 与交互 (UX)

- **CSS 框架:** 使用 **Tailwind CSS** 处理样式，并通过 **DaisyUI**（基于 Tailwind 的组件库）快速构建按钮、卡片、模态框、输入框和加载转轮。
- **图标系统:** 集成 **Iconify**，使用 **Nuxt Icon** 模块，并主要采用 **Tabler** 图标集。
- **主题管理:** 使用 `color-mode` 模块实现亮/暗模式切换，并使地图样式随主题动态同步。
- **动画与过渡:** 使用 Vue 内置的 `<Transition>` 组件实现侧边栏文本的平滑缩放效果。
- **用户体验优化:**
    - **Skeleton Loader (骨架屏):** 在侧边栏数据加载时展示。
    - **确认对话框:** 防止用户在有未保存更改时意外退出表单 (`onBeforeRouteLeave`)。
    - **持久化状态:** 使用 `localStorage` 记住用户侧边栏的折叠/展开状态。
- **表单验证：vee-validate+zod**

### 3. 全局状态管理

- **Pinia:** 官方 Vue 状态管理库。
    - 构建多个 Store（如 `auth`、`sidebar`、`location`、`map`）实现跨组件（地图、卡片、侧边栏）的数据同步。
    - 使用 `storeToRefs` 保持解构后的响应性。

### 4. 后端与数据库

- **Drizzle ORM:** TypeScript ORM，用于定义数据库 Schema、生成迁移文件及执行类型安全的查询。
- **数据库:**
    - **SQLite (libSQL):** 本地开发使用。
    - **Turso:** 云端托管的 SQLite 服务，利用其 CLI 进行本地开发和云端迁移。
- **高级查询:** 设置数据库表关联（One-to-Many 关系），实现一次请求返回地点及其所有关联日志/图片。
- **级联删除 (****`onDelete: cascade`****):** 确保删除父级地点时自动清除关联的日志和记录。

### 5. 身份验证与安全

- **Better Auth:** 高度可配置的认证框架，集成了 GitHub OAuth 登录方案，支持客户端和服务器端库。
- **路由保护:** 使用服务器中间件 (Middleware) 拦截请求，确保只有登录用户才能访问 `/dashboard` 及其子路径。
- **CSRF 防护:** 集成 `nuxt-csurf` 模块，通过 CSRF Token 保护 POST、PUT、DELETE 等修改数据的请求。

### 6. 地图与地理位置功能

- **MapLibre GL:** 开源的地图 JavaScript 库，用于渲染交互式地图。
- **Open Free Map:** 免费的瓦片服务器 (Tile Server)。
- **Nominatim API (OpenStreetMap):** 用于地理编码，支持用户搜索地名并返回坐标。
- **地图高级交互:**
    - **自动缩放:** 根据标记点集合动态计算边界 (`fitBounds`)。
    - **飞往功能 (****`flyTo`****):** 在导航或悬停时平滑移动视角。
    - **交互标记:** 标记点响应悬停（高亮）、点击（弹出窗口），并支持在添加/编辑模式下拖拽标记来选择坐标。

### 7. 图片上传与存储 (S3 兼容)

- **存储方案:** 本地开发使用 **Minio** (Docker 容器)，生产环境使用 **AWS S3** 或 **Cloudflare R2**。
- **预签名 URL 流程 (Pre-signed Post):**
    1. 客户端向 API 请求上传权限。
    2. 后端验证权限后通过 **AWS SDK** 生成有时效性的上传 URL。
    3. 客户端直接将图片文件 POST 到存储桶，无需经过业务服务器，节省带宽。
- **客户端图像处理:** 在上传前使用 `OffscreenCanvas` 对图片进行缩放（最大宽度 1000px）和 JPEG 质量优化 (90%)。
- **完整性校验:** 使用 **SHA-256** 哈希值作为 Checksum，确保上传过程中文件未损坏或被篡改。

### 8. 工程化与 DevOps

- **代码规范:** 使用 **ESLint**（集成 Antfu 的配置）、**Husky**（预提交钩子）和 **lint-staged**（仅校验暂存文件）。
- **CI/CD:** 编写 **GitHub Actions** 工作流（YAML），在 Pull Request 时自动运行代码扫描，并由 **Vercel** 进行自动部署和预览部署。
- **本地测试 GA:** 使用 `act` 工具在本地 Docker 环境中运行 GitHub Actions 任务。
- **监控与调试:** 集成 **Sentry** 进行生产环境错误追踪、性能监控和会话回放。

### 9. 重构与最佳实践

- **通用 API 封装:** 创建自定义的 `defineAuthenticatedEventHandler`，在服务器端自动处理登录状态检查并提供类型安全的 `event.context.user`。
- **表单组件重构:** 将基础表单逻辑（验证、加载状态、错误显示、地图同步）提取为通用组件，通过 Vue 泛型支持多种数据类型（地点 vs. 记录）。
- **环境变量管理:** 禁止在业务代码中直接使用 `process.env`，统一通过 Zod 校验后的模块导入，确保配置项缺失时应用能够立即崩溃并报错。

---


参考：[https://www.youtube.com/watch?v=DK93dqmJJYg](https://www.youtube.com/watch?v=DK93dqmJJYg)

## 延伸阅读

- [LangChain JS Tutorial: Build AI With LangChain In JavaScript – Full Crash Course ](/blog/2026-04-25-langchain-js-tutorial-build-ai-with-lang/)
- [MoCode Phase 1 开发笔记 ](/blog/2026-06-14-mocode-phase-1/)
- [MoCode Phase 4 开发笔记](/blog/2026-06-15-mocode-phase-4/)
- [MoCode Phase 6 开发笔记](/blog/2026-06-18-mocode-phase-6/)
