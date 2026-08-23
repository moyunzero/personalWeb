---
title: Mem0 与 Redis 记忆：跨会话偏好怎么进 Prompt
slug: 2026-08-22-mem0-redis-prompt
description: Personal GPT Phase 3 · 系列第 4 篇 0. 零基础 每个词： 是什么 → 像什么 → 本项目怎么用 。
  Prompt（提示词）与「记忆」到底是什么 是什么 ：大模型 每一轮只能看见你塞进请求里的文字 （system +
  历史消息等）。它没有神秘的永久大脑；所谓「记住我喜欢简洁」，就是下次请求里真…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-8185-8c9f-dcef52737b04
notionSyncedAt: 2026-08-23T07:21:36.548Z
---

> **Personal GPT Phase 3 · 系列第 4 篇**

## 0. 零基础


每个词：**是什么 → 像什么 → 本项目怎么用**。


### Prompt（提示词）与「记忆」到底是什么

- **是什么**：大模型**每一轮只能看见你塞进请求里的文字**（system + 历史消息等）。它没有神秘的永久大脑；所谓「记住我喜欢简洁」，就是下次请求里真的写上这句。
- **像什么**：每次考试只准带一张纸条——纸条上没写的，等于没带。
- **本项目**：装载记忆 = 拼出【短期记忆】/【长期记忆】文本块，塞进 Chat prompt 或 Agent Supervisor 提示词。

### Redis

- **是什么**：开源的**内存键值数据库**（Key → Value），读写极快，常用来做缓存、队列、会话。数据主要在内存里，可设过期时间。
- **像什么**：冰箱门上的便利贴——方便、快，过期就撕掉；不适合当唯一的正式档案库。
- **本项目**：存「最近 N 轮对话原文 + 可选摘要」；键形如 `pgpt:short_memory:{workspaceId}:{userKey}`；默认 N=**10**，TTL=**24 小时**。

### TTL（Time To Live）

- **是什么**：这条缓存多久后自动删除。
- **像什么**：牛奶上的保质期。
- **本项目**：短期记忆默认 86400 秒；过期后等于「最近对话忘了」，长期 Mem0 不受影响。

### Mem0

- **是什么**：第三方 **AI 记忆云服务**（HTTP API）：你写入短句事实，之后按用户维度语义检索回来。
- **像什么**：云端「个人偏好笔记本」，不是完整聊天记录网盘。
- **本项目**：可选依赖；要有 `MEM0_API_KEY` 且未设 `MEM0_ENABLED=false`。我们**只写**「请记住/我喜欢…」抽出来的短句，**禁止**整段 transcript 上传。没 key 时功能空转，问答照常（fail-open）。

### userKey

- **是什么**：浏览器里生成的访客标识（常见存 localStorage，如 `pgpt:userKey`），用来区分「哪个人的记忆桶」。
- **像什么**：咖啡店会员卡号——没登录时用的临时卡。
- **本项目**：Redis / Mem0 都按 `workspaceId:userKey` 隔离。清缓存 = 换卡 = 记忆「换人」。多人共用 `anonymous` 会串味。

### thread_id（和 userKey 对比）

- **是什么**：一次 Agent/对话线程的 ID，给 **LangGraph checkpointer** 存图状态用（第 10 篇）。
- **像什么**：这一桌酒席的桌号；换桌号不等于换会员卡。
- **本项目**：新开对话可以换 `thread_id` 仍召回偏好；不要把「记忆串了」误判成 checkpointer 泄漏。

### localStorage

- **是什么**：浏览器在本机保存的小型键值存储，关标签页还在，清站点数据会没。
- **本项目**：放 `userKey`；不是服务端数据库。

### Lua 脚本（Redis）

- **是什么**：一段小程序丢进 Redis 里**原子执行**（中间不会被别的命令插队）。
- **像什么**：银行柜台「取款改余额」一次办完，避免两个人同时改乱账。
- **本项目**：追加对话轮次优先用 Lua；没有 `eval` 就退回普通 get/set。

### 启发式 / 正则抽取

