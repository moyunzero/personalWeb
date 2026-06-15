---
title: MoCode Phase 4 开发笔记
slug: 2026-06-15-mocode-phase-4
description: ""
author: 墨韵
date: 2026-06-15
categories:
  - note
tags:
  - LLM
  - ai
  - frontend
draft: false
notionId: 380df5c0-26f4-807d-9eb5-d1ef86b5dfef
notionSyncedAt: 2026-06-15T13:17:37.848Z
---

Phase 3 的「会话 UI 壳层」在本阶段接上 **真实后端**：新增 **`@mocode/database`**（Prisma + Postgres）、**`@mocode/server`**（Hono REST API）与 **`@mocode/shared`**（模型白名单 + 流式 Zod Schema）。CLI 通过 **Hono 类型安全 Client** 调用 `POST/GET /sessions`，Home 提交首条消息后 **创建 Session 并写入首条 User Message**，再导航到 **`/sessions/:id`** 渲染数据库中的消息列表。认证、流式回复、会话列表 UI、Assistant 生成尚未实现。


---


## 目录

1. 背景与目标
2. 技术选型
3. 架构总览
4. 知识点思维导图
5. 模块与关键代码
6. 核心流程
7. 知识点详解（含官方文档与用法）
8. 文件索引
9. 开发与调试

---


## 1. 背景与目标


### 要做什么


| 能力                                                | 状态 | 说明                                                     |
| ------------------------------------------------- | -- | ------------------------------------------------------ |
| Monorepo 新包 `database` / `server` / `shared`      | ✅  | workspace 依赖，CLI 仅 dev 依赖 `@mocode/server` 作类型来源       |
| Prisma Schema：`Session` + `Message`               | ✅  | Role / Mode / MessageStatus 枚举；`Message.parts` 预留 JSON |
| Prisma Client + `@prisma/adapter-pg`              | ✅  | Prisma 7 driver adapter 模式                             |
| Hono API：`GET/POST /sessions`、`GET /sessions/:id` | ✅  | Zod 校验创建请求；统一 `{ error }` 错误体                          |
| Shared 模型白名单                                      | ✅  | Anthropic / OpenAI 模型 ID + 定价元数据                       |
| Shared 流式事件 Schema                                | ⚠️ | Zod 定义就绪，**尚未**接 SSE 端点                                |
| CLI 类型安全 `apiClient`                              | ✅  | `hc<AppType>` 推断请求/响应类型                                |
| NewSession 调 API 创建会话                             | ✅  | 首条 User Message 同事务写入                                  |
| Session 屏拉取并渲染消息                                  | ✅  | 支持 `location.state.session` 跳过重复 GET                   |
| 环境变量模板 `.env.example`                             | ✅  | `API_URL` · `DATABASE_URL`                             |
| 用户认证 / 多租户                                        | ❌  | `userId: "mock-user"` 占位                               |
| 数据库 migration 入库                                  | ❌  | 需本地 `prisma migrate` / `db push`                       |
| Session 列表 UI                                     | ❌  | API 已有 `GET /sessions`，CLI 未消费                         |
| 流式 Bot 回复 / 发消息                                   | ❌  | Session 屏 InputBar 仍 `inputDisabled`                   |
| 单元测试 / E2E                                        | ❌  | 本阶段未加                                                  |


### 非目标（本阶段不做）

- OAuth / JWT / 用户表
- LLM 调用与 Assistant 消息写入
- SSE / WebSocket 流式推送
- Home 或 Slash 展示历史 Session 列表
- 生产部署、Docker、CI 数据库
- Prisma migration 文件纳入版本库（待后续 Phase 固化）

---


## 2. 技术选型


| 层级         | 选择                                      | 理由                                                 |
| ---------- | --------------------------------------- | -------------------------------------------------- |
| 运行时        | **Bun**                                 | 与 Phase 1–3 CLI 一致；Server 用 `Bun.serve` + `--hot`  |
| HTTP 框架    | **Hono 4**                              | 轻量、TypeScript 友好、内置 RPC Client 类型导出                |
| ORM        | **Prisma 7 +** **`@prisma/adapter-pg`** | 官方 driver adapter；与 Bun/Node pg 池解耦                |
| 数据库        | **PostgreSQL**                          | Session/Message 关系型模型；Prisma 一等支持                  |
| 校验         | **Zod 4 +** **`@hono/zod-validator`**   | 与 Shared Schema 共用 Zod；API 入参统一校验                  |
| 跨包共享       | **`@mocode/shared`**                    | 模型 ID、流式协议单点定义，CLI/Server 同构校验                     |
| CLI ↔︎ API | **Hono Client** **`hc<AppType>`**       | 编译期路由与响应类型；改 API 即 TypeScript 报错                   |
| 错误格式       | **`{ error: string }`** **JSON**        | Server `onError` + 路由 4xx；CLI `getErrorMessage` 解析 |


