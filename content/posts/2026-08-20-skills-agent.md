---
title: Skills 不是第五个 Agent：流程指南如何加载
slug: 2026-08-20-skills-agent
description: Personal GPT Phase 2 · 系列第 5 篇 0. 背景 Skill 文件是什么 仓库里有一类
  Markdown，路径类似 ：前面是 YAML frontmatter （文件头里用 包起来的元数据，这里只用到 / ），后面是正文流程说明——何时委派
  Retriever、无命中怎么写、不要把 skill…
author: 墨韵
date: 2026-08-20
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c3df5c0-26f4-81a1-b1eb-d7a42a7eb6d3
notionSyncedAt: 2026-08-21T10:14:38.415Z
---

> **Personal GPT Phase 2 · 系列第 5 篇**

## 0. 背景


### Skill 文件是什么


仓库里有一类 Markdown，路径类似 `skills/kb-retrieval/SKILL.md`：前面是 **YAML frontmatter**（文件头里用 `---` 包起来的元数据，这里只用到 `name` / `description`），后面是正文流程说明——何时委派 Retriever、无命中怎么写、不要把 skill 名当成 **handoff（递话筒）** 目标，等等。


它**不是**可运行的子程序，也**不是**图上的一个节点。


### Skill vs 子 Agent（对照）


|              | Skill 文件        | 子 Agent（专科）                                  |
| ------------ | --------------- | -------------------------------------------- |
| 形态           | 磁盘上的 `SKILL.md` | `createAgent({ name, tools, systemPrompt })` |
| 能否被 handoff  | **不能**          | 能（或 Sequential 边走到）                          |
| 有没有工具        | 无               | 有（受 caps 约束）                                 |
| 进 prompt 的方式 | 文本追加            | 整个 agent 图节点                                 |


常见翻车：Supervisor 把 `kb-retrieval` 当成要调度的 agent 名——于是「技能名」进了 handoff 列表，真正的 `retriever` 反而没人叫。所以加载器输出两份视图：

- **Supervisor**：只要名录（`formatSkillsOverview`）——省 token、降低「把 skill 当 agent」的诱惑；
- **专科**：注入对应 skill 的**正文**（`formatSkillForPrompt`）——流程细节给干活的人看。

默认启用三个：`kb-retrieval`、`web-research`、`report-writer`（可用环境变量 `ENABLED_SKILLS` 覆盖）。


**fail-open**：可选能力缺了也不把主链路打挂。这里指 skill 文件缺失时 warn 后跳过，图照常编译——演示不怕「少一个目录整站 500」，但演示前仍应扫一眼日志。


---


## 1. 开场矛盾


引入 Skills 时有两股拉力：

1. **想复用 Anthropic / Cursor 风格的 SKILL.md**，把流程写在仓库里，改文案不必改 TypeScript。
2. **图编排只认真正的子 Agent**（retriever / researcher / …）。若把 skill 名塞进 agents 列表，运行时会去找不存在的节点，或模型一本正经「委派 kb-retrieval」。

第二个矛盾：缺文件时要不要让进程挂掉？生产演示更怕「少了一个 skill 目录整站 500」。我们选择 **fail-open（缺了也继续）**：缺文件 warn 后跳过，图照常编译。


第三个矛盾：技能名若允许 `../` 或带路径分隔符，loader 就变成任意读文件。必须在加载前拒绝路径穿越。


## 2. 本篇目标


讲清手写 Skills loader：解析、启用列表、路径安全、Supervisor 名录 vs 专科正文、与建图的接线。


---


## 3. Skills loader


### 3.1 总览


| 层/部件                     | 做什么                          | 代价                 | 代码入口 |
| ------------------------ | ---------------------------- | ------------------ | ---- |
| `parseSkillMarkdown`     | frontmatter + body           | 极简正则，无 gray-matter | §6   |
| `loadEnabledSkills`      | 按名读 `skills/<name>/SKILL.md` | 同步读盘；缺则 skip       | §6   |
| `formatSkillsOverview`   | Supervisor 仅名录               | 省 token            | §6   |
| `formatSkillForPrompt`   | 单 skill 正文块给专科               | 追加 systemPrompt    | §6   |
| `createSpecialistAgents` | 按名 `findSkill` 注入            | 与默认三 skill 对齐      | §5   |


