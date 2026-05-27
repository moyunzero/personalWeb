---
title: 精通 JavaScript 中的日期：处理日期和时间
slug: 2024-11-17-javascript
description: "UTC 是一个标准、通用的时区，作为所有其他时区的基准。"
author: 墨韵
date: 2024-11-17
categories:
  - note
tags:
  - frontend
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-8056-8f1c-c5c0461ee979
notionSyncedAt: 2026-05-27T04:36:27.653Z
---

# **理解时间标准和时区**


## UTC（Coordinated Universal Time）


UTC 是一个标准、通用的时区，作为所有其他时区的基准。


UTC 和 GMT：虽然 UTC 和 GMT 显示的时间相同，但它们并不完全相同。GMT 是一个时区，而 UTC 是一个时间标准。


这些差异很小，通常不会影响 JavaScript 中的日期处理，因此我们可以将它们视为在大多数编码目的上等效。


## 相对时区


每个时区本质上都是相对于 UTC 的偏移。例如，在澳大利亚的 AEDT 时区，它是 GMT+11（或 UTC+11）。JavaScript 使用这些偏移来准确计算跨时区的日期。下面是一个使用浏览器时区创建的正常 Date 对象，然后是相同的 UTCString 格式


# **JavaScript 中的日期格式**


##  ISO 8601 format


返回 ISO 8601 格式的日期和时间字符串。我们上面看到的 UTC 是一个提供通用时间参考的标准，而 ISO 8601 则是以标准化方式格式化日期和时间值，以确保通信的一致性、清晰性和避免混淆


![%E6%88%AA%E5%B1%8F2024-11-15_22.27.15.png](images/blog/2024-11-17-javascript/img-c6b9a8a882.png)


## 基于区域的格式


返回日期对象作为字符串，使用区域设置。我们可以使用它以特定方式使用区域选项来格式化日期。


以下为示例，查看日期输出如何根据地区而变化


```javascript
// Currently in 'London' Location i.e "en-GB" locale
new Date(); // Sun Nov 10 2024 23:34:22 GMT+0000 (Greenwich Mean Time)
new Date().toLocaleDateString();// '10/11/2024'
new Date().toLocaleDateString("en-US"); // '11/10/2024'
```


# **JavaScript 中的日期格式化**


## 使用 Intl.DateTimeFormat 与 toLocaleDateString 格式化日期


JavaScript 提供了两种基于区域设置的日期格式化方法：


Intl.DateTimeFormat 是一个独立的对象，允许灵活地格式化日期和时间。


toLocaleDateString 是一个 Date 方法，它返回一个本地化的日期字符串。与上面的输出相同


```javascript
const options = { 
day: "numeric",
month: "long",
year: "numeric" 
};

new Date().toLocaleDateString("en-GB", options); // "10 November 2024"s
```


## **实践中不同的日期格式**


我们有一个 toUTCString()用于 UTC 日期，toISOString()用于 ISO 格式，toLocaleDateString()用于仅日期的格式


```plain text
new Date().toUTCString(); // e.g., 'Sun, 10 Nov 2024 23:51:54 GMT'
new Date().toLocaleString(); // e.g., '10/11/2024, 11:52:13 pm'
new Date().toISOString(); // e.g., '2024-11-10T23:52:24.867Z'
```


仅日期格式 - 仅返回日期


```plain text
new Date().toDateString(); // 'Sun Nov 10 2024'
new Date().toLocaleDateString(); // '10/11/2024'
new Date().toLocaleDateString("en-US"); // '11/10/2024'
```


#  **转换和操作日期**


## 使用 getTime()获取纪元时间


可以从 new Date().getTime()函数或使用 Date.now()获取纪元时间


```plain text
console.log(new Date().getTime()+ " ~~ " + Date.now())
//1731283520279 ~~ 1731283520279
```


# **高级日期处理技巧**


##  Using new Date() vs Date()


当使用 new 调用时，Date 返回一个 Date 对象。


当不使用 new 调用时，它返回当前日期和时间的字符串表示形式。


![%E6%88%AA%E5%B1%8F2024-11-15_22.34.54.png](images/blog/2024-11-17-javascript/img-77ea3b0526.png)


## 日期格式化附加区域设置选项


```plain text
1) const options = {
  day: "numeric",
  month: "short", //can also be long
  year: "numeric",
};
new Date().toLocaleString("en-GB",options);  //'9 Nov 2024'

2) const options = {
  day: "numeric",
  month: "short", //can also be long
  year: "numeric",
};
new Date().toLocaleString("en-GB",options);  //'9 November 2024'

3) //To display time, need to pass any time-related properties

const options = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",    // Add this to display the hour
  minute: "numeric",  // Add this to display the minute
  hour12: true        // Keeps time in 12-hour format
};

new Date().toLocaleString("en-GB",options)//'9 Nov 2024, 3:48 pm'
//3a) if hour12 was set to false, prints '9 Nov 2024, 15:38'
//3b) if year was set to 2-digit(instead of numeric') prints
//    '10 Nov 24, 3:48 pm'

4) /* "day" option above,like year can also be "2-digit" or "numeric"
 - "numeric" - Displays the day as a number WITHOUT zero-padding
               for single-digit days
 - "2-digit"- Will apply zero-padding for single-digit days
   */

 // Lets see numeric eg

const dayNumericOptions={
  day: "numeric",
  month: "short",
  year: "numeric"
}
//create a date with single digit day
new Date(2024,11,9).toLocaleString("en-GB",dayNumericOptions)//'9 Dec 2024'
// while if you passed "2-digit" to day and ran above prints '09 Dec 2024'

5) // Same way "minute" can be "numeric" or "2-digit".
   //Assume time is 3:05 pm and with "2-digit" option it will print "15:05"
   //while with numeric it will print "15:5"
```


## 使用各种参数创建日期对象


JavaScript 中的 Date 构造函数很灵活。它可以接受 0 个或多个参数→提供多种创建 Date 对象的方法