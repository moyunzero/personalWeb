---
title: Think You Know JavaScript? These 15 Quirks Will Change Your Mind!  (1)
slug: 2025-06-02-think-you-know-javascript-these-15-quirk
description: JavaScript 使用 IEEE-754 进行浮点运算，这可能导致精度问题。
author: 墨韵
date: 2025-06-02
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-802f-8dac-fe6214f843e7
notionSyncedAt: 2026-05-27T04:37:43.831Z
---

# **1.** **`"False" == 0`** **but Not** **`"False" == "0"`** 


您可能期望 `"False"` 等于 `"0"` ，但这里有个问题： `"False" == 0` 是正确的，但 `"False" == "0"` 是错误的。


这是因为 JavaScript 的相等运算符（ `==` ）触发了类型强制转换。当你将一个字符串与一个数字进行比较时，JS 会首先尝试将字符串转换为数字。由于 `"False"` 实际上没有数值，它变成了 `NaN` 。但是 `"0"` 变成了数字 `0` ，所以当我们比较 `0 == 0` 时，结果是正确的！


# **2. 0.1 + 0.2 并不等于 0.3**


```javascript
console.log(0.1 + 0.2 === 0.3); // false
```


为什么？JavaScript 使用 IEEE-754 进行浮点运算，这可能导致精度问题。所以， `0.1 + 0.2` 并不正好等于 `0.3` 。例如，在金融应用中，这是一个常见的陷阱。


**Solution:**  


```javascript
const isEqual = Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;
console.log(isEqual); // true
```


# **3.** **`typeof null`** **返回 "对象"** 


当你检查 `null` 的类型时，它会给你 `"object"` 。


```javascript
console.log(typeof null); // object
```


嗯，这是 JavaScript 早期的一个历史错误。 `null` 的类型应该是 `"null"` ，但由于一个错误，它最终变成了 `"object"` 。


# **4.** **`[1,2,3] + [4,5,6] = "1,2,34,5,6"`** 


这里还有一个奇怪的情况！当你把两个数组相加时，JavaScript 会先将它们转换为字符串再相加。结果？一个奇怪的连接！


```javascript
console.log([1, 2, 3] + [4, 5, 6]); // "1,2,34,5,6"
```


这是因为数组被转换为字符串，导致出现 `"1,2,3"` 和 `"4,5,6"` ，当它们相加时，就变成了 `"1,2,34,5,6"` 。


# **5.** **`NaN === NaN`** **是 False**


是的， `NaN` （非数字）是 JavaScript 中的一个特殊值，它永远不会等于自身。


这个逻辑的依据是 `NaN` 不是一个实数，因此它不能等于任何东西，甚至不能等于它自己。


检查 `NaN` ，请使用 `Number.isNaN()` ：


```javascript
console.log(Number.isNaN(NaN)); // true
```


# **6. 为什么** **`[] == ![]`** **是 True 但** **`[] == []`** **是 False** 


在 JavaScript 中， `[] == ![]` 为真，但 `[] == []` 为假。怎么呢？

- `[] == []` 是错误的，因为两个不同的空数组不是同一个对象引用。
- `[] == ![]` 之所以有效，是因为 `![]` 转换为 `false` ，空数组是一个真值。因此， `[] == false` 在转换后变为真。

# **7. Math.max() 返回 -Infinity** 


当你不带任何参数调用 `Math.max()` 时，它返回-Infinity。


```javascript
console.log(Math.max()); // -Infinity
```


这是因为 JavaScript 将参数的缺失视为与负无穷大的比较。如果您需要一个回退值，请使用：


```javascript
const max = Math.max(...numbers) || 0;
```


# **8.** **`0 == "0"`** **和** **`0 == []`** **但** **`"0" != []`**


JavaScript 的 `==` 运算符在类型强制转换中做一些奇怪的事情。例如， `0 == []` 为真，但 `"0" == []` 为假。


```javascript
console.log(0 == "0"); // true
console.log(0 == []);  // true
console.log("0" == []); // false
```


这是因为当与 `"0"` 比较时， `[]` 首先被强制转换为空字符串，导致第二次比较为假。


# **9.** **`undefined + 1`** **返回 NaN，但** **`null + 1`** **返回 1**


这里有一个奇怪的现象。当你将 `undefined` 加到一个数字上时，你会得到 `NaN` 。但是将 `null` 加到一个数字上会导致得到 `1` 。


```javascript
console.log(undefined + 1); // NaN
console.log(null + 1);      // 1
```


`undefined` 不是一个数字，所以它给出你 `NaN` ，而 `null` 在算术运算中被视为 `0` 。


# **10. New Array(3) 与 [,,]** 


`new Array(3)` 创建一个有 3 个槽位的空数组（没有值），而 `[,,]` 创建一个包含 2 个未定义值的数组。


```javascript
console.log(new Array(3)); // [ <3 empty items> ]
console.log([,,]);          // [undefined, undefined]
```


# **11.** **`parseFloat("3.14abc")`** **行，但** **`parseInt("3.14abc")`** **不行** 


解析包含数字和文本的字符串时， `parseFloat` 将尝试读取到第一个非数字字符为止的数字。另一方面， `parseInt` 在第一个非数字字符处停止，不适用于小数。


```javascript
console.log(parseFloat("3.14abc"));  // 3.14
console.log(parseInt("3.14abc"));    // 3
```


# **12.** **`[] + {}`** **与** **`{}`** **+ []** 


你知道在 JavaScript 中运算符的优先级很重要吗？ `[] + {}` 会得到一个字符串，但 `{}` + []则没有任何作用。


```javascript
console.log([] + {});   // "[object Object]"
console.log({} + []);   // "[object Object]"
```


# **13. 0.1 * 0.1 打印“0.010000000000000002”**


JavaScript 的浮点运算有时可能会给出意外的结果，比如在 `0.1 * 0.1` 的情况下


```javascript
console.log(0.1 * 0.1); // 0.010000000000000002
```


这发生是因为二进制浮点精度错误。


# **14. 真值和假值**


```javascript
console.log(!!"");      // false
console.log(!!0);       // false
console.log(!!null);    // false
console.log(!!1);       // true
```