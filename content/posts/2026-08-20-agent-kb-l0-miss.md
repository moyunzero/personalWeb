---
title: Agent KB L0：长句检索为何会 miss——查询压缩与相似度门槛
slug: 2026-08-20-agent-kb-l0-miss
description: Personal GPT Phase 2 · 系列第 3 篇 0. 背景 知识库检索（本项目语境）
  ：把文档切成小段，每段用「嵌入模型」变成一串数字（向量），存进向量数据库。提问时把问句也变成向量，找「方向最接近」的几段，再交给大模型写回答。这常被叫做
  RAG（检索增强生成）——你只需记住： 先找资料，再生成，并尽量带…
author: 墨韵
date: 2026-08-20
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c3df5c0-26f4-81aa-8341-eb55833d1964
notionSyncedAt: 2026-08-21T10:13:46.602Z
---

> **Personal GPT Phase 2 · 系列第 3 篇** 

## 0. 背景


**知识库检索（本项目语境）**：把文档切成小段，每段用「嵌入模型」变成一串数字（向量），存进向量数据库。提问时把问句也变成向量，找「方向最接近」的几段，再交给大模型写回答。这常被叫做 RAG（检索增强生成）——你只需记住：**先找资料，再生成，并尽量带来源**。


**相似度（similarity）**：0～1 的分数，越高表示检索段与问句越像。产品会设**门槛**：低于门槛的结果直接丢掉，避免「勉强相关」诱导模型编造。


**Embedding 稀释**：问句越长、流程套话越多（「先查库」「写成 Markdown 报告」），向量越被拉向这些套话的语义，专有名词（如「x x手册」）的信号相对变弱，分数可能从「刚过线」掉到「差一点点不及格」。


**Chat vs Agent 问法差异**：Chat 常是短问；Agent 验收句常是长任务说明。同一文档「Chat 能中、Agent 不中」往往是问法形状不同，不一定是库坏了。


**L0**：本系列把「规则压缩问句 + 略调门槛 + 多路重试」称为第 0 层止血；更重的 **hybrid（混合检索）** / **rerank（重排序）** 留给后续版本（v3）。


**top-K**：向量库先返回「最像的 K 段」（本项目默认常取 5），再按相似度门槛过滤——门槛越低，越容易把勉强相关的段塞进上下文。


**ANN（Approximate Nearest Neighbor，近似最近邻）**：向量库用的近似搜索——在百万级向量里快速找「方向接近」的邻居，不必对全库精确两两比较。


**DOC-***：模型爱编的假内部文档号（如 `DOC-1234`）。Phase 2 协议要求：没检索命中就禁止假装有编号。


**ISSUE-001 混库挤占**：多份语料挤在同一检索空间时，不相关段可能抢走 top-K 名额，把真正相关的手册段挤出门槛——检索「有结果」≠「结果有用」。


**SystemMessage**：写给模型看的系统侧消息（用户界面通常不直接展示）。预检索结果会以带标签的 SystemMessage 注入，提醒专科「这是工具结果」。


---


## 1. 开场矛盾


同一份「xx手册2024」已经在知识库里 `就绪`。Chat 模式问手册相关内容，引用卡片能出来。Agent 模式却说：

> 先查知识库里关于xx手册的资料，再整理成一份带引用的简短 Markdown 报告

预检索 / `kb_search` 报 **NO_RELEVANT_HIT**。向量库并没丢文档——形态是「裸召回最高分略低于门槛」（仓库里有记录的同类分数是 **0.654**，出现在闲聊问句的导出轨迹里；**xx手册当次分数未落盘**，但验收复测确认过 HIT）。Agent 旧默认门槛是 **0.68**，现为 **0.60**。Chat 用户语料 Path A 常用 **0.55**，但对 seed 语料另有更高阈值（约 **0.72**）——所以不能简单说「Chat 一律更松」。差的往往是 **长任务句把 embedding 稀释了，再叠加偏严的硬过滤**。


第二个矛盾：若为了命中把门槛降到接近 0，低相关 top-K 会诱使模型**编造手册章节**——Phase 2 明确要防假 `DOC-*`。


L0 的答案不是 hybrid / rerank（那是 v3），而是：**压缩检索词 + 略降门槛 + 多路 query 回退**。


## 2. 本篇目标


讲清 Agent 侧检索诚实链路：`extractKbSearchQuery`、`DEFAULT_KB_MIN_SIMILARITY = 0.60`、`invokeKbSearch` 的 primary → userText → condensed 回退，以及 `KB_SEARCH_STATUS` 协议。


不负责 Sequential 编排与流式 UI。


## 3. 机制


### 3.1 总览


