---
title: "探索 JavaScript  Symbols "
slug: 2026-05-27-javascript-symbols
description: unique 的符号与其他 JavaScript 原始类型不同，因为它们保证是唯一的。
  当处理对象时，符号的真正力量才会显现。与字符串或数字不同，符号可以用作属性键而不会有与现有属性冲突的风险。这使得它们在为对象添加功能而不干扰现有代码时极为宝贵。
  当你将符号用作属性键时，它不会出现在 或普通 循环中。 你仍然可…
author: 墨韵
date: 2025-04-17
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-8000-b453-c214e12a5840
notionSyncedAt: 2026-05-27T05:50:44.717Z
---

unique 的符号与其他 JavaScript 原始类型不同，因为它们保证是唯一的。


```sql
const symbol1 = Symbol('description');
const symbol2 = Symbol('description');

console.log(symbol1 === symbol2); // false
```


当处理对象时，符号的真正力量才会显现。与字符串或数字不同，符号可以用作属性键而不会有与现有属性冲突的风险。这使得它们在为对象添加功能而不干扰现有代码时极为宝贵。


```sql
const metadata = Symbol('elementMetadata');

function attachMetadata(element, data) {
  element[metadata] = data;
  return element;
}

const div = document.createElement('div');
const divWithMetadata = attachMetadata(div, { lastUpdated: Date.now() });
console.log(divWithMetadata[metadata]); // { lastUpdated: 1684244400000 }
```


当你将符号用作属性键时，它不会出现在 **`Object.keys()`** 或普通 **`for...in`** 循环中。


```sql
const nameKey = Symbol('name');
const person = {
  [nameKey]: 'Alex',
  city: 'London'
};

// Regular enumeration won't show Symbol properties
console.log(Object.keys(person));     // ['city']
console.log(Object.entries(person));  // [['city', 'London']]

for (let key in person) {
  console.log(key);                   // Only logs: 'city'
}

// But we can still access Symbol properties
console.log(Object.getOwnPropertySymbols(person));  // [Symbol(name)]
console.log(person[nameKey]);         // 'Alex'
```


你仍然可以通过 Object.getOwnPropertySymbols() 访问这些属性，但这需要有意的努力。这在对象的公共接口和内部状态之间创建了一个自然的分离。


全局符号注册表为符号的使用增加了另一个维度。尽管普通符号总是唯一的，但有时你需要在代码的不同部分共享符号。这时就需要使用Symbol.for()函数：


```sql
// Using Symbol.for() for shared Symbols across modules
const PRIORITY_LEVEL = Symbol.for('priority');
const PROCESS_MESSAGE = Symbol.for('processMessage');

function createMessage(content, priority = 1) {
  const message = {
    content,
    [PRIORITY_LEVEL]: priority,
    [PROCESS_MESSAGE]() {
      return `Processing: ${this.content} (Priority: ${this[PRIORITY_LEVEL]})`;
    }
  };

  return message;
}

function processMessage(message) {
  if (message[PROCESS_MESSAGE]) {
    return message[PROCESS_MESSAGE]();
  }
  throw new Error('Invalid message format');
}

// Usage
const msg = createMessage('Hello World', 2);
console.log(processMessage(msg)); // "Processing: Hello World (Priority: 2)"

// Symbols from registry are shared
console.log(Symbol.for('processMessage') === PROCESS_MESSAGE); // true

// But regular Symbols are not
console.log(Symbol('processMessage') === Symbol('processMessage')); // false
```

> 对象字面量中的方括号 [] 允许我们使用符号作为属性键。

JavaScript 提供了内置的符号，这些符号可以让你在不同的情况下修改对象的行为。这些符号被称为知名符号，它们让我们能够使用核心语言特性。


一个常见的使用场景是使用 Symbol.iterator 使对象变得可迭代。这让我们可以像对待数组一样，用 for...of 循环遍历我们自己的对象。


```sql
// Making an object iterable with Symbol.iterator
const tasks = {
  items: ['write code', 'review PR', 'fix bugs'],
  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () => {
        if (index < this.items.length) {
          return { value: this.items[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

// Now we can use for...of
for (let task of tasks) {
  console.log(task); // 'write code', 'review PR', 'fix bugs'
}
```


