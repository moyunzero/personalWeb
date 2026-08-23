---
title: Neo4j Graph RAG demo：seed 子图与 Cypher 白名单
slug: 2026-08-22-neo4j-graph-rag-demo-seed-cypher
description: 0. 零基础背景 图数据库（Graph Database） 是什么 ：用 节点（实体）+ 边（关系） 存数据的数据库，擅长「A 和 B
  什么关系、中间隔几跳」。 像什么 ：社交关系网或地铁线路图——点是站，线是换乘；不像一篇篇 Word。 对比文档/向量库
  ：向量库问「这段文字像不像问题」；图库问「珍珠奶茶 包含 什么…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-8145-b7f7-d0313f1a39f2
notionSyncedAt: 2026-08-23T07:21:40.704Z
---

---


## 0. 零基础背景


### 图数据库（Graph Database）

- **是什么**：用**节点（实体）+ 边（关系）**存数据的数据库，擅长「A 和 B 什么关系、中间隔几跳」。
- **像什么**：社交关系网或地铁线路图——点是站，线是换乘；不像一篇篇 Word。
- **对比文档/向量库**：向量库问「这段文字像不像问题」；图库问「珍珠奶茶 **包含** 什么原料」。

### Neo4j

- **是什么**：最常见的开源**属性图**数据库产品之一，自带浏览器控制台，用 Cypher 查询。
- **像什么**：专门管「关系网」的仓库系统。
- **本项目**：`docker compose` 起本地 Neo4j；里面只有演示用的**奶茶 seed 子图**，不是你的企业知识全库。

### 节点 / 边 / 标签 / 关系类型

- **节点**：一个东西，如产品「珍珠奶茶」。
- **标签（Label）**：节点类别，如 `Product`、`Ingredient`。
- **边 / 关系**：连接，如 `CONTAINS`（包含）、`USES`（使用工艺）。
- **本项目种子长这样**：

```plain text
(珍珠奶茶:Product) -[:CONTAINS]-> (珍珠:Ingredient) -[:USES]-> (煮制:Method)
```


### Cypher

- **是什么**：Neo4j 的查询语言。用图案描述「我要找怎样的路径」，有点像 SQL，但写的是图。例：`MATCH (p:Product)-[:CONTAINS]->(i) RETURN …`。
- **像什么**：在白板画「圆圈和箭头」再问数据库「有没有这种形状」。
- **危险点**：若让大模型自由生成 Cypher，它可能写出 `DELETE`/`MERGE`——等于远程改库。所以我们**禁止开放生成**。

### Allowlist（白名单）

- **是什么**：只允许预先批准的操作集合；名单外一律拒绝。
- **像什么**：门禁卡只能刷开列出的门。
- **本项目**：代码里写死一条 `MATCH … RETURN` 模板 + 参数 `$productName`；`assertAllowlistedCypher` 再拒写操作/奇怪标签。

### Graph RAG（本项目的窄定义）

- **是什么**：用图查询结果增强生成——把路径摘要塞进模型上下文。
- **不是什么**：不是「上传 PDF 自动抽实体构图」（那是 v4）。
- **本项目**：对已灌好的 seed 子图做关系查询 + 展示路径。

### seed（种子数据）/ 实体表

- **是什么**：为演示预先写好的一小撮数据；实体表列出问句里哪些名字算「认识的产品」。
- **本项目**：主要认「珍珠奶茶 / pearl milk tea」；问别的商品常得到 `NO_PATH`。实体表与意图路由共用，避免「说走图谱却解析不出品名」。

### GRAPH_RAG_STATUS vs GRAPH_SEARCH_STATUS

- **是什么**：两套状态字符串——shared 层 summary 用前者；Agent 工具对外主行常用后者（HIT / NO_PATH / ERROR）。
- **本项目**：排障时看清你在读哪一层日志，别混。

## 1. 开场矛盾

1. 「珍珠奶茶用了什么原料」用 chunk 检索可能答非所问；图上路径更可解释。
2. 开放 Cypher 不可接受；完全不用图又无法演示 Graph RAG。
3. 实体表若与意图路由分叉，会出现「路由说 graph、解析不出 productName」。

事后整理：**实体单一真相源**（`SEED_GRAPH_ENTITY_RES` 等常量）；查询入口 `graphRagQuery`；种子写入仅 seed 脚本，不经 Agent tool。


## 2. 本篇目标


讲清 canonical Cypher、allowlist、driver 超时、NO_PATH / HIT 协议、与 IntentPlan 降级边界。


**不负责**：用户上传自动构图（v4）、路径卡片 SSE（第 8 篇）。


---


## 3. Graph demo：为什么、优势、不做会怎样、原理


### 3.1 总览


| 层/部件                      | 做什么                 | 代价                  |
| ------------------------- | ------------------- | ------------------- |
| `SEED_GRAPH_ENTITY_RES`   | 识别「珍珠奶茶」等           | 新实体要改代码             |
| `MILK_TEA_PATH_CYPHER`    | 唯一查询模板              | 路径形态固定              |
| `assertAllowlistedCypher` | 拒写操作 / 未标注标签 / 可变长边 | 误杀复杂读查询             |
| `graphRagQuery`           | 解析实体 → 执行 → summary | Neo4j RTT；15s tx 超时 |
| `seedMilkTeaSubgraph`     | 管理员灌库（WRITE）        | **禁止**走 Agent       |


注释写明：**demo 子图无 workspaceId 过滤**（多租户 Graph → Phase 4）。


### 3.2 优势


| 对比           | 优势                |
| ------------ | ----------------- |
| 纯 chunk      | 路径可展示、可回归 fixture |
| LLM 写 Cypher | 注入面可控             |
| 全库构图         | 验收范围清晰、可重复        |


