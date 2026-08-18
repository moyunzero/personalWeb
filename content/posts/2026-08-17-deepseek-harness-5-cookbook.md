---
title: |
  学 DeepSeek Harness（5）：Cookbook 四条路——换店、安检、改自己、对照气泡
slug: 2026-08-17-deepseek-harness-5-cookbook
description: >
  DeepSeek Harness笔记 · 5

  需要：第 1–4 篇（会 `--patch`、懂 Turn/Step、会挂 tool Consumer）。本篇 A 不需要真实 API；B/C 需要
  `DEEPSEEK_API_KEY`；D 对照源码即可。  
author: 墨韵
date: 2026-08-17
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c0df5c0-26f4-801d-a5a1-dcee6ab297d4
notionSyncedAt: 2026-08-18T05:56:16.288Z
---

第 4 篇结束时，`greet` 已经能在 Web 里喊出 `Hello, Ada!`。那只证明你会在 `ctx.tools` 上加 Consumer。Cookbook 的总表（`docs/cookbook/extension-cookbook.zh.md`）把扩展拆成几种**插件形态**：工具、钩子、UI、外部协议、以及「模型适配器走 `registerAdapter`」。本篇按官方路径亲手走四条：

- **A** 换谁吐 token（LLM adapter）
- **B** 拦一次工具调用（`tools/pre-execute`）
- **C** 让进程检查自己、再在内存里挂一个插件（`tool-cordis`）
- **D** 对照 Chat 气泡是怎么从 session 事件折出来的（Conversation Node）

全程不改 `packages/` 核心。第 ④ 层 `--patch` 不热读 overlay 文件，改完必须重启。路径一律写成 `<repo-root>`：在仓库根执行 `pwd` 再拼接。


---


## 先读总表，再动手


Cookbook 不是实现细节，是**形态索引**。工具挂 `ctx.tools`；钩子挂瀑布（例如 `tools/pre-execute`）；Web Chat 业务行要 Client 的 `ConversationNodeDefinition`；模型适配器走 `ctx.llm.registerAdapter`。表「功能→机制映射」里，产品「hooks」并不是新循环——是把外部钩子配置文件映射到已有扩展点上。


第 4 篇的 `greet` 属于工具形态。它没碰到的，正好是本篇 A 和 B：适配器，以及策略门禁。外部协议（ACP / JSON-RPC）留给选修。


四条路正交。A 换实现世界；B 在调用路径上做决定；C 改**当前进程**里的活树；D 是浏览器半边怎么把日志折成界面。不能互相替代。


---


## A：脚本适配器——货上架，和收银台指向哪家店


官方材料：`docs/user/develop/practice/llm-adapter.zh.md`、`docs/cookbook/adding-an-llm-adapter.zh.md`。真实产品参考 `packages/llm/llm-deepseek` 的 `apply()` 里那句 `registerAdapter`。


教学切片故意不打 HTTP：写一个固定吐 `StreamChunk` 的 EchoAdapter。协议义务要当真——`usage` 必须在 `finish` 之前，`finish` 之后禁止再 `yield`。出错只有两条合法路径：从 `stream()` 抛带稳定 `code` 的 `LlmError`（传输/协议），或以 `finish {kind: 'error' | 'aborted'}` 结束（提供方带内故障）。不要指望普通 `Error` 被自动转换。


`scratch-plugin/src/echo-adapter.ts`：


