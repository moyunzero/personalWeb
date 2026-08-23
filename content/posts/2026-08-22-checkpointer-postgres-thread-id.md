---
title: Checkpointer：Postgres 默认、单例与 thread_id 续聊
slug: 2026-08-22-checkpointer-postgres-thread-id
description: Personal GPT Phase 3 · 系列第 10 篇 0. 零基础背景 LangGraph（一句话） 是什么
  ：用「图」（节点+边）编排 LLM 工作流的库；Agent 多步任务按边往下走。 像什么 ：流程图运行时——走到哪一步有状态。 本项目 ：Agent
  专科调度跑在 LangGraph 上；需要把中间状…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-81a8-b617-cd728a1019cb
notionSyncedAt: 2026-08-23T07:21:32.311Z
---

> **Personal GPT Phase 3 · 系列第 10 篇**

## 0. 零基础背景


### LangGraph（一句话）

- **是什么**：用「图」（节点+边）编排 LLM 工作流的库；Agent 多步任务按边往下走。
- **像什么**：流程图运行时——走到哪一步有状态。
- **本项目**：Agent 专科调度跑在 LangGraph 上；需要把中间状态存下来才能「续聊」。

### Checkpoint（检查点）

- **是什么**：图运行到某时刻的**状态快照**（消息列表、走到哪等）。
- **像什么**：游戏存档。读档 = 接着玩，不是新开一局。
- **本项目**：由 checkpointer（存档器）负责读写。

### Checkpointer / Saver

- **是什么**：真正**存放** checkpoint 的组件（内存 / 文件 / 数据库）。
- **像什么**：存档盘本身——U 盘、硬盘或云存档。

| 模式                | 存在哪          | 重启 Node 后 | 多台机器     |
| ----------------- | ------------ | --------- | -------- |
| **MemorySaver**   | 进程内存         | 丢         | 不共享      |
| **SqliteSaver**   | 本地 SQLite 文件 | 同机还在      | 不共享      |
| **PostgresSaver** | PostgreSQL 表 | 还在        | 可共享（要运维） |


### thread_id

- **是什么**：存档的**分区键**——「读哪一份存档」。前端每次请求带上同一个 id。
- **像什么**：存档槽位编号。
- **不是**：第 4 篇的 `userKey`（那是「谁的偏好记忆」）。换桌号 ≠ 换会员卡。

### 进程单例

- **是什么**：整个 Node 进程里**只创建一个** Saver 实例，所有请求共用。
- **像什么**：全公司共用一个保险柜，而不是每人每次领一把新空柜。
- **若每请求** **`new MemorySaver()`**：即使用户传了同一 `thread_id` 也会「失忆」。

### PostgreSQL（本篇语境）

- **是什么**：关系型数据库；这里用来持久化 LangGraph checkpoint 表。
- **本项目**：`AGENT_CHECKPOINTER` **默认** **`postgres`**；无 `DATABASE_URL` 时降级 MemorySaver；若显式写 `=postgres` 却无 URL 则直接报错（避免以为已经持久化）。

### Nest bootstrap / `setup()`

- **是什么**：服务启动时跑一次的初始化；PostgresSaver 需要 `setup()` 建表。
- **像什么**：开业前先摆好货架，而不是每位顾客来时再钉架子。
- **本项目**：`ensureCheckpointerSetup()` 在启动调用；请求路径里懒 setup 易竞态。

### 与 Phase 2 笔记差异（以代码为准）


Phase 2 文曾偏 memory/sqlite 叙事；**当前代码默认 postgres**。多副本 Docker 运维仍归 v4。回归用 MemorySaver **模拟**重启，不打真 PG。


### 闲聊短路


「你好」不建协作图 → **不写** checkpoint。只有真正跑 Agent 图才谈续聊。


## 1. 开场矛盾

1. 用户同一 Agent 会话续问，依赖 LangGraph checkpoint；saver 每请求 `new` 则必失忆。
2. 默认上 **Postgres** 才能跨进程/多副本恢复；`sqlite` 仅同机文件持久化；本地/单测常无 PG——必须可降级 MemorySaver。
3. `PostgresSaver.setup()` 必须在 Nest bootstrap **做一次**（Pitfall 5）；请求路径里懒 setup 易竞态。

## 2. 本篇目标


讲清 `resolveCheckpointer`、`ensureCheckpointerSetup`、`getAgentRunConfig`、三种模式与回归语义。


**不负责**：Mem0/Redis 用户记忆（第 4 篇）；闲聊短路不建协作图（无 checkpoint）。


---


## 3. Checkpointer：为什么、优势、不做会怎样、原理


### 3.1 总览


| 模式         | 触发                                             | 持久性                                                                       |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `memory`   | `AGENT_CHECKPOINTER=memory` 或无 DATABASE_URL 降级 | 进程内；重启丢                                                                   |
| `sqlite`   | `=sqlite`                                      | 本地文件（`AGENT_CHECKPOINTER_SQLITE_PATH` 或 `.data/agent-checkpoints.sqlite`） |
| `postgres` | 默认；需 `DATABASE_URL`                            | PG schema（`AGENT_CHECKPOINT_SCHEMA` 或 `public`）                           |


