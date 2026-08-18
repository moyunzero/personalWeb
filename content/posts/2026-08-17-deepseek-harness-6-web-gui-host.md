---
title: 学 DeepSeek Harness（6）：Web GUI——浏览器是投影，Host 才是唯一写者
slug: 2026-08-17-deepseek-harness-6-web-gui-host
description: >
  DeepSeek Harness笔记 · 6

  需要：第 3 篇（Turn/Step/Session Log）、第 5 篇 D（气泡 = `(turn, step)`，`--patch` 盖不到
  Client）。本篇对照真实 JSONL 与源码，不改 `packages/`。  
author: 墨韵
date: 2026-08-17
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c0df5c0-26f4-80d1-95a8-c7d0c348b76b
notionSyncedAt: 2026-08-18T05:56:12.870Z
---

第 5 篇已经看见：助手气泡不是一片 token 一行，而是同一个 `(turn, step)` 折出来的 Context。本篇把那半句话补成**整条往返**。


打开 Web 会话右上角的 Session log，解压后对着 JSONL 数事件，再回头看输入框回车——你会碰到一个比「前端调 API」更硬的分层：

> **Host 是 Node 侧权威；Client 是浏览器侧投影。**
>
> 中间只有可序列化的 JSON：上行方法，下行事件。
>
>

---


## 两半边各守什么


`packages/host/README.zh.md` 与 `packages/client/README.zh.md` 可以收成一张表：


|      | Host（`packages/host/`）                                          | Client（`packages/client/`）                           |
| ---- | --------------------------------------------------------------- | ---------------------------------------------------- |
| 跑在哪  | Node：`ctx.apiProxy` 网关、`ctx.webServer`、静态 dist、plugin-inventory | 浏览器：shell、`connection`、`ui-conversation`、`ui-tool`…  |
| 守什么  | agents / sessions / tools / 持久化 / 权限                            | 从 `session/event` 渲染；把回车送回 Host；注册 Conversation Node |
| 怎么通信 | 传输无关的 JSON 远端方法                                                 | `client/connection` 做浏览器载体；事件经 mux 下行                |


architecture 文末两行对照：

- 添加 UI 或编辑器集成 → 驱动 `ctx.agents`，从 `session/event` 渲染
- 添加 Web Client Chat 节点 → 注册 `ConversationNodeDefinition` + keyed renderer

第 5 篇「`--patch` 加不出 Chat 行」就是这张表的推论：YAML 叠的是 Host 配置树，Chat 行是 Client bundle 里的代码贡献。


---


## 下行：一句助手回复在 JSONL 里长什么样


权威日志在 `$DSH_HOME/sessions/<workspace>/session-<id>/`（未设 `DSH_HOME` 时多为 `~/.dsh/sessions/…`）。Web 导出的往往是 `session.jsonl.zstd`，用 `unzstd` 解开。下面是当前检出里一次真实 step 的类型序列（坐标 `turn`/`step` 以你的文件为准）：


```plain text
step/start
  user/message ×N          ← 本 step 认领的输入批次（可含排队/合并）
  assistant/chunk ×M       ← 增量：block-start(reasoning) → text-delta…
  assistant/message        ← 终稿
  tool/call
  tool/result
  tool/call
  tool/result
step/end
```


全档里还能数到一对大致闭合的 `step/start` / `step/end`、大量 `assistant/chunk`、以及 `turn/start` / `turn/end`。若 start 比 end 多 1，多半是当前步还没结束，或进程没等到最后一次 `step/end`。


`assistant/chunk` 的 payload 带坐标，例如：


```json
{
  "turn": 1,
  "step": 1,
  "chunk": { "type": "block-start", "index": 0, "blockType": "reasoning" }
}
```


这就是第 5 篇 `match()` 用 ``${turn}:${step}`` 把所有 chunk 折进同一气泡的现场证据。`agent/request`、`llm/stream` 仍是 **live** waterfall，不进 Session Log——第 3 篇两栏分列，这里用文件对上了。


有两个容易混的「tool call」：


|                                        | 是什么        | 何时出现                                     |
| -------------------------------------- | ---------- | ---------------------------------------- |
| `assistant/chunk` 里的 `tool-call-delta` | 流式参数增量     | 终稿 **之前** 也可能有                           |
| 独立事件 `tool/call` / `tool/result`       | 工具**执行**落账 | 在这条 JSONL 里位于 `assistant/message` **之后** |


