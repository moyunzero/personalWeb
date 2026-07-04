---
title: Loop Engineering
slug: 2026-06-12-loop-engineering
description: 一、引言 2026 年 6 月，AI 圈爆出一个新热词—— Loop Engineering（循环工程） 。OpenClaw 创始人
  Peter Steinberger 和 Anthropic Claude Code 负责人 Boris Cherny 的表态迅速刷屏： Peter
  Steinberger：“You sh…
author: 墨韵
date: 2026-06-12
categories:
  - note
tags:
  - ai
  - Agent
  - Loop Engineering
draft: false
notionId: 391df5c0-26f4-804f-b941-e013ce4fdbc6
notionSyncedAt: 2026-07-04T05:09:42.026Z
---

### 一、引言


2026 年 6 月，AI 圈爆出一个新热词——**Loop Engineering（循环工程）**。OpenClaw 创始人 Peter Steinberger 和 Anthropic Claude Code 负责人 Boris Cherny 的表态迅速刷屏：

- Peter Steinberger：“You shouldn’t be prompting coding agents anymore. You should be designing loops that prompt your agents.”（别再手动 Prompt 编码代理了，去设计能 Prompt 代理的 Loops。）
- Boris Cherny：“I don’t prompt Claude anymore. I have loops running that prompt Claude and figuring out what to do. My job is to write loops.”（我不再 Prompt Claude 了，我让 Loops 去 Prompt 它，我的工作是写 Loops。）

**它到底是什么？？**


**核心转变**：从**手动一步步指挥 AI（Prompt Engineering）** → **设计一个自主运行的系统（Loop）**，让 AI 自己发现任务、执行、验证、迭代，直到达成目标。你从“操作员”升级为“系统架构师”。


### 二、发展阶段：Boris Cherny 的三阶段理论


借用 Boris Cherny 的框架，划分了 AI 协作的演进路径：

1. **阶段一（传统）**：手动打字 + Prompt。你全程握着 AI，像用工具一样一问一答，上下文完全依赖你维护。
2. **阶段二（Harness Engineering）**：引入“马具/框架”，提供更好的环境、工具和结构，单次运行效率提升，但仍需人工干预。
3. **阶段三（Loop Engineering）**：构建**完整循环系统**。系统自动调度、维护状态、并行子代理、验证结果。你设计一次，系统持续运行（甚至在你睡觉时）。

**为什么重要？** 模型能力越来越强，瓶颈从“生成”转向“长期协调与验证”。Loop 把你从重复劳动中解放出来，但设计 Loop 本身要求更高的工程思维。


### 三、Loop 的组成：五块积木 + 一根记忆脊柱


一个可靠的 Loop 通常包含**五个核心构建块 + 记忆机制**（记忆脊柱）：

1. **Automations（自动化 / 调度）**：定时触发、心跳机制。自动发现任务、分发工作（如每天扫描 Issue、CI 失败等）。支持 `/goal`（直到满足条件才停止）或 cron。
2. **Worktrees（工作树 / 隔离环境）**：防止多个代理并行时文件冲突。每个代理在独立工作目录/分支运行。
3. **Skills（技能 / 项目知识）**：用 `SKILL.md` 等文件持久化项目规范、约定、历史知识。避免每次从零解释项目。
4. **Plugins & Connectors（插件与连接器）**：通过 MCP 等协议接入外部工具（GitHub、Linear、Slack、数据库等），让 Loop 真正“动手”而非只输出建议。
5. **Sub-agents（子代理）**：分离“制造者”与“检查者”。一个代理生成方案，另一个验证（不同指令或模型），避免自我肯定偏误。

**第六要素：记忆脊柱（Memory / State）**


使用 Markdown 文件、Linear 板或持久存储记录“已完成什么、下一步是什么”。模型单次上下文有限，记忆必须“在磁盘上”，而非仅靠上下文。


**工具支持对比**（Claude Code vs Codex 等）：

- 自动化：/goal、cron、hooks。
- 子代理：.claude/agents/ 或 .codex/agents/ 定义。
- 验证：独立小模型检查停止条件。

### 四、实战演示

1. **热身 Loop**：用 `/goal` 将模糊递归目标具体化。最小化示例，快速上手验证机制。
2. **完整内容流水线 Loop**：
    - 每天自动**攒选题**（爬取/扫描来源）。
    - 子 Agent 处理、打分、过滤。
    - 输出高质量内容。
    - 展示状态管理、子代理协作、定时触发全流程。

**实践Tips**：

- 从简单自动化开始。
- 确保清晰的 Pass/Fail 验证标准。
- 使用 Skills 减少重复解释。
- 监控 Token 消耗（长 Loop 很贵）。

### 五、多数人真的需要 Loop 吗？


**不要盲目跟风**，提供判断条件（四条件测试，大致总结）：

- **任务特性**：是否高重复、长期运行、有明确验证标准？
- **成本可控**：Token 预算是否支持？（尤其是 Claude 等顶级模型）
- **技术能力**：是否有调试 Loop、维护状态的能力？
- **收益 vs 复杂度**：简单任务用 Prompt/Harness 更高效。

**潜在风险**：

- Token 爆炸、无限循环。
- 验证不充分导致错误累积。
- 过度依赖导致人类审查能力下降。

**建议**：普通用户先掌握 Prompt + Harness；有复杂流水线需求时，再逐步引入 Loop。小步快跑，优先保证停止条件和人类最终审查。


### 六、优缺点总结


**优势**：

- 24/7 自主工作，极大提升生产力。
- 标准化、可复用、可共享（插件形式）。
- 适用于代码、内容、研究、运维等多场景。
- 代表 AI 工程范式升级（从工具到系统）。

**挑战与坑**：

- 设计门槛高（比 Prompt 难）。
- 成本高、调试复杂。
- 验证仍是人类责任（Loop 不能完全替代判断）。
- 上下文/状态管理难度大。

**提醒**：Loop 改变了工作，但没删除你作为工程师的责任。最终验证和决策仍靠人。

> 基于 [https://www.youtube.com/watch?v=WuMlsfKeWHc](https://www.youtube.com/watch?v=WuMlsfKeWHc)