对外输出类型：


```typescript
// 加载成功后返回的结构：frontmatter 元数据 + 正文 body
type LoadedSkill = {
  name: string;        // 技能标识，如 kb-retrieval（不是 Agent 名 retriever）
  description: string; // 一句话说明，Supervisor 名录用
  body: string;        // Markdown 正文，注入专科 systemPrompt
};
```


### 3.2 为什么要这么做


流程文案（「先委派 Retriever」「禁止把 skill 名当 handoff」）变更频繁；硬编码进四个 agent 文件会漂移。Skill 文件让「产品口径」集中存放，同时**绝不**把 skill 注册成图节点——避免编排层与文档层混淆。


Supervisor 只看名录：它要决定找谁，不需要把整份检索手册再读一遍（那会与专科 prompt 冲突、烧 token）。


### 3.3 优势


| 对比对象                 | 本方案优势                    |
| -------------------- | ------------------------ |
| Skill = 第五个 Agent    | 无幽灵 handoff；图拓扑稳定        |
| Supervisor 也注入全文     | token 更省；减少指令打架          |
| 缺 skill 就 throw      | 演示环境少目录不至于整图起不来          |
| 引入 deepagents 文件系统后端 | Phase 2 依赖更重；手写 ~140 行够用 |
| 允许用户传入任意路径           | 路径穿越面大                   |


### 3.4 不做会怎么样


| 若取消…              | 会发生什么                          |
| ----------------- | ------------------------------ |
| 取消「不是子 Agent」声明   | Supervisor 易 handoff 到 skill 名 |
| Supervisor 注入全文   | token↑；与专科细节重复/冲突              |
| 缺文件 fail-closed   | 小配置错误 → 整站不可用                  |
| 不校验 `..` / `/`    | 可能读出 skills 根之外的文件             |
| 专科不注入 body        | 只有空壳 caps，流程口径全靠硬编码 prompt     |
| 把 ENABLED 写死且不可覆盖 | 本地关掉某个 skill 做对比实验变难           |


### 3.5 原理小结（数据流）


```plain text
ENABLED_SKILLS（或缺省三名）
  → 逐名校验（禁 .. / \）
  → 读 skills/<name>/SKILL.md
  → parseSkillMarkdown → LoadedSkill[]
  → Supervisor：formatSkillsOverview（仅列表）
  → Retriever/Researcher/Editor：formatSkillForPrompt(findSkill(...))
  → 追加到各 create*Agent 的 systemPrompt
  → Sequential：图上只有清单里的专科（无 Supervisor）
  → Supervisor 路径：四个专科 + Supervisor（不会出现名为 skill 的第五节点）
```


一句话原理：**Skill 是进 prompt 的说明书；Agent 才是图上的工人。**


注意：`createSupervisorWorkflow` 与 `createSpecialistAgents` 会各自调用 `loadEnabledSkills()`，热路径上是**两次同步读盘**（不是「加载一次、分发两份视图」）。


---


## 4. 方案取舍


| 方案                                | 优点       | 缺点 / 为何不选            |
| --------------------------------- | -------- | -------------------- |
| 无 Skills，全写死在 agent.ts            | 少一层      | 文案与「流程指南」难维护、难对齐验收口径 |
| Skill 注册为 LangGraph 节点            | 概念统一？    | 实际会制造假节点与错误 handoff  |
| npm skill 框架 / deepagents backend | 生态完整     | v2 过重；安全面变大          |
| **手写 loader + 双视图注入（采用）**         | 短、可控、可单测 | 不支持热更新远程技能包          |


---


## 5. 调用链


```plain text
createSpecialistAgents / createSupervisorWorkflow
  → loadEnabledSkills()
  → findSkill(skills, "kb-retrieval" | "web-research" | "report-writer")
  → formatSkillForPrompt → createRetriever/Researcher/EditorAgent({ skillPrompt })
  → createSupervisor({ prompt: buildSupervisorPrompt(formatSkillsOverview(skills), userText) })
```


