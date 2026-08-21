---
title: Checkpointer 与 thread_id：会话状态为何必须是进程单例
slug: 2026-08-20-checkpointer-thread-id
description: Personal GPT Phase 2 · 系列第 11 篇 0. 背景 Checkpoint（检查点）在聊天图里是什么？
  LangGraph
  把一次图运行的中间状态（消息列表等）存成可恢复快照。下次同一会话再来，用同一个键取出快照，等于「接着聊」，而不是每次从空白世界开始。这个键就是 。
  MemorySaver v…
author: 墨韵
date: 2026-08-20
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c3df5c0-26f4-8162-9d2b-f4a521c31f0d
notionSyncedAt: 2026-08-21T10:13:40.350Z
---

> **Personal GPT Phase 2 · 系列第 11 篇** 

## 0. 背景


**Checkpoint（检查点）在聊天图里是什么？**


LangGraph 把一次图运行的中间状态（消息列表等）存成可恢复快照。下次同一会话再来，用同一个键取出快照，等于「接着聊」，而不是每次从空白世界开始。这个键就是 **`thread_id`**。


**MemorySaver vs SqliteSaver（白话）**


- **MemorySaver**：状态放在**当前 Node 进程内存**里——重启进程就丢。


- **SqliteSaver**：状态写到本地 SQLite 文件——同机重启还可续，仍不是多机共享的「正式会话库」。


**为什么强调「进程单例」？**


若每个 HTTP 请求 `new MemorySaver()`，等于每次换了一个新的空白大脑：即使用户传了同一个 `thread_id`，也读不到上一轮写入的 checkpoint。


**生产热路径脚注**：浏览器 BFF 进来后，真正编译的是 `buildSupervisorGraph`（其内再决定 Sequential 或开放 Supervisor）。测试里另有外层 `buildAgentGraph`；**闲聊短路根本不建协作图**，也就碰不到 checkpointer。本篇讨论的「会话续聊」只对走了协作图的请求成立。


---


## 1. 开场矛盾


Agent 续聊刚接上时，踩过两类坑：

1. **每请求新建 MemorySaver**：日志里 `thread_id` 明明一样，模型却「失忆」。根因是 checkpointer 实例变了，键空间等价于换库。
2. **thread_id 未校验**：任意字符串（含路径字符、超长垃圾）进 configurable，后续落盘 / 日志 / 轨迹文件名都变危险面。

矛盾：**会话记忆看起来是「产品功能」，实现上却是「同一个 saver 实例 + 合法 thread_id」的组合约束。**


## 2. 本篇目标


讲清 `resolveCheckpointer` 进程单例、`AGENT_CHECKPOINTER`（`memory` | `sqlite`）、`getAgentRunConfig` 必填 `thread_id`、以及 `parseAgentChatBody` 里的 `SAFE_THREAD_ID`。


## 3. Checkpointer


### 3.1 总览


| 层/部件                   | 做什么                      | 代价             | 代码入口 |
| ---------------------- | ------------------------ | -------------- | ---- |
| `memorySaverSingleton` | 默认内存会话                   | 重启丢失           | §6.1 |
| `sqliteSaverSingleton` | 可选文件持久化                  | 单机文件锁 / 路径     | §6.1 |
| `getAgentRunConfig`    | `configurable.thread_id` | 空 id 直接 throw  | §6.2 |
| `SAFE_THREAD_ID`       | 校验客户端传入 id               | 非法 → 400       | §6.3 |
| 缺省 `randomUUID()`      | 未传 thread 时生成            | 无法跨请求续聊除非客户端存下 | §6.3 |


### 3.2 为什么要这么做


LangGraph 的 checkpointer API 语义是：**saver 实例持有存储；thread_id 是存储内的分区键。**


换 saver 实例 ≠ 换一把钥匙开同一把锁，而是换了一整栋楼。


产品侧「同一对话气泡继续问」依赖前端稳定传 `thread_id`；服务端必须保证：

1. 编译图时挂上**同一个** saver；
2. 每次 invoke/stream 带上**同一个** `thread_id`；
3. id 本身安全、长度有界。

### 3.3 优势


| 对比对象                      | 本方案优势                                 |
| ------------------------- | ------------------------------------- |
| 每请求 `new MemorySaver()`   | 跨请求真正可续聊                              |
| 只用前端 messages 回放当「记忆」     | 图内部工具状态 / 中断恢复仍靠 checkpoint；且 body 更大 |
| 一上来 Postgres checkpointer | Phase 2 过重；路线图留给后续                    |
| 不校验 thread_id             | 路径注入 / 日志污染风险                         |


### 3.4 不做会怎么样