---


## 3. 架构总览


### 3.1 分层图


```mermaid
flowchart TB
  subgraph cli["packages/cli"]
    HOME["Home"]
    NEW["NewSession"]
    SES["Session"]
    API["api-client · hc AppType"]
    ERR["http-errors"]
  end

  subgraph server["packages/server"]
    HONO["Hono app"]
    RT["routes/sessions"]
    VAL["zValidator"]
  end

  subgraph shared["packages/shared"]
    MOD["models · SUPPORTED_CHAT_MODELS"]
    SCH["schemas · chatStreamEventSchema"]
  end

  subgraph database["packages/database"]
    PRISMA["Prisma Client + adapter-pg"]
    SCHEMA["schema.prisma"]
  end

  subgraph storage["PostgreSQL"]
    DB[(sessions · messages)]
  end

  HOME --> NEW
  NEW --> API
  SES --> API
  API --> ERR
  API -->|HTTP| HONO
  HONO --> RT
  RT --> VAL
  RT --> MOD
  RT --> PRISMA
  PRISMA --> SCHEMA
  PRISMA --> DB
  SCH -.->|未来 SSE| HONO
```


### 3.2 依赖方向（单向）


```plain text
packages/cli
  → @mocode/shared（运行时）
  → @mocode/server（devDependency，仅 AppType 类型）
  → hono/client

packages/server
  → @mocode/database
  → @mocode/shared
  → hono, zod, @hono/zod-validator

packages/database
  → @prisma/client, @prisma/adapter-pg, pg, dotenv
  → generated/prisma（本地 generate）

packages/shared
  → zod（无 workspace 反向依赖）
```


**原则**：`shared` 不依赖 `database`/`server`；CLI 生产路径只 HTTP 调 Server，不直连 DB。


---


## 4. 知识点思维导图


```mermaid
mindmap
  root((MoCode CLI Phase 4))
    Monorepo
      database package
      server package
      shared package
      workspace protocol
    Database
      Prisma 7
      adapter-pg
      Session Message
      enums Role Mode Status
    API
      Hono route mount
      zValidator
      AppType export
      error envelope
    Shared
      SUPPORTED_CHAT_MODELS
      chatStreamEventSchema
      messagePartSchema
    CLI Integration
      hc AppType
      InferResponseType
      location.state prefetch
      hasStartedRef StrictMode
      getErrorMessage
    DevOps
      DATABASE_URL
      API_URL
      db:generate
      dev:server dev:cli
```


---


## 5. 模块与关键代码

> **给非技术读者的导读**
>
> 以前聊天内容只活在界面里，关掉就没了。Phase 4 加了「记事本服务器 + 数据库」：你在首页说的话会先存进 Postgres，再打开会话页从服务器读回来显示。
>
>

---


### 5.1 数据模型 — `packages/database/prisma/schema.prisma`


**通俗说明**：定义「一次聊天会话」和「会话里每一条消息」长什么样。


**类比**：Session = 微信群；Message = 群里的每条聊天记录。


```plain text
// Session：一个用户的一次对话工作区
model Session {
  id        String   @id @default(cuid())
  userId    String
  title     String
  cwd       String?              // 可选：当时的工作目录
  messages  Message[]
  @@index([userId])
}

// Message：一条 USER / ASSISTANT / ERROR 消息
model Message {
  role      Role
  content   String
  model     String
  mode      Mode                 // BUILD | PLAN
  status    MessageStatus        // COMPLETE | INTERRUPTED
  parts     Json?                // 未来存流式片段（tool call 等）
  session   Session  @relation(..., onDelete: Cascade)
}
```


| 关键点                 | 用人话说                    |
| ------------------- | ----------------------- |
| `cuid()`            | 短、URL 友好的 ID，适合 REST 路径 |
| `onDelete: Cascade` | 删 Session 时消息一起删        |
| `parts Json?`       | 正文在 `content`，结构化块先预留   |


---


### 5.2 数据库客户端 — `packages/database/src/client.ts`


