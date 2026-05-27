---
title: 使用 JavaScript 生成器来可视化算法
slug: 2025-04-26-javascript
description: 冒泡排序是一种简单的排序算法，其原理是重复地遍历要排序的数列。
author: 墨韵
date: 2025-04-26
categories:
  - note
tags:
  - frontend
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-8065-89da-c3d8bfc563ae
notionSyncedAt: 2026-05-27T04:40:03.572Z
---

现在有冒泡排序算法：


```javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; ++i) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}
```

> 冒泡排序是一种简单的排序算法，其原理是重复地遍历要排序的数列，一次比较两个元素，如果它们的顺序错误就把它们交换过来。遍历数列的工作是重复进行的，直到没有再需要交换的元素为止，也就是说该数列已经排序完成。
> 1. **外层循环**：控制冒泡排序的轮数，总共需要遍历 n-1 次，其中 n 是数组的长度。
> 2. **内层循环**：在已排序部分之前进行相邻元素的比较和交换。遍历范围逐渐减少，因为每次遍历后，最大的元素会"沉"到最后。
> 3. **元素比较和交换**：如果前一个元素大于后一个元素，就交换它们。
> 4. **如果没有发生交换**：在一轮内循环中，如果没有发生交换，说明数组已经有序，提前退出循环。
>

另一方面，一个函数将执行算法并在算法运行时更新可视化。


为了实现这一点，一般想到的是将this.refresh()添加到算法中交换元素的位置。


这样，每次交换元素时，可视化都会更新。示例如下：


```javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; ++i) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        this.refresh(arr[j], arr[j + 1]);//可视化更新
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}
 
class BasicController {
  refresh(a, b) {
    console.log(`Swapping ${a} and ${b}`);
  }
 
  play() {
    const arr = [2, 5, 1, 3];
    console.log("Initial array:", arr);
    const sortedArr = bubbleSort.call(this, arr);
    console.log("Sorted array:", sortedArr);
  }
}
 
const controller = new BasicController();
controller.play();
```

> BasicController 类：refresh 方法用于在每次交换时输出被交换的两个元素。play 方法用来启动整个流程，首先打印初始数组，然后调用 bubbleSort 方法进行排序，最后打印排序后的数组。实例化 BasicController 并运行：通过 controller.play() 来启动排序过程。
>
> 注意：
>
> - bubbleSort.call(this, arr) 通过 call 将 BasicController 的实例 this 传递给 bubbleSort 函数，以便在 bubbleSort 中调用 this.refresh 方法。
> - 在 bubbleSort 函数内部使用了一个 swapped 变量来跟踪是否进行了元素的交换，以此决定是否可以提前退出外层循环。
>

运行代码，将得到以下输出：


```javascript
Initial array: [ 2, 5, 1, 3 ]
Swapping 1 and 5
Swapping 3 and 5
Swapping 1 and 2
Sorted array: [ 1, 2, 3, 5 ]
```


这种方式有几个问题：

1. 对于可视化，异步是理想的选择，这意味着它应该能够随时暂停并稍后恢复，从而允许在每次迭代时查看数组的状态。
2. 如果算法运行时没有找到this.refresh()函数，则会抛出错误。

## 了解 JS 生成器


JavaScript generators是特殊函数，主要不同于普通函数，因为它们是逐步执行的。也就是说，当调用生成器时，它不会运行完成。相反，它执行到某个点或breakpoint ，返回一个值，然后暂停执行并可以选择稍后恢复。

- 生成器函数function* ，其中星号 * 表示它是生成器函数。
- 有yield关键字，它用于返回一个值并暂停生成器函数的执行。

```javascript
function fibonacci(n) {
  let a = 0,
    b = 1;
  for (let i = 0; i < n; ++i) {
    let temp = a;
    a = b;
    b = temp + b;
  }
  return a;
}

//generator
function* fibonacci(n) {
  let a = 0,
    b = 1;
  for (let i = 0; i < n; ++i) {
    let temp = a;
    a = b;
    b = temp + b;
    yield a;
  }
}

const gen = fibonacci(5);
 
let result = gen.next();
while (!result.done) {
  console.log(result.value);
  result = gen.next();
}
```


**基本工作原理**

1. **定义生成器函数**： 生成器函数的定义与普通函数类似，只是多了一个 * 号。
2. **调用生成器函数**： 调用生成器函数不会立即执行函数体，而是返回一个生成器对象（Generator Object），可以通过这个对象来控制函数的执行流程。
3. **使用生成器对象**： 生成器对象提供了一个 next 方法，每次调用 next 方法时，生成器函数会在遇到 yield 关键字的地方暂停，并返回一个对象，包含 value 和 done 两个属性：
    - value：当前 yield 表达式的值。
    - done：布尔值，表示生成器函数是否已执行完毕。

## 使用Generator来进行算法可视化


将冒泡排序算法修改为Generator并逐步执行。


```javascript
function* bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; ++i) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        yield arr.slice(); //返回数组当前状态的副本
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}
```


使用yield arr.slice() ，它返回当时数组的副本——bubbleSort生成器将在每次迭代时返回数组的当前状态。


修改控制器来逐步执行生成器：


```javascript
class BasicController {
  constructor() {
    // 初始化排序数组和生成器
    this.arr = [2, 5, 1, 3];
    this.gen = bubbleSort(this.arr); // 初始化生成器
    console.log("Initial array:", this.arr);
  }
 
  refresh(a, b) {
    console.log(`Swapping ${a} and ${b}`);
  }
 
  step() {
    const result = this.gen.next();
    if (!result.done) {
      console.log("Current array:", result.value);
    } else {
      console.log("Sorted array:", result.value);
    }
  }
}
 
const controller = new BasicController();
controller.step(); // 执行第一步
controller.step(); // 执行第二步
controller.step(); // 依次执行后续步骤
```


这样就可以逐步执行算法，并可视化每次迭代时数组的状态，并且能够随时暂停以查看当前状态。


---


参考文章：


[https://www.covicale.com/blog/using-javascript-generators-to-visualize-algorithms](https://www.covicale.com/blog/using-javascript-generators-to-visualize-algorithms)