```typescript
import type { Context } from '@deepseek-ai/cordis'
import {
  LlmAdapter,
  type GenerateOptions,
  type LlmModelInfo,
  type LlmProviderInfo,
  type StreamChunk,
} from '@deepseek-ai/dsh-llm'

const PROVIDER = 'scratch-echo'
const MODEL = 'echo-v1'
const REPLY = 'Hello from scratch-echo (no real API).'

class EchoAdapter extends LlmAdapter {
  override providerInfo(provider: string): LlmProviderInfo {
    return { id: provider, name: 'Scratch Echo' }
  }

  override listModels(provider: string): Promise<readonly LlmModelInfo[]> {
    return Promise.resolve([{
      provider,
      id: MODEL,
      name: 'Scratch Echo',
    }])
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    console.log(`[echo-adapter] stream provider=${options.provider} model=${options.model}`)

    if (options.signal?.aborted) {
      yield { type: 'finish', reason: { kind: 'aborted' } }
      return
    }

    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: REPLY }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: REPLY } }
    yield { type: 'usage', usage: { inputTokens: 0, outputTokens: 0 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

export const name = 'echo-adapter'
export const inject = ['llm']

export function apply(ctx: Context) {
  console.log('[echo-adapter] plugin loaded')
  ctx.llm.registerAdapter([PROVIDER], new EchoAdapter())
}
```


`inject = ['llm']` 等 Definition 就绪。`registerAdapter` 的**第一个参数**是提供方**路由列表**；`GenerateOptions.provider` 选适配器，`model` 是该提供方拥有的模型 id。`listModels` 必须覆写，Web 选择器才看得到货架上的 `echo-v1`。三角色：`ctx.llm` / `dsh-llm` 是 Definition，这个插件是 **Provider**，`agent-loop` 是 Consumer——所以不必改循环。


只 `insert` 适配器等于货上架。真正发请求时，loop 看的是当前选中的 `provider`（composition 里的 `agent-default-model`，或 Web 写入 settings 的选择）。默认仍是 `deepseek-official` 时，echo 加载了也不会被调用。第二刀是 **按 id 整份替换** `agent-default-model` 的 config（patch 不是深度合并）：


```yaml
- id: agent-default-model
  config:
    provider: scratch-echo
    model: echo-v1
- insert:
    - id: echo-adapter
      name: '<repo-root>/scratch-plugin/src/echo-adapter.ts'
```


仓库根启动：


```bash
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```


启动应有 `[echo-adapter] plugin loaded`。发「你好」：


```plain text
[echo-adapter] stream provider=scratch-echo model=echo-v1
```


UI 固定回复 `Hello from scratch-echo (no real API).` 若 settings 里存过模型选择，会盖住 composition 默认值——到选择器里点 Scratch Echo / echo-v1。


验证完把 echo 从 overlay 拿掉并重启，真实 API 就回来了。`echo-adapter.ts` 可以留在练习场里，不加载就不会占路由。


---


## B：门禁——同一家店，门口加安检


Cookbook 钩子示例的形态是：允许就 `return next()`，拒绝就**不**调 `next()`，直接 `{ kind: 'deny', reason }`。`greet-tool` 一行不改——策略不焊进 tool 本体。


`scratch-plugin/src/greet-gate.ts`：


```typescript
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'

export const name = 'greet-gate'
export const inject = ['tools']

export function apply(ctx: Context) {
  console.log('[greet-gate] plugin loaded')

  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (exec.name === 'greet') {
      console.log('[greet-gate] deny greet')
      return { kind: 'deny', reason: 'scratch-plugin greet-gate: greet is blocked for this lesson.' }
    }
    return next()
  })
}
```


`insert` 一行 `greet-gate`（`name` 指向上面的文件），重启后再发：`Use the greet tool to greet Ada.`


```plain text
[greet-gate] plugin loaded
[greet-tool] plugin loaded
[greet-gate] deny greet
[turn-observer] agent/pre-step turn=1 step=2 messages=0 preview=
```


UI 是工具失败，原因里有 `greet is blocked for this lesson`，**没有** `Hello, Ada!`——`execute` 根本没跑。`step=2` 说明 Turn 没断：拒绝也是一次工具结果，loop 带着它再想一步。


后面用 `cordis_inspect_query`（Host / `Tool` / `listTools`）时，`greet` 仍在 schema 列表第一项。门禁拦的是**执行**，不是把工具从模型可见目录里摘掉。