**通俗说明**：全项目共用一个 Prisma 连接 Postgres 的「数据库句柄」。


```typescript
// Prisma 7：通过 pg adapter 连接，而不是内置二进制引擎
const adapter = new PrismaPg({ connectionString: databaseUrl });
export const db = new PrismaClient({ adapter });
```


| 关键点                      | 说明                    |
| ------------------------ | --------------------- |
| `DATABASE_URL` 缺失即 throw | 启动即失败，避免 silent 连错库   |
| `dotenv/config`          | Server 进程加载根目录 `.env` |


---


### 5.3 Session API — `packages/server/src/routes/sessions.ts`


**通俗说明**：三个 HTTP 接口——列会话、查详情、新建会话（可带首条消息）。


```typescript
// POST body 结构：会话元数据 + 可选首条用户消息
const createSessionSchema = z.object({
  title: z.string(),
  cwd: z.string().optional(),
  initialMessage: z.object({
    role: z.enum(Role),
    content: z.string(),
    mode: z.enum(Mode),
    model: z.string().refine((id) => !!findSupportedChatModel(id), "Invalid model").optional(),
  }),
});

// 创建时嵌套写入 messages；userId 暂为占位
await db.session.create({
  data: {
    ...data,
    userId: "mock-user",
    messages: { create: { ...initialMessage, status: MessageStatus.COMPLETE } },
  },
  include: { messages: true },
});
```


| 路由                  | 行为                                       |
| ------------------- | ---------------------------------------- |
| `GET /sessions`     | 按 `createdAt desc` 返回 id/title/createdAt |
| `GET /sessions/:id` | 含 messages 升序；404 `{ error }`            |
| `POST /sessions`    | 201 返回完整 session + messages              |


---


### 5.4 Server 入口 — `packages/server/src/index.ts`


**通俗说明**：挂路由、统一报错格式、导出类型给 CLI 用。


```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message || "Request failed" }, err.status);
  }
  return c.json({ error: "Internal Server Error" }, 500);
});

const routes = app.route("/sessions", sessions);
export type AppType = typeof routes;  // CLI hc<AppType> 的类型源

export default {
  port: 3000,
  fetch: app.fetch,
  idleTimeout: 255,  // Bun 默认超时对慢查询不够
};
```


---


### 5.5 共享层 — `packages/shared`


**通俗说明**：CLI 和 Server 都认同一套「允许哪些模型」和「流式消息长什么样」。


```typescript
// models.ts — 模型白名单 + 默认可用模型
export const SUPPORTED_CHAT_MODELS = [ /* claude-*, gpt-* */ ] as const;
export const DEFAULT_CHAT_MODEL_ID = "claude-opus-4-6";

// schemas.ts — 未来 SSE 事件与 Message.parts 结构
export const chatStreamEventSchema = z.discriminatedUnion("type", [
  { type: "text-delta", text: string },
  { type: "done", messageId, durationMs },
  // ...
]);
```


| 模块        | 本阶段用途                            |
| --------- | -------------------------------- |
| `models`  | Server 校验 `initialMessage.model` |
| `schemas` | **仅定义**，等待 Phase 5+ 流式接入         |


---


### 5.6 CLI API 层 — `packages/cli/src/lib/*`


**通俗说明**：告诉 CLI「服务器地址在哪」以及「出错时怎么读错误文案」。


```typescript
// api-client.ts
export const apiClient = hc<AppType>(
  process.env.API_URL ?? "http://localhost:3000"
);

// http-errors.ts — 解析 Server 统一的 { error: string }
export async function getErrorMessage(response) {
  const data = await response.json();
  if (typeof data.error === "string") return data.error;
  return response.statusText || `Request failed with status${response.status}`;
}
```


---


### 5.7 NewSession — `packages/cli/src/screens/new-session.tsx`


**通俗说明**：拿到 Home 传来的首条消息后，调 API 建会话，成功则跳进详情页。


```typescript
// Strict Mode 下 effect 会跑两次，用 ref 防止重复 POST
const hasStartedRef = useRef(false);

const response = await apiClient.sessions.$post({
  json: {
    title: state.message.slice(0, 100),
    cwd: process.cwd(),
    initialMessage: {
      role: "USER",
      content: state.message,
      model: DEFAULT_CHAT_MODEL_ID,
      mode: "BUILD",
    },
  },
});

// 把完整 session 塞进 router state，详情页不用再 GET 一次
navigate(`/sessions/${session.id}`, { replace: true, state: { session } });
```


