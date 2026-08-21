---
title: VectorStore 抽象、幂等 upsert 与删除顺序
slug: 2026-08-09-vectorstore-upsert
description: "Personal GPT Phase 1 "
author: 墨韵
date: 2026-08-02
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3badf5c0-26f4-8069-9650-eedca2e00a92
notionSyncedAt: 2026-08-21T10:15:26.047Z
---

## 1. 矛盾


前五篇分别解决了：异步入库、要不要检、引用怎么送、混库怎么捞、租户怎么钉。收束时还有一类事故，专治「embedding 调通了、系统仍不可信」：

1. **向量逻辑散落**在聊天、worker、管理 API → 换引擎或改写入策略要改多处，租户断言也容易漏。
2. **重索引只追加不清理** → 同一 `documentId` 旧 chunk 越积越多，检索命中过期段落。
3. **写入中途失败** → 半截向量仍可被 ANN 捞到；UI 已是 `failed`，聊天却还能引用。
4. **先删 PG、后删向量** → 列表没了，幽灵知识还在。
5. **盲目** **`insertMany`** → 在部分托管向量库上，批量写入**不进 ANN 索引**，库里有文档、搜不到。

## 2. 本篇目标


给出自洽契约：

- 业务只依赖 `upsert` / `deleteByDocument` / `search`
- **幂等 upsert**：先按 `(workspaceId, documentId)` 清旧，再**逐条** **`insertOne`**
- **写入失败尽力回滚**：再删一遍，避免半截可检索
- **入库 catch**：`failed` 前再 `deleteByDocument`
- **删文档顺序**：向量 → 本地文件 → PG 行

与第 5 篇关系：隔离靠字段与 `$and`；本篇保证**写删路径不绕过抽象、不留幽灵**。不负责：跨 PG/Astra 分布式事务、生产对账任务、换引擎的完整适配层测试。


## 3. 一致性层是什么


### 3.1 总览：三个操作，两道失败闸


| 操作                 | 成功语义                      | 失败时                        |
| ------------------ | ------------------------- | -------------------------- |
| `upsert`           | 文档在向量侧的最终集合 = 本次 chunks   | 尽力 `deleteMany` 后抛错 → 宁缺毋滥 |
| `deleteByDocument` | 该租户下该文档 0 chunk           | assert 空 workspaceId       |
| `search`           | 仅租户（+$and 业务 filter）内 ANN | 见第 4–5 篇                   |


业务侧还有两道闸：


| 场景                   | 额外动作                             |
| -------------------- | -------------------------------- |
| ingest `catch`       | 再 `deleteByDocument`，再标 `failed` |
| `deleteDocument` API | 向量 → unlink 文件 → 删 PG            |


### 3.2 为什么要抽象，而不是「Astra SDK 到处用」？


SDK 细节会渗进业务：`$vector` 字段名、projection、`insertOne` vs `insertMany`、租户 assert。散落的后果是：

- 第 5 篇的隔离断言只加在一处，别处直写就漏
- 换 Milvus / pgvector 时聊天与 worker 各改一套
- 单测只能 mock 巨型 SDK，而不是三个方法

抽象的代价是多一层文件；收益是**写入策略与隔离策略有唯一实现点**。


### 3.3 为什么「先删后写」才叫幂等 upsert？


「upsert」在文档向量场景通常**不是**按 `_id` 更新一行，而是「一篇文档对应 N 个 chunk」：

- 重切块后 N 可能变
- 旧 `chunkIndex` 可能消失
- 只 insert 新的 → 旧的永远赖着

因此幂等定义为：


```plain text
upsert(doc) 之后：
  向量库中 (workspaceId, documentId) 的集合
  ≡ 本次传入的 chunks
  （不多、不少、不混旧版）
```


实现：先 `deleteMany({ workspaceId, documentId })`，再写入。重索引、失败重试都走同一条路。


### 3.4 为什么必须 `insertOne`，而不是更快的 `insertMany`？


这是踩坑后的产品约束，不是风格偏好：在所用的 Astra Data API 路径上，**`insertMany`** **写入的文档不一定进入 ANN 索引**——元数据在、向量检索却像空库。


Phase 1 选择正确性优先：逐条 `insertOne`。延迟更差、QPS 更高，但「入库成功却搜不到」比慢更伤信任。换引擎时，这是实现细节，接口不必暴露。


### 3.5 为什么删文档必须「向量 → 文件 → PG」？


