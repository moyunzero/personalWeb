---
title: "Learn how to THINK in code – The Hard & Conceptual Parts of JavaScrip "
slug: 2026-05-15-learn-how-to-think-in-code-the-hard-conc
description: 代码被划分为一个个独立的"世界"，称为 作用域（Scope）。
author: 墨韵
date: 2026-05-15
categories:
  - note
tags:
  - JavaScript
  - frontend
draft: false
notionId: 36ddf5c0-26f4-807f-8a26-d15e7072c088
notionSyncedAt: 2026-05-27T04:39:54.893Z
---

## Think in JavaScript: The Hard & Conceptual Parts

> **课程核心理念**：学习 JavaScript 不应停留在背诵语法，而应深入理解 **引擎与运行时机制（engine and runtime mechanics）**。

---


## 一、作用域（Scope）


### 1.1 什么是作用域

- 代码被划分为一个个独立的"世界"，称为 **作用域（Scope）**。
- **子作用域可以访问父作用域的变量**，但 **父作用域无法访问子作用域独有的变量**。

### 1.2 全局作用域

- 浏览器中：全局作用域绑定到 **`window`** 对象。
- Node.js 中：全局作用域绑定到 **`global`** 对象。

### 1.3 变量在不同作用域的行为

- 在函数内部用 `var y` 声明的变量，只能在该函数内访问；外部引用会抛出 **ReferenceError**。
- 在子作用域中 **不使用** **`var/let/const`** 直接赋值（如 `x = 10`），JavaScript 会将其视为 **修改全局变量**（危险行为）。
- 在函数内部用 `var x = 10` 声明，则创建一个 **新的函数作用域变量**，不会修改全局变量。

### 1.4 三种作用域类型


| 类型                        | 说明                 | 适用的声明关键字                    |
| ------------------------- | ------------------ | --------------------------- |
| **全局作用域（Global Scope）**   | 任何地方都可访问           | `var`, `let`, `const`（顶层声明） |
| **函数作用域（Function Scope）** | 仅在函数体内可访问          | `var`                       |
| **块级作用域（Block Scope）**    | 仅在 `{ ... }` 块内可访问 | `let`, `const`              |


### 1.5 `var` vs `let` / `const`

