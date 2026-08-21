---
title: LangSmith 可选追踪：观测要有，但不能绑死主路径
slug: 2026-08-20-langsmith
description: Personal GPT Phase 2 · 系列第 13 篇 0. 背景 可观测性（observability）
  ：系统跑起来后，你要能回答「刚才那次请求做了什么、卡在哪、调了哪些工具」。日志、轨迹面板（第 8 篇）、第三方追踪平台，都是手段。 LangSmith ：与
  LangChain / LangGraph 生…
author: 墨韵
date: 2026-08-20
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3c3df5c0-26f4-817b-a4ca-fb90f3e77e89
notionSyncedAt: 2026-08-21T10:13:27.588Z
---

> **Personal GPT Phase 2 · 系列第 13 篇**

## 0. 背景


**可观测性（observability）**：系统跑起来后，你要能回答「刚才那次请求做了什么、卡在哪、调了哪些工具」。日志、轨迹面板（第 8 篇）、第三方追踪平台，都是手段。


**LangSmith**：与 LangChain / LangGraph 生态配套的追踪服务。打开后，一次 Agent 运行可以在网页上看到调用树、耗时、输入输出摘要。对本项目是**可选增强**，不是登录墙。


**Fail-open（失败开放）**：观测挂了，**主业务仍要继续**。对比 fail-closed（观测挂了就拒绝服务）——支付对账可能要后者；个人 MVP Agent 追踪绝不能让「没配 API Key」变成 500。


**环境变量开关**：用配置决定「要不要上报」，而不是写死在代码分支里强迫每个人注册云账号。


---


## 1. 开场矛盾


多 Agent 调试时，你很想要「云端调用树」。但若强制依赖 LangSmith：

1. 本地没 Key → 整条 `/agent/chat` 起不来；
2. SDK `import` 失败或包装异常 → 可能把用户请求打挂；
3. 更糟：把业务函数包进 `try/catch` 后再跑一遍——**双重执行**（工具调用两次、账单双倍）。

矛盾是：**观测必须够用，但生死不能绑在观测供应商上。**


## 2. 本篇目标


讲清 Agent 侧 LangSmith 的接入契约：`LANGSMITH_TRACING=true` + `LANGSMITH_API_KEY` 才启用；默认 project `personal-gpt-agent`；`langsmith.ts` 提供 fail-open 的 `traceAgentRun`（fn 最多执行一次）。


**生产热路径并不包一层** **`traceAgentRun`**：主要靠 `main.ts` / `ensureAgentLangSmithEnv` 写环境变量，让 LangChain/LangGraph 在启用时自动上报；站内 SSE 轨迹（第 8 篇）默认总开、与云端无关。


## 3. 机制：为什么、优势、不做会怎样、原理


### 3.1 总览


| 部件                        | 做什么                   | 代价                  |
| ------------------------- | --------------------- | ------------------- |
| `ensureAgentLangSmithEnv` | 检查开关与 Key；写默认 project | 进程内 `configured` 单次 |
| `traceAgentRun`           | 可选 `traceable` 包装     | 动态 import；失败回退      |
| 产品内 `data-agent-trace`    | 不依赖云                  | 已在第 8 篇             |


### 3.2 为什么


演示与排障需要调用树；贡献者 / 评审不一定人人有 LangSmith 账号。Fail-open 让「有 Key 的人看得更细」，「没 Key 的人照样验收」。


### 3.3 优势


| 对比             | 本方案            |
| -------------- | -------------- |
| 强制云追踪          | 本地可离线跑通        |
| 无任何追踪          | 仍有第 8 篇 SSE 轨迹 |
| catch 住 fn 再重试 | 避免双重执行         |


### 3.4 不做会怎么样


| 取消…                  | 后果           |
| -------------------- | ------------ |
| 取消 fail-open         | 没 Key 即 500  |
| setup 失败仍抛           | 同上           |
| 把 `fn()` 放进 catch 再调 | 工具/计费双跑      |
| 无默认 project          | 追踪散落到默认项目，难找 |


### 3.5 原理小结


```plain text
请求进入
  → ensureAgentLangSmithEnv()
      → 无 key 或未 tracing → 直接 fn()
      → 有 → 动态 import langsmith/traceable
           → 包装失败 → fn()（不重跑）
           → 包装成功 → wrapped()
  → 主路径结果返回用户（与是否上报无关）
```


一句话：**观测是插件，不是电源开关。**


## 4. 方案取舍


