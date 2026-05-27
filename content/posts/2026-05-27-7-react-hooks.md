---
title: "必须了解的 7 个 React Hooks "
slug: 2026-05-27-7-react-hooks
description: React Hooks 彻底改变了我们在 React 函数组件中管理状态和副作用的方式。通过
  Hooks，我们可以封装可复用的逻辑并在组件之间共享，从而实现更简洁和模块化的代码。
author: 墨韵
date: 2024-09-23
categories:
  - note
tags:
  - React
  - frontend
draft: false
notionId: 36ddf5c0-26f4-800b-9ac8-dbd5ea312535
notionSyncedAt: 2026-05-27T05:50:35.441Z
---

React Hooks 彻底改变了我们在 React 函数组件中管理状态和副作用的方式。通过 Hooks，我们可以封装可复用的逻辑并在组件之间共享，从而实现更简洁和模块化的代码。


## 1. `useState()`


`useState` 是一个 React Hook，允许你在组件中添加一个状态变量，并返回一个包含两个值的数组：

- 当前状态
- 设置状态的函数

你可以传递初始值，例如：


```javascript
import { useState } from 'react';

function MyComponent() {
  const [age, setAge] = useState(28);
  const [name, setName] = useState('Taylor');
}
```


## 2. `useMemo()`


`useMemo` 是一个 React Hook，允许你在重新渲染之间缓存计算结果，从而避免 React 应用程序中的不必要渲染。


```javascript
import { useMemo } from 'react';

function TodoList({ todos, tab }) {
  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);
}
```


## 3. `useId()`


`useId` 是一个 React Hook，用于生成唯一的 ID，这些 ID 可以传递给无障碍属性。无障碍属性允许你指定两个标签之间的关联，你可以使用 `useId()` 生成的 ID 而不是硬编码它们。


```javascript
import { useId } from 'react';

function PasswordField() {
  const passwordHintId = useId();

  return (
    <>
      <input type="password" aria-describedby={passwordHintId} />
      <p id={passwordHintId}>
    </>
  );
}
```


## 4. `useCallback()`


`useCallback` 是一个 React Hook，允许你在重新渲染之间缓存函数定义。`useCallback` 缓存函数，而 `useMemo` 缓存计算值。


```javascript
import { useCallback } from 'react';

export default function ProductPage({ productId, referrer, theme }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);
}
```


## 5. `useEffect()`


`useEffect` 是一个 React Hook，允许你在组件中执行副作用。副作用基本上是指将组件与外部世界连接的操作。


```javascript
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => {
    connection.disconnect();
  };
}, [serverUrl, roomId]);
```


## 6. `useRef()`


`useRef` 是一个 React Hook，允许你引用一个不需要用于渲染的值。它类似于 `useState`，但不同之处在于 `useRef` 的值变化不会导致重新渲染。


```javascript
import { useRef } from 'react';

function MyComponent() {
  const intervalRef = useRef(0);
  const inputRef = useRef(null);
}
```


## 7. `useContext()`


`useContext` 是一个 React Hook，允许你从组件中读取并订阅上下文，就像一个数据存储（如 Redux）。`useContext` Hook 让你可以读取存储在上下文中的数据，这是一个数据存储。


以下示例仅用于演示 `useContext` Hook，而不是创建上下文。


```javascript
import { useContext } from 'react';

function MyComponent() {
  const theme = useContext(ThemeContext);
}
```


---


React Hooks 对于 React 开发者来说是一个颠覆性的工具，它提供了一种简单的方式来管理函数组件中的状态和副作用。


---


### 1. `useState()`


```javascript
import { useState } from 'react';

function MyComponent() {
  const [age, setAge] = useState(28);
  const [name, setName] = useState('Taylor');
}
```

- **`useState`** 是 React 中最基本的 Hook，用于在函数组件中添加状态（state）。
- 语法：`const [state, setState] = useState(initialState)`。
    - `state` 是当前状态的值。
    - `setState` 是一个函数，用于更新状态。
    - `initialState` 是状态的初始值。
- 在上面的代码中：
    - `age` 的初始值是 `28`。
    - `name` 的初始值是 `'Taylor'`。
    - 如果调用 `setAge(30)`，`age` 的值会变为 `30`，并且组件会重新渲染。

