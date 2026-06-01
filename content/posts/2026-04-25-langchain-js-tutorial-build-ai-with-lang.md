---
title: "LangChain JS Tutorial: Build AI With LangChain In JavaScript – Full
  Crash Course "
slug: 2026-04-25-langchain-js-tutorial-build-ai-with-lang
description: ""
author: 墨韵
date: 2026-04-26
categories:
  - note
tags:
  - ai
  - LLM
  - Langchain.js
draft: false
notionId: 36ddf5c0-26f4-80c7-9238-d51833acee27
notionSyncedAt: 2026-06-01T06:41:06.200Z
---

### Introduction（引言）

- **问题痛点**：YouTube 上学习资源海量，但手动搜索效率低、推荐不精准（尤其是特定学习目标，如“React Hooks 入门”）。
- **解决方案**：用 LangChain JS 构建一个**智能代理（Agent）**，它能：
    1. 从指定 YouTube 频道抓取视频数据；
    2. 将视频标题+描述转为向量嵌入（Embedding）并存入向量数据库；
    3. 根据用户学习目标进行**语义检索**；
    4. 用 LLM（大语言模型）分析并**推荐最佳视频 + 解释理由**；
    5. 输出美观格式（含标题、链接、缩略图、理由）。
- **技术栈**：LangChain JS + OpenAI + MemoryVectorStore + ytsr（YouTube 搜索库）+ chalk（彩色输出）。
- **为什么用 LangChain JS**：
    - 模块化、可复用组件（类似 React 的组件化思想）；
    - 完全原生 JavaScript/Node.js，无需 Python；
    - 支持 OpenAI、Pinecone、ChromaDB 等主流工具；
    - 快速原型开发 + 生产级扩展。

### Prerequisites（前置要求）

- Node.js 版本 ≥ v18
- Visual Studio Code（或任意编辑器）
- OpenAI API Key（必须开通付费账号，免费额度可能不够）
- **补充**：OpenAI 费用提醒——向量嵌入和 LLM 调用都会消耗 token，建议先在 OpenAI 平台设置使用限额。

### Setup dev environment（开发环境搭建）

- 安装全局/本地依赖：

    ```bash
    npm init -y
    npm install langchain openai dotenv ytsr chalk
    ```

- 创建 `.env` 文件：

    ```plain text
    OPENAI_API_KEY=sk-你的密钥
    ```

- 在 `index.js` 顶部加载：

    ```javascript
    require('dotenv').config();
    ```

- **补充细节**：LangChain JS 0.3 版本与 0.2 有 breaking changes（视频特别提到这是目前唯一覆盖 0.3 版的教程），API 使用 `.pipe()` 连接组件。

### Creating project for LangChain JS development（项目初始化）

- 项目结构：单一 `index.js` 文件（演示用），生产环境建议拆分为 modules。
- 基础导入：

    ```javascript
    const { ChatOpenAI } = require("@langchain/openai");
    const { PromptTemplate } = require("@langchain/core/prompts");
    // 后续会逐步引入其他组件
    ```


### Introduction to LLMs and AI Concepts（LLM 与 AI 基础概念）

- LLM 本质 = “超级智能的自动补全引擎”（stateless，无记忆）。
- LangChain 作用：把 LLM 包装成可组合、可复用、可带记忆的 AI 应用框架。
- **补充**：LangChain 四大核心组件（视频核心教学点）：
    1. **Prompts**（提示模板）
    2. **Chains**（链式工作流）
    3. **Retrievers / Vector Stores**（检索器 / 向量存储）
    4. **Memory**（记忆模块）

### Langchain Hello World Program（Hello World 示例）

- 代码演示：

    ```javascript
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini", // 或 gpt-4o
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY
    });
    const response = await model.invoke("Hello, LangChain JS!");
    console.log(response.content);
    ```

- **补充**：`.invoke()` 是 LangChain 统一的调用方式；temperature 控制创造性（0 = 最确定）。

### Introduction to Prompt Templates（提示模板）

- 目的：让 Prompt 可复用、可参数化。
- 示例代码：

    ```javascript
    const prompt = PromptTemplate.fromTemplate(
      `你是一位专业的 {audience} 导师。请为主题 “{topic}” 给出 5 条学习建议。`
    );
    const formattedPrompt = await prompt.format({ topic: "React", audience: "初学者" });
    ```

- **补充**：模板支持多个变量，格式化后直接喂给 LLM，避免硬编码。

### Intro to LLM Chains（LLM 链）

- 用 `.pipe()` 把 Prompt + Model 串成一条链：

    ```javascript
    const chain = prompt.pipe(model);
    const result = await chain.invoke({ topic: "React Hooks", audience: "大学生" });
    ```

- **优势**：链可嵌套、可复用、可与 Retriever 组合成 RAG（Retrieval-Augmented Generation）。

### Embeddings and Vector Stores（嵌入与向量存储）

- **Embeddings**：把文本转成高维向量（数值数组），让机器“理解”语义相似性。
- 使用 `OpenAIEmbeddings`：

    ```javascript
    const { OpenAIEmbeddings } = require("@langchain/openai");
    const embeddings = new OpenAIEmbeddings();
    ```

