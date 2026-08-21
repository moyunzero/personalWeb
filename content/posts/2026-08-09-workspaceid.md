---
title: workspaceId：还没登录，为什么检索必须带租户字段
slug: 2026-08-09-workspaceid
description: Personal GPT Phase 1
author: 墨韵
date: 2026-08-02
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3badf5c0-26f4-80a5-9ea9-f578faeb6fbd
notionSyncedAt: 2026-08-21T10:15:32.433Z
---

## 1. 矛盾


Phase 1 可以没有登录、没有 workspace 切换 UI，聊天与上传处处写死同一个默认 UUID。乍一看「反正只有一个租户，何必处处传 `workspaceId`？」


不传的代价会在两个时间点爆炸：

1. **以后上多租户时**：向量库里已有成吨无租户字段的 chunk → 几乎等于洗库或赌 legacy 扫全库。
2. **现在就已经可能串数据**：过滤条件只写在文档里、实现忘了 AND；或「有 filter 但历史 chunk 没字段」→ 空结果，有人再加「空就回退全库」→ 静默串库。

本篇解决**跨租户边界**：数据从入库第一天起就不可逃逸，产品 UI 可以后做。


## 2. 本篇目标


讲清 Phase 1 的租户契约：

- 常量 `DEFAULT_WORKSPACE_ID`：产品层可写死，**API 签名不可省略**
- 写入：PG `workspace_id` NOT NULL + 每条向量 chunk 带 `workspaceId`
- 检索 / 删除：缺租户 **throw**；search 永远 `$and` 租户条件
- `ASTRA_LEGACY_FALLBACK`：**默认关**；仅迁移期允许「无租户旧数据」回退

不负责：登录、成员角色、切换 UI、按用户鉴权绑定 workspace（后续里程碑）。也不负责 VectorStore 幂等与删序（第 6 篇）。


## 3. 租户隔离是什么


### 3.1 总览：两层存储，一条契约


| 层          | 做什么                                                          | 失败时                |
| ---------- | ------------------------------------------------------------ | ------------------ |
| PostgreSQL | `workspaces` 表；`documents` / `ingest_jobs` 外键 `workspace_id` | 插不进无租户行            |
| 向量库（Astra） | 每条 chunk 字段 `workspaceId`；search/delete 强制 `$eq`             | assert throw 或过滤为空 |
| 应用入口       | 聊天 / 上传 / seed 脚本传入同一 default（或显式 env）                       | 漏传则下层拒绝            |


对外观感仍是「单用户个人助手」；对数据模型已是「单租户实例上的多租户就绪」。


### 3.2 为什么 UI 还没有，契约却要先做？


向量与关系库的迁移成本不对称：

- PG 补一列 + backfill 相对可控
- ANN collection 里缺字段的历史向量，往往只能：**重 embed 重写**，或 **打开扫全库的 legacy 回退**（安全上极糟）

所以正确顺序是：


```plain text
Day 1：字段 + 断言 + 强制 filter（UI 写死 default）
Day N：登录 / 切换 workspace / 鉴权绑定
```


反过来「等 UI 做完再补字段」= 把最贵的迁移拖到产品最忙的时候。


### 3.3 为什么「有 DEFAULT 常量」≠「没隔离」？


容易混淆的两点：


| 误解                                | 实际                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| 到处 `DEFAULT_WORKSPACE_ID` = 没做多租户 | 隔离靠的是 **每次读写都带 id + filter**，不是靠「id 是否多样」                                            |
| 签名默认参数 = 可以不传                     | `getRelevantContext` / `VectorStore.search` 对空串 **throw**；default 只是调用方填值，不是「省略则查全库」 |


硬编码 default 解决的是 Phase 1 产品形态；assert + `$and` 解决的是「将来第二个 UUID 出现时，旧数据不会自动泄漏」。


### 3.4 优势


| 对比对象                     | 本方案优势                               |
| ------------------------ | ----------------------------------- |
| **等 UI 再补字段**            | 从第一天写入就带租户；避免洗向量库                   |
| **只 PG 有租户、向量没有**        | 列表隔离了，检索仍可能串；双侧同字段才闭环               |
| **约定「记得传」但不 assert**     | 漏传变成运行时全库 ANN，难复现；throw 把 bug 提前到测试 |
| **物理一个 collection 一个租户** | Phase 1 运维简单；同库靠 metadata 即可演进      |


### 3.5 不做会怎么样


