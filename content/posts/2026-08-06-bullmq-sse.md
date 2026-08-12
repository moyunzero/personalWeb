---
title: 文档为何必须异步入库：BullMQ 流水线与 SSE 进度
slug: 2026-08-06-bullmq-sse
description: Personal GPT Phase 1
author: 墨韵
date: 2026-08-06
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3badf5c0-26f4-809e-a119-c0d2425ecf45
notionSyncedAt: 2026-08-12T05:16:28.528Z
---

## 1. 矛盾


知识库的「上传」在产品上是一个按钮，在工程上却是：读 PDF、切块、批量 embedding、写向量库。这些步骤经常是**秒级到分钟级**。


最先撞上的问题很朴素：**为什么不能在上传接口里直接做完？**


同步看起来最短——一个请求走完，成功就 `ready`，失败就报错。落到运行时却有三处硬伤：

1. **超时**：反向代理 / Serverless / 平台网关常见 30s～60s 上限。大 PDF 解析 + 上百次 embedding，很容易在网关层被掐断；客户端看到 504，服务端可能还在跑，状态谁说了算？
2. **进程资源**：Node 是单线程事件循环。同步解析 PDF、大批量 `embedMany` 会长时间占用 CPU / 占满外呼连接池；同一进程上的聊天接口首字延迟一起被拖垮——不是「慢一点」，是**整站交互一起抖**。
3. **失败收尾**：请求一断，半截向量还在不在库里？谁负责标 `failed`？没有任务实体，就没有重试入口。

所以「能不能同步」很快变成「同步失败时系统还剩什么」。


第二个问题紧跟着来：**用户已经点了确认，为什么还要再等一屏空白？**


他们需要即时反馈：列表里立刻出现文档，并能看到卡在解析、切块还是向量化。进度不是锦上添花，而是「系统还活着」的证明。


## 2. 本篇目标


讲清一种可落地的拆法：**Web 只做校验、落盘、入队；常驻 Worker 跑四阶段流水线；浏览器用 SSE 听进度。**


下文会把表结构、重试与幂等、安全约束、扩展与观测一起写清楚——这些才是异步入库真正难的部分。


## 3. 方案取舍


### 3.1 同步 / Serverless / 队列


| 方案                  | 优点            | 缺点                  |
| ------------------- | ------------- | ------------------- |
| 同步在 HTTP Handler 做完 | 实现短           | 超时、拖垮聊天、失败难收尾       |
| 纯 Serverless 短函数    | 部署省           | 执行时长、冷启动、本地文件路径都不友好 |
| **队列 + 常驻 Worker**  | 与聊天解耦，可重试、可进度 | 多 Redis 与一个进程       |


也曾想过：为什么不直接 `setImmediate` / 后台 Promise？


进程内异步解决不了「Web 重启丢任务」「要重试策略」「多实例抢同一文件」。队列把「谁来做」从「当前请求」里剥离：任务落在 Redis，Worker 挂了重启还能消费；`concurrency` 也能单独调。


### 3.2 为什么是 BullMQ，而不是别的


选型时真正比的不是「有没有队列」四个字，而是：**进度事件、重试、Node 生态、运维成本**。


| 选项                | 何时合适                                          | 本项目为何没选 / 选了                              |
| ----------------- | --------------------------------------------- | ----------------------------------------- |
| **BullMQ（Redis）** | Node 侧要 progress 事件、attempts/backoff、Nest 集成顺 | **采用**：`QueueEvents` 直接喂 SSE；和现有 Redis 复用 |
| **pg-boss**       | 想少一个中间件、任务量不大                                 | PG 已有负载；缺「原生 progress → SSE」这条短路径         |
| **AWS SQS**       | 已在 AWS、要托管削峰                                  | 进度要另建通道；本地开发与文件路径模型更别扭                    |
| **自建 Redis List** | 极简 Demo                                       | 重试、死信、并发、progress 全要手写，迟早重造 Bull          |


结论很务实：不是 BullMQ「最正确」，而是在 **Node + 要进度流 + 已有 Redis** 的约束下，它让实现最短。


### 3.3 若用 Lambda + SQS 重写，会撞什么


这条路不是不能做，但问题形状会变：

