---
title: "CSS：color-scheme: light dark "
slug: 2025-03-23-css-color-scheme-light-dark
description: HTML 不仅有标准的白底黑字主题，还有一个原生的黑底白字版本。
author: 墨韵
date: 2025-03-23
categories:
  - note
tags:
  - CSS
draft: false
notionId: 36ddf5c0-26f4-8089-869d-fcbe7b8fd1b8
notionSyncedAt: 2026-05-27T04:40:10.810Z
---

## 默认 HTML color scheme


**HTML 不仅有标准的白底黑字主题，还有一个原生的黑底白字版本。**


开箱即用——为创建暗色模式界面提供了一个基础，节省了处理输入框、按钮等元素颜色的复杂性。


如果在根元素上声明 `color-scheme: light dark` 而没有使用任何 @media 查询或者其他 CSS，页面将通过查看访客的操作系统 (OS) 偏好自动应用浅色或深色配色方案。大多数操作系统都有一个内置的辅助功能设置，用于选择用户喜欢的配色方案——“浅色”、“深色”甚至是“自动”。


`html {
  color-scheme: light dark;
}`


可以在不使用 CSS 的情况下直接在 HTML 文档中的<meta>标记中完成此操作：


`<meta name="color-scheme" content="light dark">`


## 默认文本和背景颜色变量


这些原生主题的“黑色”颜色并不总是完全黑色，通常可能是灰黑色，不同浏览器之间“黑色”的黑度存在差异。


CSS中的**<system-color>**变量，如**Canvas和CanvasText**，可以根据当前的颜色方案自动改变颜色。


这两个变量可以在你的 CSS 中的任意位置使用，用于调用当前配色方案下的默认背景颜色（Canvas）或文本颜色（CanvasText）。

> <system-color>变量
>
> **<system-color>** 通常反映了用于网页不同部分所选的默认颜色。
>
>

### 声明两种模式的颜色

- **透明度**：在亮色和暗色模式下使用相同的背景色，但通过设置透明度让Canvas不同。
    - 无法用于文本颜色，可能会得到一些柔和的颜色。但这是快速完成一些主题的简单方法
- **color-mix()函数**：在CSS中混合颜色，可以混合系统颜色变量，如Canvas和CanvasText。
    - `// color-mix(in <colorspace>, <color1> <percentage1>, <color2> <percentage2>)
    color-mix(in oklab, Canvas 75%, Purple);`

        在CSS中可以混合颜色。甚至可以混合系统颜色变量,例如，其中一种颜色可以是Canvas或CanvasText，这样背景颜色总是与Canvas混合，文字颜色总是与CanvasText混合。

    - 如果希望在无论是浅色模式还是深色模式下都保持相同的色调和颜色饱和度，那么 color-mix() 方法是很有用的。
    - 
- **light-dark()函数**：提供完全控制，允许为亮色和暗色模式指定完全不同的颜色。
    - `light-dark(lavender, saddlebrown);`

        使用 color-scheme: light dark; 或者在页面上的相应HTML meta标签，是使用 light-dark() 函数的**前提条件**，因为它允许函数尊重用户的系统偏好，或者你在 color-scheme 上设置的单一明亮或黑暗值。

        > light-dark()函数目前覆盖率未完全

### 记住重复访问的选择


访问者离开网站，网站不会自动采取任何措施来记住主题偏好。存储该偏好并在访问者返回时重现会提高用户体验。


使用Web Storage API

- **localStorage**
    - 本地存储将值直接保存在访问者的设备上。这使得它成为一种让事情远离服务器的好方法，因为存储的数据永远不会过期，允许我们随时调用它。
    - 选择一个键名称并使用.setItem()为其指定一个值：
        - `localStorage.setItem("mode", "dark");`
- 键和值由浏览器保存，以后访问时可以再次调用：
    - `const mode = localStorage.getItem("mode");`

        可以使用存储在该键中的值来应用用户的首选配色方案。

- **sessionStorage**
    - 当访问者在同一域的页面或视图之间导航时，在sessionStorage中捕获的数据仍然存在。
        - `sessionStorage.setItem("mode", "dark");
        const mode = sessionStorage.getItem("mode");`

## color-scheme和light-dark()的优势


使用color-scheme和light-dark()比传统的@media查询更好，因为它们可以免费提供基本的单色暗模式，根据操作系统偏好本地切换模式，并且可以使用JavaScript在亮色和暗色模式之间切换。