Analyst 当前**不**注入 skill（无对应 DEFAULT 项）——数值分析边界写在 `createAnalystAgent` 自己的 systemPrompt 里。


---


## 6. 关键实现


以下为 loader 完整控制流（与仓库实现一致，可独立理解）：


```typescript
/**
 * 手写 Skills loader（D-00c / D-12 / D-13）。
 * 仅读仓库内 skills 根目录；不引入 deepagents FilesystemBackend。
 */

import fs from "node:fs";
import path from "node:path";

export type LoadedSkill = {
  name: string;
  description: string;
  body: string;
};

export type LoadSkillsOptions = {
  /** 仅测试可覆盖；生产固定 skills 根目录 */
  skillsRoot?: string;
  /** 覆盖 ENABLED_SKILLS 解析结果 */
  enabledNames?: string[];
};

const DEFAULT_ENABLED = ["kb-retrieval", "web-research", "report-writer"] as const;

/** 默认 skills 根：apps/agent-service/skills（相对本文件编译后路径） */
export function defaultSkillsRoot(): string {
  return path.resolve(__dirname, "../../skills");
}

// 解析 ENABLED_SKILLS 环境变量；未设置则用 DEFAULT_ENABLED 三名
function parseEnabledNames(raw: string | undefined): string[] {
  const source = raw ?? DEFAULT_ENABLED.join(",");
  return source
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 解析 SKILL.md：YAML frontmatter（name/description）+ body。
 * 极简解析，不引入 gray-matter。
 */
export function parseSkillMarkdown(raw: string): LoadedSkill {
  const trimmed = raw.replace(/^\uFEFF/, ""); // 去掉 UTF-8 BOM，避免 frontmatter 匹配失败
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    // 无 frontmatter：整段当 body，name/description 留空
    return { name: "", description: "", body: trimmed.trim() };
  }
  const fm = match[1];
  const body = match[2].trim();
  let name = "";
  let description = "";
  // 逐行解析 YAML 单行键值（只认 name / description）
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].trim();
    if (key === "name") name = val;
    if (key === "description") description = val;
  }
  return { name, description, body };
}

/**
 * 按 ENABLED_SKILLS 加载技能；缺失目录 fail-open（跳过 + warn），不抛垮进程。
 * 路径限制在 skillsRoot 下 join(name, SKILL.md)，不接受用户路径参数。
 */
export function loadEnabledSkills(options: LoadSkillsOptions = {}): LoadedSkill[] {
  const root = options.skillsRoot ?? defaultSkillsRoot();
  const names = options.enabledNames ?? parseEnabledNames(process.env.ENABLED_SKILLS);

  const out: LoadedSkill[] = [];
  for (const name of names) {
    // 拒绝路径穿越：skill 名只能是简单目录名，不能含 .. 或分隔符
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
      console.warn(`[skills] skip invalid skill name:${name}`);
      continue;
    }
    const filePath = path.join(root, name, "SKILL.md"); // 固定路径模式，不接受用户任意路径
    if (!fs.existsSync(filePath)) {
      console.warn(`[skills] skip missing skill:${name} (${filePath})`);
      continue; // fail-open：缺文件 warn 后跳过，不抛错
    }
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = parseSkillMarkdown(raw);
      out.push({
        name: parsed.name || name, // frontmatter 缺 name 时回退目录名
        description: parsed.description,
        body: parsed.body,
      });
    } catch (err) {
      console.warn(`[skills] skip unreadable skill:${name}`, err);
    }
  }
  return out;
}

/** 生成可追加到 systemPrompt 的 Skills 文本块（专科 Agent 用，含正文） */
export function formatSkillsForPrompt(skills: LoadedSkill[]): string {
  if (!skills.length) return "";
  const blocks = skills.map((s) => {
    const header = s.description ? `###${s.name} —${s.description}` : `###${s.name}`;
    return `${header}\n\n${s.body}`.trim();
  });
  return [
    "## Skills（流程指南，不是子 Agent）",
    "",
    "以下 Skills 仅指导流程与委派；切勿将 skill 名当作 handoff / subagent 目标。",
    "",
    ...blocks,
  ].join("\n");
}

