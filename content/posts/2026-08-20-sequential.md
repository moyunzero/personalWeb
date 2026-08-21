---
title: 多步任务为何改走 Sequential 边：清单启发式与确定性流水线
slug: 2026-08-20-sequential
description: Personal GPT Phase 2 · 系列第 1 篇 下一篇：流式消毒与 BFF 0. 背景 大模型 会根据「系统提示词 +
  对话」生成下文。若再给它 工具 （查库、搜网），它可以通过一种叫 tool calling
  的约定：先输出「我要调用某某工具」，程序执行后把结果塞回对话，再继续生成。 多 Agent 在…
author: 墨韵
date: 2026-08-20
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c3df5c0-26f4-8118-a813-eb609195a9b8
notionSyncedAt: 2026-08-21T10:14:46.134Z
---

> **Personal GPT Phase 2 · 系列第 1 篇**  下一篇：[流式消毒与 BFF](./phase-2-02-stream-bff-short-circuit.md)

---


## 0. 背景


**大模型**会根据「系统提示词 + 对话」生成下文。若再给它**工具**（查库、搜网），它可以通过一种叫 _tool calling_ 的约定：先输出「我要调用某某工具」，程序执行后把结果塞回对话，再继续生成。


**多 Agent** 在本项目里不是多个真人，而是：**同一类模型，换成不同提示词与工具权限**，假装成不同工种。


**Supervisor（调度员）** 负责点名「下一个找谁」。


**Handoff（递话筒）** 就是调度员把下一棒交给某个专科——成功与否取决于模型是否听话。


**hub-and-spoke（轮毂—辐条）**：中间一个 Supervisor，四周专科；每走一步往往要回到轮毂再 handoff。


**Sequential（顺序流水线）** 更死板：事先画好箭头 `A → B → C`，到点自动往下走，不靠调度员临时决定。


**Nudging / 强制续跑（白话）**：服务端发现「清单上的人还没出场」，再塞一条人类消息催 Supervisor 继续——像劝架，又慢又烧配额。


**启发式 / 正则**：用规则（关键词、正则表达式）从用户中文任务句里猜要不要强制专科；**不是**自然语言理解（NLU）模型。漏检 / 误检都可能。


**图（Graph）**：把「先谁后谁」画成节点和边；运行时按边走。LangGraph 是实现这种图的一种库——你只需记住「有节点、有边、能流式吐事件」。


**checkpointer（会话存档器）**：编译图时传入的存储；同 `thread_id` 才能接着上次状态（细节见第 11 篇）。


**TPM / 429**：供应商按「每分钟 token（TPM）」限流；超了常回 HTTP **429**。此时图边可能编对了，但中间专科仍会 `error`——先查配额再查编排。


为何要纠结顺序？因为「先查库再联网再写报告」是**产品承诺**；若只写在提示词里劝模型「一定要做完」，模型可能查完库就收工——承诺变成概率。


---


## 1. 开场矛盾


用户说：「先查知识库里关于 X 的资料，再联网补充优缺点，最后整理成一份带对比表和引用的 Markdown 报告。」


产品期望是固定剧本：**Retriever → Researcher → Editor**。最早我们把这件事交给 Supervisor：靠 system prompt 喊「必须按顺序 handoff，全部完成前禁止结束」。


跑起来后出现两种难看的失败：

1. **提前收工**：Retriever 吐出「知识库无命中」后，Supervisor 把这段当终稿，联网与报告从未发生。
2. **强制续跑护栏**：服务端发现缺专科，再用 `HumanMessage` 捅 Supervisor 继续——主路径依赖「LLM 听不听话 + 外层 nudging（催一下）」，延迟与 token 双涨，调试像在劝架。

矛盾很具体：**多步清单是产品契约，却被实现成了概率行为。**


第二个张力：闲聊与多步不能共用同一条编排。若「你好」也进 Supervisor，你会为寒暄付整图启动费。


## 2. 本篇目标


讲清：**从用户原文推断专科清单；清单长度 ≥ 2 时编译确定性 Sequential 子图；否则才走开放 Supervisor。**


不负责流式 UI、不负责 KB 相似度门槛。


## 3. Sequential 与清单


### 3.1 总览