进程级单例：`memorySaverSingleton` / `sqliteSaverSingleton` / `postgresSaverSingleton`。


### 3.2 优势


| 对比                  | 优势          |
| ------------------- | ----------- |
| 每请求 new MemorySaver | 同 thread 可续 |
| 强制 PG 无降级           | 本地单测无法跑     |
| 请求内 setup           | 启动竞态        |


### 3.3 不做会怎么样


| 若取消…                       | 后果                  |
| -------------------------- | ------------------- |
| 单例                         | 同 thread_id 失忆      |
| 无 DATABASE_URL 降级          | 本地启动失败              |
| 显式 postgres 却无 URL 的 throw | 静默 memory，生产误以为已持久化 |
| bootstrap setup            | 表未建 → 运行期错          |
| 必填 thread_id               | LangGraph 行为未定义     |


### 3.4 数据流


```plain text
Nest bootstrap → ensureCheckpointerSetup()
  → mode memory|sqlite → no-op
  → else if DATABASE_URL → resolveCheckpointer().setup()

请求 → getAgentRunConfig(threadId)  // 空 id throw
     → build*Graph({ checkpointer: await resolveCheckpointer() })
     → stream/invoke(..., { configurable: { thread_id } })
```


---


## 4. 方案取舍


| 方案                                                  | 结论     |
| --------------------------------------------------- | ------ |
| 永远 MemorySaver                                      | 多进程不可用 |
| 永远 Postgres 无降级                                     | DX 差   |
| **默认 postgres + 无 URL 降级 memory + 显式 postgres 硬失败** | 采用     |


---


## 5. 调用链


见 §3.4；回归用同一 `MemorySaver` 两次 `compile` 模拟重启。


---


## 6. 关键实现


```typescript
function checkpointerMode(): string {
  return (process.env.AGENT_CHECKPOINTER ?? "postgres").toLowerCase();
}

export async function resolveCheckpointer(
  override?: BaseCheckpointSaver,
): Promise<BaseCheckpointSaver> {
  if (override) return override;
  const mode = checkpointerMode();
  if (mode === "memory") return getMemorySaver();
  if (mode === "sqlite") {
    // SqliteSaver.fromConnString(path) → 进程单例
    ...
  }
  if (postgresSaverSingleton) return postgresSaverSingleton;
  const url = process.env.DATABASE_URL?.trim();
  const explicitPostgres = (process.env.AGENT_CHECKPOINTER ?? "").toLowerCase() === "postgres";
  if (!url) {
    if (explicitPostgres) {
      throw new Error("DATABASE_URL required when AGENT_CHECKPOINTER=postgres");
    }
    return getMemorySaver(); // 默认值是 postgres 语义，但无库则降级
  }
  postgresSaverSingleton = await createPostgresSaver();
  return postgresSaverSingleton;
}

export async function ensureCheckpointerSetup(): Promise<void> {
  const mode = checkpointerMode();
  if (mode === "memory" || mode === "sqlite") return;
  if (!process.env.DATABASE_URL?.trim()) return;
  if (postgresSetupDone) return;
  const saver = (await resolveCheckpointer()) as PostgresSaverInstance;
  if (typeof saver.setup === "function") await saver.setup();
  postgresSetupDone = true;
}

export function getAgentRunConfig(threadId: string): AgentRunConfig {
  if (!threadId?.trim()) {
    throw new Error("configurable.thread_id 必填（MemorySaver / checkpointer 会话键）");
  }
  const raw = process.env.AGENT_RECURSION_LIMIT;
  const parsed = raw ? Number(raw) : 40;
  return {
    recursionLimit: Number.isFinite(parsed) && parsed >= 1 ? parsed : 40,
    configurable: { thread_id: threadId.trim() },
  };
}
```


---


## 7. 观测


启动日志应能区分 memory 降级 vs postgres；生产若误跑 memory，跨副本续聊会「有时忘」。


---


## 8. 如何验证


| 条件                | 期望                                 |
| ----------------- | ---------------------------------- |
| regression `#4`   | 同 MemorySaver + thread_id，「重启」后状态在 |
| 同 thread 两轮 Agent | Wave G：`G02a/b` 提暗号                |
| 新 thread_id       | 不共享图状态（勿与 Mem0 userKey 混淆）         |


```bash
yarn test:regression:phase-3   # 04-checkpointer-resume
```


Wave G 笔记：新 thread 仍提「蓝莓松饼」**不能**证明 checkpointer 泄漏——更可能是共享 `userKey` 的 Mem0（第 4 篇）。


---


## 9. 诚实边界

- **多实例 agent + 负载均衡**：依赖 Postgres 表；**agent 容器化 / 运维手册仍归 v4**。
- 回归 **不测真 Postgres**。
- 闲聊短路不建协作图 → 无 checkpoint。
- Phase 2 旧文若仍写「未做 Postgres」，以**本篇 + 源码**为准。

---


## 10. 收束

1. **默认 postgres，无库降级 memory，显式 postgres 缺 URL 则失败。**
2. **单例 + thread_id + bootstrap setup** 三位一体。
3. **用户记忆 ≠ 图 checkpoint**——排障先分清 userKey 与 thread_id。