- **`var`**：函数作用域（function-scoped）。
- **`let`** **/** **`const`**：块级作用域（block-scoped）。
- 在块外访问 `let`/`const` 声明的变量 → **ReferenceError**。

---


## 二、闭包（Closures）


### 2.1 定义

- **闭包 = 函数 + 记住的外部变量引用（remembered outer variables）**。
- 当一个函数保留了对其 **外部/封闭作用域** 变量的访问权，即使外部作用域已经"结束"，这就形成了闭包。

### 2.2 核心机制

- 函数是对象，会维护一个指向其 **创建环境** 的链接。
- 闭包 **保存的是引用（references），不是快照值（snapshot values）**。
- 如果引用的外部变量后续发生变化，闭包在执行时能看到最新值。

### 2.3 闭包形成的步骤

1. 外部作用域定义变量（如 `num1`, `num2`）。
2. 内部函数引用这些变量。
3. 内部函数被返回或稍后执行。
4. 返回的函数仍能访问外部变量 → 闭包行为生效。

### 2.4 私有数据封装（数据隐私）

- **模式**：外部函数创建私有变量（如 `balance`），返回内部函数。
- 外部代码无法直接访问私有变量，只能通过返回的函数操作。
- 这是 JavaScript 中实现 **封装（encapsulation）** 的经典方式。

### 2.5 哪些变量会被捕获

- 只有 **内部函数实际使用到的外部变量** 才会被捕获。
- JavaScript 引擎会优化，省略未使用的变量。

---


## 三、变量提升（Hoisting）与暂时性死区（TDZ）


### 3.1 声明 vs 初始化

- **声明（Declaration）**：变量名被创建。
- **初始化（Initialization）**：变量被赋值。

### 3.2 `var` 的提升行为

- 声明被提升到作用域顶部。
- 在赋值前访问 → 值为 **`undefined`**，不会抛出 ReferenceError。

### 3.3 `let` / `const` 的提升行为

- 声明同样被提升，但处于 **暂时性死区（Temporal Dead Zone, TDZ）**。
- 在声明行之前访问 → 抛出 **ReferenceError**。

### 3.4 最佳实践

- 在作用域顶部声明变量。
- 优先使用 `let` / `const`。
- 不要依赖提升行为。

---


## 四、执行上下文（Execution Context）


### 4.1 核心概念

- 执行上下文是引擎创建的 **小型隔离环境**，用于运行代码。
- 理解执行上下文 = 理解作用域、提升、闭包的关键。

### 4.2 每个执行上下文的两个阶段


| 阶段                                    | 说明                                |
| ------------------------------------- | --------------------------------- |
| **创建/加载阶段（Creation / Loading Phase）** | 设置变量内存槽（值常为 `undefined`），存储函数声明引用 |
| **执行阶段（Execution Phase）**             | 为变量赋初始值，逐行执行语句                    |


### 4.3 全局执行上下文（Global Execution Context）

- 在代码运行前创建。
- 包含：
    - 全局对象（浏览器中为 `window`，Node 中为 `global`）
    - `this`
    - 变量对象 / 作用域链
- 提升行为在此阶段显现（变量先以 `undefined` 存在）。

### 4.4 函数执行上下文（Function Execution Context）

- 每次调用函数时创建。
- 包含：
    - `arguments` 对象（参数）
    - 变量对象
    - `this`
    - 作用域链
- 被压入调用栈顶部，执行完毕后弹出。

### 4.5 调用栈（Call Stack）

- JavaScript 是单线程执行，使用 **LIFO（后进先出）执行栈**。
- 嵌套函数调用会压入新上下文，完成后弹出。
- 这解释了为什么提升规则下某些变量会打印 `undefined`。

---


## 五、原型与继承（Prototypes & Inheritance）


### 5.1 原型链思想

- JavaScript 不复制方法到每个实例，而是通过 **原型链共享方法**。
- 函数有 **`prototype`** 属性，实例通过原型链访问共享方法。

### 5.2 构造函数模式

- **构造函数（Constructor Function）** 创建实例属性。
- **共享方法** 放在 `Constructor.prototype` 上。
- 实例通过原型链访问这些方法。

### 5.3 `Object.create()`

- `Object.create(parentObj)` 创建一个子对象。
- 子对象可通过原型查找访问父对象的属性。

### 5.4 `new` 关键字

- `new Constructor(...)` 是手动过程的自动化：
    1. 创建对象（并建立原型链接）
    2. 用正确绑定的 `this` 调用构造函数
    3. 返回构造的实例

### 5.5 `class` 语法

- `class` 语法是现代语法糖，底层仍是 **原型机制**。
- 方法共享依然依赖原型。

### 5.6 内置示例

- 数组方法（如 `push`）来自 `Array.prototype`。

---


## 六、面向对象编程（OOP）概念


### 6.1 OOP 目标

- 避免重复代码，通过 **集中共享结构** 简化后续修改。

### 6.2 核心概念类比


| 概念                    | 类比                           |
| --------------------- | ---------------------------- |
| **类（Class）**          | 蓝图 / 工厂                      |
| **构造函数（Constructor）** | 初始化每个实例                      |
| **实例（Instance）**      | 用 `new` 创建的具体对象              |
| **方法（Methods）**       | 定义行为                         |
| **继承（Inheritance）**   | `extends` + `super`：子类共享父类特性 |


### 6.3 `extends` 与 `super`

- 子类通过 `extends` 继承父类。
- 子类构造函数中调用 `super(...)` 初始化父类部分。

---


## 七、事件委托（Event Delegation）


### 7.1 实现方法

- 将 **一个事件监听器** 绑定到父容器（如 `<ul>`）。
- 在处理器中：
    - 用 `event.target` 找到实际被点击的元素（如 `<li>`）。
    - 用检查（如 `matches('li')`）过滤应触发逻辑的目标。
    - 读取 `event.target.innerText` 等属性决定行为。

### 7.2 动态元素支持

- 后续新增的匹配子元素，**无需重新绑定监听器**，父容器监听器依然生效。

### 7.3 优势

- 减少监听器数量。
- 支持动态添加的 DOM 节点。

---


## 八、事件传播：冒泡 vs 捕获（Bubbling vs Capturing）


### 8.1 事件传播的含义

- 描述事件在祖先/后代元素间的 **传递顺序**。

### 8.2 默认：冒泡（Bubbling）

- 顺序：**子元素 → 父元素**
- `event.target` 始终是最初被点击的元素。
- `event.currentTarget` / `this` 随监听器执行层级变化。

### 8.3 捕获（Capturing / "Trickling"）

- 通过监听器第三个参数启用：`capture: true`（或简写 `true`）。
- 顺序反转：**父元素 → 子元素**。

### 8.4 面试技巧：自定义捕获顺序

- 如果只想让中间元素先捕获：
    - 仅在该元素监听器上启用 `capture: true`。
    - 其他监听器保持默认（不启用捕获），即可获得自定义顺序。

---


## 九、异步 JavaScript（Asynchronous JavaScript）


### 9.1 核心约束

- JavaScript 执行是 **单线程**（一个主调用栈）。
- 长时间同步 CPU 任务会 **阻塞线程**。

### 9.2 异步如何防止 UI 冻结

- `setTimeout`、网络请求等异步 API 将工作交给 **Web APIs / 运行时**。
- 完成后通过回调/队列返回结果。
- **事件循环（Event Loop）** 在调用栈为空时，将队列中的任务移入调用栈执行。

### 9.3 处理异步复杂性的演进


| 方式                | 特点                                               |
| ----------------- | ------------------------------------------------ |
| **回调（Callbacks）** | 可能导致"回调地狱"（callback hell）                        |
| **Promises**      | `.then` 处理成功，`.catch` 处理错误；支持链式调用和 `Promise.all` |
| **async/await**   | 语法糖，让异步代码看起来像同步代码；支持 `try/catch` 处理错误            |


---


## 十、记忆化（Memoization）—— 性能优化


### 10.1 问题

- 昂贵函数对相同输入重复计算，浪费性能。

### 10.2 解决方案结构

- 创建 **高阶函数** `memo(f)`，返回一个新函数。
- 返回的函数：
    1. 根据输入构建缓存键。
    2. 检查缓存：
        - 命中 → 返回缓存结果。
        - 未命中 → 计算结果，存入缓存，返回结果。

### 10.3 闭包的作用

- 缓存通过 **闭包** 持久化，在多次调用间保持。

### 10.4 多参数处理

- 使用剩余参数（rest parameters）收集参数。
- 将参数数组转为唯一键（例如 `JSON.stringify(argsArray)`）。

---


## 十一、多线程概念（Multi-threading）


### 11.1 浏览器：Web Workers


**方法：**

- 用 `new Worker('worker.js')` 将 CPU 密集型工作卸载到 **工作线程**。

**主线程：**

- 通过 `worker.postMessage(data)` 发送消息。
- 通过 `worker.onmessage` 接收结果。

**Worker 线程：**

- 通过 `self.onmessage` / `onmessage` 监听。
- 执行重计算。
- 通过 `postMessage(result)` 发送结果。

**规则：**

- Worker **没有 DOM 访问权限**。

### 11.2 Node.js：Worker Threads（CPU 密集型任务）


**为什么需要：**

- Node/JS 执行层是单线程，CPU 密集型处理会阻塞响应。
- Worker 允许 **并行 CPU 处理**。

**方法（模式）：**

- 在主服务器路由中：
    - 创建 Worker（来自 `worker_threads`）。
    - 传递任务信息。
    - 监听 `message`（成功）和 `error`。
    - Worker 完成后响应 HTTP 请求。
- 在 Worker 文件中：
    - 通过 `parentPort.on('message', ...)` 监听父进程消息。
    - 执行计算。
    - 通过 `parentPort.postMessage(...)` 返回结果。

**扩展：**

- 创建多个 Worker（如 4 个）拆分工作。
- 使用 `Promise.all` 收集结果并合并。

---