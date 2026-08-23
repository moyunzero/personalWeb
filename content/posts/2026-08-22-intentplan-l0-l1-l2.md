---
title: 统一意图路由 IntentPlan：L0→L1→L2→合成
slug: 2026-08-22-intentplan-l0-l1-l2
description: Personal GPT Phase 3 · 系列第 7 篇 0. 零基础背景 意图路由（Intent Routing） 是什么
  ：用户一句话进来，先判断「这题该干什么」，再决定检索通道、Agent 找谁、挂什么工具。 像什么 ：医院分诊——不是所有人先做全套昂贵检查。 本项目
  ：Chat 与 Agent 共用同一套路…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-81e6-ab3f-d66911f6b996
notionSyncedAt: 2026-08-23T07:21:45.353Z
---

> **Personal GPT Phase 3 · 系列第 7 篇**

---


## 0. 零基础背景


### 意图路由（Intent Routing）

- **是什么**：用户一句话进来，先判断「这题该干什么」，再决定检索通道、Agent 找谁、挂什么工具。
- **像什么**：医院分诊——不是所有人先做全套昂贵检查。
- **本项目**：Chat 与 Agent **共用同一套路由模块**（`resolveIntentPlan`），避免两套规则打架。

### IntentPlan（意图计划）

- **是什么**：一份**结构化小纸条**（用 Zod 校验字段），告诉下游「主意图、通道、专科、工具白名单、退路、原因」。例：

```plain text
primary: graph_relation          ← 主意图（九选一之一）
channels: graph                  ← 走图谱通道
specialists: ["retriever"]       ← Agent 找 Retriever
retrieverTools: ["graph_search"] ← 只允许图谱工具
fallbackChain: ["kb_search"]     ← 图谱不行再查库
reason: "l0:graph_relation:…"    ← 为何这么判（排障）
```

- **像什么**：分诊单，后面科室照单执行。
- **Zod**：运行时检查对象形状的 TypeScript 库——字段错了会早失败，而不是默默传错。

### primary 意图（人话对照）


| 值                               | 意思                |
| ------------------------------- | ----------------- |
| `chitchat`                      | 寒暄，别检索            |
| `general`                       | 通用闲聊/常识           |
| `kb_doc`                        | 查知识库文档            |
| `graph_relation`                | 查实体关系（图谱）         |
| `kb_graph_hybrid`               | 库+图都要             |
| `web_research` / `multi_step` 等 | 联网或多专科（见 Phase 2） |


### L0 / L1 / L2（从便宜到贵）


| 层      | 是什么                    | 像什么         | 例子                     |
| ------ | ---------------------- | ----------- | ---------------------- |
| **L0** | 规则/关键词/正则，几乎零成本        | 分诊台看症状关键词   | 「你好」→ 闲聊；「珍珠奶茶+原料」→ 图谱 |
| **L1** | 向量 Top-1 **探一眼**库里有没有货 | 先摸体温再决定是否抽血 | 相似度很高 → 偏 `kb_doc`     |
| **L2** | 可选：再让 LLM 做分类（**默认关**） | 请专家会诊       | 灰色地带兜底                 |


### `terminal: true`（关键）

- **是什么**：L0 已经铁板钉钉时，**禁止再跑 L1**。
- **为什么**：图谱问法若再去做 embedding 预检，可能因库里奶茶文本少而低分，被错判成「没货 / 闲聊」。
- **本项目**：纯 `graph_relation` 且无混杂意图时 `terminal: true`。

### 工具白名单（retrieverTools）

- **是什么**：Retriever 进程里**真正挂载**的工具名列表。
- **像什么**：工牌权限——没写在名单上的门刷不开。
- **为什么不能只靠 prompt**：模型仍可能发出 `web_search`；硬边界是 `tools: [...]` 数组。

### 举例


| 用户说          | 倾向                              |
| ------------ | ------------------------------- |
| 「嗨」          | chitchat                        |
| 「奥德赛计划书主要内容」 | kb_doc                          |
| 「珍珠奶茶用了什么原料」 | graph_relation → `graph_search` |
| 「先查库再联网写成报告」 | multi_step                      |


---


## 1. 开场矛盾


Phase 2 Agent 靠 prompt + `inferRequiredSpecialists` 猜意图；Chat 另有三层 query-router。**两套逻辑**导致：

