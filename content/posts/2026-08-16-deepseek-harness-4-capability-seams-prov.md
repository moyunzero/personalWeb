---
title: 学 DeepSeek Harness（4）：Capability Seams——换 Provider，整条产品跟着走
slug: 2026-08-16-deepseek-harness-4-capability-seams-prov
description: |-
  DeepSeek Harness笔记 · 4
  需要：第 1–3 篇（会 --patch、懂 Turn/Step、会挂 waterfall）；本篇会按官方教程加一个最小 greet 工具。
author: 墨韵
date: 2026-08-16
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3bfdf5c0-26f4-8044-b2da-e1b16460e07a
notionSyncedAt: 2026-08-17T02:48:10.877Z
---

前三篇把「没有特权核心」分别落在插件、配置树、Turn/Log 上。本篇落到包边界：

> 一项可替换能力叫 **capability seam（接缝）**。
>
> 它不是一个 TypeScript `interface`，也不是单独一个 tool 文件——而是 **三角色一起设计**。
>
>

---


## 三角色：Definition / Provider / Consumer


官方定义（glossary + architecture）可以收成一张表：


| 角色                     | 做什么                                                                       | 典型例子（shell）                           |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| **Service Definition** | 拥有 `ctx.<key>` 与词汇类型的 Cordis **Service**（抽象执行器或具体注册表；**不是**裸 `interface`） | `dsh-shell` → `ctx.shell`             |
| **Service Provider**   | 实现该接口                                                                     | `dsh-bash-local` / `dsh-bash-sandbox` |
| **Consumer**           | 注入服务并使用（常是面向模型的 tool）                                                     | `dsh-tool-bash`                       |


拆开的好处（practice 文档的 “Benefits of the split”）：

1. **可替换**：同一 Definition 下挂多个 Provider，用配置选一个；换实现时工具与调用约定不动。
2. **独立演进**：Definition 稳定后少改；Provider 各自抠性能/安全；Consumer 单独改「模型怎么看见」。
3. **依赖解耦**：Provider 与 Consumer **都只依赖 Definition**，彼此不依赖——可独立发版、测试、替换。

因此：「只写一个 tool 包」常常只完成了 **Consumer**。缺 Definition/Provider，就缺整条可替换轴——工具要么硬编码 spawn/读盘，要么绑死某个具体实现。后果是：换后端要改工具；能力无法被 terminals / LSP / ACP 等其它 Consumer 复用；也没有稳定的 `ctx.<key>` 给策略 waterfall 挂载。


注意：问题不在「一个 npm 包」——一个包可以身兼数职（如 `dsh-llm` 同时是 Definition + Consumer）。问题在「**只承担一个角色却声称做完了整条能力**」。文档原话是：adding a capability means designing all three。


对照 architecture「新行为的归属位置」：


| 目标              | 挂哪里                                 |
| --------------- | ----------------------------------- |
| 面向模型的 **tool**  | `ctx.tools.register(...)`           |
| **LLM adapter** | `ctx.llm` 上注册适配器                    |
| **shell 执行**    | 注册 `ctx.shell` 后端（再配 tool Consumer） |


别把「加 tool」和「加 shell 后端」混成一句。


---


## Execution world：为什么 fs 与 subprocess 必须共世界


`ctx.fs` 是执行世界的**存储半边**，`ctx.subprocess` 是**进程半边**。进程要打开文件——它能打开的路径，必须和 fs 工具读写的是**同一套坐标**，否则世界分裂。


坐标由 Provider 拥有，Consumer 不自己解读身份：

- `processPath(target)`：该 fs 世界里**子进程能打开**的规范绝对路径
- `fileUrl(target)`：URI 编码归 backend（宿主平台可能 ≠ 世界平台，例如远程 Linux 沙箱）
- `resolveExecutable(command)`：可执行文件解析属于与已挂载 fs **共享的同一世界**

LSP 把这话说死了：部署必须为**同一 execution world** 挂载 filesystem 与 subprocess；**split-world composition is invalid**——服务器进程由 subprocess 拉起、源码由 fs 读取，必须住在同一世界。


比喻：fs + subprocess 是坐标系与领土；`ctx.sandbox` 是海关（spawn 前包 argv）。Bash / PTY / LSP 是市民——它们不读私图，只通过政府（Provider）办事。