- **是什么**：用固定句式规则（正则）从用户话里抠事实，**不再调用 LLM**。
- **像什么**：表格里只认「姓名：」这种栏目，自由叙述可能漏掉。
- **本项目**：匹配「请记住…」「我喜欢…」等；顺带过滤 password/api_key 等敏感样子的内容。

## 1. 开场矛盾

1. 用户说「以后请简洁、用中文」，新开 browser session（新 `thread_id`）后仍要记得——只靠 checkpointer 不够。
2. 若把全文对话塞进 Mem0，隐私面放大且噪声淹没偏好；验收要求 **D-19：只写筛选后的稳定事实**。
3. 匿名共用 `userKey=anonymous` 时，Wave G 曾出现新 thread 仍提「蓝莓松饼」——根因是 **共享 userKey 桶**，不是 checkpointer 泄漏。

## 2. 本篇目标


讲清 `loadMemoryContextBlock` / `persistTurnMemory`、Redis Lua 原子追加、Mem0 fail-open、启发式 `extractStableFactsFromUserText`。


**不负责**：登录态身份（v4）、Postgres 聊天历史、checkpointer（第 10 篇）。


---


## 3. 双桶记忆


### 3.1 总览


| 层/部件                             | 做什么               | 代价                | 代码入口 |
| -------------------------------- | ----------------- | ----------------- | ---- |
| `ShortTermRedisMemory`           | 最近 N 轮 + summary  | Redis；无 URL 空实现   | §6.1 |
| `ScopedMem0Client`               | 搜/写稳定事实           | Mem0 API；无 key 降级 | §6.2 |
| `loadMemoryContextBlock`         | 拼【短期】+【长期】块；3s 超时 | fail-open → `""`  | §6.3 |
| `persistTurnMemory`              | 写两轮 turn + 抽事实    | fail-open         | §6.3 |
| `extractStableFactsFromUserText` | 无 LLM 启发式抽取       | 漏抽/误抽             | §6.2 |


键约定（代码为准）：


```plain text
Redis: `${MEMORY_KEY_PREFIX|pgpt:short_memory}:${workspaceId}:${userKey}`
Mem0 userId: `${workspaceId}:${userKey}`
默认 N=10（SHORT_MEMORY_N）；TTL=86400s；load 超时 3000ms
```


### 3.2 为什么要这么做


成本不对称：每轮全文入 Mem0 贵且脏；只抽「请记住 / 我喜欢 / 以后请…」句式，写入面可控。


可用性：Mem0/Redis 挂了问答不能 500——一律 degrade 空块。


### 3.3 优势


| 对比对象                   | 本方案优势             |
| ---------------------- | ----------------- |
| 只靠 thread checkpointer | 跨 session 偏好可召回   |
| 全文 transcript → Mem0   | 隐私与噪声更小           |
| 记忆失败 throw             | 主链路仍可用            |
| 无超时                    | Mem0 慢请求拖死首 token |


### 3.4 不做会怎么样


| 若取消…                       | 会发生什么               |
| -------------------------- | ------------------- |
| **Mem0 作用域含 workspaceId**  | 跨租户串记忆（将来多租户时）      |
| **userKey 校验**             | 空/非法键静默污染或注入怪异 key  |
| **fail-open**              | 第三方抖动 → Chat 500    |
| **3s load 超时**             | 首包延迟无上界             |
| **禁止 password/api_key 模式** | 用户「记住我的 token」进云端记忆 |
| **整段 transcript API**      | 违背 D-19，合规面失控       |


### 3.5 原理小结


```plain text
Chat/Agent 请求前
  → loadMemoryContextBlock(workspaceId, userKey, query)
       → shortTerm.getContextBlock  ∥  mem0.searchMemories
       → race(3s, "") → 拼进 system / Supervisor prompt

请求结束后
  → persistTurnMemory(userText, assistantText)
       → appendTurn(user) + appendTurn(assistant)
       → facts = extractStableFactsFromUserText(userText)
       → facts.length ? mem0.addStableFacts : skip
```


一句话原理：**短期记最近对话，长期只记你明确要它记住的那几句；挂了就当没记忆。**


---


## 4. 方案取舍


