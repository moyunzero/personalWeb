---
title: 了解 JavaScript 中的本地存储
slug: 2025-04-14-javascript
description: Local Storages是一个基于浏览器的重要 API，允许开发人员直接在浏览器中存储、检索和管理数据。
author: 墨韵
date: 2025-04-14
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-80b1-a2c0-cc64bcb1cb0f
notionSyncedAt: 2026-05-27T04:40:04.374Z
---

**Local Storages**是一个基于浏览器的重要 API，允许开发人员直接在浏览器中存储、检索和管理数据。与会话存储不同，本地存储即使在浏览器关闭后仍然存在，因此非常适合保存用户首选项、应用程序设置或需要在会话之间保留的任何类型的数据。但是，请务必注意，数据仅限于存储其的浏览器。例如，Chrome 中保存的数据在 Firefox 中不可用。


# 工作原理


在使用本地存储之前，了解它以**JSON 格式**存储数据非常重要。这意味着，如果您要保存 JavaScript 对象，则需要先将其转换为 JSON，然后在检索数据时将其转换回 JavaScript 对象。


```javascript
const user = {
  name: "AliceDoe"
};
const userToJSON = JSON.stringify(user); // Convert object to JSON
```


# 在浏览器中查看本地存储


可以使用浏览器的**开发人员工具（Developer Tools）**查看本地存储中存储的数据并与之交互。这是一个快速指南：

1. 右键单击任何网页并选择“检查”或按 F12。
2. 打开**应用程序（Application）**选项卡。
3. 在左侧面板中，在存储部分下找到**本地存储**，您将看到存储的数据显示为键值对。

# 在本地存储中创建新记录


要将数据存储在本地存储中，请按照下列步骤操作：


```javascript
const user = {
  name: "AliceDoe"
};

const userToJSON = JSON.stringify(user); // Convert to JSON
localStorage.setItem("user", userToJSON); // Save the item
```

- key是 "user" 。
- 该**值为**JSON 格式的字符串化对象。

# 从本地存储读取数据


当从本地存储检索数据时，需要将 JSON 字符串转换回 JavaScript 对象：


```javascript
const userJSON = localStorage.getItem("user"); // Retrieve data
const userObject = JSON.parse(userJSON); // Convert back to JS object
console.log(userObject); // { name: "AliceDoe" }
```


# 更新本地存储中的现有数据


更新本地存储中的数据类似于创建新记录 - 本质上覆盖旧数据：


```javascript
const updatedUser = {
  name: "AliceDoe",
  age: 25
};

const updatedUserJSON = JSON.stringify(updatedUser);
localStorage.setItem("user", updatedUserJSON); // Overwrite the record
```


# 删除本地存储中的数据


最后，要从本地存储中删除记录，可以使用removeItem方法：


```javascript
localStorage.removeItem("user"); // Remove the "user" record
```


这将删除与“user”键关联的记录。


# 结论


本地存储是一个功能强大、易于使用的 JavaScript 客户端数据持久化工具。通过了解如何创建、读取、更新和删除记录，您可以存储跨浏览器会话持续存在的重要数据，从而增强用户体验。但是，请务必记住，本地存储仅限于特定的浏览器和域，并且不应将其用于敏感数据，因为它未加密。


通过将本地存储合并到您的应用程序中，您可以改进其功能，而无需为某些任务提供完整的后端解决方案。