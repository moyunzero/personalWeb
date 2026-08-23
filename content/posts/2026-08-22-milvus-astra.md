---
title: Milvus 向量后端：与 Astra 同接口、默认可关
slug: 2026-08-22-milvus-astra
description: Personal GPT Phase 3 · 系列第 9 篇 0. 零基础背景 向量库再强调一次 是什么
  ：存「文字→向量」并支持「找最像的几段」的专用存储。 本项目默认 ： DataStax Astra DB （云托管，开通即用）。 可选 ： Milvus
  （开源向量数据库，常自建 / Docker，适合数据不出内网…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-8172-b2ca-eb757ce7a034
notionSyncedAt: 2026-08-23T07:21:27.289Z
---

> **Personal GPT Phase 3 · 系列第 9 篇**

---


## 0. 零基础背景


### 向量库再强调一次

- **是什么**：存「文字→向量」并支持「找最像的几段」的专用存储。
- **本项目默认**：**DataStax Astra DB**（云托管，开通即用）。
- **可选**：**Milvus**（开源向量数据库，常自建 / Docker，适合数据不出内网）。

### Milvus

- **是什么**：LF AI 基金会下的开源向量数据库，面向海量 embedding 检索。
- **像什么**：自建的「向量版 ES」——你运维，你掌控数据位置。
- **本项目**：`VECTOR_BACKEND=milvus` 时 hybrid / 检索读路径走它；默认不设则仍是 Astra。

### Astra DB

- **是什么**：DataStax 基于 Cassandra/Astra 的云数据库服务，本项目用其向量能力。
- **像什么**：租云端相册，不用自己修硬盘。
- **本项目**：关账与演示主路径；验收 **H04 Milvus 删除 SKIP**。

### VectorStore 接口

- **是什么**：代码里的统一抽象：`search` / `upsert` / `deleteByDocument`，不让业务直接绑死某个 SDK。
- **像什么**：统一插头——换电器不用换插座标准。
- **本项目**：`createVectorStoreFromEnv` 给**读路径**；ingest **写路径**用 `shouldWrite*` + 直连构造器。

### Collection

- **是什么**：向量库中的一个集合（类似一张表）。
- **本项目**：user / seed 分集合，避免演示数据污染用户库。

### Cosine 与分数归一

- **是什么**：用夹角衡量向量相似度。不同 SDK 原始分范围可能不同（如 -1~1）。
- **本项目**：Milvus 分映射到 0~1，好和 Astra、Agent 门槛（如 0.60）对齐。

### IVF_FLAT（知道名字即可）

- **是什么**：Milvus 的一种向量索引：先把向量分桶（IVF），桶内再暴力比（FLAT）。
- **像什么**：先按区县找人，再在区县里细比——不是全市逐人扫描。
- **本项目**：建 collection 时创建该索引；`nlist=128` 等参数属调优细节。

### `MILVUS_DUAL_WRITE`

- **是什么**：主库仍是 Astra 时，额外再写一份到 Milvus。
- **像什么**：搬家时新旧仓库暂时都留一份。
- **本项目**：默认勿开；多写 = 多延迟 + 一致性窗口。

### 口径


「代码支持 Milvus」≠「关账已经 live 测过删库」。H04 **SKIP**，生产叙事仍是 Astra。


---


## 1. 开场矛盾


Phase 3 要「可演示混合检索」，默认向量库仍是 **Astra**（云端、零运维）。同时产品路线要求可选 **Milvus**（私有化 / 本地 compose）：

1. 若 Chat / ingest / Agent 各写一套 SDK，corpus 与 `workspaceId` 约束会分叉。
2. 若默认切 Milvus，本地没起容器就全站检索挂——与「Astra 为主」冲突。
3. Full-flow **H04 Milvus delete** 明确 **SKIP**：生产验收路径是 Astra；Milvus 是可选后端，不是关账必需。

事后整理：`VectorStore` 接口 + `VECTOR_BACKEND=astra|milvus`（默认 astra）+ `MILVUS_DUAL_WRITE` 可选双写。


## 2. 本篇目标


讲清工厂切换、`createMilvusVectorStore`（collection 保障、workspace 过滤、cosine 分数归一）、双写开关、验收口径。


**不负责**：Astra 实现细节（Phase 1）、混合检索 RRF（第 1 篇）。


---


## 3. Milvus 后端：为什么、优势、不做会怎样、原理


### 3.1 总览


| 层/部件                                                 | 做什么                                               |
| ---------------------------------------------------- | ------------------------------------------------- |
| `resolveVectorBackend`                               | `VECTOR_BACKEND=milvus` → milvus，否则 astra         |
| `createVectorStoreFromEnv`                           | **hybridSearch / embedding-precheck** 统一入口（检索读路径） |
| `shouldWriteMilvus` / `shouldWriteAstra`             | ingest 决定写哪些后端                                    |
| `createMilvusVectorStore` / `createAstraVectorStore` | ingest **直连**构造器（当前实现未强制经 factory）                |
| `normalizeMilvusCosineScore`                         | SDK score ∈[-1,1] → 映射到 [0,1] 供门槛                 |


### 3.2 为什么要同接口


`hybridSearch` 检索只调用 `VectorStore.search`。upsert / deleteByDocument 在 ingest 与 KB 删除路径，与 hybrid 共用同一接口形状，但是不同调用方。


若 Chat / ingest / Agent 各写一套 SDK，corpus 与 `workspaceId` 约束会分叉——故接口统一；**读路径**走 `createVectorStoreFromEnv`，**写路径**用 `shouldWrite*` + 直连 Astra/Milvus 构造器（工厂注释写「ingest 应走此入口」，当前代码尚未完全收口）。


### 3.3 优势