| 层/部件                     | 做什么                           | 代价                                                                         | 代码入口 |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------------- | ---- |
| `extractKbSearchQuery`   | 去掉「先查知识库 / 写报告」套话             | 过短则回退原文                                                                    | §6.1 |
| `resolveKbMinSimilarity` | 默认 0.60，可 env 覆盖              | 经验值，需按语料重标                                                                 | §6.2 |
| `retrieveKb`             | embed → ANN → 按门槛过滤           | 混库 ISSUE-001 仍在                                                            | §6.2 |
| `invokeKbSearch`         | 多 query 尝试；统一 HIT / NO_HIT 报文 | 预检索路径通常 ≤2 次（primary 已是压缩词时 condensed 会被 `tried` 去重）；LLM 自写 query 时才可能用满三路 | §6.3 |


对外输出：给 Retriever / Editor 的**纯文本工具结果**（含硬标记），不是 JSON schema tool。


### 3.2 为什么要这么做


任务句同时承载 **实体**（xx手册）与 **流程指令**（先查库、再整理报告）。Embedding 对后者也敏感，向量被拉向「写报告 / Markdown」语义，实体相似度下滑，再撞上 0.68 硬门 → near-miss。


Chat 路径问句短、门槛策略不同，所以「Chat 能中、Agent 不中」并不神秘。


L0 选择规则压缩而不是再调一次 LLM 做 query rewrite：Agent 链路已经很烧 token；规则版足够剥套话。


### 3.3 优势


| 对比对象               | 本方案优势             |
| ------------------ | ----------------- |
| 直接把用户全文拿去 embed    | 实体信号不被流程套话淹没      |
| 取消相似度门槛            | 命中率虚高，假引用风险升      |
| 只用 LLM rewrite     | 额外延迟 / 失败面；本阶段不必要 |
| 一上来上 hybrid+rerank | 工程与评测属于 v3；L0 先止血 |


### 3.4 不做会怎么样


| 若取消…                       | 会发生什么                                |
| -------------------------- | ------------------------------------ |
| 取消查询压缩                     | 长任务句更容易 near-miss（分数略低于旧门槛 0.68 的形态） |
| 门槛维持 0.68 且无压缩             | 同上；Chat/Agent 体验分裂                   |
| 取消 NO_HIT 硬标记              | 模型易编造 DOC-* / 假装命中                   |
| 取消 userText / condensed 回退 | LLM 改写 query 一次失败即死                  |
| 空 query 仍强行检索              | 噪声命中或无意义外呼                           |


### 3.5 原理小结（数据流）


```plain text
用户长任务句
  →（可选预检索）extractKbSearchQuery(userText)
  → embed(compressed) → ANN topK
  → filter similarity >= minSimilarity（默认 0.60）
  → chunks 空？
        → try userText 原文
        → try condensed（再压一次）
        → 仍空 → KB_SEARCH_STATUS: NO_RELEVANT_HIT + 最高分诊断
  → 有 chunks → KB_SEARCH_STATUS: HIT + citation 元数据
  → Retriever / Editor 必须采信标记；禁止编造未列出的 documentId
```


一句话原理：**先让 query 像「库里的那句话」，再用略保守的门槛过滤幻觉。**


## 4. 方案取舍


| 方案                                  | 优点       | 缺点 / 为何不选                                      |
| ----------------------------------- | -------- | ---------------------------------------------- |
| 门槛降到 0.50                           | 更易 HIT   | 幻觉面扩大；与「诚实检索」冲突                                |
| 只用 Chat 的 Path A 逻辑                 | 一致       | Agent 报告场景更诱骗模型堆假来源                            |
| HyDE / Multi-Query（Phase 1 Chat 可选） | 强        | Agent 已多专科，成本叠加；L0 要短                          |
| **规则压缩 + 0.60 + 多路回退（采用）**          | 改动面小、可单测 | 不是检索 SOTA；语料变了要重标；预检索下 condensed 常与 primary 相同 |
| v3 hybrid + rerank                  | 质量上限高    | 明确延期                                           |


## 5. 调用链


```plain text
Agent 请求（含知识库意图）
  → 服务端预检索 invokeKbSearch({ query: condensed, userText })
  → 解析工具原文 → citationBag（直接成为前端 data-citations；不依赖 Retriever 是否再调工具）
  → 注入 SystemMessage「【知识库预检索·工具结果·可信】」（envelope 可信；snippet 仍是文档数据）
  → Retriever / Editor：复述或续写时仍须遵守 HIT/NO_HIT 协议
  → 前端引用卡片百分比 = chunk similarity 快照
```


## 6. 关键实现（完整核心）


### 6.1 压缩检索词


