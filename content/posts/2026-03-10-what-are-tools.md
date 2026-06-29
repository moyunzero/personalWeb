---
title: What are Tools?
slug: 2026-03-10-what-are-tools
description: AI 智能体最重要的能力之一是采取行动，而这正是通过工具（Tools）实现的。
author: 墨韵
date: 2026-03-10
categories:
  - note
tags:
  - ai
  - LLM
draft: false
notionId: 38edf5c0-26f4-801d-a5ec-c5c79b6de5af
notionSyncedAt: 2026-06-29T10:25:04.895Z
---

### 一、引言：工具是 AI 智能体的行动核心


AI 智能体最重要的能力之一是**采取行动**，而这正是通过**工具（Tools）**实现的。


### 二、什么是 AI 工具？


**工具（Tool）本质上是赋予 LLM 的一个函数**，该函数应具备**明确的目标**。


常见工具示例


| 工具类型             | 描述                                     |
| ---------------- | -------------------------------------- |
| Web Search       | 从互联网获取最新信息                             |
| Image Generation | 根据文本描述生成图像                             |
| Retrieval        | 从外部知识库检索信息                             |
| API Interface    | 与外部 API 交互（如 GitHub、YouTube、Spotify 等） |


工具可以根据任何用例自定义创建。**好的工具应能弥补 LLM 的固有局限**。


**示例**：

- 数学计算：提供计算器工具远优于依赖 LLM 自身算术能力。
- 时效性信息：LLM 的知识截止于训练数据，若无搜索工具，直接询问“今天巴黎天气”很可能产生幻觉（hallucination）。

一个完整工具应包含的要素

- **文本描述**：说明函数的功能
- **可调用对象（Callable）**：实际执行动作的函数
- **参数（Arguments）**：带类型标注
- **（可选）输出类型**：带类型标注

### 三、工具的工作原理


LLM 本身只能接收和生成文本，无法直接调用外部函数。**工具调用机制**的本质是：

1. 通过系统提示告知 LLM 可用工具的存在和详细描述。
2. 当用户查询需要工具时，LLM **生成文本形式的工具调用**（例如：`tool request weather_tool("Paris")`）。
3. **智能体（Agent）** 解析该调用，实际执行工具，获取结果。
4. 将工具执行结果作为新消息追加到对话中，再次传入 LLM 生成最终自然语言回复。
5. 用户看到的仅是最终回答，工具调用过程在后台完成，对用户透明。

### 四、如何向 LLM 提供工具？


核心方式是将工具的**文本描述**注入**系统提示（System Prompt）**中。


**关键要求**：

- 精确描述工具**做什么**。
- 明确指定**输入参数**的名称、类型和含义。

描述通常采用结构化格式（如 JSON 或类编程语言语法），以确保 LLM 准确理解。


具体示例：简单计算器工具


```python
def calculator(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b
```


**工具描述文本**（供 LLM 使用）：


```plain text
Tool Name: calculator, Description: Multiply two integers., Arguments: a: int, b: int, Outputs: int
```


将此描述放入系统提示后，LLM 就能知道何时调用该工具、传入什么参数以及预期输出类型。


### 五、自动生成工具描述


手动编写描述容易出错且难以维护。**最佳实践**是利用 Python 的内省（introspection）功能自动生成。


使用 `@tool` 装饰器


```python
@tool
def calculator(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b

print(calculator.to_string())
```


输出结果与手动编写一致，极大简化开发流程。


通用 Tool 类实现


课程中提供了一个可复用的 `Tool` 类，包含：

- `name`、`description`
- `func`（实际函数）
- `arguments`（参数列表）
- `outputs`（输出类型）
- `to_string()` 方法（生成 LLM 可读描述）
- `__call__()` 方法（执行工具）

装饰器 `@tool` 利用 `inspect` 模块自动提取函数签名、文档字符串和类型提示，生成 `Tool` 实例。


### 六、Model Context Protocol (MCP)：标准化工具接口


**MCP** 是一个开放协议，用于标准化应用程序向 LLM 提供工具的方式。其优势包括：

- 丰富的预构建集成
- 支持切换不同 LLM 提供商
- 基础设施内数据安全最佳实践
- 跨框架复用工具定义，无需重复实现

### 七、总结要点

- **工具是什么**：赋予 LLM 额外能力的函数，用于执行计算、获取外部数据等。
- **如何定义工具**：清晰的文本描述 + 可调用函数 + 类型化的输入/输出。
- **为什么工具至关重要**：突破 LLM 训练数据限制，实现实时交互和专业化行动。
- **集成方式**：通过系统提示注入工具描述，智能体负责解析和执行调用。

工具是构建强大 AI 智能体的基础之一。掌握工具设计后，即可进入智能体工作流（Agent Workflow），实现“观察—思考—行动”的完整循环。