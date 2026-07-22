---
title: 12-factor-agent
slug: 2026-07-22-12-factor-agent
description: 1. Natural Language to Tool Calls
  构建智能体时最常见的模式之一是将自然语言转换为结构化的工具调用。这种强大的模式使你能够构建可以推理任务并执行任务的智能体。
  这种模式，如果单独应用，就是对类似这样的短语的简单翻译。 你能创建一个支付链接，向 Terri 支付 750 美元，作为她赞助二…
author: 墨韵
date: 2026-07-22
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3a5df5c0-26f4-803d-bf75-fbcfc11aaf13
notionSyncedAt: 2026-07-22T15:41:21.317Z
---

### 1. Natural Language to Tool Calls


构建智能体时最常见的模式之一是将自然语言转换为结构化的工具调用。这种强大的模式使你能够构建可以推理任务并执行任务的智能体。


![110-natural-language-tool-calls.png](images/blog/2026-07-22-12-factor-agent/img-a5ba10fcfd.png)


这种模式，如果单独应用，就是对类似这样的短语的简单翻译。

> 你能创建一个支付链接，向 Terri 支付 750 美元，作为她赞助二月份人工智能爱好者聚会的报酬吗？

转换为描述 Stripe API 调用的结构化对象，例如


```json
{
  "function": {
    "name": "create_payment_link",
    "parameters": {
      "amount": 750,
      "customer": "cust_128934ddasf9",
      "product": "prod_8675309",
      "price": "prc_09874329fds",
      "quantity": 1,
      "memo": "Hey Jeff - see below for the payment link for the february ai tinkerers meetup"
    }
  }
}
```


