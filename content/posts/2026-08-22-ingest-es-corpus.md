---
title: Ingest ES 双写与 Corpus 物理隔离
slug: 2026-08-22-ingest-es-corpus
description: Personal GPT Phase 3 · 系列第 2 篇 0. 零基础背景 Ingest（入库流水线） 是什么
  ：文件从「用户点了上传」到「库里能搜到」之间的后台步骤串：解析 PDF/MD → 切段 → 算向量 → 写入存储。 像什么
  ：快递分拣流水线——收件、拆箱、贴标签、入仓。 本项目 ：入库 worker（N…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-815b-b115-daa774d0b510
notionSyncedAt: 2026-08-23T07:22:06.764Z
---

> **Personal GPT Phase 3 · 系列第 2 篇** 

## 0. 零基础背景


### Ingest（入库流水线）

- **是什么**：文件从「用户点了上传」到「库里能搜到」之间的后台步骤串：解析 PDF/MD → 切段 → 算向量 → 写入存储。
- **像什么**：快递分拣流水线——收件、拆箱、贴标签、入仓。
- **本项目**：入库 worker（NestJS + BullMQ 队列）跑这条线；Web 只负责收文件和展示进度。

### Chunk（切片 / 文本块）

- **是什么**：长文档被切成的一小段文字（常几百到一千字量级），检索和引用的基本单位。
- **像什么**：一本书按页或按段撕开编号；问答时引用的是「第几段」，不是整本 PDF。
- **本项目**：切完后每一块都有 `documentId + chunkIndex`；向量库与 ES 用同一套编号对齐。

### Embedding（本篇语境）

- **是什么**：把每个 chunk 变成 2048 维向量的那一步（见第 1 篇）。
- **本项目**：写入 Astra/Milvus 前必须先 embedding；ES 存的是**原文**，不存这串数字。

### 双写（dual-write）

- **是什么**：同一份业务数据，**同时写入两套系统**，让两边都能查到同一文档。
- **像什么**：通讯录既同步到手机又同步到电脑；删人必须两边都删，否则出现「幽灵联系人」。
- **本项目**：每个 chunk → 向量库（语义搜）**并且** → Elasticsearch（关键词/BM25）。只写一边，混合检索就瘸腿。

### Elasticsearch index（索引）

- **是什么**：ES 里存放可搜索文档的「库名/表名」概念（不是 SQL 的 INDEX 关键字那么窄）。
- **像什么**：档案馆里的一排柜子，柜子名比如 `kb_user`、`kb_seed`。
- **本项目**：user corpus 与 seed corpus 用**不同 index 名**，避免演示数据和用户文档挤在一起。

### Collection（向量集合）

- **是什么**：向量库里的一个「集合/表」，专门存某一类向量文档。
- **像什么**：相册里的不同相簿。
- **本项目**：`ASTRA_DB_COLLECTION_USER` vs `_SEED`（或回落默认名）；和 ES index 一一对应到 corpus。

### Corpus（语料分区）

- **是什么**：逻辑上的「哪一扇知识门」：`user`（你上传的）与 `seed`（演示种子）。
- **像什么**：公司资料室 vs 培训样例柜——钥匙不同，默认只给用户开资料室。
- **本项目**：Chat 默认 `corpus=user`；奶茶图谱演示等才显式开 `seed`。

### workspaceId

- **是什么**：工作区/租户 ID，写在每条数据上，检索时强制过滤。
- **像什么**：公司门禁卡号——即便文件堆在同一栋楼，也只能刷开自己公司的门。
- **本项目**：UI 仍可能是单 workspace 演示，但链路从 Day 1 就带 `workspaceId`，避免以后洗数据。

### fail-closed（写路径）vs fail-open（读路径）

- **写 fail-closed**：ES bulk 失败 → ingest 任务 **failed**，文档状态不会假装 ready。
- **读 fail-open**：问答时 ES 挂了 → 只用向量继续（第 1 篇）。
- **为什么故意不对称**：读要保证「还能聊」；写要保证「库是真的齐」。

---


## 1. 开场矛盾


