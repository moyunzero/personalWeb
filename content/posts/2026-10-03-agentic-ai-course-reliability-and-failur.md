---
title: Agentic AI Course - Reliability and Failure Handling
slug: 2026-10-03-agentic-ai-course-reliability-and-failur
description: Agentic AI Course-8
author: 墨韵
date: 2026-10-03
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3f1df5c0-26f4-8056-8f49-e5dde3c6c740
notionSyncedAt: 2026-10-07T14:38:14.331Z
---

### **第 8 节：可靠性与故障处理**


智能体会失败。大语言模型会幻觉。工具会超时。外部 API 会返回 500 错误。上下文窗口会溢出。智能体会进入无限推理循环，在任何人注意到之前消耗数百美元的词元。演示系统与生产系统的区别不在于失败是否发生，而在于失败发生时系统的行为方式。


演示智能体只处理顺利路径。生产智能体处理每一条路径。本节覆盖使智能体可靠的工程模式：重试、回退、循环预算、优雅降级和幂等性。


**我们将覆盖的内容**

1. 重试策略与回退路由：工具调用或大语言模型调用失败时该怎么做
2. 循环预算与终止条件：防止失控智能体
3. 优雅降级：组件宕机时维持有用行为
4. 幂等性：确保重试的操作不会造成重复副作用

**这在智能体系统中的体现位置**


| 故障类型             | 会出现什么问题      | 工程模式           | 不处理的后果              |
| ---------------- | ------------ | -------------- | ------------------- |
| 工具调用失败（API 超时）   | 智能体无法完成操作    | 带退避的重试，然后回退    | 智能体崩溃或幻觉结果          |
| 大语言模型调用失败（提供商宕机） | 智能体完全无法推理    | 回退到备用模型        | 整个智能体宕机             |
| 智能体循环（循环推理）      | 智能体无限推理，燃烧词元 | 循环预算、时间限制、词元限制 | 每次事故浪费 $50+ API 调用费 |
| 部分系统宕机           | 知识库或某个工具宕机   | 优雅降级           | 智能体因幻觉给出错误答案        |
| 写操作网络重试          | 同一操作执行两次     | 带请求 ID 的幂等性    | 客户被退款两次             |


这些故障中的每一个都在生产智能体系统中发生过。每一个都可以用本节的模式预防。这些模式直接连接到我们将在第 10 节构建的监控和告警基础设施。


---


### 重试策略与回退路由


**当事情失败时，再试一次。然后尝试其他方法。**


对瞬态失败（网络超时、速率限制、临时服务器错误）的第一反应是重试。并非所有失败都是瞬态的，所以重试需要结构：多少次尝试、每次之间等多久、重试耗尽后做什么。


**指数退避**


每次重试之间等待更长时间。这防止用快速连续请求猛击一个正在挣扎的服务，那会让问题更糟。


```plain text
重试 1：等 1 秒，然后重试
重试 2：等 2 秒，然后重试
重试 3：等 4 秒，然后重试
（3 次尝试后重试耗尽，总等待：7 秒）
```


添加抖动（小的随机延迟）以防止惊群效应：如果 100 个智能体实例都以完全相同的间隔重试，目标服务会遭受同步尖峰冲击。


**实现**


```python
import asyncio
import random
from openai import OpenAI

class ReliableToolCaller:
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay

    async def call_with_retry(self, tool_fn, **kwargs) -> dict:
        last_error = None
        for attempt in range(self.max_retries):
            try:
                result = await tool_fn(**kwargs)
                return {"status": "success", "data": result, "attempts": attempt + 1}
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt) + random.uniform(0, 0.5)
                    await asyncio.sleep(delay)
        return {"status": "failed", "error": str(last_error), "attempts": self.max_retries}

    async def call_with_fallback(self, primary_fn, fallback_fn, **kwargs) -> dict:
        result = await self.call_with_retry(primary_fn, **kwargs)
        if result["status"] == "success":
            return result

        fallback_result = await self.call_with_retry(fallback_fn, **kwargs)
        if fallback_result["status"] == "success":
            fallback_result["used_fallback"] = True
            return fallback_result

        return {
            "status": "all_failed",
            "error": "Primary and fallback both failed",
            "should_escalate": True
        }
```


**回退路由**


当重试耗尽时，切换到替代路径。回退不是对同一件事的重试。它们是实现同一目标的替代方法。


![%E6%88%AA%E5%B1%8F2026-10-06_22.05.43.png](images/blog/2026-10-03-agentic-ai-course-reliability-and-failur/img-c3064acea6.png)