**注意** ：实际上 Stripe API 要复杂一些，一个[真正的代理 ](https://github.com/dexhorthy/mailcrew)会列出客户、产品、价格等信息，以便使用正确的 ID 构建此有效负载，或者将这些 ID 包含在提示/上下文窗口中


从这一步开始，确定性的代码（Deterministic code）就可以接收该数据载荷（Payload）并执行相应的操作。


```python
# The LLM takes natural language and returns a structured object
nextStep = await llm.determineNextStep(
  """
  create a payment link for $750 to Jeff
  for sponsoring the february AI tinkerers meetup
  """
  )

# Handle the structured output based on its function
if nextStep.function == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return  # or whatever you want, see below
elif nextStep.function == 'something_else':
    # ... more cases
    pass
else:  # the model didn't call a tool we know about
    # do something else
    pass
```


**注意** ：完整的agent则会接收 API 调用结果并循环处理，最终返回类似这样的结果。

> 我已经成功创建了一个支付链接，金额为 750 美元，用于支付 Terri 赞助二月份 AI 爱好者聚会的费用。链接如下： [https://buy.stripe.com/test_1234567890](https://buy.stripe.com/test_1234567890)

### 2. 掌控你的 Prompts


不要把你的 Prompt 工程外包给框架。


![120-own-your-prompts.png](images/blog/2026-07-22-12-factor-agent/img-e6cd923704.png)


某些框架提供了类似这样的“黑盒”方式：


```python
agent = Agent(
  role="...",
  goal="...",
  personality="...",
  tools=[tool1, tool2, tool3]
)

task = Task(
  instructions="...",
  expected_output=OutputModel
)

result = agent.run(task)
```


这种方式非常适合引入一些顶级的 Prompt 工程技巧来帮你快速上手，但通常很难进行调优和/或逆向工程，从而无法精准地将正确的 Token 输入到你的模型中。


相反，应该**掌控你的 Prompts，并将其视为一等公民代码（First-class code）**：


```rust
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
  prompt #"
    {{ _.role("system") }}

    You are a helpful assistant that manages deployments for frontend and backend systems.
    You work diligently to ensure safe and successful deployments by following best practices
    and proper deployment procedures.

    Before deploying any system, you should check:
    - The deployment environment (staging vs production)
    - The correct tag/version to deploy
    - The current system status

    You can use tools like deploy_backend, deploy_frontend, and check_deployment_status
    to manage deployments. For sensitive deployments, use request_approval to get
    human verification.

    Always think about what to do first, like:
    - Check current deployment status
    - Verify the deployment tag exists
    - Request approval if needed
    - Deploy to staging before production
    - Monitor deployment progress

    {{ _.role("user") }}

    {{ thread }}

    What should the next step be?
  "#
}
```


（上面的示例使用了 [BAML](https://github.com/boundaryml/baml) 来生成 Prompt，但也可以使用任何你喜欢的 Prompt 工程工具，甚至是手动拼接模板）


```typescript
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {ues
```


**掌控 Prompts 的核心优势：**

1. **完全控制（Full Control）**：精准编写 Agent 所需的指令，不存在黑盒抽象。
2. **测试与评估（Testing and Evals）**：就像对待其他任何代码一样，为你的 Prompts 编写测试和评估套件。
3. **快速迭代（Iteration）**：根据实际运行表现快速修改 Prompt。
4. **透明度（Transparency）**：清楚地知道你的 Agent 正在基于什么指令工作。
5. **角色黑客/操控（Role Hacking）**：利用支持非标准 user/assistant 角色用法的 API——例如，现在已被废弃的 OpenAI 非 Chat 类“Completions”API。这包括一些所谓的“模型 PUA / 欺骗（Model Gaslighting）”技术。

请记住：**你的 Prompts 是应用逻辑与大语言模型（LLM）之间最核心的交互接口。**


完全掌控你的 Prompt，能为你构建生产级（Production-grade）Agent 提供所需的灵活性与控制力。


### 3. 掌控你的上下文窗口


向大语言模型（LLM）传递上下文时，你并不一定非要使用标准的、基于消息（Message-based）的格式。

> 在任何时刻，你在 Agent 中向 LLM 提供的输入本质上都是：“这是到目前为止发生的一切，下一步该做什么”

所有的一切归根结底都是**上下文工程（Context Engineering）**。[LLM 是无状态函数](https://thedataexchange.media/baml-revolution-in-ai-engineering/)，用于将输入转换为输出。要获得最佳的输出，你就需要为其提供最佳的输入。


构建优质的上下文意味着包含：

- 你给模型的 Prompt 和指令
- 你检索到的任何文档或外部数据（例如 RAG）
- 任何历史状态、工具调用、执行结果或其他历史记录
- 来自关联但独立的历史/对话中的任何历史消息或事件（记忆 Memory）
- 关于应该输出何种结构化数据的指令

![454623419-0f1f193f-8e94-4044-a276-576bd7764fd0.png](images/blog/2026-07-22-12-factor-agent/img-1966d25bc7.png)


关于上下文工程


本文**不涉及**以下内容：

- 调整模型参数（如 `temperature`、`top_p`、`frequency_penalty`、`presence_penalty` 等）
- 训练你自己的补全（Completion）或嵌入（Embedding）模型
- 对现有模型进行微调（Fine-tuning）

标准上下文格式 vs. 自定义上下文格式


大多数 LLM 客户端都使用如下所示的标准基于消息的格式：


```yaml
[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": "Can you deploy the backend?"
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "1",
        "name": "list_git_tags",
        "arguments": "{}"
      }
    ]
  },
  {
    "role": "tool",
    "name": "list_git_tags",
    "content": "{\"tags\": [{\"name\": \"v1.2.3\", \"commit\": \"abc123\", \"date\": \"2024-03-15T10:00:00Z\"}, {\"name\": \"v1.2.2\", \"commit\": \"def456\", \"date\": \"2024-03-14T15:30:00Z\"}, {\"name\": \"v1.2.1\", \"commit\": \"abe033d\", \"date\": \"2024-03-13T09:15:00Z\"}]}",
    "tool_call_id": "1"
  }
]
```


虽然这种方式在大多数场景下都表现良好，但如果你想真正**最大化**发挥当前 LLM 的性能，就需要以最节省 Token、最符合注意力机制（Attention-efficient）的方式将上下文注入 LLM 中。


作为标准基于消息格式的替代方案，你可以针对自己的应用场景构建专用的自定义上下文格式。例如，你可以使用自定义对象，并将它们打包/展开到最符合逻辑的一个或多个 `user`、`system`、`assistant` 或 `tool` 消息中。


以下是将整个上下文窗口打包进单个 `user` 消息的示例：


```yaml
[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": |
            Here's everything that happened so far:

        <slack_message>
            From: @alex
            Channel: #deployments
            Text: Can you deploy the backend?
        </slack_message>

        <list_git_tags>
            intent: "list_git_tags"
        </list_git_tags>

        <list_git_tags_result>
            tags:
              - name: "v1.2.3"
                commit: "abc123"
                date: "2024-03-15T10:00:00Z"
              - name: "v1.2.2"
                commit: "def456"
                date: "2024-03-14T15:30:00Z"
              - name: "v1.2.1"
                commit: "ghi789"
                date: "2024-03-13T09:15:00Z"
        </list_git_tags_result>

        what's the next step?
    }
]
```


模型可能会根据你提供的 Tool Schema 推断出你在问它`下一步该做什么`，但把这句话直接显式打入你的 Prompt 模板中也百利而无一害。


代码示例


以通过类似如下的代码结构来构建这一逻辑：


```python
class Thread:
  events: List[Event]

class Event:
  # could just use string, or could be explicit - up to you
  type: Literal["list_git_tags", "deploy_backend", "deploy_frontend", "request_more_information", "done_for_now", "list_git_tags_result", "deploy_backend_result", "deploy_frontend_result", "request_more_information_result", "done_for_now_result", "error"]
  data: ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation |
        ListGitTagsResult | DeployBackendResult | DeployFrontendResult | RequestMoreInformationResult | string

def event_to_prompt(event: Event) -> str:
    data = event.data if isinstance(event.data, str) \
           else stringifyToYaml(event.data)

    return f"<{event.type}>\n{data}\n</{event.type}>"


def thread_to_prompt(thread: Thread) -> str:
  return '\n\n'.join(event_to_prompt(event) for event in thread.events)
```


**上下文窗口架构示例**


使用这种方法，上下文窗口的实际形态如下：


**1. 初始 Slack 请求：**


```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
</slack_message>
```


2. 获取 Git Tag 列表之后：


```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<list_git_tags>
    intent: "list_git_tags"
</list_git_tags>

<list_git_tags_result>
    tags:
      - name: "v1.2.3"
        commit: "abc123"
        date: "2024-03-15T10:00:00Z"
      - name: "v1.2.2"
        commit: "def456"
        date: "2024-03-14T15:30:00Z"
      - name: "v1.2.1"
        commit: "ghi789"
        date: "2024-03-13T09:15:00Z"
</list_git_tags_result>
```


3. 发生错误与恢复之后：


```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<error>
    error running deploy_backend: Failed to connect to deployment service
</error>

<request_more_information>
    intent: "request_more_information_from_human"
    question: "I had trouble connecting to the deployment service, can you provide more details and/or check on the status of the service?"
</request_more_information>

<human_response>
    data:
      response: "I'm not sure what's going on, can you check on the status of the latest workflow?"
</human_response>
```


到了这一步，下一步推理可能是：


```python
nextStep = await determine_next_step(thread_to_prompt(thread))
```


```python
{
  "intent": "get_workflow_status",
  "workflow_name": "tag_push_prod.yaml",
}
```


类 XML 格式仅是一个示例——核心重点在于**你可以构建最符合你业务逻辑的自定义格式**。只要你拥有尝试不同上下文结构以及自由决定“保存什么 vs. 传给 LLM 什么”的灵活性，就能获得更好的输出质量。


**掌控上下文窗口的核心优势：**

1. **信息密度（Information Density）**：以能够最大化 LLM 理解效率的方式组织信息。
2. **错误处理（Error Handling）**：以有助于 LLM 进行自我恢复的格式包含错误信息。问题解决后，可以考虑从上下文窗口中隐藏错误和失败的调用。
3. **安全性（Safety）**：控制传递给 LLM 的数据，精准过滤敏感信息。
4. **灵活性（Flexibility）**：随着你不断探索出最适合自己场景的方案，可以随时调整格式。
5. **Token 效率（Token Efficiency）**：优化上下文格式，兼顾 Token 利用率与 LLM 的理解能力。
> 上下文涵盖：Prompts、指令、RAG 文档、历史记录、工具调用、记忆。

请记住：**上下文窗口是你与 LLM 交互的核心接口。掌控信息的结构与呈现方式，能够显著提升 Agent 的执行性能。**


示例——提高信息密度：用更少的 Token 表达完全相同的信息：


![image](https://github.com/user-attachments/assets/5cf041c6-72da-4943-be8a-99c73162b12a)


### 4. 工具本质上就是结构化输出


工具并不需要设计得多么复杂。其核心本质，不过是 LLM 返回的**结构化输出（Structured Output）**，用于触发后续的**确定性代码（Deterministic code）**。


![140-tools-are-just-structured-outputs.png](images/blog/2026-07-22-12-factor-agent/img-b2aba0c180.png)


举个例子，假设你有两个工具：`CreateIssue`（创建工单）和 `SearchIssues`（搜索工单）。要让 LLM “在多个工具中选择一个使用”，本质上就是让它输出一段 JSON，我们将其解析为一个能代表这些工具的对象。


```python
class Issue:
  title: str
  description: str
  team_id: str
  assignee_id: str

class CreateIssue:
  intent: "create_issue"
  issue: Issue

class SearchIssues:
  intent: "search_issues"
  query: str
  what_youre_looking_for: str
```


这种模式非常简单清晰：

1. LLM 输出结构化的 JSON。
2. 确定性代码执行对应的操作（比如调用外部 API）。
3. 捕获执行结果，并将其重新喂回上下文（Context）中。

这在 LLM 的**决策逻辑**与你应用的**实际执行**之间建立了一道清晰的界限。LLM 负责决定“做什么”，而你的代码负责控制“怎么做”。仅仅因为 LLM “调用了一个工具”，并不意味着你每次都必须以完全相同的方式去执行对应的某个具体函数。


条件分支（`switch` / `if-else`）代码


```python
if nextStep.intent == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return # or whatever you want, see below
elif nextStep.intent == 'wait_for_a_while':
    # do something monadic idk
else: #... the model didn't call a tool we know about
    # do something else
```


**注意**：关于“纯 Prompt（Plain Prompting）”、“工具调用（Tool Calling）”、“JSON 模式（JSON Mode）”三者的优劣以及各自的性能权衡（Performance Tradeoffs），业内已经有了大量的讨论。我们很快会附上一些相关资源，这里就不做展开了。详情可参考：[Prompting vs JSON Mode vs Function Calling vs Constrained Generation vs SAP](https://www.boundaryml.com/blog/schema-aligned-parsing)、[何时应该使用函数调用、结构化输出还是 JSON 模式？](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode#:~:text=We%20don%27t%20recommend%20using%20JSON,always%20use%20Structured%20Outputs%20instead) 以及 [OpenAI JSON vs Function Calling](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)。


这里的“下一步”（Next step）可能不仅仅是“运行一个纯函数并返回结果”那么简单。当你把“工具调用”重新理解为“模型输出一段用于描述确定性代码该做什么的 JSON”时，你将解锁极大的设计灵活性。建议将此原则与 [要素 8：掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md) 结合起来理解。


### 5.  **统一执行状态和业务状态**


即便在 AI 领域之外，许多基础设施系统也倾向于将“执行状态”与“业务状态”割裂开来。对于 AI 应用而言，这通常意味着需要构建复杂的抽象层，用来跟踪像当前步骤、下一步骤、等待状态、重试次数等信息。这种分离虽然有其合理性，但对你的实际业务场景来说，可能纯属**过度设计（Overkill）**。


一如既往，如何选择取决于你的应用需求。但切记：**你绝非必须将它们分开管理**。


具体定义如下：

- **执行状态（Execution state）**：当前步骤、下一步骤、等待状态、重试次数等。
- **业务状态（Business state）**：Agent 工作流至今为止发生的一切（例如 OpenAI 的消息列表、工具调用及其结果列表等）。

![155-unify-state-animation.gif](images/blog/2026-07-22-12-factor-agent/img-34104dc24b.gif)


在实际工程落地中，你可以对应用进行精心设计，使得**所有的执行状态都能直接从上下文窗口（Context Window）中推导出来**。在大多数情况下，执行状态（如当前步骤、等待状态等）不过是对“目前已发生事项”的一种元数据描述罢了。


你可能依然有一些无法直接塞进上下文窗口的数据（例如 Session ID、密码上下文等），但你的终极目标应该是将这类数据压缩到最少。只要践行 [要素 3：掌控你的上下文窗口](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)，你就能完全掌控究竟要把哪些数据真正喂给 LLM。


这种统一状态的方案具有以下几大核心优势：

1. **极致简单（Simplicity）**：所有状态保持唯一的单一事实来源（Single source of truth）。
2. **易于序列化（Serialization）**：整个事件流（Thread）可以非常轻量地进行序列化与反序列化。
3. **调试友好（Debugging）**：全量历史记录一目了然，可在单一视图内直观掌控。
4. **扩展灵活（Flexibility）**：只需引入新的事件类型（Event Type），即可无缝添加全新的状态。
5. **故障恢复（Recovery）**：只需重新加载该 Thread，即可从任意时点无缝恢复运行。
6. **分支派生（Forking）**：可以将 Thread 的任意子集复制到全新的上下文/状态 ID 中，轻松实现状态的分支派生。
7. **人机交互与可观测性（Human Interfaces and Observability）**：将 Thread 转化为人类可读的 Markdown 文档或丰富的高交互 Web UI 变得极其简单。

### 6. 通过简单 API 实现启动 / 暂停 / 恢复


agent 本质上就是程序，对于如何启动、查询、恢复和停止它们，我们有着符合直觉的预期。

- **启动（Launch）**：用户、其他应用、自动化流水线以及其他 Agent，都应该能够通过简单易用的 API 轻松启动一个 Agent。
- **暂停（Pause）**：当需要执行长耗时操作时，Agent 及其编排侧的确定性代码（Deterministic Code）应当能够主动将 Agent 暂停。
- **恢复（Resume）**：Webhooks 等外部触发器应当能够让 Agent 从上次中断的地方继续运行，而无需与 Agent 编排器进行深度的硬编码集成。

这一要素与 [要素 5：统一执行状态与业务状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md) 和 [要素 8：掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md) 紧密相关，但也可以独立实现。


**注意**：很多 AI 编排框架虽然允许暂停和恢复，但通常**无法**在“工具选择（Tool Selection）”与“工具执行（Tool Execution）”之间的缝隙进行暂停。另请参考 [要素 7：通过工具调用与人类联系](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md) 以及 [要素 11：支持随处触发，在用户习惯的场景相遇](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-11-trigger-from-anywhere.md)。


### 7. 通过工具调用与人联系


默认情况下，LLM API 依赖于一个极高风险（HIGH-STAKES）的 Token 选择：我们究竟是要返回纯文本内容，还是返回结构化数据？


![170-contact-humans-with-tools.png](images/blog/2026-07-22-12-factor-agent/img-a24659c50d.png)


你在这第一个 Token 的选择上押下了很大的筹码。比如在“东京的天气”这种场景下，第一个 Token 是：

> "the"

但在调用 `fetch_weather` 工具的情况下，它却是一个表示 JSON 对象开始的特殊 Token：

> |JSON>

通过让 LLM **始终**输出 JSON，并用一些自然语言 Token 显式声明其意图——例如 `request_human_input` 或 `done_for_now`（而不是像 `check_weather_in_city` 那样“规范”的工具），你可能会获得更好的效果。


同样地，这样做可能不会带来直接的性能提升，但你应该去尝试，并确保自己能自由尝试各种“古怪”的想法，以争取获得最佳输出效果。


```python
class Options:
  urgency: Literal["low", "medium", "high"]
  format: Literal["free_text", "yes_no", "multiple_choice"]
  choices: List[str]

# Tool definition for human interaction
class RequestHumanInput:
  intent: "request_human_input"
  question: str
  context: str
  options: Options

# Example usage in the agent loop
if nextStep.intent == 'request_human_input':
  thread.events.append({
    type: 'human_input_requested',
    data: nextStep
  })
  thread_id = await save_state(thread)
  await notify_human(nextStep, thread_id)
  return # Break loop and wait for response to come back with thread ID
else:
  # ... other cases
```


你可能会收到来自处理 Slack、电子邮件、短信或其他事件系统的 Webhook 通知：


```python
@app.post('/webhook')
def webhook(req: Request):
  thread_id = req.body.threadId
  thread = await load_state(thread_id)
  thread.events.push({
    type: 'response_from_human',
    data: req.body
  })
  # ... simplified for brevity, you likely don't want to block the web worker here
  next_step = await determine_next_step(thread_to_prompt(thread))
  thread.events.append(next_step)
  result = await handle_next_step(thread, next_step)
  # todo - loop or break or whatever you want

  return {"status": "ok"}
```


上面的代码融入了来自 [要素 5：统一执行状态与业务状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md)、[要素 8：掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)、[要素 3：掌控你的上下文窗口](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md) 以及 [要素 4：工具本质上就是结构化输出](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-04-tools-are-structured-outputs.md) 等多个要素的模式。


如果我们使用来自 [要素 3：掌控你的上下文窗口](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md) 的类 XML 格式，几轮交互后的上下文窗口可能会是下面这样：


```xml
(snipped for brevity)

<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy backend v1.2.3 to production?
    Thread: []
</slack_message>

<request_human_input>
    intent: "request_human_input"
    question: "Would you like to proceed with deploying v1.2.3 to production?"
    context: "This is a production deployment that will affect live users."
    options: {
        urgency: "high"
        format: "yes_no"
    }
</request_human_input>

<human_response>
    response: "yes please proceed"
    approved: true
    timestamp: "2024-03-15T10:30:00Z"
    user: "alex@company.com"
</human_response>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<deploy_backend_result>
    status: "success"
    message: "Deployment v1.2.3 to production completed successfully."
    timestamp: "2024-03-15T10:30:00Z"
</deploy_backend_result>
```


**核心优势：**

1. **清晰明确的指令（Clear Instructions）**：为不同类型的“联系人类”提供专属工具，能让 LLM 输出更精准、更具针对性的表达。
2. **内环 vs 外环（Inner vs Outer Loop）**：支持**超出**传统 ChatGPT 式对话界面之外的 Agent 工作流，在这些场景中，控制流和上下文初始化的触发方向可能是 `Agent -> 人类` 而非 `人类 -> Agent`（例如由定时任务 Cron 或系统事件触发的 Agent）。
3. **多人交互支持（Multiple Human Access）**：能够通过结构化事件，轻松跟踪和协调来自不同人类的输入反馈。
4. **多 Agent 协作（Multi-Agent）**：这种简单的抽象可以非常方便地扩展，以支持 `Agent -> Agent` 的请求与响应。
5. **持久化（Durable）**：与 [要素 6：通过简单 API 实现启动/暂停/恢复](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md) 结合使用时，可构建出持久、可靠且具备可自省性（Introspectable）的多人协作工作流。

### 8. 掌控你的控制流


如果你完全掌控了自己的控制流，就能玩出很多花样。


![180-control-flow.png](images/blog/2026-07-22-12-factor-agent/img-b1ca641f5b.png)


构建最符合你特定业务场景的控制结构。具体来说，某些类型的工具调用可能需要你跳出循环（Break out of the loop），等待人类的回复或者等待类似模型训练流水线这样的长耗时任务。你可能还希望引入以下自定义实现：

- 对工具调用结果进行摘要或缓存
- 基于结构化输出的 LLM-as-judge（大模型裁决）
- 上下文窗口压缩或其他[记忆管理](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)
- 日志、链路追踪（Tracing）与指标监控（Metrics）
- 客户端限流（Rate limiting）
- 持久化休眠 / 暂停 / “等待事件”

下面的代码示例展示了三种可能的控制流模式：

- `request_clarification`：模型请求获取更多信息，跳出循环并等待人类回复。
- `fetch_open_issues`：模型请求获取公开工单列表，拉取工单、追加到上下文窗口中，并直接喂回给模型。
- `create_issue`：模型请求创建工单，这是一个高风险/高影响的操作，因此跳出循环并等待人工审批。

```python
def handle_next_step(thread: Thread):

  while True:
    next_step = await determine_next_step(thread_to_prompt(thread))

    # inlined for clarity - in reality you could put
    # this in a method, use exceptions for control flow, or whatever you want
    if next_step.intent == 'request_clarification':
      thread.events.append({
        type: 'request_clarification',
          data: nextStep,
        })

      await send_message_to_human(next_step)
      await db.save_thread(thread)
      # async step - break the loop, we'll get a webhook later
      break
    elif next_step.intent == 'fetch_open_issues':
      thread.events.append({
        type: 'fetch_open_issues',
        data: next_step,
      })

      issues = await linear_client.issues()

      thread.events.append({
        type: 'fetch_open_issues_result',
        data: issues,
      })
      # sync step - pass the new context to the LLM to determine the NEXT next step
      continue
    elif next_step.intent == 'create_issue':
      thread.events.append({
        type: 'create_issue',
        data: next_step,
      })

      await request_human_approval(next_step)
      await db.save_thread(thread)
      # async step - break the loop, we'll get a webhook later
      break
```


这种模式允许你根据需要随时中断和恢复 Agent 的流程，从而创造出更自然流畅的对话体验与工作流。


**示例**——我对市面上所有 AI 框架的核心功能需求第一名，就是能够**中断一个正在运行的 Agent 并在后续恢复它**，**特别是**在工具选择（Selection）**与工具**调用/执行（Invocation）之间的那个时刻。


如果缺乏这种粒度的恢复能力，就没有办法在工具调用运行前对其进行审核/批准，这意味着你将被迫陷入以下三种尴尬境地之一：

1. 在等待长耗时任务完成时将任务保存在内存中（比如 `while...sleep`），而一旦进程中断就只能从头重新开始；
2. 限制 Agent 只能执行低风险的调用，比如资料检索和摘要总结；
3. 赋予 Agent 权限去执行更大、更有价值的操作，然后“凭运气（Yolo）”保佑它别把事情搞砸。

你可能已经注意到，这一要素与 [要素 5：统一执行状态与业务状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md) 和 [要素 6：通过简单 API 实现启动/暂停/恢复](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md) 紧密相关，但也可以独立实现。


### 9. 将错误精简压缩至上下文窗口


Agent 的核心优势之一就是“自愈（Self-healing）能力”——对于短任务而言，LLM 调用的工具可能会失败，而优秀的 LLM 有相当高的概率能通过读取错误信息或堆栈追踪（Stack Trace），在后续的工具调用中找出并修正问题。


大多数框架都实现了这一点，但即使你不采用其他 11 个要素，也**单单**可以把这一项做起来。示例如下：


```python
thread = {"events": [initial_message]}

while True:
  next_step = await determine_next_step(thread_to_prompt(thread))
  thread["events"].append({
    "type": next_step.intent,
    "data": next_step,
  })
  try:
    result = await handle_next_step(thread, next_step) # our switch statement
  except Exception as e:
    # if we get an error, we can add it to the context window and try again
    thread["events"].append({
      "type": 'error',
      "data": format_error(e),
    })
    # loop, or do whatever else here to try to recover
```


你可能希望为特定的工具调用实现一个 `errorCounter`（错误计数器），将单个工具的重试次数限制在 ~3 次左右，或者采用任何最符合你业务场景的逻辑：


```python
consecutive_errors = 0

while True:

  # ... existing code ...

  try:
    result = await handle_next_step(thread, next_step)
    thread["events"].append({
      "type": next_step.intent + '_result',
      data: result,
    })
    # success! reset the error counter
    consecutive_errors = 0
  except Exception as e:
    consecutive_errors += 1
    if consecutive_errors < 3:
      # do the loop and try again
      thread["events"].append({
        "type": 'error',
        "data": format_error(e),
      })
    else:
      # break the loop, reset parts of the context window, escalate to a human, or whatever else you want to do
      break
  }
}
```


当连续错误达到一定阈值时，通常就是[升级转接给人工（Escalate to a human）](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md)的绝佳时机——这既可以由模型自主决策，也可以通过确定性代码接管控制流来实现。


**核心优势：**

1. **自愈能力（Self-Healing）**：LLM 能够读取错误信息，并在下一次工具调用中自行琢磨出该修改什么。
2. **持久容错（Durable）**：即使其中某一次工具调用失败，Agent 依然能够持续运行。

我相信你会发现，如果这种重试**过于频繁**，Agent 就会开始陷入死循环（Spin out），甚至可能一遍又一遍地重复完全相同的错误。


这正是 [要素 8：掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md) 和 [要素 3：掌控你的上下文构建](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md) 发挥作用的地方——你无需直接把原始的报错直接塞回上下文，而是可以完全重构错误的呈现方式、从上下文窗口中移除先前的失效事件，或采取任何你能验证生效的确定性手段，来让 Agent 重新回到正轨。


不过，防止错误死循环**最核心的方法**，依然是拥抱 [要素 10：打造专注的小型 Agent](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-10-small-focused-agents.md)。


### 10. 打造专注的小型 Agent


不要去构建包揽一切的单体（Monolithic）Agent，而是应该构建专注、轻量、能把单一任务做好的 Agent。在更大的、主要由确定性代码构成的系统里，Agent 仅仅只是其中的一个基础构件（Building block）。


![1a0-small-focused-agents.png](images/blog/2026-07-22-12-factor-agent/img-0855bb339d.png)


这里的核心洞察来自于 LLM 的能力边界：任务越庞大、越复杂，执行它所需的步骤就越多，这也就意味着更长的上下文窗口。随着上下文的不断膨胀，LLM 极易迷失方向或失去焦点。因此，将 Agent 限制在特定领域内，把执行步骤控制在 3-10 步、最多不超过 20 步，才能将上下文窗口维持在可控范围内，进而保障 LLM 的高性能输出。

> 随着上下文的膨胀，LLM 极易迷失方向或失去焦点

**专注型小型 Agent 的核心优势：**

1. **上下文可控（Manageable Context）**：更小的上下文窗口意味着更好的 LLM 输出表现。
2. **权责清晰（Clear Responsibilities）**：每个 Agent 都有明确定义的边界与目标。
3. **可靠性更高（Better Reliability）**：降低在复杂工作流中迷路或失效的概率。
4. **易于测试（Easier Testing）**：对特定功能进行测试和验证更加简单。
5. **调试门槛低（Improved Debugging）**：出现问题时能够快速定位并修复。

**如果 LLM 变得更聪明了呢？**


如果未来 LLM 足够聪明，能够轻松驾驭 100 步以上的复杂工作流，我们还需要这种模式吗？


**简言之：依然需要。** 随着 Agent 和 LLM 性能的提升，它们**可能**自然具备处理更长上下文窗口的能力，这也意味着它们能接管大型有向无环图（DAG）中**更多**的节点。但这种“专注小型 Agent”的设计范式，不仅能确保你**在当下**就能拿到可靠的结果，还能让你在 LLM 上下文窗口变得越来越可靠的过程中，循序渐进地扩大 Agent 的职责范围。


保持对 Agent 尺寸/作用域（Scope）的克制与审慎，并仅在能稳住质量的前提下进行扩容，是这里的关键所在。正如 [NotebookLM 打造团队所言](https://open.substack.com/pub/swyx/p/notebooklm?selection=08e1187c-cfee-4c63-93c9-71216640a5f8&utm_campaign=post-share-selection&utm_medium=web)：

> 我感觉在构建 AI 应用时，最神奇的时刻往往来自于我将产品压在**紧贴模型能力极限边缘**的那一刻。

无论这个能力边界在何处，只要你能精准找到它并稳定地发挥其最大价值，就能打造出惊艳的体验。在这条赛道上有很多护城河等待去构建，但一如既往，这离不开严谨的工程落地。


[← Back to README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)


### 11. 支持随处触发，在用户习惯的场景相遇


如果你一直在等待 [humanlayer](https://humanlayer.dev/) 的产品推荐（Pitch），那你现在等到了。如果你已经实践了 [要素 6：通过简单 API 实现启动/暂停/恢复](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md) 和 [要素 7：通过工具调用与人类联系](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md)，那么你就已经准备好融入这一要素了。


![1b0-trigger-from-anywhere.png](images/blog/2026-07-22-12-factor-agent/img-45c4b74e67.png)


允许用户通过 Slack、电子邮件、短信或任何他们喜欢的渠道来触发 Agent；同时，也支持 Agent 通过这些相同的渠道进行响应与回复。


**核心优势：**

- **在用户习惯的场景相遇（Meet users where they are）**：这有助于你打造出体验类似“真人”、或者至少像“数字同事（Digital coworkers）”一样的 AI 应用。
- **外环 Agent（Outer Loop Agents）**：支持 Agent 由非人类主体触发（例如系统事件、定时任务 Cron、服务宕机告警等）。它们可以自主工作 5 分钟、20 分钟甚至 90 分钟，而当推进到关键节点时，随时可以主动联系人类寻求帮助、反馈或审批。
- **高风险工具（High Stakes Tools）**：如果你能够快速拉入各种相关人员参与协同，就可以赋予 Agent 权限去执行更高风险的操作（例如发送外部邮件、更新生产环境数据等）。维持清晰规范的交互标准，能为你带来极佳的可审计性（Auditability），并让你对 Agent [去执行更大、更有价值的任务](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-10-small-focused-agents.md#what-if-llms-get-smarter)充满信心。

### **12. 将你的代理设为无状态归约器**


![1c0-stateless-reducer.png](images/blog/2026-07-22-12-factor-agent/img-e807fe1976.png)