1. 问「珍珠奶茶原料」——Chat 可能走 chunk 检索，Agent 应走 `graph_search`。
2. KB 与 Graph 边界靠关键词散落各处，改一处漏一处。
3. H-04 验收要求：Agent trace 显示 `primary=graph_relation`、`retrieverTools=["graph_search"]`，且 **L0 terminal 跳过 embedding 预检**（否则 graph 被 low_sim 误判 general）。

Phase 3 把路由收到共享模块，输出统一 **`IntentPlan`** 契约，Chat BFF 与 Agent 同包解析。


## 2. 本篇目标


讲清四层流水线、`L0Hit.terminal`、`retrieverTools` 硬白名单、`fallbackChain` 与 Neo4j 降级。


**不负责**：Supervisor 多步 Sequential（Phase 2）、GraphPathCards UI（第 8 篇）。


---


## 3. IntentPlan：为什么、优势、不做会怎样、原理


### 3.1 IntentPlan 是什么


```typescript
export const IntentPlanSchema = z.object({
  primary: PrimaryIntentSchema,       // kb_doc | graph_relation | ...
  channels: RetrievalChannelSchema, // kb | graph | none | ...
  specialists: z.array(z.string()),
  retrieverTools: z.array(z.string()), // 硬白名单
  fallbackChain: z.array(z.string()),  // 如 graph miss → kb_search
  reason: z.string(),
  confidence: z.number(),
  graphSignal: z.boolean().optional(),
  ambiguous: z.boolean().optional(),   // Agent supervisor 用
});
```


九个 `primary` 意图：`chitchat` `general` `kb_doc` `graph_relation` `kb_graph_hybrid` `web_research` `analytics` `report` `multi_step`。


### 3.2 四层流水线


```plain text
resolveIntentPlan(query)
  L0 matchL0Rules — 问候/多步/图谱关系；terminal 则跳过 L1
  L1 collectL1Signals — embedding Top-1 相似度 high/gray/low
  L2 classifyIntentL2 — 可选，ENABLE_L2_INTENT_CLASSIFIER=true 才开
  L3 synthesizeIntentPlan — 合并 + fallback + neo4j 降级
```


**Pitfall 3**：`l0.terminal === true` 时 **不得** 跑 L1，否则「珍珠奶茶」被 low_sim 打成 general。


### 3.3 L0 图谱规则（摘要）


```typescript
export const GRAPH_RELATION_RE = /原料|配料|工艺|用了什么|关系|关联/i;

export function matchGraphRelationL0(query: string): L0Hit | null {
  if (!hasGraphRelationCue(query)) return null;
  if (!hasSeedGraphEntity(query)) return null;  // 实体必须在 seed 表
  return {
    primary: "graph_relation",
    channels: "graph",
    specialists: ["retriever"],
    retrieverTools: ["graph_search"],
    reason: "l0:graph_relation:seed_entity",
    terminal: !mixed,  // 纯图谱问法 terminal
    graphSignal: true,
  };
}
```


`matchL0Rules` 顺序：**chitchat → multi_step → graph_relation**（混合多步优先 CR-02）。


### 3.4 优势


| 对比               | 优势                             |
| ---------------- | ------------------------------ |
| Chat/Agent 双份路由  | 单包单测                           |
| prompt 猜工具       | `retrieverTools` 硬绑            |
| graph 无 fallback | `fallbackChain: ["kb_search"]` |


### 3.5 不做会怎么样


| 若取消…               | 后果                      |
| ------------------ | ----------------------- |
| terminal L0        | graph 被 embedding 误杀    |
| retrieverTools 白名单 | Retriever 越权 web_search |
| neo4j 降级           | Neo4j down 全站 graph 500 |
| shared 包           | web/agent 路由漂移          |
| seed 实体表           | 任意「关系」词误触发 graph        |


### 3.6 配置默认值


```typescript
export function readIntentRouterConfig(): IntentRouterConfig {
  return {
    enableIntentRouter: process.env.ENABLE_INTENT_ROUTER !== "false",
    enableKbGraphFallback: process.env.ENABLE_KB_GRAPH_FALLBACK !== "false",
    enableL2IntentClassifier: process.env.ENABLE_L2_INTENT_CLASSIFIER === "true", // 默认关
    routeRetrieveSimilarity: readFloatEnv("ROUTE_RETRIEVE_SIMILARITY", 0.68),
    routeDirectSimilarity: readFloatEnv("ROUTE_DIRECT_SIMILARITY", 0.42),
  };
}
```