```typescript
// 流程套话会稀释 embedding，剥掉后向量更贴近实体（如「xx手册」）
const TASK_BOILERPLATE = [
  /先查(一下)?知识库(里|中)?(关于|有关)?/gi,
  /再(联网)?补充[^，。,.！!？?]*/gi,
  /再整理成[^，。,.！!？?]*/gi,
  /整理成一份[^，。,.！!？?]*/gi,
  /写(一份|一篇)?[^，。,.！!？?]*报告/gi,
  /带对比表和引用的?/gi,
  /Markdown\s*报告/gi,
  /简短\s*Markdown/gi,
  /查(询|找|一下)?知识库(里|中)?的?/gi,
  /关于|有关/gi,
  /的资料|的内容|的文档/gi,
  /请|帮我|麻烦/gi,
];

const MIN_USEFUL = 2;

/** 压缩检索 query；过短则回退原文。 */
export function extractKbSearchQuery(text: string): string {
  const raw = text?.trim() ?? "";
  if (!raw) return raw;

  let out = raw;
  for (const re of TASK_BOILERPLATE) {
    out = out.replace(re, " ");
  }
  out = out
    .replace(/[，。,.！!？?；;：:\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 压太狠只剩标点/单字时，宁可 embed 全文也别送空 query
  if (Array.from(out).length < MIN_USEFUL) {
    return raw;
  }
  return out;
}
```


示例：长句压完后更接近「xx手册」这类实体串，而不是整段流程说明。


### 6.2 门槛与过滤


```typescript
export const DEFAULT_KB_TOP_K = 5;
/** Agent 有效命中门槛；可用 AGENT_KB_MIN_SIMILARITY 覆盖 */
export const DEFAULT_KB_MIN_SIMILARITY = 0.6;

function isValidSimilarity(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

// 调用方可传 override；否则读 env；非法值回退 0.60
export function resolveKbMinSimilarity(override?: number): number {
  if (typeof override === "number" && isValidSimilarity(override)) {
    return override;
  }
  const raw = process.env.AGENT_KB_MIN_SIMILARITY;
  if (!raw) return DEFAULT_KB_MIN_SIMILARITY;
  const n = Number.parseFloat(raw);
  return isValidSimilarity(n) ? n : DEFAULT_KB_MIN_SIMILARITY;
}

type RetrievedChunk = {
  documentId?: string;
  title?: string;
  source?: string;
  chunkIndex?: number;
  text: string;
  similarity: number;
};

declare function embedText(text: string): Promise<number[]>;
declare function createVectorStore(): {
  search(opts: {
    workspaceId: string;
    vector: number[];
    limit: number;
  }): Promise<RetrievedChunk[]>;
};
declare function resolveWorkspaceId(workspaceId?: string): string;

export async function retrieveKb(params: {
  query: string;
  workspaceId?: string;
  topK?: number;
  minSimilarity?: number;
}): Promise<{
  workspaceId: string;
  chunks: RetrievedChunk[];
  topSimilarity?: number;
}> {
  const workspaceId = resolveWorkspaceId(params.workspaceId);
  const query = params.query?.trim();
  if (!query) return { workspaceId, chunks: [] };

  const topK =
    typeof params.topK === "number" && params.topK > 0
      ? Math.min(params.topK, 20)
      : DEFAULT_KB_TOP_K;

  const vector = await embedText(query);
  const minSimilarity = resolveKbMinSimilarity(params.minSimilarity);
  const raw = await createVectorStore().search({
    workspaceId,
    vector,
    limit: topK,
  });
  // topSimilarity 保留 ANN 最高分，即使未过门槛——方便诊断 near-miss
  const topSimilarity =
    raw.length === 0
      ? undefined
      : raw.reduce((max, c) => (c.similarity > max ? c.similarity : max), raw[0]!.similarity);
  const chunks = raw.filter((c) => c.similarity >= minSimilarity);
  return { workspaceId, chunks, topSimilarity };
}
```


### 6.3 工具层：HIT / NO_HIT 与回退


