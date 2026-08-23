---
title: 图谱路径卡片与 KB synthesis：SSE 契约与 single_specialist 出口
slug: 2026-08-22-kb-synthesis-sse-single-specialist
description: Personal GPT Phase 3.1 · 系列第 8 篇 0. 零基础背景 SSE（Server Sent
  Events，服务端推送事件） 是什么 ：一种 HTTP 上的 单向流式协议 ：服务器持续推文本行，浏览器用 或 fetch 流接收。适合「打字机」效果。
  像什么 ：电台直播——服务器一直说，客户端听；不…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-811f-b35c-cbe0a63d7fab
notionSyncedAt: 2026-08-23T07:21:52.584Z
---

> **Personal GPT Phase 3.1 · 系列第 8 篇**

## 0. 零基础背景


### SSE（Server-Sent Events，服务端推送事件）

- **是什么**：一种 HTTP 上的**单向流式协议**：服务器持续推文本行，浏览器用 `EventSource` 或 fetch 流接收。适合「打字机」效果。
- **像什么**：电台直播——服务器一直说，客户端听；不像普通请求「问一句等一整包答案」。
- **本项目**：除了正文 delta，还推结构化数据帧，例如：
    - `data-citations`：引用卡片（文档名、片段）
    - `data-graph-paths`：给人看的图谱路径（节点中文名，**不是** Cypher）
    - `data-agent-trace`：Agent 步骤 / 意图轨迹

### Next.js App Router 与 `"use client"`

- **是什么**：Next.js（本项目 Web 框架）里，标了 `"use client"` 的模块只能在**浏览器**跑；API Route 在**服务器**跑。
- **像什么**：厨房刀具不能拿到客桌当餐具——放错区会出事。
- **本项目踩过的坑**：server route import 了 client 组件里的函数 → 500。纯转换函数要放在无 `"use client"` 的 `lib/`。

### Citation（引用）

- **是什么**：回答依据哪段文档的可点击/可展示来源。
- **像什么**：论文脚注。
- **本项目**：SSE `data-citations` + UI 卡片。

### Synthesis（成文 / 合成）

- **是什么**：检索/图谱已经有结果后，再让一个**只写字、不调工具**的角色生成最终用户可见答案。
- **像什么**：编辑部：记者先采到料，编辑写稿；编辑不再自己去采访。
- **本项目**：`Synthesizer`；禁止输出 `KB_SEARCH_STATUS` 等内部标记。

### single_specialist

- **是什么**：IntentPlan 里只有一个专科（常见仅 Retriever）时的执行模式：预检索 → 成文。
- **像什么**：一个人搞定的小单，不必召开四人小组会（Supervisor 多轮）。
- **对比**：`multi_step` / supervisor 才拉更多专科（Phase 2）。

### HIT / miss

- **HIT**：命中（有够格的资料或图谱路径）。
- **miss**：没找到。
- **本篇要避免的撒谎**：一边 citation 有文档，一边正文还写「知识库未找到」。

### 用户应看到 vs 不应看到


```plain text
✅ 回答正文
✅ [引用] 奥德赛计划书_…
✅ [路径] Product:珍珠奶茶 → Ingredient:珍珠 → Method:煮制

❌ MATCH (p:Product)…（Cypher）
❌ 内部协议堆在正文里（可放开发者 trace 面板）
```


---


## 1. 开场矛盾


意图路由对了，产品层仍翻过车：

1. **Chat 500**：`graphPathsToDisplay` 曾从带 `"use client"` 的路径卡片组件被 **服务端 API Route** 导入——App Router 炸。修法：抽成**无** `"use client"` 的展示映射模块，供 server / client 共用。
2. **HIT 与 miss 脚注并存**：`single_specialist` + prefetch 已命中，流里仍出现 `> 说明：知识库未找到…`，citation 与文案矛盾。
3. **Cypher 泄漏**：用户只需 `Product:珍珠奶茶 → …`，不该在 SSE 看到 raw Cypher。

UAT（MCP 验收板，2026-08-23）三条支柱：**A graph trace · B kb synthesis · C chat graph-paths**；全量报告 **15/15 PASS**。


## 2. 本篇目标


讲清 display 映射、Chat SSE、`isRetrieverSynthesisPlan` / Synthesizer 角色、验收断言。


**不负责**：GraphPathCards 视觉细节。


---


## 3. 机制


### 3.1 Chat 路径展示（无 Cypher）