| 层/部件                               | 做什么                                 | 代价               | 代码入口    |
| ---------------------------------- | ----------------------------------- | ---------------- | ------- |
| `inferRequiredSpecialists`         | 正则从用户句抽出专科序列                        | 启发式漏检 / 误检       | 下文 §6.1 |
| `shouldUseSequentialPipeline`      | `required.length >= 2` → Sequential | 短任务仍走 Supervisor | §6.2    |
| `ensureTerminalEditor`             | 多专科时强制 editor 收束                    | 多一次定稿 LLM        | §6.2    |
| `createSequentialPipelineWorkflow` | `START→…→END` 硬边                    | 失去开放重规划          | §6.2    |
| Supervisor                         | 无强制清单时的 hub-and-spoke               | handoff 概率失败     | §6.2    |


对外输出类型：编译后的 LangGraph，消息状态沿边流动；UI 侧用步骤事件观察「当前专科」。


短路求值直觉：


```plain text
userText
  → inferRequiredSpecialists
  → length >= 2 ? Sequential(edges) : Supervisor(prompt checklist)
  → （外层）chitchat ? short_reply : 上述协作子图
```


### 3.2 为什么要这么做


多步任务的失败成本不对称：

- **漏跑 Researcher**：报告只能空转 KB miss 脚注，产品叙事崩掉。
- **漏跑 Editor**：用户看到专科中间话术或「请等待」。
- **多跑一轮强制续跑**：每次多一次完整模型往返；免费层按 **TPM（每分钟 token）** 限流时，很快就会碰到 HTTP **429**。

把「必须跑完的人」从 prompt 劝说改成 **图边**，等于把契约从自然语言挪到控制流。Supervisor 仍保留给「说不清步骤」的开放问题，而不是删掉。


### 3.3 优势


| 对比对象                    | 本方案优势                            |
| ----------------------- | -------------------------------- |
| 纯 Supervisor + 长 prompt | 主路径不依赖 handoff 服从度；日志里边是确定的      |
| 一律 Sequential           | 单专科 / 模糊意图仍可用 Supervisor 灵活调度    |
| 只靠服务端强制续跑               | Sequential 时续跑循环可跳过，省 token 与复杂度 |


### 3.4 不做会怎么样


| 若取消…                      | 会发生什么                                |
| ------------------------- | ------------------------------------ |
| 取消清单启发式                   | 多步句无法自动进 Sequential，退回「劝 Supervisor」 |
| 取消 Sequential 硬边          | 再次依赖 handoff；KB miss 后易提前结束          |
| 取消 `ensureTerminalEditor` | 可能停在 Researcher 摘要，用户看不到报告骨架         |
| 取消外层闲聊短路                  | 「你好」烧整图；步骤面板闪一堆无意义专科                 |
| 取消「拒联网」正则                 | 用户写「不要联网」仍可能进 researcher             |


### 3.5 原理小结（数据流）


```plain text
POST /agent/chat
  → parse body（messages / thread_id / workspaceId）
  → last user text
  → isAgentChitchat? → short_reply → END
  → inferRequiredSpecialists(text)
  → ≥2 专科 → StateGraph: specialist₁ → … → editor → END
  → 否则 → createSupervisor(agents, prompt+可选清单)
  → toUIMessageStream → 浏览器步骤 / 正文
```


一句话原理：**多步契约用边保证；开放问题才用 Supervisor。**


## 4. 方案取舍


| 方案                           | 优点     | 缺点 / 为何不选              |
| ---------------------------- | ------ | ---------------------- |
| 仅强化 Supervisor prompt        | 改动小    | 服从度不稳定；已实测提前收工         |
| 仅服务端强制续跑                     | 能补洞    | 主路径变 nudging；TPM / 延迟差 |
| CrewAI 式顺序队列表（另一框架）          | 语义接近   | 已选 LangGraph；不想双运行时    |
| **清单启发式 + Sequential 边（采用）** | 契约进控制流 | 正则会漏；需与拒联网等规则共存        |
| 每次都让 LLM 输出 JSON 计划再编译图      | 灵活     | 多一跳、计划本身会幻觉步骤          |


也曾想过把强制续跑「收进 Graph」当唯一手段——那只是把 nudging 换皮。Sequential 从根上让主路径不需要 nudge。


## 5. 调用链