| 方案                     | 优点              | 缺点 / 为何不选          |
| ---------------------- | --------------- | ------------------ |
| 仅前端 localStorage 偏好    | 零后端             | 不可跨设备、易丢、Agent 读不到 |
| LLM 每轮抽事实              | 召回更全            | 成本 + 幻觉事实          |
| **启发式 + Mem0 + Redis** | 可测、可关、fail-open | 句式外偏好会漏            |


---


## 5. 调用链


```plain text
POST /api/chat
  → parseUserKey（非法则跳过记忆）
  → loadMemoryContextBlock → prompt
  → … stream …
  → persistTurnMemory（after）

Agent 服务
  → 入口可注入 memoryContextBlock 到 Supervisor system
```


---


## 6. 关键实现（完整核心）


### 6.1 Redis 短期：键、N、fail-open


```typescript
const DEFAULT_PREFIX = "pgpt:short_memory";
const DEFAULT_N = 10;
const DEFAULT_TTL = 60 * 60 * 24;

export class ShortTermRedisMemory {
  memoryKey(workspaceId: string, userKey: string): string {
    return `${this.keyPrefix}:${workspaceId}:${userKey}`;
  }

  async appendTurn(workspaceId: string, userKey: string, turn: MemoryTurn): Promise<void> {
    if (!this.redis) {
      this.log("skip appendTurn: redis unavailable");
      return;
    }
    try {
      const key = this.memoryKey(workspaceId, userKey);
      if (this.redis.eval) {
        await this.redis.eval(APPEND_TURN_LUA, 1, key, turn.role, turn.content, this.n, this.ttlSeconds);
      } else {
        await this.appendTurnFallback(key, turn);
      }
    } catch (err) {
      this.log("appendTurn failed (fail-open)", err);
    }
  }

  async getContextBlock(workspaceId: string, userKey: string): Promise<string> {
    if (!this.redis) return "";
    // … 组装【短期记忆】滚动摘要 + 最近对话；单条 content ≤800；整块 ≤4000 …
  }
}
```


Lua 追加依赖 Redis `cjson`；无 `eval` 时走非原子 fallback（读写竞态可接受于 demo）。


### 6.2 Mem0：作用域、降级、事实抽取


```typescript
export function memoryUserId(workspaceId: string, userKey: string): string {
  return `${workspaceId}:${userKey}`;
}

function isMem0Enabled(): boolean {
  if (process.env.MEM0_ENABLED === "false") return false;
  return Boolean(process.env.MEM0_API_KEY?.trim());
}

export function createScopedMem0Client(raw: Mem0RawClient | null): ScopedMem0Client {
  return {
    async addStableFacts(workspaceId, userKey, facts) {
      if (!raw) return; // 降级：跳过
      try {
        await raw.add(
          facts.filter(Boolean).map((fact) => ({ role: "user", content: fact })),
          { userId: memoryUserId(workspaceId, userKey) },
        );
      } catch (err) {
        console.warn("[mem0] addStableFacts failed (degraded)", err);
      }
    },
    async searchMemories(workspaceId, userKey, query) {
      if (!raw) return [];
      try {
        const res = await raw.search(query.trim(), {
          filters: { user_id: memoryUserId(workspaceId, userKey) },
          topK: 5,
        });
        return (res.results ?? [])
          .map((r) => ({ memory: r.memory ?? "", score: r.score, id: r.id }))
          .filter((h) => h.memory.length > 0);
      } catch {
        return [];
      }
    },
  };
}

export function extractStableFactsFromUserText(userText: string): string[] {
  const patterns = [
    /请记住[：:\s]*(.+)/,
    /记住[：:\s]+(.+)/,
    /我(?:喜欢|偏好|习惯)(.+)/,
    /我希望你(?:以后|总是|在|用|以|默认|尽量|记住)(.+)/,
    /以后请(.+)/,
    /我的(?:名字|姓名)(?:是|叫)\s*(.+)/,
  ];
  for (const re of patterns) {
    const m = userText.trim().match(re);
    if (m?.[1]?.trim()) {
      const fact = m[1].trim().slice(0, 500);
      if (!/\b(password|api[_ -]?key|secret|token|sk-[a-z0-9-]+)\b/i.test(fact)) {
        return [fact];
      }
    }
  }
  return [];
}

export function formatMem0ContextBlock(hits: Mem0SearchHit[]): string {
  if (!hits.length) return "";
  return `【长期记忆】\n${hits.map((h) => `-${h.memory}`).join("\n")}`;
}
```