**客户支持智能体的回退示例**


| 主路径                       | 故障          | 回退              | 最终回退                         |
| ------------------------- | ----------- | --------------- | ---------------------------- |
| 通过订单 API 的 order_lookup   | API 超时      | 检查订单缓存（Redis）   | 告诉客户：“我现在无法访问订单详情。让我为您连接专家。” |
| 用于推理的 GPT-4o              | OpenAI 速率限制 | Claude Sonnet   | 使用更简单提示的 GPT-4o-mini         |
| 从向量数据库进行 RAG 检索           | 向量数据库宕机     | 对缓存 FAQ 进行关键词搜索 | 用通用指导回应，标记供人工审查              |
| 通过支付 API 的 refund_process | 支付服务错误      | 将退款排队等待人工处理     | 告诉客户：退款将在 24 小时内处理           |


模式总是一样的：尝试主路径，如果瞬态失败则重试，如果重试耗尽则回退到替代方案，如果所有自动路径都失败则升级到人工。绝不幻觉结果。绝不静默假装操作成功。

> **提示：** 在讨论可靠性时，描述完整链条：“我会实现带指数退避的重试，最多 3 次尝试。如果重试失败，智能体回退到缓存结果或替代数据源。如果回退也失败，智能体向客户承认问题并升级到人工智能体。在任何时候智能体都不会猜测或捏造响应。”

---


### 循环预算与终止条件


**自主智能体的危险**


运行 ReAct 循环（推理、行动、观察、重复）的自主智能体可以无限循环。智能体推理它需要更多信息，调用工具，观察结果，决定它需要更多信息，调用另一个工具，然后继续。没有硬停止，这个循环会一直运行，直到上下文窗口填满或 API 额度耗尽。


这不是理论风险。它在生产中发生过。


```plain text
真实故障场景（实际成本：8 分钟 $47）：

步骤 1：  智能体推理：“我需要检查客户的订单历史”
步骤 2：  调用 order_lookup → 返回 15 个订单
步骤 3：  智能体推理：“让我检查每个订单的状态”
步骤 4：  调用 order_lookup 15 次（每个订单一次）
步骤 5：  智能体推理：“让我与退货历史交叉引用”
步骤 6：  调用 return_lookup 15 次
步骤 7：  智能体推理：“有些退货有相关工单，让我检查那些”
步骤 8：  为 8 个工单调用 ticket_lookup
...
步骤 43：仍在继续。43 次大语言模型调用。38 次工具调用。$47 API 成本。
         客户仍在等待。智能体尚未响应。
```


**每个智能体需要的三种预算**


| 预算类型 | 它限制什么                | 典型值                    | 超出时会发生什么       |
| ---- | -------------------- | ---------------------- | -------------- |
| 步骤预算 | 推理-行动-观察循环次数         | 5-15 步                 | 强制终止，用最佳可用信息响应 |
| 时间预算 | 整个任务的挂钟时间            | 30-60 秒（交互式）           | 强制终止，升级        |
| 词元预算 | 所有调用中消耗的总词元（输入 + 输出） | 每个任务 50,000-100,000 词元 | 强制终止，升级        |


**实现**


```python
import time

class BudgetedAgentLoop:
    def __init__(self, client, max_steps: int = 10, max_seconds: float = 45.0,
                 max_tokens: int = 80000):
        self.client = client
        self.max_steps = max_steps
        self.max_seconds = max_seconds
        self.max_tokens = max_tokens

    async def run(self, messages: list, tools: list) -> dict:
        start_time = time.time()
        total_tokens = 0
        steps = []

        for step in range(self.max_steps):
            elapsed = time.time() - start_time
            if elapsed > self.max_seconds:
                return self._forced_termination(
                    "time", steps, f"Time limit reached ({elapsed:.1f}s)"
                )

            if total_tokens > self.max_tokens:
                return self._forced_termination(
                    "tokens", steps, f"Token limit reached ({total_tokens} tokens)"
                )

            response = await self.client.chat.completions.create(
                model="gpt-4o", temperature=0, messages=messages, tools=tools
            )

            usage = response.usage
            total_tokens += usage.prompt_tokens + usage.completion_tokens
            message = response.choices[0].message
            steps.append({"step": step + 1, "tokens_used": total_tokens, "elapsed": elapsed})

            if message.tool_calls:
                tool_results = await self._execute_tools(message.tool_calls)
                messages.append(message)
                messages.extend(tool_results)
            else:
                return {
                    "status": "completed",
                    "response": message.content,
                    "steps": len(steps),
                    "tokens": total_tokens,
                    "elapsed": time.time() - start_time
                }

        return self._forced_termination(
            "steps", steps, f"Step limit reached ({self.max_steps} steps)"
        )

    def _forced_termination(self, reason: str, steps: list, message: str) -> dict:
        return {
            "status": "terminated",
            "reason": reason,
            "message": message,
            "steps": len(steps),
            "fallback_response": "我无法完全解决您的请求。"
                                 "让我为您连接可以帮忙的专家。"
        }
```


