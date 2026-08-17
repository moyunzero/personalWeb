---
title: 学 DeepSeek Harness（3）：Turn / Step 与 Session Log——运行时心脏没有特权核心
slug: 2026-08-16-deepseek-harness-3-turn-step-session-log
description: >2
   DeepSeek Harness笔记 · 3
  需要：第 1–2 篇的基础（会写插件、会 `--patch`、会读 `dump-config`）；本篇建议配置好模型，以便在 Web
  里真实跑完一次对话。  
author: 墨韵
date: 2026-08-16
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3bedf5c0-26f4-803e-9231-cda2fcab85af
notionSyncedAt: 2026-08-17T02:48:15.127Z
---

前两篇解决的是启动期：插件怎么活、树怎么叠。叠完之后你会撞上一个更硬的问题——

> 用户说了一句话，系统内部到底发生了什么？
>
> 模型中间要调工具怎么办？
>
>
> 「它当时到底看到了什么」——答案存在哪里？
>
>

经典 chat API 的答案很简单：一次请求、一串 messages、一个响应，完事。Agent Harness 不能停在那里。本篇把运行时心脏拆开：先钉死 **Turn / Step**，再钉死 **Model-visible ⟺ logged**，最后用一个只打日志的 waterfall 观察插件证明——**扩展点在 loop 上，不在改** **`agent-loop`** **源码里**。


三问其实是同一句话的三个面：

> **没有特权核心**，在运行时心脏处的三个推论。

---


## 为什么「一次消息 = 一次 HTTP」不够


「一次用户消息 = 一次 HTTP 就结束」是无状态 chat 的坐标系：客户端拼好 history，服务端吐完就散。Agent 缺的恰好是四样东西。


**① 一次意图常常要多次模型调用。**


「帮我找 TODO 最多的文件」——模型可能先列目录、再搜索、再读结果、再回答。这是迭代次数事先未知的循环：请求 → 工具 → 结果 → 再请求。若坚持一问一答 HTTP，循环要么每个客户端各自重写，要么服务端写死脚本——两者都不可组合。Turn/Step 把循环本身变成一等公民：有边界、有事件、可观察、可拦截。


**② 输入不是一串孤立字符串，而是「债务」。**


排队消息、`agent.inject()` 的上下文、工具结果、steering、goal round……到达方式不同：有的立刻叫醒 driver，注入的上下文可能要等别的消息来才被领取。所以 turn 的边界不是「一条消息」，而是 **不再欠任何工作（nothing owed）**：第一次 claim 输入前打开，债务清零时关闭。


**③ 循环必须可中断、可观察、可持久化。**


中途注入、按工具审批、拒掉某个 step、拦停整个 turn、崩溃后恢复——一次裸 HTTP 做不到。`turn/*`、`step/*`、`agent/*`、`tools/*` 给了插件挂钩点；第 1 篇的 waterfall 纪律，在这里就是主干契约。


**④ 两个粒度，两个瞄准点。**


若强行「一条消息 = 一个 step」，你就无法分开「这次模型看到什么」和「这回合该不该结束」。Harness 的定义是：


| 概念       | 含义                            |
| -------- | ----------------------------- |
| **Step** | 一次模型请求 + 它调用的工具               |
| **Turn** | 零个或多个 Step；领到首条输入前打开，不再欠工作时关闭 |


`agent/pre-step` 管 step 入口；`agent/turn-stopping`（serial）管回合收尾。合并成一个粒度，策略就失去分辨率。


**⑤ loop 本身也可替换。**


默认 driver 挂在 `ctx.agentLoop` 上，实现的是 `Agent` 接口——它是插件，不是焊死在传输层里的「一问一答」。这又是「没有特权核心」：连循环实现都能换。


边界别忘了：**Turn 可以包含 0 个 Step**——例如 `agent/pre-step` 直接 `reject`，或 enter 被改成空；仍会留下一次可审计的 turn 关闭记录。


---


## 标准 Turn 骨架


官方架构文档里的流程，压缩成可读版：


```plain text
turn/start
  claim 下一批 next-step 输入 + 一条排队消息
  组装 prompt sections + tool schemas
  → agent/pre-step                 reject | enter(messages)
     reject / 空 enter → 关闭 turn（0 step）
     step/start
     把 entered 消息追加为 user/message（入账）
     从 Session Log 投影模型历史（deriveMessages）
     agent/request → llm/stream → assistant/chunk* → assistant/message
     tool/call* → tools/pre-execute → execute → post-execute → tool/result*
     step/end
     若工具还欠请求，或又有 next-step 输入 → 再 claim → 下一 step
  → agent/turn-stopping            （serial，无 next()）
turn/end
```


事件域要分清，否则挂钩会挂错：


