---
title: Learn Claude Code -1-Agent Loop
slug: 2026-06-29-learn-claude-code-1-agent-loop
description: '"One loop & Bash is all you need" — 一个工具 + 一个循环 = 一个 Agent。
  Harness 层 : 循环 — 模型与真实世界的第一道连接。 问题 你提出了一个问题给大模型：“帮我读取下我的目录下有哪些文件，并且执行XXX.py”。
  模型能输出一条 bash 命令，但输出完了就…'
author: 墨韵
date: 2026-06-29
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 396df5c0-26f4-8009-b9a6-d417e00ff98d
notionSyncedAt: 2026-07-22T15:41:35.741Z
---

> _"One loop & Bash is all you need"_ — 一个工具 + 一个循环 = 一个 Agent。
>
> **Harness 层**: 循环 — 模型与真实世界的第一道连接。
>
>

---


## 问题


你提出了一个问题给大模型：“帮我读取下我的目录下有哪些文件，[并且执行XXX.py](http://xn--xxx-z38dz26e9mfhq8e.py/)”。


模型能输出一条 bash 命令，但输出完了就停了，它不会自己跑，也不会看到结果后继续推理。


你可以手动跑一遍，把输出粘贴回对话框，让它接着干。下一个命令出来，你再跑一遍、再贴回去。


每一个来回，你都在做中间层。


---


## 解决方案


![agent-loop.svg](images/blog/2026-06-29-learn-claude-code-1-agent-loop/img-c04d8a7fa7.svg)


一个 `while True` 循环，模型调用工具就继续，不调用就停。整个过程只有两个信号：


| 信号                          | 含义           | 循环动作            |
| --------------------------- | ------------ | --------------- |
| `stop_reason == "tool_use"` | 模型举手说"我要用工具" | 执行 → 结果喂回去 → 继续 |
| `stop_reason != "tool_use"` | 模型说"我做完了"    | 退出循环            |


---


## 工作原理


**第 1 步**：把用户的问题作为第一条消息。


```python
messages = [{"role": "user", "content": query}]
```


**第 2 步**：将消息和工具定义一起发给 LLM。


```python
response = client.messages.create(
    model=MODEL, system=SYSTEM, messages=messages,
    tools=TOOLS, max_tokens=8000,
)
```


**第 3 步**：追加模型回答，检查它是否调了工具。没调 → 结束。


```python
messages.append({"role": "assistant", "content": response.content})
if response.stop_reason != "tool_use":
    return
```


**第 4 步**：执行模型要求的工具，收集结果。


```python
results = []
for block in response.content:
    if block.type == "tool_use":
        output = run_bash(block.input["command"])
        results.append({
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": output,
        })
```


**第 5 步**：把工具结果作为新消息追加，回到第 2 步。


```python
messages.append({"role": "user", "content": results})
```


组装为一个完整函数：


```python
def agent_loop(messages):
    while True:
        response = client.messages.create(
            model=MODEL, system=SYSTEM, messages=messages,
            tools=TOOLS, max_tokens=8000,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            return

        results = []
        for block in response.content:
            if block.type == "tool_use":
                output = run_bash(block.input["command"])
                results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": output,
                })
        messages.append({"role": "user", "content": results})
```


这就是最小可运行的 agent harness 内核。它不是智能本身，而是让模型能持续行动的最小运行框架，模型负责决策（要不要调工具、调哪个），harness 负责执行（调了就跑、结果喂回去）。

<details>
<summary>深入 CC 源码</summary>
> 
>
> 核心差异就两个：CC 不看 `stop_reason` 字段而是检查内容里有没有 tool_use 块（因为流式响应中 stop_reason 不可靠）；CC 有更多的退出路径和恢复策略做生产级保护。
>
>

**本文30 行** **`while True`** **就是 CC 1729 行的核心。** 下面每一项都是在这个核心上叠加的保护机制。


一、循环结构差异


本文检查 `response.stop_reason`。CC 不把它作为循环继续的唯一依据——流式响应中 `stop_reason` 可能还没更新但内容里已经有 `tool_use` 块了。CC 用 `needsFollowUp` 标志：接收到流式消息时（`query.ts:830-834`），只要检测到 `tool_use` 块就设为 `true`；`QueryEngine.ts` 会从 `message_delta` 捕获真实 `stop_reason` 用于其他逻辑，但 query loop 本身靠 `needsFollowUp` 决定是否继续。


```typescript
// query.ts:554-558
// stop_reason === 'tool_use' is unreliable.
// Set during streaming whenever a tool_use block arrives.
let needsFollowUp = false
```


二、State 对象 10 字段（本文只用 messages）


| #  | 字段                             | 用途                       |
| -- | ------------------------------ | ------------------------ |
| 1  | `messages`                     | 当前迭代的消息数组                |
| 2  | `toolUseContext`               | 工具、信号、权限上下文              |
| 3  | `autoCompactTracking`          | 压缩状态追踪                   |
| 4  | `maxOutputTokensRecoveryCount` | token 恢复尝试次数（上限 3）       |
| 5  | `hasAttemptedReactiveCompact`  | 本轮是否已尝试响应式压缩             |
| 6  | `maxOutputTokensOverride`      | 8K→64K 的升级覆盖             |
| 7  | `pendingToolUseSummary`        | 后台 Haiku 生成的 tool use 摘要 |
| 8  | `stopHookActive`               | 停止钩子是否产生阻塞错误             |
| 9  | `turnCount`                    | 轮次计数（maxTurns 检查）        |
| 10 | `transition`                   | 上一次继续原因                  |

> 注：`taskBudgetRemaining`（`query.ts:291`）是 loop-local 局部变量，不在 State 上。源码注释明确写了 "Loop-local (not on State)"。

三、多条退出和继续路径


本文只有 1 条退出路径（模型不调工具就结束）。生产版有多条退出和继续路径，覆盖 blocking limit、prompt too long、model error、abort、hook stop、max turns、token budget continuation、reactive compact retry 等场景。每种场景都有对应的恢复或退出策略。


四、流式工具执行和 QueryEngine


CC 的 `StreamingToolExecutor`（`query.ts:561`）让工具在模型还在生成时就开始并行执行（根据工具是否 concurrency-safe 决定并发或独占）。`QueryEngine.ts` 额外加了费用超限、结构化输出验证失败等保护。


</details>