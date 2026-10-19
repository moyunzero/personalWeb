---
title: Agentic AI Course - Context, Memory and State
slug: 2026-10-02-agentic-ai-course-context-memory-and-sta
description: Agentic AI Course-5
author: 墨韵
date: 2026-10-02
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3efdf5c0-26f4-8020-af76-c45e59eb4183
notionSyncedAt: 2026-10-07T14:39:23.170Z
---

> 视频：[https://www.youtube.com/watch?v=d6X1ttDML5w](https://www.youtube.com/watch?v=d6X1ttDML5w)

### **第 5 节：上下文、记忆与状态**


大语言模型在调用之间没有记忆。每次请求都从零开始。模型不记得两条消息前客户的名字，不知道他们上周打过电话，也无法回忆起他们更喜欢邮件而非电话。如果智能体需要记住任何东西——会话内的多轮对话、跨数周的多次会话、或跨数月的多个客户——你必须自己构建记忆系统。


这是智能体设计中最常被误解的方面之一。如果假设大语言模型“记住”了对话。但它并没有。它在每次调用时重新读取整个对话历史。这种重新读取有硬性限制（第 2 节的上下文窗口），而管理这个限制内能容纳的内容是一个核心工程问题。


**我们将覆盖的内容**

1. 短期记忆：对话历史、滑动窗口和摘要
2. 长期记忆：持久化存储、检索和会话连续性
3. 上下文工程：词元预算、压缩和相关性过滤
4. 推理草稿板：用于复杂决策的隐藏中间推理

**这在智能体系统中的体现位置**


| 记忆类型    | 存储内容         | 持久性       | 智能体示例                |
| ------- | ------------ | --------- | -------------------- |
| 短期（对话）  | 当前会话消息、工具结果  | 单次会话      | “您之前说过想要退款”          |
| 长期（持久）  | 用户画像、过去交互、偏好 | 跨会话       | “欢迎回来。上次我们为您解决了配送问题” |
| 上下文工程   | 当前窗口内能容纳的内容  | 每次大语言模型调用 | 决定 20 个检索块中包含哪 5 个   |
| 草稿板（推理） | 中间思考、资格检查    | 单次决策      | 关于退款是否符合条件的隐藏推理      |


本节直接建立在第 2 节的上下文窗口和词元概念之上。在那里，我们计算出支持智能体根据检索详细程度大约获得 27-89 轮对话。在这里，我们解决达到该限制时该怎么办，以及如何明智地使用可用空间。


---


### 短期记忆与对话上下文


**短期记忆如何工作**


每次大语言模型 API 调用都是无状态的。模型接收一个消息列表（系统提示、用户轮次、助手轮次、工具结果）并生成下一个响应。为了维持对话，你将每个新轮次追加到此列表，并在每次调用时发送完整列表。模型不“记住”。它每次都重新读取所有内容。


```python
class ConversationMemory:
    def __init__(self, system_prompt: str):
        self.messages = [{"role": "system", "content": system_prompt}]

    def add_user_message(self, content: str):
        self.messages.append({"role": "user", "content": content})

    def add_assistant_message(self, content: str):
        self.messages.append({"role": "assistant", "content": content})

    def add_tool_result(self, tool_call_id: str, content: str):
        self.messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": content
        })

    def get_messages(self) -> list:
        return self.messages
```


这对短对话有效。但对话会增长，而上下文窗口不会。


**溢出问题**


```plain text
第 1 轮：  messages = [system, user_1, assistant_1]                    → 2,500 词元
第 5 轮：  messages = [system, user_1, ..., user_5, assistant_5]       → 8,200 词元
第 15 轮： messages = [system, user_1, ..., user_15, assistant_15]     → 23,000 词元
第 40 轮： messages = [system, user_1, ..., user_40, assistant_40]     → 58,000 词元
第 80 轮： messages = [system, user_1, ..., tool results, ...]        → 128,000+ 词元
           ↑ 上下文窗口超出。大语言模型调用失败。
```


**解决方案 1：滑动窗口**


只保留最近 N 轮。较早的轮次被丢弃。实现简单，但智能体会丢失早期上下文。如果客户在第 2 轮解释了问题，而你现在在第 30 轮，那个解释就没了。


```python
class SlidingWindowMemory:
    def __init__(self, system_prompt: str, max_turns: int = 20):
        self.system_prompt = {"role": "system", "content": system_prompt}
        self.messages = []
        self.max_turns = max_turns

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        if len(self.messages) > self.max_turns * 2:
            self.messages = self.messages[-(self.max_turns * 2):]

    def get_messages(self) -> list:
        return [self.system_prompt] + self.messages
```


**解决方案 2：带摘要的滑动窗口**


在丢弃旧轮次之前，先对它们进行摘要。摘要保留关键事实（客户姓名、问题、已做决策），而不消耗原始消息的完整词元成本。这是生产级方法。


```python
class SummarizingMemory:
    def __init__(self, system_prompt: str, max_tokens: int = 20000):
        self.system_prompt = {"role": "system", "content": system_prompt}
        self.messages = []
        self.summary = None
        self.max_tokens = max_tokens

    def _estimate_tokens(self) -> int:
        return sum(len(m["content"]) // 3 for m in self.messages)

    def _summarize_old_messages(self, client, messages_to_summarize: list) -> str:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            messages=[
                {"role": "system", "content": "Summarize this conversation history. "
                    "Preserve: customer name, issue description, decisions made, "
                    "tools called and results, any commitments or promises."},
                {"role": "user", "content": str(messages_to_summarize)}
            ]
        )
        return response.choices[0].message.content

    def compress_if_needed(self, client):
        if self._estimate_tokens() > self.max_tokens:
            midpoint = len(self.messages) // 2
            old_messages = self.messages[:midpoint]
            new_summary = self._summarize_old_messages(client, old_messages)
            if self.summary:
                new_summary = f"Previous context:{self.summary}\n\nRecent:{new_summary}"
            self.summary = new_summary
            self.messages = self.messages[midpoint:]

    def get_messages(self) -> list:
        result = [self.system_prompt]
        if self.summary:
            result.append({
                "role": "system",
                "content": f"Conversation summary so far:{self.summary}"
            })
        result.extend(self.messages)
        return result
```


**方法比较**


| 方法        | 实现复杂度 | 保留的上下文       | 词元效率     | 信息损失              |
| --------- | ----- | ------------ | -------- | ----------------- |
| 完整历史      | 极简    | 全部           | 差（线性增长）  | 溢出前无损失            |
| 滑动窗口      | 简单    | 仅最近 N 轮      | 好（有上限）   | 所有早期上下文丢失         |
| 滑动窗口 + 摘要 | 中等    | 旧轮次摘要 + 最近轮次 | 好（有摘要上限） | 旧轮次的细微差别丢失，关键事实保留 |
| 按词元计数逐出   | 较高    | 按相关性优先       | 最佳       | 选择性、可配置           |


对于大多数生产智能体，带摘要的滑动窗口是正确起点。完整历史仅适用于短小、有界对话。


---


### 长期记忆与持久状态


**为什么短期记忆不够**


短期记忆存在于对话中。会话结束时，它就消失了。如果客户明天再打电话，智能体从零开始。客户必须重新解释问题、重新说出姓名、重新描述发生了什么。这是糟糕的用户体验，而且除非你构建长期记忆，否则这是每个基于大语言模型的智能体的默认行为。


**长期记忆存储什么**


长期记忆跨会话持久。它存在于数据库中，而不是大语言模型的上下文窗口中。智能体在每个会话开始时查询它，并将相关信息注入上下文。


| 数据类别 | 示例               | 存储                 | 更新频率     |
| ---- | ---------------- | ------------------ | -------- |
| 用户画像 | 姓名、账户层级、联系方式偏好   | PostgreSQL         | 很少（账户变更） |
| 交互历史 | 过去的工单、解决方案、满意度评分 | PostgreSQL         | 每次会话后    |
| 偏好   | 沟通风格、语言、升级历史     | Redis 或 PostgreSQL | 观察到时     |
| 活跃问题 | 未结工单、待处理退款、到期跟进  | PostgreSQL         | 实时       |
| 行为模式 | 重复来电者、频繁退货者、VIP  | 定期计算               | 批处理作业    |


**实现：检索并注入**


在每个会话开始时，智能体从数据库检索客户的上下文，并将其注入系统提示或第一条消息。大语言模型不查询数据库。你的应用程序代码查询。


```python
import asyncpg

class LongTermMemory:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool

    async def get_customer_context(self, customer_id: str) -> dict:
        async with self.db_pool.acquire() as conn:
            profile = await conn.fetchrow(
                "SELECT name, account_tier, preferred_language "
                "FROM customers WHERE id = $1", customer_id
            )
            recent_tickets = await conn.fetch(
                "SELECT ticket_id, issue_type, resolution, created_at "
                "FROM tickets WHERE customer_id = $1 "
                "ORDER BY created_at DESC LIMIT 5", customer_id
            )
            active_issues = await conn.fetch(
                "SELECT ticket_id, issue_type, status, created_at "
                "FROM tickets WHERE customer_id = $1 AND status = 'open'",
                customer_id
            )
        return {
            "profile": dict(profile) if profile else {},
            "recent_tickets": [dict(t) for t in recent_tickets],
            "active_issues": [dict(t) for t in active_issues]
        }

    def format_for_context(self, customer_data: dict) -> str:
        profile = customer_data["profile"]
        lines = [f"Customer:{profile.get('name', 'Unknown')}"]
        lines.append(f"Account Tier:{profile.get('account_tier', 'Standard')}")

        if customer_data["active_issues"]:
            lines.append("\nOpen Issues:")
            for issue in customer_data["active_issues"]:
                lines.append(f"  -{issue['issue_type']} (Ticket{issue['ticket_id']})")

        if customer_data["recent_tickets"]:
            lines.append("\nRecent History:")
            for ticket in customer_data["recent_tickets"][:3]:
                lines.append(
                    f"  -{ticket['issue_type']}:{ticket['resolution']} "
                    f"({ticket['created_at'].strftime('%Y-%m-%d')})"
                )
        return "\n".join(lines)
```


**它带来的区别**


没有长期记忆，每次会话都从冷启动开始：


```plain text
客户：嗨，我昨天打电话关于我损坏的耳机。有更新吗？
智能体：很抱歉，我没有之前对话的任何记录。
        您能再描述一下问题吗？
```


有了长期记忆，智能体在客户开口前就有上下文：


```plain text
[从数据库注入上下文：客户 Priya Sharma，金级，
 未结工单 #4821：损坏的耳机，退款自昨天起待批准]

客户：嗨，我昨天打电话关于我损坏的耳机。有更新吗？
智能体：嗨 Priya。我看到您损坏耳机的退款仍在待批准。
        让我为您查询工单 #4821 的状态。
```


第二种体验显著更好。客户感到被认可。智能体更快解决问题。对话更短，这意味着更少词元和更低成本。

> **提示：** 在讨论记忆时，始终区分短期（对话上下文，在大语言模型输入中）和长期（数据库，在会话开始时检索）。常见错误是将两者混为一谈，或假设大语言模型自动处理持久化。可以说：“我会将用户画像和交互历史存储在 PostgreSQL 中，在会话开始时检索最近 3-5 次交互，并将它们注入系统提示，这样智能体在客户开口前就有上下文。”

---


### 上下文工程：词元预算与压缩


**上下文工程是资源分配**


上下文窗口是固定资源。智能体的每个组件都在竞争其中的空间。上下文工程是决定什么放入、什么压缩、什么排除的学科。它是智能体系统的内存管理。


![%E6%88%AA%E5%B1%8F2026-10-04_17.24.24.png](images/blog/2026-10-02-agentic-ai-course-context-memory-and-sta/img-352328d46b.png)


**词元预算分配**


设计良好的智能体按类别分配词元，并为每个类别设置硬限制。这防止任何一个组件挤占其他组件。


| 类别        | 预算   | 典型范围           | 备注              |
| --------- | ---- | -------------- | --------------- |
| 系统提示      | 固定   | 1,500-3,000 词元 | 角色、约束、工具指令、升级规则 |
| 工具定义      | 固定   | 800-2,000 词元   | 所有可用工具的模式       |
| 长期记忆注入    | 每次会话 | 500-1,500 词元   | 客户画像、最近历史       |
| 检索文档（RAG） | 每次查询 | 2,000-8,000 词元 | 来自知识库的 Top-k 块  |
| 对话历史      | 增长   | 最多剩余预算         | 用滑动窗口 + 摘要管理    |
| 响应生成      | 保留   | 500-2,000 词元   | 模型输出空间          |


**完整示例：客户支持智能体的预算**


```plain text
上下文窗口：          128,000 词元

固定分配：
  系统提示：             2,000 词元
  工具定义：             1,200 词元
  响应保留：             1,000 词元
  固定小计：             4,200 词元

每次会话分配：
  客户上下文（数据库）： 1,000 词元
  每次会话小计：         1,000 词元

每次查询分配：
  RAG 检索（3 块）：     3,000 词元
  每次查询小计：         3,000 词元

对话历史剩余：
  128,000 - 4,200 - 1,000 - 3,000 = 119,800 词元

每轮平均词元（用户 + 助手 + 工具调用 + 结果）：
  轻量轮次（简单问答）：     800 词元
  重量轮次（工具调用 + 推理）：2,200 词元
  混合平均：                 1,400 词元

压缩触发前轮数：
  119,800 / 1,400 ≈ 85 轮（理论最大值）

但是：将压缩阈值设为 60% 容量以留出余量：
  触发摘要时：119,800 x 0.6 = 71,880 词元已使用
  大约在第 51 轮。
  摘要后：旧轮次压缩为约 2,000 词元摘要。
  对话以新鲜预算继续。
```


**上下文压缩策略**


当对话历史接近预算时，压缩它，而不是盲目截断。


**摘要**


用摘要替换旧轮次。保留关键事实（客户姓名、问题、已采取行动），但丢失确切措辞和细微差别。成本：生成摘要需要一次额外的大语言模型调用。


**选择性逐出**


并非所有轮次同等重要。返回“未找到结果”的工具调用结果可以丢弃。重复的澄清交换可以精简。智能体的推理轨迹可以移除（结论保留在响应中）。


**文档压缩**


当 RAG 检索到一个 1,000 词元的块，但只有 200 词元相关时，在注入前提取相关句子。这更复杂，但可以回收显著的上下文预算。


```python
def compress_context(messages: list, token_budget: int, client) -> list:
    current_tokens = estimate_tokens(messages)
    if current_tokens <= token_budget:
        return messages

    system_msg = messages[0]
    conversation = messages[1:]

    evictable = []
    for i, msg in enumerate(conversation):
        if msg["role"] == "tool" and "no results" in msg.get("content", "").lower():
            evictable.append(i)
        if msg["role"] == "assistant" and estimate_tokens([msg]) > 500:
            evictable.append(i)

    for i in sorted(evictable, reverse=True):
        if estimate_tokens([system_msg] + conversation) <= token_budget:
            break
        if conversation[i]["role"] == "tool":
            conversation[i]["content"] = "[Tool returned no results]"
        elif conversation[i]["role"] == "assistant":
            conversation[i]["content"] = summarize_message(client, conversation[i]["content"])

    if estimate_tokens([system_msg] + conversation) > token_budget:
        midpoint = len(conversation) // 2
        old_summary = summarize_conversation(client, conversation[:midpoint])
        conversation = [{"role": "system", "content": f"Earlier context:{old_summary}"}] + conversation[midpoint:]

    return [system_msg] + conversation
```


**核心权衡**


更多上下文使智能体信息更充分，但更慢、更昂贵。更少上下文使其更快、更便宜，但可能遗漏关键信息。上下文工程是为你的用例找到正确平衡，而不是最大化上下文。


| 杠杆       | 对质量的影响       | 对成本的影响     | 对延迟的影响   |
| -------- | ------------ | ---------- | -------- |
| 更多 RAG 块 | 更好的基于事实的答案   | 更高（更多输入词元） | 更高（处理更多） |
| 更长对话历史   | 更好的会话连续性     | 更高         | 更高       |
| 激进摘要     | 旧上下文轻微质量损失   | 更低         | 更低       |
| 选择性逐出    | 如果做得好，质量损失最小 | 更低         | 更低       |
| 更小系统提示   | 行为可靠性降低风险    | 更低         | 更低       |


---


### 推理草稿板


**草稿板是什么**


草稿板是一个独立空间，智能体在其中完成中间推理而不向用户暴露。用户只看到最终答案。产生答案的思考保持隐藏。


这不是关于保密。这是关于清晰。一个问“我能退这些耳机吗？”的客户想要“是的，您的退货已处理”或“很遗憾，退货仅接受 7 天内，而您的订单已 15 天。”他们不想看到智能体的内部资格检查清单。


**没有草稿板**


```plain text
客户：我能退我 3 天前买的耳机吗？

智能体：让我查一下。订单是 6 月 2 日下的。今天是 6 月 5 日。
        那是 3 天前。我们的退货政策规定电子产品可在
        14 天内退货。3 天在 14 天内。该商品属于
        电子产品类别，符合退货条件。订单
        总额是 $45.00，低于 $50 自动批准阈值。
        该商品之前未被退过。因此退货
        符合条件。我现在处理您的退货。您的 $45.00 退款
        已发起，将在 3-5 个工作日内到账。
```


这很嘈杂。客户不需要看到智能体的决策树。


**有草稿板**


```plain text
客户：我能退我 3 天前买的耳机吗？

[隐藏草稿板]
- 订单日期：6 月 2 日。当前日期：6 月 5 日。购买后天数：3。
- 退货政策：电子产品 14 天内可退。3 < 14。符合条件。
- 产品类别：电子产品。可退：是。
- 订单金额：$45.00。自动批准阈值：$50。低于阈值。
- 此订单之前的退货：无。
- 决策：批准。自动处理退款。
[草稿板结束]

智能体：您的耳机 $45.00 退款已发起。
        将在 3-5 个工作日内出现在您的账户中。
```


决策质量相同。用户体验显著更干净。


**实现**


```python
def handle_with_scratchpad(client, messages: list, tools: list) -> dict:
    scratchpad_response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        messages=messages + [{
            "role": "user",
            "content": "Think through this step by step in a <scratchpad> block. "
                       "Consider: policy eligibility, order details, approval thresholds, "
                       "and any edge cases. Then provide your final decision."
        }]
    )

    reasoning = scratchpad_response.choices[0].message.content
    scratchpad = extract_between_tags(reasoning, "scratchpad")
    decision = extract_after_tags(reasoning, "scratchpad")

    final_response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        messages=messages + [{
            "role": "system",
            "content": f"Internal analysis (do not share with customer):{scratchpad}\n"
                       f"Decision:{decision}\n\n"
                       "Now write a clear, concise response to the customer. "
                       "State the outcome and next steps only."
        }]
    )

    return {
        "customer_response": final_response.choices[0].message.content,
        "internal_reasoning": scratchpad,
        "decision": decision
    }
```


**何时使用草稿板**


| 使用草稿板            | 不使用草稿板              |
| ---------------- | ------------------- |
| 复杂资格决策（退款、索赔、批准） | 简单事实查询（“我的订单在哪里？”）  |
| 每一步依赖前一步的多步推理    | 单步响应（问候、FAQ 答案）     |
| 需要审计轨迹的高风险决策     | 无决策组件的低风险交互         |
| 需要为合规记录推理的情况     | 速度关键、双重大语言模型调用太慢的响应 |


**草稿板的成本**


草稿板需要两次大语言模型调用（一次推理，一次最终响应）或一次带明确指令将推理与响应分开的调用。两次调用使延迟和成本翻倍。一次带结构化输出的调用（推理在一个字段，响应在另一个字段）更高效，但需要可靠的结构化输出解析。


对于客户支持智能体，选择性使用草稿板。退款决策和投诉升级受益于它们。订单状态查询和 FAQ 答案则不需要。

> **提示：** 在讨论草稿板时，将它们与可观测性（第 10 节）联系起来。可以说：“草稿板有双重目的。第一，通过强制显式逐步推理提高响应质量。第二，它创建审计轨迹。当退款决策后来被质疑时，我们可以准确追踪智能体如何得出那个结论。”

---


### 错误 vs 正确，记忆与上下文错误


**错误 1：完全没有记忆管理**


**错误：** 每次调用都将整个对话历史传递给大语言模型，没有词元管理。智能体在前 20 轮工作正常，然后当上下文窗口填满时崩溃或产生退化输出。


```plain text
第 1-50 轮：    完美工作。
第 51-80 轮：   响应变差。模型失去对最近消息的关注。
第 81 轮：      API 返回“上下文长度超出”。智能体在对话中途崩溃。
客户：          “我已经解释了一个小时，现在聊天就死了。”
```


**正确：** 词元预算分配，使用滑动窗口和摘要。智能体监控词元使用情况，在接近限制时摘要旧轮次，并始终为系统提示、检索和响应生成保留空间。智能体永远不会因上下文溢出而崩溃。


**错误 2：将所有内容存储在长期记忆中**


**错误：** 将每条消息、每个工具结果和每个智能体响应保存到长期数据库。当客户下周回来时，智能体检索 50 页原始对话历史并全部注入上下文。信号被埋在噪声中。


**正确：** 存储结构化摘要，而不是原始记录。每次会话后，提取并保存：问题类型、解决方案、已采取行动、客户情绪、任何承诺。检索时，只注入摘要：“之前交互（6 月 1 日）：客户报告损坏的耳机，$45 退款已处理，客户满意。”一行而不是 200 条消息。


**错误 3：完全没有长期记忆**


**错误：** 每次会话完全从零开始。一个为同一问题打了三次电话的客户每次都重新解释。智能体不知道这是重复联系，也不知道之前的智能体已经尝试过解决方案。


```plain text
会话 1：客户解释问题。智能体排查。未解决。
会话 2：客户再次解释同一问题。智能体运行相同诊断。
会话 3：客户第三次解释同一问题。客户现在生气了。
        智能体不知道这是第三次尝试。
```


**正确：** 为客户画像和交互历史提供持久化存储。会话开始时，检索最近工单和活跃问题。智能体从上下文开始：“这是客户关于此问题的第三次联系。之前尝试：诊断 A（失败），诊断 B（失败）。升级是合适的。”


**错误 4：将应该持久化的内容放在短期记忆中**


**错误：** 客户在对话中提到“我更喜欢邮件沟通”。智能体在该会话中照做。下次会话，智能体问“您希望如何联系？”偏好曾在短期记忆中。会话结束时它就死了。


**正确：** 检测持久偏好并将其写入长期存储。下次会话时，智能体已经知道偏好。这需要有意设计：智能体必须识别偏好陈述、提取它并持久化。


**决策框架**


| 问题              | 如果是        | 如果否       |
| --------------- | ---------- | --------- |
| 此信息需要在本会话之后存活吗？ | 存储在长期（数据库） | 保留在短期（对话） |
| 此信息与未来会话相关吗？    | 存储结构化摘要    | 不存储       |
| 对话接近词元预算吗？      | 触发摘要       | 继续完整历史    |
| 智能体在做复杂决策吗？     | 使用草稿板      | 直接响应      |
| 检索到的上下文超出词元预算吗？ | 按相关性过滤、压缩  | 按原样注入     |


---


### 本节速查表


**覆盖的概念**


| 概念    | 一句话总结                          |
| ----- | ------------------------------ |
| 短期记忆  | 每次调用传递给大语言模型的对话历史。用滑动窗口 + 摘要管理 |
| 长期记忆  | 持久数据库，存储用户画像、过去交互、偏好。会话开始时检索   |
| 上下文工程 | 在系统提示、工具、检索、历史和响应之间分配上下文窗口预算   |
| 词元预算  | 每个类别的固定分配，压缩阈值约为 60% 容量        |
| 摘要    | 用压缩摘要替换旧对话轮次，以回收词元预算           |
| 选择性逐出 | 在摘要前移除低价值内容（空工具结果、冗长推理）        |
| 草稿板   | 隐藏的中间推理空间。提高决策质量并创建审计轨迹        |


**常见错误**


| 错误                 | 为什么错                                              | 更强的回答                                                            |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| “大语言模型记住对话”        | 大语言模型是无状态的。每次调用重新读取完整消息列表。没有内置记忆。                 | “大语言模型是无状态的。我通过将轮次追加到消息列表并采用滑动窗口来显式管理对话上下文，以保持在上下文预算内。”          |
| “我会直接使用更大的上下文窗口”   | 更大的窗口每次调用更昂贵、更慢。它们也不能解决长期持久化问题。                   | “更大的窗口有帮助，但不能解决跨会话记忆。我会结合词元预算的滑动窗口用于短期，和 PostgreSQL 用于长期持久化。”    |
| “我会将所有内容存储在向量数据库中” | 向量数据库用于语义检索（RAG），而不是结构化用户状态。将订单历史存储在向量数据库中是错误的工具。 | “我会用 PostgreSQL 存储结构化数据（画像、工单、偏好），仅在 RAG 流水线中使用向量数据库进行非结构化知识检索。” |
| “记忆只是传递聊天历史”       | 这忽略了长期持久化、上下文预算和压缩策略                              | “记忆有两层：带摘要的短期对话历史，以及跨会话存活的长期持久化存储，用于用户上下文。”                      |


**需要记住的关键数字**


```plain text
上下文窗口预算（128K 模型）：
  系统提示：             2,000 词元（固定）
  工具定义：             1,200 词元（固定）
  长期上下文：           1,000 词元（每次会话）
  RAG 检索：             3,000 词元（每次查询）
  对话历史：            约 120,000 剩余
  压缩阈值：            剩余预算的约 60%（第 51 轮左右）

短期记忆：
  滑动窗口：             保留最近 20-40 轮
  摘要大小：             每个压缩周期约 500-2,000 词元
  摘要成本：             每次压缩额外 1 次 GPT-4o-mini 调用

长期记忆：
  会话开始时检索：       最近 3-5 次交互
  作为上下文注入：       约 500-1,500 词元
  存储：                 PostgreSQL 用于结构化，Redis 用于快速查找

草稿板：
  何时使用：             复杂决策（退款、升级）
  成本：                 每次决策 1-2 次额外大语言模型调用
  收益：                 审计轨迹 + 更好的推理质量
```


**本节如何连接到其他章节**


| 本节概念    | 连接到                          |
| ------- | ---------------------------- |
| 上下文窗口预算 | 第 2 节（词元数学）、第 6 节（RAG 块消耗预算） |
| 长期记忆检索  | 第 6 节（RAG 检索是知识的相同模式）        |
| 摘要      | 第 11 节（成本优化，每次调用更少词元）        |
| 草稿板     | 第 10 节（可观测性，追踪智能体决策）         |
| 词元预算管理  | 第 11 节（规模成本建模）               |
| 压缩阈值    | 第 8 节（上下文填满时的优雅降级）           |


**贯穿案例研究：客户支持智能体**


在本节中，我们构建了支持智能体的记忆系统：带摘要的滑动窗口用于对话历史，PostgreSQL 支持的长期记忆用于客户画像和交互历史，在 60% 容量触发压缩的词元预算，以及用于退款资格决策的草稿板。在第 6 节中，我们将添加知识层：从 FAQ、退货政策和产品目录中进行 RAG 检索，所有这些都在我们刚刚学会管理的同一个上下文窗口中竞争空间。