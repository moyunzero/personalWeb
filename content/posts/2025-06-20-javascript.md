---
title: 如何使用开发者工具在浏览器中调试 JavaScript
slug: 2025-06-20-javascript
description: 调试 JavaScript
author: 墨韵
date: 2025-06-20
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-8013-a784-e824c998e754
notionSyncedAt: 2026-05-27T04:39:12.528Z
---

准备了一些有问题的代码，这些代码应该加四个数字并计算它们的平均值。


这是代码的 HTML：


```html
<label for="num1">Number 1:</label>
<input type="text" id="num1" placeholder="Enter a number" />
<label for="num2">Number 2:</label>
<input type="text" id="num2" placeholder="Enter a number" />
<label for="num3">Number 3:</label>
<input type="text" id="num3" placeholder="Enter a number" />
<label for="num4">Number 4:</label>
<input type="text" id="num4" placeholder="Enter a number" />

<button id="calculateBtn">Calculate Sum and Average</button>

<p id="addition-result"></p>
<p id="average-result"></p>

<script src="script.js"></script>
```


这是将标签推到相应行并稍微放大输入元素和按钮的最小 CSS：


```css
body {
  background: #d2d2d2;
}

label {
  display: block;
  margin-top: 0.5rem;
}

button {
  display: block;
  margin-top: 1rem;
}

input,
button {
  padding: 0.2rem;
}
```


![%E6%88%AA%E5%B1%8F2024-11-19_22.53.29.png](images/blog/2025-06-20-javascript/img-cccaf5144f.png)


这里是出现错误的 JavaScript 代码：


```javascript
const calculateBtn = document.getElementById('calculateBtn');
const sumText = document.getElementById('sum');
const avgText = document.getElementById('average');

function calculateTotal(a, b, c, d) {
 return a + b + c + d;
}

function calculateAverage(total, count) {
 return total / count;
}

function handleButtonClick() {
 let num1 = document.getElementById('num1').value;
 let num2 = document.getElementById('num2').value;
 let num3 = document.getElementById('num3').value;
 let num4 = document.getElementById('num4').value;

 let total = calculateTotal(num1, num2, num3, num4);
 let average = calculateAverage(total, 4);

 sumText.textContent = `The sum is ${total}`;
 avgText.textContent = `The average is: ${average}`;
}

calculateBtn.addEventListener('click', handleButtonClick);
```


这里是输入 4 个数字，比如 `3` ， `4` ， `2` ， `1` ，然后点击 `Calculate Sum and Average` 按钮会发生的情况：


![%E6%88%AA%E5%B1%8F2024-11-19_22.54.12.png](images/blog/2025-06-20-javascript/img-6066d0ae9d.png)


不幸的是，数字被合并了，平均值是基于这个计算的，这意味着正在发生连接而不是加法。有缺陷的加法也导致平均值计算有缺陷。


让我们调查浏览器开发者工具中发生了什么。


# **如何使用 Chrome 开发者工具调试 JavaScript 代码**


当出现此类错误时，您可能会想添加大量控制台日志。


很多时候，控制台日志能完成任务 - 但你需要花很多时间来弄清楚事情。


浏览器开发者工具为您提供了更多选项，例如添加断点、监视特定表达式，甚至可以逐行执行代码以查看错误发生的位置。


## **How to Open the Developer Tools and the Sources Tab**


首先，在浏览器中右键单击并选择“inspect”以打开 Chrome 开发者工具。


在 DevTools 中，切换到“Sources”标签以查看程序中的文件。您还可以按键盘上的 `F12` 并选择“源”标签。


这里是对 Chrome 开发者工具“Sources”标签页的简要解剖：


![%E6%88%AA%E5%B1%8F2024-11-19_22.55.44.png](images/blog/2025-06-20-javascript/img-b8a1705159.png)


在调试器标签页上方有一些灰色图标。当它们处于活动状态时，可以让你逐步执行代码并添加或删除断点。


同样在debugger标签页中包括：

- Watch: 在此处您可以添加并查看表达式
- Breakpoints断点：您可以看到您添加断点的代码行
- Scope: 作用域：包含局部和全局变量
- Callstack:调用栈：显示导致当前代码执行点的函数调用

## **如何通过添加断点调试代码**


要开始调试代码，您可以点击行号来在某一行设置断点。


断点就像你可以在开发者工具中设置的行标记，可以在执行该行代码之前暂停代码执行。这让你可以检查变量值，查看函数是否按预期调用，或者观察代码的一般流程。


