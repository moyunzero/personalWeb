---
title: JavaScript 解构指南
slug: 2025-01-26-javascript
description: 解构赋值允许从数组或对象中提取单个值并将它们分配给一组标识符
author: 墨韵
date: 2025-01-26
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-80d5-98d0-c9c8e8fdcb78
notionSyncedAt: 2026-05-27T04:40:19.323Z
---

如果你花了大量时间深入研究现代 JavaScript，很可能你已经看到了足够多的省略号（...），可以把最忧郁的90年代角色扮演游戏主角都比下去。我不会责怪你觉得它们有点让人困惑。当然，我也不会责怪你觉得 JavaScript 里的任何东西都让人困惑，但我总觉得这些省略号乍一看是特别不直观的。再加上你常常会在“解构赋值”这个本身就很奇怪的语法环境中遇到这些小怪物，这无济于事。


_解构赋值_允许从数组或对象中提取单个值并将它们分配给一组标识符，而无需以老式方式访问每个元素的值 - 通过索引或键一次访问一个元素，如下所示：


```javascript
const myArray = [ true, false, false ];
const firstElement  = myArray[0];
const secondElement = myArray[1];
const thirdElement  = myArray[2];
```


在其最简单的形式中——称为“绑定模式解构”——每个值从数组或对象字面量中解包，并分配给相应的标识符，所有这些标识符都使用单个 let 或 const（或者如果你怀念函数作用域的话，也可以用 var）来初始化。


分配的值是要解构的数组或对象文字。使用数组时，标识符包含在一对括号中，并且你在这些括号内定义的每个标识符将对应于源数组中的相同索引：


```javascript
const myArray = [10, 200, 3000 ];
const [ firstElement, secondElement, thirdElement ] = myArray;
```


可以使用逗号跳过元素，但省略标识符，就像创建[稀疏数组](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays)时省略值一样：


```javascript
const myArray = [ "goose", "duck", "duck", "goose" ];
const [ firstElement, , , fourthElement ] = myArray;
```


有时你会看到解构被称为“解包”数据结构，但无论听起来如何，**请记住解构不会修改原始数组或对象**：


```javascript
const myArray = [ "first", "second", "third" ];
const [ startElement, middleElement, endElement ] = myArray;

//output

myArray;
> Array(3) [ "first", "second", "third" ]
```


# 解构：不仅仅适用于数组


现在，你通常不会_创建_一个数据结构，然后立即将它包含的元素的值分配给一堆像这样的标识符，但有时你_必须_获取数据结构的内容在脚本的其他地方一起使用或操作这些值。例如，假设 API 为你提供了一个对象文字，其中包含有关你要用来构造`img`元素的图像的信息：


```javascript
const myImage = {
  "src": "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs",
  "alt": "A single black pixel.",
  "size": {
    "width": 600,
    "height": 400
  }
};
```


当然，将这个对象拆开并不是所有 Web 开发中最繁重的任务，但是一次一行地执行它感觉有点笨拙：


```javascript
const imgContainer = document.querySelector( ".img-container" );
const src = myImage.src;
const alt = myImage.alt || "";
const width = myImage.size.width || 800;
const height = myImage.size.height || 400;

if(imgSource) {
  imgContainer.innerHTML = `<img src="${ src }" alt="${ alt }" height="${ height }" width="${ width }">`;
}
```


可以像解构数组一样解构对象，只是语法上有一些差异。首先，标识符包含在一对花括号而不是方括号中。其次，标识符由相应对象键的值填充，无论它们的指定顺序如何：


```javascript
const { alt, size, src } = myImage;
const { height, width }  = size;

//output

alt;
> "A single black pixel."
```


就像使用_点符号_将这些值分配给标识符一样，你可以设置默认值，如果属性根本不存在，或者它包含显式`undefined`值，则将分配这些默认值：


```javascript
const { size, src, alt = "" } = myImage;
const { width = 800, height = 450 } = size;
```


我们可以使其_更加_简洁。我们不必单独解压嵌套的`size`对象；我们可以同时打开它。


```javascript
const { src, alt = "", size: { width = 800, height = 450 } } = myImage;
```


这给我们留下了更新后的代码：


```javascript
const imgContainer = document.querySelector( ".img-container" );
const { src, alt = "", size: { width = 800, height = 450 } } = myImage;

if(imgSource) {
  imgContainer.innerHTML = `<img src="${ src }" alt="${ alt }" height="${ height }" width="${ width }">`;
}
```


# **省略号是从哪里来的呢？**


在解构赋值的语境中，省略号后跟一个标识符代表了一个“剩余属性”——一个将包含被解构的数组或对象剩余部分的标识符。这些剩余属性将包含所有超出我们显式解构为各自标识符的剩余元素，并打包在与我们解构的相同类型的数据结构中。


```javascript
const myArray = [ false, true, false ];
const [ firstElement, ...remainingElements ] = myArray;

//output

firstElement;
> false

remainingElements;
> Array [ true, false ]
```


另一个例子：


```javascript
const myObject = {
  "key1": "first value",
  "key2": "second value",
  "key3": "third value"
};
const { key1, ...otherProperties } = myObject;

//output

key1;
> "first value"

otherProperties;
> Object { key2: "second value", key3: "third value" }
```


