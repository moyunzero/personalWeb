---
title: " 把重复 Prompt 固化成自己的 AI 工作流（Skill）"
slug: 2026-07-16-prompt-ai-skill
description: 1. 核心概念：从 Prompt → Workflow → Skill Prompt ：一次性指令，适合临时任务。 Workflow
  ：固化的多步流程（步骤 + 输入/输出规范）。 Skill ：打包好的 可复用资产 = Workflow + 模板 + 示例 + 坑表（常见错误）+
  自检清单 + 工具集成。 单纯的 P…
author: 墨韵
date: 2026-07-16
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3a1df5c0-26f4-8038-9e69-c4bb11c44eae
notionSyncedAt: 2026-07-18T09:02:34.380Z
---

### 1. 核心概念：从 Prompt → Workflow → Skill

- **Prompt**：一次性指令，适合临时任务。
- **Workflow**：固化的多步流程（步骤 + 输入/输出规范）。
- **Skill**：打包好的**可复用资产** = Workflow + 模板 + 示例 + 坑表（常见错误）+ 自检清单 + 工具集成。
> 单纯的 Prompt Chaining 已不够，推荐使用 **LangGraph** 构建有状态、支持循环、分支、人机协作的图结构工作流。LangChain 适合快速原型，LangGraph 适合生产级持久化与可靠性。

### 2. 为什么需要 Skill 化？

- 重复任务（如周报、PRD 撰写、内容创作、会议纪要、数据分析）每次重写 Prompt 浪费时间且质量不稳定。
- Skill 让 AI “记住”你的工作方式，下次只需提供输入材料即可输出高质量结果。
- 可以将 Skill 封装成 LangChain/LangGraph 的 **Runnable** 或 **Agent**，结合 LangSmith 进行观测、评估和迭代。

### 3. 如何构建一个 Skill（步步拆解）


步骤 1：识别重复任务

- 回顾最近 30 天工作，找出耗时 >30 分钟、重复、可结构化的任务。
- 示例：小红书笔记生成、会议纪要提炼、PPT 大纲创作、代码审查、研究报告等。

步骤 2：拆解成清晰 Workflow


使用 Markdown 或结构化格式定义：

1. **输入**：材料类型（文章、会议录音、数据等）。
2. **步骤**（Chain / Graph Nodes）：
    - 分析/拆解任务。
    - 检索/处理子任务。
    - 合成输出。
    - 自检与优化。
3. **输出**：指定格式（Markdown、JSON、Word 等）。
4. **决策门控**：什么时候需要人工介入、循环重试。

步骤 3：编写 Master Prompt / System Prompt

- 角色设定 + 完整步骤 + 输出格式 + 禁忌事项 + 自查清单。
- 示例结构（适用于 Claude / GPT / Grok 等模型）：

    ```plain text
    你是[专业角色]，严格按照以下 Skill 执行：
    
    ## 输入
    [描述]
    
    ## 步骤
    1. ...
    2. ...
    
    ## 输出格式
    ...
    
    ## 自检清单
    - ...
    ```


步骤 4：工具集成与自动化

- **RAG**：集成向量数据库（LlamaIndex 强项）处理文档检索。
- **Tools/Agents**：连接搜索、代码执行、API 调用。
- **Memory**：短期（对话历史）+ 长期（向量存储）。
- **框架选择**：
    - 简单链：LangChain `create_agent` 或 LCEL。
    - 复杂多代理/状态机：LangGraph（推荐生产）。
    - RAG 重度：LlamaIndex。

步骤 5：测试、迭代、打包

- 多轮测试不同输入。
- 记录失败案例 → 加入“坑表”。
- 保存为模板文件或 LangChain Hub 中的 Prompt / Chain。
- **观测**：用 LangSmith 追踪调用、成本、质量。

### 4. 2026 最新实践与工具推荐

- **LangGraph 主导状态ful Agents**：图结构优于线性 Chain，支持并行、循环、条件路由、人机中断。
- **生产部署**：结合 Postgres checkpointing、LangSmith 监控、部署到 LangServe。
- **多代理协作**：CrewAI / AutoGen 辅助，或 LangGraph 多图组合。
- **Prompt 工程演进**：少用“一步到位”，多用“成果导向 + 自检 + 迭代”。支持 MCP（Model Communication Protocol）等新标准。
- **No-Code / Low-Code**：结合 n8n、[Make.com](http://make.com/) 或自定义 UI 实现一键触发 Skill。
- **评估**：使用 LangChain 的 evaluation 模块 + 人工反馈循环。

### 5. 实用示例 Skill 模板


示例 1：周报生成 Skill

- 输入：本周任务列表、会议笔记、数据。
- 步骤：1. 提取成就 2. 量化影响 3. 问题 & 计划 4. 美化格式。
- 输出：专业 Markdown + 建议改进点。

示例 2：内容创作 Skill（小红书/PPT）

- 结合 RAG 检索历史风格 + 竞品分析 + SEO/爆款点。

（可扩展到 PRD、代码文档、研究综述等）


### 6. 常见坑 & 最佳实践

- **不要过度复杂**：从小 Skill 开始，逐步组合成大 Workflow。
- **Token 管理**：用摘要/分步处理长上下文。
- **一致性**：固定模型版本 + System Prompt。
- **安全/合规**：敏感数据脱敏，添加 guardrails。
- **版本控制**：把 Skill 存 Git + LangChain Hub。
- **成本优化**：小模型路由 + 缓存。
- **持续迭代**：每月 review Skill 效果，用 A/B 测试新版本。