当你添加一个断点并执行代码时，该行将出现一个蓝色图标，表示执行将在该行之前暂停。


另外，您也可以将 `debugger` 语句添加到您希望执行暂停的行。但让我们坚持使用断点。


例如，让我们在第 14 行添加一个断点，然后输入四个数字并点击 `Calculate Sum and Average` 按钮，以便代码运行：


![%E6%88%AA%E5%B1%8F2024-11-19_22.57.59.png](images/blog/2025-06-20-javascript/img-d73ad3200b.png)


此时，你可以看到执行没有继续——这就是为什么你在“局部”下看到所有变量的值都显示为“不可用”。


从这里，您可以开始逐行执行代码，通过点击右上角的步骤图标：


![%E6%88%AA%E5%B1%8F2024-11-19_22.59.03.png](images/blog/2025-06-20-javascript/img-c5061c0978.png)


一旦点击步骤图标，你退出的那一行就会执行。


![%E6%88%AA%E5%B1%8F2024-11-19_22.59.39.png](images/blog/2025-06-20-javascript/img-7bf5131a5e.png)


您可以看到 `"3"` 是行 `14` 的值。这个值被一对双引号包围。这意味着它是一个字符串。不过，您需要确保这一点，这正是监视功能让您做到的。您很快就会了解这个功能。


如果你正在处理多行代码，逐行调试可能会很耗时。因此，你可能需要添加另一个断点。


我将继续在行 `23` 处设置断点并再次运行代码：


![%E6%88%AA%E5%B1%8F2024-11-19_23.00.23.png](images/blog/2025-06-20-javascript/img-5316ec61f4.png)


## **如何使用开发者工具的watch功能**


开发者工具的监视功能允许您在代码运行时监控特定的变量或表达式。


为了确认变量的数据类型，您可以添加一个显示它们值的监视表达式，或者更合适的是，显示它们的类型。


要添加监视表达式，请点击“监视”旁边的加号（+）图标，然后在键盘上按 `ENTER` 。


![%E6%88%AA%E5%B1%8F2024-11-19_23.01.36.png](images/blog/2025-06-20-javascript/img-3885920a26.png)


这里是一些确认 `num1` - `num4` 和 `total` 是字符串的表达式——但它们应该是整数：


您也可以在控制台标签中通过检查变量类型来验证此内容：


![%E6%88%AA%E5%B1%8F2024-11-19_23.02.22.png](images/blog/2025-06-20-javascript/img-333899d6fa.png)


这意味着您输入的数字被视为字符串。这是因为，在 JavaScript 中，从 HTML 元素（如输入字段）检索的值始终被视为字符串。


这是因为输入元素的 `value` 属性返回一个字符串，无论你输入的是数字——这就是 bug 被引入的原因。


记住，JavaScript 只会连接字符串，即使它们是数字。这意味着 `"3"` 是字符串类型，而不是整数类型。


为了修复错误，您应该将 `num1` 到 `num4` 的类型更改为整数，以便 JavaScript 可以正确地求和它们的值。


您可以接着在开发者工具中修复这个问题，并在 Windows 上按 `CTRL + S` 或在 Mac 上按 `CMD + S` 来保存代码。您也可以在代码编辑器内部修复它，通过将数字的变量包裹在 `parseInt()` 中。


一旦你这样做并再次运行代码，正确的数据类型应该会在监视器中显示，正确的变量值应该会在“局部”下显示


![%E6%88%AA%E5%B1%8F2024-11-19_23.03.08.png](images/blog/2025-06-20-javascript/img-f870146edc.png)


```javascript
const calculateBtn = document.getElementById('calculateBtn');
const sumText = document.getElementById('sum');
const avgText = document.getElementById('average');

function calculateTotal(a, b, c, d) {
  return a + b + c + d;
}

function calculateAverage(total, count) {
  return total / count;
}

function handleButtonClick() {
  let num1 = parseInt(document.getElementById('num1').value);
  let num2 = parseInt(document.getElementById('num2').value);
  let num3 = parseInt(document.getElementById('num3').value);
  let num4 = parseInt(document.getElementById('num4').value);

  let total = calculateTotal(num1, num2, num3, num4);
  let average = calculateAverage(total, 4);

  sumText.textContent = `The sum is ${total}`;
  avgText.textContent = `The average is: ${average}`;
}

calculateBtn.addEventListener('click', handleButtonClick);
```