| 域           | 例子                                                            | 用途                    |
| ----------- | ------------------------------------------------------------- | --------------------- |
| Session（持久） | `turn/start`、`user/message`、`assistant/message`、`tool/result` | 落盘、回放、UI transcript   |
| Agent（实时）   | `agent/pre-step`、`agent/request`、`agent/turn-stopping`        | 观察/拦截进行中的工作           |
| 能力          | `tools/pre-execute`、`fs/*`                                    | 给某个 seam 挂策略，不绑死 loop |


Waterfall 必须调 `next()` 才能委托：`agent/pre-step`、`agent/request`、`llm/stream`、三个 `tools/*`。


`agent/turn-stopping` 是 **serial**——没有 `next()`，靠数据（例如再 steer）决定要不要再开 step。


---


## Model-visible ⟺ logged：日志是唯一账本


机制很绝情：模型每次看到的历史，**不是**「框架心里记着的上次对话」，而是 `deriveMessages()` **从 Session Log 投影**出来的。日志是 append-only 的 `SessionEvent` 流。


因此规则是：

> **凡是会进模型请求的内容，都必须能从日志重建。**

若某段内容到了模型却没入账：

- fork / resume / 回放时，「当初模型看到的世界」会是假的；
- transcript、telemetry、持久化都派生自同一条流——日志撒谎，下游全撒谎；
- 调试失去锚点：模型行为异常时，你问「它当时看到了什么」——唯一能回答的地方就是日志。

更狠的是：这是**结构逼出来的**，不是靠自觉。因为历史只能从日志推导，新增一种模型可见输入，架构上通常要先扩展 `SessionEventMap`、写入事件，再从日志渲染。运行时还有 invariant 断言 **Model-visible ⟺ logged**——请求只是视图，账本才是真相。


类比：每个 step 先入账（`user/message` 等）再出账（`assistant/*`、`tool/result`）；账平了，下一页请求才能建在真实余额上。


---


## 动手：用 waterfall 观察一次真实 pre-step


目标：**不改** **`packages/core`**，用第 ②/④ 层那套 `--patch`，挂一个只观察的插件，证明 loop 在文档化扩展点上跑。


观测点选 **`agent/pre-step`**：纯聊天也会触发，不必先逼模型调工具。工具流水线的对称点是 `tools/pre-execute`——观察者同样必须 `return next()`；只有真正做 allow/deny/ask 的策略插件才有资格短路。


### 插件代码


`scratch-plugin/src/turn-observer.ts`：


```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'turn-observer'

export function apply(ctx: Context) {
  console.log('[turn-observer] plugin loaded')

  // waterfall：必须把决策交还给 next()，否则会短路整条 turn
  ctx.on('agent/pre-step', async (payload, next) => {
    const preview = payload.messages
      .map((m) => {
        const text = typeof m.content === 'string'
          ? m.content
          : JSON.stringify(m.content)
        return text.slice(0, 80)
      })
      .join(' | ')

    console.log(
      `[turn-observer] agent/pre-step turn=${payload.turn} step=${payload.step} messages=${payload.messages.length} preview=${preview}`,
    )

    return next()
  })
}
```


### Overlay


`scratch-plugin/cordis.yml`（`name` 换成你的仓库根绝对路径；在仓库根 `pwd` 再拼）：


```yaml
- insert:
    - id: turn-observer
      name: '/ABS/PATH/TO/REPO/scratch-plugin/src/turn-observer.ts'
```


### 启动与触发


```bash
# 先停掉占用 3080 的旧进程
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```


打开 Web，新建会话，发：`用一句话介绍你自己`。


真实终端摘要：


```plain text
[turn-observer] plugin loaded
dsh web: <http://127.0.0.1:3080>
[turn-observer] agent/pre-step turn=1 step=1 messages=1 preview=[{"type":"text","text":"用一句话介绍你自己"}]
```


三行分别证明：

1. 插件经 CLI overlay 挂进了真实树；
2. 用户消息触发了 **turn=1 / step=1** 的 `agent/pre-step`；
3. 你调用了 `next()`，对话没有被观察者掐死。

`preview` 打成 JSON，是因为 content 常是结构化块（`[{type,text}]`），不是纯字符串——正常。


可选加分：再听 `tools/pre-execute`，发一句会触发工具的请求，看同一 turn 里是否出现更高的 `step`——那就是「一次意图、多个 step」的现场。


---


## 为什么观察必须挂 waterfall，而不是改 agent-loop？


**改 loop = 为「看一眼」支付 fork 核心的代价。**


loop 是共享主干：改它全局生效、难按 agent 过滤、难卸载、难跟上游。官方立场是：新行为放文档化扩展点；改 `agent-loop` 必须同步改架构文档——门槛故意很高。


**观察的语义是「不改变行为」——****`next()`** **是唯一保证。**


忘了 `return next()`，观察就变成劫持：下游整段短路，模型请求或工具执行消失。第 1 篇的纪律在这里是正确性边界：策略插件可以不调 `next()`（因为它拥有 allow/deny/ask）；观察插件必须传话。


