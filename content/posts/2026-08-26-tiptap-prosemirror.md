---
title: 从零到自定义扩展：一条 TipTap / ProseMirror 基础学习路线
slug: 2026-08-26-tiptap-prosemirror
description: 官方入口：TipTap 文档 · Vue 3 安装 · 自定义扩展 1. 开始 目标不是把整个 monorepo
  读完，而是打通一条最短闭环： 能挂一个 Vue 编辑器 → 能说清编辑发生了什么 → 能自己写一个 Mark 和一个 Node（带命令）。
  更系统的概念可先扫一眼官方 Core Concepts 导读。 全…
author: 墨韵
date: 2026-08-26
categories:
  - note
tags:
  - Vue
  - Tiptap
draft: false
notionId: 3c8df5c0-26f4-80d3-ada0-eeec69e81e18
notionSyncedAt: 2026-08-30T08:17:07.580Z
---

> 
>
> 官方入口：[TipTap 文档](https://tiptap.dev/docs/editor/introduction) · [Vue 3 安装](https://tiptap.dev/docs/editor/getting-started/install/vue3) · [自定义扩展](https://tiptap.dev/docs/editor/extensions/custom-extensions)
>
>

## 1. 开始


目标不是把整个 monorepo 读完，而是打通一条最短闭环：


**能挂一个 Vue 编辑器 → 能说清编辑发生了什么 → 能自己写一个 Mark 和一个 Node（带命令）。**


更系统的概念可先扫一眼官方 [Core Concepts 导读](https://tiptap.dev/docs/editor/core-concepts/introduction)。


### 全文主线先抛出来


后面所有内容，其实都在回答这一对分界线（官方对照：[Nodes and Marks](https://tiptap.dev/docs/editor/core-concepts/nodes-and-marks)）：


|      | Mark（如 Highlight）                                                                                                      | Node（如 Callout）                                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 改什么  | 文字上的标记                                                                                                                 | 文档树里的块类型                                                                                                               |
| 命令   | [`setMark`](https://tiptap.dev/docs/editor/api/commands) / [`toggleMark`](https://tiptap.dev/docs/editor/api/commands) | [`setNode`](https://tiptap.dev/docs/editor/api/commands) / [`toggleNode`](https://tiptap.dev/docs/editor/api/commands) |
| JSON | `marks: [{ type: 'highlight' }]`                                                                                       | `{ type: 'callout', content: [...] }`                                                                                  |


一句话：

> **Callout 是节点，所以用** **`toggleNode`****；Highlight 是文字样式，所以用** **`toggleMark`****。**

---


## 2. 第一步：在 Vue 里挂起最小编辑器

> 官方：[在 Vue 3 中安装 TipTap](https://tiptap.dev/docs/editor/getting-started/install/vue3) · [配置编辑器](https://tiptap.dev/docs/editor/getting-started/configure)

TipTap 在 Vue 3 里最常见的三件套是：

1. `useEditor`：创建 / 销毁 `Editor`
2. `extensions: [StarterKit, ...]`：决定「文档能长什么样、能做什么」
3. `EditorContent`：把编辑器 DOM 挂到页面

核心代码大致如下（精简版，与官方 Vue 3 示例同构）：


```plain text
<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'

const editor = useEditor({
  extensions: [StarterKit],
  content: '<p>Hello TipTap</p>',
})
</script>

<template>
  <div v-if="editor">
    <button
      @click="editor.chain().focus().toggleBold().run()"
      :class="{ 'is-active': editor.isActive('bold') }"
    >
      Bold
    </button>
    <editor-content :editor="editor" />
  </div>
</template>
```


### 为什么这样就「能用」？


因为 [`StarterKit`](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) 不是一个神奇黑盒，它是一个 **Extension 合集**：内部通过 `addExtensions()` 装上了 `Document`、`Paragraph`、`Text`、`Bold`、`Heading`、列表等常用扩展（完整清单见官方 StarterKit 页）。


所以：

- 不写 `extensions`（或空数组）→ 没有可用 [Schema](https://tiptap.dev/docs/editor/core-concepts/schema) → 编辑器起不来 / 没有可编辑内容
- 写 `StarterKit` → 一次拿到最小能写文字、标题、加粗的编辑器
- 也可以手写最小组合：`[Document, Paragraph, Text, Bold]`，能力更少，但原理一样（见 [Configure](https://tiptap.dev/docs/editor/getting-started/configure)）

### Vue 侧一个小提醒


`useEditor` 返回的是 `shallowRef`。这很合理：`Editor` 是大对象，深度响应式既贵又没必要。常见写法是：

- 用 `v-if="editor"` 等到实例创建完成再渲染工具栏
- 读内容用 `editor.getJSON()` / `editor.getHTML()`
- 需要跟表单同步时，用 `onUpdate` 回调，而不是指望把整个 `editor` 当普通 reactive 对象深度追踪

`useEditor` 本身做的事也很直白：`onMounted` 里 `new Editor`，`onBeforeUnmount` 里 `destroy`。和 Options API 手写那套等价。


---


## 3. 底层原理速览：Extension → Schema → Transaction → View

> 官方：[Introduction](https://tiptap.dev/docs/editor/core-concepts/introduction) · [Schema](https://tiptap.dev/docs/editor/core-concepts/schema) · [Extensions](https://tiptap.dev/docs/editor/core-concepts/extensions) · 底层 [ProseMirror](https://prosemirror.net/docs/guide/)

当我第一次在控制台打印：


```typescript
Object.keys(editor.schema.nodes)
Object.keys(editor.schema.marks)
editor.getJSON()
```


才真正把「API 糖」和「文档模型」对上号。


### 一张简化数据流


```plain text
extensions（Node / Mark / Extension）
        │
        ▼
   Schema（nodes + marks）
        │
用户操作 / 命令 ──► Transaction ──► 新的 EditorState
        │
        └───────────────────────► EditorView（DOM）
```


| 概念              | 一句话                                       | 官方                                                                            |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| **extensions**  | 你声明的能力清单：结构、样式、快捷键、命令                     | [Extensions](https://tiptap.dev/docs/editor/core-concepts/extensions)         |
| **Schema**      | 根据扩展汇总出的文档约束：允许哪些 node / mark             | [Schema](https://tiptap.dev/docs/editor/core-concepts/schema)                 |
| **Transaction** | 不可变状态转换的指令集（steps + selection + metadata） | [Introduction 术语表](https://tiptap.dev/docs/editor/core-concepts/introduction) |
| **EditorState** | 当前文档 + 选区等完整状态（用新状态替换，不是原地乱改）             | 同上                                                                            |
| **EditorView**  | 负责 DOM 渲染与交互                              | [ProseMirror View](https://prosemirror.net/docs/ref/#view)                    |


### Transaction 的本质：不是「改 DOM」，是「发补丁」


初学时最容易把编辑理解成：用户敲键盘 → 直接改页面上的 DOM。


ProseMirror 不是这条路。


**Transaction（****`tr`****）是一次状态转换的指令集**，通常包含：

- **steps**：具体文档变更（例如插入文字对应 `ReplaceStep`）
- **selection**：变更后光标/选区应在哪
- **metadata**：给插件/历史用的附加信息

极简心智模型：


```typescript
// 不是：直接改 DOM 文本
// 而是：生成一步（或多步）文档变更
tr.insertText('hello')
// → 内部会形成类似 ReplaceStep 的 step
// → dispatch 后得到新的 EditorState
// → View 再根据新状态更新 DOM
```


这解释了两件「高级能力」为什么自然成立：

1. **撤销 / 重做**：历史本质上是 Transaction（或其 steps）的堆栈，可以反向应用（官方扩展见 [Undo/Redo](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo)）。
2. **协同编辑**：多方交换的是「变更描述」，而不是互相覆盖整份 DOM（可继续看 [Collaboration](https://tiptap.dev/docs/editor/extensions/functionality/collaboration) / [Hocuspocus](https://tiptap.dev/docs/hocuspocus/introduction)）。

所以 TipTap 里你写的：


```typescript
editor.chain().focus().toggleBold().run()
```


最终仍会落到「组装 Transaction → dispatch → 新 State → View 更新」。API 甜，底层模型没变。命令与链式调用见官方 [Commands](https://tiptap.dev/docs/editor/api/commands)。


### 一个关键纠正：谁包着谁？


容易说反。正确关系是：


```plain text
TipTap Editor
  ├── editor.state  → ProseMirror EditorState
  └── editor.view  → ProseMirror EditorView（DOM 在这里）
```


Vue 的 `EditorContent` 只是把 `editor.view` 的 DOM 挂到组件上。


**TipTap 的** **`Editor`** **包着 ProseMirror，而不是反过来。**


### TipTap 和 ProseMirror 的关系


一句话就够：

> **TipTap 是 ProseMirror 的「配置糖」**：底层仍是 Schema / Transaction / View，但你用 `Node.create` / `Mark.create` / `addCommands` 就能装配，而不必每次手写一堆 ProseMirror 样板。

点一次 Bold 后，`getJSON()` 里文字节点会出现：


```json
{
  "type": "text",
  "text": "加粗文字",
  "marks": [{ "type": "bold" }]
}
```


这是后面理解 Mark 的关键：`bold` 不是独立节点，而是**挂在 text 上的标记**。


---


## 4. 核心分工：Node / Mark / Extension

> 官方：[Nodes and Marks](https://tiptap.dev/docs/editor/core-concepts/nodes-and-marks) · [创建新扩展总览](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new) · [Node API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node) · [Mark API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/mark) · [Extension API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension)

| 类型            | 干什么                  | 例子                                                                                                                                                                                                         | Schema 里长什么样                                               |
| ------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Node**      | 文档结构（块或内联节点）         | `doc`、`paragraph`、[`heading`](https://tiptap.dev/docs/editor/extensions/nodes/heading)、`callout`                                                                                                           | `{ type: 'heading', attrs: { level: 2 }, content: [...] }` |
| **Mark**      | 行内文字上的样式标记           | [`bold`](https://tiptap.dev/docs/editor/extensions/marks/bold)、[`italic`](https://tiptap.dev/docs/editor/extensions/marks/italic)、[`highlight`](https://tiptap.dev/docs/editor/extensions/marks/highlight) | text 上的 `marks: [{ type: 'bold' }]`                        |
| **Extension** | 不占 Schema 槽位的能力 / 合集 | [`StarterKit`](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)、UndoRedo、快捷键类能力                                                                                                         | 通常不直接变成 node/mark 名字                                       |


### 为什么 Mark 要「挂在 text 上」，而不是「再包一层 node」？


这是 ProseMirror 数据模型里很漂亮的一刀。


同一段文字经常要同时具备多种样式，例如：

> **加粗 + 高亮 + 链接**

如果每种样式都用「嵌套节点」表示，DOM/文档树会变成：


```plain text
link > highlight > bold > text
```


嵌套顺序、拆分合并、部分取消某一种样式，都会迅速变复杂。


Mark 采用的是「标记集合」模式：


```json
{
  "type": "text",
  "text": "同一段字",
  "marks": [
    { "type": "bold" },
    { "type": "highlight" },
    { "type": "link", "attrs": { "href": "..." } }
  ]
}
```


多个 Mark 可以并存于同一 text；加、删某一种标记不必重做整棵嵌套树。


**Node 负责结构边界，Mark 负责跨结构的行内注解**——这就是引言里那条分界线的哲学来源。


### 读官方扩展时的「对照法」


读 [`Bold`](https://tiptap.dev/docs/editor/extensions/marks/bold) 时重点看：

- `name`
- `parseHTML` / `renderHTML`（HTML ↔ 文档）
- `addCommands`（命令从哪来）

读 [`Heading`](https://tiptap.dev/docs/editor/extensions/nodes/heading) 时再多看一层 **attribute**：

- Schema 里只有一个 `heading`，不是 `heading1` / `heading2`
- `addOptions().levels`：允许哪些级别
- `addAttributes().level`：每个节点实例的级别

这解释了一个常见困惑：「为什么 H1/H2 共用一个 node 名？」——因为级别是属性，不是多个 node 类型。


### 写扩展时最大的思路差异

- **写 Mark**：关心「这段文字有没有某个标记」→ [`setMark`](https://tiptap.dev/docs/editor/api/commands) / [`toggleMark`](https://tiptap.dev/docs/editor/api/commands) / [`unsetMark`](https://tiptap.dev/docs/editor/api/commands)
- **写 Node**：关心「当前块是什么类型」→ [`setNode`](https://tiptap.dev/docs/editor/api/commands) / [`toggleNode`](https://tiptap.dev/docs/editor/api/commands)`(A, B)`

---


## 5. 手写实战：Highlight（Mark）+ Callout（Node）

> 官方：[自定义扩展](https://tiptap.dev/docs/editor/extensions/custom-extensions) · [Create a Mark 指南](https://tiptap.dev/docs/guides/create-mark) · [Highlight 扩展](https://tiptap.dev/docs/editor/extensions/marks/highlight) · [Create a Node](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node)

下面两段都是学习路线里真实写过的最小可运行版本。


### 5.1 自定义 Mark：Highlight


目标：选中文字，切换荧光笔高亮；粘贴 `<mark>` 也能识别。


（官方还有现成的 [`@tiptap/extension-highlight`](https://tiptap.dev/docs/editor/extensions/marks/highlight)；这里是为了练手从零写一个。）


```typescript
import { Mark, mergeAttributes } from '@tiptap/core'

export interface HighlightOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      setHighlight: () => ReturnType
      toggleHighlight: () => ReturnType
      unsetHighlight: () => ReturnType
    }
  }
}

export const Highlight = Mark.create<HighlightOptions>({
  name: 'highlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [{ tag: 'mark' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setHighlight:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleHighlight:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
```


使用：


```typescript
editor.chain().focus().toggleHighlight().run()
editor.isActive('highlight')
```


**顿悟点：**


`toggleBold` 并不是 StarterKit「自己实现」的魔法。StarterKit 只是装了 `Bold`；真正注册命令的是 `Bold.addCommands()`。你的 `Highlight` 也走同一条路。


### 5.2 自定义 Node：Callout


目标：把当前段落切换成提示块，再点一次切回段落。


（结构可对照官方 [`Paragraph`](https://tiptap.dev/docs/editor/extensions/nodes/paragraph) / [`Blockquote`](https://tiptap.dev/docs/editor/extensions/nodes/blockquote)；更复杂的交互节点见 [Node Views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views)。）


```typescript
import { mergeAttributes, Node } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType
      toggleCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',
  content: 'inline*', // 和 paragraph 一样：块里直接放行内内容

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'callout',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, 'paragraph'),
    }
  },
})
```


使用：


```typescript
editor.chain().focus().toggleCallout().run()
editor.isActive('callout')
```


JSON 形态大致是：


```json
{
  "type": "callout",
  "content": [{ "type": "text", "text": "这是提示内容" }]
}
```


### 5.3 为什么 `toggleNode(this.name, 'paragraph')` 要传两个参数？


很多人第一次看到会觉得怪：既然我要切到 Callout，为什么还要写 `paragraph`？


因为两个命令语义不同（官方命令表：[Commands](https://tiptap.dev/docs/editor/api/commands)）：


| 命令                                                                                  | 行为                                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`setNode('callout')`](https://tiptap.dev/docs/editor/api/commands)                 | **强制**把当前块设成 callout；若已经是 callout，通常不会再给你「切回去」的语义        |
| [`toggleNode('callout', 'paragraph')`](https://tiptap.dev/docs/editor/api/commands) | 若当前已是 callout → 回退到 **备选类型** `paragraph`；否则 → 变成 callout |


所以 Callout 按钮「再点一次变回段落」不是框架猜的，而是你显式规定的规则：

> 目标类型 = `callout`，备选类型 = `paragraph`。

这和 Mark 的 `toggleMark` 也形成对照：Mark 的「关」是去掉标记；Node 的「关」必须告诉编辑器「关了之后变成哪种块」。


### 5.4 回到主线：一张对比表


|      | Highlight（Mark）                  | Callout（Node）                         |
| ---- | -------------------------------- | ------------------------------------- |
| 改什么  | 文字上的标记                           | 文档树里的块类型                              |
| 命令   | `setMark` / `toggleMark`         | `setNode` / `toggleNode`              |
| 切换语义 | 加上 / 去掉 mark                     | callout ↔ paragraph（备选显式指定）           |
| JSON | `marks: [{ type: 'highlight' }]` | `{ type: 'callout', content: [...] }` |


引言里抛出的分界线，到这里就落地了。


### 5.5 顺便看一眼：`parseHTML` 与 `renderHTML` 并不对称


自定义扩展里这两兄弟经常一起出现，但职责不同：


|    | `parseHTML`         | `renderHTML`           |
| -- | ------------------- | ---------------------- |
| 时机 | **读入** HTML / 粘贴内容时 | **输出**文档到 DOM / HTML 时 |
| 问题 | 「什么样的 HTML 算我？」     | 「我长成什么样的 HTML？」        |
| 数量 | 可以匹配**多种**来源        | 通常只生成**一种**规范形态        |


官方 `Bold` 就是典型例子：

- `parseHTML` 同时认 `<strong>`、`<b>`、以及 `font-weight` 足够粗的 style
- `renderHTML` 却统一输出成 `<strong>`

你可以「宽进严出」：兼容脏 HTML，输出保持干净。


很多人写扩展出 bug，就是默认「解析规则必须和渲染规则一一对应」——其实不必。


---


## 6. Commands 的通用设计模式

> 官方：[Commands API](https://tiptap.dev/docs/editor/api/commands) · 自定义命令示例见 [Create a Mark](https://tiptap.dev/docs/guides/create-mark#adding-commands)

自定义扩展里，`addCommands` 几乎是你最常写的「对外 API」。


### 命令长什么样？


典型形态：


```typescript
toggleHighlight:
  () =>
  ({ commands }) => {
    return commands.toggleMark(this.name)
  }
```


可以这样理解：

1. 外层是「带参数的命令工厂」（这里无参）
2. 内层拿到运行时上下文（`commands`、`editor`、`tr` 等）
3. **返回 boolean**：表示这次操作是否成功执行

这解释了工具栏里常见写法：


```typescript
editor.can().chain().focus().toggleBold().run()
```


`can()` 用来探测「现在能不能执行」，避免按钮瞎点。


### `chain()` 和直接多次 dispatch：差在「事务粒度」


表面上看：


```typescript
editor.chain().focus().toggleHighlight().run()
```


只是语法糖。往下一层，关键差别是：

- **`chain()`**：把多个命令步骤尽量装进**同一个 Transaction**，最后一次性 `run()` / dispatch
- **多次单独命令 / 多次 dispatch**：更容易变成**多个 Transaction**

这会影响：

1. **撤销粒度**：一次 Ctrl+Z 撤销的是「一个事务」还是「半截操作」
2. **中间态**：是否会出现「文档已改、焦点还没跟上」的短暂不一致
3. **可读性**：工具栏意图用一条链表达更清楚

所以日常工具栏优先 `chain()`，不是因为「官方示范好看」，而是因为它更符合「一次用户意图 = 一次事务」的模型。


### `declare module '@tiptap/core'` 是干什么的？


给 TypeScript 补命令类型，让：


```typescript
editor.commands.toggleHighlight()
editor.chain().toggleCallout()
```


有补全和类型检查。运行时靠 `addCommands` 注册；类型靠 module augmentation 声明。两边要一起写。


---


## 7. 踩坑与心得


踩坑可以分成两类：一类是概念没通，一类是代码细节踩雷。


### 7.1 概念坑


**1）以为必须依赖 StarterKit**


必须的是「能组成合法 Schema 的扩展集合」。StarterKit 只是最省事的合集。最小可编辑文本通常至少要有 `Document` + `Paragraph` + `Text`。


**2）把** **`toggleBold`** **归功于 StarterKit 本身**


StarterKit 是装配工；`Bold` 才是命令主人。自定义扩展时，照着 `Bold.addCommands` 抄骨架就对了。


**3）说反 TipTap 与 ProseMirror 的包裹关系**


`editor.view` 才是 PM 的 `EditorView`。TipTap `Editor` 是外壳与编排层。


**4）Heading 级别理解成多个 node**


Schema 里是一个 `heading` + `attrs.level`。工具栏写 `isActive('heading', { level: 1 })`，查的是类型和属性，不是另一个 node 名。


**5）搞混** **`toggleMark`** **与** **`toggleNode`**


Mark 的「关」= 去掉标记；Node 的「关」= 切到备选块类型（所以要传第二个参数）。


### 7.2 代码坑


**1）****`renderHTML`** **里的** **`0`**


在 DOM 输出描述里，`0` 常表示「子内容放这里」。Mark 的 `['mark', attrs, 0]`、Node 的 `['div', attrs, 0]` 都是这个意思。漏了它，内容可能进不了标签。


**2）Vue 里过早渲染工具栏**


`useEditor` 在 `onMounted` 才创建实例。模板用 `v-if="editor"`，否则首屏 `editor` 还是 `undefined`。


**3）只写** **`addCommands`****，忘了 TypeScript 增强**


运行时命令在，编辑器能跑；但 `editor.commands.xxx` 没有类型提示。`declare module '@tiptap/core'` 要一起补。


**4）默认** **`parseHTML`** **必须等于** **`renderHTML`**


可以宽进严出：解析认多种脏 HTML，渲染只输出一种干净结构。两边职责不同，不必强行对称。


---


## 8. 结语：你已经打通的闭环


如果只带走一张清单，就是这个：

1. **会挂**：`useEditor` + `StarterKit` + `EditorContent`
2. **懂原理**：extensions → Schema → Transaction → View；TipTap 包着 ProseMirror
3. **分得清**：Node 管结构，Mark 管行内样式，Extension 管能力/合集
4. **写得出**：
    - Mark：`parseHTML` / `renderHTML` + `setMark`/`toggleMark`/`unsetMark`
    - Node：`group`/`content` + `setNode`/`toggleNode(目标, 备选)`

如果再带走一层「为什么」，就是这三句：

- Mark 挂在 text 上，是为了让加粗 / 高亮 / 链接可以并存，而不是靠无限嵌套节点。
- Transaction 是不可变状态转换指令，所以撤销和协同才有统一底座。
- `chain()` 尽量把一次用户意图收进同一个事务，undo 粒度才干净。

---


## 附录：官方文档速查


按本文阅读顺序整理，方便跳转原文：


| 主题                                       | 链接                                                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TipTap 简介                                | [https://tiptap.dev/docs/editor/introduction](https://tiptap.dev/docs/editor/introduction)                                                                           |
| Core Concepts 导读                         | [https://tiptap.dev/docs/editor/core-concepts/introduction](https://tiptap.dev/docs/editor/core-concepts/introduction)                                               |
| Schema                                   | [https://tiptap.dev/docs/editor/core-concepts/schema](https://tiptap.dev/docs/editor/core-concepts/schema)                                                           |
| Nodes and Marks                          | [https://tiptap.dev/docs/editor/core-concepts/nodes-and-marks](https://tiptap.dev/docs/editor/core-concepts/nodes-and-marks)                                         |
| Extensions 概念                            | [https://tiptap.dev/docs/editor/core-concepts/extensions](https://tiptap.dev/docs/editor/core-concepts/extensions)                                                   |
| Vue 3 安装                                 | [https://tiptap.dev/docs/editor/getting-started/install/vue3](https://tiptap.dev/docs/editor/getting-started/install/vue3)                                           |
| 配置编辑器                                    | [https://tiptap.dev/docs/editor/getting-started/configure](https://tiptap.dev/docs/editor/getting-started/configure)                                                 |
| StarterKit                               | [https://tiptap.dev/docs/editor/extensions/functionality/starterkit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)                             |
| Commands（含 setMark / toggleNode / chain） | [https://tiptap.dev/docs/editor/api/commands](https://tiptap.dev/docs/editor/api/commands)                                                                           |
| 自定义扩展总览                                  | [https://tiptap.dev/docs/editor/extensions/custom-extensions](https://tiptap.dev/docs/editor/extensions/custom-extensions)                                           |
| 创建新扩展                                    | [https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new)                     |
| Create Mark 指南                           | [https://tiptap.dev/docs/guides/create-mark](https://tiptap.dev/docs/guides/create-mark)                                                                             |
| Mark API                                 | [https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/mark](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/mark)           |
| Node API                                 | [https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node)           |
| Extension API                            | [https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension) |
| Highlight 扩展                             | [https://tiptap.dev/docs/editor/extensions/marks/highlight](https://tiptap.dev/docs/editor/extensions/marks/highlight)                                               |
| Bold                                     | [https://tiptap.dev/docs/editor/extensions/marks/bold](https://tiptap.dev/docs/editor/extensions/marks/bold)                                                         |
| Heading                                  | [https://tiptap.dev/docs/editor/extensions/nodes/heading](https://tiptap.dev/docs/editor/extensions/nodes/heading)                                                   |
| Paragraph                                | [https://tiptap.dev/docs/editor/extensions/nodes/paragraph](https://tiptap.dev/docs/editor/extensions/nodes/paragraph)                                               |
| Blockquote                               | [https://tiptap.dev/docs/editor/extensions/nodes/blockquote](https://tiptap.dev/docs/editor/extensions/nodes/blockquote)                                             |
| Node Views                               | [https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views)                     |
| Undo/Redo                                | [https://tiptap.dev/docs/editor/extensions/functionality/undo-redo](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo)                               |
| Collaboration                            | [https://tiptap.dev/docs/editor/extensions/functionality/collaboration](https://tiptap.dev/docs/editor/extensions/functionality/collaboration)                       |
| Hocuspocus                               | [https://tiptap.dev/docs/hocuspocus/introduction](https://tiptap.dev/docs/hocuspocus/introduction)                                                                   |
| ProseMirror 官网 / Guide                   | [https://prosemirror.net/](https://prosemirror.net/) · [https://prosemirror.net/docs/guide/](https://prosemirror.net/docs/guide/)                                    |