- **MemoryVectorStore**（内存向量存储，适合演示）：

    ```javascript
    const { MemoryVectorStore } = require("langchain/vectorstores/memory");
    const docs = [{ pageContent: "React Hooks 教程...", metadata: { title: "xxx" } }];
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    ```

- **语义搜索演示**：向量距离越近，语义越相似（余弦相似度）。

### Searching vector stores（向量搜索）

- `similaritySearch` 方法：

    ```javascript
    const results = await vectorStore.similaritySearch("我想学 React Hooks", 3); // top 3
    ```

- **补充**：返回文档 + 相似度分数，可用于后续过滤。

### Retrievers（检索器）

- Retriever 是对 VectorStore 的抽象封装，提供统一接口 `invoke(query)`。
- 创建方式：

    ```javascript
    const retriever = vectorStore.asRetriever({ k: 4 }); // 返回 4 个最相关文档
    const relevantDocs = await retriever.invoke("学习目标...");
    ```

- **优势**（视频强调）：未来切换到 Pinecone/ChromaDB 时，只需改一行代码，接口不变。

### Retrievers demo（检索器演示）

- 完整演示：把 YouTube 视频数据转成文档 → 嵌入 → 检索器调用 → 返回语义最匹配的视频。

### Memory in LangChain（记忆模块）

- LLM 默认无状态，Memory 让它“记住”对话历史。
- 两种主流 Memory：
    1. **BufferWindowMemory**（窗口记忆）：保留最近 k 轮对话（默认 k=2）。
    2. **SummaryMemory**（摘要记忆）：把旧对话自动总结，节省 token。
- 代码示例：

    ```javascript
    const { BufferWindowMemory } = require("langchain/memory");
    const memory = new BufferWindowMemory({ memoryKey: "chat_history", k: 2 });
    // 在链中使用：chain = prompt.pipe(model).withMemory(memory);
    ```


###  Window vs Summary memory（两种记忆对比）

- Window：简单、实时，但长对话会超 token。
- Summary：节省 token，但有轻微信息损失。
- **补充**：实际项目中可混合使用，或结合 ConversationBufferMemory。

### LangChain memory code/tutorial（记忆代码实操）

- 演示：让 AI 记住用户名字，并在后续对话中引用。

###  Building YouTube Recommender（核心项目：YouTube 推荐器）


**完整流程**

1. **抓取 YouTube 数据**）：

    ```javascript
    const searchResults = await yt('LearnAwesome', { pages: 1 });
    // 过滤、去重，只保留指定频道视频
    ```

2. **清洗数据** → 转为 LangChain Document：

    ```javascript
    const { Document } = require("@langchain/core/documents");
    const docs = videos.map(video => new Document({
      pageContent: `${video.title}\\n${video.description}`,
      metadata: { title: video.title, url: video.url, thumbnail: video.thumbnail }
    }));
    ```

3. **创建向量存储**：

    ```javascript
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    const retriever = vectorStore.asRetriever({ k: 5 });
    ```

4. **用户输入学习目标** → 检索最相关视频。
5. **LLM 二次筛选 + 理由生成**（Prompt + Chain）：
    - Prompt 模板： “从以下 5 个视频中选出最匹配用户目标 ‘{goal}’ 的一个，并解释原因……”
    - Chain 调用后得到最终推荐 + 理由。
6. **美化输出**（chalk）：
    - 彩色标题、链接、缩略图 URL、详细理由。

### Embedding fetched data and creating vector store（嵌入与存储详细步骤）

- 完整演示了从抓取 → 清洗 → 嵌入 → 存储的每一行代码。

### Searching vector store based on user goal（基于目标搜索）

- 用户输入示例：“I want to learn React with hooks”
- Retriever 返回 top-5 视频。

### Determining best result and reasoning（LLM 选最佳 + 推理）

- LLM 不只返回 ID，还输出自然语言理由（这正是 LangChain 的强大之处）。

### Formatting final output（最终输出格式）

- 示例输出：
    > **推荐视频**：《Complete React 19 Crash Course》
>
>     **理由**：完美覆盖 useState、useEffect 等 Hooks，适合初学者……
>
>
>     **链接**：[https://youtube.com/](https://youtube.com/)...
>
>

### Why use LangChain revisited（再次总结 LangChain 价值）

- 模块化 = 快速迭代
- 抽象层 = 易于扩展（换向量库、加 Agent、加前端）
- 完整 RAG + Memory 流程一次学会

### 建议的未来扩展

- 前端化：React / Next.js 做 UI
- 实时搜索：用 LangChain Agent + YouTube API
- 生产级向量库：Pinecone / ChromaDB（替换 MemoryVectorStore）
- 视频摘要功能：结合 LLM 自动生成视频内容摘要
- 多频道支持：用户输入任意 YouTube 频道 URL

**笔记总结**：


核心收获是**掌握 Prompt + Chain + Retriever + Memory 的组合拳**，可以快速扩展出 Chatbot、RAG 系统、AI Agent 等任意 JS AI 应用。