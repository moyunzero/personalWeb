---
title: Axios vs Fetch
slug: 2024-10-17-axios-vs-fetch
description: "Axios 具有许多内置功能，例如自动 JSON 转换、请求和响应拦截器以及请求取消。"
author: 墨韵
date: 2024-10-17
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-80ed-819d-ee7ec8facf51
notionSyncedAt: 2026-05-27T04:36:30.478Z
---

# Axios


内置功能：Axios 具有许多内置功能，例如自动 JSON 转换、请求和响应拦截器以及请求取消。


浏览器兼容性：它支持旧版浏览器，包括 Internet Explorer。


错误处理：Axios 自动拒绝 HTTP 错误状态（如 404 或 500）的承诺，使错误处理更简单。


请求/响应拦截器：可以轻松地全局修改请求或响应。


取消请求：Axios 提供了一种简单的方法来取消请求。


# Fetch


原生 API：Fetch 是原生 Web API，这意味着无需安装任何其他库。


Promise-Based：使用Promise，但需要手动检查响应状态是否有错误。


流处理：Fetch 支持流，这对于处理大型响应非常有用。


更多控制：对请求有更多控制，但它需要更多样板代码来实现设置默认值或拦截请求等功能。


不支持内置JSON：需要在响应对象上调用 .json() 来解析 JSON 数据。


# 使用案例


如果需要开箱即用的丰富功能集，特别是对于复杂的应用程序，请使用 Axios。


对于更简单的用例或想避免外部依赖项时，请使用 Fetch。


## 用法示例


### **Axios:**


```javascript
axios.get('/api/data')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```


```javascript
// axios
const options = {
  url: 'http://localhost/test.htm',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json;charset=UTF-8'
  },
  data: {
    a: 10,
    b: 20
  }
};
axios(options)
  .then(response => {
    console.log(response.status);
  });
```


现在将此代码与 fetch() 版本进行比较，后者产生相同的结果：


```javascript
fetch('/api/data')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => console.log(data))
  .catch(error => console.error(error));
```


```javascript
// fetch()
const url = "https://jsonplaceholder.typicode.com/todos";
const options = {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    a: 10,
    b: 20,
  }),
};
fetch(url, options)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
  });
```


## 请注意：


为了发送数据，fetch() 使用 post 请求的 body 属性将数据发送到端点，而 axios 使用 data 属性使用 JSON.stringify 方法将 fetch() 中的数据转换为字符串axios自动转换从服务器返回的数据，但是使用fetch()你必须调用response.json方法将数据解析为JavaScript对象使用axios，可以在数据对象内访问服务器提供的数据响应，而对于fetch()方法，最终的数据可以命名为任何变量


# 结论


两者都有各自的优点，选择通常取决于具体需求和偏好。如果正在构建具有许多 API 交互的大型应用程序，Axios 可能会节省一些麻烦，而 Fetch 非常适合简单的任务。Axios 提供了一个用户友好的 API，可以简化大多数 HTTP 通信任务。但是，如果更喜欢使用本机浏览器功能，可以使用 Fetch API 自己实现类似的功能。