若只想拦某次调用，换 Provider 是错轴；挂 waterfall。若想换谁生成 token，挂钩子假装换世界也是错轴。


---


## C：自指——先分清三种「插件」，再在内存里挂一个


官方叶子是 `pnpm run demo:cordis`（`examples/web-cordis/cordis.yml`，端口 3081）。当前检出里这条命令会炸：


```plain text
duplicate loader entry id: cordis-host-runner
```


原因不是操作错。`packages/bundle/web-app/cordis.patch.yml` **已经** insert 了 `cordis-host-runner`。示例 overlay 再 insert 同 id，Loader 拒绝重复。Runner（`ctx.dynamicCordisRunner`）在树上了；缺的是面向模型的 Consumer `@deepseek-ai/dsh-tool-cordis`。在现有 overlay 里只加这一行即可（不要再插 runner）：


```yaml
- insert:
    - id: tool-cordis
      name: '@deepseek-ai/dsh-tool-cordis'
```


重启后，工具名是拆开的：`cordis_inspect_list` / `cordis_inspect_query` / `cordis_inspect_self`，以及 `cordis_define` / `cordis_run`。这里最容易把三种东西叫成同一个「插件」：


| 词                | 是什么                                     |
| ---------------- | --------------------------------------- |
| Inspect Provider | 只读查询目录（Service、Tool、Slots…）             |
| Dynamic Plugin   | 本会话 `cordis_define` 的**临时包**，进程退出即没     |
| Loader 行         | overlay 里的 `greet-gate`、`turn-observer` |


第一次我让模型「列出 live plugin ids」，它老老实实调了 `cordis_inspect_list` 和 `cordis_inspect_self`：前者给出 8 个 Inspect Provider；后者 `plugins: []`。空是对的——还没有 `cordis_define`。`greet-gate` 不会出现在 `inspect_self` 的 `plugins` 里。


第二刀才打到活注册表。发：

> Call `cordis_inspect_query` with platform `host`, provider `Tool`, method `listTools`. Tell me whether a tool named `greet` is in the list.

模型回答：`greet` 在列表里，带必填 `name`。inspect 看见的是**这个进程**的 schema，不是文档里的死表。


第三刀才是「改自己这棵树」。发：

> Define a new dynamic Cordis plugin (idPrefix `hello`) whose host code only logs `[dyn-hello] plugin loaded` in `apply`. Then run it. Host-only. Plain JavaScript, no TypeScript.

`cordis_define` 只登记、不执行；`cordis_run` 才 `apply`。Host 代码必须是普通 JavaScript 函数体（无 TS / import / JSX）。UI 可能要批准一次。终端铁证：


```plain text
[cordis:hello-1] [dyn-hello] plugin loaded
```


`hello-1` / `pkg-1` 是 Host 分配的 id；前缀 `[cordis:hello-1]` 是 runner 给动态包打的标签。这和 `<repo-root>/scratch-plugin/` 里的文件不是一回事：动态包不写盘、不改 `cordis.yml`、重启即消失。overlay 行则每次启动都在。


---


## D：Chat 气泡——session 事件折成界面，YAML 补丁折不出来


A/B/C 都还在 Host 插件树里。Chat 里的用户句、工具卡片、助手气泡，是 **Client** 用 `ConversationNodeDefinition` 把 session 事件折成行。官方教程：`docs/cookbook/adding-a-conversation-node.zh.md`。


一条 Chat 业务行 = Definition（`ctx.conversationEvents.register`）+ keyed React renderer（`conversation.chat.node` 槽）。`match(event)` 只读当前事件；多事件 Context 必须携带或独立推导同一稳定业务 id；`update` 按日志 `seq` 回放必须确定。


助手气泡的 Definition 在 `packages/client/ui-conversation/src/client/conversation-nodes/assistant.ts`：