另一个强大的著名符号是 Symbol.toPrimitive。它允许我们控制对象如何转换为原始值，如数字或字符串。当对象需要处理不同类型的操作时，这变得非常有用。


```sql
const user = {
  name: 'Alex',
  score: 42,
  [Symbol.toPrimitive](hint) {
    // JavaScript tells us what type it wants with the 'hint' parameter
    // hint can be: 'number', 'string', or 'default'

    switch (hint) {
      case 'number':
        return this.score;    // When JavaScript needs a number (like +user)

      case 'string':
        return this.name;     // When JavaScript needs a string (like `${user}`)

      default:
        return `${this.name} (${this.score})`; // For other operations (like user + '')
    }
  }
};

// Examples of how JavaScript uses these conversions:
console.log(+user);        // + operator wants a number, gets 42
console.log(`${user}`);    // Template literal wants a string, gets "Alex"
console.log(user + '');    // + with string uses default, gets "Alex (42)"
```

> Symbol.toPrimitive 让我们可以控制对象如何转换为不同的类型。JavaScript 通过传递 ‘hint’ 参数告诉我们它需要的类型。

## 继承控制与 **`Symbol.species`**


在使用 JavaScript 的数组时，我们有时需要限定数组中可以包含的值的类型。这时就需要用到专门的数组类型，但这些数组类型在使用 map() 和 filter() 等方法时可能会导致意外的行为。


一个可以存储任何类型值的普通 JavaScript 数组：


```sql
// Regular array - accepts anything
const regularArray = [1, "hello", true];
regularArray.push(42);       // ✅ Works
regularArray.push("world");  // ✅ Works
regularArray.push({});       // ✅ Works
```


一个具有特殊规则或行为（例如：只接受某些类型的值）的数组


```sql
// Specialized array - only accepts numbers
const createNumberArray = (...numbers) => {
  const array = [...numbers];

  // Make push only accept numbers
  array.push = function(item) {
    if (typeof item !== 'number') {
      throw new Error('Only numbers allowed');
    }
    return Array.prototype.push.call(this, item);
  };

  return array;
};

const numberArray = createNumberArray(1, 2, 3);
numberArray.push(4);     // ✅ Works
numberArray.push("5");   // ❌ Error: Only numbers allowed
```


把它想象成这样：一个常规数组就像一个开放的盒子，接受任何东西，而一个专用数组就像一个投币口，只接受特定的物品（在这种情况下，是数字）。


该问题 **`Symbol.species`** 解决的是：当你对一个专用数组使用像 **`map()`** 这样的方法时，你是否希望结果也是专用的，或者只是一个普通数组？


```sql
// specialized array that only accepts numbers
const createNumberArray = (...numbers) => {
  const array = [...numbers];

  // Restrict push to only allow numbers
  array.push = function(item) {
    if (typeof item !== 'number') {
      throw new Error('Only numbers allowed');
    }
    return Array.prototype.push.call(this, item);
  };

  return array;
};

// Test it
const nums = createNumberArray(1, 2, 3);
nums.push(4);     // Works ✅
nums.push('5');   // Error! ❌ "Only numbers allowed"

// When we map this array, the restrictions carry over unexpectedly
const doubled = nums.map(x => x * 2);
doubled.push('6'); // Error! ❌ Still restricted to numbers
```


我们可以通过告诉 JavaScript 使用常规数组进行派生操作来解决这个问题。这里是 **`Symbol.species`** 如何解决这个问题的：


```sql
const createNumberArray = (...numbers) => {
  const array = [...numbers];

  array.push = function(item) {
    if (typeof item !== 'number') {
      throw new Error('Only numbers allowed');
    }
    return Array.prototype.push.call(this, item);
  };

  // Tell JavaScript to use regular arrays for operations like map()
  Object.defineProperty(array.constructor, Symbol.species, {
    get: function() { return Array; }
  });

  return array;
};

const nums = createNumberArray(1, 2, 3);
nums.push(4);     // Works ✅
nums.push('5');   // Error! ❌ (as expected for nums)

const doubled = nums.map(x => x * 2);
doubled.push('6'); // Works! ✅ (doubled is a regular array)
```

> **`Symbol.species`** 修复了意外的限制继承问题。原始数组保持专业化，但派生数组（来自 map、filter 等）变为常规数组。