| 若取消…                                 | 会发生什么                                               |
| ------------------------------------ | --------------------------------------------------- |
| **向量 chunk 不写 workspaceId**          | 日后多租户只能重灌或开 legacy 扫全库                              |
| **search 不 AND 租户**                  | 第二个 workspace 一旦有数据，ANN 跨租户命中                       |
| **缺 id 时静默用 default / 查全库**          | 调用方 bug 被掩盖；最危险的「看起来能聊」                             |
| **默认打开 ASTRA_LEGACY_FALLBACK**       | 空结果时退回无 filter → 旧无租户数据 + 他人数据一并露出                  |
| **只在业务 filter（双路）里过滤 source，忘了租户**   | 同库混租户时 Path A/B 仍可能串                                |
| **列表按 workspace 滤、删除向量不带 workspace** | 删 A 时可能误伤同 `documentId` 约定下的边界（实现上 delete 也带 `$eq`） |


### 3.6 原理小结（数据流）


```plain text
迁移 seed workspaces(DEFAULT)
  → 上传：documents.workspace_id = DEFAULT
  → Bull job payload 带 workspaceId
  → toChunkRecords / upsert：每条 assert + 写入字段
  → 聊天：getRelevantContext(..., DEFAULT)
       → search({ workspaceId, filter: PathA|B })
       → filter = { $and: [ {workspaceId:$eq}, 业务filter? ] }
       → 仅当：零命中 ∧ 无业务filter ∧ LEGACY=true → 才可无租户回退（默认关）
```


与第 4 篇的关系：双路的 `USER_CORPUS_FILTER` / `SEED_PSYCHOLOGY_FILTER` 是**业务 filter**，由 VectorStore 与租户条件 `$and`——先租户，再语料类型。


与第 6 篇的关系：所有写删应走 `VectorStore`，避免绕过断言直写 Astra。


一句话原理：**租户不是 UI 状态，是每条向量与每次 ANN 的强制谓词；default UUID 只是 Phase 1 的唯一合法取值，不是「可以不传」。**


## 4. 方案取舍


| 方案                                         | 优点                      | 缺点 / 为何不选（本期）        |
| ------------------------------------------ | ----------------------- | -------------------- |
| 等登录/UI 再加字段                                | 短期少打标                   | 历史向量迁移贵              |
| 每租户一个 Astra collection                     | 物理隔离强                   | 配置爆炸、seed 难共享        |
| **同 collection + workspaceId 字段 + assert** | Day 1 可写死 default；演进成本低 | 依赖封装不被绕过             |
| 应用层事后过滤 ANN 结果                             | 实现省事                    | Top-K 名额已被外租户占满；且费流量 |
| 默认开启 legacy fallback                       | 兼容 v0.1 旧 chunk         | 静默串库                 |


## 5. 调用链


```plain text
Init migration
  → INSERT workspaces(DEFAULT_WORKSPACE_ID)

上传 / 建文档
  → documents.workspace_id = DEFAULT
  → ingest_jobs.workspace_id = DEFAULT
  → queue payload.workspaceId

ingest-worker
  → toChunkRecords({ workspaceId })  // 空则 throw
  → VectorStore.upsert → assertChunkWorkspaceId → insert 带字段
  → deleteByDocument(workspaceId, documentId)  // 删也带租户

聊天 / 路由预检
  → getRelevantContext(query, requestId, DEFAULT)  // 空则 throw
  → store.search({ workspaceId, vector, filter? })
  → assertSearchWorkspaceId
  → $and(workspace, 业务 filter)
```


## 6. 关键实现（完整核心）


### 6.1 默认租户常量


```typescript
/** v1.0 默认 workspace；migration seed 与全链路硬编码一致 */
export const DEFAULT_WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";
```


聊天入口今日仍写死该值；将来换成「从 session 解析」时，**下游签名不用改**。


```typescript
// 聊天：产品层写死 default；检索层仍强制非空
import { DEFAULT_WORKSPACE_ID } from "./workspace";

export async function handleChatRetrieve(query: string, requestId: string) {
  return getRelevantContext(query, requestId, DEFAULT_WORKSPACE_ID);
}

export async function getRelevantContext(
  query: string,
  requestId: string,
  workspaceId: string,
) {
  if (!workspaceId?.trim()) {
    throw new Error("getRelevantContext requires workspaceId");
  }
  // … embed + VectorStore.search({ workspaceId, … })
}
```


### 6.2 PostgreSQL：表级强制


```sql
CREATE TABLE workspaces (
  id uuid PRIMARY KEY,
  slug varchar NOT NULL UNIQUE,
  name varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL
    REFERENCES workspaces(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'pending',
  chunk_count int NOT NULL DEFAULT 0,
  -- …
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ingest_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL
    REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id uuid NOT NULL
    REFERENCES documents(id) ON DELETE CASCADE,
  status varchar NOT NULL DEFAULT 'queued',
  progress int NOT NULL DEFAULT 0
  -- …
);

INSERT INTO workspaces (id, slug, name)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'default',
  'Default Workspace'
)
ON CONFLICT (slug) DO NOTHING;
```


应用侧列文档也按租户收口（Phase 1 仍是 default）：