| 关键点               | 说明                                          |
| ----------------- | ------------------------------------------- |
| `ignore` cleanup  | 组件卸载后忽略 late response，防 setState on unmount |
| 失败 Toast + 回 Home | 用户可重新输入                                     |


---


### 5.8 Session 详情 — `packages/cli/src/screens/session.tsx`


**通俗说明**：显示会话里所有消息；若刚从创建页过来则直接用缓存数据。


```typescript
type SessionData = InferResponseType<
  (typeof apiClient.sessions)[":id"]["$get"],
  200
>;

// 有 prefetched 则跳过 GET
const prefetched = sessionLocationSchema.safeParse(location.state)?.session;

// 按 role 渲染 User / Bot / Error 气泡
session.messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />);
```


---


### 5.9 模块关系总览


```mermaid
flowchart LR
  subgraph cli_pkg["@mocode/cli"]
    NS[new-session]
    SS[session]
    AC[api-client]
  end
  subgraph srv["@mocode/server"]
    SE[sessions route]
  end
  subgraph sh["@mocode/shared"]
    M[models]
    Z[schemas]
  end
  subgraph db_pkg["@mocode/database"]
    DB[(db)]
  end

  NS --> AC
  SS --> AC
  AC --> SE
  SE --> M
  SE --> DB
  Z -.-> SE
```


| 模块                | 一句话职责      |
| ----------------- | ---------- |
| `schema.prisma`   | 持久化结构      |
| `client.ts`       | Prisma 单例  |
| `sessions.ts`     | REST 业务    |
| `models.ts`       | 允许的 LLM ID |
| `api-client.ts`   | 类型安全 HTTP  |
| `new-session.tsx` | 创建 + 跳转    |
| `session.tsx`     | 读取 + 渲染    |


---


## 6. 核心流程


### 6.1 Home 首条消息 → 创建 Session → 详情页


```mermaid
sequenceDiagram
  participant U as 用户
  participant H as Home
  participant N as NewSession
  participant C as apiClient
  participant S as Hono Server
  participant D as PostgreSQL
  participant V as Session Screen

  U->>H: Enter 提交文本
  H->>N: navigate("/sessions/new", { state: { message } })
  N->>C: POST /sessions { title, cwd, initialMessage }
  C->>S: HTTP JSON
  S->>S: Zod 校验 model / fields
  S->>D: session.create + messages.create
  D-->>S: Session + Messages
  S-->>C: 201 JSON
  C-->>N: session 对象
  N->>V: navigate("/sessions/:id", { state: { session } })
  V->>V: prefetched 命中，直接渲染 messages
```


### 6.2 直接打开 `/sessions/:id`（无 router state）


```mermaid
sequenceDiagram
  participant V as Session Screen
  participant C as apiClient
  participant S as Hono Server
  participant D as PostgreSQL

  V->>V: prefetched 为空
  V->>C: GET /sessions/:id
  C->>S: HTTP
  S->>D: findUnique + messages
  alt 404
    S-->>V: { error: "Session not found" }
    V->>V: Toast + navigate Home
  else 200
    S-->>V: session + messages
    V->>V: map ChatMessage 渲染
  end
```


### 6.3 本地双进程开发拓扑


```mermaid
flowchart LR
  T1["Terminal 1<br/>bun run dev:server<br/>:3000"]
  T2["Terminal 2<br/>bun run dev:cli<br/>TUI"]
  ENV[".env<br/>DATABASE_URL<br/>API_URL"]
  PG[(PostgreSQL)]

  ENV --> T1
  ENV --> T2
  T2 -->|HTTP| T1
  T1 --> PG
```


---


## 7. 知识点详解（含官方文档与用法）

> 每节含：**官方文档链接 · API/用法 · MoCode 落点**

### 7.1 Prisma 7 Driver Adapter