```typescript
export type GraphPathDisplay = {
  nodes: string[];         // "Product:珍珠奶茶"
  relationships: string[]; // "CONTAINS"
};

export function graphPathsToDisplay(
  paths: Array<{
    nodes: Array<{ labels: string[]; id: string; properties: Record<string, unknown> }>;
    relationships: Array<{ type: string }>;
  }>,
): GraphPathDisplay[] {
  return paths.map((path) => ({
    nodes: path.nodes.map((n) => {
      const label = n.labels[0] ?? "Node";
      const name =
        typeof n.properties.name === "string" && n.properties.name.trim()
          ? n.properties.name
          : n.id;
      return `${label}:${name}`;
    }),
    relationships: path.relationships.map((r) => r.type),
  }));
}
```


`/api/chat`：`graphRagQuery` → `graphPathsToDisplay` → SSE `data-graph-paths`（payload **不含** cypher 字段）→ `Bubble` → `GraphPathCards`。


### 3.2 Agent synthesis（D-11）


```typescript
export function isRetrieverSynthesisPlan(plan: IntentPlan): boolean {
  if (plan.specialists.length !== 1) return false;
  if (plan.specialists[0] !== "retriever") return false;
  if (plan.retrieverTools.length === 0) return false;
  return (
    plan.primary === "kb_doc" ||
    plan.primary === "graph_relation" ||
    plan.primary === "kb_graph_hybrid"
  );
}
```


命中该 plan 时走 **prefetch → Synthesizer 成文**（禁止输出 `KB_SEARCH_STATUS` 等内部标记）。Synthesizer 规则要点：

- KB 命中：基于资料完整作答；
- KB 未命中：**不得**以「知识库没有」为由拒绝，可用通用知识回答（与 Chat 对齐）；
- 禁止「仅一句 miss 模板就结束」。

流消毒侧另有 `kb-answer-format` 去掉 `> 说明：知识库未找到足够依据…` 类脚注，避免 HIT 路径残留 miss 文案。


### 3.3 优势 / 反事实


| 若取消…                   | 后果                   |
| ---------------------- | -------------------- |
| server-safe display 模块 | Chat graph 路径 500    |
| Synthesizer 角色         | Retriever 内部标记泄漏给用户  |
| SSE 不剥 cypher          | 查询语言暴露               |
| 单一诚实出口                 | citation 与 miss 脚注并存 |


### 3.4 数据流


```plain text
Chat graph_relation
  → graphRagQuery → graphPathsToDisplay → data-graph-paths → UI cards

Agent kb_doc (single_specialist + synthesis)
  → prefetch hybrid/kb HIT
  → synthesizer 成文 + data-citations
  → 无 miss 脚注（UAT B）
```


---


## 4. 方案取舍


| 方案                               | 为何            |
| -------------------------------- | ------------- |
| display 写在 client 组件再 export     | Next 边界炸 → 不选 |
| 继续让 Retriever 直接对用户说话            | 协议标记泄漏 → 不选   |
| **server-safe 映射 + Synthesizer** | 采用            |


---


## 5. 调用链


见 §3.4；验收旁路：同源 `POST /api/chat` / `/api/agent/chat` SSE 文本落盘。


---


## 6. 关键实现


见 §3.1–3.2（完整到可读）。


---


## 8. 如何验证


| 用例         | 产物 / 断言                                                          |
| ---------- | ---------------------------------------------------------------- |
| Agent 珍珠奶茶 | `A-agent-stream.txt`：`primary=graph_relation`、`graph_search`、HIT |
| Agent 奥德赛  | `B-kb-agent-stream.txt`：citation 含文档名；无 miss 脚注                  |
| Chat 珍珠奶茶  | `C-chat-stream.txt`：`data-graph-paths`；无 cypher                  |


```bash
# 跑 Phase 3 全量 UAT 脚本（产物：带日期的 FULL-UAT 报告）
# 记录 → 15/15
```


**环境坑（验收笔记）**：Web 未注入 `NEO4J_PASSWORD` 时 chat-api 失败；重启并 `corpus=seed` 后 PASS。


本地「红烧肉」相似度 0.593 < Agent 门槛 0.60 为真实 NO_HIT，故 synthesis 改用已入库奥德赛文档验收。


---


## 9. 诚实边界

- 路径卡片仅 seed 图；无路径则无卡。
- synthesis 正文未自动 Faithfulness 打分。
- Playwright：**空输入** Send disabled 为预期；**输入后**可发送（3.1 复验）。

---


## 10. 收束

1. **Client/Server 边界拆文件**是 Next 硬课。
2. **single_specialist synthesis = 一条诚实用户叙事。**
3. Phase 3.1 关账 = 路由确定 + SSE 可观测 + 合成不自相矛盾。