混合检索要 BM25，就必须有 **与向量 chunk 对齐的 ES 文档**。若只在检索时临时建索引：

1. **上传后搜不到**：ingest 只写了 Astra，ES 空，BM25 永远 miss。
2. **删库不干净**：用户删文档，向量删了 ES 还在，幽灵命中。
3. **种子与用户库混写**：psychology demo 与用户 PDF 共用一个 index，即使用 metadata filter，低分种子仍会出现在日志与 citation 竞争里（ISSUE-001）。

事后整理：**入库流水线里向量 upsert 与 ES bulk 同事务语义（失败则任务 failed）**；`user` / `seed` **物理分 collection + 分 ES index**。


## 2. 本篇目标


讲清 `resolveCorpusTargets`、`upsertChunksToEs`、删除对称性与 **fail-closed 写 / fail-open 读** 为何成对出现。


**不负责**：RRF 细节（第 1 篇）、UI CorpusToggle 交互（验收见 `FULL-FLOW-RESULT` Wave C）。


---


## 3. Corpus + 双写


### 3.1 总览


| 层/部件                   | 做什么                                 | 代价         | 备注         |
| ---------------------- | ----------------------------------- | ---------- | ---------- |
| `resolveCorpusTargets` | `user`→`kb_user` / `seed`→`kb_seed` | 多 env 名    | corpus 映射  |
| `upsertChunksToEs`     | 按 documentId 先删后 bulk index         | ES 写放大     | ES 写入      |
| `deleteDocumentFromEs` | 删库对称                                | 与 PG 状态一致  | ES 删除      |
| `ensureEsIndexes`      | IK analyzer 建索引                     | 首次慢        | 索引初始化      |
| ingest pipeline        | 向量成功后调 ES；失败 throw                  | 任务标 failed | worker 流水线 |


### 3.2 为什么要物理分库而非只靠 filter


`workspaceId` filter 挡不住 **同一 collection 内历史种子文档**——尤其迁移前 psychology 与用户文档混放时，向量 ANN 仍会捞到远离阈值的噪声。物理 `ASTRA_DB_COLLECTION_USER` vs `_SEED` + 独立 ES index，让 **默认 Chat 路径只打开 user 门**。


### 3.3 优势


| 对比对象             | 本方案优势               |
| ---------------- | ------------------- |
| 仅 metadata tag   | 无法杜绝 ANN 噪声竞争       |
| 检索时异步补 ES        | 上传与搜索不一致窗口          |
| 写 ES 也 fail-open | 会出现「向量有、BM25 无」静默劣化 |


### 3.4 不做会怎么样


| 若取消…                  | 会发生什么                  |
| --------------------- | ---------------------- |
| **ingest ES 双写**      | 混合检索 BM25 路恒空          |
| **删除同步 ES**           | 删文档后仍 BM25 命中          |
| **写失败吞掉**             | 用户以为 ready，实际半套索引      |
| **默认 corpus=user**    | seed demo 污染日常问答       |
| **user/seed 分 index** | psychology 与用户文档无法隔离验收 |


### 3.5 原理小结


```plain text
ingest: parse → split → embed → vectorStore.upsert(corpus)
                              → upsertChunksToEs(chunks, corpus)  // throw on fail
delete: vectorStore.deleteByDocument + deleteDocumentFromEs
search: hybridSearch({ corpus }) → 各自 index/collection
```


---


## 4. 方案取舍


| 方案                   | 优点   | 缺点 / 为何不选       |
| -------------------- | ---- | --------------- |
| ES 异步队列 eventual     | 上传快  | 窗口期内 hybrid 不一致 |
| 单 index + corpus 字段  | 运维简单 | ANN 仍跨语料竞争      |
| **同步双写 fail-closed** | 状态清晰 | ingest 变慢、依赖 ES |
| 检索写 ES fail-closed   | 强一致  | 与第 1 篇可用性目标冲突   |


---


## 5. 调用链


```plain text
POST /api/kb/documents → BullMQ job
  → IngestProcessor
       → upsertChunksToAstra(corpus=user)
       → upsertChunksToEs(chunks, "user")
DELETE document
  → deleteDocumentFromEs(workspaceId, docId, "user")
```