- **执行时长与分阶段**：一次 parse→embed→upsert 可能超过函数超时，往往要拆成多条消息、多阶段状态机。
- **本地** **`uploads/`** **路径失效**：要先把文件丢进 S3，payload 里传 object key，Worker（Lambda）再拉——多一跳、多权限面。
- **进度推送**：SQS 不提供 Bull 那种 `updateProgress`；要另写 Dynamo/PG 进度 + API 轮询或 AppSync。
- **冷启动 + embedding 外呼**：突发上传时延迟抖动更明显。

Phase 1 选常驻 Worker，是故意把「文件在磁盘、进度在 Redis 事件」留简单；上云再迁存储与队列，而不是一上来用 Serverless 硬套分钟级流水线。


进度通道选 SSE 而不是 WebSocket：入库是单向推几次事件，`EventSource` 够用；断线重连时先推 PostgreSQL 当前进度即可。


本项目：队列名 `ingest`，Worker **concurrency = 2**——embedding / 解析吃 CPU 与 API 配额，宁可排队，也不要一次打爆限流。


## 4. 调用链与表结构


```plain text
浏览器上传
  → Web：校验 MIME/大小 → 写入 uploads/ → PostgreSQL 插入 pending 文档 + job
  → BullMQ Queue.add(payload)（attempts=3）
  → Worker：parse → split → embed → upsert（进度 25/50/75/100）
  → 更新 documents / ingest_jobs
  → 浏览器 EventSource 收 progress / completed / failed
```


### 4.1 表结构草图


两张表回答两个问题：用户看见什么文档、任务卡在哪。


```sql
-- 文档：产品列表的真相
CREATE TABLE documents (
  id            UUID PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id),
  title         VARCHAR NOT NULL,
  source        VARCHAR,
  category      VARCHAR,
  tags          JSONB NOT NULL DEFAULT '[]',
  status        VARCHAR NOT NULL DEFAULT 'pending', -- pending|processing|ready|failed
  chunk_count   INT NOT NULL DEFAULT 0,
  file_path     TEXT,
  mime_type     VARCHAR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 任务：进度流 / 运维排查的真相
CREATE TABLE ingest_jobs (
  id            UUID PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status        VARCHAR NOT NULL DEFAULT 'queued', -- queued|active|completed|failed
  progress      INT NOT NULL DEFAULT 0,           -- 0|25|50|75|100
  error         TEXT,
  bull_job_id   VARCHAR,                          -- 关联 BullMQ job.id
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```


BullMQ 自己也有 job state，但**浏览器刷新后仍以 PostgreSQL 为准**——Redis 事件会丢，库表不会。


### 4.2 状态机：如何避免「ready 但没向量」


危险顺序是：先标 `ready`，再 upsert。进程若在中间挂掉，列表显示可问，检索却为空。


正确契约只有一句：**`ready`** **只能出现在 upsert 成功之后。**


```plain text
pending ──入队──► processing ──upsert 成功──► ready
                      │
                      └──任何阶段抛错──► failed（并尽力 deleteByDocument）
```


进度用阶段点（0/25/50/75/100）而不是按页/按字节：用户要的是「卡在哪一阶段」，不是「第 37 页百分之几」。卡在 50% = 已 split、还没 embed——排查时直接去看 embedding 外呼，而不是猜进度条算法。


## 5. 关键实现（完整核心）


### 5.1 载荷与重试策略


```typescript
type WorkspaceId = string;
type DocumentStatus = "pending" | "processing" | "ready" | "failed";
type IngestJobStatus = "queued" | "active" | "completed" | "failed";

interface IngestJobPayload {
  workspaceId: WorkspaceId;
  documentId: string;
  filePath: string;
  mimeType: string;
  title?: string;
  category?: string;
  tags?: string[];
}

/** 入队默认选项：失败最多再试，间隔固定 1s */
const INGEST_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "fixed" as const, delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};
```


重试一旦打开，立刻引出更高风险的问题：**会不会重复写向量？**


答案不能指望「别重试」，而要让 **upsert 本身幂等**。瞬时网络错误值得重试；解析器确定性失败（坏 PDF）重试三次只会烧配额——更理想的后续是按错误类型区分 `attempts`，Phase 1 先统一 3 次，靠失败清理兜底。


