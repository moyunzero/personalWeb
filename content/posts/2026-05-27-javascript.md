---
title: 精通 JavaScript 中的高阶函数
slug: 2026-05-27-javascript
description: ""
author: 墨韵
date: 2024-12-27
categories:
  - note
tags:
  - JavaScript
  - frontend
draft: false
notionId: 36ddf5c0-26f4-804b-b495-d7ee33c93a0f
notionSyncedAt: 2026-05-27T05:51:16.793Z
---

# **1. 函数式编程**


函数式编程是一种强调的编程范式：

- 纯函数：没有副作用，对于相同的输入返回相同输出的函数。
- 不可变性：数据不会改变；相反，会创建新的数据结构。
- 一等函数：函数被视为值。
- 高阶函数：操作其他函数的函数。

遵循这些原则，函数式编程确保代码干净、可预测且易于维护。


![%E6%88%AA%E5%B1%8F2024-12-27_22.22.58.png](images/blog/2026-05-27-javascript/img-ca25e8c8af.png)


# 2. 一级函数


在 JavaScript 中，函数是一等公民。这意味着：

- 函数可以被分配给变量：

```javascript
const greet = function(name) {
       return `Hello, ${name}!`;
   };
   console.log(greet("Alice")); // Output: Hello, Alice!
```

- 函数可以作为参数传递：

```javascript
function applyFunction(value, func) {
       return func(value);
   }
   const square = x => x * x;
   console.log(applyFunction(5, square)); // Output: 25
```

- 函数可以从其他函数中返回：

```javascript
function multiplier(factor) {
       return num => num * factor;
   }
   const double = multiplier(2);
   console.log(double(4)); // Output: 8
```


# **3. 高阶函数**


高阶函数是指这样的函数：

- 接受另一个函数作为参数，或
- 返回一个函数作为结果。

**JavaScript 示例：**

- `Array.prototype.map()`
- `Array.prototype.filter()`
- `Array.prototype.reduce()`

这些内置方法展示了高阶函数的优雅和实用性。


# **4. Array.prototype.map()**


The `map()` 方法通过将回调函数应用于数组的每个元素来创建一个新数组。


```javascript
const numbers = [1, 2, 3, 4];
const doubled = numbers.map(num => num * 2);
console.log(doubled); // Output: [2, 4, 6, 8]
```


这里， `map()` 对每个元素执行回调，转换数组而不改变原始数组。


# **5. Array.prototype.filter()**


该 filter()方法返回一个包含满足提供条件的新数组的元素。


```javascript
const numbers = [1, 2, 3, 4];
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log(evenNumbers); // Output: [2, 4]
```


这种方法非常适合从数组中提取特定元素。


# **6. 创建您自己的高阶函数**


为了真正理解高阶函数，自己创建一些是有益的。让我们实现一个自定义的 `map()` 版本：


```javascript
function customMap(array, callback) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        result.push(callback(array[i], i, array));
    }
    return result;
}

const numbers = [1, 2, 3, 4];
const doubled = customMap(numbers, num => num * 2);
console.log(doubled); // Output: [2, 4, 6, 8]
```


# **7. 高阶函数的优势**

- 代码复用：编写通用的函数，使其能够与任何回调函数一起工作。
- 清晰：抽象出循环和重复逻辑。
- 功能组合：链式函数进行复杂转换。