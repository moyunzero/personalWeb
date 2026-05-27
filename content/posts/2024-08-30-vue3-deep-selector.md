---
title: Vue3 深度选择器 Deep selector
slug: 2024-08-30-vue3-deep-selector
description: "什么情况下需要用到深度选择器 Deep selector ?"
author: 墨韵
date: 2024-08-30
categories:
  - note
tags:
  - frontend
  - Vue
draft: false
notionId: 36ddf5c0-26f4-8069-95fd-f01270611243
notionSyncedAt: 2026-05-27T04:40:28.092Z
---

## 什么情况下需要用到深度选择器 Deep selector ?


有如下组件定义


```javascript
// Vue SFC
<template>
 <div class="container">
    <el-card>
      <el-card-title title="Part 1"></el-card-title>
    </a-card>
 </div>
</template>
<style scope>
.container .el-card-title{
    font-weight: bold;
}
</style>
```


期望设置el-card-title的title为加粗，实际无效。实际上生成代码


```javascript
// 示例编译后代码
 <div data-v-XXX0001 class="container">
    <div data-v-XXX0002 class="el-card">
      <div data-v-XXX0003 class="el-card-title">Part 1</div>
    </a-card>
 </div>

<style >
.container .el-card-title[data-v-XXX0001]{ // 显然这里无法正确匹配
    font-weight: bold;
}
</style>
```


因此就有了 Deep selector。这部分Vue3 的文档有所提及：[<u>**Vue3: Deep selector**</u>](https://vuejs.org/api/sfc-css-features.html#scoped-css)


写法变为：


```javascript
.container :deep(.el-card-title){
    font-weight: bold;
}
```


Vue2 支持以下写法: (来自 [<u>**Vue-loader文档示例**</u>](https://vue-loader.vuejs.org/guide/scoped-css.html#deep-selectors) )


```javascript
<style scoped>
.a >>> .b { /* ... */ }
</style>

<style scoped>
.a::v-deep .b { /* ... */ }
</style>

<style scoped>
.a /deep/ .b { /* ... */ }
</style>
```


Vue3中，实测只有`::v-deep`可用，但不推荐使用。Vue 3推荐使用的方式是


```javascript
<style scoped>
.a :deep(.b) { /* ... */ }
</style>
```


## 总结


采用scope写样式时，可以用过:deep(.className) 来实现对子组件的样式调整.


---


参考：[https://jayin.hashnode.dev/vue3-deep-selector#heading-deep-selector](https://jayin.hashnode.dev/vue3-deep-selector#heading-deep-selector)