精确边界：`ctx.sandbox` 是**另一条** seam。容器 / 微 VM / 远程执行往往是「整条能力 seam 的兄弟实现」，不是 `ctx.sandbox` 的普通 Provider；**进程最终去哪跑**，仍主要由 subprocess + fs 的 execution world 决定。


---


## 换 Provider：Bash / PTY / LSP 为何一起走


因为它们是 **Consumer，不是 Owner**。它们注入的是 `ctx.fs` / `ctx.subprocess` /（按需）`ctx.sandbox` 的**服务**，不是某个 `*-local` 实现类。


配置树里把 Provider 行换掉（例如 local → E2B 适配器），Consumer 代码一行不动。E2B 文档写得很直白：现有 `dsh-bash-local`、`dsh-terminal-bash`、`dsh-lsp-stdio` **不需要 E2B 专用 fork**——可变工作都委托给 `ctx.fs` 与 `ctx.subprocess`，挂上两个适配器就进同一沙箱。


拆开看：

- **Bash**：语义与 deadline 在 executor；spawn 走 `ctx.subprocess`
- **PTY**：分配、环境、信号等多在 subprocess Provider；终端 Consumer 管策略与就绪
- **LSP**：进程 + 源码读取都走 Provider，故服务器与源码同世界

零 fork 的根：三角色把接口与实现焊开。换的是 Provider 那一格；Definition、策略门禁、模型工具 schema 可以不动。


---


## 与第 3 篇正交：waterfall 管「何时」，Provider 管「何处」


|      | 挂 waterfall（第 3 篇） | 换 Provider（本篇）                    |
| ---- | ------------------ | --------------------------------- |
| 问题   | 调用路径上谁决定、谁观察       | 契约背后谁执行、在哪个世界                     |
| 典型   | 审批、改写、拒绝 step、脱敏   | local → sandbox → remote；换存储/搜索后端 |
| 变更单位 | 可逆监听器              | 配置树里的 Provider 行                  |
| 依赖   | 事件契约（`next()`）     | Definition 稳定接口                   |


不能互相替代：

1. Waterfall **换不了后端**——它可以包装/否决/改写一次调用，执行者仍是当前 Provider。
2. Provider **不该内嵌横切策略**——timeout、审批、read-before-write 若焊在某个实现里，换 Provider 就把策略一起带走或弄丢。

实证：`dsh-fs-observation-policy` **不注册服务**，只挂 `fs/*` 事件门禁；换 fs Provider 不拆策略，加策略不碰 Provider。telemetry 的脱敏 waterfall「自身不带规则」，真正送出记录的仍是 Provider。工具流水线同理：waterfall 让钩子跨工具家族生效，Provider 决定背后实现。


一句话：

> **流用事件扩展，世界用 Provider 替换，两者都挂在稳定接缝上**——这才是「扩展不 fork 核心」的完整图景。

生成图 `docs/capability-seams.md` 很长：先建立三角色与共世界，再进图里追一条线（推荐 shell）。


---


## 动手：最小 greet 工具（Consumer 练习）


官方路径：`docs/user/develop/basic/tool.zh.md`。


目标不是自建整条新 seam，而是学会：**在已有** **`ctx.tools`** **上注册一个面向模型的 Consumer**。


### 插件代码


`scratch-plugin/src/greet-tool.ts`：


```typescript
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  console.log('[greet-tool] plugin loaded')

  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `Hello, ${args.name}!`
    },
  }))
}
```

- `inject = ['tools']`：等注册表就绪（第 1 篇）
- `defineTool`：校验 args；`execute` 返回规范值；`render` 变成模型可见内容
- UI 呈现意图从一开始就在设计里（`output.render`）

### Overlay（可与 turn-observer 并存）


```yaml
- insert:
    - id: turn-observer
      name: '/ABS/PATH/TO/REPO/scratch-plugin/src/turn-observer.ts'
    - id: greet-tool
      name: '/ABS/PATH/TO/REPO/scratch-plugin/src/greet-tool.ts'
```


（`pwd` 拼绝对路径；改 overlay 后重启 web——第 ④ 层不热读新文件。）


```bash
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```


### 真实证据


启动：


```plain text
[turn-observer] plugin loaded
[greet-tool] plugin loaded
dsh web: <http://127.0.0.1:3080>
```


对话：`Use the greet tool to greet Ada.`

- UI：调用 `greet`，结果 `Hello, Ada!`
- 终端：