就像解构赋值本身一样，剩余属性在这样的真空环境中可能看起来并不是那么有用——同样，我们正在拆分一个刚刚组合起来的简单数据结构。它真正有用的地方是处理那些你不一定能完全控制的大型数据结构。


例如，假设你正在使用单个页面的静态站点生成器的输出：


```javascript
const postData = {
    inputPath: './index.md',
    url: '/',
    lede: "This is the introduction to the post",
    date: new Date(),
    title: 'My Title',
    postId: 25,
    tags: ['tag1', 'tag2'],
    body: 'This is the body of the post'
}
```


这个对象解决了两个问题，且交织在一起：它包含了关于文章的元信息——生成文章的文件路径、生成的文章将存放的路径、文章的ID、与文章相关的标签——以及构成文章本身的内容。很可能我们会需要所有这些信息，但是按需访问每个属性会显得重复，因此我们将使用解构语法来获取我们需要的元信息，并将其余所有属性——即文章内容本身——保留为一个新对象。


```javascript
const { inputPath, url, postId, tags, ...postContent } = postData;

//output

postContent;
> Object { lede: "This is the introduction to the post", date: Date Fri Aug 23 2024 14:05:19 GMT-0400 (Eastern Daylight Time), title: "My Title", body: "This is the body of the post" }
```


一行！不需要获取每个属性值并将其独立地分配给标识符，不需要在整个脚本中不断访问大而笨重的对象，并且构成帖子本身的所有属性都捆绑在一个整洁的新对象中。最小的麻烦，几乎没有任何混乱。


# **其余和展开语法**


## **Rest** 


你最常在解构赋值中遇到余值语法（...），但就像一个优柔寡断的短信发送者一样，JavaScript会在一些意想不到的地方向你呈现省略号。这些用法都与解构赋值中的用法有共同点：它们都涉及将数据聚合到一个数据结构中，或将数据从一个数据结构中展开。


在函数参数的标识符前面，省略号执行与执行解构赋值时相同的功能：作为“剩余语法”，它将传递给该函数**的所有其余参数**捆绑为可迭代数据结构 -一个数组 - 并为其分配省略号后面的标识符。这使你可以创建“[可变参数函数](https://en.wikipedia.org/wiki/Variadic_function)”，这是一个令人印象深刻的术语，它实际上意味着“可以接受任意数量参数的函数”。


```javascript
function myFunction( firstParameter, ...remainingParameters ) {

};
```


## **Spread** 


最后一个你会遇到省略号的地方（除了特别情绪化的评论之外）是完全不同的。在需要数组元素或函数参数的上下文中，相同的省略号将采用完全不同的名称和用途：“扩展语法”（ `...` ），它扩展了可迭代的数据结构——数组、对象文字、甚至是一个字符串——分解成它的各个元素。


扩展语法最常见的用途是复制和组合数组：


```javascript
const myArray = [ 4, 5, 6 ];
const myMergedArray = [1, 2, 3, ...myArray ];
```


现在，再次记住，扩展语法仅适用于需要函数调用中的参数或数组元素的情况。正如你在上面的示例中看到的，数组可以预见地接受数组中的元素。更不可预测的是，对象字面量也是如此：


```javascript
const myArray = [ true, false ];
const myObject = { ...myArray };

//output

myObject;
> Object { 0: true, 1: false }
```


## **Object Spread**


将扩展语法与对象字面量一起使用是 JavaScript 的最新补充：虽然[扩展语法本身是在 2015 年的 ES6 中添加的](https://caniuse.com/mdn-javascript_operators_spread_spread_in_arrays)，但它仅[适用于 ES2018 的对象字面量](https://caniuse.com/mdn-javascript_operators_spread_spread_in_object_literals)。扩展语法创建对象的“浅”副本。也就是说，它将一个值的“[自己的属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)”——即任何不[通过原型链继承的](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)[可枚举属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)——传播到一个新对象中。


```javascript
const oldObject = {
  "key1": "first value",
  "key2": "second value",
  "key3": "third value"
};

const myObject = {
  "key0": "zeroth value",
  ...oldObject
};

//output

myObject;
> Object { key0: "zeroth value", key1: "first value", key2: "second value", key3: "third value" }
```


这是一种_非常_有用的语法，允许你仅使用几个字符来复制和合并对象。


需要记住的一些事情：合并包含重复键的数组时，与这些键关联的值将被覆盖：


```javascript
const firstObject = {
  "key1" : "first value",
  "key2" : "second value",
  "key3" : "third value"
};

const secondObject = {
  "key0" : "zeroth value",
  "key1" : "another value"
};

const myObject = { ...firstObject, ...secondObject }

//output

myObject;
> Object { key1: "another value", key2: "second value", key3: "third value", key0: "zeroth value" }
```


此外，由于对象不能像数组或字符串那样进行迭代，因此对象传播的上下文并不完全相同——而数组和字符串可以传播到对象、数组或函数的参数中，一个对象只能传播到另一个对象中：


```javascript
const myObject = {
  "key1": "first value",
  "key2": "second value",
  "key3": "third value"
};
console.log( ...myObject );

//output

> Uncaught SyntaxError: expected expression, got '...'
```