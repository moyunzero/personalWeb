---
title: JavaScript 中事件循环
slug: 2024-12-02-javascript
description: ，事件循环是 JavaScript 管理多个任务的方式——比如执行代码、等待 API 响应和处理用户交互。
author: 墨韵
date: 2024-12-02
categories:
  - note
tags:
  - frontend
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-8032-9445-fa0aeaa511ce
notionSyncedAt: 2026-05-27T05:51:00.421Z
---

# 什么是事件循环？


简单来说，事件循环是 JavaScript 管理多个任务的方式——比如执行代码、等待 API 响应和处理用户交互。


JavaScript 是单线程的，这意味着它只能在主线程中同时处理一个任务。但是，有了事件循环，它创造了一种多任务处理的错觉！


# 同步代码


```javascript
console.log("1️⃣ Start cooking 🍳");  
console.log("2️⃣ Eat breakfast 🍴");  
console.log("3️⃣ Wash dishes 🧼");  

//out 
1️⃣ Start cooking 🍳  
2️⃣ Eat breakfast 🍴  
3️⃣ Wash dishes 🧼
```


说明：这些任务一个接一个发生（同步执行）


# 使用 `setTimeout` 添加异步任务


```javascript
console.log("1️⃣ Start cooking 🍳");  

setTimeout(() => {  
  console.log("2️⃣ Eat breakfast 🍴 (after 3 seconds)");  
}, 3000);  

console.log("3️⃣ Wash dishes 🧼");  

//out
1️⃣ Start cooking 🍳  
3️⃣ Wash dishes 🧼  
2️⃣ Eat breakfast 🍴 (after 3 seconds)
```


说明：

- `setTimeout` 任务发送到 Web API（不属于主线程）。
- 一旦计时器结束，它将被放入回调队列中，等待主线程空闲。
- 事件循环确保回调在同步任务之后执行。

# 微任务与宏任务


事件循环优先处理微任务（如 `Promise` 回调）而非宏任务（如 `setTimeout` ）。


```javascript
console.log("1️⃣ Start 🍳");  

setTimeout(() => {  
  console.log("2️⃣ Macrotask: Timeout ⏳");  
}, 0);  

Promise.resolve().then(() => {  
  console.log("3️⃣ Microtask: Promise ✅");  
});  

console.log("4️⃣ End 🚀");  

//out
1️⃣ Start 🍳  
4️⃣ End 🚀  
3️⃣ Microtask: Promise ✅  
2️⃣ Macrotask: Timeout ⏳
```


# 处理重任务


你有没有见过页面在运行繁重任务时卡住？让我们用异步代码来解决这个问题吧！


### 不良示例（阻塞事件循环）


```javascript
console.log("1️⃣ Start 🏁");  

for (let i = 0; i < 1e9; i++) {}  // Simulating heavy task  

console.log("2️⃣ End 🛑");
```


### 更好的例子（使用 `setTimeout` 进行分块）


```javascript
console.log("1️⃣ Start 🏁");  

let count = 0;  

function heavyTask() {  
  if (count < 1e6) {  
    count++;  
    if (count % 100000 === 0) console.log(`Processed ${count} items 🔄`);  
    setTimeout(heavyTask, 0); // Let the event loop breathe!  
  } else {  
    console.log("2️⃣ Task Complete ✅");  
  }  
}  

heavyTask();
```