```plain text
[turn-observer] agent/pre-step turn=1 step=1 messages=1 preview=[{"type":"text","text":"Use the greet tool to greet Ada."}]
[turn-observer] agent/pre-step turn=1 step=2 messages=0 preview=
```


`step=2` + `messages=0`：工具结果已入 Session Log 后，同一 turn 再开一步问模型；不必再从 inbox 领新的用户话——第 3 篇 Turn/Step 的现场版。


### 这次三角色怎么对号


| 角色                  | 是谁                                       |
| ------------------- | ---------------------------------------- |
| Definition（+ 注册表实现） | 已有的 **`dsh-tools`**（`ctx.tools`）         |
| Consumer            | **`greet-tool`**：注入并 `register('greet')` |
| 你没做的                | 新开一条带独立 `ctx.<key>` 的完整 seam             |


这是刻意的教学切片：先会挂 Consumer；要发「可换世界的能力」，再按 practice 教程拆 Definition / Provider / Consumer 多包。


---


## 踩坑备忘

1. **LLM adapter ≠ shell 后端**：adapter → `ctx.llm`；shell → `ctx.shell`。
2. **模型不调 tool**：提示写死工具名；确认 `[greet-tool] plugin loaded`；看权限条是否拦截。
3. **以为「一个 greet 包 = 完整 seam」**：你完成的是 tools 接缝上的 Consumer；完整新能力还要 Definition + Provider。
4. **用 waterfall「假装换世界」**：钩子改不了进程住在哪；换世界请换 Provider。

---


## 这设计到底在解决什么？


把「能力」从「某个工具文件里的实现细节」提升为**可替换的产品面坐标**：

- 三角色保证换实现不改调用约定；
- 共世界保证进程与文件同一命名空间；
- 与 waterfall 正交保证策略不焊死在某个后端上。

若每个 tool 自己 spawn、自己读盘：远程沙箱要 fork 整条工具链；策略与实现缠死；Bash/PTY/LSP 无法一次搬家。接缝把搬家变成配置树里的 Provider 行——第 2 篇的叠加术，在这里变成产品级杠杆。


---


## 自测与正解


### 1. seam 三角色是什么？为何「只写一个 tool」往往不算完整新 seam？


**正解**：Definition（`ctx.<key>` 的 Service）+ Provider（实现）+ Consumer（常用 tool）。只做 Consumer 则缺可替换轴。一个包可兼多职；缺的是**角色**，不是「包的数量」。


### 2. 加 tool / 加 LLM adapter / 加 shell 执行，分别注册到哪？


**正解**：`ctx.tools` / `ctx.llm` / `ctx.shell` 后端（再配 tool Consumer）。常见偏答：把 adapter 写成 `ctx.shell`。


### 3. 为何 fs 与 subprocess 必须共享 execution world？


**正解**：进程打开的路径与 fs 读写必须同一坐标；`processPath` / `resolveExecutable` / LSP 同世界约束；split-world 非法。


### 4. 换 execution-world Provider 时，Bash/PTY/LSP 为何一起走？


**正解**：它们是注入稳定服务的 Consumer，不绑具体实现；换 Provider 行即可，无需 per-tool fork。


### 5. waterfall 观察与换 Provider 能否互相替代？


**正解**：不能。前者管调用路径上的横切（何时/谁决定）；后者管契约背后的实现（何处/谁执行）。策略挂事件、世界换 Provider，两轴独立。


### 6. 本篇 `greet` 练习中，谁是 Definition，谁是 Consumer？`step=2` 说明什么？


**正解**：`dsh-tools` 为 Definition（注册表）；`greet-tool` 为 Consumer。`step=2 messages=0` 表明同一 turn 在工具结果入账后再次模型调用——接缝上的 tool 仍走第 3 篇的 Turn/Step 账本。


---


## 写在后面


到这里，主线四块脊柱已经齐了：

1. **Cordis**：插件、inject、可逆、waterfall
2. **叠加**：Profile / Bundle / Patch
3. **循环与账本**：Turn / Step / Session Log
4. **接缝**：Definition / Provider / Consumer + 共世界

---


### 延伸阅读

- `docs/glossary.zh.md`（capability-seam）
- `docs/architecture.zh.md`（能力 seam、新行为归属表）
- `docs/capability-seams.md`（生成图，对照用）
- `docs/user/develop/basic/tool.zh.md`
- `docs/user/develop/practice/`（能力分层）
- `docs/cookbook/adding-a-tool.md` / `adding-an-llm-adapter.md`
- 上游：[https://github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)