### 5.2 Worker：四阶段流水线


```typescript
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Job } from "bullmq";

const INGEST_QUEUE_NAME = "ingest";

@Injectable()
@Processor(INGEST_QUEUE_NAME, { concurrency: 2 })
export class IngestProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestProcessor.name);

  async process(job: Job<IngestJobPayload>): Promise<void> {
    const { workspaceId, documentId, filePath, mimeType, title, category, tags } =
      job.data;

    // 入队后再次校验大小，防止文件被替换成超大内容
    const maxBytes = Number(process.env.UPLOAD_MAX_BYTES ?? 20 * 1024 * 1024);
    const stat = await fs.stat(filePath);
    if (stat.size > maxBytes) {
      throw new Error(`File exceeds upload limit: ${stat.size} bytes`);
    }

    await this.markDocument(documentId, workspaceId, { status: "processing" });
    await this.markJob(job, { status: "active", progress: 0 });
    await job.updateProgress(0);

    try {
      const text = await parseDocument(filePath, mimeType);
      await job.updateProgress(25);
      await this.markJob(job, { progress: 25 });

      const chunks = await splitText(text); // chunkSize=900, overlap=100
      await job.updateProgress(50);
      await this.markJob(job, { progress: 50 });

      const vectors = await embedTexts(chunks); // passage 模式；查询侧必须用 query
      await job.updateProgress(75);
      await this.markJob(job, { progress: 75 });

      const records = chunks.map((text, chunkIndex) => ({
        workspaceId,
        documentId,
        chunkIndex,
        text,
        vector: vectors[chunkIndex]!,
        title,
        category,
        tags,
      }));
      await upsertChunks(records); // 内部：先删后写，保证重试幂等
      await job.updateProgress(100);

      // 关键：只有 upsert 成功才标 ready
      await this.markDocument(documentId, workspaceId, {
        status: "ready",
        chunkCount: chunks.length,
      });
      await this.markJob(job, { status: "completed", progress: 100, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Ingest failed for ${documentId}: ${message}`, {
        workspaceId,
        documentId,
        bullJobId: String(job.id),
        progress: job.progress,
        attempt: job.attemptsMade,
      });

      try {
        await vectorStore.deleteByDocument(workspaceId, documentId);
      } catch (cleanupErr) {
        this.logger.warn(`vector cleanup failed: ${String(cleanupErr)}`);
      }

      await this.markDocument(documentId, workspaceId, { status: "failed" });
      await this.markJob(job, { status: "failed", error: message });
      throw error; // 交给 BullMQ 按 attempts 重试
    }
  }

  private async markDocument(
    documentId: string,
    workspaceId: string,
    patch: { status: DocumentStatus; chunkCount?: number },
  ) {
    await db.query(
      `UPDATE documents
       SET status = $1,
           chunk_count = COALESCE($2, chunk_count),
           updated_at = NOW()
       WHERE id = $3 AND workspace_id = $4`,
      [patch.status, patch.chunkCount ?? null, documentId, workspaceId],
    );
  }

  private async markJob(
    job: Job<IngestJobPayload>,
    patch: { status?: IngestJobStatus; progress?: number; error?: string | null },
  ) {
    await db.query(
      `UPDATE ingest_jobs
       SET status = COALESCE($1, status),
           progress = COALESCE($2, progress),
           error = COALESCE($3, error),
           updated_at = NOW()
       WHERE bull_job_id = $4`,
      [patch.status ?? null, patch.progress ?? null, patch.error ?? null, String(job.id)],
    );
  }
}

declare const db: { query: (sql: string, params: unknown[]) => Promise<unknown> };
declare const fs: typeof import("node:fs/promises");
declare function parseDocument(filePath: string, mimeType: string): Promise<string>;
declare function splitText(text: string): Promise<string[]>;
declare function embedTexts(texts: string[]): Promise<number[][]>;
declare function upsertChunks(records: ChunkRecord[]): Promise<void>;
declare const vectorStore: {
  deleteByDocument: (workspaceId: string, documentId: string) => Promise<void>;
};
```


### 5.3 幂等 upsert：重试也不会堆垃圾 chunk


向量侧的逻辑主键可以理解为：


```plain text
idempotency key ≈ (workspaceId, documentId, chunkIndex)
```


同一次文档的完整重跑，策略是 **按 documentId 先** **`deleteMany`****，再逐条** **`insertOne`**：


```typescript
interface ChunkRecord {
  workspaceId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  vector: number[];
  title?: string;
  source?: string;
  category?: string;
  tags?: string[];
}