**选择预算值**


没有普遍正确的值。正确的预算取决于任务和用户体验期望。


| 智能体类型    | 步骤预算    | 时间预算 | 词元预算    | 理由          |
| -------- | ------- | ---- | ------- | ----------- |
| 交互式支持智能体 | 5-8 步   | 30 秒 | 50K 词元  | 客户实时等待      |
| 后台研究智能体  | 15-25 步 | 5 分钟 | 200K 词元 | 没人在等待，质量更重要 |
| 分类/分诊智能体 | 1-2 步   | 5 秒  | 10K 词元  | 简单决策，速度关键   |
| 投诉解决智能体  | 8-12 步  | 60 秒 | 80K 词元  | 复杂但客户在等待    |


对于客户支持智能体，8 步步骤预算、30 秒时间预算和 50K 词元预算覆盖绝大多数交互。超过这些限制的 1-2% 情况升级到人工智能体。


---


### 优雅降级


**当东西坏了时，少坏一点**


优雅降级意味着智能体即使在某些能力不可用时也继续提供价值。智能体做得更少，而不是什么都不做。它承认它不能做什么，而不是假装一切正常。


**降级级别**


| 级别      | 能力           | 示例状态           | 智能体行为                              |
| ------- | ------------ | -------------- | ---------------------------------- |
| 级别 0：完整 | 所有工具和知识可用    | 正常操作           | 完整能力。回答问题、处理操作、检索知识。               |
| 级别 1：降低 | 部分工具不可用      | 支付 API 宕机      | 可以回答问题、查询订单，但不能处理退款。将退款请求排队等待稍后处理。 |
| 级别 2：只读 | 行动工具不可用，知识可用 | 所有写 API 宕机     | 可以从知识库回答问题，但不能采取任何行动。告知客户并提供升级。    |
| 级别 3：升级 | 关键组件宕机       | 大语言模型提供商或知识库宕机 | 无法运行。立即用可用上下文路由到人工智能体。             |


**实现**


```python
class GracefulAgent:
    def __init__(self, tools: dict, knowledge_base, client):
        self.tools = tools
        self.knowledge_base = knowledge_base
        self.client = client

    async def get_capability_level(self) -> int:
        checks = {
            "llm": self._check_llm_health(),
            "knowledge": self._check_knowledge_health(),
            "read_tools": self._check_read_tools(),
            "write_tools": self._check_write_tools()
        }
        health = {k: await v for k, v in checks.items()}

        if not health["llm"]:
            return 3
        if not health["knowledge"] and not health["read_tools"]:
            return 3
        if not health["write_tools"]:
            if health["knowledge"] or health["read_tools"]:
                return 2 if not health["read_tools"] else 1
        return 0

    def get_system_prompt_for_level(self, level: int) -> str:
        base = "You are a customer support agent for TechStore."
        if level == 0:
            return base + " You have full access to all tools and knowledge."
        elif level == 1:
            return (base + " NOTE: The payment system is currently unavailable. "
                    "You can look up orders and answer questions, but cannot "
                    "process refunds or payments right now. If a customer needs "
                    "a refund, acknowledge the request, log it, and tell them "
                    "it will be processed within 24 hours.")
        elif level == 2:
            return (base + " NOTE: Action tools are currently unavailable. "
                    "You can only answer questions using the knowledge base. "
                    "For any actions (refunds, order changes), tell the customer "
                    "you will escalate to a team member.")
        else:
            return (base + " CRITICAL: Most systems are down. Apologize for the "
                    "inconvenience, collect the customer's issue summary, and "
                    "transfer to a human agent immediately.")
```


**案例研究：知识库宕机**


存储 FAQ 文章和退货政策的向量数据库在部署期间离线 15 分钟。


**坏：智能体幻觉政策**