**waterfall 给你改 loop 给不了的组合性：** 多观察者并存、随插件卸载自动回滚、可按 agent scope 过滤。在 loop 里焊一行 `console.log`，得到的是永远卸不掉、可能拖垮主干的副作用。


---


## 踩坑备忘

1. **路径 / 端口**：与第 1–2 篇相同——绝对路径少 `/`、`EADDRINUSE`。
2. **纯聊天看不到** **`tools/pre-execute`**：没工具调用就不会进工具 waterfall；先用 `agent/pre-step` 验证链路。
3. **观察者忘了** **`next()`**：症状是 turn 卡住或行为怪异，而不是「日志少打一行」——先查是否短路。
4. **把 Session 事件和 Agent 事件混为一谈**：要落盘回放用 `user/message` 等；要拦截进行中的 step 用 `agent/pre-step`。挂错域，要么太晚，要么根本不持久。

---


## 这设计到底在解决什么？


把「Agent 怎么跑完一次意图」从传输层的一问一答，升级成**可组合的状态机 + 可审计的账本**：

- Turn/Step 让未知次数的工具循环成为一等公民；
- Session Log 让模型所见可重建、可 fork、可追责；
- waterfall 让观察与策略挂在契约上，而不是焊在 driver 源码里。

若用「一次 HTTP + 客户端自己 while 调工具」：每个集成方重写循环，日志格式分裂，审批/压缩/子 agent 无法共享同一套扩展点。Harness 把循环收进 spine，把真相收进日志，把钩子收成事件——又是叠出来的，不是特权内核施舍的。


三问一线：

> loop 可换（所以能用插件观察）· 日志唯一（所以模型可见必须入账）· waterfall 是契约（所以扩展比改主干便宜且安全）——全是「没有特权核心」在运行时心脏的回声。

---


## 自测与正解


### 1. Turn 和 Step 差在哪？一次用户发消息最少 / 最多几个 Step？


**正解**：Step = 一次模型请求 + 其工具调用；Turn = 零个或多个 Step，按「债务是否清零」开关。最少 **0**（pre-step 拒绝或空 enter）；最多不固定——工具还欠请求或又有 next-step 输入就会继续。


常见偏答：「一条用户消息永远对应一个 step。」


### 2. 从 `turn/start` 到 `turn/end`，关键节点有哪些？哪些是 waterfall？


**正解**：claim → `agent/pre-step` →（可选）`step/start` → 入账 user/message → 从日志投影 → `agent/request` → `llm/stream` → assistant 事件 → 工具三件套 waterfall → `step/end` → 可能下一 step → `agent/turn-stopping` → `turn/end`。


Waterfall：`agent/pre-step`、`agent/request`、`llm/stream`、`tools/pre-execute|execute|post-execute`。`agent/turn-stopping` 是 serial。


### 3. Model-visible means logged 是什么意思？为何不能「只塞进本次请求」？


**正解**：凡进模型请求的内容必须能从 Session Log 重建；`deriveMessages()` 从日志投影历史。只塞请求不入账 → fork/回放/调试全部失真；架构上新增模型可见输入通常要先扩展会话事件。这是 invariant，不是习惯。


### 4. Session / Agent / 能力事件各举一例，何时用？


**正解**：Session：`user/message`（要持久）；Agent：`agent/pre-step`（拦截进行中的 step）；能力：`tools/pre-execute`（工具策略）。选错域 = 挂错生命周期。


### 5. 观察插件为何挂 waterfall 且必须 `return next()`，而不是改 agent-loop？


**正解**：改 loop 是 fork 主干；观察应零行为改变，唯一保证是调用 `next()`；waterfall 可组合、可卸载、可 scope。策略插件才可短路；观察者短路 = 静默破坏 turn。


### 6. 本篇动手证据里，`turn=1 step=1` 证明了什么？


**正解**：用户一句话打开了 turn，并提出了第一个 step；观察者挂在文档化的 `agent/pre-step` 上且未阻断 `next()`，对话能继续。若同 turn 后续出现更高 step，则证明一次意图可含多步模型调用。


---


## 写在后面


配置树（第 2 篇）回答「装了什么」；Turn/Log（本篇）回答「跑起来时真相在哪、钩子在哪」。下次你想加能力时，默认问题应是：

- 要不要新的 **Session 事件**？（模型可见？）
- 挂 **哪个 waterfall / serial**？（观察还是决策？）
- 还是换 **Provider / Consumer**？（第 4 篇的 seam）

而不是：打开 `agent-loop` 加两行。


---


### 延伸阅读

- `docs/architecture.zh.md`（轮次流程、会话日志）
- `docs/glossary.zh.md`（turn / step / round）
- `docs/agent-lifecycle.zh.md`
- `docs/tool-execution-pipeline.zh.md`
- `docs/cookbook/extension-cookbook.zh.md`（`tools/pre-execute` 钩子示例）
- 上游：[https://github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)