---
title: "JavaScript 中的 Promise 映射 "
slug: 2025-01-09-javascript-promise
description: 想象一下：你得到了一系列需要异步处理的项目。这些项目可能代表了一些ID，你需要为每个ID获取数据。
author: 墨韵
date: 2025-01-09
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-8018-ac8e-f18ebfd1aed1
notionSyncedAt: 2026-05-27T04:40:21.383Z
---

# 问题


想象一下：你得到了一系列需要异步处理的项目。这些项目可能代表了一些ID，你需要为每个ID获取数据。这里是人们常犯的一个错误：


```sql
const ids = [1, 2, 3, 4, 5];

const fetchData = async (id) => {
  // Simulates an async fetch operation
  return `data for ${id}`;
};

const processItems = async () => {
  const result = ids.map(async (id) => {
    return await fetchData(id);
  });

  console.log(result); // [Promise {<pending>}, Promise {<pending>}, ...]
};

processItems();
```


好的，那么这里出了什么问题？ map函数返回的是一个promise数组，并没有等待它们解决。这不是我们想要的效果，并且在后续使用结果时可能会导致混乱。


## The for…of Loop Solution


一种方法是使用 `for...of` 循环。如果你的异步操作需要按顺序发生而不是并行执行，这很有用。


```sql
const processItemsSequentially = async () => {
  const result = [];
  for (const id of ids) {
    const data = await fetchData(id);
    result.push(data);
  }

  console.log(result); // ['data for 1', 'data for 2', ...]
};

processItemsSequentially();
```


如果你在追求顺序执行的话，这样做更容易阅读和理解，但是要小心——这种方法可能会更慢，因为每个操作都在等待前一个操作完成。


# The Promise.all Solution


让我们使用 Promise.all 和 Array.prototype.map() 来清理一下。这种巧妙的方法可以获取我们的 Promise 数组并返回一个在所有 Promise 都解决时解决的单一 Promise。


```sql
const processItems = async () => {
  const result = await Promise.all(ids.map((id) => {
    return fetchData(id);
  }));

  console.log(result); // ['data for 1', 'data for 2', ...]
};

processItems();
```


砰！现在我们开始真正做事了。把一系列的 promise 包装在一个单一的 promise 中，这个 promise 会带着结果一起解决。这样好多了，而且还能并发运行！不过，有一个问题。并发运行 promises（例如，有1000个项）并不总是意味着速度快。这可能会变慢，并且可能导致内存问题。

> 提示：在这个示例中，可以选择使用`Promise.all()`或`Promise.allSettled()`。

## The Cleaner Solution with p-map


最后，让我们看看一种更好的方式来并发映射，同时限制并发运行的 promise 数量。为此，我们将使用 npm 上的 p-map。你可以通过运行 `npm install p-map` 将其添加到你的项目中。


它与 `Promise.all()` 不同，因为你可以控制并发限制并决定是否在出现错误时停止迭代。我们定义的 `processItems()` 函数看起来是这样的：


```sql
import pMap from "p-map";
const ids = [1, 2, 3, 4, 5];

const fetchData = async (id: number) => {
  // Simulates an async fetch operation
  return `data for ${id}`;
};

const processItems = async () => {
  const result = await pMap(ids, 
    (id) => fetchData(id), { concurrency: 2 });

  console.log(result); // ['data for 1', 'data for 2', ...]
};

processItems();
```


虽然我们在这里使用了不同的语法，但这个版本简洁且有效。通过设置并发限制，这种模式可以避免在数据量大时使系统过载，并且我们可以控制在出现错误时是停止还是继续。