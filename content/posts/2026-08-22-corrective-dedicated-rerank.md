---
title: Corrective 改写与 Dedicated Rerank：各管一段漏斗
slug: 2026-08-22-corrective-dedicated-rerank
description: Personal GPT Phase 3 · 系列第 3 篇 0. 零基础背景 漏斗（本篇总比喻） 检索像多层筛子：先 宽召回 （向量
  + BM25 + RRF 凑出一小撮），再 精排 （rerank），最后若「第一名仍不够像」就 改写问句再搜 （Corrective）。每层治不同的病。
  Cosine 相似度（余弦相似…
author: 墨韵
date: 2026-08-22
categories:
  - note
tags:
  - ai
  - RAG
  - Agent
draft: false
notionId: 3c5df5c0-26f4-81d5-9256-c1d056628983
notionSyncedAt: 2026-08-23T07:22:02.213Z
---

> **Personal GPT Phase 3 · 系列第 3 篇** 

## 0. 零基础背景


### 漏斗（本篇总比喻）


检索像多层筛子：先**宽召回**（向量 + BM25 + RRF 凑出一小撮），再**精排**（rerank），最后若「第一名仍不够像」就**改写问句再搜**（Corrective）。每层治不同的病。


### Cosine 相似度（余弦相似度）

- **是什么**：衡量两个向量方向有多接近的分数，常见落在 0~1（越接近 1 越像）。本项目 chunk 上的 `similarity` 就是它。
- **像什么**：两支箭头夹角——同向夹角小，分数高。
- **本项目**：Corrective 看 top1 的 cosine 是否低于 **0.35**；Agent 知识库命中门槛默认 **0.60**（另一套阈值，别混）。

### Corrective RAG（纠偏检索）

- **是什么**：发现「检索结果质量差」时，自动**改写用户问句**再检索一次的策略。业界有人做成独立 Agent；我们做成规则开关。
- **像什么**：图书馆员听不懂你的口语，把「那个奥德赛三条路」翻译成目录用语「奥德赛计划书 三条路径」再去查。
- **本项目**：`maybeCorrective`；**最多改写 1 次**（`skipCorrective`）；改写 LLM 挂了就退回原结果，不让问答 500。

### Query（查询 / 问句）

- **是什么**：用户打进输入框的那句话，也是送给检索器的文本。
- **本项目**：Corrective 改的是这个字符串；HyDE 等高级玩法会另造文本（默认不展开）。

### Dedicated Rerank（专用重排模型）

- **是什么**：一类**只负责给「问题↔︎段落」打相关性分并排序**的模型（常见 HTTP API，如 Cohere Rerank 兼容接口），不是聊天模型。
- **像什么**：专门的「匹配裁判」，比让 GPT 顺便排个序更稳、通常更便宜。
- **本项目**：`rerankDedicated`；配 `RERANK_URL` + `RERANK_API_KEY`；也可用 LLM fallback（默认**关**）。

### rerankScore vs similarity

- **是什么**：两套分——rerank 模型的相关性分，和向量 cosine。
- **像什么**：面试评分 vs 简历关键词分，不能直接当同一个数比大小。
- **本项目**：门槛 / Corrective / Agent HIT **只认 cosine** **`similarity`**；rerank 只改候选**顺序**。

### Top-1 / Top-K

- **是什么**：排序后第 1 名 / 前 K 名结果。
- **本项目**：Corrective 盯 Top-1 分数；最终塞进提示词的通常是 Top-K（默认 limit 常为 5）。

### HyDE / Multi-Query（知道名字即可）

- **HyDE**：先让模型编一段「假想答案」，用这段去向量检索（扩大语义覆盖）。
- **Multi-Query**：一个问题拆成多个问法分别搜再合并。
- **本项目**：有环境开关，默认策略不是本篇重点；成本都比「规则 Corrective 一次」高。

---


## 1. 开场矛盾


RRF 融合后仍有两类失败：

1. **排序错了**：相关 chunk 在 Top-5 里但不在 Top-1，LLM 上下文被噪声挤占。
2. **query 表述偏了**：用户口语化，embedding 与库内书面语不对齐，top1 cosine **低于 0.35**（默认 `CORRECTIVE_MIN_SCORE`）。

业界有 Corrective RAG Agent（多轮子代理改写）。个人项目要的是：**规则触发、最多改写一次、改写 LLM 挂了也不拖垮主链路**。


Rerank 则单独解决「候选池内精排」——用 HTTP rerank API（OpenRouter/Cohere 兼容），默认关 LLM fallback（`RERANK_LLM_FALLBACK=true` 才开）。


## 2. 本篇目标


讲清 `maybeCorrective` 与 `rerankDedicated` 在 `hybridSearch` 漏斗中的位置、阈值与 **D-33 禁止二次改写**。


**不负责**：意图路由（第 7 篇）、Agent `minSimilarity 0.60`（Phase 2 已述，与 Corrective 阈值不同）。


---


## 3. 两段漏斗


### 3.1 总览


| 部件                       | 触发                                                                     | 输出                                                     |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `rerankDedicated`        | `hybridSearchOnce` 在 `fused.length > 0` 时调用；函数内若 `hits.length <= 1` 早退 | 重排后的 Top-N                                             |
| `needsCorrectiveRewrite` | 空结果或 top1.similarity < 0.35                                            | boolean                                                |
| `maybeCorrective`        | 上式为 true                                                               | 改写 query → 再 `hybridSearch` 一次（`skipCorrective: true`） |