```plain text
客户：我可以在 30 天后退笔记本电脑吗？

[知识库宕机。检索返回空。]

智能体：是的，我们的退货政策允许电子产品在 45 天内退货。
        我现在可以为您处理退货。

（实际政策是电子产品 14 天。智能体幻觉了“45 天”，
 因为它没有检索到的政策来支撑响应。客户现在
 期望一个会被拒绝的退货，造成比说“我不知道”更糟的体验。）
```


**好：智能体优雅降级**


```plain text
客户：我可以在 30 天后退笔记本电脑吗？

[知识库宕机。检索返回空。智能体检测到缺失上下文。]

智能体：我现在无法访问我们详细的退货政策文档。
        一般来说，电子产品的退货窗口比其他商品短。
        与其给您不准确的信息，让我为您连接
        可以查询准确政策并帮助您退货的团队成员。请稍等。

[智能体记录：knowledge_base_unavailable，query="laptop return 30 days"，
 escalation_reason="cannot verify policy"，timestamp=2025-06-15T14:32:00Z]
```


第二个响应单独来看更差（客户没有得到答案）。但它比自信地给出错误答案好得多。错误答案会创造一个公司无法兑现的承诺。诚实的“我现在无法验证”设定了正确期望。


**规则**


智能体应该始终能够告诉用户它不能做什么。沉默永远不可接受。捏造永远不可接受。诚实的限制总是优于自信的幻觉。


---


### 智能体操作中的幂等性


**双重退款问题**


幂等意味着：执行同一操作两次产生与执行一次相同的结果。这很重要，因为智能体会重试失败的操作，而“失败”并不总是意味着“未执行”。


```plain text
场景：

1. 智能体调用 refund_process(order_id="ORD-4821", amount=45.00)
2. 支付服务收到请求并处理退款
3. 网络在响应到达智能体之前断开
4. 智能体看到超时错误。它不知道退款成功了。
5. 智能体重试：refund_process(order_id="ORD-4821", amount=45.00)
6. 支付服务处理第二笔 $45.00 退款

结果：客户收到 $90.00 而不是 $45.00。
      智能体以为通过重试在保持可靠。
      重试造成了重复副作用。
```


这不是假设。重复扣款、重复退款和重复订单修改是智能体系统中最常见的生产缺陷之一。


**修复：幂等键**


每个修改状态的操作都获得唯一请求 ID。执行服务检查是否已经处理过带该 ID 的请求。如果已处理，它返回原始结果而不再次执行。


```python
import uuid

class IdempotentToolCaller:
    def __init__(self):
        self.request_log = {}

    def generate_idempotency_key(self, tool_name: str, params: dict) -> str:
        return str(uuid.uuid4())

    async def call_tool(self, tool_name: str, tool_fn, params: dict,
                        idempotency_key: str = None) -> dict:
        if idempotency_key is None:
            idempotency_key = self.generate_idempotency_key(tool_name, params)

        if idempotency_key in self.request_log:
            cached = self.request_log[idempotency_key]
            return {
                "status": "success",
                "data": cached["result"],
                "idempotent_replay": True
            }

        result = await tool_fn(**params, idempotency_key=idempotency_key)

        self.request_log[idempotency_key] = {
            "tool": tool_name,
            "params": params,
            "result": result,
        }

        return {"status": "success", "data": result, "idempotent_replay": False}
```


在服务端（支付服务、订单系统），实现在执行前检查键：


```python
async def process_refund(order_id: str, amount: float, idempotency_key: str, db) -> dict:
    existing = await db.fetchrow(
        "SELECT result FROM processed_requests WHERE idempotency_key = $1",
        idempotency_key
    )
    if existing:
        return existing["result"]

    refund_result = await payment_gateway.refund(order_id, amount)

    await db.execute(
        "INSERT INTO processed_requests (idempotency_key, result, created_at) "
        "VALUES ($1, $2, NOW())",
        idempotency_key, refund_result
    )
    return refund_result
```


**哪些操作需要幂等性**


| 操作类型                     | 需要幂等性    | 理由            |
| ------------------------ | -------- | ------------- |
| refund_process           | 是        | 重复退款花费真金白银    |
| order_update（取消、修改）      | 是        | 重复取消可能影响补货、账单 |
| escalate_to_human        | 否（但去重更好） | 重复升级烦人但无害     |
| order_lookup             | 否        | 只读，天然幂等       |
| knowledge_search         | 否        | 只读，天然幂等       |
| send_notification（邮件、短信） | 是        | 重复消息使客户困惑和烦恼  |