| 对比               | 优势                    |
| ---------------- | --------------------- |
| 业务层直调 Milvus SDK | 可测、可 mock、corpus 映射集中 |
| 默认 milvus        | 本地无 compose 即不可用      |
| 两套检索代码           | 行为漂移                  |


### 3.4 不做会怎么样


| 若取消…                   | 后果                                |
| ---------------------- | --------------------------------- |
| workspace filter       | 跨租户向量泄漏                           |
| score 归一               | Agent `minSimilarity` 与 Chat 门槛错乱 |
| upsert 后删多余 chunkIndex | 文档缩短后残留旧 chunk                    |
| 字符串 escape             | filter 注入                         |
| 默认 astra               | demo 环境绑定本地 Milvus                |


### 3.5 数据流


```plain text
VECTOR_BACKEND?
  milvus → createMilvusVectorStore({ corpus })
  else   → createAstraVectorStore({ corpus, collection })

ingest:
  shouldWriteAstra? upsert Astra
  shouldWriteMilvus? upsert Milvus   # milvus 主写 或 MILVUS_DUAL_WRITE=true
```


---


## 4. 方案取舍


| 方案              | 结论         |
| --------------- | ---------- |
| 只 Astra         | 默认采用；私有化不够 |
| 只 Milvus        | 云端 demo 重  |
| **工厂切换 + 可选双写** | 采用         |


---


## 5. 调用链


```plain text
hybridSearch / embedding-precheck
  → createVectorStoreFromEnv({ corpus }) → search

ingest upsert/delete
  → shouldWriteAstra? → createAstraVectorStore(...)
  → shouldWriteMilvus? → createMilvusVectorStore(...)  # milvus 主写 或 MILVUS_DUAL_WRITE=true

regression 05-workspace-isolation → Milvus mock / 默认 astra 断言
```


---


## 6. 关键实现


### 6.1 工厂


```typescript
export function resolveVectorBackend(source = process.env): VectorBackend {
  const raw = source.VECTOR_BACKEND?.trim().toLowerCase();
  return raw === "milvus" ? "milvus" : "astra";
}

export function createVectorStoreFromEnv(options: CreateVectorStoreFromEnvOptions = {}): VectorStore {
  const corpus = options.corpus ?? "user";
  if (resolveVectorBackend() === "milvus") {
    return createMilvusVectorStore({ corpus, collectionName: options.collectionName });
  }
  const collectionName = options.collectionName ?? resolveCorpusTargets(corpus).astraCollection;
  return createAstraVectorStore({ corpus, collectionName });
}

export function shouldWriteMilvus(source = process.env): boolean {
  return resolveVectorBackend(source) === "milvus" || source.MILVUS_DUAL_WRITE === "true";
}

export function shouldWriteAstra(source = process.env): boolean {
  return resolveVectorBackend(source) !== "milvus";
}
```


### 6.2 Collection 名与分数


```typescript
export function resolveMilvusCollectionName(options = {}): string {
  if (options.collectionName?.trim()) return options.collectionName.trim();
  const corpus = options.corpus ?? "user";
  if (corpus === "seed") {
    return process.env.MILVUS_COLLECTION_SEED?.trim() || resolveCorpusTargets("seed").astraCollection;
  }
  return process.env.MILVUS_COLLECTION_USER?.trim() || resolveCorpusTargets("user").astraCollection;
}

function normalizeMilvusCosineScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score <= -1) return 0;
  if (score >= 1) return 1;
  return (score + 1) / 2;
}
```


地址默认 `MILVUS_ADDRESS` 或 `localhost:19530`；索引 `IVF_FLAT`、`nlist=128`、`MetricType.COSINE`；dim 默认 NIM **2048**。


### 6.3 search（强制 workspace）


```typescript
async search(params: VectorSearchParams) {
  assertSearchWorkspaceId(params.workspaceId);
  await ensureCollection();
  const filter = `workspaceId == "${escapeMilvusString(params.workspaceId)}"`;
  const result = await client.search({
    collection_name: collectionName,
    data: [params.vector],
    limit: params.limit ?? 5,
    filter,
    metric_type: MetricType.COSINE,
    consistency_level: "Strong",
    output_fields: ["content", "title", "source", "category", "documentId", "chunkIndex", "workspaceId"],
  });
  const threshold = params.similarityThreshold ?? 0;
  return (result.results ?? []).map(mapMilvusHit).filter((doc) => doc.similarity >= threshold);
}
```


---


## 7. 观测


无独立 metrics；切换后端后看 ingest 日志与 `VECTOR_BACKEND`。Milvus 连不上时 **不会**像 ES 那样在 hybrid 内 fail-open——向量路会抛错（与 Astra 不可用同类）。


---


## 8. 如何验证


| 条件                                   | 期望                           |
| ------------------------------------ | ---------------------------- |
| 默认（无 VECTOR_BACKEND）                 | Astra                        |
| `VECTOR_BACKEND=milvus` + compose up | 检索走 Milvus collection        |
| Full-flow H04                        | **SKIP**（验收文档明确生产路径 = Astra） |
| workspace isolation regression       | PASS                         |


```bash
yarn test:regression:phase-3   # 05-workspace-isolation 等
```


---


## 9. 诚实边界

- **关账不依赖 Milvus live**（H04 SKIP）。
- 分数归一是经验映射，需与门槛联调。
- `MILVUS_DUAL_WRITE` 增加写入成本与一致性窗口——默认勿开。
- seed/user collection 名可回落到 Astra collection 名字符串，运维需对齐真实 Milvus 库。

---


## 10. 收束

1. **Astra 默认、Milvus 可选，统一 VectorStore。**
2. **workspaceId 过滤与 chunk 断言不可省。**
3. **不要把「代码支持」说成「验收已测 live Milvus」。**