```plain text
用户多步句
  → inferRequiredSpecialists → ["retriever","researcher","editor"]
  → shouldUseSequentialPipeline → true
  → ensureTerminalEditor（保证 editor 在尾）
  → addNode(retriever/researcher/editor) + 顺序 addEdge
  → stream updates → UI：步骤 active/completed
  → Editor 终稿 → 引用 / 轨迹事件
```


## 6. 关键实现


### 6.1 从用户句推断专科清单


```typescript
type SpecialistName = "retriever" | "researcher" | "analyst" | "editor";

// 各正则对应一种专科意图；REFUSES_WEB 优先于 WEB，避免「不要联网」仍进 researcher
const KB_RE = /知识库|企业.?库|内部.?文档|kb\b|引用/i;
const WEB_RE = /联网|搜索|web|网页|优缺点|外部.?资料|调研/i;
const REPORT_RE = /报告|markdown|简报|编辑|定稿|整理成|写成/i;
const ANALYST_RE = /数值对比|定量分析|用计算器|算一下|calculator/i;
const REFUSES_WEB_RE =
  /不要使用联网搜索|不要用网络搜索|禁止访问互联网|不要联网|无需联网|不用联网|禁止联网|别联网|不要进行网络搜索|请勿访问外网|仅使用知识库/i;

// 关键词同位置出现时，用默认序打破并列（查库→联网→分析→定稿）
const DEFAULT_ORDER: Record<SpecialistName, number> = {
  retriever: 0,
  researcher: 1,
  analyst: 2,
  editor: 3,
};

/** 无多步线索时返回 []（不强制）。顺序按关键词首次出现；并列用默认序。 */
export function inferRequiredSpecialists(userText: string): SpecialistName[] {
  const t = (userText ?? "").trim();
  if (!t) return [];

  const wantsKb = KB_RE.test(t);
  const refusesWeb = REFUSES_WEB_RE.test(t);
  const wantsWeb = WEB_RE.test(t) && !refusesWeb;
  const wantsReport = REPORT_RE.test(t);
  // 「带对比表」交给 editor 排版，不强制 analyst
  const wantsAnalyst = ANALYST_RE.test(t);

  // idx = 关键词在句中首次出现位置，供后面按用户叙述顺序排序
  const need: { name: SpecialistName; idx: number }[] = [];
  if (wantsKb) need.push({ name: "retriever", idx: t.search(KB_RE) });
  if (wantsWeb) need.push({ name: "researcher", idx: t.search(WEB_RE) });
  if (wantsAnalyst) need.push({ name: "analyst", idx: t.search(ANALYST_RE) });
  if (wantsReport) need.push({ name: "editor", idx: t.search(REPORT_RE) });

  // 「查库+写报告」虽只两个意图，也视为多步契约
  const comboReport = wantsReport && (wantsKb || wantsWeb);
  if (!(need.length >= 2 || comboReport)) return [];

  need.sort((a, b) => {
    if (a.idx !== b.idx) return a.idx - b.idx;
    return DEFAULT_ORDER[a.name] - DEFAULT_ORDER[b.name];
  });
  return need.map((n) => n.name);
}
```


### 6.2 Sequential 编译与路由选择