---


## 6. 关键实现


### 6.1 Corpus 映射


```typescript
export type Corpus = "user" | "seed";

export function resolveCorpusTargets(corpus: Corpus): CorpusTargets {
  const legacyCollection = process.env.ASTRA_DB_COLLECTION?.trim();

  if (corpus === "seed") {
    return {
      astraCollection: requireEnv("ASTRA_DB_COLLECTION_SEED", legacyCollection ?? "kb_seed"),
      esIndex: requireEnv("ES_INDEX_SEED", "kb_seed"),
    };
  }
  return {
    astraCollection: requireEnv("ASTRA_DB_COLLECTION_USER", legacyCollection ?? "kb_user"),
    esIndex: requireEnv("ES_INDEX_USER", "kb_user"),
  };
}
```


### 6.2 Ingest 双写（向量 + ES，ES fail-closed）


```typescript
export async function upsertChunks(chunks: ChunkRecord[], corpus: Corpus = "user"): Promise<void> {
  if (chunks.length === 0) return;
  if (shouldWriteAstra()) {
    await createAstraVectorStore({ corpus }).upsert(chunks);
  }
  if (shouldWriteMilvus()) {
    await createMilvusVectorStore({ corpus }).upsert(chunks);
  }
  await upsertChunksToEs(chunks, corpus); // throw → BullMQ failed
}

export async function upsertChunksToEs(chunks: ChunkRecord[], corpus: Corpus = "user"): Promise<void> {
  // delete-by-documentId then bulk index；bulk errors → throw（不吞）
  ...
}
```


说明：向量写走 `shouldWriteAstra/Milvus` **直连构造器**；ES 始终在向量之后，失败则整任务失败（与 hybrid **读** ES fail-open 对称相反）。


### 6.3 BM25 查询（读路径，workspace 过滤）


```typescript
export async function esBm25Search(params: EsBm25SearchParams): Promise<RetrievedChunk[]> {
  const corpus = params.corpus ?? "user";
  const index = params.index ?? resolveCorpusTargets(corpus).esIndex;
  const result = await client.search({
    index,
    query: {
      bool: {
        filter: [{ term: { workspaceId: params.workspaceId } }],
        must: [{ multi_match: { query: params.query, fields: ["title^2", "content"], analyzer: "ik_smart" } }],
      },
    },
  });
  // map hits → RetrievedChunk（similarity=0, bm25Score=_score）
}
```


---


## 7. 日志与可观测


ingest 任务状态：`ingest_jobs.status = failed` 且 error 含 `ES bulk index failed` 时，应查 ES 集群而非重试 embedding。


---


## 8. 如何验证


| 输入 / 条件              | 期望                                                       |
| -------------------- | -------------------------------------------------------- |
| 上传 PDF → ready       | ES `kb_user` 能 `term documentId` 命中（Wave B `B04-es-hit`） |
| 删除文档                 | ES 同 documentId 为空（`B07-es-empty`）                       |
| `corpus=user` hybrid | 不含 seed-only 文档（regression `#2`）                         |
| ES down 时 ingest     | 任务 failed，非 silent ready                                 |


```bash
yarn test:regression:phase-3   # corpus 隔离相关用例
# 对照 FULL-FLOW 验收记录 Wave B
```


---


## 9. 诚实边界

- **历史混库**：旧 `db_emotion` 若未迁移，ISSUE-001 仍可能出现；需运维跑 corpus 拆分迁移脚本。
- **seed Astra collection**：验收曾报 `db_emotion_seed` 缺失，seed hybrid 向量路失败。
- **IK 分词**：依赖 ES 插件；未装则建索引失败（开发环境需对应 compose 镜像）。

---


## 10. 收束

1. **BM25 与向量必须同生命周期**：上传写、删除删。
2. **写 ES 失败 = 任务失败**；读 ES 失败 = 降级向量（第 1 篇）。
3. **user/seed 物理隔离** 是默认安全边界，不是可选优化。