### 2. `useMemo()`


```javascript
import { useMemo } from 'react';

function TodoList({ todos, tab }) {
  const visibleTodos = useMemo(
    () => filterTodos(todos, tab),
    [todos, tab]
  );
}
```

- **`useMemo`** 用于缓存计算结果，避免在每次渲染时都执行复杂的计算。
- 语法：`const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])`。
    - 第一个参数是一个计算函数。
    - 第二个参数是一个依赖数组，只有当依赖数组中的值发生变化时，计算函数才会重新执行。
- 在上面的代码中：
    - `filterTodos(todos, tab)` 是一个计算函数，用于过滤 `todos`。
    - 如果 `todos` 或 `tab` 没有变化，`visibleTodos` 的值会被缓存，不会重新计算。

### 3. `useId()`


```javascript
import { useId } from 'react';

function PasswordField() {
  const passwordHintId = useId();

  return (
    <>
      <input type="password" aria-describedby={passwordHintId} />
      <p id={passwordHintId}>
    </>
  );
}
```

- **`useId`** 用于生成唯一的 ID，这些 ID 可以传递给无障碍属性（aria标签）。
- 语法：`const id = useId()`。
    - 返回一个全局唯一的、稳定的 ID。
- 在上面的代码中：
    - `passwordHintId` 是一个动态生成的 ID。
    - 输入框和段落元素通过 `aria-describedby` 和 `id` 属性关联，提供更好的无障碍支持。

### 4. `useCallback()`


```javascript
import { useCallback } from 'react';

export default function ProductPage({ productId, referrer, theme }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);
}
```

- **`useCallback`** 用于缓存函数，避免在每次渲染时都创建新的函数。
- 语法：`const memoizedCallback = useCallback(() => { /*...*/ }, [deps])`。
    - 第一个参数是一个函数。
    - 第二个参数是一个依赖数组，只有当依赖数组中的值发生变化时，函数才会重新创建。
- 在上面的代码中：
    - `handleSubmit` 是一个函数，用于处理表单提交。
    - 如果 `productId` 或 `referrer` 没有变化，`handleSubmit` 的引用不会改变，避免不必要的组件重新渲染。

### 5. `useEffect()`


```javascript
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => {
    connection.disconnect();
  };
}, [serverUrl, roomId]);
```

- **`useEffect`** 用于在组件中执行副作用（side effects），例如数据请求、订阅或手动修改 DOM。
- 语法：`useEffect(() => { /* side effects */ return () => { /* cleanup */ }; }, [deps])`。
    - 第一个参数是一个函数，包含需要执行的副作用。
    - 第二个参数是一个依赖数组，只有当依赖数组中的值发生变化时，副作用才会重新执行。
    - 返回一个清理函数（可选），用于在组件卸载或依赖变化时清理资源。
- 在上面的代码中：
    - 连接到服务器并建立连接。
    - 在组件卸载或 `serverUrl` 或 `roomId` 发生变化时，断开连接。

### 6. `useRef()`


```javascript
import { useRef } from 'react';

function MyComponent() {
  const intervalRef = useRef(0);
  const inputRef = useRef(null);
}
```

- **`useRef`** 用于创建一个可变的引用，可以在组件的渲染之间保持值，不会触发重新渲染。
- 语法：`const refContainer = useRef(initialValue)`。
    - `refContainer.current` 保存实际的值。
- 在上面的代码中：
    - `intervalRef` 可以用于存储计时器 ID。
    - `inputRef` 可以用于访问 DOM 输入元素。

### 7. `useContext()`


```javascript
import { useContext } from 'react';

function MyComponent() {
  const theme = useContext(ThemeContext);
}
```

- **`useContext`** 用于读取上下文（Context）。
- 语法：`const value = useContext(Context)`。
    - `Context` 是通过 `React.createContext` 创建的上下文对象。
- 在上面的代码中：
    - `ThemeContext` 是一个上下文对象。
    - `theme` 是从上下文中读取的值。

---


参考：[https://dev.to/vishnusatheesh/top-7-react-hooks-you-must-know-3k7g?context=digest](https://dev.to/vishnusatheesh/top-7-react-hooks-you-must-know-3k7g?context=digest)