用户感知的「文档没了」来自 PG 列表。若先删行：

1. UI / API 立刻 404
2. 向量仍在 → 聊天仍可能引用标题与片段
3. 文件可能还在磁盘占空间

反过来：先清向量 → 检索立刻干净；再删文件（不存在可忽略）；最后删行。短暂窗口里列表还在、向量已空——用户可能看到「文档在、问不到」，这比「幽灵知识」可接受，也可用 `status`/文案缓解；Phase 1 接受这个偏置。


### 3.6 优势


| 对比对象              | 本方案优势                              |
| ----------------- | ---------------------------------- |
| **业务直调 SDK**      | 写入/隔离/回滚一处改；可单测 mock collection    |
| **只追加重索引**        | 不会堆过期 chunk                        |
| **失败留下半截**        | 回滚 + ingest catch 双重清理，倾向「可检索集合为空」 |
| **先删 PG**         | 避免列表与检索认知分裂成幽灵引用                   |
| **insertMany 图快** | 避免「写成功、索引不生效」的假 ready              |


### 3.7 不做会怎么样


| 若取消…                    | 会发生什么                           |
| ----------------------- | ------------------------------- |
| **抽象，SDK 散落**           | 租户 filter / insert 策略漏改；换引擎成本倍增 |
| **upsert 只 insert 不删旧** | 重索引后旧段落仍进 Top-K                 |
| **中途失败不回滚**             | `failed` 文档仍被引用                 |
| **ingest catch 不删向量**   | upsert 内回滚若抛错二次失败，仍可能残留         |
| **先删 PG 再删向量**          | 幽灵知识；投诉「我都删了怎么还答」               |
| **坚持 insertMany**       | 在本栈上可能永久不可检索                    |
| **删文件失败就中止**            | PG/向量已不一致；故 unlink 失败忽略并继续删行    |


### 3.8 原理小结（数据流）


```plain text
成功入库：
  parse → split → embed → toChunkRecords
    → upsert:
         assert workspaceId
         deleteMany(旧)
         insertOne × N
         若 insert 失败 → deleteMany 再 throw
    → PG status=ready, chunkCount=N

入库失败：
  catch → deleteByDocument（尽力）
       → PG status=failed
       → rethrow（Bull 可重试；再 upsert 仍先删后写）

重索引：
  PG → processing, chunkCount=0
  再入队 → 同上 upsert（清旧写新）

删文档：
  deleteByDocument → unlink(file)? → DELETE documents
```


一句话原理：**向量侧以「文档」为一致性单位——每次成功写入后集合等于本次 chunks；任何失败路径优先清空该文档的可检索集合；用户删除时先让检索消失，再让列表消失。**


## 4. 方案取舍


| 议题    | 备选                   | 为何不选 / 本期选择                   |
| ----- | -------------------- | ----------------------------- |
| 访问方式  | 业务直调 Astra SDK       | 散落；**只依赖 VectorStore 接口**     |
| 批量写入  | `insertMany`         | 本栈 ANN 可能不索引；**逐条 insertOne** |
| 重索引   | 追加 / 按 chunkIndex 更新 | 切块数变化难；**先删后写**               |
| 失败处理  | 留下半截等对账              | 用户更痛；**尽力清空**                 |
| 删文档   | 先 PG                 | 幽灵引用；**向量 → 文件 → PG**         |
| 跨库事务  | 2PC / 外包事务管理器        | Phase 1 过重；接受尽力而为             |
| 并发重索引 | 允许多 job 同时 upsert    | 竞态难；**processing 时拒绝再入队**     |


## 5. 调用链


```plain text
ingest-worker 成功
  → upsertChunks → VectorStore.upsert

ingest-worker 失败
  → VectorStore.deleteByDocument
  → documents.status = failed

reindex API
  → status=processing, chunkCount=0
  → 新 Bull job → 再次 upsert

DELETE /api/kb/documents/:id
  → deleteByDocument
  → fs.unlink(filePath)  // 忽略缺失
  → DELETE FROM documents WHERE id AND workspace_id
```


## 6. 关键实现


### 6.1 接口：业务唯一入口


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
  keywords?: string[];
}