```typescript
import { END, START, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import type { LanguageModelLike } from "@langchain/core/language_models/base";

// 清单长度≥2 才走顺序流水线；单专科仍交给 Supervisor 灵活调度
export function shouldUseSequentialPipeline(required: SpecialistName[]): boolean {
  return required.length >= 2;
}

/** 多专科流水线保证以 editor 收束 */
export function ensureTerminalEditor(pipeline: SpecialistName[]): SpecialistName[] {
  if (pipeline.length === 0) return pipeline;
  const ordered = [...pipeline];
  if (ordered.length >= 2 && ordered[ordered.length - 1] !== "editor") {
    if (!ordered.includes("editor")) ordered.push("editor");
    else {
      // 已有 editor 但不在末尾：挪到最后一棒，避免停在 researcher 摘要
      const without = ordered.filter((n) => n !== "editor");
      ordered.splice(0, ordered.length, ...without, "editor");
    }
  }
  return ordered;
}

type SpecialistBundle = {
  retriever: { graph: unknown };
  researcher: { graph: unknown };
  analyst: { graph: unknown };
  editor: { graph: unknown };
};

declare function createSpecialistAgents(model: LanguageModelLike): SpecialistBundle;
declare function createSupervisor(opts: unknown): { compile: (c: unknown) => unknown };
declare function buildSupervisorPrompt(skills: string, userText: string): string;

/** 确定性边：不依赖 Supervisor LLM handoff */
export function createSequentialPipelineWorkflow(
  model: LanguageModelLike,
  pipeline: SpecialistName[],
) {
  if (pipeline.length === 0) {
    throw new Error("sequential pipeline requires at least one specialist");
  }
  const ordered = ensureTerminalEditor(pipeline);
  const agents = createSpecialistAgents(model);
  // 硬编 START→专科₁→…→专科ₙ→END，不靠 Supervisor handoff
  let g: any = new StateGraph(MessagesAnnotation);
  for (const name of ordered) {
    g = g.addNode(name, agents[name].graph);
  }
  g = g.addEdge(START, ordered[0]);
  for (let i = 0; i < ordered.length - 1; i++) {
    g = g.addEdge(ordered[i], ordered[i + 1]);
  }
  g = g.addEdge(ordered[ordered.length - 1], END);
  return g;
}

export async function buildSupervisorGraph(options: {
  model?: LanguageModelLike;
  userText?: string;
  checkpointer?: unknown;
}) {
  const model = options.model!;
  const userText = options.userText ?? "";
  const required = inferRequiredSpecialists(userText);
  if (shouldUseSequentialPipeline(required)) {
    // 多步契约：编译确定性子图
    return createSequentialPipelineWorkflow(model, required).compile({
      checkpointer: options.checkpointer,
    });
  }
  // 开放模式：createSupervisor + 可选「强制清单」追加进 prompt（兜底）
  return createSupervisor({
    /* agents + buildSupervisorPrompt(..., userText) */
  }).compile({ checkpointer: options.checkpointer });
}
```


开放 Supervisor 模式下，服务端仍可保留「缺专科则 HumanMessage 强制续跑」作兜底；**Sequential 主路径不再依赖它**。


## 7. 日志与可观测


真实可观测字段不是自定义 `pipelineMode`，而是：

- 意图摘要字符串：`路由=supervisor；强制专科=[retriever, researcher, editor]`（或 `无`）；
- 专科事件文案：`确定性流水线 · retriever → editor（无 Supervisor handoff）`；
- 步骤面板：多步时标题含「顺序流水线 / 确定性边：…」。

开放 Supervisor 仍保留强制续跑兜底：`MAX_FORCE_CONTINUE_ROUNDS = 3`；若清单含 editor 且已跑过 editor 但可见正文 < 200 字，还会再 nudge 一次要报告正文。


线上若只有 Supervisor 完成、后面专科 `error`，先查模型 **429（TPM 限流）** / 超时，再查边是否根本没编进 Sequential。


Phase 2 **未接**成功率 / P95 指标门禁；轨迹事件是人工与 smoke 的主证据。


## 8. 如何验证


| 输入 / 条件                          | 期望                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| 「先查知识库…再联网…整理成 Markdown 报告」      | `infer` 含 retriever+researcher+editor；走 Sequential                                      |
| 「仅使用知识库并写一份 Markdown 报告，不要联网」    | 有 retriever+editor；**无** researcher（注意：只说「总结」不说「报告/Markdown」时，启发式可能返回空清单，不进 Sequential） |
| 「你好」                             | 外层短路，不进本篇协作子图                                                                           |
| KB miss 的多步句                     | Sequential 仍应进入后续 researcher/editor（除非上游模型/配额中断）                                        |
| 单元：`inferRequiredSpecialists` 单测 | 关键词序与拒联网用例通过                                                                            |


## 9. 诚实边界

- 清单是**中文任务句启发式**，换说法可能漏检；不是 NLU。
- Sequential **不能中途重规划**（例如检索后改只写三行摘要）——要灵活就走 Supervisor。
- 免费层 TPM 下，三专科串联仍可能在 Researcher 前 429；边保证的是「会尝试跑下一段」，不是「供应商一定给额度」。
- Skills 正文只注入专科，Supervisor 侧通常只挂名录，避免指令互相踩。

## 10. 收束

1. 多步失败的根因是「契约在 prompt 里」。
2. 清单启发式把契约变成可编译的节点序。
3. Sequential 硬边让主路径离开强制续跑。
4. Supervisor 留给开放问题，而不是删掉。