| 概念                        | 说明                             | 参考                                                                                    |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| `prisma-client` generator | Client 输出到 `generated/prisma`  | [Prisma ORM](https://www.prisma.io/docs)                                              |
| `@prisma/adapter-pg`      | 用 `node-postgres` 连接池驱动 Client | [Driver adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers) |
| `prisma.config.ts`        | Prisma 7 配置 datasource URL     | [Prisma config](https://www.prisma.io/docs/orm/reference/prisma-config-reference)     |


**MoCode 落点**：`packages/database/src/client.ts` · `prisma.config.ts`


**注意**：首次 clone 后须 `bun run db:generate`（在 `packages/database`）生成 client；无 `generated/` 则 Server 无法编译。


---


### 7.2 Hono 路由与 RPC 类型


| 概念                                    | 说明            | 参考                                                |
| ------------------------------------- | ------------- | ------------------------------------------------- |
| `app.route("/sessions", subApp)`      | 子应用挂载         | [Hono Routing](https://hono.dev/docs/api/routing) |
| `export type AppType = typeof routes` | 导出 RPC 类型     | [RPC / Client](https://hono.dev/docs/guides/rpc)  |
| `hc<AppType>(baseUrl)`                | 类型安全 fetch 封装 | 同上                                                |
| `InferResponseType<...>`              | 从 client 推断响应 | 同上                                                |


**MoCode 落点**：`server/src/index.ts` · `cli/src/lib/api-client.ts` · `session.tsx`


**注意**：`@mocode/server` 在 CLI 里是 **devDependency**，只为 TypeScript 类型；运行时仅 HTTP。


---


### 7.3 Zod + Hono Validator


| 概念                                 | 说明                   | 参考                                                                                           |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `zValidator("json", schema, hook)` | 失败时自定义 400 响应        | [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator) |
| `z.enum(Role)`                     | 与 Prisma 枚举值对齐       | [Zod](https://zod.dev/)                                                                      |
| `z.discriminatedUnion`             | 流式事件 / message parts | [Zod discriminated unions](https://zod.dev/api#discriminated-unions)                         |


**MoCode 落点**：`routes/sessions.ts` · `shared/src/schemas.ts`


---


### 7.4 React 数据获取模式（CLI）


| 概念                      | 说明                  | 参考                                                                |
| ----------------------- | ------------------- | ----------------------------------------------------------------- |
| `location.state` 预取     | 创建后立即展示，省一次 RTT     | [useLocation](https://reactrouter.com/en/main/hooks/use-location) |
| `useRef` 防双提交           | Strict Mode 双 mount | [React Strict Mode](https://react.dev/reference/react/StrictMode) |
| effect cleanup `ignore` | 异步竞态安全              | React docs · Effects                                              |


**MoCode 落点**：`new-session.tsx` · `session.tsx`


---


### 7.5 知识点 ↔︎ 源码 ↔︎ 文档 速查表


| #   | 知识点               | 文件                                         | 官方文档                                                        |
| --- | ----------------- | ------------------------------------------ | ----------------------------------------------------------- |
| 7.1 | Prisma adapter-pg | `database/src/client.ts`                   | [Prisma](https://www.prisma.io/docs)                        |
| 7.2 | Hono RPC AppType  | `server/index.ts`, `cli/lib/api-client.ts` | [Hono RPC](https://hono.dev/docs/guides/rpc)                |
| 7.3 | Zod validator     | `server/routes/sessions.ts`                | [Hono Zod](https://github.com/honojs/middleware)            |
| 7.4 | InferResponseType | `cli/screens/session.tsx`                  | [Hono Client types](https://hono.dev/docs/guides/rpc#infer) |
| 7.5 | 模型白名单             | `shared/src/models.ts`                     | —                                                           |
| 7.6 | 流式 Schema（预留）     | `shared/src/schemas.ts`                    | [Zod](https://zod.dev/)                                     |


---


## 8. 文件索引


| 文件                                         | 层级  | 一句话                               |
| ------------------------------------------ | --- | --------------------------------- |
| `.env.example`                             | 配置  | API 与数据库连接模板                      |
| `package.json`（根）                          | 配置  | `dev:cli` · `dev:server` 脚本       |
| `packages/database/prisma/schema.prisma`   | 数据  | Session / Message 模型              |
| `packages/database/prisma.config.ts`       | 数据  | Prisma CLI 读根 `.env`              |
| `packages/database/src/client.ts`          | 数据  | Prisma 单例 + pg adapter            |
| `packages/database/src/enums.ts`           | 数据  | 重导出 Prisma 枚举                     |
| `packages/database/src/index.ts`           | 数据  | 导出 db + generated client          |
| `packages/server/src/index.ts`             | API | Hono 入口、onError、AppType           |
| `packages/server/src/routes/sessions.ts`   | API | Session CRUD 路由                   |
| `packages/shared/src/models.ts`            | 共享  | LLM 白名单与默认可用模型                    |
| `packages/shared/src/schemas.ts`           | 共享  | Message parts / SSE 事件 Zod        |
| `packages/shared/src/index.ts`             | 共享  | barrel export                     |
| `packages/cli/src/lib/api-client.ts`       | CLI | 类型安全 Hono client                  |
| `packages/cli/src/lib/http-errors.ts`      | CLI | 解析 `{ error }` 响应                 |
| `packages/cli/src/screens/new-session.tsx` | CLI | POST 创建会话                         |
| `packages/cli/src/screens/session.tsx`     | CLI | GET 或 prefetched 渲染消息             |
| `packages/cli/package.json`                | 配置  | workspace 依赖 shared / server(dev) |


---


## 9. 开发与调试


### 环境配置


```bash
# 仓库根目录：复制并填写连接串
cp .env.example .env
# 编辑 .env：
#   DATABASE_URL=postgresql://user:pass@localhost:5432/mocode
#   API_URL=http://localhost:3000
```


### 首次数据库 Setup


```bash
cd packages/database
bun install
bun run db:generate

# 同步 schema 到数据库（开发环境二选一）
bunx prisma db push
# 或
bunx prisma migrate dev --name init
```


### 启动


```bash
# 仓库根目录 — 终端 1：API
bun install
bun run dev:server

# 终端 2：CLI
bun run dev:cli
```


### 手动验证清单


| 操作                             | 期望结果                              |
| ------------------------------ | --------------------------------- |
| Server 启动                      | 监听 `:3000`，无 `DATABASE_URL` 报错    |
| `curl localhost:3000/sessions` | `[]` 或已有 session 列表 JSON          |
| CLI Home 输入 Enter              | NewSession loading → 进入 Session 页 |
| Session 页                      | 显示一条 `UserMessage`（内容即输入）         |
| 重启 CLI 后手动进 `/sessions/:id`    | 触发 GET，仍能看到历史消息                   |
| Server 未启动时创建                  | Toast 错误，回 Home                   |
| 错误 model ID（调 API 时）           | 400 `{ error: ... }`              |


### 调试 checklist


| 现象                        | 排查                                                  |
| ------------------------- | --------------------------------------------------- |
| `DATABASE_URL is not set` | 根目录 `.env` 是否存在；Server 是否从 repo root 启动             |
| Prisma Client 找不到         | `packages/database` 下执行 `bun run db:generate`       |
| CLI 类型报错 `AppType`        | `@mocode/server` devDependency；路径 workspace 链接      |
| 创建成功但 Session 空白          | 查 DB messages 表；看 POST 响应是否含 `messages`             |
| 双条重复 Session              | Strict Mode：`hasStartedRef` 是否生效                    |
| 连接 reset / 超时             | Server `idleTimeout: 255`；Postgres 是否可达             |
| `Invalid model` 400       | `initialMessage.model` 须在 `SUPPORTED_CHAT_MODELS` 内 |


---


## 附录：API 一览


| 方法     | 路径              | 请求体 / 参数                           | 成功响应                         |
| ------ | --------------- | ---------------------------------- | ---------------------------- |
| `GET`  | `/sessions`     | —                                  | `[{ id, title, createdAt }]` |
| `GET`  | `/sessions/:id` | `id` path                          | `{ ...session, messages[] }` |
| `POST` | `/sessions`     | `{ title, cwd?, initialMessage? }` | `201` 完整 session             |


错误响应统一：`{ "error": "..." }`，HTTP 4xx/5xx。


## 附录：环境变量


| 变量             | 消费者               | 说明                                 |
| -------------- | ----------------- | ---------------------------------- |
| `DATABASE_URL` | database · server | PostgreSQL 连接串                     |
| `API_URL`      | cli               | Hono 基址，默认 `http://localhost:3000` |


## 附录：新增 workspace 包


| 包                           | 版本       | 用途                 |
| --------------------------- | -------- | ------------------ |
| `@mocode/database`          | 0.0.1    | Prisma + Postgres  |
| `@mocode/server`            | 0.0.1    | Hono REST API      |
| `@mocode/shared`            | 0.0.1    | 模型与 Schema 共享      |
| `hono`                      | ^4.12.25 | Server + Client 类型 |
| `prisma` / `@prisma/client` | ^7.8.0   | ORM                |
| `@prisma/adapter-pg`        | ^7.8.0   | pg driver adapter  |
| `@hono/zod-validator`       | ^0.8.0   | 请求校验               |