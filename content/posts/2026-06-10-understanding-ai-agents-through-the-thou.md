---
title: Understanding AI Agents through the Thought-Action-Observation Cycle
slug: 2026-06-10-understanding-ai-agents-through-the-thou
description: AI Agent 的完整工作流程 —— 一个被称为 Thought Action Observation（思考 行动 观察）
  的循环机制。这也是大多数 Agent 框架（如 ReAct）的核心基础。 Agent 的三大核心组件 Agent 的工作是一个 持续循环 ：
  Thought（思考） → Action（行动） →…
author: 墨韵
date: 2026-06-10
categories:
  - note
tags:
  - LLM
draft: false
notionId: 38adf5c0-26f4-80d3-a93a-f7745c8101a1
notionSyncedAt: 2026-06-25T13:51:16.707Z
---

**AI Agent 的完整工作流程** —— 一个被称为 **Thought-Action-Observation（思考-行动-观察）** 的循环机制。这也是大多数 Agent 框架（如 ReAct）的核心基础。


### Agent 的三大核心组件


Agent 的工作是一个**持续循环**：


**Thought（思考） → Action（行动） → Observation（观察）**


具体拆解如下：

1. **Thought（思考）**：Agent 内部的 LLM 决定下一步该做什么，进行内部推理。
2. **Action（行动）**：Agent 调用工具，并传入相应的参数。
3. **Observation（观察）**：Agent 接收工具返回的结果，并进行反思。

这个循环类似编程中的 **while 循环**，会持续迭代，直到 Agent 完成目标为止。


在实际框架中，这些规则和指导方针通常被**直接嵌入系统提示**中，确保每次循环都遵循既定逻辑。


![AgentCycle.gif](images/blog/2026-06-10-understanding-ai-agents-through-the-thou/img-28e934a35b.gif)


### 经典示例：Alfred 天气 Agent


为了更好地理解，我们来看官方示例 —— **Alfred**（一个天气 Agent）。


**用户查询**： “What’s the current weather in New York?”（纽约现在的天气怎么样？）


Alfred 使用 `get_weather` 工具来完成任务。


### 详细展开：


**1. Thought（思考）**


内部推理：“用户需要纽约的当前天气信息。我有获取天气数据的工具，所以先调用天气 API 获取最新数据。”


**2. Action（行动）**


Alfred 以 JSON 格式输出工具调用：


```json
{
  "action": "get_weather",
  "action_input": {
    "location": "New York"
  }
}
```


**3. Observation（观察）**


工具返回结果，例如：


“Current weather in New York: partly cloudy, 15°C, 60% humidity.”（纽约当前多云，15°C，湿度 60%。）


这个观察结果会作为**新的上下文**添加到提示中。


**4. Updated Thought（更新思考）**


“现在我已经拿到天气数据，可以为用户生成最终答案了。”


**5. Final Action（最终输出）**


```markdown
Thought: I have the weather data now...
Final answer: The current weather in New York is partly cloudy with a temperature of 15°C and 60% humidity.
```


循环结束，答案返回给用户。


### Key Takeaways

- **迭代循环是关键**：Agent 不是一次性回答，而是根据反馈持续调整。如果观察结果有误，会重新进入循环修正。
- **工具集成让 Agent 强大**：通过调用外部工具，Agent 能突破 LLM 的静态知识，获取实时数据。
- **动态适应能力**：每次观察都为下一次思考提供新鲜信息，确保答案准确可靠。
- 这正是 **ReAct（Reason + Act）** 范式的核心思想。

### 总结


**Thought-Action-Observation 循环** 是构建可靠 AI Agent 的基础。它让 Agent 不再是单纯的“聊天机器人”，而是能**主动规划、调用工具、根据反馈迭代**的智能体。


**实际应用场景**：

- 实时信息查询（天气、股票、搜索）
- 多步复杂任务（数据分析、自动化工作流）
- 需要外部工具交互的任何场景