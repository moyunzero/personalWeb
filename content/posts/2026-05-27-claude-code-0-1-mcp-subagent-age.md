---
title: "Claude Code 从 0 到 1 全攻略：MCP / SubAgent / Agent Skill / Hook / 图片 / 上下文处理
  / 后台任务 "
slug: 2026-05-27-claude-code-0-1-mcp-subagent-age
description: Claude Code：Anthropic 推出的代理式编码工具（Agentic Coding
  Tool），可在本地代码仓库中读取文件、编辑代码、执行终端命令、集成外部工具。
author: 墨韵
date: 2026-04-16
categories:
  - note
tags:
  - ai
draft: false
notionId: 36ddf5c0-26f4-80a5-b92d-d08e33d3c080
notionSyncedAt: 2026-05-27T05:50:52.817Z
---

**官方文档主入口**

- 英文：[https://code.claude.com/docs/en/overview](https://code.claude.com/docs/en/overview)
- 中文版参考：[https://code.claude.com/docs/zh-CN/overview](https://code.claude.com/docs/zh-CN/overview)

### 1. 名词解释与核心概念

- **Claude Code**：Anthropic 推出的**代理式编码工具（Agentic Coding Tool）**，可在本地代码仓库中读取文件、编辑代码、执行终端命令、集成外部工具。不是单纯聊天，而是拥有高权限、上下文感知的生产力引擎。支持跨文件操作、Git 集成、CI/CD 自动化。
- **核心能力**（官方概述）：理解整个代码库、自动写测试/修复 Bug、处理 merge conflict、更新依赖、生成 PR、连接外部系统（MCP）。
- **模型系列**：Opus / Sonnet / Haiku 等（视频中主要用 Sonnet 系列演示）。
- **关键扩展功能**：[CLAUDE.md](http://claude.md/)（持久记忆）、Skills（可调用工作流）、Subagents（隔离子代理）、Hooks（事件钩子）、MCP（模型上下文协议）、Plugins（打包插件）、Agent Teams（多代理协作，视频未深入但官方已支持）。

**官方最佳实践**：上下文是稀缺资源，优先用 Skills/Subagents 隔离信息，避免主会话污染。


---


### 2. 第一部分：环境搭建与基础交互


### 2.1 安装 Claude Code


视频演示命令（推荐 Linux/macOS/WSL）：


```bash
curl -fsSL <https://claude.ai/install.sh> | bash
```


**官方完整安装方式**（补充）：

- macOS Homebrew：`brew install --cask claude-code`（或 `claude-code@latest`）
- Windows PowerShell：`irm <https://claude.ai/install.ps1> | iex`
- Windows WinGet：`winget install Anthropic.ClaudeCode`
- 安装后自动后台更新。桌面版需付费订阅。

路径通常为 `~/.local/bin/claude`，加入 PATH 并 `source ~/.bashrc`。


常见问题：无代理/网络问题 → 用 npm 镜像：`npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com`。


### 2.2 登录与授权


首次运行 `claude` 会提示登录（账号 / API Key）。


**视频跳过技巧**：编辑 `~/.claude.json` 添加 `"hasCompletedOnboarding": true`。


视频演示接入国产模型（DeepSeek/GLM 等）绕过限制。


启动：在项目文件夹下直接输入 `claude` 进入交互界面。


### 2.3 第一个实战 + 三种模式详解


以 **my-todo** 项目为例，提出需求让 Claude Code 生成前后端代码。


**三种模式**（Shift + Tab 切换，或命令切换）：

1. **默认模式（Confirm）**：每步需手动确认（最安全，视频推荐新手用）。
2. **自动模式（Auto）**：全自动执行（“瓦库来打”风格）。
3. **规划模式（Plan Mode）**：只输出详细规划文档，不直接写代码（适合复杂任务）。

**官方补充**：CLI 也可直接 `claude "你的需求"` 启动一次性任务。


---


### 3. 第二部分：复杂任务处理与终端控制


### 3.1 执行终端命令


输入 `!` 或明确说 “用 Bash 执行” 进入终端模式。


示例：`open xxx` 启动项目、`git status` 等。


**危险动作**：创建文件、改权限等会触发权限弹窗（视频强调安全）。


### 3.2 规划模式深度使用


切换 Plan Mode → Claude 只输出架构规划、步骤列表，确认后才执行。


适合大型重构。


### 3.3 跳过权限检测（


命令：


```bash
claude --dangerously-skip-permissions
```


**官方警告**：仅测试环境使用，生产需结合规划模式。


### 3.4 后台任务管理


命令：`/task` 查看所有后台任务（npm run dev 等）。


按 `k` 结束指定任务。


**官方补充**：支持 `/schedule` 创建定时任务（PR 审查、依赖审计等），甚至电脑关机后仍可通过 Anthropic 云端运行。`/loop` 可在会话内重复提示轮询。


---


### 4. 第三部分：多模态与上下文管理


### 4.1 版本回滚（Rewind）


命令：`/rewind` 或连续按两次 ESC 进入回滚界面。


**注意**：仅回滚 Claude Code 写入的代码文件，不会回滚终端生成的文件。


### 4.2 图片处理 & MCP（Model Context Protocol）

- **MCP**：开放标准协议，让 Claude 连接外部工具/数据源（Figma、Notion、Jira、PostgreSQL、Sentry、GitHub 等）。
视频实战：上传 Figma 设计稿 → Claude 自动生成对应前端代码。

**官方完整 MCP 操作**：


```bash
# 添加远程 HTTP 服务（推荐）
claude mcp add --transport http figma <https://mcp.figma.com/mcp>

# 添加本地 Stdio 服务示例（Playwright 浏览器自动化）
claude mcp add --transport stdio playwright -- npx -y @playwright/mcp@latest

# 常用服务器示例
claude mcp add --transport http notion <https://mcp.notion.com/mcp>
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://..."

# 管理
claude mcp list          # 查看
claude mcp remove <name> # 删除
```


进入 MCP 模式：`/mcp`。


**范围**（--scope）：local（当前项目）、project（共享）、user（全局）。


**最佳实践**：MCP 提供“工具”，Skill 提供“使用说明”，二者结合效果最佳。


### 4.3 恢复历史会话（Resume）


`/resume` 或 `claude -c` 恢复上一会话。


### 4.4 上下文压缩与清除

- `/compact`：自动总结前文，节省 token，让记忆更清晰。
- `/clear`：清空上下文。**官方补充**：Auto Memory 会自动保存构建命令、调试经验，下次会话自动加载。

### 4.5 项目记忆文件（[CLAUDE.md](http://claude.md/)）


命令：`/init`（项目根目录生成 [CLAUDE.md](http://claude.md/)）。


内容示例：编码规范、架构决策、审查清单、偏好库等。


**官方最佳实践**：保持 <200 行，复杂规则移到 Skills。每次会话自动加载。


---


### 5. 第四部分：高级功能扩展与定制


### 5.1 Hook


功能：在特定事件（文件编辑前后、工具调用前后、会话开始/结束等）自动运行自定义逻辑（类似 AOP）。


命令：`/hooks` 进入管理界面。


**官方完整事件表**（补充关键部分）：

- SessionStart / SessionEnd
- PreToolUse / PostToolUse / PostToolUseFailure
- SubagentStart / SubagentStop
- FileChanged / PermissionRequest 等 20+ 事件。

**Hook 类型**：command（shell）、http、prompt（LLM 判断）、agent（子代理）。


**配置位置**：`~/.claude/settings.json`（全局）、`.claude/settings.json`（项目）、Skill/Subagent 前言。


**示例**（自动格式化）：


Hook 在 PostToolUse 事件触发 `prettier --write`。


**最佳实践**：Hooks 确定性强（不消耗上下文），适合 lint、格式化、安全检查。


### 5.2 Agent Skill


功能：自定义“技能包”，打包可重复工作流、参考文档、标准化指令。Claude 会自动发现并在相关任务时加载。


命令：`/skills`。


**结构**：YAML 前言（name、description、tools 等）+ Markdown 详细指令。


**触发方式**：直接输入 `/skill-name` 或自动相关加载（progressive disclosure，节省 token）。


**视频实战**：创建“视频字幕生成 Skill”。


**官方补充**：Skills 可包含 Hooks，支持 `context: fork` 隔离执行。技能市场已开放，可分享团队。


### 5.3 SubAgent


功能：创建**独立子智能体**，拥有独立上下文窗口、工具集、Skill，不污染主对话。


命令：`/agents`（或 `/subagents`）进入 UI 创建。


**创建方式**：

1. `/agents` → Create new agent → 生成或手动写 Markdown 文件（`.claude/agents/xxx.md`）。
2. YAML 前言定义 name、description、tools、model、mcpServers 等。

**隔离优势**：子代理在独立窗口运行，只返回摘要给主代理。


**视频对比 Skill**：Skill 共享上下文，SubAgent 完全独立。


**官方详细对比表**（补充）：


| 维度    | Agent Skill | SubAgent         | Agent Teams（扩展） |
| ----- | ----------- | ---------------- | --------------- |
| 上下文   | 共享主对话       | 完全独立             | 多独立会话，可互相通信     |
| 适用场景  | 重复工作流、参考文档  | 需隔离的任务、并行处理      | 复杂协作、辩论式研究      |
| 工具/隔离 | 无独立工具       | 独立工具、worktree 隔离 | 最高隔离            |
| 上下文消耗 | 低（描述+按需加载）  | 主会话不受影响          | 较高              |


**示例**：代码审查子代理、只读数据库查询子代理。


### 5.4 Plugin


功能：把 Skills、Hooks、Subagents、MCP 打包成可安装/分享的插件包（类似 VSCode 插件）。


命令：`/plugin` → Discover / Installed / Marketplaces。


**官方**：插件支持命名空间（如 `/my-plugin:review`），便于跨仓库复用和市场分发。


---


### 6. 结语、生产力工作流建议

- **核心优势**：本地高权限 + 多模态 + 持久上下文 + 高度可定制。
- **推荐工作流**（视频 + 官方）：
    1. 项目根目录 `/init` 生成 [CLAUDE.md](http://claude.md/) 定义规范。
    2. 用 Skills 封装重复任务 + MCP 接入外部工具。
    3. Hooks 自动善后（格式化、lint）。
    4. 复杂任务用 SubAgent 并行 + Agent Teams 协作。
    5. 生产环境：规划模式 + Hooks + 权限控制，避免 `-dangerously-skip-permissions`。

**官方额外提示**：

- 上下文优化：Skills/MCP 按需加载，SubAgent 隔离大任务。
- 跨设备：`/desktop` 切换桌面版，`-teleport` 拉取长任务。
- 生产部署：Agent SDK（Python/TS）可编程化 Claude Code 能力。