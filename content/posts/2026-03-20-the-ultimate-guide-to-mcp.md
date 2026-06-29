---
title: The Ultimate Guide to MCP
slug: 2026-03-20-the-ultimate-guide-to-mcp
description: 官方 MCP 集成（Official MCP Integrations）： Git ：Git 的读取、操作和搜索。 GitHub
  ：仓库管理、文件操作及 GitHub API 集成。 Google Maps ：集成谷歌地图以获取位置信息。 PostgreSQL ：只读形式的数据库查询。
  Slack ：Slack 消息的…
author: 墨韵
date: 2026-03-20
categories:
  - note
tags:
  - ai
  - LLM
draft: false
notionId: 38edf5c0-26f4-80fe-8fd8-dfa8b1484cc1
notionSyncedAt: 2026-06-29T10:25:02.549Z
---

### 官方 MCP 集成（Official MCP Integrations）：

- **Git**：Git 的读取、操作和搜索。
- **GitHub**：仓库管理、文件操作及 GitHub API 集成。
- **Google Maps**：集成谷歌地图以获取位置信息。
- **PostgreSQL**：只读形式的数据库查询。
- **Slack**：Slack 消息的发送与查询。

### 🎖️ 官方支持 MCP 的第三方平台示例


由第三方平台构建的 MCP 服务端：

- **Grafana**：在 Grafana 中搜索和查询数据。
- **JetBrains**：适配 JetBrains 旗下的各类 IDE。
- **Stripe**：与 Stripe API 进行交互。

### 🌎 社区 MCP 服务端（Community MCP Servers）


以下是由开源社区开发和维护的 MCP 服务端：

- **AWS**：利用大语言模型（LLM）操作 AWS 资源。
- **Atlassian**：与 Confluence 和 Jira 交互，包括搜索/查询 Confluence 空间和页面、访问 Jira Issues 和项目。
- **Google Calendar**：集成谷歌日历，支持日程排期、寻找空闲时间以及添加/删除事件。
- **Kubernetes**：连接到 Kubernetes 集群并管理 Pods、Deployments（部署）和 Services（服务）。
- **X (Twitter)**：与 Twitter API 交互，支持发推和检索推文。
- **YouTube**：集成 YouTube API，进行视频管理、短视频创建等。

---


## 为什么需要 MCP？


你可能会纳闷：OpenAI 在 2023 年发布 **函数调用（Function Calling）** 时，不就能实现类似的功能了吗？


函数调用（Function Calling）、AI 智能体（AI Agent）和 MCP 之间到底有什么区别？


### 1. 函数调用（Function Calling）


函数调用是指 AI 模型根据上下文**自动选择并执行函数**的机制。它扮演了 AI 模型与外部系统之间的桥梁。然而，不同模型的函数调用实现方式各不相同，代码集成方式也大相径庭，它们是由各自的 AI 模型平台独立定义和实现的。


在使用函数调用时，我们需要通过代码向 LLM 提供一组函数，并附带明确的函数描述、输入和输出规范。这使得 LLM 能够基于清晰的结构化数据进行推理并执行函数。


**函数调用的缺点**在于它很难优雅地处理多轮对话和复杂的复合需求。它更适合边界清晰、描述明确的任务。一旦你需要处理的任务变多，函数调用的代码就会变得极难维护。


### 2. 模型上下文协议（MCP）


MCP 是一种**标准协议**，就像电子设备上的 Type-C 接口（既能充电也能传输数据）一样，它能让 AI 模型无缝地与不同的 API 和数据源进行交互。


MCP 的核心目标是**取代过去碎片化的 Agent 代码集成方式**，让 AI 系统变得更可靠、更高效。通过建立通用标准，服务商可以基于该协议直接为自家服务推出 AI 能力，开发者也能更快速地构建更强大的 AI 应用。


同时，开发者不需要重复造轮子，而是可以通过开源项目共同构建一个强壮的 AI Agent 生态。MCP 还能在不同的应用/服务之间**保持上下文（Context）**，从而显著提升整体的自主任务执行能力。


