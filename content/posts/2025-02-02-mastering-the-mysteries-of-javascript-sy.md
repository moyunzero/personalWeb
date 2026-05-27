---
title: "Mastering the Mysteries of JavaScript Syntax: Discover the Secrets
  Behind These Symbols "
slug: 2025-02-02-mastering-the-mysteries-of-javascript-sy
description: 安全赋值运算符 `?=` 仅在变量为空或未定义时才赋值。
author: 墨韵
date: 2025-02-02
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-808b-9d11-dc9918ba6f71
notionSyncedAt: 2026-05-27T04:40:17.498Z
---

# **1. ?=（安全赋值运算符）**


安全赋值运算符 `?=` 仅在变量为空或未定义时才赋值。


```sql
let x;
x ?= 10;
console.log(x); // Output: 10 (since x was undefined)
```


**为什么使用它？**


此操作符避免了不必要的覆盖已持有有效值的变量。


使用 ?= 在您想要安全地分配默认值而不覆盖现有值时。


# **2. ??=空值赋值运算符（Nullish Assignment Operator）**


赋值运算符 = 将值分配给变量。


```sql
let z = null;
z ??= 15;
console.log(z); // Output: 15 (since z was null)
```


它确保只有在变量为 nullish 时才分配值，避免了像 0 或""这样的假值陷阱。


使用 ??= 当您想为一个可能为 null 或未定义的变量设置一个回退值时。


# **3. &=（按位与赋值运算符）**


&=运算符执行按位与操作，并将结果赋值回变量。


```sql
let num = 5;  // (101 in binary)
num &= 3;     // (011 in binary)
console.log(num); // Output: 1 (bitwise AND result)
```


位运算速度快，在底层编程中非常有用，例如管理标志或处理二进制数据。


仅在有必要时使用 &= 进行位运算，通常在性能敏感的环境中。


# **4.  ~~双非位运算符（双非位运算符）**


~~运算符是用于将浮点数转换为整数的简写。


```sql
let decimal = 4.8;
let integer = ~~decimal;
console.log(integer); // Output: 4
```


这是一个在需要截断数字而不进行四舍五入时比 Math.floor()更快的替代方案。


使用~~可以在需要快速高效地截断数字时使用，尤其是在性能关键代码中。


# **5. 按位或赋值运算符（|=）**


|=运算符执行按位或操作，并将结果赋值给变量。


```sql
let a = 5;  // (101 in binary)
a |= 3;     // (011 in binary)
console.log(a); // Output: 7 (bitwise OR result)
```


当在低级任务（如标志管理）中操作位时很有用。


在性能关键的应用中使用 |= 进行二进制操作。


# **6.  ||=等于或赋值运算符（Logical OR Assignment Operator）**


仅当现有值为假时（如 null、0、false），||=运算符才将值赋给变量。


```sql
let b = 0;
b ||= 10;
console.log(b); // Output: 10 (since b was falsy)
```


简化了在不使用长 if 条件的情况下分配回退值的过程。


使用 `||=` 为可能具有假值的变量分配默认值，提高可读性。