export interface VectorStore {
  upsert(chunks: ChunkRecord[]): Promise<void>;
  deleteByDocument(workspaceId: string, documentId: string): Promise<void>;
  search(params: VectorSearchParams): Promise<RetrievedChunk[]>;
}
```


worker 侧薄封装，禁止在 pipeline 里直接 `new DataAPIClient`：


```typescript
export async function upsertChunks(chunks: ChunkRecord[]): Promise<void> {
  if (chunks.length === 0) return;
  await createVectorStore().upsert(chunks);
}
```


### 6.2 断言


```typescript
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
```


### 6.3 幂等 upsert + 失败回滚 + search / delete


```typescript
type Collection = {
  insertOne: (doc: Record<string, unknown>) => Promise<unknown>;
  deleteMany: (
    filter: Record<string, unknown>,
  ) => Promise<{ deletedCount?: number }>;
  find: (
    filter: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => { toArray: () => Promise<Record<string, unknown>[]> };
};

export function createVectorStore(collection: Collection): VectorStore {
  return {
    async upsert(chunks) {
      if (chunks.length === 0) return;
      for (const chunk of chunks) assertChunkWorkspaceId(chunk);

      const workspaceId = chunks[0]!.workspaceId;
      const documentIds = [...new Set(chunks.map((c) => c.documentId))];

      // 重索引幂等：先清旧。注意：此处起至写完前，文档可能暂时不可检索
      for (const documentId of documentIds) {
        await collection.deleteMany({
          workspaceId: { $eq: workspaceId },
          documentId,
        });
      }

      try {
        for (const chunk of chunks) {
          // 本栈：insertMany 可能不进 ANN；正确性优先用 insertOne
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
      } catch (error) {
        // 尽力回滚：半截不如清空
        for (const documentId of documentIds) {
          await collection.deleteMany({
            workspaceId: { $eq: workspaceId },
            documentId,
          });
        }
        throw error;
      }
    },

    async deleteByDocument(workspaceId, documentId) {
      assertSearchWorkspaceId(workspaceId);
      await collection.deleteMany({
        workspaceId: { $eq: workspaceId },
        documentId,
      });
    },

    async search(params) {
      assertSearchWorkspaceId(params.workspaceId);
      const limit = params.limit ?? 5;
      const workspaceFilter = { workspaceId: { $eq: params.workspaceId } };
      const filter = params.filter
        ? { $and: [workspaceFilter, params.filter] }
        : workspaceFilter;

      const docs = await collection
        .find(filter, {
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
        })
        .toArray();

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
    },
  };
}
```


（生产实现里 search 还有第 5 篇的 `ASTRA_LEGACY_FALLBACK`；本篇聚焦写删一致性，不重复展开。）


### 6.4 入库失败：第二道清理


upsert 内部已回滚；若失败发生在 upsert 之外，或回滚过程再次异常，worker 仍要清一次：


```typescript
async function runIngest(job: {
  workspaceId: string;
  documentId: string;
  // …
}): Promise<void> {
  try {
    // parse → split → embed → toChunkRecords → upsertChunks
    await markReady(job.documentId, job.workspaceId, /* chunkCount */ 0);
  } catch (error) {
    try {
      await createVectorStore().deleteByDocument(job.workspaceId, job.documentId);
    } catch (cleanupErr) {
      // 只打日志：清理失败不能掩盖原始 ingest 错误
      console.warn("Vector cleanup after ingest failure failed", cleanupErr);
    }
    await markFailed(job.documentId, job.workspaceId, error);
    throw error;
  }
}
```


原则：**`failed`** **与「可检索」不应同时为真**（尽力保证）。


### 6.5 删文档：向量 → 文件 → PG


```typescript
import * as fs from "node:fs/promises";

export async function deleteDocument(options: {
  documentId: string;
  workspaceId: string;
  filePath: string | null;
  store: VectorStore;
  deleteRow: (id: string, workspaceId: string) => Promise<void>;
}): Promise<boolean> {
  const { documentId, workspaceId, filePath, store, deleteRow } = options;

  // 1) 先清向量，防止幽灵引用
  await store.deleteByDocument(workspaceId, documentId);

  // 2) 再删本地文件（不存在也不阻塞）
  if (filePath) {
    try {
      await fs.unlink(filePath);
    } catch {
      /* ignore */
    }
  }

  // 3) 最后删元数据行
  await deleteRow(documentId, workspaceId);
  return true;
}
```


### 6.6 重索引与并发


重索引不单独实现「补丁式更新」，而是：标 `processing`、`chunkCount=0`、入队，再走同一套 upsert（先删后写）。若已在 `processing`，拒绝新的 reindex，避免两个 job 交错 `deleteMany`/`insertOne`。


```typescript
export class ReindexBusyError extends Error {
  constructor() {
    super("Document is already reindexing");
  }
}

export async function reindexDocument(doc: {
  id: string;
  workspaceId: string;
  status: string;
  filePath: string | null;
  mimeType: string | null;
}): Promise<void> {
  if (!doc.filePath || !doc.mimeType) return;
  if (doc.status === "processing") throw new ReindexBusyError();

  await markProcessing(doc.id, doc.workspaceId); // chunkCount → 0
  await enqueueIngest({ …doc, filePath: doc.filePath, mimeType: doc.mimeType });
}
```


## 7. 日志与可观测


最小字段：


```typescript
type ConsistencyLog = {
  requestId: string; // 可用 bullJobId
  workspaceId: string;
  documentId: string;
  step: "upsert" | "upsert_rollback" | "delete_by_document" | "ingest_cleanup";
  chunkCount?: number;
  error?: string;
};
```


建议看的信号：

1. **同一 documentId 连续 upsert 两次**：向量条数 = 第二次 chunk 数（不是两次之和）
2. **ingest failed 后立刻检索**：该 `documentId` 不应再出现
3. **删文档后**：列表 404 + 检索无命中
4. **upsert 中途失败**（可用 mock `insertOne` 第 N 次 throw）：回滚后条数为 0
5. Phase 1 **未做**自动对账 job；若要上生产，应对「PG `ready` 但向量 0 / 向量在但 PG 已删」建定时扫描（诚实边界里承认现状）

## 8. 如何验证


| 条件                                               | 期望                        |
| ------------------------------------------------ | ------------------------- |
| 同一 `documentId` upsert 两次（第二次 chunk 更少）          | 库中仅剩第二次集合                 |
| mock：第 k 条 `insertOne` 抛错                        | 该文档向量条数 = 0，错误上抛          |
| ingest 在 upsert 后制造失败（或 cleanup 路径）              | `failed` 且检索无该文档          |
| `DELETE` 文档                                      | 向量无 → 文件尽量无 → PG 无；聊天不再引用 |
| 反例：先删 PG 再删向量                                    | 列表没了仍可能被检索——用于理解顺序        |
| `status=processing` 时再 reindex                   | 忙错误，不双开 job               |
| 单测：upsert payload 含 `workspaceId`；deleteMany 带租户 | 与第 5 篇契约一致                |


## 9. 诚实边界

- **回滚是尽力而为**，不是 PG + Astra 分布式事务；回滚的 `deleteMany` 也可能失败（只打 warn）。
- **先删后写**带来短暂「文档在列表里 / 重索引中、向量为空」窗口；大文件 + 逐条 insertOne 时窗口更长。
- `insertOne` 吞吐差；这是对本栈 ANN 行为的妥协，不是普适最优。
- 抽象挡不住有人绕过 `VectorStore` 直写 collection。
- 未做定期对账与「半截自动修复」；幽灵数据仍可能因进程被杀出现在极端时序。
- 删文件失败被忽略：可能留孤儿文件，需磁盘清理策略（Phase 1 未做）。
- 多 `documentId` 一次 upsert 少见；实现按 set 清理，但业务通常一次一文。

## 10. 收束

1. **矛盾**：向量工程的坑在失败与删除，不在「会不会 embed」。
2. **做法**：接口收口、先删后写、失败清空、删文档先检索后列表。
3. **优势**：幂等重索引、少幽灵、可换引擎、隔离断言有落点。
4. **不做**：insertMany 赌索引、先删 PG、假装有分布式事务。
5. **原理**：以文档为一致性单位——成功则集合等于本次写入，失败则集合优先为空。

### 回顾


| 篇                                                                     | 决策                 |
| --------------------------------------------------------------------- | ------------------ |
| [01 异步入库](https://app.notion.com/p/phase-1-01-async-ingest.md)        | 上传与 embed 解耦       |
| [02 查询路由](https://app.notion.com/p/phase-1-02-query-router.md)        | 要不要检               |
| [03 流式引用](https://app.notion.com/p/phase-1-03-streaming-citations.md) | 引用怎么送到 UI          |
| [04 双路检索](https://app.notion.com/p/phase-1-04-dual-path-retrieve.md)  | 混库怎么少被 seed 挤占     |
| [05 租户字段](https://app.notion.com/p/phase-1-05-workspace-isolation.md) | 没登录也要钉 workspaceId |
| **06 本篇**                                                             | 写删一致，不留幽灵          |