| 若取消…                | 会发生什么                     |
| ------------------- | ------------------------- |
| 取消进程单例              | 同 thread_id 仍失忆           |
| 取消必填 thread_id      | LangGraph 行为未定义 / 抛错难读    |
| 取消 `SAFE_THREAD_ID` | `../`、超长串进入配置与衍生文件名       |
| 默认改 sqlite 却不备路径    | 权限 / 只读文件系统上启动失败          |
| 多副本各持 MemorySaver   | 负载均衡下「有时记得有时忘」（MVP 单进程假设） |


### 3.5 原理小结


```plain text
parseAgentChatBody
  → thread_id 合法？否则 400；空则 uuid
  → getAgentRunConfig(threadId) → { configurable: { thread_id } }
  → buildAgentGraph → resolveCheckpointer()
       → AGENT_CHECKPOINTER=sqlite ? SqliteSaver 单例
       → else MemorySaver 单例
  → graph.stream(..., runConfig)
```


一句话原理：**记忆在 saver 里，不在字符串 thread_id 里；单例让 id 找得到上一份快照。**


## 4. 方案取舍


| 方案                                 | 优点     | 缺点 / 为何不选         |
| ---------------------------------- | ------ | ----------------- |
| 无 checkpointer，每次重放全量 messages     | 实现简单   | body 膨胀；图状态无法原生恢复 |
| 每请求新 MemorySaver                   | 看似「干净」 | **续聊必挂**          |
| Postgres / Redis checkpointer      | 多机一致   | v3/v4 债务；本阶段未做    |
| **进程单例 Memory 默认 + 可选 Sqlite（采用）** | 演示续聊够用 | 多实例不共享；Memory 重启丢 |


## 5. 调用链


```plain text
POST /agent/chat { messages, thread_id? }
  → parseAgentChatBody（SAFE_THREAD_ID）
  → getAgentRunConfig(threadId)
  → resolveCheckpointer（单例）
  → 编译/复用图并 stream
  → 同 thread_id 下一轮 → 读到上一 checkpoint
```


## 6. 关键实现（完整核心）


### 6.1 进程单例 resolveCheckpointer


```typescript
import { MemorySaver } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";

/** 进程级 MemorySaver，保证同进程 thread_id 跨请求可续聊 */
let memorySaverSingleton: MemorySaver | null = null;
/** 进程级 SqliteSaver（若启用） */
let sqliteSaverSingleton: BaseCheckpointSaver | null = null;

async function resolveCheckpointer(
  override?: BaseCheckpointSaver,
): Promise<BaseCheckpointSaver> {
  if (override) {
    return override; // 单测可注入 mock，不走单例
  }
  const mode = (process.env.AGENT_CHECKPOINTER ?? "memory").toLowerCase(); // memory | sqlite
  if (mode === "sqlite") {
    if (sqliteSaverSingleton) {
      return sqliteSaverSingleton; // 已初始化则复用，保证同进程同 saver
    }
    const { mkdirSync } = await import("node:fs");
    const { dirname, resolve } = await import("node:path");
    const { SqliteSaver } = await import("@langchain/langgraph-checkpoint-sqlite");
    const dbPath =
      process.env.AGENT_CHECKPOINTER_SQLITE_PATH?.trim() ||
      resolve(process.cwd(), ".data/agent-checkpoints.sqlite");
    mkdirSync(dirname(dbPath), { recursive: true }); // 首次写库前确保目录存在
    // SqliteSaver 与当前 BaseCheckpointSaver 泛型略有漂移；运行时可用
    sqliteSaverSingleton = SqliteSaver.fromConnString(dbPath) as unknown as BaseCheckpointSaver;
    return sqliteSaverSingleton;
  }
  // 默认 memory：懒创建单例，跨请求共享同一内存键空间
  if (!memorySaverSingleton) {
    memorySaverSingleton = new MemorySaver();
  }
  return memorySaverSingleton;
}
```


环境变量：


| 变量                               | 默认                               | 含义                  |
| -------------------------------- | -------------------------------- | ------------------- |
| `AGENT_CHECKPOINTER`             | `memory`                         | `memory` | `sqlite` |
| `AGENT_CHECKPOINTER_SQLITE_PATH` | `.data/agent-checkpoints.sqlite` | sqlite 文件路径         |


### 6.2 运行配置：thread_id 必填


```typescript
const DEFAULT_RECURSION_LIMIT = 40;

export type AgentRunConfig = {
  recursionLimit: number;
  configurable: { thread_id: string };
};

export function getAgentRunConfig(threadId: string): AgentRunConfig {
  if (!threadId?.trim()) {
    throw new Error("configurable.thread_id 必填（MemorySaver / checkpointer 会话键）");
  }
  const raw = process.env.AGENT_RECURSION_LIMIT;
  const parsed = raw ? Number(raw) : DEFAULT_RECURSION_LIMIT;
  const recursionLimit = Number.isFinite(parsed) && parsed >= 1 ? parsed : DEFAULT_RECURSION_LIMIT; // 防图无限递归
  return {
    recursionLimit,
    configurable: { thread_id: threadId.trim() }, // LangGraph 用此键读写 checkpoint
  };
}
```