流式阶段模型可以先把工具参数淌出来；loop 真正跑 bash/read，是终稿入账之后的事。不要把两种事件叫成同一个「夹在 delta 中间的调用」。


---


## 上行：空闲回车永远新开一轮，忙碌默认也是排队


网关把浏览器手势收成一条 prompt RPC，再交给 Agent（`packages/host/apiproxy/src/api-proxy.ts`）：


```typescript
if (mode === 'steer') agent.steer(message)
else agent.followup(message)
```


核心 API 的语义写在 `packages/core/agent/src/runtime-types.ts`：

- **`followup`**：排进 `next-turn` 并唤醒驱动器；该项成为**自己那一轮**的普通消息。
- **`steer`**：交给最近的 step；空闲驱动器因此可以开一轮，运行中的驱动器在下一个 step 边界消费。
- **`inject`**：不唤醒，只把上下文排进 `next-step`。

`steer-unavailable` **不是**这条 prompt RPC 的总闸。它出现在**另一条**队列项动作上：对已经进 inbox 的条目做 `action.kind === 'steer'` 时，仅当该项还在 `next-turn` 且 `agent.status === 'running'` 才允许改成插话。不要把「队列升级」当成「所有 steer」。


浏览器侧谁决定 `mode`？`apply.ts` 的 `resolveSubmitMode` 只是委托。真源是 `packages/client/ui-conversation/src/client/input/submission-policy.ts`：


```typescript
resolve(
  running: boolean,
  gesture: ComposerSubmitGesture,
  steeringAvailable: boolean,
): InputSubmitMode {
  if (!running || !steeringAvailable) return 'queue'
  const preferred = this.busyEnter.getSnapshot()
  if (gesture === 'enter') return preferred
  return preferred === 'queue' ? 'steer' : 'queue'
}
```


`DEFAULT_BUSY_ENTER_BEHAVIOR = 'queue'`（`submission-settings.ts`）。三条分支用人话讲：

1. 空闲，或传输不支持 steer → 永远 `'queue'` → Host `followup` → **新开一轮**。
2. 忙碌且可 steer、普通 Enter → 用 `busyEnter` 偏好，**默认仍是 queue**：消息排队，等当前 turn 收束后再开新轮——不是插话。
3. 忙碌且可 steer、Ctrl/Cmd+Enter → **取反**（queue↔steer）。想插话：改设置，或用加速键。

文件头注释写明：direct steer 是 best-effort——窗口已关时，AgentLoop 会把这次提交变成下一次 wake 的 Queue 项。另有一个输入栏特例：空草稿加速回车会 `steerQueue()`，把整个排队队列灌进正在跑的 turn。


`followup` / `steer` 本身**还不写** `user/message`。它们只 `inbox.splice` 并可选 `wakeDriver`。真正 `session.append('user/message', …)` 发生在 loop 里：`preStep` 认领批次之后、`step/start` 之后（`packages/core/agent-loop/src/agent.ts`）。所以 JSONL 里 `user/message` 会跟在 `step/start` 后面，而不是跟在你按回车的那一毫秒。


---


## 设计取舍：为什么不更简单


### 浏览器为什么不能直接写 Session Log


Session Log 是权威事实的唯一落点，写者只能有一个（Host）。

- **Model-visible ⟺ logged**：到达模型的内容必须能从 log 重建。浏览器写 log，等于渲染侧伪造模型可见输入——绕过审批与「在做出决定的那次操作里执行」，fork / resume / 回放 / 遥测全部错位。
- **Publish state only at its commit point**：派生状态只能在拥有者的成功点发布。浏览器只有「我点了回车」，没有 turn/step 的 commit 点。
- 物理上它也没有适配器、工具管线、沙箱权威。断线后经 `/api/events.mux` 重连，靠 log **重放**重建视图——log 必须是可信源，不能是浏览器写过的副本。

浏览器是投影，不是真相。阶段 7 会把这句话扩成「权威事件流 vs 投影/查询视图」。


### Host 为什么不画 React 气泡


线上只走 lossless JSON；React 元素不是 JSON。Host 是 Node 进程，没有 DOM。client `AGENTS.md` 的红线是：web 层纯表现，「怎么画」不进 session log；Host 发事实，Client 从事实派生视图，回放时重新计算。主题、locale、槽位、HMR 都是浏览器关切，塞进 Host 等于把 Node 锁成不敢重启的渲染服务器。


