---
title: AGENTS.md：给 AI 的项目说明书
slug: 2026-07-07-agents-md-ai
description: 每次新会话，AI 都像一张白纸。它不知道技术栈、目录结构、编码规范、哪些是禁区……你不得不反复解释背景，效率低下，还容易出错。
  解决方案：在 项目根目录 创建一个 文件，把它当作 给 AI 看的项目说明书 （类似于 README，但专为 Agent 设计）。 AI 工具（如
  Cursor、Claude Code 等）通…
author: 墨韵
date: 2026-07-07
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 39cdf5c0-26f4-8060-a467-ef0be62345ef
notionSyncedAt: 2026-07-13T12:12:42.150Z
---

每次新会话，AI 都像一张白纸。它不知道技术栈、目录结构、编码规范、哪些是禁区……你不得不反复解释背景，效率低下，还容易出错。


解决方案：在**项目根目录**创建一个 `AGENTS.md` 文件，把它当作**给 AI 看的项目说明书**（类似于 README，但专为 Agent 设计）。


AI 工具（如 Cursor、Claude Code 等）通常会在会话启动时自动读取它，让 Agent 一进来就拥有项目背景知识。


### [AGENTS.md](http://agents.md/) 的六类核心内容


1. 项目简介


用一两句话说明项目是什么、技术栈是什么。


示例：


```markdown
## 项目简介
待办事项 Web 应用。前端 React + TypeScript，后端 Node.js + Express，数据库 SQLite。
```


2. 目录地图


帮助 AI 快速知道“去哪里改代码”。


示例：


```markdown
## 目录结构
- src/components/ — 前端组件
- src/api/ — 前端 API 调用层
- server/ — 后端服务
- server/routes/ — API 路由
- server/db/ — 数据库 schema 和迁移
```


3. 常用命令


避免 AI 猜测启动、测试、构建命令。


示例：


```markdown
## 常用命令
- 启动开发: npm run dev
- 测试: npm test
- Lint: npm run lint
- 构建: npm run build
```


4. 编码规范


明确团队习惯，让 AI 写出符合风格的代码。


示例：


```markdown
## 编码规范
- 组件使用函数式写法
- 样式使用 CSS Modules
- API 调用必须走 src/api/ 层
- 错误处理统一使用 try-catch
```


5. 红线（重中之重）


绝对不能碰的规则。


示例：


```markdown
## 红线
- 不要修改已有 migration 文件
- 不要引入新的 UI 框架
- 所有 API 变更必须同步更新测试
- 不要在生产代码里加 TODO
```


6. 容易踩的坑


记录项目特有的技术细节和历史坑。


示例：


```markdown
## 容易踩的坑
- SQLite 不支持 ALTER TABLE DROP COLUMN，需要重建表
- 前端 dev server 端口 3000，后端 3001
- 测试数据库和开发数据库分开
```


### 完整示例


```markdown
# AGENTS.md

## 项目简介
待办事项 Web 应用。前端 React + TypeScript，后端 Node.js + Express，数据库 SQLite。

## 目录结构
- src/components/ — 前端组件
- src/api/ — 前端 API 调用层
- ...

## 常用命令
...

## 编码规范
...

## 红线
...

## 容易踩的坑
...
```


二十几行就能极大提升协作起点。


### AGENTS.md 与 CLAUDE.md

- [**AGENTS.md**](http://agents.md/)：通用，多数 AI 工具都支持。
- [**CLAUDE.md**](http://claude.md/)：Claude Code 专用。

推荐在 `CLAUDE.md` 第一行写 `@AGENTS.md`，实现内容自动导入，避免维护两份文件。


### 常见踩坑

1. **不要写太长**：控制在 200-400 行，核心信息为主。详细文档放 `docs/` 目录。
2. **不要只依赖 /init**：AI 工具的初始化命令可生成初稿，但必须手动审查和持续维护。
3. **动态更新**：每次 AI 犯重复错误，就把规则加进去。它会逐渐变成“教训合集”。

---


文章来源：[https://mp.weixin.qq.com/s/S8-xjAr605DcgchB3WEbqw](https://mp.weixin.qq.com/s/S8-xjAr605DcgchB3WEbqw)