顺序：**RRF → rerank → Corrective**。


`skipCorrective` **只禁止再次 Corrective**；第二次 hybrid 仍走 `hybridSearchOnce`，若 `ENABLE_RERANKER` 开着 **仍会 rerank**，然后因 `skipCorrective` 直接返回、不再改写。


### 3.2 优势


| 对比                 | 优势                         |
| ------------------ | -------------------------- |
| 无限改写循环             | 成本可控；最坏 2× hybrid          |
| Corrective 子 Agent | 无额外图节点；共享 hybrid           |
| 只用 rerank 解决低分     | rerank 不提高 cosine；门槛仍 miss |


### 3.3 不做会怎么样


| 若取消…                            | 后果                    |
| ------------------------------- | --------------------- |
| **Corrective**                  | 口语 query 长期卡在 low_sim |
| **二次改写保护**                      | 账单爆炸、延迟翻倍不可控          |
| **改写失败 return hits**            | 一次 LLM 超时毁掉检索         |
| **rerank HTTP 8s timeout**      | 慢 rerank 拖死 SSE       |
| **混淆 rerankScore 与 similarity** | Agent 误判 HIT          |


### 3.4 数据流


```plain text
fused = RRF(...)
fused = rerank?(fused)          # ENABLE_RERANKER 开且 fused 非空
if top1.sim < 0.35 or empty:
  q' = LLM_rewrite(q)
  return hybridSearch(q', skipCorrective=true)
       # ↑ 第二次仍可能 rerank；只是不再进入 maybeCorrective
return fused
```


---


## 4. 方案取舍


| 方案                   | 为何不选 / 采用                  |
| -------------------- | -------------------------- |
| HyDE 默认开             | 每 query +1 生成；仍用 env 关     |
| Multi-query 默认开      | 成本×N                       |
| **规则 Corrective +1** | 采用                         |
| rerank 必选            | `ENABLE_RERANKER=false` 可关 |


---


## 6. 关键实现


### 6.1 Corrective


```typescript
const DEFAULT_CORRECTIVE_MIN_SCORE = 0.35;

export function needsCorrectiveRewrite(
  hits: RetrievedChunk[],
  minScore: number = correctiveMinScore(),
): boolean {
  if (hits.length === 0) return true;
  return hits[0]!.similarity < minScore;
}

export async function maybeCorrective(
  params: HybridSearchParams,
  hits: RetrievedChunk[],
  deps: MaybeCorrectiveDeps,
): Promise<RetrievedChunk[]> {
  if (deps.alreadyCorrected) return hits;
  if (!needsCorrectiveRewrite(hits, deps.minScore ?? correctiveMinScore())) return hits;

  let rewritten: string;
  try {
    rewritten = (await (deps.rewrite ?? defaultRewrite)(params.query)).trim();
  } catch {
    return hits; // 改写失败不 fail 检索
  }
  if (!rewritten || rewritten === params.query.trim()) return hits;

  try {
    const next = await deps.reSearch(rewritten);
    return next.length ? next : hits;
  } catch {
    return hits;
  }
}
```


### 6.2 Dedicated Rerank（摘要）


```typescript
export async function rerankDedicated(
  query: string,
  hits: RetrievedChunk[],
  limit?: number,
): Promise<RetrievedChunk[]> {
  const topN = limit ?? hits.length;
  if (hits.length <= 1) return hits.slice(0, topN);

  const url = process.env.RERANK_URL?.trim();
  const apiKey = process.env.RERANK_API_KEY?.trim();
  if (url && apiKey) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.RERANK_MODEL ?? "cohere/rerank-v3.5", query, documents: hits.map(h => h.text), top_n: topN }),
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        const ranked = mapDedicatedResults(hits, (await res.json()).results ?? [], topN);
        if (ranked.length > 0) return ranked;
      }
    } catch (err) {
      console.warn("[rerank] dedicated rerank request failed", err);
    }
  }
  if (process.env.RERANK_LLM_FALLBACK === "true") {
    return rerankWithLlmFallback(query, hits, topN);
  }
  return hits.slice(0, topN);
}
```


---


## 8. 如何验证


| 条件                                                      | 期望                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| 默认 rerank 开（除非 `ENABLE_RERANKER=false`）+ 配 `RERANK_URL` | Wave F：Odyssey `0.72` ≫ noise `0.027`，`mode=dedicated`（FULL-FLOW 个案） |
| top1 sim < 0.35                                         | 触发改写；golden `g10` 问 Corrective 次数                                    |
| 改写抛错                                                    | 返回原 hits，HTTP 200                                                    |


```bash
yarn eval:phase-3:nightly   # golden 全量
```


---


## 9. 诚实边界

- **阈值 0.35 / 0.60** 为经验值，需按语料重标。
- **未接** Corrective 命中率 metrics。
- LLM rerank fallback 默认关，避免隐性成本。

---


## 10. 收束

1. **Rerank 管池内序，Corrective 管 query 不对齐。**
2. **最多 1 次改写**是硬约束（`skipCorrective`）；二次 hybrid **仍可能 rerank**。
3. 任何辅助 LLM 失败都 **return 原 hits**，检索主路径不 500。