### 往返到底保住了什么


```plain text
浏览器（投影）  ← session/event —  Host（唯一写者）
    回车手势  — followup / steer (JSON) →  inbox → loop 在 step 边界 append → 广播
```


「浏览器直接写 log」简单，真相立刻分裂。「Host 推像素」简单，表现锁死在权威进程里。现在的方案同时保住：可重放、可换执行世界 Provider、可换 UI——换 UI 只动 Client，换 Bash 世界只动 Host，中间契约不变。


---


## 踩坑备忘

1. 把 `llm/stream` 当成日志事件——它是 live waterfall。
2. 把 `tool-call-delta` 和 `tool/call` 当成同一条。
3. 以为忙碌回车默认插话——默认是 `queue`。
4. 把 `steer-unavailable` 当成所有 steer 的总闸——那是队列项升级。
5. 以为 `followup()` 当下就出现 `user/message`——要等 loop 认领并 `step/start`。
6. 想用 Host `-patch` 加气泡——第 5 篇 D 已经踩过。

---


## 自测与正解


### 1. Host 和 Client 各守哪半边？一次流式输出至少见到哪些 durable 事件？


**正解**：Host = 权威与真资源；Client = 投影与交互。至少 `step/start` → `assistant/chunk`* → `assistant/message` → `step/end`；有工具则在终稿后接 `tool/call` / `tool/result`。`assistant/chunk` 带 `(turn, step)`。


### 2. `followup` 和 `steer` 差在哪？空闲回车、忙碌回车（默认）各走哪条？


**正解**：`followup` 新开一轮（`next-turn`）；`steer` 插入最近 step（`next-step`）。空闲回车永远 queue→`followup`。忙碌默认也是 queue→排队后再 `followup`；插话要改 `busyEnter` 或加速键取反。常见偏答：忙碌回车默认 steer。


### 3. `steer-unavailable` 挡的是哪条路？


**正解**：对 inbox 里已有条目做「改成 steer」的动作，且要求还在 `next-turn`、agent 正在跑。不是 prompt RPC 里 `mode === 'steer'` 的前置检查。


### 4. 为什么 `assistant/message` 之后才出现 `tool/call` 事件？chunk 里会不会先有 tool-call？


**正解**：独立 `tool/call` 是执行登记，终稿入账后 loop 才跑工具。流式 `assistant/chunk` 仍可能先出现 `tool-call-delta`。两者不是同一条事件。


### 5. 忙碌时按回车，第二条消息的 `turn` 编号和第一条一样吗？


**正解**：默认 queue 时不一样——等 `turn/end` 后 `followup` 开新轮。只有 steer 才进当前 turn 的后续 step。用 JSONL 的 `turn`/`step` 字段可验证。


### 6. 浏览器为什么不能直接写 Session Log？Host 为什么不画 React 气泡？


**正解**：log 是唯一真相，必须能回放、能审计；浏览器是投影，会重连重放。表现不是 lossless JSON，也不属于权威进程。换 UI / 换执行世界才能拆开。


### 7. 「把用户消息放进 log」为什么不能在 apiproxy 收 RPC 时就 `append`？也不能在 `followup()` 里立刻写？


**正解**：apiproxy 只路由手势。`followup`/`steer` 只进 inbox 并唤醒。`user/message` 由 loop 在 `preStep` 认领、`step/start` 之后 `append`——这才是 commit 点：批次身份（新轮 / 当前 step / inject）、审批与拒绝都已经发生。早落账 = 尚未被权威处理的手势冒充事实，回放无法重建它如何被消费。


---


## 写在后面


Web GUI 半边不是「再写一个前端」，而是给权威事件流配一条可重连的投影管道。你已经能指着 JSONL 说气泡从哪来，指着回车说消息进哪一个 inbox。


---


### 延伸阅读

- `docs/architecture.zh.md`（UI / Chat 节点两行）
- `packages/host/README.zh.md`、`packages/client/README.zh.md`
- `packages/client/connection/README.md`（事件 mux）
- `packages/client/ui-conversation/src/client/input/submission-policy.ts`
- `packages/host/apiproxy/src/api-proxy.ts`（prompt `steer`/`followup`）
- `packages/core/agent/src/runtime-types.ts`、`packages/core/agent-loop/src/agent.ts`
- `docs/cookbook/adding-a-conversation-node.zh.md`
- `docs/api-gateway.md`（卡住再读）
- 上游：[https://github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)