```typescript
const qb = docRepo
  .createQueryBuilder("doc")
  .where("doc.workspace_id = :workspaceId", {
    workspaceId: DEFAULT_WORKSPACE_ID,
  });
```


### 6.3 切块打标：入库第一道闸


```typescript
export interface ChunkRecordMeta {
  workspaceId: string;
  documentId: string;
  title?: string;
  source?: string;
  category?: string;
  tags?: string[];
}

export function toChunkRecords(
  chunks: string[],
  vectors: number[][],
  meta: ChunkRecordMeta,
): ChunkRecord[] {
  if (chunks.length !== vectors.length) {
    throw new Error(`chunks/vectors length mismatch`);
  }
  if (!meta.workspaceId?.trim()) {
    throw new Error("toChunkRecords requires workspaceId");
  }
  if (!meta.documentId?.trim()) {
    throw new Error("toChunkRecords requires documentId");
  }

  return chunks.map((text, chunkIndex) => ({
    workspaceId: meta.workspaceId,
    documentId: meta.documentId,
    chunkIndex,
    text,
    vector: vectors[chunkIndex]!,
    title: meta.title,
    source: meta.source,
    category: meta.category,
    tags: meta.tags,
  }));
}
```


Bull 任务 payload 同样带 `workspaceId`，与 document 行一致，避免 worker「猜 default」。


### 6.4 VectorStore：断言 + `$and` + legacy 闸门


```typescript
export interface ChunkRecord {
  workspaceId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  vector: number[];
  title?: string;
  source?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface VectorSearchParams {
  workspaceId: string;
  vector: number[];
  limit?: number;
  similarityThreshold?: number;
  /** 与 workspaceId 以 $and 合并（如双路语料 filter） */
  filter?: Record<string, unknown>;
}

export interface RetrievedChunk {
  text: string;
  similarity: number;
  title?: string;
  source?: string;
  category?: string;
  documentId?: string;
  chunkIndex?: number;
}

export function assertSearchWorkspaceId(
  workspaceId: string | undefined,
): asserts workspaceId is string {
  if (!workspaceId?.trim()) {
    throw new Error("VectorStore.search requires workspaceId");
  }
}

export function assertChunkWorkspaceId(chunk: ChunkRecord): void {
  if (!chunk.workspaceId?.trim()) {
    throw new Error("VectorStore.upsert requires workspaceId on every chunk");
  }
}

type AstraCollection = {
  find: (
    filter: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => { toArray: () => Promise<Record<string, unknown>[]> };
  insertOne: (doc: Record<string, unknown>) => Promise<unknown>;
  deleteMany: (
    filter: Record<string, unknown>,
  ) => Promise<{ deletedCount?: number }>;
};

export async function searchWithTenant(
  collection: AstraCollection,
  params: VectorSearchParams,
): Promise<RetrievedChunk[]> {
  assertSearchWorkspaceId(params.workspaceId);

  const limit = params.limit ?? 5;
  const searchOptions = {
    sort: { $vector: params.vector },
    limit,
    includeSimilarity: true,
    projection: {
      content: 1,
      source: 1,
      category: 1,
      title: 1,
      documentId: 1,
      chunkIndex: 1,
      _id: 0,
    },
  };

  const workspaceFilter = { workspaceId: { $eq: params.workspaceId } };
  const filter = params.filter
    ? { $and: [workspaceFilter, params.filter] }
    : workspaceFilter;

  let docs = await collection.find(filter, searchOptions).toArray();

  // 仅迁移期：v0.1 无 workspaceId 的旧 chunk；默认必须关闭
  const legacyFallback = process.env.ASTRA_LEGACY_FALLBACK === "true";
  if (docs.length === 0 && !params.filter && legacyFallback) {
    docs = await collection.find({}, searchOptions).toArray();
  }

  const threshold = params.similarityThreshold ?? 0;
  return docs
    .map((doc) => ({
      text: String(doc.content ?? doc.text ?? ""),
      similarity: Number(doc.$similarity ?? 0),
      title: doc.title as string | undefined,
      source: doc.source as string | undefined,
      category: doc.category as string | undefined,
      documentId: doc.documentId as string | undefined,
      chunkIndex: doc.chunkIndex as number | undefined,
    }))
    .filter((d) => d.similarity >= threshold);
}

export async function upsertWithTenant(
  collection: AstraCollection,
  chunks: ChunkRecord[],
): Promise<void> {
  if (chunks.length === 0) return;
  for (const chunk of chunks) assertChunkWorkspaceId(chunk);

  const workspaceId = chunks[0]!.workspaceId;
  const documentIds = [...new Set(chunks.map((c) => c.documentId))];

  // 删旧也带租户，避免跨租户误删同 documentId（约定冲突时）
  for (const documentId of documentIds) {
    await collection.deleteMany({
      workspaceId: { $eq: workspaceId },
      documentId,
    });
  }

  for (const chunk of chunks) {
    await collection.insertOne({
      $vector: chunk.vector,
      content: chunk.text,
      workspaceId: chunk.workspaceId,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      title: chunk.title,
      source: chunk.source,
      category: chunk.category,
      tags: chunk.tags,
      ...chunk.metadata,
    });
  }
}
```


