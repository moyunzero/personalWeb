---
title: LLMs that Reason and Act
slug: 2025-08-15-llms-that-reason-and-act
description: ReAct 扩展 ：ReAct 系统通过将推理与行动相结合来增强 MRKL 框架，使 LLM 能够通过迭代的思维-行动循环来提高复杂任务的性能。
author: 墨韵
date: 2025-08-15
categories:
  - note
tags:
  - LLM
  - ai
draft: false
notionId: 374df5c0-26f4-80d6-90d0-f8c2383a815e
notionSyncedAt: 2026-06-03T13:49:55.235Z
---

## **什么是 ReAct？**


**ReAct（Reason + Act）** [**1**](https://learnprompting.org/docs/agents/react#footnote-label) 是一种范式，它使[**大型语言模型 (LLM)**](https://learnprompting.org/vocabulary/LLM) 能够通过自然语言推理和动作来解决复杂任务。它允许 [**LLM**](https://learnprompting.org/vocabulary/LLM) 执行某些动作，例如检索外部信息，然后基于检索到的数据进行推理。


ReAct 系统扩展了[**模块化推理、知识和语言 (MRKL) 系统** ](https://learnprompting.org/docs/advanced_applications/mrkl)，使其能够推理自己可以执行的操作。


## **例子**


以下是来自 HotPotQA [**2**](https://learnprompting.org/docs/agents/react#footnote-label) 的示例，这是一个需要复杂推理的问答数据集。ReAct 允许逻辑学习模型 (LLM) 对问题进行推理（思维 1），并执行操作（例如，查询 Google）（行动 1）。然后，它接收观察结果（观察 1），并继续执行思维-行动循环，直到得出结论（行动 3）。


![%E6%88%AA%E5%B1%8F2026-06-03_16.34.10.png](images/blog/2025-08-15-llms-that-reason-and-act/img-ad999e1cbb.png)


熟悉[**强化学习（RL）**](https://learnprompting.org/vocabulary/reinforcement_learning) 的读者可能会发现，这个过程与经典的 RL 状态-动作-奖励循环类似。ReAct 在其论文中对此进行了一些形式化描述。


## **结果**


谷歌使用 ReAct 对 PaLM LLM [**3**](https://learnprompting.org/docs/agents/react#footnote-label) 进行了实验，结果显示其在复杂推理任务中取得了显著改进。ReAct 在 FEVER [**4**](https://learnprompting.org/docs/agents/react#footnote-label) 等数据集上进行了测试，重点关注事实提取和验证


![%E6%88%AA%E5%B1%8F2026-06-03_16.34.41.png](images/blog/2025-08-15-llms-that-reason-and-act/img-4960456c3a.png)


---


文章来源：[https://learnprompting.org/docs/agents/react](https://learnprompting.org/docs/agents/react)