async function upsertChunks(collection: {
  deleteMany: (filter: Record<string, unknown>) => Promise<unknown>;
  insertOne: (doc: Record<string, unknown>) => Promise<unknown>;
}, chunks: ChunkRecord[]): Promise<void> {
  if (chunks.length === 0) return;

  const workspaceId = chunks[0]!.workspaceId;
  const documentIds = [...new Set(chunks.map((c) => c.documentId))];

  // 重试 / 重索引：先清旧，避免 chunk 叠加
  for (const documentId of documentIds) {
    await collection.deleteMany({
      workspaceId: { $eq: workspaceId },
      documentId,
    });
  }

  try {
    for (const chunk of chunks) {
      // 某些托管 ANN 对 insertMany 不建索引，故逐条 insertOne
      await collection.insertOne({
        $vector: chunk.vector,
        content: chunk.text,
        workspaceId: chunk.workspaceId,
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        title: chunk.title,
        source: chunk.source,
        category: chunk.category,
        tags: chunk.tags,
      });
    }
  } catch (error) {
    // 写入中途失败：再删一次，避免半截可检索
    for (const documentId of documentIds) {
      await collection.deleteMany({
        workspaceId: { $eq: workspaceId },
        documentId,
      });
    }
    throw error;
  }
}
```


这给出的是**最终一致**，不是跨 PG / 向量库的分布式事务：

- 重试成功 → 旧垃圾被删，新 chunk 完整，文档 `ready`。
- 重试耗尽 → 文档 `failed`，并尽力 `deleteByDocument`，聊天不应再命中。
- 极端：清理也失败 → 需要观测与对账（见第 7 节），而不是假装有两阶段提交。

### 5.4 解析安全：路径穿越、超大文件、恶意 PDF


解析侧最先要想的不是「支持多少格式」，而是**谁把路径塞进 Worker**。


```typescript
import * as path from "node:path";
import * as fs from "node:fs/promises";

const UPLOADS_ROOT = "/abs/path/to/repo/uploads";
const PARSE_TIMEOUT_MS = 60_000;
const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/plain",
];

function resolveSafeFilePath(filePath: string): string {
  const resolved = path.resolve(filePath);
  const root = path.resolve(UPLOADS_ROOT);
  // 防 ../../../etc/passwd 一类路径穿越
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`filePath outside uploads directory: ${filePath}`);
  }
  return resolved;
}