```typescript
match: (event) => {
  if (event.type === 'step/start') return { id: `${event.data.turn}:${event.data.step}`, role: 'start' }
  if (event.type === 'assistant/chunk'
    || (event.type === 'assistant/message' && isAppendSurfaceEvent(event))) {
    return { id: `${event.data.turn}:${event.data.step}`, role: 'update' }
  }
  if (event.type === 'llm/retry') {
    return { id: `${event.data.turn}:${event.data.step}`, role: 'update' }
  }
  return null
}
```


气泡是一个 `(turn, step)` 的模型步骤，不是一片 token。Definition-local id 是 ``${turn}:${step}``。组装器再按 `(kind, id)` 生成引擎 Context key（`conversationContextKey`：`${kind.length}:${kind}${id}`，长度前缀避免不同 kind 碰撞）。同一 step 的所有 `assistant/chunk` 命中同一 id → 同一 Context → `buildViewNode` 只产出一个 Chat node → 一个气泡。token 经 `updateChunk` / `PartialAccumulator` 按 `chunk.index` 追加到同一 block；`publication: 'animation-frame'` 把高频重绘合并到动画帧，气泡原地长大。新 `step/start` 才新开气泡。每片一行反而错——chunk 是 block 的 delta，不是独立消息。


用户句走另一份：`message.ts` 里 `kind: 'input-message'`，匹配 `user/message`。


**Host** **`--patch`** **加不出新的 Chat 业务行。** `--patch` 是 YAML patch list，改的是 host 配置树，不携带浏览器代码。浏览器半边另一条加载链：`dsh.client` 声明、已构建的 `./client` bundle、从 `/plugins/<id>/client.js` 拉取。普通 host-only 行没有 client 面，扫描看不见，Chat 无新增。即便点名真有 client 面的包，还要能模块解析、bundle 已构建、apply 里真正往 `conversationEvents` / `conversation.chat.node` 注册。内置 client 行住在 `packages/bundle/web-app/cordis.patch.yml`，就是这个原因。自定义业务行留给阶段 6；本篇只对照官方已有 node。


---


## 这设计到底在解决什么？


若在 `agent-loop` 里写死「调 DeepSeek、允许 greet、界面怎么画」，换提供方、加门禁、自指实验、换 Chat 行，都要改循环。Cookbook 把产品功能映射到**已有扩展点**上的监听器或注册——微内核声明由此可验证。


四条路对应四个问题：

1. **谁执行？** Provider（A）
2. **这次允不允许？** waterfall（B）
3. **要不要改当前进程的活树？** 动态包（C）；要留下就走 overlay / bundle
4. **界面如何从日志折出来？** Client Conversation Node（D）

第 4 篇的三角色在这里展开成可演示的杠杆：注册适配器不必改 loop；deny 不必改 `greet` 的 `execute`；内存插件不必改仓库；气泡不必每来一个 chunk 就 new 一行。


---


## 踩坑备忘

1. **只 insert 适配器**：货上架，收银台仍指向 `deepseek-official`。
2. **settings 盖住 composition 默认值**：Web 存过的模型选择优先；用选择器改回。
3. **`demo:cordis`** **重复 id**：以当前 bundle 为准，不要盲目照抄旧 overlay。
4. **三种「插件」混用**：`inspect_self` 的空列表不是 greet-gate 没加载。
5. **`cordis_define`** **≠ 运行**：必须再 `cordis_run`；Host 半禁止 TypeScript。
6. **`-patch`** **不热读**：改 overlay 必须重启。
7. **waterfall 忘** **`next()`**：非 greet 的工具也会被你短路。
8. **想用 YAML 加 Chat 行**：改错半边。

---


## 自测与正解


### 1. LLM 适配器挂在哪个 `ctx.*`？`registerAdapter` 的第一个参数和 `model` 各是什么？


**正解**：`ctx.llm`。第一个参数是提供方路由列表，用来选适配器实例；`model` 是该提供方拥有的模型 id，不必在生命周期里为每个模型再注册一次。常见偏答：写成 `ctx.shell`。


### 2. `usage` 和 `finish` 的顺序？`finish` 之后还能 `yield` 吗？出错的两条合法路径？