要点：

1. **业务 filter 不能替代租户 filter**——双路检索传入的 Path A/B 会与 `workspaceId` `$and`。
2. **legacy 仅在「无业务 filter」时触发**——带 Path filter 的双路空结果**不会**扫全库（避免「为了兼容旧数据」拆掉隔离）。
3. env 语义：`ASTRA_LEGACY_FALLBACK=true` 才开；未设置 / `false` 都视为关。

### 6.5 与双路检索的拼接


```typescript
const USER_CORPUS_FILTER = {
  $or: [
    { documentId: { $exists: true } },
    { source: { $eq: "prompt-suggestion" } },
  ],
} as const;

// 最终 Astra filter 形如：
// {
//   $and: [
//     { workspaceId: { $eq: workspaceId } },
//     USER_CORPUS_FILTER,
//   ]
// }
await store.search({
  workspaceId,
  vector,
  limit: 5,
  similarityThreshold: 0.55,
  filter: USER_CORPUS_FILTER,
});
```


租户是外圈，语料类型是内圈——两层职责不要揉进同一个 `$or`。


## 7. 日志与可观测


最小字段（检索 / 入库）：


```typescript
type TenantLog = {
  requestId: string;
  workspaceId: string;
  hitCount?: number;
  legacyFallbackUsed?: boolean; // 若实现打点：仅 LEGACY 路径为 true
};
```


调隔离时看：

1. 所有 retrieve / upsert 日志是否**总有** `workspaceId`
2. 人为换一个 UUID 搜索 → hitCount 应为 0（同库已有 default 数据时）
3. `ASTRA_LEGACY_FALLBACK` 是否在生产为关
4. 单测是否覆盖：空 id throw、filter 含 `$eq`、legacy 开关两种行为

仓库内已有针对 assert / filter / legacy 的单元测试，回归时优先跑通这一组，比只点 UI 更稳。


## 8. 如何验证


| 条件                                           | 期望                                      |
| -------------------------------------------- | --------------------------------------- |
| `assertSearchWorkspaceId("")` / `undefined`  | throw，含 `workspaceId`                   |
| upsert chunk `workspaceId: ""`               | throw                                   |
| 写入 workspace A 的 chunk，用 B 的 id search       | 不命中                                     |
| search 带业务 filter + 租户                       | find 的 filter 为 `$and: [workspace, 业务]` |
| `ASTRA_LEGACY_FALLBACK` 未设置，租户下空结果           | **只**查一次带租户的 find，不扫全库                  |
| `ASTRA_LEGACY_FALLBACK=true` 且无业务 filter、租户空 | 第二次 find `{}`（仅迁移窗接受）                   |
| 双路带 Path filter 且租户空                         | **即使** legacy=true 也不因「有 filter」而回退全库   |
| PG 插入 `documents` 无 `workspace_id`           | DB 拒绝                                   |
| 列表 / 删除 API                                  | 条件含 `workspace_id = DEFAULT`（Phase 1）   |


## 9. 边界

- **硬编码 default ≠ 多租户产品做完**：没有登录、没有成员、没有切换 UI，也没有「用户 ↔ workspace」鉴权。
- 今日任意能打到聊天 API 的客户端，用的都是同一个 DEFAULT——隔离防的是**数据模型逃逸与未来第二租户**，不是当前的终端用户权限模型。
- 若绕过 `VectorStore` 直写 Astra，断言失效；第 6 篇用抽象收口写删。
- legacy 回退是**安全债务**：迁移完旧数据后应删除开关或永久保持 false。
- Astra 侧是否为 `workspaceId` 建索引、ANN+filter 的召回特性，依赖供应商实现；阈值与空结果要用真实 collection 再标。
- seed 脚本若写入别的 `WORKSPACE_ID`，而聊天仍查 DEFAULT → 「库里有、聊天没有」——运维约定要统一。

## 10. 收束

1. **矛盾**：没登录也要把租户写进每一条向量。
2. **做法**：PG 外键 + chunk 字段 + search/delete assert 与 `$and`。
3. **优势**：UI 可后做；避免洗库；双路业务 filter 叠在租户外圈。
4. **不做**：默认 legacy、缺 id 静默全库、只隔离 PG。
5. **原理**：default UUID 是 Phase 1 的唯一取值；**强制谓词**才是隔离。

复盘时把「常量 → 打标 → assert → `$and` → legacy 默认关」串顺，比讨论「我们以后要做 SaaS」更有用。