L2 **默认关**，且 **不同步** `ENABLE_LLM_QUERY_ROUTER`（D-14）。


### 3.7 Chat 映射（IntentPlan → direct|retrieve）


```typescript
export function mapIntentPlanToChatRoute(plan: IntentPlan): ChatRouteDecision {
  if (plan.primary === "graph_relation" || plan.primary === "kb_graph_hybrid") {
    return {
      route: "retrieve",
      reason: plan.reason,
      needsGraphContext: true,
      graphContextType: "graph_relation",
    };
  }
  if (plan.primary === "kb_doc" || plan.primary === "multi_step") {
    return { route: "retrieve", reason: plan.reason };
  }
  if (plan.primary === "web_research") {
    return { route: "retrieve", reason: `${plan.reason};web_intent` };
  }
  // chitchat / general / analytics / report → direct，除非 reason 含 retrieve_safe / kb_gray
  ...
}
```


Agent 侧另用 `resolveExecutionMode(plan)`：`chitchat→short`；`ambiguous→supervisor`；`≥2 specialists→sequential`；`1→single_specialist`。


---


## 5. 调用链


```plain text
POST /api/chat
  → resolveIntentPlan
  → mapIntentPlanToChatRoute → retrieve | direct；needsGraphContext → graphRagQuery
POST /api/agent/chat (BFF)
  → resolveIntentPlan → resolveExecutionMode
  → prefetch / graph_search 受 retrieverTools 白名单约束
```


---


## 6. 关键实现：resolve + synthesize 降级


```typescript
export async function resolveIntentPlan(
  query: string,
  deps: ResolveIntentPlanDeps = {},
): Promise<ResolveIntentPlanResult> {
  const l0 = matchL0Rules(query);
  const layers: RouterLayer[] = [];
  if (l0) layers.push("L0");

  let l1;
  if (!l0?.terminal) {
    l1 = await collectL1Signals(query, { probeKb: deps.probeKb, ...config });
    layers.push("L1");
  }
  // L2 optional...
  const plan = synthesizeIntentPlan({ query, l0, l1, l2Hint, neo4jOk: deps.neo4jAvailable?.() ?? true });
  return { plan, layers, precheckSimilarity: l1?.kb?.topSimilarity };
}

// synthesize 片段：Neo4j 不可用
if (!neo4jOk && (plan.primary === "graph_relation" || plan.primary === "kb_graph_hybrid")) {
  plan.primary = "kb_doc";
  plan.channels = "kb";
  plan.retrieverTools = ["kb_search"];
  plan.fallbackChain = [];
  plan.reason = `${plan.reason};neo4j_unavailable`;
}
```


---


## 7. 日志与可观测


Agent trace：`data-agent-trace` 含 `route`、`primary`、`retrieverTools`、`routerLayers`（UAT A 断言）。Chat 侧看 `needsGraphContext` 与 `data-graph-paths`。


---


## 8. 如何验证


| query      | 期望 plan                                                   |
| ---------- | --------------------------------------------------------- |
| 珍珠奶茶用了什么原料 | primary=graph_relation, tools=[graph_search], layers 含 L0 |
| 奥德赛计划书主要内容 | primary=kb_doc, citations HIT                             |
| 你好         | chitchat, channels=none                                   |


```bash
yarn test:regression:phase-3   # 意图路由相关用例
# 对照 Phase 3 MCP：Agent 流式证据（graph 路径）
```


---


## 9. 诚实边界

- L2 分类器默认关，灰色地带主要靠 L1 gray → `kb_doc` safe retrieve。
- **multi_step** 仍依赖关键词顺序启发，非 LLM 规划。
- Chat 旧 `query-router` 可能与 IntentPlan 并存过渡——以 `ENABLE_INTENT_ROUTER` 为准。
- seed 实体目前几乎只有「珍珠奶茶」同义词（`SEED_GRAPH_ENTITY_RES`）。

---


## 10. 收束

1. **IntentPlan 是 Chat/Agent 的路由 ABI**。
2. **L0 terminal** 是图谱命中的保命丝。
3. **降级写进 synthesize**，不靠运行时 try/catch 散落。