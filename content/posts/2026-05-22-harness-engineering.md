---
title: "Harness Engineering "
slug: 2026-05-22-harness-engineering
description: 一、Harness Engineering 是什么？ 定义 ：Harness Engineering（马具工程 / 框架工程）是指为
  AI Agent（特别是编码 Agent）设计和构建 高效运行环境 （Harness），让 Agent
  能够更稳定、可靠、可控地完成复杂任务。它像给马匹配备合适的“马具”，让 Agent…
author: 墨韵
date: 2026-05-22
categories:
  - note
tags:
  - Harness Engineering
  - ai
  - Agent
draft: false
notionId: 391df5c0-26f4-8026-8fad-f29e5141a2fe
notionSyncedAt: 2026-07-04T05:09:39.693Z
---

### 一、Harness Engineering 是什么？


**定义**：Harness Engineering（马具工程 / 框架工程）是指为 AI Agent（特别是编码 Agent）设计和构建**高效运行环境**（Harness），让 Agent 能够更稳定、可靠、可控地完成复杂任务。它像给马匹配备合适的“马具”，让 Agent 这匹“马”跑得更快、更远、更安全。


**核心目的**：

- 解决单次 Prompt 局限：上下文丢失、任务漂移、缺乏工具集成、难以长期运行等问题。
- 将 AI 从“聊天工具”升级为“可信赖的协作伙伴”。
- 强调**环境设计**而非单纯 Prompt 优化。

**与前后概念的关系**：

- **Prompt Engineering**：关注单次输入输出（说什么）。
- **Context Engineering**：关注上下文管理（记住什么、怎么组织）。
- **Harness Engineering**：更高层，构建整个**运行框架**（怎么持续工作、集成工具、验证结果、处理错误）。它是前两者的自然延伸和升级。

### 二、Harness Engineering 的来源与背景

- **演进背景**：LLM 能力提升后，瓶颈从“生成质量”转向“长期任务协调”和“工具使用可靠性”。
- **Anthropic 与 OpenAI 的推动**：两者都在产品中内置 Harness 相关特性（如 Claude Code、OpenAI Codex 中的工作区、Skills、Sub-agents 等）。
- **相关早期概念**：Agent Harness、Long-running Agents 等。

### 三、Harness 的核心组成要素


拆解 Harness 的关键组件：

1. **持久化环境与状态管理**：工作目录、文件系统隔离、跨会话记忆（避免每次从零开始）。
2. **工具集成（Tools & MCP）**：通过 MCP（Model Control Protocol？）等协议连接外部工具，让 Agent 真正“行动”（读写文件、调用 API、Git 操作等）。
3. **Skills / 项目知识库**：用 `SKILL.md` 等标准化文件封装项目规范、最佳实践，避免重复解释。
4. **子代理与分工**：Maker（生成） vs Checker（验证），并行处理减少错误。
5. **验证与安全机制**：自动测试、代码审查、停止条件、沙箱隔离。
6. **调度与自动化**：支持定时、事件触发，为后续 Loop 奠基。

**关键特性**：

- **隔离性**：Worktrees 或独立会话防止冲突。
- **可观测性**：日志、进度跟踪。
- **可扩展性**：插件化、团队共享。

### 四、OpenAI 和 Anthropic 的实战案例

- **OpenAI Codex / 相关产品**：
    - 内置 Automations、Worktrees、Skills、Sub-agents。
    - 支持 /goal 等长期运行模式。
    - 企业级应用：代码生成、Issue 处理、CI 集成等。
- **Anthropic Claude Code**：
    - 强调长运行 Agent Harness。
    - Hooks、Cron、Agent Teams 等特性。
    - 真实案例：内部用于复杂软件工程任务。

### 五、Harness Engineering 的优势与价值

- **提升效率**：Agent 能处理更长的任务链，减少人工干预。
- **提高可靠性**：通过验证闭环和工具集成，输出更可信。
- **降低门槛**：标准化 Harness 让非顶级专家也能构建强大 Agent 系统。
- **为 Loop Engineering 铺路**：Harness 是单次/短期运行的基础，Loop 是其定时、自主迭代的延伸。

### 六、争议与冷水：是突破还是炒作？

- **支持方**：确实解决了实际痛点，是软件工程在 AI 时代的自然演进。
- **质疑方**：部分是旧概念包装（类似 Agent Orchestration、Workflow）；Token 成本高；复杂 Harness 调试难度大，可能不适合所有人。
- **观点**：不是纯噱头，而是有实质技术突破，但需理性采用。不要盲目堆砌概念，先从小 Harness 实践验证收益。

**适用场景建议**：

- 适合复杂代码任务、长期 Agent 项目。
- 普通用户：先精通 Prompt + Context，再逐步加 Harness。
- 团队/企业：价值更大，可标准化工作流。
> 基于视频 [https://www.youtube.com/watch?v=7nCzfgDjSo8](https://www.youtube.com/watch?v=7nCzfgDjSo8)