规则：任何修改状态或触发外部副作用的操作都需要幂等性。只读操作天然幂等，不需要特殊处理。

> **提示：** 幂等性是生产思维的强烈信号。在设计智能体工具集时，主动提到它：“所有写操作都会包含幂等键，这样重试不会造成重复副作用。退款服务在处理前检查键，如果键已经见过，它返回原始结果而不再次执行。” 

---


### 本节速查表


**覆盖的概念**


| 概念     | 一句话总结                                |
| ------ | ------------------------------------ |
| 带退避的重试 | 用指数延迟重试失败调用（1s、2s、4s）。最多 3 次尝试。添加抖动。 |
| 回退路由   | 重试失败时，切换到替代路径：备用模型、缓存数据、不同工具         |
| 循环预算   | 智能体推理周期的硬限制。交互式 5-15 步，后台 15-25 步。   |
| 时间预算   | 每个任务的挂钟限制。交互式 30-60 秒，后台 5-10 分钟。    |
| 词元预算   | 每个任务消耗的最大词元。防止循环智能体造成失控成本。           |
| 优雅降级   | 四个级别：完整能力、降低、只读、升级。降级时绝不幻觉。          |
| 幂等性    | 写操作的唯一请求 ID。防止重试时重复副作用。              |


**常见错误**


| 错误                 | 为什么错                             | 更强的回答                                                         |
| ------------------ | -------------------------------- | ------------------------------------------------------------- |
| “如果工具失败，智能体重试直到成功” | 无界重试浪费时间，可能压垮目标服务。没有回退意味着没有恢复路径。 | “我用指数退避重试 3 次。如果重试失败，我回退到缓存数据或替代工具。如果一切都失败，我升级到人工。”           |
| “智能体总会找到答案”        | 自主智能体可以无限循环。没有预算，这会变成昂贵的无限循环。    | “我设置 8 步步骤预算、30 秒时间限制和 50K 词元限制。如果智能体触及任何限制，它用已有信息响应并升级其余部分。” |
| “系统永远不应向用户显示错误”    | 隐藏失败导致幻觉。智能体捏造数据以避免承认失败。         | “我更喜欢诚实降级。智能体告诉客户它现在不能做什么，并提供降低的服务或连接人工。”                     |
| “退款超时我们就重试”        | 第一次尝试可能已经成功。没有幂等性重试会导致双重退款。      | “所有写操作使用幂等键。支付服务在处理前检查键，所以重试永远不会造成重复副作用。”                     |


**需要记住的关键数字**


```plain text
重试策略：
  最大重试次数：           3
  退避延迟：               1s、2s、4s（指数）
  抖动：                   0-0.5s 随机添加

循环预算：
  交互式智能体：           5-8 步，30 秒，50K 词元
  后台智能体：             15-25 步，5 分钟，200K 词元
  分类智能体：             1-2 步，5 秒，10K 词元

优雅降级：
  级别 0：完整能力
  级别 1：降低（部分工具宕机）
  级别 2：只读（写工具宕机）
  级别 3：升级（关键组件宕机）

幂等性：
  需要：                   所有修改状态的操作
  不需要：                 只读操作（天然幂等）
  键存储：                 带 TTL 过期时间的数据库
```


**本节如何连接到其他章节**


| 本节概念    | 连接到                     |
| ------- | ----------------------- |
| 重试与回退   | 第 4 节（工具调用错误处理）         |
| 循环预算    | 第 3 节（ReAct 循环、智能体执行模式） |
| 优雅降级    | 第 5 节（上下文溢出是降级触发器）      |
| 幂等性     | 第 4 节（工具调用、操作执行层）       |
| 所有可靠性模式 | 第 10 节（监控、追踪、故障告警）      |
| 预算值     | 第 11 节（成本建模、延迟预算）       |
| 降级与升级   | 第 9 节（高风险路径的人机协同）       |


**贯穿案例研究：客户支持智能体**


在本节中，我们为生产加固了支持智能体：对所有工具调用带退避的重试，主 API 失败时的回退路由（订单缓存作为订单 API 的备份，支付失败时排队处理），8 步步骤预算和 30 秒时间预算以防止失控循环，四级优雅降级使智能体在组件宕机时永不幻觉，以及 refund_process 和 send_notification 上的幂等键以防止重复副作用。在第 9 节中，我们将添加安全层：保护智能体免受提示注入，确保它永不泄露数据，并对允许采取的操作强制执行授权边界。