**正解**：`usage` 在 `finish` 之前；`finish` 之后禁止再 yield。传输/协议故障：抛带稳定 code 的 `LlmError`；提供方带内故障：`finish {kind: 'error' | 'aborted'}`。不要依赖普通 `Error` 被自动转换。


### 3. Echo 插件在三角色里是什么角色？为何不必改 `agent-loop`？


**正解**：Provider。Definition 是 `dsh-llm` / `ctx.llm`；Consumer 是 loop。循环只认路由名，不绑适配器类。


### 4. overlay 只 `insert` 适配器、不改 `agent-default-model`，发「你好」会走 echo 吗？


**正解**：不会自动走。注册只上架路由；请求走当前选中的 `provider`（composition 或 settings）。第二刀才是整份替换默认模型 config。


### 5. 拦 `greet` 该换 Provider 还是挂钩子？deny 之后为何还有 `step=2`？`listTools` 里为何还能看到 `greet`？


**正解**：挂钩子 `tools/pre-execute`，允许必须 `next()`。deny 也是工具结果，同一 turn 再开一步。门禁不从 schema 目录摘除工具。


### 6. `pnpm run demo:cordis` 报 `duplicate loader entry id: cordis-host-runner` 是什么意思？正确补哪一行？


**正解**：web-app bundle 已插入该 id，示例 overlay 再 insert 冲突。当前检出只再挂 `@deepseek-ai/dsh-tool-cordis`。以当前组合为准，不以旧 README 为绝对命令。


### 7. `cordis_inspect_list`、`cordis_inspect_self` 的 `plugins: []`、Loader 里的 `greet-gate`，三者分别是什么？动态包和 overlay 插件差在哪？


**正解**：list = Inspect Provider 目录；self 的 plugins = 本会话动态包（未 define 则为空）；greet-gate = Loader 行。动态包在内存、重启消失；overlay 行每次启动都在。`[cordis:hello-1] [dyn-hello] plugin loaded` 证明 `define`+`run` 已 `apply`。


### 8. 流式 `assistant/chunk` 为何进同一个气泡？id 怎么拼？新气泡何时出现？


**正解**：气泡是一个 `(turn, step)`，id 为 ``${turn}:${step}``。同 step 的 chunk 都是 update，按 index 追加到同一 block。新 `step/start` 才新开节点。chunk 是 delta，不是独立消息。


### 9. Host `-patch` 为什么加不出新的 Chat 业务行？


**正解**：Chat 行是浏览器半边的 Definition + keyed renderer，要进 `dsh.client` 加载链和已构建的 client bundle。`--patch` 只叠 host 配置树，不携带浏览器代码。


---


## 写在后面


主线 0→5 到这里收束。脊柱可以收成一句：

> 没有特权核心：插件可逆、配置可叠、循环有账本、能力有接缝；新产品行为默认挂扩展点，而不是打开 `agent-loop`。

本篇的体感是「替换与新增同等重要」：A 是换店，B 是安检，C 是给这间店临时加一个只存在于今晚的伙计，D 是橱窗怎么从流水账摆出来——橱窗在另一栋楼（Client bundle）里。


---


### 延伸阅读

- `docs/cookbook/extension-cookbook.zh.md`
- `docs/cookbook/adding-an-llm-adapter.zh.md`
- `docs/user/develop/practice/llm-adapter.zh.md`
- `docs/cookbook/adding-a-tool.md`（execution policy：`pre-execute` / `guard` / `execute` / `post-execute` / `result`）
- `docs/cookbook/adding-a-conversation-node.zh.md`
- `packages/llm/llm-deepseek/`（真实 adapter）
- `packages/extensions/tool-cordis/README.zh.md`
- `examples/web-cordis/`（叶子 overlay；以当前 web-app bundle 核对是否重复 id）
- `packages/client/ui-conversation/src/client/conversation-nodes/assistant.ts`
- 上游：[https://github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)