## 符号的限制和注意事项


与符号一起工作并不总是直接的。当尝试处理 JSON 时，一个常见的困惑出现：在 JSON 序列化过程中，符号属性完全消失。


```sql
const API_KEY = Symbol('apiKey');

// Use that Symbol as a property key
const userData = {
 [API_KEY]: 'abc123xyz',      // Hidden API key using our Symbol
 username: 'alex'             // Normal property anyone can see
};

// Later, we can access the API key using our saved Symbol
console.log(userData[API_KEY]); // prints: 'abc123xyz'

// But when we save to JSON, it still disappears
const savedData = JSON.stringify(userData);
console.log(savedData);         // Only shows: {"username":"alex"}
```

> 将 JSON 想象成一个无法看到符号的复印机。当你复印（转换为字符串）时，任何用符号键存储的内容都会变得看不见。一旦看不见，在创建新对象（解析）时就没有办法将其恢复。

符号字符串强制转换会导致另一个常见陷阱。虽然你可能期望符号像其他原始类型一样工作，但它们在类型转换方面有严格的规则：


```sql
const label = Symbol('myLabel');

// This throws an error
console.log(label + ' is my label'); // TypeError

// Instead, you must explicitly convert to string
console.log(String(label) + ' is my label'); // "Symbol(myLabel) is my label"
```


符号处理可能很棘手，尤其是在使用全局符号注册表时。常规符号在没有任何引用时可以被垃圾回收，但注册表符号会保留下来：


```javascript
// Regular Symbol can be garbage collected
let regularSymbol = Symbol('temp');
regul
arSymbol = null; // Symbol can be cleaned up

// Registry Symbol persists
Symbol.for('permanent'); // Creates registry entry
// Even if we don't keep a reference, it stays in registry
console.log(Symbol.for('permanent') === Symbol.for('permanent')); // true
```


模块之间的符号共享显示了一个有趣的模式。当使用 Symbol.for() 时，该符号在整个应用程序中都可用，而常规符号则保持唯一性：


```javascript
// In module A
const SHARED_KEY = Symbol.for('app.sharedKey');
const moduleA = {
  [SHARED_KEY]: 'secret value'
};

// In module B - even in a different file
const sameKey = Symbol.for('app.sharedKey');
console.log(SHARED_KEY === sameKey);                // true
console.log(moduleA[sameKey]);                      // 'secret value'

// Regular Symbols don't share
const regularSymbol = Symbol('regular');
const anotherRegular = Symbol('regular');
console.log(regularSymbol === anotherRegular);      // false
```

> **`Symbol.for()`** **创建像共享密钥一样工作的符号 - 您应用程序的任何部分都可以通过使用相同的名称来访问相同的符号。另一方面，常规符号始终是唯一的，即使它们具有相同的名称。**

## 何时使用符号


符号（Symbols）在特定情况下会发光发热。当你需要真正独特的属性键时，可以使用它们，比如添加不会干扰现有属性的元数据（metadata）。它们非常适合通过知名符号（well-known Symbols）创建专门的对象行为，而注册表（Registry）的 Symbol.for() 方法则有助于在整个应用程序中共享常量。


```javascript
// Use symbols for private-like properties
const userIdSymbol = Symbol('id');
const user = {
  [userIdSymbol]: 123,
  name: 'Alex'
};

// Leverage symbols for special behaviors
const customIterator = {
  [Symbol.iterator]() {
    // Implement custom iterator logic
  }
};

// Share constants across modules using Symbol.for()
const SHARED_ACTION = Symbol.for('action');
```


---


参考：[https://www.trevorlasn.com/blog/symbols-in-javascript](https://www.trevorlasn.com/blog/symbols-in-javascript)

## 延伸阅读

- [LangChain JS Tutorial: Build AI With LangChain In JavaScript – Full Crash Course ](/blog/2026-04-25-langchain-js-tutorial-build-ai-with-lang/)
- [MoCode Phase 1 开发笔记 ](/blog/2026-06-14-mocode-phase-1/)
- [MoCode Phase 4 开发笔记](/blog/2026-06-15-mocode-phase-4/)
- [MoCode Phase 6 开发笔记](/blog/2026-06-18-mocode-phase-6/)
