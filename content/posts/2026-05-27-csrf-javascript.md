---
title: 全栈安全要点：防止 CSRF、点击劫持以及确保 JavaScript 内容完整性
slug: 2026-05-27-csrf-javascript
description: 探讨 JavaScript 安全的三个关键领域：CSRF（跨站请求伪造）、点击劫持（Clickjacking）和内容完整性。
author: 墨韵
date: 2024-08-08
categories:
  - note
tags:
  - frontend
  - 网络安全
draft: false
notionId: 36ddf5c0-26f4-80d9-aa91-fd302f9ab937
notionSyncedAt: 2026-05-27T04:40:42.063Z
---

## 1. CSRF（跨站请求伪造）


### 什么是 CSRF？


CSRF 是一种攻击，攻击者利用恶意网站诱骗用户的浏览器在用户已认证的受信任网站上执行不需要的操作。这可能导致意外更改、未经授权的交易或数据泄露。


### 如何防止 CSRF


### 在 Node.js（服务器端）端

- **CSRF 令牌**：使用中间件（例如 Express.js 中的 `csurf`）为每个会话或表单提交生成唯一的令牌。在每个更改状态的请求中验证这些令牌。

**使用 Express.js 和 csurf 的示例：**


```javascript
npm install --save csurf cookie-parser

const express = require('express');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
// 设置 csurf 中间件
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.get('/form', (req, res) => {
  // 令牌必须包含在渲染的表单中
  res.send(`<form action="/process" method="POST">
              <input type="hidden" name="_csrf" value="${req.csrfToken()}">
              <input type="text" name="data">
              <button type="submit">Submit</button>
            </form>`);
});

app.post('/process', (req, res) => {
  // 仅在 CSRF 令牌有效时处理请求
  res.send('Form data processed safely.');
});

app.listen(3000, () => console.log('Server running on <http://localhost:3000>'));
```


### 在浏览器（客户端）端

- **SameSite Cookies**：将 Cookie 设置为带有 `SameSite` 属性（`Lax` 或 `Strict`），以防止它们随跨域请求一起发送。
- **自定义头**：在 AJAX 请求中包含自定义头（如 `X-Requested-With`），并在服务器端验证它们，以帮助识别合法请求。

## 2. 点击劫持（Clickjacking）


### 什么是点击劫持？


点击劫持是指诱骗用户点击被伪装的 UI 元素，通常被隐藏或覆盖在另一个元素之下，这可能导致用户执行意外操作，例如授权操作、共享数据，甚至执行管理任务。


### 如何防止点击劫持

- **X-Frame-Options 头**：使用 `X-Frame-Options` HTTP 头控制内容是否可以嵌入到框架中。选项包括：
    - `DENY`：禁止所有框架嵌入。
    - `SAMEORIGIN`：仅允许同源框架嵌入。

**在 Express.js 中的示例：**


```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
```

- **内容安全策略（CSP）**：使用 CSP 头中的 `frame-ancestors` 指令控制哪些域名可以嵌入你的页面。例如：

    ```javascript
    app.use((req, res, next) => {
      res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
      next();
    });
    ```

- **框架破坏脚本**：虽然可以使用 JavaScript 实现“破坏框架”的功能，但这些方法不如服务器端 HTTP 头可靠，应作为次要措施。

## 3. 内容完整性


### 什么是内容完整性？


内容完整性确保你的网站提供的内容（例如脚本、样式表）保持与其原始、可信来源一致。这在防止篡改和中间人攻击时尤为重要，尤其是在使用第三方资源时。


### 为什么需要内容完整性

- **信任**：用户可以信任数据和代码来自经过验证的来源。
- **安全**：防止第三方内容被篡改的情况。
- **合规性**：满足需要完整性保证的安全和合规标准。

### 如何实现内容完整性

- **子资源完整性（SRI）**：SRI 允许浏览器验证它们获取的文件（如 JavaScript 库）是否未被意外篡改。这需要在 HTML 标签中包含链接资源的加密哈希属性。

**示例：**


```html
<script src="<https://example.com/library.js>"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9Wu0g6a3JmGDXVbDt+u6p1mCA/t9zqXQGHbQ8c"
        crossorigin="anonymous"></script>
```

- **CSP 哈希**：当需要内联脚本时，可以使用 CSP 哈希指定脚本内容的预期哈希，确保只有经过批准的代码执行。

## 结论


将强大的安全实践融入你的 JavaScript 应用程序不是可选项——而是基础。通过了解 CSRF、点击劫持的风险以及内容完整性的重要性，你可以实施强有力的措施来保护你的应用程序及其用户。


无论你是调整 Node.js 后端还是加强客户端防御，这些策略都能帮助确保你的应用程序在日益敌对的在线环境中保持安全。安全是一个持续的过程——保持警惕，保持依赖项更新，并始终关注新出现的威胁。