```typescript
import { extractKbSearchQuery } from "./extract-kb-query";
import { resolveKbMinSimilarity, retrieveKb } from "../rag/retrieve";

export const KB_SEARCH_NO_HIT_STATUS = "KB_SEARCH_STATUS: NO_RELEVANT_HIT";

export function formatKbNoHitMessage(
  workspaceId: string,
  minSimilarity: number,
  topSimilarity?: number,
): string {
  const top =
    typeof topSimilarity === "number" && Number.isFinite(topSimilarity)
      ? `（召回最高相似度${topSimilarity.toFixed(3)}，低于门槛${minSimilarity.toFixed(2)}）`
      : `（有效命中需 similarity ≥${minSimilarity.toFixed(2)}）`;
  return [
    KB_SEARCH_NO_HIT_STATUS,
    `知识库未找到与查询足够相关的内容${top}。workspace=${workspaceId}`,
    "硬性要求：禁止编造文档标题、documentId、DOC-*、内部手册或假装命中。",
    "请如实向上游说明：知识库无相关依据；可建议改走 researcher 联网或告知用户依据不足。",
  ].join("\n");
}

type HitVia = "primary" | "userText" | "condensed";

export async function invokeKbSearch(input: {
  query: string;
  topK?: number;
  workspaceId?: string;
  minSimilarity?: number;
  userText?: string;
}): Promise<string> {
  const minSimilarity = resolveKbMinSimilarity(input.minSimilarity);
  const base = {
    topK: input.topK,
    workspaceId: input.workspaceId,
    minSimilarity,
  };

  try {
    const tried = new Set<string>(); // 同一句 query 只 embed 一次
    let topSimilarity: number | undefined;
    let workspaceId = "";

    const tryQuery = async (query: string, via: HitVia): Promise<string | undefined> => {
      const q = query.trim();
      if (!q || tried.has(q)) return undefined;
      tried.add(q);
      const result = await retrieveKb({ ...base, query: q });
      workspaceId = result.workspaceId;
      if (typeof result.topSimilarity === "number") {
        topSimilarity = Math.max(topSimilarity ?? 0, result.topSimilarity);
      }
      if (result.chunks.length > 0) {
        // formatKbHitMessage(workspaceId, minSimilarity, result.chunks, via)
        return `KB_SEARCH_STATUS: HIT\nvia=${via}\ncount=${result.chunks.length}`;
      }
      return undefined;
    };

    // 1) 主 query（预检索路径通常已是压缩词）
    const primaryHit = await tryQuery(input.query, "primary");
    if (primaryHit) return primaryHit;

    // 2) LLM 自写 query 失败时，回退用户原文
    const userText = input.userText?.trim();
    if (userText) {
      const userHit = await tryQuery(userText, "userText");
      if (userHit) return userHit;
    }

    // 3) 再压一次套话；与 primary 相同时 tried 会跳过
    const seed = userText || input.query;
    const condensedHit = await tryQuery(extractKbSearchQuery(seed), "condensed");
    if (condensedHit) return condensedHit;

    return formatKbNoHitMessage(workspaceId || "unknown", minSimilarity, topSimilarity);
  } catch {
    return "知识库检索失败（降级）：请稍后重试，勿编造文档内容。";
  }
}
```


真实项目里 HIT 分支会展开为带 `documentId` / `similarity` / `snippet` 的 citation 块；上面用缩写突出控制流。无命中时 **保留最高分**，方便日志与验收判断「是空库还是 near-miss」。


## 7. 日志与可观测


轨迹文案由 `summarizeKbToolOutput` 生成（例如 `预检索 · HIT · <uuid>` / `预检索 · NO_RELEVANT_HIT`）。**没有**独立的 `hitVia` 可观测字段——哪一路命中只写在 HIT 报文括号里；且轨迹对 `kb_search:NO_RELEVANT_HIT` 做指纹去重，多路尝试在面板上可能塌成一条。


浏览器引用卡片上的百分比来自 chunk `similarity`，是**单次检索快照**，不是离线评测集指标。


## 8. 如何验证


| 输入 / 条件                   | 期望                            |
| ------------------------- | ----------------------------- |
| 长任务句含「xx手册」+ 库中有手册        | L0 后预检索 HIT；真实 `documentId`   |
| 门槛 0.68 + 不压缩（对照）         | 易出现 top≈0.65x 的 NO_HIT        |
| 种子协议 ZX-7749 smoke        | citation `documentId` 命中种子 id |
| `extractKbSearchQuery` 单测 | 套话剥除后保留实体；过短回退原文              |
| 空库 / 无关问句                 | NO_HIT；正文无假 DOC-*             |


## 9. 诚实边界

- **0.60 是经验值**，换 embedding 模型或语料必须重标；不是论文最优。
- L0 **不是**混合检索；混库挤占（ISSUE-001）仍可能在别的问法上复现。
- 规则压缩对英文任务套话覆盖弱。
- 没有公布「召回率 +X 个百分点」——Phase 2 没有黄金集门禁；只有验收个案与 smoke。

## 10. 收束

1. Chat 能中、Agent miss，常是 query 形状 + 门槛，不是「库坏了」。
2. 先压缩再检索，比先上 rerank 更符合 v2 的止血目标。
3. HIT / NO_HIT 硬标记，把诚实检索写成协议（协议细节见第 6 篇）。
4. 真正的质量曲线留给 v3：hybrid、rerank、评测集。