### 3.3 不做会怎么样


| 若取消…                 | 后果                        |
| -------------------- | ------------------------- |
| allowlist            | CREATE/MERGE 可被注入         |
| 参数化 productName      | 字符串拼接注入                   |
| 实体表与 L0 共用           | 路由漂移                      |
| neo4j 降级（synthesize） | Neo4j down → graph 意图 500 |
| 读写同入口                | Agent 误触 seed 写           |


### 3.4 数据流


```plain text
graphRagQuery({ question })
  → productName = resolveSeedProductName(question)  // 无实体 → NO_PATH
  → assertAllowlistedCypher(MILK_TEA_PATH_CYPHER)
  → executor(cypher, { productName })  // 默认 read session
  → summary: GRAPH_RAG_STATUS: HIT | NO_PATH
```


---


## 4. 方案取舍


| 方案                                | 为何不选 / 采用    |
| --------------------------------- | ------------ |
| `@langchain/community` Neo4jGraph | 过宽；本仓库注释明确不用 |
| LLM 生成 Cypher + 后置校验              | 仍易漏；采用固定模板   |
| **固定 MATCH + allowlist + 参数**     | 采用           |


---


## 5. 调用链


```plain text
IntentPlan primary=graph_relation
  → Agent tool graph_search → graphRagQuery
  → Chat needsGraphContext → graphRagQuery → data-graph-paths（第 8 篇）
seed 脚本
  → seedMilkTeaSubgraph（WRITE，独立入口）
```


---


## 6. 关键实现


### 6.1 实体表（与路由共用）


```typescript
export const SEED_GRAPH_ENTITY_RES = [/珍珠奶茶/, /pearl\s*milk\s*tea/i] as const;

export function hasSeedGraphEntity(query: string): boolean {
  return SEED_GRAPH_ENTITY_RES.some((re) => re.test(query));
}

export function resolveSeedProductName(query: string): string | null {
  return hasSeedGraphEntity(query) ? "珍珠奶茶" : null;
}
```


### 6.2 Canonical Cypher + 查询入口


```typescript
export const MILK_TEA_PATH_CYPHER = `
MATCH path = (p:Product {name: $productName})-[:CONTAINS]->(i:Ingredient)-[:USES]->(m:Method)
RETURN path
`.trim();

export async function graphRagQuery(options: GraphRagQueryOptions): Promise<GraphRagResult> {
  const productName = options.productName ?? resolveSeedProductName(options.question);
  const cypher = MILK_TEA_PATH_CYPHER;
  if (!productName) {
    return { cypher, params: {}, paths: [], summary: "GRAPH_RAG_STATUS: NO_PATH" };
  }
  const params = { productName };
  assertAllowlistedCypher(cypher);
  const paths = await (options.executor ?? defaultExecutor)(cypher, params);
  return { cypher, params, paths, summary: summarizePaths(paths) };
}

function summarizePaths(paths: GraphPathTrace[]): string {
  if (!paths.length) return "GRAPH_RAG_STATUS: NO_PATH";
  const lines: string[] = ["GRAPH_RAG_STATUS: HIT"];
  // … path nodes / relationships …
  return lines.join("\n");
}
```


### 6.3 Allowlist 要点（读前必过）


```typescript
export function assertAllowlistedCypher(cypher: string): void {
  const normalized = cypher.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ").trim();
  if (WRITE_OR_ADMIN.test(normalized)) {
    throw new CypherAllowlistError("Cypher rejected: write/admin keyword not allowlisted");
  }
  if (!/^\s*MATCH\b/i.test(normalized)) throw new CypherAllowlistError("must start with MATCH");
  if (!/\bRETURN\b/i.test(normalized)) throw new CypherAllowlistError("must include RETURN");
  // 拒多语句、未标注节点、可变长关系 *、未 allow 的 label/rel type
}
```


允许标签：`Product Ingredient Method People Type`；关系：`CONTAINS USES SUITABLE_FOR BELONGS_TO`。


### 6.4 Driver


```typescript
const NEO4J_TX_TIMEOUT_MS = 15_000;
// NEO4J_URI 默认 bolt://localhost:7687；非测试环境无 NEO4J_PASSWORD → throw
```


---


## 7. 观测

- **shared** **`graphRagQuery`** **summary**：`GRAPH_RAG_STATUS: HIT|NO_PATH`。
- **Agent** **`graph_search`** **工具对外主行**：`GRAPH_SEARCH_STATUS: HIT|NO_PATH|ERROR`；其后可能再附上 summary（内含 `GRAPH_RAG_STATUS`）。验收 / trace 看工具主状态字符串时以 **`GRAPH_SEARCH_STATUS`** 为准。
- Wave D 证据：图谱查询 JSON 快照（如 `D05-graph`）。

---


## 8. 如何验证


| 条件              | 期望                        |
| --------------- | ------------------------- |
| Neo4j up + seed | HIT；路径含珍珠 / 煮制            |
| 无实体问句           | NO_PATH                   |
| regression `#6` | PASS（可用 fixture executor） |


```bash
yarn test:regression:phase-3   # 06-graph-path
docker compose up -d neo4j
```


---


## 9. 诚实边界

- **仅 seed 子图**；用户 PDF 不进 Neo4j。
- **无 workspace 隔离**（代码注释写明）。
- 新实体必须改 `SEED_GRAPH_ENTITY_RES` + 种子 Cypher。
- 验收曾遇镜像拉取失败（infra）。

---


## 10. 收束

1. Graph RAG 在此阶段是 **可演示、可测、可降级** 的窄能力。
2. **安全 = 模板 + allowlist + 参数化**，不是 prompt。
3. 与 chunk KB **并列**，由 IntentPlan 选择（第 7 篇）。