### 6.3 Body 校验与 SAFE_THREAD_ID


```typescript
import { randomUUID } from "node:crypto";
import { z } from "zod";

export class InvalidAgentBodyError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidAgentBodyError";
  }
}

const AgentUiMessageSchema = z
  .object({
    role: z.string().min(1),
  })
  .passthrough();

const AgentChatBodySchema = z.object({
  messages: z.array(AgentUiMessageSchema),
  thread_id: z.string().optional().nullable(), // 可选：前端不传则服务端生成 UUID
  workspaceId: z.string().optional().nullable(),
});

// 白名单字符 + 长度上限，避免 ../ 等进入 configurable / 日志 / 文件名
const SAFE_THREAD_ID = /^[A-Za-z0-9_.:-]{1,128}$/;

/** 校验 POST /agent/chat body；非法抛 InvalidAgentBodyError（→ 400） */
export function parseAgentChatBody(body: unknown): {
  messages: unknown[];
  threadId: string;
  workspaceId: string;
} {
  const result = AgentChatBodySchema.safeParse(body ?? {});
  if (!result.success) {
    throw new InvalidAgentBodyError("Invalid body: messages must be an array of message objects"); // zod 结构校验失败 → 400
  }

  const { messages, thread_id, workspaceId } = result.data;
  const trimmedThread = typeof thread_id === "string" ? thread_id.trim() : "";
  if (trimmedThread && !SAFE_THREAD_ID.test(trimmedThread)) {
    throw new InvalidAgentBodyError(
      "Invalid body: thread_id must be a safe id (letters, digits, _.:-; max 128)",
    ); // 传了但非法 → 400，不 silently 替换
  }
  const threadRaw = trimmedThread || randomUUID(); // 空则新会话；客户端须存下 id 才能续聊
  const workspaceRaw =
    typeof workspaceId === "string" && workspaceId.trim() ? workspaceId.trim() : "default";

  return {
    messages,
    threadId: threadRaw,
    workspaceId: workspaceRaw, // 实现里还会 resolveWorkspaceId
  };
}
```


允许字符：`A–Z a–z 0–9 _ . : -`，最长 128。空则服务器生成 UUID——**客户端若不回传，下一轮无法续同一线程。**


## 7. 日志与可观测


```typescript
/** 启动/调试时可打一条，确认本轮用的是哪种 saver 与 thread 键 */
type CheckpointObs = {
  threadId: string;
  checkpointer: "memory" | "sqlite" | "override";
  recursionLimit: number;
};
```


单测：`AGENT_CHECKPOINTER=sqlite` 时图可 compile；body 非法 `thread_id` → 抛错。Phase 2 **无**「checkpoint 命中率」指标。


## 8. 如何验证


| 输入 / 条件                            | 期望                       |
| ---------------------------------- | ------------------------ |
| 同 `thread_id` 连续两轮（Memory 单例）      | 第二轮能引用第一轮上下文（同进程）        |
| 每请求 new MemorySaver（反例）            | 续聊失败——正是本篇要避免的           |
| `thread_id: "../etc/passwd"`       | 400                      |
| `thread_id` 129 字符                 | 400                      |
| 不传 `thread_id`                     | 200，但新 UUID；前端需保存才能续     |
| `AGENT_CHECKPOINTER=sqlite` + 路径可写 | **重启进程**后（同机、同 DB 文件）可再读 |
| 重启进程 + memory 模式                   | 记忆丢失（预期）                 |


## 9. 诚实边界

- Memory 模式：**进程重启即失忆**；演示续聊请保持 agent-service 不挂。
- Sqlite 仍是**单机文件**，不是多租户会话服务；无备份 / 无迁移工具链。
- 多副本部署时 MemorySaver **不共享**——水平扩展前必须换集中式 checkpointer（路线图）。
- `SAFE_THREAD_ID` 防的是危险字符与超长，不是权限模型（任何知道 id 的人在 MVP 里仍可能撞车）。
- Postgres checkpointer：**未做**。

## 10. 收束

1. Checkpoint 让图状态可恢复；`thread_id` 只是分区键。
2. Saver 必须进程单例，否则同 id 也失忆。
3. 默认 Memory 够演示；Sqlite 是同机持久化可选项。
4. Body 层校验 id，避免垃圾与路径字符进入配置。
5. 多机一致会话属于后续版本，不在 v2 关账范围。