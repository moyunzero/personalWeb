---
title: "JavaScript 浅拷贝与深拷贝：示例和最佳实践 "
slug: 2025-03-07-javascript
description: ""
author: 墨韵
date: 2025-03-07
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-80eb-936a-c88df0c44d01
notionSyncedAt: 2026-05-27T05:50:48.035Z
---

# **什么是浅拷贝？**


浅拷贝创建一个新的对象，包含原始对象顶层属性的副本。对于原始值为基本类型（例如数字、字符串、布尔值）的属性，复制的是值本身。然而，对于原始值为对象的属性（如数组或嵌套对象），复制的是引用而不是实际数据。


这意味着虽然新对象有其自己的顶层属性副本，但嵌套对象或数组在原始副本之间仍然是共享的。


```javascript
const original = {
  name: "Alice",
  details: {
    age: 25,
    city: "Wonderland"
  }
};

// Shallow copy
const shallowCopy = { ...original };

// Modify the nested object in the shallow copy
shallowCopy.details.city = "Looking Glass";

// Original object is also affected
console.log(original.details.city); // Output: "Looking Glass"
```


## **如何创建浅拷贝**

1. 使用扩展运算符（ `...` ：

```javascript
const shallowCopy = { ...originalObject };
```

1. 使用 `Object.assign()` :

```javascript
const shallowCopy = Object.assign({}, originalObject);
```


尽管这些方法快速且简单，但它们不适用于深度嵌套的对象。


## **什么是深拷贝？**


深拷贝会复制原始对象的每个属性和子属性。这确保了副本与原始对象完全独立，对副本的更改不会影响原始对象。


深拷贝在处理复杂数据结构（如嵌套对象或数组）时至关重要，尤其是在数据完整性至关重要的场景中。


```javascript
const original = {
  name: "Alice",
  details: {
    age: 25,
    city: "Wonderland"
  }
};

// Deep copy using JSON methods
const deepCopy = JSON.parse(JSON.stringify(original));

// Modify the nested object in the deep copy
deepCopy.details.city = "Looking Glass";

// Original object remains unchanged
console.log(original.details.city); // Output: "Wonderland"
```


## **如何创建深拷贝**

1. 使用 `JSON.stringify()` 和 `JSON.parse()` ：
- 将对象转换为 JSON 字符串，然后再将其解析回新的对象。
- 局限性：
    - 无法处理循环引用。
    - 忽略如函数、 `undefined` 或 `Symbol` 这样的属性。

```javascript
const deepCopy = JSON.parse(JSON.stringify(originalObject));
```

1. 使用库：
- 库如 Lodash 提供了强大的深度克隆方法

```javascript
const _ = require('lodash');
   const deepCopy = _.cloneDeep(originalObject);
```

1. 自定义递归函数：
- 为了完全控制，你可以编写一个递归函数来克隆嵌套对象。

# **比较浅拷贝和深拷贝**


| 功能              | 浅拷贝         | 深拷贝            |
| --------------- | ----------- | -------------- |
| **范围**          | 仅复制顶级属性。    | 复制所有级别，包括嵌套数据。 |
| **References**  | 嵌套引用是共享的。   | 嵌套引用是独立的。      |
| **Performance** | 更快更轻便。      | 由于递归操作而变慢。     |
|  **用例**         | 平面或最少嵌套的对象。 | 深度嵌套的对象或不可变结构。 |


---


参考：[https://dev.to/hkp22/javascript-shallow-copy-vs-deep-copy-examples-and-best-practices-3k0a?context=digest](https://dev.to/hkp22/javascript-shallow-copy-vs-deep-copy-examples-and-best-practices-3k0a?context=digest)