### 6.3 装载与持久化（含超时）


```typescript
function resolveUserKey(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > 128 || !/^[A-Za-z0-9._-]+$/.test(t)) return null;
  return t;
}

export async function loadMemoryContextBlock(
  scope: MemoryScope,
  query: string,
  deps?: MemoryDeps,
): Promise<string> {
  const userKey = resolveUserKey(scope.userKey);
  if (!userKey) return "";
  const workspaceId = scope.workspaceId.trim() || "default";
  try {
    const shortTerm = deps?.shortTerm ?? (await getShortTermRedisMemory());
    const mem0 = deps?.mem0 ?? (await getMem0Client());
    const loadPromise = Promise.all([
      shortTerm.getContextBlock(workspaceId, userKey),
      mem0.searchMemories(workspaceId, userKey, query),
    ]).then(([shortBlock, hits]) =>
      [shortBlock, formatMem0ContextBlock(hits)].filter(Boolean).join("\n\n"),
    );
    return await Promise.race([
      loadPromise,
      new Promise<string>((resolve) => setTimeout(() => resolve(""), 3_000)),
    ]);
  } catch {
    return "";
  }
}

export async function persistTurnMemory(
  scope: MemoryScope,
  userText: string,
  assistantText: string,
  deps?: MemoryDeps,
): Promise<void> {
  const userKey = resolveUserKey(scope.userKey);
  if (!userKey) return;
  const workspaceId = scope.workspaceId.trim() || "default";
  try {
    const shortTerm = deps?.shortTerm ?? (await getShortTermRedisMemory());
    const mem0 = deps?.mem0 ?? (await getMem0Client());
    await shortTerm.appendTurn(workspaceId, userKey, { role: "user", content: userText });
    if (assistantText.trim()) {
      await shortTerm.appendTurn(workspaceId, userKey, {
        role: "assistant",
        content: assistantText,
      });
    }
    const facts = extractStableFactsFromUserText(userText);
    if (facts.length) await mem0.addStableFacts(workspaceId, userKey, facts);
  } catch (err) {
    console.warn("[memory] persistTurnMemory failed (fail-open)", err);
  }
}
```


---


## 7. 日志与可观测


```typescript
type MemoryLogHints = {
  "[mem0] addStableFacts failed (degraded)"?: unknown;
  "[mem0] searchMemories failed (degraded → [])"?: unknown;
  "[short-term-redis] … fail-open"?: unknown;
  "[memory] loadMemoryContextBlock failed (fail-open)"?: unknown;
};
```


线上若「偏好从不召回」：先查 `MEM0_API_KEY` / `MEM0_ENABLED`、浏览器 `pgpt:userKey` 是否变了，再查 Mem0 异步 PENDING（代码注释 Pitfall 4：add 后勿假设即时可读）。


---


## 8. 如何验证


| 输入 / 条件                 | 期望                                   |
| ----------------------- | ------------------------------------ |
| 配置 Mem0，说「我喜欢简洁回答」      | Wave E：`E01-mem0.json` 可搜到偏好         |
| 同 userKey 新 session 问风格 | `E02-chat-recall.txt` / H-05 体现简洁/中文 |
| 无 MEM0_API_KEY          | 主链路 200；记忆块为空                        |
| mock 回归                 | memory-recall 相关用例 PASS              |


```bash
yarn test:regression:phase-3   # 含 03-memory-recall
```


---


## 9. 诚实边界

- **无登录**：`userKey` 在 localStorage；清缓存 = 换身份。
- **Mem0 可选**：未配 key 时空客户端，不算「已上线记忆产品」。
- **启发式漏抽**：不说「请记住」的偏好不会进 Mem0。
- **未测** 召回率 / 冲突合并。
- 短期键是 **userKey 不是 thread_id**——同用户多 thread 会共享短期窗（产品取舍，非 bug）。

---


## 10. 收束

1. **thread 记 Agent 图状态；userKey 记人（设备级）。**
2. **只写稳定事实，不写全文聊天。**
3. **Mem0/Redis 一律 fail-open + 装载超时。**