export async function parseDocument(filePath: string, mimeType: string): Promise<string> {
  if (!ALLOWED.includes(mimeType)) {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
  const safePath = resolveSafeFilePath(filePath);

  const parse = async () => {
    switch (mimeType) {
      case "application/pdf":
        return parsePdf(safePath);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return parseDocx(safePath);
      case "text/markdown":
      case "text/plain":
        return (await fs.readFile(safePath, "utf-8")).trim();
      default:
        throw new Error(`No parser for ${mimeType}`);
    }
  };

  const text = await Promise.race([
    parse(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("parse timed out")), PARSE_TIMEOUT_MS),
    ),
  ]);
  if (!text) throw new Error(`Parsed empty text from ${safePath}`);
  return text;
}
```


再补几条权限与资源边界（代码外、但上线必须想）：

- **上传入口**：限制 `UPLOAD_MAX_BYTES`（如 20MB）；Worker 入队后再 `stat` 一次。
- **MIME 白名单**：扩展名可伪造；白名单限制「愿意跑哪些解析器」。
- **解析超时**：病态 PDF 可以吃满 CPU；超时让任务失败，而不是拖死整个 Worker。
- **Worker 权限**：进程只应读 `uploads/`、写向量库与 PG；不要用可读写全盘的账户跑。对象存储改造后，用最小 IAM（单 bucket 前缀）同样道理。

### 5.5 SSE 进度（含断开清理）


两个容易漏的点：连接瞬间先推库表进度；客户端断开必须 `off` 掉 `QueueEvents` 监听。


```typescript
// GET /api/kb/jobs/:id/stream
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await ctx.params;
  const ingestJob = await getIngestJobById(jobId);
  if (!ingestJob?.bullJobId) {
    return Response.json({ error: "任务不存在" }, { status: 404 });
  }

  const bullJobId = ingestJob.bullJobId;
  const queueEvents = getIngestQueueEvents();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      const closeStream = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      send("progress", { progress: ingestJob.progress });
      if (ingestJob.status === "completed") {
        send("completed", { progress: 100 });
        closeStream();
        return;
      }
      if (ingestJob.status === "failed") {
        send("failed", { error: ingestJob.error ?? "导入失败" });
        closeStream();
        return;
      }

      const onProgress = (args: { jobId: string; data: unknown }) => {
        if (String(args.jobId) !== bullJobId) return;
        const progress = typeof args.data === "number" ? args.data : Number(args.data) || 0;
        send("progress", { progress });
      };
      const onCompleted = ({ jobId }: { jobId: string }) => {
        if (String(jobId) !== bullJobId) return;
        send("completed", { progress: 100 });
        cleanup();
        closeStream();
      };
      const onFailed = ({
        jobId,
        failedReason,
      }: {
        jobId: string;
        failedReason?: string;
      }) => {
        if (String(jobId) !== bullJobId) return;
        send("failed", { error: failedReason ?? "导入失败" });
        cleanup();
        closeStream();
      };

      const cleanup = () => {
        queueEvents.off("progress", onProgress);
        queueEvents.off("completed", onCompleted);
        queueEvents.off("failed", onFailed);
      };

      queueEvents.on("progress", onProgress);
      queueEvents.on("completed", onCompleted);
      queueEvents.on("failed", onFailed);

      req.signal.addEventListener("abort", () => {
        cleanup();
        closeStream();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```


另提供 JSON 轮询作 fallback。SSE 挂了，库表进度仍在。


## 6. 扩展：并发 2 之后怎么办


concurrency=2 是**保护 embedding 配额与解析 CPU** 的默认值，不是容量上限。


水平扩展的直觉：


```plain text
多开几个 ingest-worker 进程（同连一个 Redis）
  → BullMQ 自动分发 job
  → 吞吐近似线性，直到撞上 embedding QPS 或向量库写入
```


embedding 成为瓶颈时，常见几步（按侵入性排序）：

1. 调大/调小 concurrency，对准供应商限流。
2. 切块 batch 提交 `embedMany`，减少往返。
3. 独立「embed 队列」与「upsert 队列」，让解析与向量化分开扩。
4. 换更高配额或自托管 embedding。

先观测队列深度，再扩机器——否则只是更快打满 API。


## 7. 观测：文档卡在 50% 时怎么查


阶段进度的好处，是把故障域缩小：


| 卡住的 progress              | 优先怀疑                        |
| ------------------------- | --------------------------- |
| 0～25                      | 文件丢失、MIME、解析超时、路径非法         |
| 50                        | embedding 超时 / 限流 / API Key |
| 75                        | 向量库写入、网络、insert 失败回滚        |
| 长期 `pending` 且 progress=0 | Worker 没起来，或根本没入队           |


最小可用观测（不必一上来上全套 APM）：


```typescript
// 结构化日志字段：每次阶段切换都带上
type IngestLogFields = {
  workspaceId: string;
  documentId: string;
  bullJobId: string;
  step: "parse" | "split" | "embed" | "upsert";
  attempt: number;
  durationMs?: number;
  error?: string;
};

// 定时对账（伪代码）：ready 却检索不到 / failed 仍有向量
async function reconcileOrphans() {
  const readyDocs = await db.query(
    `SELECT id, workspace_id, chunk_count, updated_at
     FROM documents
     WHERE status = 'ready' AND updated_at < NOW() - INTERVAL '10 minutes'`,
    [],
  );
  // 对每条抽检：vector count by documentId 是否 ≈ chunk_count
  // 不一致则告警，而不是静默
}
```


建议告警三条就够起步：

1. `ingest_jobs` 处于 `active` 超过 N 分钟（卡死）。
2. 队列 waiting 深度持续升高（Worker 不够或下游限流）。
3. 对账发现 `ready` 与向量条数不一致。

metrics 有则更好（job 成功率、阶段耗时直方图）；没有的时候，**带 documentId 的结构化日志 + 一张对账 SQL** 已经能定位大多数「卡在 50%」。


## 8. 如何验证

1. 只起 Web、不起 Worker：文档长期 `pending`——重活不在 HTTP 进程。
2. Web + Worker：进度 0→25→50→75→100，最终 `ready` 且 `chunkCount > 0`。
3. 人为在 upsert 中途失败并触发重试：向量条数应等于最后一次成功写入，而不是叠加。
4. 损坏 PDF：进入 `failed`，且不应再被检索到。
5. payload 里塞 `../` 路径：应被 `resolveSafeFilePath` 拒绝。
6. 打开 SSE 后关页面：服务端走 `abort` 清理监听。

## 9. 边界


下面这些是 Phase 1 **明确没做、或只做到「能用」** 的地方


**一致性**


没有跨 PostgreSQL 与向量库的分布式事务。`ready` 放在 upsert 成功之后，失败时尽力 `deleteByDocument`，再加对账 SQL——这是最终一致，不是 Exactly-once。极端情况下仍可能出现短暂的「列表已 ready、向量尚未可搜」或「failed 仍残留向量」；靠观测发现，而不是靠协议保证永不发生。


**重试**


`attempts=3` 是一刀切。坏 PDF、非法 MIME 这类确定性错误，重试三次只是烧配额；限流 / 超时才值得退避。更细的「可重试 vs 不可重试」错误分类、死信队列、人工重索引入口，都还没做成产品能力。


**进度**


0/25/50/75/100 是阶段里程碑，不是字节级或页级进度。卡在 50% 只能告诉你「还没进 embed」，不能告诉你 embedding 调了百分之几。对用户够用，对精细 SLA 不够。


**存储与部署**


文件落在共享磁盘路径 `uploads/`，Web 与 Worker 必须能看见同一路径。这在单机 / 同机挂载上省事，在多机或纯 Serverless 上会直接失效——那时要改对象存储，payload 改传 object key，权限模型也要重做。Worker 本身是常驻进程，不能假设「只丢一个短函数」就有完整入库。


**安全**


路径白名单、大小上限、MIME 白名单、解析超时，挡的是常见误用和粗暴攻击，不是完整威胁模型。没有登录与 RBAC 时，知道 job id 的人理论上能订阅读进度（Phase 1 用默认 workspace 约束了一层，仍不是多租户鉴权）。恶意构造的复杂 PDF 仍可能打满 CPU，超时只是止损，不是杀毒。


**扩展与多租户**


concurrency=2 保护的是配额，不是容量规划结论。水平加 Worker 可以提吞吐，但 embedding QPS 与向量库写入才是真正天花板；文中的「独立 embed 队列」只是方向，尚未拆。`workspaceId` 字段从 Day 1 就有，但 UI 仍是单租户默认 UUID——数据层预留 ≠ 产品层多租户做完。


**观测**


结构化日志字段与对账思路写在文里，不代表已经接好了告警平台、dashboard 和分页巡检任务。没有 metrics 时，排障仍高度依赖「打开库表看 progress + 翻日志」。


一句话：**队列把重活挪对了地方；幂等和状态顺序让它不太容易写坏；它仍然不是「上了 BullMQ 就等于企业级知识库」。** 知道边界，下次加功能才知道该补哪一层。


## 10. 收束


异步入库要守住的不是某一个中间件名字，而是一条因果链：

1. **为什么异步**：超时、事件循环、失败收尾——同步会把整站拖进同一故障域。
2. **为什么队列（且是 BullMQ）**：要持久化、重试、progress 事件；在 Node + Redis 约束下路径最短。
3. **为什么幂等先于重试**：`attempts=3` 一旦打开，就必须 `deleteMany` 再写，逻辑键是 `(workspaceId, documentId, chunkIndex)`。
4. **为什么** **`ready`** **在 upsert 之后**：状态机比进度条更重要。
5. **为什么还要日志与对账**：最终一致系统，靠观测补上事务做不到的那一截。

聊天继续快，知识继续进——前提是入库这条链路自己先站得住。