/**
 * Supervisor 仅注入 Skills 名录（无正文），降低 token / 与专科指令冲突。
 * 流程细节由各专科 systemPrompt + 单 skill 注入承担。
 */
export function formatSkillsOverview(skills: LoadedSkill[]): string {
  if (!skills.length) return "";
  const lines = skills.map((s) =>
    s.description ? `-${s.name}：${s.description}` : `-${s.name}`,
  );
  return [
    "## Skills 名录（不是子 Agent）",
    "",
    "仅作路由参考；切勿将 skill 名当作 handoff / subagent 目标。流程细节已注入对应专科。",
    "",
    ...lines,
  ].join("\n");
}

/** 按 skill name 取单个已加载技能正文块（注入专用 Agent） */
export function formatSkillForPrompt(skill: LoadedSkill | undefined): string {
  if (!skill) return ""; // 缺 skill 时不追加，图照常编译
  return formatSkillsForPrompt([skill]);
}

// 在已加载列表里按 frontmatter name 查找（如 "kb-retrieval"）
export function findSkill(skills: LoadedSkill[], name: string): LoadedSkill | undefined {
  return skills.find((s) => s.name === name);
}
```


示例 skill 头（概念形状）：


```markdown
---
name: kb-retrieval
description: 企业内部知识库检索与引用整理，明确委派 Retriever 子 Agent
---

> **注意**：本技能是流程指南，**不是**子 Agent。请委派`retriever`，不要把`kb-retrieval` 当 handoff 目标。
```


---


## 7. 日志与可观测


```typescript
// 概念型观测：对比「想启用」与「实际加载成功」，排查 fail-open 静默跳过
type SkillsObs = {
  enabledNames: string[];  // 解析后的启用名单
  loadedNames: string[];   // 成功读盘的 skill
  skipped: Array<{ name: string; reason: "invalid" | "missing" | "unreadable" }>;
};
```


当前实现以 `console.warn('[skills] skip …')` 为主；Phase 2 **未**把 skip 计数接入正式 metrics。验收时看：Supervisor 轨迹/prompt 不应出现把 skill 名当 agent 的成功 handoff。


---


## 8. 如何验证


| 输入 / 条件                              | 期望                                                     |
| ------------------------------------ | ------------------------------------------------------ |
| 默认无 `ENABLED_SKILLS`                 | 加载到 kb-retrieval / web-research / report-writer（目录存在时） |
| `enabledNames: ["../etc"]`           | warn skip；不读盘外文件                                       |
| 缺少某 `SKILL.md`                       | warn skip；其余 skill 仍返回；进程不崩                            |
| `formatSkillsOverview`               | 含「不是子 Agent」；无长正文                                      |
| `formatSkillForPrompt(kb-retrieval)` | 含 body；建图后 Retriever systemPrompt 含该段                  |
| 单测 `load-skills.test.ts`             | 解析 frontmatter；真实 skills 根可加载                          |


---


## 9. 诚实边界

- 解析器是**极简** frontmatter：只认 `name` / `description` 单行；不支持复杂 YAML。
- fail-open 意味着「以为启用了某 skill、实际文件丢了」时只有 warn——演示前仍应看一眼日志。
- 未做：远程技能市场、按用户热切换、Skill 版本签名。
- Skill 正文里的规则仍是 prompt 层；真正防假引用靠工具协议 + 消毒。

---


## 10. 收束

1. Skill 解决「流程文案放哪」，不解决「图上有谁」。
2. Supervisor 看名录、专科看正文，是有意的信息不对称。
3. 路径校验 + fail-open，让 loader 适合可演示 MVP，而不是完美配置中心。
4. 下一篇把诚实检索从「口头叮嘱」收成 **HIT / NO_HIT 产品契约**。