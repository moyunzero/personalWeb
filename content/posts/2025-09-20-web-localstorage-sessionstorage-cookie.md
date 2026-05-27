---
title: "了解 Web 存储：LocalStorage、SessionStorage 和 Cookie "
slug: 2025-09-20-web-localstorage-sessionstorage-cookie
description: 在现代 Web 开发中，管理客户端数据已成为一项基本技能。开发人员通常依靠 localStorage、sessionStorage 和
  Cookie 在用户的浏览器中存储数据。
author: 墨韵
date: 2025-09-20
categories:
  - note
tags:
  - frontend
draft: false
notionId: 36ddf5c0-26f4-8022-b720-ef90368bab43
notionSyncedAt: 2026-05-27T04:37:37.539Z
---

在现代 Web 开发中，管理客户端数据已成为一项基本技能。开发人员通常依靠 localStorage、sessionStorage 和 Cookie 在用户的浏览器中存储数据。虽然这三种机制的用途相似，但它们在容量、持久性和使用案例方面存在明显差异。


# **1. localStorage：持久化客户端存储**


**目的：localStorage** 旨在将数据存储在客户端，即使在浏览器关闭后，这些数据也会持续存在。对于需要跨多个会话保留的数据，这是一个很好的选择。


**容量：localStorage** 提供大量存储空间，通常每个域高达 10MB，这对于大多数应用程序来说已经足够了。


**持久性：**存储在 localStorage 中的数据将保持可用，直到用户或应用程序明确删除。这使得它非常适合存储用户首选项，例如主题设置，这些首选项应在对网站的不同访问中持续存在。


**eg：**假设您有一个同时提供浅色和深色模式的 Web 应用程序。您可以使用 localStorage 保存用户的首选项，以便下次访问时，站点会自动以他们选择的模式加载。


![image](https://km.sankuai.com/api/file/cdn/2462289889/121604950329?contentType=1&isNewContent=false)


# **2. sessionStorage：基于会话的临时存储**


**目的：sessionStorage** 也会在客户端存储数据，但仅限于页面会话的持续时间。这意味着当用户关闭浏览器选项卡或窗口时，数据将被清除。


**容量：**与 localStorage 类似，sessionStorage 为每个域提供大约 5MB 的存储空间。尽管容量较小，但通常足以存储临时数据。


**持久性：**sessionStorage 和 localStorage 之间的主要区别在于持久性。sessionStorage 数据仅在页面会话期间可用，因此适合存储不需要在当前会话之后保留的临时数据。


**eg：**想象一个多步骤表单，用户跨多个页面输入数据。您可以使用 sessionStorage 在用户完成这些步骤时临时存储表单数据。这可确保在他们意外重新加载页面时不会丢失进度。


`// Save form data temporarily in sessionStorage
sessionStorage.setItem('step1Data', JSON.stringify({ name: 'John Doe', age: 30 }));

// Retrieve the saved data
const step1Data = JSON.parse(sessionStorage.getItem('step1Data'));
console.log(step1Data); // Output: { name: 'John Doe', age: 30 }`


# **3. Cookie：具有服务器交互功能的小型持久存储**


**目的：**Cookie 用于存储需要在会话之间持续存在的小块数据，并且可以通过 HTTP 请求发送到服务器。它们通常用于跟踪用户会话、存储身份验证令牌和记住用户设置。


**容量：**与 localStorage 和 sessionStorage 相比，Cookie 的容量要小得多，每个 Cookie 的限制为 4KB。但是，可以存储多个 Cookie，每个 Cookie 都有此限制。


**持久性**：Cookies具有可配置的过期时间。它们可以在会话结束时过期，也可以持久存在一段指定的时间。这种灵活性使得Cookies能够用于短期和长期存储。


**eg：**Cookie 的常见用途是存储用户的登录令牌，它允许用户在会话中保持登录状态，而无需在每次访问站点时重新输入其凭据。


`// Set a cookie with an expiration date
document.cookie = "username=JohnDoe; expires=Fri, 31 Dec 2024 23:59:59 GMT; path=/";

// Retrieve the cookie value
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
}, {});
console.log(cookies.username); // Output: JohnDoe`


# **何时使用每种存储机制**


**localStorage：**当需要存储大量数据以跨多个会话持续存在且不敏感时使用（例如，用户偏好设置，非敏感应用程序状态）。


**sessionStorage**：适用于仅在用户会话期间持续存在的临时数据（例如，单会话表单数据，临时状态）。


**cookies**：最适合存储需要随HTTP请求发送到服务器的小数据片段，或需要具有特定过期时间的数据（例如，身份验证令牌，需要与服务器进行交互的用户首选项）。


[https://dev.to/abhay1kumar/understanding-web-storage-localstorage-sessionstorage-and-cookies-1384?context=digest](https://dev.to/abhay1kumar/understanding-web-storage-localstorage-sessionstorage-and-cookies-1384?context=digest)