你可以把 MCP 理解为**对不同任务进行了分层处理**，每一层都提供特定的能力、描述和限制。MCP 客户端（MCP Client）会根据不同的任务决定是否调用某些能力，然后通过各层的输入和输出，构建出一个能够处理复杂、多步对话并统一上下文的 Agent。


### 3. AI 智能体（AI Agent）


AI 智能体是一个**能够自主运行以实现特定目标**的智能系统。传统的 AI 聊天只能提供建议，或者需要人工去执行任务；而 AI Agent 能够自行分析具体情况、做出决策并采取行动。AI Agent 可以利用 MCP 提供的功能描述来理解更多的上下文，并在各个平台/服务之间自动执行任务。


### 核心区别与优势


MCP 给社区生态带来的核心红利在于：

1. **为服务商提供开放标准**，允许他们开放自己的 API 和部分能力给 MCP。
2. **避免重复造轮子**，开发者可以直接使用现有的开源 MCP 服务来增强自己的 Agent 能力。

---


## MCP 是如何工作的


看一下官方的 MCP 架构图。


![image.png](images/blog/2026-03-20-the-ultimate-guide-to-mcp/img-936401992a.png)


### MCP 架构图


整个架构主要分为五个部分：

1. **MCP 宿主应用（MCP Hosts）**：发起 LLM 连接的应用程序，例如 Cursor、Claude Desktop、Cline。
2. **MCP 客户端（MCP Clients）**：在 Host 应用内部，与 Server 保持 1:1 连接的客户端。
3. **MCP 服务端（MCP Servers）**：通过标准化协议，向 Client 提供上下文、工具（Tools）和提示词（Prompts）。
4. **本地数据源（Local Data Sources）**：本地的文件、数据库和 API。
5. **远程服务（Remote Services）**：外部的云端文件、数据库和 API。

MCP 协议的核心在于 **Server（服务端）**。对于了解计算机网络的人来说，Host 和 Client 很好理解，但我们该如何理解 Server 呢？


纵观 Cursor 的 AI Agent 开发演进过程，我们可以看到整个 AI 自动化流程经历了从 **Chat（聊天）** 到 **Composer（编排）** 再到 **完整 AI Agent** 的进化：

- **AI Chat**：只提供修改建议。将 AI 的回复转化为行动和最终结果，完全依赖人工进行复制粘贴或手动修改。
- **AI Composer**：可以自动修改代码，但依然需要人类的参与和确认，且无法执行代码修改以外的操作。
- **AI Agent**：是一个完全自动化的程序。在未来，它可以自动从 Figma 读取设计图、自动生成代码、自动读取日志、自动调试 Bug，并自动把代码推送到 GitHub。

**MCP Server 的存在，正是为了赋能 AI Agent 的自动化。** 它是一个中间层，负责告诉 AI Agent 当前存在哪些服务、API 和数据源。AI Agent 可以根据 Server 提供的信息决定是否调用某项服务，进而通过函数调用（Function Calling）来执行具体功能。


---


### MCP Server 工作原理示例


让我们看一个简单的例子。假设我们希望 AI Agent 能够：根据本地错误日志自动搜索相关的 GitHub 仓库，接着搜索 Issues，然后判断这是否是一个已知 Bug，最后决定是否提交一个新的 Issue。


为此，我们需要创建一个 **GitHub MCP Server**，它需要提供三种能力：寻找仓库（Repositories）、搜索 Issues 和创建 Issues。


我们直接来看核心代码：


