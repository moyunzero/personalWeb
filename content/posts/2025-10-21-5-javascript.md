---
title: 每个开发人员都应该了解的 5 个 JavaScript 概念
slug: 2025-10-21-5-javascript
description: 早些时候，JavaScript 只提供了 var 关键字来声明变量。但 var 有一些问题。
author: 墨韵
date: 2025-10-21
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-801a-99b3-ee821fd72101
notionSyncedAt: 2026-05-27T04:37:36.551Z
---

# **1.let和const关键字**


早些时候，JavaScript 只提供了 var 关键字来声明变量。但 var 有一些问题。


首先是它的范围，可以是全局的或功能性的。


其次，用 var 声明的变量可以重新声明。此外，var 变量可以更新这一事实也可能存在问题。


因此，JavaScript 提供了两个新的关键字来应对不需要的情况 - let 和 const。


用 let 和 const 声明的变量具有块作用域。而且，用let声明的变量不能被重新声明，而用const声明的变量既不能重新声明也不能更新。


#  **2. 字符串插值**


字符串是编程世界中使用最广泛的数据类型之一。它们在 JavaScript 开发中被过度使用。使用字符串有时可能很复杂。


例如，观察以下代码。


```javascript
let firstname = "John";
let secondname = "Smith";
let age = 27;
let location = "Texas";
return firstname + " " + secondname + " is "
 + age + " years old and he lives in " + city;
```


return语句中的字符串没有问题，但是你不觉得有些复杂吗？字符串插值使这种情况变得非常简单。


```javascript
return `${firstname} ${secondname} is ${age} years
 old and he lives in ${city}`;
```


使用字符串插值，我们不需要使用连接运算符。我们可以简单地将变量写入字符串本身。


# **3. 扩展运算符**


扩展运算符用于在 JavaScript 中解包数组或对象。基本上，它解压以逗号分隔的数组或对象的元素。请观察以下代码。


```javascript
let arr1 = [1, 2, 3];
let arr2 = [4, 5, 6];
let arr3 = [ ...arr1, ...arr2 ]
console.log(arr3) // [1, 2, 3, 4, 5, 6]
```


在上面的代码中，arr3是使用arr1和arr2创建的。展开运算符（用…表示）用于解压 arr1 和 arr2。现在，无需扩展运算符即可完成此操作，但这将是一项艰巨的工作。


所以扩展运算符在这种情况下非常有用。此外，扩展运算符也可以类似地用于对象。


#  **4. 箭头函数**


JavaScript 开发人员长期以来一直需要箭头函数。箭头函数是一个简单的概念，可以让我们简洁地编写函数。请观察以下代码。


```javascript
function demo(a, b) {
	return a + b;
}
```


该演示是使用传统“function”关键字创建的普通 JavaScript 函数。现在观察以下代码。


```javascript
const demo = (a,b) => a + b;
```


# **5. 解构**


数组和对象解构是现代 JavaScript 的另一个强大功能。它用于从数组中提取对象或项目的属性。请观察以下代码。


```javascript
const obj = { name: "John", age: 27, city: "Texas" }
const { name, age, city } = obj;
```


在上面的代码中，“obj”的属性是使用对象解构来提取的。因此，你可以看到对象解构是使用大括号完成的。


类似地，可以使用数组解构来提取数组的项。数组解构是使用方括号完成的。