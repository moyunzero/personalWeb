---
title: 通过思考-行动-观察循环理解 AI 智能体 (Understanding AI Agents through the
  Thought-Action-Observation Cycle)
slug: 2026-05-19-ai-understanding-ai-agents-through-the-t
description: 核心组件 (Core Components) 智能体在一个持续的循环中工作： 思考 (Thought) → 行动 (Act) 和观察
  (Observe) 。 让我们一起分解这些行动： 1. 思考 (Thought) ：智能体的大语言模型 (LLM) 部分决定下一步应该是什么。 2. 行动
  (Action) ：智能体通过…
author: 墨韵
date: 2026-05-19
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 391df5c0-26f4-807c-80c0-d486c5006c9c
notionSyncedAt: 2026-07-04T05:09:32.840Z
---

## 核心组件 (Core Components)


智能体在一个持续的循环中工作：**思考 (Thought) → 行动 (Act) 和观察 (Observe)**。


让我们一起分解这些行动：

1. **思考 (Thought)**：智能体的大语言模型 (LLM) 部分决定下一步应该是什么。
2. **行动 (Action)**：智能体通过使用相关参数调用工具来采取行动。
3. **观察 (Observation)**：模型对工具的响应进行反思。

## 思考-行动-观察循环 (The Thought-Action-Observation Cycle)


这三个组件在一个持续的循环中协同工作。用编程的类比来说，智能体使用一个 **while 循环**：循环持续进行，直到智能体的目标被实现。


视觉上，它看起来是这样的：


![AgentCycle_%281%29.gif](images/blog/2026-05-19-ai-understanding-ai-agents-through-the-t/img-68afdffe8d.gif)


在许多智能体框架中，**规则和指南直接嵌入到系统提示中**，确保每个循环都遵循定义的逻辑。


在一个简化版本中，我们的系统提示可能看起来像这样：


![image.png](images/blog/2026-05-19-ai-understanding-ai-agents-through-the-t/img-2a93b6def3.png)


我们在这里看到，在系统消息中定义了：

- _智能体的行为_。
- _我们的智能体可以访问的工具_。
- _思考-行动-观察循环_，将其融入到大语言模型指令中。

看一个小例子，在深入研究每个步骤之前理解这个过程。


## 阿尔弗雷德，天气智能体 (Alfred, the Weather Agent)


我们创建了阿尔弗雷德，天气智能体。


用户问阿尔弗雷德："今天纽约的天气如何？"


![image.png](images/blog/2026-05-19-ai-understanding-ai-agents-through-the-t/img-7d4dbba1b7.png)


阿尔弗雷德的工作是使用天气 API 工具回答这个查询。


以下是循环的展开过程：


### 思考 (Thought)


**内部推理：**


在收到查询后，阿尔弗雷德的内部对话可能是：


_"用户需要纽约的当前天气信息。我可以访问一个获取天气数据的工具。首先，我需要调用天气API来获取最新的详细信息。"_


这一步显示了智能体将问题分解成步骤：首先，收集必要的数据。


![image.png](images/blog/2026-05-19-ai-understanding-ai-agents-through-the-t/img-d9a0163e24.png)


### 行动 (Action)


**工具使用：**


基于其推理和阿尔弗雷德知道有一个`get_weather`工具的事实，阿尔弗雷德准备一个 JSON 格式的命令来调用天气 API 工具。例如，它的第一个动作可能是：


思考：我需要检查纽约的当前天气。


```plain text
{
      "action": "get_weather",
      "action_input": {
        "location": "New York"
      }
    }
```


在这里，动作清楚地指定了要调用哪个工具（如get_weather）和要传递的参数（"location": "New York"）。


### 观察 (Observation)


**来自环境的反馈：**


在工具调用之后，阿尔弗雷德接收到一个观察结果。这可能是来自API的原始天气数据，如：


_"纽约当前天气：多云，15°C，湿度60%。"_


这个观察结果然后被添加到提示中作为额外的上下文。它作为现实世界的反馈，确认行动是否成功并提供所需的细节。


### 更新的思考 (Updated thought)


**反思：**


获得观察结果后，阿尔弗雷德更新其内部推理：


_"现在我有了纽约的天气数据，我可以为用户编写答案了。"_


### 最终行动 (Final Action)


然后阿尔弗雷德生成一个按照我们告诉它的方式格式化的最终响应：


思考：我现在有了天气数据。纽约当前天气多云，温度15°C，湿度60%。


最终答案：纽约当前天气多云，温度15°C，湿度60%。


这个最终行动将答案发送回用户，完成循环。


在这个例子中看到：

- **智能体在目标实现之前不断迭代循环：**

**阿尔弗雷德的过程是循环的**。它从思考开始，然后通过调用工具采取行动，最后观察结果。如果观察结果表明有错误或数据不完整，阿尔弗雷德可以重新进入循环来纠正其方法。

- **工具集成 (Tool Integration)：**

调用工具（如天气 API）的能力使阿尔弗雷德能够**超越静态知识并检索实时数据**，这是许多 AI 智能体的重要方面。

- **动态适应 (Dynamic Adaptation)：**

每个循环都允许智能体将新信息（观察）整合到其推理（思考）中，确保最终答案是明智和准确的。


这个例子展示了 _ReAct 循环_背后的核心概念：**思考、行动和观察的相互作用使 AI 智能体（AI Agent）能够迭代地解决复杂任务**。