```typescript
const server = new Server(
  {
    name: "github-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. 告诉 Client 我们支持哪些工具/能力
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_repositories",
        description: "Search for GitHub repositories",
        inputSchema: zodToJsonSchema(repository.SearchRepositoriesSchema),
      },
      {
        name: "create_issue",
        description: "Create a new issue in a GitHub repository",
        inputSchema: zodToJsonSchema(issues.CreateIssueSchema),
      },
      {
        name: "search_issues",
        description: "Search for issues and pull requests across GitHub repositories",
        inputSchema: zodToJsonSchema(search.SearchIssuesSchema),
      }
    ],
  };
});

// 2. 处理具体的工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "search_repositories": {
        const args = repository.SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await repository.searchRepositories(
          args.query,
          args.page,
          args.perPage
        );
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }
      case "create_issue": {
        const args = issues.CreateIssueSchema.parse(request.params.arguments);
        const { owner, repo, ...options } = args;
        const issue = await issues.createIssue(owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
        };
      }
      case "search_issues": {
        const args = search.SearchIssuesSchema.parse(request.params.arguments);
        const results = await search.searchIssues(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {}
});

// 3. 启动服务，通过标准输入输出（stdio）进行通信
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```


在上面的代码中，我们使用 `server.setRequestHandler` 来告诉 Client 我们提供了哪些能力。其中 `description` 字段描述了该能力的作用，`inputSchema` 则定义了执行该能力所需的输入参数。


接下来看看底层的具体实现代码：


```typescript
export const SearchOptions = z.object({
  q: z.string(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
});

export const SearchIssuesOptions = SearchOptions.extend({
  sort: z.enum(["comments", ...]).optional(),
});

export const SearchRepositoriesSchema = z.object({
  query: z.string().describe("Search query (see GitHub search syntax)"),
  page: z.number().optional().describe("Page number for pagination (default: 1)"),
  perPage: z.number().optional().describe("Number of results per page (default: 30, max: 100)"),
});

export async function searchRepositories(
  query: string,
  page: number = 1,
  perPage: number = 30
) {
  const url = new URL("<https://api.github.com/search/repositories>");
  url.searchParams.append("q", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await githubRequest(url.toString());
  return GitHubSearchResponseSchema.parse(response);
}
```


可以清晰地看到，底层的最终实现依然是通过 `[<https://api.github.com>](<https://api.github.com>)` 官方 API 与 GitHub 进行交互。我们使用 `githubRequest` 函数请求 GitHub 并返回结果。


也就是说，在调用官方 API 之前，**MCP 做的大部分工作就是向 LLM 描述：这个 Server 提供了什么能力、需要什么参数（这些参数是干嘛的）以及最终输出什么结果。**


所以，MCP Server 并不是什么颠覆性的高深技术，它本质上就是一个**达成了行业共识的规范协议**。


如果我们想实现一个更强大的 AI Agent，比如让它根据本地的报错日志，自动去 GitHub 搜索相关 Issue，最后把结果发送到 Slack。我们只需要创建或组合三个不同的 MCP Server：

1. **Local Log Server**：用于查询本地日志。
2. **GitHub Server**：用于搜索 Issues。
3. **Slack Server**：用于发送消息。

当用户输入指令：“帮我查询本地错误日志，并将相关的 Issue 发送到 Slack”时，AI Agent 就会自动判断该调用哪些 MCP Server、决定调用顺序，并根据各个 Server 的返回结果动态决定下一步行动，从而搞定全链路任务。


---


## 如何使用 MCP


首先，推荐大家看看官方组织的 Server 列表：[Official MCP Server List](https://github.com/modelcontextprotocol/servers)。


大家可以去 [Cursor Directory](https://cursor.directory/) 找一些实用的例子。


---


## 推荐的 MCP 资源


### 官方资源

- 官方开源组织：[Model Context Protocol (GitHub)](https://github.com/modelcontextprotocol)
- 官方文档：[modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)
- 官方 MCP Server 仓库：[github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- Anthropic 官方博客：[Claude Blog](https://www.anthropic.com/news/model-context-protocol)

### 社区 MCP Server 导航站

- [MCP.so](https://mcp.so/)
- [Cursor Directory](https://cursor.directory/)
- [Pulsemcp](https://www.pulsemcp.com/)
- [Glama MCP Servers](https://glama.ai/mcp/servers)