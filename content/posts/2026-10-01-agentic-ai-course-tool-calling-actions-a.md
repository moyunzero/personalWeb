---
title: Agentic AI Course - Tool Calling, Actions and MCP
slug: 2026-10-01-agentic-ai-course-tool-calling-actions-a
description: Agentic AI Course-4
author: 墨韵
date: 2026-10-01
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3eedf5c0-26f4-804d-8adb-d617700f7533
notionSyncedAt: 2026-10-07T14:39:34.204Z
---

> 视频：[https://www.youtube.com/watch?v=d6X1ttDML5w](https://www.youtube.com/watch?v=d6X1ttDML5w)

### **第 4 节：工具调用、行动与 MCP**


工具调用是智能体与聊天机器人的分界线。当大语言模型调用工具时，它会生成一个结构化请求来调用外部函数，然后由你的系统执行。没有工具调用，大语言模型只能局限于训练时记住的内容。有了工具调用，它可以查询实时数据、处理支付、查询数据库并修改真实系统。


本节覆盖函数调用在机制上如何工作、如何设计大语言模型能可靠使用的工具模式、工具失败时如何处理错误、如何通过并行执行优化，以及模型上下文协议（MCP）如何标准化工具集成。


**我们将覆盖的内容**

- 大语言模型如何调用外部函数（机制）
- 设计工具模式（名称、描述、参数）
- 结构化输出与响应解析
- 工具失败时的错误处理
- 并行与顺序工具执行
- 模型上下文协议（MCP）
- 完整示例：设计支持智能体的完整工具集

**与智能体循环的连接**


在第 1 节的感知、推理、行动、观察循环中，工具调用就是“行动”步骤。大语言模型推理要调用什么工具（推理），生成结构化调用（行动），你的系统执行它并返回结果（观察），然后大语言模型对结果进行推理，再决定下一步。


---


### 大语言模型如何调用外部函数


**机制**


大语言模型不执行代码。它不发起 HTTP 请求。它不连接数据库。大语言模型生成一个结构化 JSON 对象，表示“用这些参数调用这个函数”。你的应用程序代码解析该 JSON 并执行实际函数。


这是需要理解的最重要区别：大语言模型是决策者，而不是执行者。


**逐步工作方式**

1. 你定义可用工具（名称、描述、参数模式），并将它们与用户消息一起发送给大语言模型
2. 大语言模型读取工具定义，作为其上下文的一部分
3. 根据用户请求，大语言模型决定是否需要工具以及需要哪个工具
4. 如果需要工具，大语言模型输出一个结构化 JSON 对象，指定工具名称和参数
5. 你的代码接收该 JSON，验证它，并执行对应函数
6. 函数的返回值作为观察结果发送回大语言模型
7. 大语言模型对结果进行推理，然后要么调用另一个工具，要么生成最终回复

**Python 示例：完整的工具调用周期**


```python
import openai

tools = [
    {
        "type": "function",
        "function": {
            "name": "order_lookup",
            "description": "Look up order details for a customer. Use when the customer asks about order status, delivery, or tracking information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "The unique customer identifier (e.g., C-9182)"
                    },
                    "order_id": {
                        "type": "string",
                        "description": "Optional. Specific order ID if known."
                    }
                },
                "required": ["customer_id"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": SUPPORT_AGENT_PROMPT},
        {"role": "user", "content": "Where is my order?"}
    ],
    tools=tools
)

tool_call = response.choices[0].message.tool_calls[0]
# tool_call.function.name = "order_lookup"
# tool_call.function.arguments = '{"customer_id": "C-9182"}'
```


大语言模型决定 `order_lookup` 是正确的工具，选择了正确的参数，并输出有效 JSON。你的代码现在解析 `tool_call.function.arguments`，调用真实的 `order_lookup` 函数，并将结果发送回去。


---


### 设计工具模式


**工具模式的三个组成部分**


每个工具定义都有三部分：名称、描述和参数模式。在这三者中，**描述最重要**。大语言模型读取描述来决定何时使用工具。模糊的描述会导致错误工具选择。精确的描述会带来可靠行为。


**好模式 vs 坏模式**


| 元素             | 坏模式    | 好模式                                                        |
| -------------- | ------ | ---------------------------------------------------------- |
| 名称             | lookup | order_lookup                                               |
| 描述             | “查找东西” | “查询客户的订单详情。当客户询问订单状态、配送、跟踪或退货资格时使用。返回订单 ID、状态、商品、总额和配送信息。” |
| 参数：customer_id | 无描述    | “唯一客户标识符，格式为 C-XXXX（例如 C-9182）”                            |
| 参数：order_id    | 无描述    | “可选。如果客户提供，则为特定订单 ID。如果未提供，则返回最近订单。”                       |
| 必填字段           | 未指定    | ["customer_id"]                                            |


**模式设计原则**


**描述应回答“我什么时候使用这个？”**


大语言模型基于描述匹配来选择工具。如果两个工具有相似名称但描述不同，描述决定哪个被调用。从大语言模型的视角写描述：“当客户询问 X 时使用这个”比“返回 X 数据”更有用。


**参数应类型化并受约束**


指定类型（string、integer、boolean）、格式（“格式为 C-XXXX”）、固定值枚举（`"severity": {"type": "string", "enum": ["low", "medium", "high"]}`），以及哪些参数必填、哪些可选。


**工具越少越好**


每个工具定义消耗上下文窗口词元。一个有 50 个工具的智能体仅定义就花费数千词元，而且大语言模型必须在所有 50 个工具之间推理以选择正确工具。在实践中，5-10 个设计良好的工具胜过 30 个设计糟糕的工具。


| 工具数量      | 大语言模型选择准确率       | 上下文成本                |
| --------- | ---------------- | -------------------- |
| 3-5 个工具   | 高。大语言模型能可靠选择正确工具 | 低（定义约 500-800 词元）    |
| 6-10 个工具  | 良好，前提是描述清晰、有区分度  | 中等（约 1,000-2,000 词元） |
| 11-20 个工具 | 退化。相似工具会混淆       | 高（约 2,000-4,000 词元）  |
| 20+ 个工具   | 没有动态工具过滤就不可靠     | 非常高。考虑工具路由           |

> **提示：** 在设计智能体工具集时，从 4-6 个工具开始。如果你发现自己列出超过 10 个，就要思考在这种规模下如何处理工具选择。答案是动态工具加载：只根据分类意图注入相关工具，而不是每次调用都注入所有工具。

---


### 结构化输出与响应解析


**为什么智能体需要结构化输出**


当大语言模型调用工具时，输出必须是符合特定模式的有效 JSON。像“当然，客户 ID 是 C-9182，我会查询订单 7841”这样的自由文本无法可靠地解析为函数参数。结构化输出强制大语言模型以可预测、机器可读的格式返回数据。


**强制结构的技术**


| 技术          | 工作方式                              | 可靠性                       | 提供商支持                            |
| ----------- | --------------------------------- | ------------------------- | -------------------------------- |
| 函数调用格式      | 提供商原生工具调用 API。大语言模型输出结构化工具调用对象    | 最高。提供商强制模式                | OpenAI、Anthropic、Google、大多数主要提供商 |
| JSON 模式     | 告诉大语言模型只以 JSON 响应。提供商保证有效 JSON 输出 | 高。保证有效 JSON，但模式遵循度不一      | OpenAI、Anthropic                 |
| Pydantic 强制 | 定义 Python 模型。根据它验证并解析大语言模型输出      | 高。在解析时捕获模式违规              | 任何提供商（客户端验证）                     |
| 基于提示        | 在提示中说“以 JSON 响应，字段为：……”无强制        | 低。大语言模型可能添加额外文本、跳过字段或破坏格式 | 任何提供商（无保证）                       |


**使用 Pydantic 进行响应验证**


```python
from pydantic import BaseModel, Field
from typing import Optional

class OrderLookupParams(BaseModel):
    customer_id: str = Field(description="Customer identifier, e.g. C-9182")
    order_id: Optional[str] = Field(default=None, description="Specific order ID if known")

class RefundDecision(BaseModel):
    eligible: bool = Field(description="Whether the refund is eligible")
    reason: str = Field(description="Explanation of the eligibility decision")
    amount: float = Field(description="Refund amount in dollars")
    requires_approval: bool = Field(description="True if amount exceeds auto-approval threshold")

# Parse LLM output into a validated object
raw_output = '{"eligible": true, "reason": "Within 30-day window", "amount": 45.0, "requires_approval": false}'
decision = RefundDecision.model_validate_json(raw_output)
```


如果大语言模型返回 `{"eligible": "yes"}` 而不是 `{"eligible": true}`，Pydantic 会立即捕获类型不匹配。没有验证，这类错误会静默传播并破坏下游逻辑。


**处理无效输出**


当大语言模型生成无效 JSON 或模式不匹配时，不要崩溃。将错误消息包含在内进行重试，让大语言模型自我纠正。


```python
def parse_with_retry(raw_output, model_class, messages, max_retries=2):
    for attempt in range(max_retries + 1):
        try:
            return model_class.model_validate_json(raw_output)
        except ValidationError as e:
            if attempt == max_retries:
                raise
            messages.append({
                "role": "user",
                "content": f"Your response was not valid. Error:{e}. Please respond again with valid JSON."
            })
            raw_output = llm.chat(messages=messages).content
```


---


### 工具失败时的错误处理


**为什么工具会失败**


工具是外部系统。API 会超时。数据库会宕机。第三方服务会返回 500 错误。会触发速率限制。认证令牌会过期。网络分区会发生。你的智能体必须优雅地处理每一种情况。


最糟糕的失效模式不是崩溃。而是智能体静默吞掉错误，并像工具成功了一样幻觉出一个响应。


**错误处理模式**


| 模式      | 何时使用         | 示例                                 |
| ------- | ------------ | ---------------------------------- |
| 带退避的重试  | 瞬态失败（超时、503） | 等 1 秒，重试。等 2 秒，重试。等 4 秒，重试。3 次后停止。 |
| 回退到替代方案 | 主源不可用        | 主 API 宕机，使用缓存数据或备用 API             |
| 优雅降级    | 非关键工具失败      | 知识库不可用：基于通用训练回答，并披露限制              |
| 升级到人工   | 所有自动路径耗尽     | “我现在无法查询您的订单。让我为您连接专家。”            |
| 告知并等待   | 没有数据无法继续行动   | “我们的订单系统暂时不可用。等待期间我可以帮您做其他事吗？”     |


**Python 实现：带退避和回退的重试**


```python
import asyncio
import time

async def call_tool_with_retry(tool_fn, args, max_retries=3, fallback_fn=None):
    for attempt in range(max_retries):
        try:
            result = await tool_fn(**args)
            return result
        except TimeoutError:
            wait_time = 2 ** attempt
            await asyncio.sleep(wait_time)
        except Exception as e:
            if attempt == max_retries - 1:
                if fallback_fn:
                    return await fallback_fn(**args)
                return {
                    "error": True,
                    "message": f"Tool call failed after{max_retries} attempts:{str(e)}"
                }
    return {"error": True, "message": "Tool call timed out after all retry attempts"}
```


**幻觉反模式**


客户：“我的订单状态是什么？”


智能体调用 `order_lookup()` -> API 返回 HTTP 500


坏的智能体行为：
“您的订单 #7841 昨天已发货，应该在周五前到达。”
（这完全是编造的。智能体从未收到订单数据。）


好的智能体行为：
“我现在访问订单系统时遇到问题。让我为您连接团队成员，他们可以直接查询您的订单状态。”


这不是假设风险。大语言模型被训练得乐于助人，而“乐于助人”有时意味着即使数据缺失也生成听起来合理的答案。你的错误处理代码必须通过返回清晰的错误对象来确保智能体知道工具失败了，而不是空或模糊的响应。

> **提示：** 在设计错误处理时，提到幂等性（第 8 节覆盖）。如果退款工具超时但退款实际已处理，没有幂等键的重试意味着发出双重退款。

---


### 并行与顺序工具执行


**决策规则**


如果工具 B 需要工具 A 的输出，则顺序执行。如果工具 A、B、C 彼此独立，则并行执行。这是唯一规则。


顺序执行线性增加延迟：3 个工具各 400ms = 总共 1,200ms。并行执行将其降低到最慢工具的时间：3 个工具各 400ms = 总共 400ms。对于目标响应时间为 2-3 秒的交互式智能体，这很重要。


**顺序：当输出依赖输入时**


客户：“我想退我的耳机。”


```plain text
步骤 1：order_lookup(customer_id="C-9182")     -> 订单 #7841，$45，6 天前购买
步骤 2：knowledge_search("return policy electronics")  -> “电子产品 30 天退货窗口”
步骤 3：refund_process(order_id="7841", amount=45.00, reason="customer return")

步骤 2 可以与步骤 1 并行运行，但步骤 3 需要步骤 1 的输出（order_id）
以及步骤 2 的确认（资格）。步骤 3 必须顺序执行。
```


**并行：当工具独立时**


客户：“我的订单状态是什么？我有商店积分吗？”


```plain text
order_lookup(customer_id="C-9182")  -- 独立
credits_lookup(customer_id="C-9182") -- 独立

这两个查询没有依赖关系。并行执行。
```


```python
import asyncio

async def handle_order_and_credits(customer_id):
    order_task = asyncio.create_task(order_lookup(customer_id))
    credits_task = asyncio.create_task(credits_lookup(customer_id))

    order_result, credits_result = await asyncio.gather(order_task, credits_task)

    return {
        "order": order_result,
        "credits": credits_result
    }

# Total latency: max(order_lookup_time, credits_lookup_time)
# Instead of: order_lookup_time + credits_lookup_time
```


**延迟影响**


| 执行策略 | 2 个工具（各 400ms） | 3 个工具（各 400ms） | 5 个工具（各 400ms） |
| ---- | -------------- | -------------- | -------------- |
| 顺序   | 800ms          | 1,200ms        | 2,000ms        |
| 并行   | 400ms          | 400ms          | 400ms          |
| 节省   | 400ms（50%）     | 800ms（67%）     | 1,600ms（80%）   |


节省会累积。对于每轮进行多次工具调用的智能体，并行执行通常是 2 秒响应和 5 秒响应之间的区别。


**大语言模型何时决定并行**


一些提供商（OpenAI、Anthropic）原生支持并行工具调用。大语言模型在单个响应中返回多个工具调用，表示它们可以同时执行。你的执行层检查多个工具调用，并行运行它们，并一起发送所有结果。


```python
response = client.chat.completions.create(model="gpt-4o", messages=messages, tools=tools)

tool_calls = response.choices[0].message.tool_calls
if len(tool_calls) > 1:
    results = await asyncio.gather(*[execute_tool(tc) for tc in tool_calls])
else:
    results = [await execute_tool(tool_calls[0])]
```


---


### 模型上下文协议（MCP）


**MCP 是什么**


模型上下文协议是一个开放标准，用于将大语言模型连接到外部工具和数据源。它定义了一个客户端-服务器协议，其中 MCP 服务器暴露工具（带有模式、描述和执行端点），MCP 客户端（智能体应用）通过标准化接口发现并调用这些工具。


在 MCP 之前，每个工具集成都是自定义实现。如果你想让智能体连接 Slack，你写 Slack 特定代码。如果你想让连接 Jira，你写 Jira 特定代码。MCP 标准化了这一点：构建一个客户端，连接任何 MCP 兼容服务器。


**MCP 如何工作**

- 发现：MCP 客户端连接一个或多个 MCP 服务器。每个服务器公布其可用工具，包括名称、描述和参数模式。
- 选择：智能体（通过大语言模型）根据公布的 schema 选择调用哪个工具。这与之前说的覆盖的函数调用机制完全一样，但工具定义来自 MCP 服务器，而不是硬编码。
- 调用：客户端向适当服务器发送工具调用请求。服务器执行函数并返回结果。
- 传输：MCP 支持多种传输（本地服务器用 stdio，远程服务器用 HTTP/SSE）。协议处理序列化、错误码和请求/响应匹配。

**为什么 MCP 对生产智能体重要**


| 没有 MCP           | 有 MCP             |
| ---------------- | ----------------- |
| 每个外部系统都需要自定义集成代码 | 标准协议，连接任何兼容服务器    |
| 工具模式硬编码在应用中      | 从服务器动态发现模式        |
| 添加新工具需要代码变更和重新部署 | 添加新工具只需将客户端指向新服务器 |
| 集成之间没有标准错误处理     | 所有工具使用标准错误码和重试语义  |


**需要知道的内容**


MCP 仍处于早期。但要知道：

- 它是什么（工具集成的开放标准）
- 它为什么存在（消除每个工具的自定义集成代码）
- 何时提到它（“对于工具集成，我会遵循 MCP 标准，这样我们的智能体可以连接任何兼容服务，而无需为每个集成写自定义代码”）
- 它与函数调用的关系（MCP 是传输和发现层；函数调用是大语言模型选择和参数化工具的接口）
> 
>
> **提示：** 如果遇到这种情况：“你会如何将 20 个不同工具集成到智能体？”，MCP 是架构答案。不是 20 个自定义集成，而是构建一个 MCP 客户端并连接 20 个 MCP 服务器。
>
>

---


### 完整示例，设计支持智能体的工具集


**案例研究：TechStore 支持智能体的完整工具集**


第 1 节的客户支持智能体需要四个工具。每个工具都设计了特定范围、描述中的清晰使用说明和类型化参数。以下是完整模式。


```python
support_agent_tools = [
    {
        "type": "function",
        "function": {
            "name": "order_lookup",
            "description": (
                "Look up order details for a customer. Use when the customer asks about "
                "order status, delivery, tracking, return eligibility, or order history. "
                "Returns order ID, items, total, status, shipping carrier, and tracking number."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "Customer identifier, formatted as C-XXXX"
                    },
                    "order_id": {
                        "type": "string",
                        "description": "Specific order ID if the customer provides one. If omitted, returns most recent order."
                    }
                },
                "required": ["customer_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "refund_process",
            "description": (
                "Process a refund for a specific order. Use ONLY after confirming refund "
                "eligibility through order_lookup and knowledge_search. Auto-approves amounts "
                "of $50 or below. Amounts above $50 are flagged for human review."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The order ID to refund"},
                    "amount": {"type": "number", "description": "Refund amount in USD"},
                    "reason": {"type": "string", "description": "Reason for the refund"}
                },
                "required": ["order_id", "amount", "reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": (
                "Transfer the conversation to a human support agent. Use when: the issue "
                "is outside your scope, the customer explicitly requests a human, refund "
                "amount exceeds $50, the customer mentions legal action, or you have "
                "attempted 3 tool calls without resolving the issue."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Customer identifier"},
                    "issue_summary": {"type": "string", "description": "Brief summary of the issue and what has been attempted"},
                    "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"], "description": "Issue severity level"}
                },
                "required": ["customer_id", "issue_summary", "severity"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "knowledge_search",
            "description": (
                "Search the FAQ and policy knowledge base. Use for product information, "
                "return and refund policies, shipping details, warranty terms, and store "
                "policies. Do NOT use for customer-specific data (use order_lookup instead)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Natural language search query describing what information is needed"}
                },
                "required": ["query"]
            }
        }
    }
]
```


**智能体如何根据对话选择工具**


| 客户消息                    | 智能体推理            | 调用工具                                                           | 执行             |
| ----------------------- | ---------------- | -------------------------------------------------------------- | -------------- |
| “我的订单在哪里？”              | 客户想要订单状态         | order_lookup(customer_id)                                      | 顺序（单个工具）       |
| “我想退我的耳机”               | 需要订单详情和退货政策      | order_lookup(customer_id) 然后 knowledge_search("return policy") | 顺序（政策检查依赖订单数据） |
| “我的订单状态是什么？你们的退货政策是什么？” | 两个独立问题           | order_lookup(customer_id) 和 knowledge_search("return policy")  | 并行（独立查询）       |
| “我想为订单 #7841 退款”        | 需要订单查询、政策检查，然后退款 | order_lookup 然后 knowledge_search 然后 refund_process             | 顺序链            |
| “这太荒谬了，我要和经理说话”         | 客户要求人工           | escalate_to_human(severity="high")                             | 立即             |


**完整交互轨迹**


客户：“我上周买了耳机，它们不工作。我想退款。”


```plain text
思考 1：客户想为有缺陷的耳机退款。我需要先查询订单。
行动 1：order_lookup(customer_id="C-9182")
观察 1：{"order_id": "7841", "item": "Wireless Headphones", "amount": 45.00,
         "purchase_date": "2025-03-08", "status": "delivered"}

思考 2：找到订单。$45，6 天前购买。我需要检查退货政策。
行动 2：knowledge_search("return policy defective electronics")
观察 2：{"policy": "Defective electronics may be returned within 30 days for a full refund.
         Customer does not need to return the item for amounts under $75."}

思考 3：订单在 30 天窗口内。商品是有缺陷的电子产品。金额是 $45，
        低于 $50 自动批准阈值。我可以处理此退款。
行动 3：refund_process(order_id="7841", amount=45.00, reason="defective product - customer reported malfunction")
观察 3：{"status": "approved", "refund_id": "R-20250314-7841", "estimated_credit": "3-5 business days"}

回复：“我已为您的 Wireless Headphones（订单 #7841）处理了 $45.00 的全额退款。
      退款将在 3-5 个工作日内出现在您的账户中。由于商品有缺陷，
      您无需退回。还有什么我可以帮您的吗？”
```


三次工具调用，顺序执行（每一步都需要前一个结果），最终回复完全基于检索到的数据。没有幻觉。没有猜测。


---


### 本节速查表


**覆盖的概念**


| 概念     | 一句话总结                                                          |
| ------ | -------------------------------------------------------------- |
| 工具调用机制 | 大语言模型生成结构化 JSON。你的代码执行函数。大语言模型从不运行代码。                          |
| 模式设计   | 名称、描述（最重要）、类型化参数。描述告诉大语言模型何时使用工具。                              |
| 结构化输出  | 通过函数调用格式、JSON 模式或 Pydantic 验证强制大语言模型返回有效 JSON。                 |
| 错误处理   | 带退避的重试、回退、优雅降级。绝不吞掉错误并幻觉。                                      |
| 并行执行   | 独立工具同时运行。依赖工具顺序运行。并行节省延迟。                                      |
| MCP    | 工具集成的开放标准。一个客户端，多个服务器。消除每个工具的自定义代码。                            |
| 案例研究工具 | order_lookup、refund_process、escalate_to_human、knowledge_search |


**常见错误**


| 错误              | 为什么错                                 | 更好的回答                                        |
| --------------- | ------------------------------------ | -------------------------------------------- |
| “大语言模型直接调用 API” | 大语言模型生成请求。你的执行层调用 API。大语言模型没有网络访问权限。 | “大语言模型输出结构化工具调用。我的应用代码验证并执行它。”               |
| 设计工具时描述模糊       | 大语言模型通过读取描述选择工具。模糊描述导致错误工具选择。        | “我写的描述告诉大语言模型确切何时使用每个工具以及返回什么。”              |
| 没有工具失败的错误处理     | API 会失败。没有处理，智能体要么崩溃，要么幻觉数据。         | “我对瞬态失败实现带退避的重试，对可用性实现回退源，并优雅降级，向用户清晰说明。”    |
| 让每次工具调用都顺序执行    | 顺序执行会累积延迟。独立查询应并行运行。                 | “我识别独立工具调用，并用 asyncio.gather 运行它们以最小化总响应时间。” |
| 每次请求列出 20+ 个工具  | 浪费上下文词元并降低大语言模型选择准确率。                | “我根据分类意图动态加载相关工具，通常每次请求 4-6 个。”              |


**需要记住的关键术语**


```plain text
工具模式：        名称 + 描述 + 参数（JSON Schema）
函数调用：        提供商原生 API，用于结构化工具调用
结构化输出：      强制大语言模型返回有效、符合模式的 JSON
重试预算：        最多 3 次尝试，指数退避（1s、2s、4s）
并行执行：        对独立工具调用使用 asyncio.gather
MCP：             模型上下文协议。工具发现和调用的开放标准。
幂等性：          同一行动执行两次 = 同一结果。对重试至关重要。（第 8 节完整覆盖）
```


**本节如何连接到其他章节**


| 本节                   | 连接到                                      |
| -------------------- | ---------------------------------------- |
| 工具调用机制               | 第 1 节：这是感知、推理、行动、观察循环中的“行动”步骤            |
| 大语言模型生成结构化输出         | 第 2 节：大语言模型遵循模式的能力取决于模型能力和温度设置           |
| 错误处理和回退              | 第 8 节：重试策略、幂等性和优雅降级深入覆盖                  |
| knowledge_search 工具  | 第 6 节：RAG 和向量检索为 knowledge_search 实现提供动力 |
| escalate_to_human 工具 | 第 9 节：高风险行动的人机协同授权边界                     |
| 工具数量和上下文成本           | 第 11 节：生产智能体的词元经济学和成本建模                  |