| 方案                            | 为何不选 / 选                 |
| ----------------------------- | ------------------------ |
| OpenTelemetry 自建              | 重；本阶段要的是 LangGraph 生态现成树 |
| 只靠 console.log                | 多专科树难读                   |
| **可选 LangSmith + 强制站内轨迹（采用）** | 云可选、站内验收不断档              |


## 5. 调用链


```plain text
进程启动 main.ts
  → ensureAgentLangSmithEnv()（有 Key + TRACING=true 才写 env）

streamChat
  → ensureLangSmithProjectHint()（站内轨迹 meta 用；可无 Key 也写默认 project 名）
  → 不调用 traceAgentRun；启用时依赖 LangGraph/LangChain 环境自动上报
  → 同时 createAgentTraceCollector 写 SSE 轨迹（独立、默认总开）
```


`traceAgentRun` 仍是模块对外工具函数（单测覆盖「无 Key 直接跑 / 有 Key 则包装」），**尚未挂到** **`streamChat`** **热路径**。


## 6. 关键实现（完整核心）


```typescript
// 进程内只配置一次 env，避免重复写 LANGSMITH_* 变量
let configured = false;

/** 配置 env；未启用时返回 false（调用方照常执行，不抛错） */
export function ensureAgentLangSmithEnv(): boolean {
  if (configured) return true; // 已配过直接短路

  const key = process.env.LANGSMITH_API_KEY?.trim();
  const tracingOn = process.env.LANGSMITH_TRACING === "true";

  if (!key || !tracingOn) {
    return false; // fail-open：没 Key 或未开开关 → 不追踪，但不阻断业务
  }

  process.env.LANGSMITH_TRACING = "true";
  process.env.LANGSMITH_API_KEY = key;
  if (!process.env.LANGSMITH_PROJECT?.trim()) {
    process.env.LANGSMITH_PROJECT = "personal-gpt-agent"; // 默认项目名，避免散落
  }

  configured = true;
  return true;
}

export function isAgentLangSmithActive(): boolean {
  return ensureAgentLangSmithEnv(); // 语义糖：是否已启用 LangSmith
}

/** 可选包装：无 key 时直接跑 fn；setup 失败才回退 fn，保证 fn 最多执行一次 */
export async function traceAgentRun<T>(
  name: string,
  metadata: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
  if (!ensureAgentLangSmithEnv()) {
    return fn(); // 未启用：原样执行，零追踪开销
  }

  let wrapped: (() => Promise<T>) | undefined;
  try {
    const { traceable } = await import("langsmith/traceable"); // 按需加载，没 Key 时不强依赖包
    const clean = Object.fromEntries(
      Object.entries(metadata).filter(
        (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0,
      ),
    ); // 去掉 undefined/空串，避免脏 metadata 进云端
    wrapped = traceable(fn, { name, metadata: clean }) as () => Promise<T>;
  } catch {
    // fail-open：仅包装失败时回退；不把 fn 执行包进 catch，避免双重执行
    return fn();
  }

  return wrapped(); // 包装成功：由 traceable 上报，fn 仍只跑一次
}

/** 测试用：重置单例，让各用例可独立改 env */
export function resetAgentLangSmithConfigForTests(): void {
  configured = false;
}
```


启用方式（概念上）：


```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=...          # 勿提交进 git
# 可选：export LANGSMITH_PROJECT=personal-gpt-agent
```


## 7. 日志与可观测


站内轨迹 `meta.langsmithProject` 可带上项目名，方便人肉对齐云端。


**没有**「追踪覆盖率 %」之类 KPI——本阶段只保证：开了能报，关了能跑。


## 8. 如何验证


| 条件                              | 期望                                                        |
| ------------------------------- | --------------------------------------------------------- |
| 不设 Key                          | Agent 主链路仍 200 SSE；轨迹面板仍有事件                               |
| `TRACING=true` + 有效 Key         | LangSmith 出现 `personal-gpt-agent` 下运行（依赖框架自动上报）           |
| `traceAgentRun` 单元：无 Key / 包装成功 | fn 只执行一次；**import 失败路径目前无专门单测**（代码意图是 catch 后单次回退 `fn()`） |


## 9. 诚实边界

- 免费 LangSmith 额度、字段脱敏、PII 策略未做企业级治理。
- 动态 `import` 依赖打包器支持；若边缘运行时禁动态导入，会走回退。
- 云端树 ≠ 产品内时间线；验收仍以第 8 篇 SSE 为准。

## 10. 收束

1. 观测是加速排障的插件。
2. Fail-open + 单次执行，是对「追踪 SDK」最大的不信任设计。
3. 站内轨迹保验收；云端树给有 Key 的人。