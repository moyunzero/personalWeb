---
title: TypeScript
slug: 2023-04-20-typescript
description: ""
author: 墨韵
date: 2023-04-20
categories:
  - note
tags:
  - frontend
draft: false
notionId: c1606333-d568-4420-aa39-55426602f746
notionSyncedAt: 2026-05-29T06:49:16.073Z
---

# 一、TypeScript 语言简介


## 1.1 概述


TypeScript（简称 TS）是微软公司开发的一种基于 JavaScript （简称 JS）语言的编程语言。


TypeScript 可以看成是 JavaScript 的超集（superset），即它继承了后者的全部语法，所有 JavaScript 脚本都可以当作 TypeScript 脚本（但是可能会报错），此外它再增加了一些自己的语法。 TypeScript 对 JavaScript 添加的最主要部分，就是一个独立的类型系统。


## 1.2 类型的概念


类型（type）指的是一组具有相同特征的值。如果两个值具有某种共同的特征，就可以说，它们属于同一种类型。


一旦确定某个值的类型，就意味着，这个值具有该类型的所有特征，可以进行该类型的所有运算。凡是适用该类型的地方，都可以使用这个值；凡是不适用该类型的地方，使用这个值都会报错。


**类型是人为添加的一种编程约束和用法提示**。 主要目的是在软件开发过程中，为编译器和开发工具提供更多的验证和帮助，帮助提高代码质量，减少错误。


`function addOne(n: number) {
  return n + 1;
}`


上面示例中，函数addOne()有一个参数n，类型为数值（number），表示这个位置只能使用数值，传入其他类型的值就会报错。


TypeScript 是在开发阶段报错，这样有利于提早发现错误，避免使用时报错。另一方面，函数定义里面加入类型，具有提示作用，可以告诉开发者这个函数怎么用。


## 1.3 动态类型与静态类型


TypeScript 的主要功能是为 JavaScript 添加类型系统。


在语法上，JavaScript 属于动态类型语言。


TypeScript 引入了一个更强大、更严格的类型系统，属于静态类型语言。


## 1.4 静态类型的优点


（1）有利于代码的静态分析。


有了静态类型，不必运行代码，就可以确定变量的类型，从而推断代码有没有错误。这就叫做代码的静态分析。


（2）有利于发现错误。


由于每个值、每个变量、每个运算符都有严格的类型约束，TypeScript 就能轻松发现拼写错误、语义错误和方法调用错误，节省程序员的时间。


（3）更好的 IDE 支持，做到语法提示和自动补全。


IDE（集成开发环境，比如 VSCode）一般都会利用类型信息，提供语法提示功能（编辑器自动提示函数用法、参数等）和自动补全功能（只键入一部分的变量名或函数名，编辑器补全后面的部分）。


（4）提供了代码文档。


类型信息可以部分替代代码文档，解释应该如何使用这些代码，熟练的开发者往往只看类型，就能大致推断代码的作用。借助类型信息，很多工具能够直接生成文档。


（5）有助于代码重构。


修改他人的 JavaScript 代码，往往非常痛苦，项目越大越痛苦，因为不确定修改后是否会影响到其他部分的代码。


类型信息大大减轻了重构的成本。一般来说，只要函数或对象的参数和返回值保持类型不变，就能基本确定，重构后的代码也能正常运行。如果还有配套的单元测试，就完全可以放心重构。越是大型的、多人合作的项目，类型信息能够提供的帮助越大。


综上所述，TypeScript 有助于提高代码质量，保证代码安全，更适合用在大型的企业级项目。这就是为什么大量 JavaScript 项目转成 TypeScript 的原因。


## 1.5 静态类型的缺点


（1）丧失了动态类型的代码灵活性。


动态类型有非常高的灵活性，给予程序员很大的自由，静态类型将这些灵活性都剥夺了。


（2）增加了编程工作量。


有了类型之后，程序员不仅需要编写功能，还需要编写类型声明，确保类型正确。这增加了不少工作量，有时会显著拖长项目的开发时间。


（3）更高的学习成本。


类型系统通常比较复杂，要学习的东西更多，要求开发者付出更高的学习成本。


（4）引入了独立的编译步骤。


原生的 JavaScript 代码，可以直接在 JavaScript 引擎运行。添加类型系统以后，就多出了一个单独的编译步骤，检查类型是否正确，并将 TypeScript 代码转成JavaScript 代码，这样才能运行。


（5）兼容性问题。


TypeScript 依赖 JavaScript 生态，需要用到很多外部模块。但是，过去大部分JavaScript 项目都没有做 TypeScript 适配，虽然可以自己动手做适配，不过使用时难免还是会有一些兼容性问题。


# 二、TypeScript 基本用法


## 2.1 类型声明


TypeScript 代码最明显的特征，就是为 JavaScript 变量加上了类型声明。


`let foo: string;`


类型声明的写法，一律为在标识符后面添加“冒号 + 类型”。函数参数和返回值，也是这样来声明类型。


`function toString(num: number): string {
  return String(num);
}`

> 变量的值应该与声明的类型一致，如果不一致，TypeScript 就会报错。

另外，TypeScript 规定，变量只有赋值后才能使用，否则就会报错。


`let x: number;
console.log(x); // 报错`


## 2.2 类型推断


类型声明并不是必需的，如果没有，TypeScript 会自己推断类型。


`let foo = 123;`


TypeScript 也可以推断函数的返回值。


`function toString(num: number) {
  return String(num);
}`


TypeScript 的设计思想是，类型声明是可选的，你可以加，也可以不加。即使不加类型声明，依然是有效的 TypeScript 代码，只是这时不能保证TypeScript 会正确推断出类型。由于这个原因。所有 JavaScript 代码都是合法的TypeScript 代码。


这样设计还有一个好处，将以前的 JavaScript 项目改为 TypeScript 项目时，你可以逐步地为老代码添加类型，即使有些代码没有添加，也不会无法运行。


## 2.3 TypeScript 的编译


JavaScript 的运行环境（浏览器和 Node.js）不认识 TypeScript 代码。所以，TypeScript 项目要想运行，必须先转为 JavaScript 代码，这个代码转换的过程就叫做“编译”（compile）。 TypeScript 官方没有做运行环境，只提供编译器。编译时，会将类型声明和类型相关的代码全部删除，只留下能运行的 JavaScript 代码，并且不会改变 JavaScript 的运行结果。 因此，TypeScript 的类型检查只是编译时的类型检查，而不是运行时的类型检查。一旦代码编译为 JavaScript，运行时就不再检查类型了。


## 2.4 值与类型


学习 TypeScript 需要分清楚“值”（value）和“类型”（type）。


“类型”是针对“值”的，可以视为是后者的一个元属性。每一个值在 TypeScript 里面都是有类型的。比如，3是一个值，它的类型是number。


TypeScript 代码只涉及类型，不涉及值。所有跟“值”相关的处理，都由 JavaScript 完成。 这一点务必牢记。


TypeScript 项目里面，其实存在两种代码，一种是底层的“值代码”，另一种是上层的“类型代码”。前者使用 JavaScript 语法，后者使用 TypeScript的类型语法。 它们是可以分离的，TypeScript 的编译过程，实际上就是把“类型代码”全部拿掉，只保留“值代码”。


编写 TypeScript 项目时，不要混淆哪些是值代码，哪些是类型代码。


## 2.5 TypeScript Playground


最简单的 TypeScript 使用方法，就是使用官网的在线编译页面，叫做 TypeScriptPlayground。 只要打开这个网页，把 TypeScript 代码贴进文本框，它就会在当前页面自动编译出JavaScript 代码，还可以在浏览器执行编译产物。如果编译报错，它也会给出详细的报错信息。 这个页面还具有支持完整的 IDE 支持，可以自动语法提示。此外，它支持把代码片段和编译器设置保存成 URL，分享给他人。


## 2.6 tsc 编译器


TypeScript 官方提供的编译器叫做 tsc，可以将 TypeScript 脚本编译成 JavaScript脚本。本机想要编译 TypeScript 代码，必须安装 tsc。


根据约定，TypeScript 脚本文件使用.ts后缀名，JavaScript 脚本文件使用.js后缀名。tsc 的作用就是把.ts脚本转变成.js脚本。


## 2.7 ts-node 模块


ts-node 是一个非官方的 npm 模块，可以直接运行 TypeScript 代码。


# 三、any 类型，unknown 类型，never 类


## 3.1 any 类型


### 3.1.1 基本含义


any 类型表示没有任何限制，该类型的变量可以赋予任意类型的值。


`let x: any;

x = 1; // 正确
x = "foo"; // 正确
x = true; // 正确`


变量类型一旦设为any，TypeScript 实际上会关闭这个变量的类型检查。即使有明显的类型错误，只要句法正确，都不会报错。


`let x: any = "hello";

x(1); // 不报错
x.foo = 100; // 不报错`


由于这个原因，应该尽量避免使用any类型，否则就失去了使用 TypeScript 的意义。


实际开发中，any类型主要适用以下两个场合。


（1）出于特殊原因，需要关闭某些变量的类型检查，就可以把该变量的类型设为any。


（2）为了适配以前老的 JavaScript 项目，让代码快速迁移到 TypeScript，可以把变量类型设为any。有些年代很久的大型 JavaScript 项目，尤其是别人的代码，很难为每一行适配正确的类型，这时你为那些类型复杂的变量加上any，TypeScript 编译时就不会报错。


总之，TypeScript 认为，只要开发者使用了any类型，就表示开发者想要自己来处理这些代码，所以就不对any类型进行任何限制，怎么使用都可以。


集合论的角度看，any类型可以看成是所有其他类型的全集，包含了一切可能的类型。TypeScript 将这种类型称为“顶层类型”（top type），意为涵盖了所有下层。


### 3.1.2 类型推断问题


对于开发者没有指定类型、TypeScript 必须自己推断类型的那些变量，如果无法推断出类型，TypeScript 就会认为该变量的类型是any。


`function add(x, y) {
  return x + y;
}

add(1, [1, 2, 3]); // 不报错`


对于那些类型不明显的变量，一定要显式声明类型，防止被推断为any。


TypeScript 提供了一个编译选项noImplicitAny，打开该选项，只要推断出any类型就会报错。


`tsc --noImplicitAny app.ts`


这里有一个特殊情况，即使打开了noImplicitAny，使用let和var命令声明变量，但不赋值也不指定类型，是不会报错的。


`var x; // 不报错
let y; // 不报错`


建议使用let和var声明变量时，如果不赋值，就一定要显式声明类型，否则可能存在安全隐患。


const命令没有这个问题，因为 JavaScript 语言规定const声明变量时，必须同时进行初始化（赋值）。


### 3.1.3 污染问题


any类型除了关闭类型检查，还有一个很大的问题，就是它会“污染”其他变量。它可以赋值给其他任何类型的变量（因为没有类型检查），导致其他变量出错。


`let x: any = "hello";
let y: number;

y = x; // 不报错

y * 123; // 不报错
y.toFixed(); // 不报错`


## 3.2 unknown 类型


为了解决any类型“污染”其他变量的问题，TypeScript 3.0 引入了**unknown类型**。它与any含义相同，表示类型不确定，可能是任意类型，但是它的使用有一些限制，不像any那样自由，可以视为严格版的any。


unknown跟any的相似之处，在于所有类型的值都可以分配给unknown类型。


`let x: unknown;

x = true; // 正确
x = 42; // 正确
x = "Hello World"; // 正确`


unknown类型跟any类型的不同之处在于，它不能直接使用。主要有以下几个限制。


1.unknown类型的变量，不能直接赋值给其他类型的变量（除了any类型和unknown类型）。


`let v: unknown = 123;

let v1: boolean = v; // 报错
let v2: number = v; // 报错`


变量v是unknown类型，赋值给any和unknown以外类型的变量都会报错，这就避免了污染问题，从而克服了any类型的一大缺点。


2.不能直接调用unknown类型变量的方法和属性。


`let v1: unknown = { foo: 123 };
v1.foo; // 报错

let v2: unknown = "hello";
v2.trim(); // 报错

let v3: unknown = (n = 0) => n + 1;
v3(); // 报错`


3.unknown类型变量能够进行的运算是有限的，只能进行**比较运算**（运算符== 、===、!=、!==、||、&&、?）、**取反运算**（运算符!）、typeof运算符和instanceof运算符这几种，其他运算都会报错。


4. 正确使用unknown类型变量，只有经过“类型缩小”，unknown类型变量才可以使用。所谓“类型缩小”，就是缩小unknown变量的类型范围，确保不会出错。


`let a: unknown = 1;

if (typeof a === "number") {
  let r = a + 10; // 正确
}`


unknown类型的变量a经过typeof运算以后，能够确定实际类型是number，就能用于加法运算了。这就是“类型缩小”，即将一个不确定的类型缩小为更明确的类型。


这样设计的目的是，只有明确unknown变量的实际类型，才允许使用它，防止像any那样可以随意乱用，“污染”其他变量。类型缩小以后再使用，就不会报错。


总之，unknown可以看作是更安全的any。一般来说，凡是需要设为any类型的地方，通常都应该优先考虑设为unknown类型。 在集合论上，unknown也可以视为所有其他类型（除了any）的全集，所以它和any一样，也属于 TypeScript 的顶层类型。


## 3.3 never 类型


TypeScript 还引入了“空类型”的概念，即该类型为空，不包含任何值。 由于不存在任何属于“空类型”的值，所以该类型被称为never，即不可能发生这样的值。


`let x: never;`


never类型的使用场景，主要是在一些类型运算之中，保证类型运算的完整性，另外，不可能返回值的函数，返回值的类型就可以写成never。


如果一个变量可能有多种类型（即联合类型），通常需要使用分支处理每一种类型。这时，处理所有可能的类型之后，剩余的情况就属于never类型。


`function fn(x: string | number) {
  if (typeof x === "string") {
    // ...
  } else if (typeof x === "number") {
    // ...
  } else {
    x; // never 类型
  }
}`


never类型的一个重要特点是，可以赋值给任意其他类型。


`function f(): never {
  throw new Error("Error");
}

let v1: number = f(); // 不报错
let v2: string = f(); // 不报错
let v3: boolean = f(); // 不报错`

> 为什么never类型可以赋值给任意其他类型呢？这也跟集合论有关，空集是任何集合的子集。TypeScript 就相应规定，任何类型都包含了never类型。因此，never类型是任何其他类型所共有的，TypeScript 把这种情况称为“底层类型”（bottomtype）。

总之，TypeScript 有两个“顶层类型”（any和unknown），但是“底层类型”只有never唯一一个。


# 四、TypeScript 的类型系统


## 4.1 基本类型


### 4.1.1 概述


JavaScript 语言（注意，不是 TypeScript）将值分成8种类型。

- boolean

    boolean类型只包含true和false两个布尔值。

- string

    string类型包含所有字符串。


    普通字符串和模板字符串都属于 string 类型。

- number

    number类型包含所有整数和浮点数。

- bigint

    bigint 类型包含所有的大整数。


    bigint 与 number 类型不兼容。

    > 注意，bigint 类型是 ES2020 标准引入的。如果使用这个类型，TypeScript 编译的目标 JavaScript 版本不能低于 ES2020（即编译参数target不低于es2020）。
- symbol

    symbol 类型包含所有的 Symbol 值。

- object

    object 类型包含了所有对象、数组和函数。

- undefined

    undefined 类型只包含一个值undefined，表示未定义（即还未给出定义，以后可能会有定义）。

- null

    null 类型也只包含一个值null，表示为空（即此处没有值）。

    > 注意，如果没有声明类型的变量，被赋值为undefined或null，它们的类型会被推断为any。

TypeScript 继承了 JavaScript 的类型设计，以上8种类型可以看作 TypeScript 的基本类型。

> 上面所有类型的名称都是小写字母，首字母大写的Number、String、Boolean等在 JavaScript 语言中都是内置对象，而不是类型名称。 另外，undefined 和 null 既可以作为值，也可以作为类型，取决于在哪里使用它们。

这8种基本类型是 TypeScript 类型系统的基础，复杂类型由它们组合而成。


## 4.2 包装对象类型


### 4.2.1 包装对象的概念


JavaScript 的8种类型之中，undefined和null其实是两个特殊值，object属于复合类型，剩下的五种属于**原始类型**（primitive value），代表最基本的、不可再分的值。

- boolean
- string
- number
- bigint
- symbol

上面这五种原始类型的值，都有对应的包装对象（wrapper object）。**所谓“包装对象”，指的是这些值在需要时，会自动产生的对象。**


在 JavaScript 语言中，只有对象才有方法，原始类型的值本身没有方法。这行代码之所以可以运行，就是因为在调用方法时，字符串会自动转为包装对象，charAt()方法其实是定义在包装对象上。 这样的设计大大方便了字符串处理，省去了将原始类型的值手动转成对象实例的麻烦。


五种包装对象之中，symbol 类型和 bigint 类型无法直接获取它们的包装对象（即Symbol()和BigInt()不能作为构造函数使用），但是剩下三种可以。

- Boolean()
- String()
- Number()

以上三个构造函数，执行后可以直接获取某个原始类型值的包装对象。


`const s = new String("hello");
typeof s; // 'object'
s.charAt(1); // 'e'`

> 注意，String()只有当作构造函数使用时（即带有new命令调用），才会返回包装对象。如果当作普通函数使用（不带有new命令），返回就是一个普通字符串。其他两个构造函数Number()和Boolean()也是如此。

### 4.2.2 包装对象类型与字面量类型


由于包装对象的存在，导致每一个原始类型的值都有包装对象和字面量两种情况。


`"hello"; // 字面量
new String("hello"); // 包装对象`


为了区分这两种情况，TypeScript 对五种原始类型分别提供了大写和小写两种类型。

- Boolean 和 boolean
- String 和 string
- Number 和 number
- BigInt 和 bigint
- Symbol 和 symbol

其中，大写类型同时包含包装对象和字面量两种情况，小写类型只包含字面量，不包含包装对象。


`const s1: String = "hello"; // 正确
const s2: String = new String("hello"); // 正确

const s3: string = "hello"; // 正确
const s4: string = new String("hello"); // 报错`


建议只使用小写类型，不使用大写类型。因为绝大部分使用原始类型的场合，都是使用字面量，不使用包装对象。而且，TypeScript 把很多内置方法的参数，定义成小写类型，使用大写类型会报错。

> Symbol()和BigInt()这两个函数不能当作构造函数使用，所以没有办法直接获得 symbol 类型和 bigint 类型的包装对象，因此Symbol和BigInt这两个类型虽然存在，但是完全没有使用的理由。

## 4.3 Object 类型与 object 类型


### 4.3.1 Object 类型


大写的Object类型代表 JavaScript 语言里面的广义对象。所有可以转成对象的值，是Object类型，这囊括了几乎所有的值。


`let obj: Object;

obj = true;
obj = "hi";
obj = 1;
obj = { foo: 123 };
obj = [1, 2];
obj = (a: number) => a + 1;`


事实上，**除了undefined和null**这两个值不能转为对象，其他任何值都可以赋值给Object类型。


另外，空对象{}是Object类型的简写形式，所以使用Object时常常用空对象代替。


### 4.3.2 object 类型


小写的object类型代表 JavaScript 里面的狭义对象，即可以用字面量表示的对象，**只包含对象、数组和函数，不包括原始类型的值**。


`let obj: object;

obj = { foo: 123 };
obj = [1, 2];
obj = (a: number) => a + 1;
obj = true; // 报错
obj = "hi"; // 报错
obj = 1; // 报错`


大多数时候，我们使用对象类型，只希望包含真正的对象，不希望包含原始类型。所以，建议总是使用小写类型object，不使用大写类型Object。


注意，无论是大写的Object类型，还是小写的object类型，都只包含 JavaScript内置对象原生的属性和方法，用户自定义的属性和方法都不存在于这两个类型之中。


`const o1: Object = { foo: 0 };
const o2: object = { foo: 0 };

o1.toString(); // 正确
o1.foo; // 报错

o2.toString(); // 正确
o2.foo; // 报错`


## 4.4 undefined 和 null 的特殊性


undefined和null既是值，又是类型。


作为值，它们有一个特殊的地方：**任何其他类型的变量都可以赋值为undefined或null。**


`let age: number = 24;

age = null; // 正确
age = undefined; // 正确`


这并不是因为undefined和null包含在number类型里面，而是故意这样设计，任何类型的变量都可以赋值为undefined和null，以便跟 JavaScript 的行为保持一致。


JavaScript 的行为是，变量如果等于undefined就表示还没有赋值，如果等于null就表示值为空。所以，TypeScript 就允许了任何类型的变量都可以赋值为这两个值。


`const obj: object = undefined;
obj.toString(); // 编译不报错，运行就报错`


上面示例中，变量obj等于undefined，编译不会报错。但是，实际执行时，调用obj.toString()就报错了，因为undefined不是对象，没有这个方法。


为了避免这种情况，及早发现错误，TypeScript 提供了一个编译选项strictNullChecks。只要打开这个选项，undefined和null就不能赋值给其他类型的变量（除了any类型和unknown类型）。


下面是 tsc 命令打开这个编译选项的例子。


`// tsc --strictNullChecks app.ts

let age: number = 24;

age = null; // 报错
age = undefined; // 报错`


这个选项在配置文件tsconfig.json的写法如下。


`{
  "compilerOptions": {
    "strictNullChecks": true
    // ...
  }
}`


打开strictNullChecks以后，undefined和null这两种值也不能互相赋值了。


总之，打开strictNullChecks以后，undefined和null只能赋值给自身，或者any类型和unknown类型的变量。


## 4.5 值类型


TypeScript 规定，单个值也是一种类型，称为“值类型”。


`let x: "hello";

x = "hello"; // 正确
x = "world"; // 报错`


上面示例中，变量x的类型是字符串hello，导致它只能赋值为这个字符串，赋值为其他字符串就会报错。


TypeScript 推断类型时，遇到const命令声明的变量，如果代码里面没有注明类型，就会推断该变量是值类型。


`// x 的类型是 "https"
const x = "https";

// y 的类型是 string
const y: string = "https";`


上面示例中，变量x是const命令声明的，TypeScript 就会推断它的类型是值https，而不是string类型。


这样推断是合理的，因为const命令声明的变量，一旦声明就不能改变，相当于常量。值类型就意味着不能赋为其他值。


**注意**，const命令声明的变量，如果赋值为对象，并不会推断为值类型。


`// x 的类型是 { foo: number }
const x = { foo: 1 };`


上面示例中，变量x没有被推断为值类型，而是推断属性foo的类型是number。这是因为 JavaScript 里面，const变量赋值为对象时，属性值是可以改变的。 值类型可能会出现一些很奇怪的报错。


`const x: 5 = 4 + 1; // 报错`


上面示例中，等号左侧的类型是数值5，等号右侧4 + 1的类型，TypeScript 推测为number。由于5是number的子类型，number是5的父类型，父类型不能赋值给子类型，所以报错了。


但是，反过来是可以的，子类型可以赋值给父类型。


如果一定要让子类型可以赋值为父类型的值，就要用到类型断言。


`let x: 5 = 5;
let y: number = 4 + 1;

x = y; // 报错
y = x; // 正确`


在4 + 1后面加上as 5，就是告诉编译器，可以把4 + 1的类型视为值类型5，这样就不会报错了。


## 4.6 联合类型


联合类型（union types）指的是多个类型组成的一个新类型，使用符号 **|** 表示。


联合类型A|B表示，任何一个类型只要属于A或B，就属于联合类型A|B。


`let x: string | number;

x = 123; // 正确
x = "abc"; // 正确`


联合类型可以与值类型相结合，表示一个变量的值有若干种可能。


`let setting: true | false;

let gender: "male" | "female";

let rainbowColor: "赤" | "橙" | "黄" | "绿" | "青" | "蓝" | "紫";`


打开编译选项strictNullChecks后，其他类型的变量不能赋值为undefined或null。这时，如果某个变量确实可能包含空值，就可以采用联合类型的写法。


`let name: string | null;

name = "John";
name = null;`


联合类型的第一个成员前面，也可以加上竖杠|，这样便于多行书写。


`let x: "one" | "two" | "three" | "four";`


如果一个变量有多种类型，读取该变量时，往往需要进行“类型缩小”（type narrowing），区分该值到底属于哪一种类型，然后再进一步处理。


`function printId(id: number | string) {
  console.log(id.toUpperCase()); // 报错
}`


解决方法就是对参数id做一下类型缩小，确定它的类型以后再进行处理。


`function printId(id: number | string) {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
  } else {
    console.log(id);
  }
}`


“类型缩小”是 TypeScript 处理联合类型的标准方法，凡是遇到可能为多种类型的场合，都需要先缩小类型，再进行处理。实际上，联合类型本身可以看成是一种“类型放大”（type widening），处理时就需要“类型缩小”（type narrowing）。


`function getPort(scheme: "http" | "https") {
  switch (scheme) {
    case "http":
      return 80;
    case "https":
      return 443;
  }
}`


## 4.7 交叉类型


交叉类型（intersection types）指的多个类型组成的一个新类型，使用符号&表示。


交叉类型A&B表示，任何一个类型必须同时属于A和B，才属于交叉类型A&B，即交叉类型同时满足A和B的特征。


`let x: number & string;`


上面，变量x同时是数值和字符串，这当然是不可能的，所以 TypeScript 会认为x的类型实际是never。


交叉类型的主要用途是表示对象的合成。


`let obj: { foo: string } & { bar: string };

obj = {
  foo: "hello",
  bar: "world",
};`


交叉类型常常用来为对象类型添加新属性。


`type A = { foo: number };

type B = A & { bar: number };`


## 4.8 type 命令


type命令用来定义一个类型的别名。


`type Age = number;

let age: Age = 55;`


别名可以让类型的名字变得更有意义，也能增加代码的可读性，还可以使复杂类型用起来更方便，便于以后修改变量的类型。


别名不允许重名。


`type Color = "red";
type Color = "blue"; // 报错`


别名的作用域是块级作用域。这意味着，代码块内部定义的别名，影响不到外部。


`type Color = "red";

if (Math.random() < 0.5) {
  type Color = "blue";
}`


别名支持使用表达式，也可以在定义一个别名时，使用另一个别名，即别名允许嵌套。


`type World = "world";
type Greeting = `hello ${World}`;`


type命令属于类型相关的代码，编译成 JavaScript 的时候，会被全部删除。


## 4.9 typeof 运算符


avaScript 语言中，typeof 运算符是一个一元运算符，返回一个字符串，代表操作数的类型。


`typeof "foo"; // 'string'`


注意，这时 typeof 的操作数是一个值。


JavaScript 里面，typeof运算符只可能返回八种结果，而且都是字符串。


`typeof undefined; // "undefined"
typeof true; // "boolean"
typeof 1337; // "number"
typeof "foo"; // "string"
typeof {}; // "object"
typeof parseInt; // "function"
typeof Symbol(); // "symbol"
typeof 127n; // "bigint"`


TypeScript 将typeof运算符移植到了类型运算，它的操作数依然是一个值，但是返回的不是字符串，而是该值的 TypeScript 类型。


`const a = { x: 0 };

type T0 = typeof a; // { x: number }
type T1 = typeof a.x; // number`


这种用法的typeof返回的是 TypeScript 类型，所以只能用在类型运算之中（即跟类型相关的代码之中），不能用在值运算。


也就是说，同一段代码可能存在两种typeof运算符，一种用在值相关的 JavaScript代码部分，另一种用在类型相关的 TypeScript 代码部分。


`let a = 1;
let b: typeof a;

if (typeof a === "number") {
  b = a;
}`


上面示例中，用到了两个typeof，第一个是类型运算，第二个是值运算。它们是不一样的，不要混淆。


JavaScript 的 typeof 遵守 JavaScript 规则，TypeScript 的 typeof 遵守 TypeScript规则。它们的一个重要区别在于，编译后，前者会保留，后者会被全部删除。


由于编译时不会进行 JavaScript 的值运算，所以TypeScript 规定，typeof 的参数只能是标识符，不能是需要运算的表达式。


`type T = typeof Date(); // 报错`


另外，typeof命令的参数不能是类型。


`type Age = number;
type MyAge = typeof Age; // 报错`


上面示例中，Age是一个类型别名，用作typeof命令的参数就会报错。


## 4.10 块级类型声明


TypeScript 支持块级类型声明，即类型可以声明在代码块（用大括号表示）里面，并且只在当前代码块有效。


`if (true) {
  type T = number;
  let v: T = 5;
} else {
  type T = string;
  let v: T = "hello";
}`


## 4.11 类型的兼容


TypeScript 的类型存在兼容关系，某些类型可以兼容其他类型。


`type T = number | string;

let a: number = 1;
let b: T = a;`


上面示例中，变量a和b的类型是不一样的，但是变量a赋值给变量b并不会报错。这时，我们就认为，b的类型兼容a的类型。


TypeScript 为这种情况定义了一个专门术语。如果类型A的值可以赋值给类型B，那么类型A就称为类型B的子类型（subtype）。


TypeScript 的一个规则是，凡是可以使用父类型的地方，都可以使用子类型，但是反过来不行。


`let a: "hi" = "hi";
let b: string = "hello";

b = a; // 正确
a = b; // 报错`


之所以有这样的规则，是因为子类型继承了父类型的所有特征，所以可以用在父类型的场合。但是，子类型还可能有一些父类型没有的特征，所以父类型不能用在子类型的场合。


# 五、TypeScript 的数组类型


JavaScript 数组在 TypeScript 里面分成两种类型，分别是**数组（array）和元组（tuple）。**


## 5.1 简介


TypeScript 数组有一个**根本特征**：所有成员的类型必须相同，但是成员数量是不确定的，可以是无限数量的成员，也可以是零成员。


数组的类型有两种写法。


**第一种写法**是在数组成员的类型后面，加上一对方括号。


`let arr: number[] = [1, 2, 3];`


上面示例中，数组arr的类型是number[]，其中number表示数组成员类型是number。


如果数组成员的类型比较复杂，可以写在圆括号里面。


`let arr: (number | string)[];`


这个例子里面的**圆括号是必须的**，否则因为竖杠（|）的优先级低于[]，TypeScript 会把number|string[]理解成number和string[]的联合类型。


如果数组成员可以是任意类型，写成any[]。当然，这种写法是**应该避免的。**


`let arr: (number | string)[];`


数组类型的**第二种写法**是使用 TypeScipt 内置的 Array 接口。


`let arr: Array<number> = [1, 2, 3];`


上面示例中，数组arr的类型是Array<**number**>，其中number表示成员类型是 number。


这种写法对于成员类型比较复杂的数组，代码可读性会稍微好一些。


`let arr: Array<number | string>;`


数组类型声明了以后，成员数量是不限制的，任意数量的成员都可以，也可以是空数组。


`let arr: number[];
arr = [];
arr = [1];
arr = [1, 2];
arr = [1, 2, 3];`


这种规定的隐藏含义就是，数组的成员是可以**动态变化**的。


`let arr: number[] = [1, 2, 3];

arr[3] = 4;
arr.length = 2;

arr; // [1, 2]`


正是由于成员数量可以动态变化，所以 **TypeScript 不会对数组边界进行检查，越界访问数组并不会报错。**


TypeScript 允许使用方括号读取数组成员的类型。


`type Names = string[];
type Name = Names[0]; // string`


由于数组成员的索引类型都是number，所以读取成员类型也可以写成下面这样。


`type Names = string[];
type Name = Names[number]; // string`


## 5.2 数组的类型推断


如果数组变量没有声明类型，TypeScript 就会推断数组成员的类型。这时，推断行为会因为值的不同，而有所不同。


如果变量的初始值是空数组，那么 TypeScript 会推断数组类型是any[]。


`// 推断为 any[]
const arr = [];`


后面，为这个数组赋值时，TypeScript 会自动更新类型推断。


`const arr = [];
arr; // 推断为 any[]

arr.push(123);
arr; // 推断类型为 number[]

arr.push("abc");
arr; // 推断类型为 (string|number)[]`


但是，类型推断的自动更新**只发生初始值为空数组**的情况。如果初始值不是空数组，类型推断就不会更新。


`// 推断类型为 number[]
const arr = [123];

arr.push("abc"); // 报错`


## 5.3 只读数组，const 断言


JavaScript 规定，const命令声明的数组变量是可以改变成员的。


`const arr = [0, 1];
arr[0] = 2;`


TypeScript 允许声明只读数组，方法是在数组类型前面加上**readonly关键字**。


`const arr: readonly number[] = [0, 1];

arr[1] = 2; // 报错
arr.push(3); // 报错
delete arr[0]; // 报错`


上面示例中，arr是一个只读数组，删除、修改、新增数组成员都会报错。


TypeScript 将**readonly number[]**与**number[]**视为两种不一样的类型，后者是前者的子类型。


这是因为只读数组没有pop()、push()之类会改变原数组的方法，所以number[]的方法数量要多于readonly number[]，这意味着number[]其实是readonly number[]的子类型。


子类型继承了父类型的所有特征，并加上了自己的特征，所以子类型number[]可以用于所有使用父类型的场合，反过来就不行。


`let a1: number[] = [0, 1];
let a2: readonly number[] = a1; // 正确

a1 = a2; // 报错`


由于只读数组是数组的父类型，所以它不能代替数组。这一点很容易产生令人困惑的报错。


`function getSum(s: number[]) {
  // ...
}

const arr: readonly number[] = [1, 2, 3];

getSum(arr); // 报错`

> readonly关键字不能与数组的泛型写法一起使用。
>
> `// 报错
> const arr: readonly Array<number> = [0, 1];`
>
>

实际上，TypeScript 提供了两个专门的泛型，用来生成只读数组的类型。


`const a1: ReadonlyArray<number> = [0, 1];

const a2: Readonly<number[]> = [0, 1];`


泛型**ReadonlyArray<T>和Readonly<T[]>**都可以用来生成只读数组类型。两者尖括号里面的写法不一样，**Readonly<T[]>**的尖括号里面是整个数组（number[]），而ReadonlyArray<**T**>的尖括号里面是数组成员（number）。


只读数组还有一种声明方法，就是使用“const 断言”。


`const arr = [0, 1] as const;

arr[0] = [2]; // 报错`


上面示例中，as const告诉 TypeScript，推断类型时要把变量arr推断为只读数组，从而使得数组成员无法改变。


## 5.4 多维数组


TypeScript 使用T[][]的形式，表示二维数组，T是最底层数组成员的类型。


`var multi: number[][] = [
  [1, 2, 3],
  [23, 24, 25],
];`


上面示例中，变量multi的类型是number[][]，表示它是一个二维数组，最底层的数组成员类型是number。


# 六、TypeScript 的元组类型


## 6.1 简介


元组（tuple）是 TypeScript **特有的数据类型**，JavaScript 没有单独区分这种类型。它表示成员类型可以自由设置的数组，即数组的各个成员的类型可以不同。


元组**必须明确声明每个成员的类型**。


`const s: [string, string, boolean] = ["a", "b", true];`


元组类型的写法，与数组有一个重大差异。

- 数组的成员类型写在方括号外面（number[]）
- 元组的成员类型是写在方括号里面（[number]）。

TypeScript 的**区分方法**：成员类型写在方括号里面的就是元组，写在外面的就是数组。


`let a: [number] = [1];`


使用元组时，必须明确给出类型声明（上例的[number]），不能省略，否则TypeScript 会把一个值自动推断为数组。


`// a 的类型为 (number | boolean)[]
let a = [1, true];`


上面示例中，变量a的值其实是一个元组，但是 TypeScript 会将其推断为一个联合类型的数组，即a的类型为(number | boolean)[]。


元组成员的类型可以添加问号**后缀（?）**，表示该成员是可选的。


`let a: [number, number?] = [1];`

> 问号只能用于元组的尾部成员，也就是说，所有可选成员必须在必选成员之后。

`type myTuple = [number, number, number?, string?];`


由于需要声明每个成员的类型，所以大多数情况下，**元组的成员数量是有限的**，从类型声明就可以明确知道，元组包含多少个成员，越界的成员会报错。


`let x: [string, string] = ["a", "b"];

x[2] = "c"; // 报错`


但是，使用**扩展运算符（...），可以表示不限成员数量的元组**。


`type NamedNums = [string, ...number[]];

const a: NamedNums = ["A", 1, 2];
const b: NamedNums = ["B", 1, 2, 3];`


扩展运算符用在元组的任意位置都可以，但是它后面**只能是数组或元组。**


`type t1 = [string, number, ...boolean[]];
type t2 = [string, ...boolean[], number];
type t3 = [...boolean[], string, number];`


如果不确定元组成员的类型和数量，可以写成下面这样。


`type Tuple = [...any[]];
//不推荐`


元组可以通过方括号，读取成员类型。


`type Tuple = [string, number];
type Age = Tuple[1]; // number`


由于元组的成员都是数值索引，即索引类型都是number，所以可以像下面这样读取。


`type Tuple = [string, number, Date];
type TupleEl = Tuple[number]; // string|number|Date`


上面示例中，Tuple[number]表示元组Tuple的所有数值索引的成员类型，所以返回string|number|Date，即这个类型是三种值的联合类型。


## 6.2 只读元组


元组也可以是只读的，不允许修改，有两种写法。


`// 写法一
type t = readonly [number, string];

// 写法二
type t = Readonly<[number, string]>;`


上面示例中，两种写法都可以得到只读元组，其中写法二是一个泛型，用到了工具类型Readonly<**T**>。


跟数组一样，只读元组是元组的父类型。所以，元组可以替代只读元组，而只读元组不能替代元组。


`type t1 = readonly [number, number];
type t2 = [number, number];

let x: t2 = [1, 2];
let y: t1 = x; // 正确

x = y; // 报错`


由于只读元组不能替代元组，所以会产生一些令人困惑的报错。


`function distanceFromOrigin([x, y]: [number, number]) {
  return Math.sqrt(x ** 2 + y ** 2);
}

let point = [3, 4] as const;

distanceFromOrigin(point); // 报错`


上面示例中，函数distanceFromOrigin()的参数是一个元组，传入只读元组就会报错，因为只读元组不能替代元组。


读者可能注意到了，上例中[3, 4] as const的写法，上文生成的是只读数组，其实生成的同时也是只读元组。因为它生成的实际上是一个只读的“值类型”readonly [3, 4]，把它解读成只读数组或只读元组都可以。


上面示例报错的解决方法，就是使用类型断言，在最后一行将传入的参数断言为普通元组。


## 6.3 成员数量的推断


如果没有可选成员和扩展运算符，TypeScript 会推断出元组的成员数量（即元组长度）。


`function f(point: [number, number]) {
  if (point.length === 3) {
    // 报错
    // ...
  }
}`


如果包含了可选成员，TypeScript 会推断出可能的成员数量。


`function f(point: [number, number?, number?]) {
  if (point.length === 4) {
    // 报错
    // ...
  }
}`


如果**使用了扩展运算符**，TypeScript 就**无法推断出成员数量**。


`const myTuple: [...string[]] = ["a", "b", "c"];

if (myTuple.length === 4) {
  // 正确
  // ...
}`


## 6.4 扩展运算符与成员数量


扩展运算符（...）**将数组**（注意，**不是元组**）转换成一个逗号分隔的序列，这时TypeScript 会认为这个序列的成员数量是不确定的，因为数组的成员数量是不确定的。 这导致如果函数调用时，使用扩展运算符传入函数参数，可能发生参数数量与数组长度不匹配的报错。


`const arr = [1, 2];

function add(x: number, y: number) {
  // ...
}

add(...arr); // 报错`


上面示例会报错，原因是函数add()只能接受两个参数，但是传入的是...arr，TypeScript 认为转换后的参数个数是不确定的。


有些函数可以接受任意数量的参数，这时使用扩展运算符就不会报错。


`const arr = [1, 2, 3];
console.log(...arr); // 正确`


**解决**这个问题的一个**方法**，就是把成员数量不确定的数组，写成成员数量确定的元组，再使用扩展运算符。


`const arr: [number, number] = [1, 2];

function add(x: number, y: number) {
  // ...
}

add(...arr); // 正确`


另一种写法是使用**as const断言**。


`const arr = [1, 2] as const;`


上面这种写法也可以，因为 TypeScript 会认为arr的类型是readonly [1, 2]，这是一个只读的值类型，可以当作数组，也可以当作元组。


# 七、TypeScript 的 symbol 类型


## 7.1 简介


Symbol 是 ES2015 新引入的一种原始类型的值。它类似于字符串，但是每一个Symbol 值都是独一无二的，与其他任何值都不相等。


Symbol 值通过Symbol()函数生成。在 TypeScript 里面，Symbol 的类型使用symbol表示。


`let x: symbol = Symbol();
let y: symbol = Symbol();

x === y; // false`


## 7.2 unique symbol


symbol类型包含所有的 Symbol 值，但是无法表示某一个具体的 Symbol 值。


比如，5是一个具体的数值，就用5这个字面量来表示，这也是它的值类型。但是，Symbol 值不存在字面量，必须通过变量来引用，所以写不出只包含单个 Symbol 值的那种值类型。


为了解决这个问题，TypeScript 设计了symbol的一个子类型unique symbol，它表示单个的、某个具体的 Symbol 值。


因为**unique symbol**表示单个值，所以这个类型的变量是**不能修改值的**，只能用const命令声明，不能用let声明。


`// 正确
const x: unique symbol = Symbol();

// 报错
let y: unique symbol = Symbol();`


const命令为变量赋值 Symbol 值时，变量类型默认就是unique symbol，所以类型可以省略不写。


`const x: unique symbol = Symbol();
// 等同于
const x = Symbol();`


每个声明为unique symbol类型的变量，它们的值都是不一样的，其实属于两个值类型。


`const a: unique symbol = Symbol();
const b: unique symbol = Symbol();

a === b; // 报错`


上面示例中，变量a和变量b的类型虽然都是unique symbol，但其实是两个值类型。不同类型的值肯定是不相等的，所以最后一行就报错了。


`const a: "hello" = "hello";
const b: "world" = "world";

a === b; // 报错`


上面示例中，变量a和b都是字符串，但是属于不同的值类型，不能使用严格相等运算符进行比较。


而且，由于变量a和b是两个类型，就不能把一个赋值给另一个。


`const a: unique symbol = Symbol();
const b: unique symbol = a; // 报错`


上例变量b的类型，如果要写成与变量a同一个unique symbol值类型，只能写成类型为typeof a。


`const a: unique symbol = Symbol();
const b: typeof a = a; // 正确`


相同参数的Symbol.for()方法会返回相同的 Symbol 值。TypeScript 目前无法识别这种情况，所以可能出现多个 unique symbol 类型的变量，等于同一个 Symbol 值的情况。


`const a: unique symbol = Symbol.for("foo");
const b: unique symbol = Symbol.for("foo");`


上面示例中，变量a和b是两个不同的值类型，但是它们的值其实是相等的。


unique symbol 类型是 symbol 类型的子类型，所以可以将前者赋值给后者，但是反过来就不行。


`const a: unique symbol = Symbol();

const b: symbol = a; // 正确

const c: unique symbol = b; // 报错`


unique symbol 类型的一个**作用**，就是**用作属性名**，这可以保证不会跟其他属性名冲突。如果要把某一个特定的 Symbol 值当作属性名，那么它的类型**只能是 unique symbol**，不能是 symbol。


`const x: unique symbol = Symbol();
const y: symbol = Symbol();

interface Foo {
  [x]: string; // 正确
  [y]: string; // 报错
}`


unique symbol类型也可以用作类（class）的属性值，但只能赋值给类的readonly static属性。


`class C {
  static readonly foo: unique symbol = Symbol();
}`


注意，这时static和readonly两个限定符缺一不可，这是为了保证这个属性是固定不变的。


## 7.3 类型推断


如果变量声明时没有给出类型，TypeScript 会推断某个 Symbol 值变量的类型。


let命令声明的变量，推断类型为 symbol。


const命令声明的变量，推断类型为 unique symbol。


但是，const命令声明的变量，如果赋值为另一个 symbol 类型的变量，则推断类型为 symbol。


`let x = Symbol();

// 类型为 symbol
const y = x;`


let命令声明的变量，如果赋值为另一个 unique symbol 类型的变量，则推断类型还是 symbol。


`const x = Symbol();

// 类型为 symbol
let y = x;` 


# 八、TypeScript 的函数类型


## 8.1 简介


函数的类型声明，需要在声明函数时，给出参数的类型和返回值的类型。


`function hello(txt: string): void {
  console.log("hello " + txt);
}`


上面示例中，函数hello()在声明时，需要给出参数txt的类型（string），以及返回值的类型（void），后者写在参数列表的圆括号后面。void类型表示没有返回值。


如果不指定参数类型（比如上例不写txt的类型），TypeScript 就会推断参数类型，如果缺乏足够信息，就会推断该参数的类型为any。


返回值的类型通常可以不写，因为 TypeScript 自己会推断出来。


`function hello(txt: string) {
  console.log("hello " + txt);
}`


如果变量被赋值为一个函数，变量的类型有两种写法。


`// 写法一
const hello = function (txt: string) {
  console.log("hello " + txt);
};

// 写法二
const hello: (txt: string) => void = function (txt) {
  console.log("hello " + txt);
};`


上面示例中，变量hello被赋值为一个函数，它的类型有两种写法。


写法一是通过等号右边的函数类型，推断出变量hello的类型；


写法二则是使用箭头函数的形式，为变量hello指定类型，参数的类型写在箭头左侧，返回值的类型写在箭头右侧。


写法二有两个地方需要注意。


首先，函数的参数要放在圆括号里面，不放会报错。 其次，类型里面的参数名（本例是txt）**是必须的**。


函数类型里面的参数名与实际参数名，可以不一致。


`let f: (x: number) => number;

f = function (y: number) {
  return y;
};`


如果函数的类型定义很冗长，或者多个函数使用同一种类型，写法二用起来就很麻烦。因此，往往用type命令为函数类型定义一个别名，便于指定给其他变量。


`type MyFunc = (txt: string) => void;

const hello: MyFunc = function (txt) {
  console.log("hello " + txt);
};`


函数的实际参数个数，可以少于类型指定的参数个数，但是不能多于，即TypeScript 允许省略参数。


`let myFunc: (a: number, b: number) => number;

myFunc = (a: number) => a; // 正确

myFunc = (a: number, b: number, c: number) => a + b + c; // 报错`


上面示例中，变量myFunc的类型只能接受两个参数，如果被赋值为只有一个参数的函数，并不报错。但是，被赋值为有三个参数的函数，就会报错。


这是因为 JavaScript 函数在声明时往往有多余的参数，实际使用时可以只传入一部分参数。比如，数组的forEach()方法的参数是一个函数，该函数默认有三个参数(item, index, array) => void，实际上往往只使用第一个参数(item) => void。因此，TypeScript 允许函数传入的参数不足。


如果一个变量要套用另一个函数类型，有一个小技巧，就是**使用typeof运算符**。


`function add(x: number, y: number) {
  return x + y;
}

const myAdd: typeof add = function (x, y) {
  return x + y;
};`


上面示例中，函数myAdd()的类型与函数add()是一样的，那么就可以定义成typeof add。因为函数名add本身不是类型，而是一个值，所以要用typeof运算符返回它的类型。


这是一个很有用的技巧，任何需要类型的地方，都可以使用typeof运算符从一个值获取类型。


函数类型还可以采用对象的写法。


`let add: {
  (x: number, y: number): number;
};

add = function (x, y) {
  return x + y;
};`


函数类型的对象写法如下。


`{
  (参数列表): 返回值
}`


注意，这种写法的函数参数与返回值之间，间隔符是冒号:，而不是正常写法的箭头=>，因为这里采用的是对象类型的写法，对象的属性名与属性值之间使用的是冒号。


这种写法平时很少用，但是非常合适用在一个场合：函数本身存在属性。


`function f(x: number) {
  console.log(x);
}

f.version = "1.0";`


上面示例中，函数f()本身还有一个属性foo。这时，f完全就是一个对象，类型就要使用对象的写法。


`let foo: {
  (x: number): void;
  version: string;
} = f;`


函数类型也可以使用 Interface 来声明，这种写法就是对象写法的翻版。


`interface myfn {
  (a: number, b: number): number;
}

var add: myfn = (a, b) => a + b;`


上面示例中，interface 命令定义了接口myfn，这个接口的类型就是一个用对象表示的函数。


## 8.2 Function 类型


TypeScript 提供 Function 类型表示函数，任何函数都属于这个类型。


`function doSomething(f: Function) {
  return f(1, 2, 3);
}`


Function 类型的值都可以直接执行。


Function 类型的函数可以接受任意数量的参数，每个参数的类型都是any，返回值的类型也是any，代表没有任何约束，所以不建议使用这个类型，给出函数详细的类型声明会更好。


## 8.3 箭头函数


箭头函数是普通函数的一种简化写法，它的类型写法与普通函数类似。


`const repeat = (str: string, times: number): string => str.repeat(times);`


注意，类型写在箭头函数的定义里面，与使用箭头函数表示函数类型，写法有所不同。


`function greet(fn: (a: string) => void): void {
  fn("world");
}`


上面示例中，函数greet()的参数fn是一个函数，类型就用箭头函数表示。这时，fn的返回值类型要写在箭头右侧，而不是写在参数列表的圆括号后面。


下面再看一个例子。


`type Person = { name: string };

const people = ["alice", "bob", "jan"].map((name): Person => ({ name }));`


上面示例中，Person是一个类型别名，代表一个对象，该对象有属性name。变量people是数组的map()方法的返回值。 map()方法的参数是一个箭头函数(name):Person => ({name})，该箭头函数的参数name的类型省略了，因为可以从map()的类型定义推断出来，箭头函数的返回值类型为Person。相应地，变量people的类型是Person[]。 至于箭头后面的({name})，表示返回一个对象，该对象有一个属性name，它的属性值为变量name的值。这里的圆括号是必须的，否则(name):Person => {name}的大括号表示函数体，即函数体内有一行语句name，同时由于没有return语句，这个函数不会返回任何值。


`// 错误
(name: Person) => ({ name });

// 错误
name: (Person) => ({ name });`


上面的两种写法在本例中都是错的。第一种写法表示，箭头函数的参数name的类型是Person，同时没写函数返回值的类型，让 TypeScript 自己去推断。第二种写法中，函数参数缺少圆括号。


## 8.4 可选参数


如果函数的某个参数可以省略，则在参数名后面加问号表示。


`function f(x?: number) {
  // ...
}

f(); // OK
f(10); // OK`


参数名带有问号，表示该参数的类型实际上是原始类型|undefined，它有可能为undefined。


比如，上例的x虽然类型声明为number，但是实际上是number|undefined。


`function f(x?: number) {
  return x;
}

f(undefined); // 正确`


但是，反过来就不成立，类型显式设为undefined的参数，就不能省略。


`function f(x: number | undefined) {
  return x;
}

f(); // 报错`


函数的可选参数**只能在参数列表的尾部，跟在必选参数的后面**。


`let myFunc: (a?: number, b: number) => number; // 报错`


如果前部参数有可能为空，这时只能显式注明该参数类型可能为undefined。


`let myFunc: (a: number | undefined, b: number) => number;`


函数体内部用到可选参数时，需要判断该参数是否为undefined。


`let myFunc: (a: number, b?: number) => number;

myFunc = function (x, y) {
  if (y === undefined) {
    return x;
  }
  return x + y;
};`


## 8.5 参数默认值


TypeScript 函数的参数默认值写法，与 JavaScript 一致。 设置了默认值的参数，就是可选的。如果不传入该参数，它就会等于默认值。


`function createPoint(x: number = 0, y: number = 0): [number, number] {
  return [x, y];
}

createPoint(); // [0, 0]`


可选参数与默认值不能同时使用。


`// 报错
function f(x?: number = 0) {
  // ...
}`


设有默认值的参数，如果传入undefined，也会触发默认值。


`function f(x = 456) {
  return x;
}

f2(undefined); // 456`


具有默认值的参数如果不位于参数列表的末尾，调用时不能省略，如果要触发默认值，必须显式传入undefined。


`function add(x: number = 0, y: number) {
  return x + y;
}

add(1); // 报错
add(undefined, 1); // 正确`


## 8.6 参数解构


函数参数如果存在变量解构，类型写法如下。


`function f([x, y]: [number, number]) {
  // ...
}

function sum({ a, b, c }: { a: number; b: number; c: number }) {
  console.log(a + b + c);
}`


参数结构可以结合类型别名（type 命令）一起使用，代码会看起来简洁一些。


`type ABC = { a: number; b: number; c: number };

function sum({ a, b, c }: ABC) {
  console.log(a + b + c);
}`


## 8.7 rest 参数


rest 参数表示函数剩余的所有参数，它可以是数组（剩余参数类型相同），也可能是元组（剩余参数类型不同）。


`// rest 参数为数组
function joinNumbers(...nums: number[]) {
  // ...
}

// rest 参数为元组
function f(...args: [boolean, number]) {
  // ...
}`


注意，元组需要声明每一个剩余参数的类型。如果元组里面的参数是可选的，则要使用可选参数。


`function f(...args: [boolean, string?]) {}`


rest 参数甚至可以嵌套。


`function f(...args: [boolean, ...string[]]) {
  // ...
}`


rest 参数可以与变量解构结合使用。


`function repeat(...[str, times]: [string, number]): string {
  return str.repeat(times);
}

// 等同于
function repeat(str: string, times: number): string {
  return str.repeat(times);
}`


## 8.8 readonly 只读参数


如果函数内部不能修改某个参数，可以在函数定义时，在参数类型前面加上readonly关键字，表示这是只读参数。


`function arraySum(arr: readonly number[]) {
  // ...
  arr[0] = 0; // 报错
}`


## 8.9 void 类型


void 类型表示函数没有返回值。


`function f(): void {
  console.log("hello");
}`


如果返回其他值，就会报错。


void 类型允许返回undefined或null。


`function f(): void {
  return undefined; // 正确
}

function f(): void {
  return null; // 正确
}`


如果打开了strictNullChecks编译选项，那么 void 类型只允许返回undefined。如果返回null，就会报错。这是因为 JavaScript 规定，如果函数没有返回值，就等同于返回undefined。


需要特别注意的是，如果变量、对象方法、函数参数的类型是 void 类型的函数，那么并不代表不能赋值为有返回值的函数。恰恰相反，该变量、对象方法和函数参数可以接受返回任意值的函数，这时并不会报错。


`type voidFunc = () => void;

const f: voidFunc = () => {
  return 123;
};`


上面示例中，变量f的类型是voidFunc，是一个没有返回值的函数类型。但是实际上，f的值是一个有返回值的函数（返回123），编译时不会报错。


这是因为，这时 TypeScript 认为，这里的 void 类型只是表示该函数的返回值没有利用价值，或者说不应该使用该函数的返回值。只要不用到这里的返回值，就不会报错。


注意，这种情况仅限于变量、对象方法和函数参数，函数字面量如果声明了返回值是void 类型，还是不能有返回值。


`function f(): void {
  return true; // 报错
}

const f3 = function (): void {
  return true; // 报错
};`


除了函数，其他变量声明为void类型没有多大意义，因为这时只能赋值为undefined或者null（假定没有打开strictNullChecks) 。


`let foo: void = undefined;

// 没有打开 strictNullChecks 的情况下
let bar: void = null;`


## 8.10 never 类型


never类型表示肯定不会出现的值。它用在函数的返回值，就表示某个函数肯定不会返回值，即函数不会正常执行结束。 它主要有以下两种情况。


（1）抛出错误的函数。


`function fail(msg: string): never {
  throw new Error(msg);
}`


注意，只有抛出错误，才是 never 类型。如果显式用return语句返回一个 Error 对象，返回值就不是 never 类型。


`function fail(): Error {
  return new Error("Something failed");
}`


上面示例中，函数fail()返回一个 Error 对象，所以返回值类型是 Error。


（2）无限执行的函数。


`const sing = function (): never {
  while (true) {
    console.log("sing");
  }
};`


注意，never类型不同于void类型。前者表示函数没有执行结束，不可能有返回值；后者表示函数正常执行结束，但是不返回值，或者说返回undefined。


`// 正确
function sing(): void {
  console.log("sing");
}

// 报错
function sing(): never {
  console.log("sing");
}`


上面示例中，函数sing()虽然没有return语句，但实际上是省略了return undefined这行语句，真实的返回值是undefined。所以，它的返回值类型要写成void，而不是never，写成never会报错。


如果一个函数抛出了异常或者陷入了死循环，那么该函数无法正常返回一个值，因此该函数的返回值类型就是never。如果程序中调用了一个返回值类型为never的函数，那么就意味着程序会在该函数的调用位置终止，永远不会继续执行后续的代码。


`function neverReturns(): never {
  throw new Error();
}

function f(x: string | undefined) {
  if (x === undefined) {
    neverReturns();
  }

  x; // 推断为 string
}`


## 8.11 局部类型


函数内部允许声明其他类型，该类型只在函数内部有效，称为局部类型。


`function hello(txt: string) {
  type message = string;
  let newTxt: message = "hello " + txt;
  return newTxt;
}

const newTxt: message = hello("world"); // 报错`


## 8.12 高阶函数


一个函数的返回值还是一个函数，那么前一个函数就称为高阶函数（higher-order function）。 下面就是一个例子，箭头函数返回的还是一个箭头函数。


`(someValue: number) => (multiplier: number) => someValue * multiplier;`


## 8.13 函数重载


有些函数可以接受不同类型或不同个数的参数，并且根据参数的不同，会有不同的函数行为。这种根据参数类型不同，执行不同逻辑的行为，称为函数重载（function overload）。


`reverse("abc"); // 'cba'
reverse([1, 2, 3]); // [3, 2, 1]`


这意味着，该函数内部有处理字符串和数组的两套逻辑，根据参数类型的不同，分别执行对应的逻辑。这就叫“函数重载”。


TypeScript 对于“函数重载”的类型声明方法是，逐一定义每一种情况的类型。


`function reverse(str: string): string;
function reverse(arr: any[]): any[];`


上面示例中，分别对函数reverse()的两种参数情况，给予了类型声明。但是，到这里还没有结束，后面还必须对函数reverse()给予完整的类型声明。


`function reverse(str: string): string;
function reverse(arr: any[]): any[];
function reverse(stringOrArray: string | any[]): string | any[] {
  if (typeof stringOrArray === "string")
    return stringOrArray.split("").reverse().join("");
  else return stringOrArray.slice().reverse();
}`


注意，重载的个别类型描述与函数的具体实现之间，不能有其他代码，否则报错。


另外，虽然函数的具体实现里面，有完整的类型声明。但是，函数实际调用的类型，以前面的类型声明为准。


函数重载的每个类型声明之间，以及类型声明与函数实现的类型之间，不能有冲突。


`// 报错
function fn(x: boolean): void;
function fn(x: string): void;
function fn(x: number | string) {
  console.log(x);
}`


重载声明的排序很重要，因为 TypeScript 是按照顺序进行检查的，一旦发现符合某个类型声明，就不再往下检查了，所以类型最宽的声明应该放在最后面，防止覆盖其他类型声明。


对象的方法也可以使用重载。


`class StringBuilder {
  #data = "";

  add(num: number): this;
  add(bool: boolean): this;
  add(str: string): this;
  add(value: any): this {
    this.#data += String(value);
    return this;
  }

  toString() {
    return this.#data;
  }
}`


函数重载也可以用来精确描述函数参数与返回值之间的对应关系。


由于重载是一种比较复杂的类型声明方法，为了降低复杂性，一般来说，如果可以的话，应该优先使用联合类型替代函数重载。


`// 写法一
function len(s: string): number;
function len(arr: any[]): number;
function len(x: any): number {
  return x.length;
}

// 写法二
function len(x: any[] | string): number {
  return x.length;
}`


## 8.14 构造函数


JavaScript 语言使用构造函数，生成对象的实例。 构造函数的最大特点，就是必须使用new命令调用。


构造函数的类型写法，就是在参数列表前面加上new命令。


`class Animal {
  numLegs: number = 4;
}

type AnimalConstructor = new () => Animal;

function create(c: AnimalConstructor): Animal {
  return new c();
}

const a = create(Animal);`


上面示例中，类型AnimalConstructor就是一个构造函数，而函数create()需要传入一个构造函数。在 JavaScript 中，类（class）本质上是构造函数，所以Animal这个类可以传入create()。


构造函数还有另一种类型写法，就是采用对象形式。


`type F = {
  new (s: string): object;
};`


上面示例中，类型 F 就是一个构造函数。类型写成一个可执行对象的形式，并且在参数列表前面要加上new命令。


某些函数既是构造函数，又可以当作普通函数使用，比如Date()。这时，类型声明可以写成下面这样。


`type F = {
  new (s: string): object;
  (n?: number): number;
};`


# 九、TypeScript 的对象类型


## 9.1 简介


对象类型的最简单声明方法，就是使用大括号表示对象，在大括号内部声明每个属性和方法的类型。


`const obj: {
  x: number;
  y: number;
} = { x: 1, y: 1 };`


属性的类型可以用分号结尾，也可以用逗号结尾。


最后一个属性后面，可以写分号或逗号，也可以不写。


一旦声明了类型，对象赋值时，就不能缺少指定的属性，也不能有多余的属性。


`type MyObj = {
  x: number;
  y: number;
};

const o1: MyObj = { x: 1 }; // 报错
const o2: MyObj = { x: 1, y: 1, z: 1 }; // 报错`


读写不存在的属性也会报错。


同样地，也不能删除类型声明中存在的属性，修改属性值是可以的。


`const myUser = {
  name: "Sabrina",
};

delete myUser.name; // 报错
myUser.name = "Cynthia"; // 正确`


对象的方法使用函数类型描述。


`const obj: {
  x: number;
  y: number;
  add(x: number, y: number): number;
  // 或者写成
  // add: (x:number, y:number) => number;
} = {
  x: 1,
  y: 1,
  add(x, y) {
    return x + y;
  },
};`


对象类型可以使用方括号读取属性的类型。


`type User = {
  name: string;
  age: number;
};
type Name = User["name"]; // string`


除了type命令可以为对象类型声明一个别名，TypeScript 还提供了interface命令，可以把对象类型提炼为一个接口。


`// 写法一
type MyObj = {
  x: number;
  y: number;
};

const obj: MyObj = { x: 1, y: 1 };

// 写法二
interface MyObj {
  x: number;
  y: number;
}

const obj: MyObj = { x: 1, y: 1 };`


注意，TypeScript 不区分对象自身的属性和继承的属性，一律视为对象的属性。


`interface MyInterface {
  toString(): string; // 继承的属性
  prop: number; // 自身的属性
}

const obj: MyInterface = {
  // 正确
  prop: 123,
};`


## 9.2 可选属性


如果某个属性是可选的（即可以忽略），需要在属性名后面加一个问号。


`const obj: {
  x: number;
  y?: number;
} = { x: 1 };`


可选属性等同于允许赋值为undefined，下面两种写法是等效的。


`type User = {
  firstName: string;
  lastName?: string;
};

// 等同于
type User = {
  firstName: string;
  lastName: string | undefined;
};`


同理，读取一个可选属性时，有可能返回undefined。


`type MyObj = {
  x: string;
  y?: string;
};

const obj: MyObj = { x: "hello" };
obj.y.toLowerCase(); // 报错`


所以，读取可选属性之前，必须检查一下是否为undefined。


`const user: {
  firstName: string;
  lastName?: string;
} = { firstName: "Foo" };

if (user.lastName !== undefined) {
  console.log(`hello ${user.firstName} ${user.lastName}`);
}`


建议使用下面的写法。


`// 写法一
let firstName = user.firstName === undefined ? "Foo" : user.firstName;
let lastName = user.lastName === undefined ? "Bar" : user.lastName;

// 写法二
let firstName = user.firstName ?? "Foo";
let lastName = user.lastName ?? "Bar";`


## 9.3 只读属性


属性名前面加上readonly关键字，表示这个属性是只读属性，不能修改。


`interface MyInterface {
  readonly prop: number;
}`


只读属性只能在对象初始化期间赋值，此后就不能修改该属性。


`type Point = {
  readonly x: number;
  readonly y: number;
};

const p: Point = { x: 0, y: 0 };

p.x = 100; // 报错`


注意，如果属性值是一个对象，readonly修饰符并不禁止修改该对象的属性，只是禁止完全替换掉该对象。


`interface Home {
  readonly resident: {
    name: string;
    age: number;
  };
}

const h: Home = {
  resident: {
    name: "Vicky",
    age: 42,
  },
};

h.resident.age = 32; // 正确
h.resident = {
  name: "Kate",
  age: 23,
}; // 报错`


另一个需要注意的地方是，如果一个对象有两个引用，即两个变量对应同一个对象，其中一个变量是可写的，另一个变量是只读的，那么从可写变量修改属性，会影响到只读变量。


`interface Person {
  name: string;
  age: number;
}

interface ReadonlyPerson {
  readonly name: string;
  readonly age: number;
}

let w: Person = {
  name: "Vicky",
  age: 42,
};

let r: ReadonlyPerson = w;

w.age += 1;
r.age; // 43`


如果希望属性值是只读的，除了声明时加上readonly关键字，还有一种方法，就是在赋值时，在对象后面加上只读断言as const。


`const myUser = {
  name: "Sabrina",
} as const;

myUser.name = "Cynthia"; // 报错`


注意，上面的as const属于 TypeScript 的类型推断，如果变量明确地声明了类型，那么 TypeScript 会以声明的类型为准。


## 9.4 属性名的索引类型


如果对象的属性非常多，一个个声明类型就很麻烦，而且有些时候，无法事前知道对象会有多少属性，比如外部 API 返回的对象。这时 TypeScript 允许采用属性名表达式的写法来描述类型，称为“属性名的索引类型”。


索引类型里面，最常见的就是属性名的字符串索引。


`type MyObj = {
  [property: string]: string;
};

const obj: MyObj = {
  foo: "a",
  bar: "b",
  baz: "c",
};`


上面示例中，类型MyObj的属性名类型就采用了表达式形式，写在方括号里面。[property: string]的property表示属性名，这个是可以随便起的，它的类型是string，即属性名类型为string。也就是说，不管这个对象有多少属性，只要属性名为字符串，且属性值也是字符串，就符合这个类型声明。


JavaScript 对象的属性名（即上例的property）的类型有三种可能，除了上例的string，还有number和symbol。


`type T1 = {
  [property: number]: string;
};

type T2 = {
  [property: symbol]: string;
};`


上面示例中，对象属性名的类型分别为number和symbol。


`type MyArr = {
  [n: number]: number;
};

const arr: MyArr = [1, 2, 3];
// 或者
const arr: MyArr = {
  0: 1,
  1: 2,
  2: 3,
};`


对象可以同时有多种类型的属性名索引，比如同时有数值索引和字符串索性。但是，数值索性不能与字符串索引发生冲突，**必须服从后者**，这是因为在 JavaScript 语言内部，所有的数值属性名都会自动转为字符串属性名。


`type MyType = {
  [x: number]: boolean; // 报错
  [x: string]: string;
};`


同样地，可以既声明属性名索引，也声明具体的单个属性名。如果单个属性名符合属性名索引的范围，两者不能有冲突，否则报错。


`type MyType = {
  foo: boolean; // 报错
  [x: string]: string;
};`


属性的索引类型写法，建议谨慎使用，因为属性名的声明太宽泛，约束太少。另外，属性名的数值索引不宜用来声明数组，因为采用这种方式声明数组，就不能使用各种数组方法以及length属性，因为类型里面没有定义这些东西。


`type MyArr = {
  [n: number]: number;
};

const arr: MyArr = [1, 2, 3];
arr.length; // 报错`


## 9.5 解构赋值


解构赋值用于直接从对象中提取属性。


`const { id, name, price } = product;`


解构赋值的类型写法，跟为对象声明类型是一样的。


`const {
  id,
  name,
  price,
}: {
  id: string;
  name: string;
  price: number;
} = product;`


注意，目前没法为解构变量指定类型，因为对象解构里面的冒号，JavaScript 指定了其他用途。


`let { x: foo, y: bar } = obj;

// 等同于
let foo = obj.x;
let bar = obj.y;`


上面示例中，冒号不是表示属性x和y的类型，而是为这两个属性指定新的变量名。如果要为x和y指定类型，不得不写成下面这样。


`let { x: foo, y: bar }: { x: string; y: number } = obj;`


`function draw({ shape: Shape, xPos: number = 100, yPos: number = 100 }) {
  let myShape = shape; // 报错
  let x = xPos; // 报错
}`


上面示例中，函数draw()的参数是一个对象解构，里面的冒号很像是为变量指定类型，其实是为对应的属性指定新的变量名。所以，TypeScript 就会解读成，函数体内不存在变量shape，而是属性shape的值被赋值给了变量Shape。


## 9.6 结构类型原则


只要对象 B 满足 对象 A 的结构特征，TypeScript 就认为对象 B 兼容对象 A 的类型，这称为“结构类型”原则（structual typing）。


`const A = {
  x: number;
};

const B = {
  x: number;
  y: number;
};`


根据“结构类型”原则，TypeScript 检查某个值是否符合指定类型时，并不是检查这个值的类型名（即“名义类型”），而是检查这个值的结构是否符合要求（即“结构类型”）。


TypeScript 之所以这样设计，是为了符合 JavaScript 的行为。JavaScript 并不关心对象是否严格相似，只要某个对象具有所要求的属性，就可以正确运行。 如果类型 B 可以赋值给类型 A，TypeScript 就认为 B 是 A 的子类型（subtyping），A 是 B 的父类型。子类型满足父类型的所有结构特征，同时还具有自己的特征。凡是可以使用父类型的地方，都可以使用子类型，即子类型兼容父类型。


## 9.7 严格字面量检查


如果对象使用字面量表示，会触发 TypeScript 的严格字面量检查（strict object literal checking）。如果字面量的结构跟类型定义的不一样（比如多出了未定义的属性），就会报错。


`const point: {
  x: number;
  y: number;
} = {
  x: 1,
  y: 1,
  z: 1, // 报错
};`


上面示例中，等号右边是一个对象的字面量，这时会触发严格字面量检查。只要有类型声明中不存在的属性（本例是z），就会导致报错。


如果等号右边不是字面量，而是一个变量，根据结构类型原则，是不会报错的。


`const myPoint = {
  x: 1,
  y: 1,
  z: 1,
};

const point: {
  x: number;
  y: number;
} = myPoint; // 正确`


TypeScript 对字面量进行严格检查的目的，主要是防止拼写错误。


规避严格字面量检查，可以使用中间变量。


`let myOptions = {
  title: "我的网页",
  darkmode: true,
};

const Obj: Options = myOptions;`


如果你确认字面量没有错误，也可以使用类型断言规避严格字面量检查。


`const Obj: Options = {
  title: "我的网页",
  darkmode: true,
} as Options;`


如果允许字面量有多余属性，可以像下面这样在类型里面定义一个通用属性。


`let x: {
  foo: number;
  [x: string]: any;
};

x = { foo: 1, baz: 2 }; // Ok`


由于严格字面量检查，字面量对象传入函数必须很小心，不能有多余的属性。


`interface Point {
  x: number;
  y: number;
}

function computeDistance(point: Point) {
  /*...*/
}

computeDistance({ x: 1, y: 2, z: 3 }); // 报错
computeDistance({ x: 1, y: 2 }); // 正确`


编译器选项suppressExcessPropertyErrors，可以关闭多余属性检查。下面是它在 tsconfig.json 文件里面的写法。


`{
  "compilerOptions": {
    "suppressExcessPropertyErrors": true
  }
}`


## 9.8 最小可选属性规则


如果一个对象的所有属性都是可选的，会触发最小可选属性规则。


`type Options = {
  a?: number;
  b?: number;
  c?: number;
};

const obj: Options = {
  d: 123, // 报错
};`


为了避免这种情况，TypeScript 添加了最小可选属性规则，规定这时属于Options类型的对象，必须至少存在一个可选属性，不能所有可选属性都不存在。这就是为什么上例的myObj对象会报错的原因。


这条规则无法通过中间变量规避。


`const myOptions = { d: 123 };

const obj: Options = myOptions; // 报错`


## 9.9 空对象


空对象是 TypeScript 的一种特殊值，也是一种特殊类型。


空对象没有自定义属性，所以对自定义属性赋值就会报错。


空对象只能使用继承的属性，即继承自原型对象Object.prototype的属性。


`obj.toString(); // 正确`


**TypeScript 不允许动态添加属性**，所以对象不能分步生成，必须生成时一次性声明所有属性。


`// 错误
const pt = {};
pt.x = 3;
pt.y = 4;

// 正确
const pt = {
  x: 3,
  y: 4,
};`


如果确实需要分步声明，一个比较好的方法是，使用扩展运算符（...）合成一个新对象。


`const pt0 = {};
const pt1 = { x: 3 };
const pt2 = { y: 4 };

const pt = {
  ...pt0,
  ...pt1,
  ...pt2,
};`


空对象作为类型，其实是Object类型的简写形式。


`let d: {};
// 等同于
// let d:Object;

d = {};
d = { x: 1 };
d = "hello";
d = 2;`


因为Object可以接受各种类型的值，而空对象是Object类型的简写，所以它不会有严格字面量检查，赋值时总是允许多余的属性，只是不能读取这些属性。


`interface Empty {}
const b: Empty = { myProp: 1, anotherProp: 2 }; // 正确
b.myProp; // 报错`


如果想强制使用没有任何属性的对象，可以采用下面的写法。


```javascript
interface WithoutProperties {
  [key: string]: never;
}

// 报错
const a: WithoutProperties = { prop: 1 };
```


# 十、 TypeScript 的 interface 接口


## 10.1 简介


interface 是对象的模板，可以看作是一种类型约定，中文译为“接口”。使用了某个模板的对象，就拥有了指定的类型结构。


`interface Person {
  firstName: string;
  lastName: string;
  age: number;
}`


上面示例中，定义了一个接口Person，它指定一个对象模板，拥有三个属性firstName、lastName和age。任何实现这个接口的对象，都必须部署这三个属性，并且必须符合规定的类型。


实现该接口很简单，只要指定它作为对象的类型即可。


`const p: Person = {
  firstName: "John",
  lastName: "Smith",
  age: 25,
};`


方括号运算符可以取出 interface 某个属性的类型。


`interface Foo {
  a: string;
}

type A = Foo["a"]; // string`


interface 可以表示对象的各种语法，它的成员有5种形式。

- 对象属性
- 对象的属性索引
- 对象方法
- 函数
- 构造函数

（1）对象属性


`interface Point {
  x: number;
  y?: number;
  readonly a: string;
}`


属性之间使用分号或逗号分隔，最后一个属性结尾的分号或逗号可以省略。


如果属性是可选的，就在属性名后面加一个问号。


如果属性是只读的，需要加上readonly修饰符。


（2）对象的属性索引


`interface A {
  [prop: string]: number;
}`


属性索引共有string、number和symbol三种类型。


一个接口中，最多只能定义一个字符串索引。字符串索引会约束该类型中所有名字为字符串的属性。


`interface MyObj {
  [prop: string]: number;

  a: boolean; // 编译错误
}`


上面示例中，属性索引指定所有名称为字符串的属性，它们的属性值必须是数值（number）。属性a的值为布尔值就报错了。


属性的数值索引，其实是指定数组的类型。


`interface A {
  [prop: number]: string;
}

const obj: A = ["a", "b", "c"];`


同样的，一个接口中最多只能定义一个数值索引。数值索引会约束所有名称为数值的属性。


如果一个 interface 同时定义了字符串索引和数值索引，那么数值索引必须服从于字符串索引。因为在 JavaScript 中，数值属性名最终是自动转换成字符串属性名。


`interface A {
  [prop: string]: number;
  [prop: number]: string; // 报错
}

interface B {
  [prop: string]: number;
  [prop: number]: number; // 正确
}`


数值索引必须兼容字符串索引的类型声明。


（3）对象的方法


对象的方法共有三种写法。


`// 写法一
interface A {
  f(x: boolean): string;
}

// 写法二
interface B {
  f: (x: boolean) => string;
}

// 写法三
interface C {
  f: { (x: boolean): string };
}`


属性名可以采用表达式，所以下面的写法也是可以的。


`const f = "f";

interface A {
  [f](x: boolean): string;
}`


类型方法可以重载。


`interface A {
  f(): number;
  f(x: boolean): boolean;
  f(x: string, y: string): string;
}`


interface 里面的函数重载，不需要给出实现。但是，由于对象内部定义方法时，无法使用函数重载的语法，所以需要额外在对象外部给出函数方法的实现。


`interface A {
  f(): number;
  f(x: boolean): boolean;
  f(x: string, y: string): string;
}

function MyFunc(): number;
function MyFunc(x: boolean): boolean;
function MyFunc(x: string, y: string): string;
function MyFunc(x?: boolean | string, y?: string): number | boolean | string {
  if (x === undefined && y === undefined) return 1;
  if (typeof x === "boolean" && y === undefined) return true;
  if (typeof x === "string" && typeof y === "string") return "hello";
  throw new Error("wrong parameters");
}

const a: A = {
  f: MyFunc,
};`


上面示例中，接口A的方法f()有函数重载，需要额外定义一个函数MyFunc()实现这个重载，然后部署接口A的对象a的属性f等于函数MyFunc()就可以了。


（4）函数 interface 也可以用来声明独立的函数。


`interface Add {
  (x: number, y: number): number;
}

const myAdd: Add = (x, y) => x + y;`


（5）构造函数 interface 内部可以使用new关键字，表示构造函数。


`interface ErrorConstructor {
  new (message?: string): Error;
}`


## 10.2 interface 的继承


### 10.2.1 interface 继承 interface


interface 可以使用extends关键字，继承其他 interface。


`interface Shape {
  name: string;
}

interface Circle extends Shape {
  radius: number;
}`


extends关键字会从继承的接口里面拷贝属性类型，这样就不必书写重复的属性。


interface 允许多重继承。


`interface Style {
  color: string;
}

interface Shape {
  name: string;
}

interface Circle extends Style, Shape {
  radius: number;
}s`


多重接口继承，实际上相当于多个父接口的合并。


如果子接口与父接口存在同名属性，那么子接口的属性会覆盖父接口的属性。**注意**，子接口与父接口的同名属性必须是类型兼容的，不能有冲突，否则会报错。


`interface Foo {
  id: string;
}

interface Bar extends Foo {
  id: number; // 报错
}`


多重继承时，如果多个父接口存在同名属性，那么这些同名属性不能有类型冲突，否则会报错。


`interface Foo {
  id: string;
}

interface Bar {
  id: number;
}

// 报错
interface Baz extends Foo, Bar {
  type: string;
}`


### 10.2.2 interface 继承 type


interface 可以继承type命令定义的对象类型。


`type Country = {
  name: string;
  capital: string;
};

interface CountryWithPop extends Country {
  population: number;
}`


**注意，**如果type命令定义的类型不是对象，interface 就无法继承。


### 10.2.3 interface 继承 class


inteface 还可以继承 class，即继承该类的所有成员。


`class A {
  x: string = "";

  y(): boolean {
    return true;
  }
}

interface B extends A {
  z: number;
}`


某些类拥有私有成员和保护成员，interface 可以继承这样的类，但是意义不大。


## 10.3 接口合并


多个同名接口会合并成一个接口。


`interface Box {
  height: number;
  width: number;
}

interface Box {
  length: number;
}`


这样的设计主要是为了兼容 JavaScript 的行为。JavaScript 开发者常常对全局对象或者外部库，添加自己的属性和方法。那么，只要使用 interface 给出这些自定义属性和方法的类型，就能自动跟原始的 interface 合并，使得扩展外部类型非常方便。


同名接口合并时，同一个属性如果有多个类型声明，彼此不能有类型冲突。


`interface A {
  a: number;
}

interface A {
  a: string; // 报错
}`


同名接口合并时，如果同名方法有不同的类型声明，那么会发生**函数重载**。而且，**后面的定义比前面的定义具有更高的优先级**。


`interface Cloner {
  clone(animal: Animal): Animal;
}

interface Cloner {
  clone(animal: Sheep): Sheep;
}

interface Cloner {
  clone(animal: Dog): Dog;
  clone(animal: Cat): Cat;
}

// 等同于
interface Cloner {
  clone(animal: Dog): Dog;
  clone(animal: Cat): Cat;
  clone(animal: Sheep): Sheep;
  clone(animal: Animal): Animal;
}`


这个规则有一个**例外**。同名方法之中，如果有一个参数是字面量类型，字面量类型有更高的优先级。


`interface A {
  f(x: "foo"): boolean;
}

interface A {
  f(x: any): void;
}

// 等同于
interface A {
  f(x: "foo"): boolean;
  f(x: any): void;
}`


一个实际的例子是 Document 对象的createElement()方法，它会根据参数的不同，而生成不同的 HTML 节点对象。


`interface Document {
  createElement(tagName: any): Element;
}
interface Document {
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: "span"): HTMLSpanElement;
}
interface Document {
  createElement(tagName: string): HTMLElement;
  createElement(tagName: "canvas"): HTMLCanvasElement;
}

// 等同于
interface Document {
  createElement(tagName: "canvas"): HTMLCanvasElement;
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: "span"): HTMLSpanElement;
  createElement(tagName: string): HTMLElement;
  createElement(tagName: any): Element;
}`


如果两个 interface 组成的联合类型存在同名属性，那么该属性的类型也是联合类型。


`interface Circle {
  area: bigint;
}

interface Rectangle {
  area: number;
}

declare const s: Circle | Rectangle;

s.area; // bigint | number`


## 10.4 interface 与 type 的异同


interface命令与type命令作用类似，都可以表示对象类型。


很多对象类型即可以用 interface 表示，也可以用 type 表示。而且，两者往往可以换用，几乎所有的 interface 命令都可以改写为 type 命令。


它们的**相似之处**，首先表现在都能为对象类型起名。


`type Country = {
  name: string;
  capital: string;
};

interface Coutry {
  name: string;
  capital: string;
}`


class命令也有类似作用，通过定义一个类，同时定义一个对象类型。但是，它会创造一个值，编译后依然存在。如果只是单纯想要一个类型，应该使用type或interface。


interface 与 type 的**区别**有下面几点。


（1）type能够表示非对象类型，而interface只能表示对象类型（包括数组、函数等）。


（2）interface可以继承其他类型，type不支持继承。 继承的主要作用是添加属性，type定义的对象类型如果想要添加属性，只能使用&运算符，重新定义一个类型。


`type Animal = {
  name: string;
};

type Bear = Animal & {
  honey: boolean;
};`


上面示例中，类型Bear在Animal的基础上添加了一个属性honey。


上例的&运算符，表示同时具备两个类型的特征，因此可以起到两个对象类型合并的作用。


作为比较，interface添加属性，采用的是继承的写法。


`interface Animal {
  name: string;
}

interface Bear extends Animal {
  honey: boolean;
}`


继承时，type 和 interface 是可以换用的。**interface 可以继承 type。**


`type Foo = { x: number };

interface Bar extends Foo {
  y: number;
}`


type 也可以继承 interface。


`interface Foo {
  x: number;
}

type Bar = Foo & { y: number };`


（3）同名interface会自动合并，同名type则会报错。也就是说，TypeScript 不允许使用type多次定义同一个类型。


`type A = { foo: number }; // 报错
type A = { bar: number }; // 报错`


作为比较，interface则会自动合并。


`interface A {
  foo: number;
}
interface A {
  bar: number;
}

const obj: A = {
  foo: 1,
  bar: 1,
};`


这表明，**inteface 是开放的，可以添加属性，type 是封闭的，不能添加属性**，只能定义新的 type。


（4）interface不能包含属性映射（mapping），type可以。


`interface Point {
  x: number;
  y: number;
}

// 正确
type PointCopy1 = {
  [Key in keyof Point]: Point[Key];
};

// 报错
interface PointCopy2 {
  [Key in keyof Point]: Point[Key];
};`


（5）this关键字只能用于interface。


`// 正确
interface Foo {
  add(num: number): this;
}

// 报错
type Foo = {
  add(num: number): this;
};`


（6）type 可以扩展原始数据类型，interface 不行。


`// 正确
type MyStr = string & {
  type: "new";
};

// 报错
interface MyStr extends string {
  type: "new";
}`


（7）interface无法表达某些复杂类型（比如交叉类型和联合类型），但是type可以。


`type A = {
  /* ... */
};
type B = {
  /* ... */
};

type AorB = A | B;
type AorBwithName = AorB & {
  name: string;
};`


**综上所述，如果有复杂的类型运算，那么没有其他选择只能使用type；一般情况下，interface灵活性比较高，便于扩充类型或自动合并，建议优先使用。**


# 十一、TypeScript 的 class 类型


## 11.1 简介


类（class）是面向对象编程的基本构件，封装了属性和方法，TypeScript 给予了全面支持。


### 11.1.1 属性的类型


类的属性可以在顶层声明，也可以在构造方法内部声明。 对于顶层声明的属性，可以在声明时同时给出类型。


`class Point {
  x: number;
  y: number;
}`


如果不给出类型，TypeScript 会认为x和y的类型都是any。


`class Point {
  x;
  y;
}`


如果声明时给出初值，可以不写类型，TypeScript 会自行推断属性的类型。


`class Point {
  x = 0;
  y = 0;
}`


TypeScript 有一个配置项strictPropertyInitialization，只要打开，就会检查属性是否设置了初值，如果没有就报错。


如果你打开了这个设置，但是某些情况下，不是在声明时赋值或在构造方法里面赋值，为了防止这个设置报错，可以使用非空断言。


`class Point {
  x!: number;
  y!: number;
}`


上面示例中，属性x和y没有初值，但是属性名后面添加了感叹号，表示这两个属性肯定不会为空，所以 TypeScript 就不报错了。


### 11.1.2 readonly 修饰符


属性名前面加上 readonly 修饰符，就表示该属性是只读的。实例对象不能修改这个属性。


`class A {
  readonly id = "foo";
}

const a = new A();
a.id = "bar"; // 报错`


readonly 属性的初始值，可以写在顶层属性，也可以写在构造方法里面。


`class A {
  readonly id: string;

  constructor() {
    this.id = "bar"; // 正确
  }
}`


`class A {
  readonly id: string = "foo";

  constructor() {
    this.id = "bar"; // 正确
  }
}`


上面示例中，构造方法修改只读属性的值也是可以的。或者说，如果两个地方都设置了只读属性的值，以构造方法为准。在其他方法修改只读属性都会报错。


### 11.1.3 方法的类型


类的方法就是普通函数，类型声明方式与函数一致。


`class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(point: Point) {
    return new Point(this.x + point.x, this.y + point.y);
  }
}`


上面示例中，构造方法constructor()和普通方法add()都注明了参数类型，但是省略了返回值类型，因为 TypeScript 可以自己推断出来。


类的方法跟普通函数一样，可以使用参数默认值，以及函数重载。 下面是参数默认值的例子。


`class Point {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}`


上面示例中，如果新建实例时，不提供属性x和y的值，它们都等于默认值0。


下面是函数重载的例子。


`class Point {
  constructor(x: number, y: string);
  constructor(s: string);
  constructor(xs: number | string, y?: string) {
    // ...
  }
}`


另外，构造方法不能声明返回值类型，否则报错，因为它总是返回实例对象。


`class B {
  constructor(): object {
    // 报错
    // ...
  }
}`


### 11.1.4 存取器方法


存取器（accessor）是特殊的类方法，包括取值器（getter）和存值器（setter）两种方法。


它们用于读写某个属性，取值器用来读取属性，存值器用来写入属性。


`class C {
  _name = "";
  get name() {
    return this._name;
  }
  set name(value) {
    this._name = value;
  }
}`


get name()是取值器，其中get是关键词，name是属性名。外部读取name属性时，实例对象会自动调用这个方法，该方法的返回值就是name属性的值。


set name()是存值器，其中set是关键词，name是属性名。外部写入name属性时，实例对象会自动调用这个方法，并将所赋的值作为函数参数传入。


TypeScript 对存取器有以下规则。


（1）如果某个属性只有get方法，没有set方法，那么该属性自动成为只读属性。


`class C {
  _name = "foo";

  get name() {
    return this._name;
  }
}

const c = new C();
c.name = "bar"; // 报错`


（2）set方法的参数类型，必须兼容get方法的返回值类型，否则报错。


`class C {
  _name = "";
  get name(): string {
    return this._name;
  }
  set name(value: number) {
    this._name = value; // 报错
  }
}`


上面示例中，get方法的返回值类型是字符串，与set方法参数类型不兼容，导致报错。


`class C {
  _name = "";
  get name(): string {
    return this._name;
  }
  set name(value: number | string) {
    this._name = String(value); // 正确
  }
}`


上面示例中，set方法的参数类型（number|return）兼容get方法的返回值类型（string），这是允许的。


但是，最终赋值的时候，还是必须保证与get方法的返回值类型一致。


另外，如果set方法的参数没有指定类型，那么会推断为与get方法返回值类型一致。


（3）get方法与set方法的可访问性必须一致，要么都为公开方法，要么都为私有方法。


### 11.1.5 属性索引


类允许定义属性索引。


`class MyClass {
  [s: string]: boolean | ((s: string) => boolean);

  get(s: string) {
    return this[s] as boolean;
  }
}`


上面示例中，s:string表示所有属性名类型为字符串的属性，它们的属性值要么是布尔值，要么是返回布尔值的函数。


注意，由于类的方法是一种特殊属性（属性值为函数的属性），所以属性索引的类型定义也涵盖了方法。如果一个对象同时定义了属性索引和方法，那么前者必须包含后者的类型。


`class MyClass {
  [s: string]: boolean;
  f() {
    // 报错
    return true;
  }
}`


上面示例中，属性索引的类型里面不包括方法，导致后面的方法f()定义直接报错。正确的写法是下面这样。


`class MyClass {
  [s: string]: boolean | (() => boolean);
  f() {
    return true;
  }
}`


属性存取器等同于方法，也必须包括在属性索性里面。


`class MyClass {
  [s: string]: boolean;

  get(s: string) {
    // 报错
    return this[s] as boolean;
  }
}`


## 11.2 类的 interface 接口


### 11.2.1 implements 关键字


interface 接口或 type 别名，可以用对象的形式，为 class 指定一组检查条件。然后，类使用 implements 关键字，表示当前类满足这些外部类型条件的限制。


`interface Country {
  name: string;
  capital: string;
}
// 或者
type Country = {
  name: string;
  capital: string;
};

class MyCountry implements Country {
  name = "";
  capital = "";
}`


上面示例中，interface或type都可以定义一个对象类型。类MyCountry使用implements关键字，表示该类的实例对象满足这个外部类型。


interface 只是指定检查条件，如果不满足这些条件就会报错。它并不能代替 class自身的类型声明。


`interface A {
  get(name: string): boolean;
}

class B implements A {
  get(s) {
    // s 的类型是 any
    return true;
  }
}`


类B实现了接口A，但是后者并不能代替B的类型声明。因此，B的get()方法的参数s的类型是any，而不是string。B类依然需要声明参数s的类型。


`class B implements A {
  get(s: string) {
    return true;
  }
}`


下面是另一个例子。


`interface A {
  x: number;
  y?: number;
}

class B implements A {
  x = 0;
}

const b = new B();
b.y = 10; // 报错`


上面示例中，接口A有一个可选属性y，类B没有声明这个属性，所以可以通过类型检查。但是，如果给B的实例对象的属性y赋值，就会报错。所以，B类还是需要声明可选属性y。


`class B implements A {
  x = 0;
  y?: number;
}`


同理，类可以定义接口没有声明的方法和属性。


`interface Point {
  x: number;
  y: number;
}

class MyPoint implements Point {
  x = 1;
  y = 1;
  z: number = 1;
}`


implements关键字后面，不仅可以是接口，也可以是另一个类。这时，后面的类将被当作接口。


`class Car {
  id: number = 1;
  move(): void {}
}

class MyCar implements Car {
  id = 2; // 不可省略
  move(): void {} // 不可省略
}`


上面示例中，implements后面是类Car，这时 TypeScript 就把Car视为一个接口，要求MyCar实现Car里面的每一个属性和方法，否则就会报错。所以，这时不能因为Car类已经实现过一次，而在MyCar类省略属性或方法。


注意，interface 描述的是类的对外接口，也就是实例的公开属性和公开方法，不能定义私有的属性和方法。这是因为 TypeScript 设计者认为，私有属性是类的内部实现，接口作为模板，不应该涉及类的内部代码写法。


### 11.2.2 实现多个接口


类可以实现多个接口（其实是接受多重限制），每个接口之间使用逗号分隔。


`class Car implements MotorVehicle, Flyable, Swimmable {
  // ...
}`


它必须部署这三个接口声明的所有属性和方法，满足它们的所有条件。


但是，同时实现多个接口并不是一个好的写法，容易使得代码难以管理，可以使用两种方法替代。


第一种方法是类的继承。


`class Car implements MotorVehicle {}

class SecretCar extends Car implements Flyable, Swimmable {}`


第二种方法是接口的继承。


`interface A {
  a: number;
}

interface B extends A {
  b: number;
}`


`interface MotorVehicle {
  // ...
}
interface Flyable {
  // ...
}
interface Swimmable {
  // ...
}

interface SuperCar extends MotoVehicle, Flyable, Swimmable {
  // ...
}

class SecretCar implements SuperCar {
  // ...
}`


注意，发生多重实现时（即一个接口同时实现多个接口），不同接口不能有互相冲突的属性。


`interface Flyable {
  foo: number;
}

interface Swimmable {
  foo: string;
}`


### 11.2.3 类与接口的合并


TypeScript 不允许两个同名的类，但是如果一个类和一个接口同名，那么接口会被合并进类。


`class A {
  x: number = 1;
}

interface A {
  y: number;
}

let a = new A();
a.y = 10;

a.x; // 1
a.y; // 10`


## 11.3 Class 类型


### 11.3.1 实例类型


TypeScript 的类本身就是一种类型，但是它代表该类的实例类型，而不是 class 的自身类型。


`class Color {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

const green: Color = new Color("green");`


上面示例中，定义了一个类Color。它的类名就代表一种类型，实例对象green就属于该类型。


对于引用实例对象的变量来说，既可以声明类型为 Class，也可以声明类型为Interface，因为两者都代表实例对象的类型。


`interface MotorVehicle {}

class Car implements MotorVehicle {}

// 写法一
const c1: Car = new Car();
// 写法二
const c2: MotorVehicle = new Car();`


上面示例中，变量c的类型可以写成类Car，也可以写成接口MotorVehicle。它们的区别是，如果类Car有接口MotoVehicle没有的属性和方法，那么只有变量c1可以调用这些属性和方法。


作为类型使用时，类名只能表示实例的类型，不能表示类的自身类型。


`class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 错误
function createPoint(PointClass: Point, x: number, y: number) {
  return new PointClass(x, y);
}`


上面示例中，函数createPoint()的第一个参数PointClass，需要传入 Point 这个类，但是如果把参数的类型写成Point就会报错，因为Point描述的是实例类型，而不是 Class 的自身类型。


由于类名作为类型使用，实际上代表一个对象，因此可以把类看作为对象类型起名。事实上，TypeScript 有三种方法可以为对象类型起名：type、interface 和 class。


### 11.3.2 类的自身类型


要获得一个类的自身类型，一个简便的方法就是使用 typeof 运算符。


`function createPoint(PointClass: typeof Point, x: number, y: number): Point {
  return new PointClass(x, y);
}`


上面示例中，createPoint()的第一个参数PointClass是Point类自身，要声明这个参数的类型，简便的方法就是使用typeof Point。因为Point类是一个值，typeof Point返回这个值的类型。注意，createPoint()的返回值类型是Point，代表实例类型。


JavaScript 语言中，类只是构造函数的一种语法糖，本质上是构造函数的另一种写法。所以，类的自身类型可以写成构造函数的形式。


`function createPoint(
  PointClass: new (x: number, y: number) => Point,
  x: number,
  y: number
): Point {
  return new PointClass(x, y);
}`


构造函数也可以写成对象形式，所以参数PointClass的类型还有另一种写法。


`function createPoint(
  PointClass: {
    new (x: number, y: number): Point;
  },
  x: number,
  y: number
): Point {
  return new PointClass(x, y);
}`


根据上面的写法，可以把构造函数提取出来，单独定义一个接口（interface），这样可以大大提高代码的通用性。


interface PointConstructor { new(x:number, y:number):Point; } function createPoint( PointClass: PointConstructor, x: number, y: number ):Point { return new PointClass(x, y); }


**总结一下，类的自身类型就是一个构造函数，可以单独定义一个接口来表示。**


### 11.3.3 结构类型原则


Class 也遵循“结构类型原则”。一个对象只要满足 Class 的实例结构，就跟该 Class属于同一个类型。


`class Foo {
  id!: number;
}

function fn(arg: Foo) {
  // ...
}

const bar = {
  id: 10,
  amount: 100,
};

fn(bar); // 正确`


如果两个类的实例结构相同，那么这两个类就是兼容的，可以用在对方的使用场合。


`class Person {
  name: string;
}

class Customer {
  name: string;
}

// 正确
const cust: Customer = new Person();`


上面示例中，Person和Customer是两个结构相同的类，TypeScript 将它们视为相同类型，因此Person可以用在类型为Customer的场合。


现在修改一下代码，Person类添加一个属性。


`class Person {
  name: string;
  age: number;
}

class Customer {
  name: string;
}

// 正确
const cust: Customer = new Person();`


上面示例中，Person类添加了一个属性age，跟Customer类的结构不再相同。但是这种情况下，TypeScript 依然认为，Person属于Customer类型。


这是因为根据“结构类型原则”，只要Person类具有name属性，就满足Customer类型的实例结构，所以可以代替它。反过来就不行，如果Customer类多出一个属性，就会报错。


`class Person {
  name: string;
}

class Customer {
  name: string;
  age: number;
}

// 报错
const cust: Customer = new Person();`


总之，只要 A 类具有 B 类的结构，哪怕还有额外的属性和方法，TypeScript 也认为A 兼容 B 的类型。


不仅是类，如果某个对象跟某个 class 的实例结构相同，TypeScript 也认为两者的类型相同。


`class Person {
  name: string;
}

const obj = { name: "John" };
const p: Person = obj; // 正确`


由于这种情况，运算符instanceof不适用于判断某个对象是否跟某个 class 属于同一类型。


`obj instanceof Person; // false`


上面示例中，运算符instanceof确认变量obj不是 Person 的实例，但是两者的类型是相同的。


空类不包含任何成员，任何其他类都可以看作与空类结构相同。因此，凡是类型为空类的地方，所有类（包括对象）都可以使用。


`class Empty {}

function fn(x: Empty) {
  // ...
}

fn({});
fn(window);
fn(fn);`


注意，确定两个类的兼容关系时，只检查实例成员，不考虑静态成员和构造方法。


`class Point {
  x: number;
  y: number;
  static t: number;
  constructor(x: number) {}
}

class Position {
  x: number;
  y: number;
  z: number;
  constructor(x: string) {}
}

const point: Point = new Position("");s`


上面示例中，Point与Position的静态属性和构造方法都不一样，但因为Point的实例成员与Position相同，所以Position兼容Point。 如果类中存在私有成员（private）或保护成员（protected），那么确定兼容关系时，TypeScript 要求私有成员和保护成员来自同一个类，这意味着两个类需要存在继承关系。


`// 情况一
class A {
  private name = "a";
}

class B extends A {}

const a: A = new B();

// 情况二
class A {
  protected name = "a";
}

class B extends A {
  protected name = "b";
}

const a: A = new B();`


上面示例中，A和B都有私有成员（或保护成员）name，这时只有在B继承A的情况下（class B extends A），B才兼容A。


## 11.4 类的继承


类（这里又称“子类”）可以使用 extends 关键字继承另一个类（这里又称“基类”）的所有属性和方法。


`class A {
  greet() {
    console.log("Hello, world!");
  }
}

class B extends A {}

const b = new B();
b.greet(); // "Hello, world!"`


根据结构类型原则，子类也可以用于类型为基类的场合。


`const a: A = b;
a.greet();`


子类可以覆盖基类的同名方法。


`class B extends A {
  greet(name?: string) {
    if (name === undefined) {
      super.greet();
    } else {
      console.log(`Hello, ${name}`);
    }
  }
}`


上面示例中，子类B定义了一个方法greet()，覆盖了基类A的同名方法。其中，参数name省略时，就调用基类A的greet()方法，这里可以写成super.greet()，使用super关键字指代基类是常见做法。


但是，子类的同名方法不能与基类的类型定义相冲突。


`class A {
  greet() {
    console.log("Hello, world!");
  }
}

class B extends A {
  // 报错
  greet(name: string) {
    console.log(`Hello, ${name}`);
  }
}`


如果基类包括保护成员（protected修饰符），子类可以将该成员的可访问性设置为公开（public修饰符），也可以保持保护成员不变，但是不能改用私有成员（private修饰符）。


`class A {
  protected x: string = "";
  protected y: string = "";
  protected z: string = "";
}

class B extends A {
  // 正确
  public x: string = "";

  // 正确
  protected y: string = "";

  // 报错
  private z: string = "";
}`


注意，extends关键字后面不一定是类名，可以是一个表达式，只要它的类型是构造函数就可以了。


`// 例一
class MyArray extends Array<number> {}

// 例二
class MyError extends Error {}

// 例三
class A {
  greeting() {
    return "Hello from A";
  }
}
class B {
  greeting() {
    return "Hello from B";
  }
}

interface Greeter {
  greeting(): string;
}

interface GreeterConstructor {
  new (): Greeter;
}

function getGreeterBase(): GreeterConstructor {
  return Math.random() >= 0.5 ? A : B;
}

class Test extends getGreeterBase() {
  sayHello() {
    console.log(this.greeting());
  }
}`


对于那些只设置了类型、没有初值的顶层属性，有一个细节需要注意。


`interface Animal {
  animalStuff: any;
}

interface Dog extends Animal {
  dogStuff: any;
}

class AnimalHouse {
  resident: Animal;

  constructor(animal: Animal) {
    this.resident = animal;
  }
}

class DogHouse extends AnimalHouse {
  resident: Dog;

  constructor(dog: Dog) {
    super(dog);
  }
}`


上面示例中，类DogHouse的顶层成员resident只设置了类型（Dog），没有设置初值。这段代码在不同的编译设置下，编译结果不一样。


如果编译设置的target设成大于等于ES2022，或者useDefineForClassFields设成true，那么下面代码的执行结果是不一样的。


`const dog = {
  animalStuff: "animal",
  dogStuff: "dog",
};

const dogHouse = new DogHouse(dog);

console.log(dogHouse.resident); // undefined`


上面示例中，DogHouse实例的属性resident输出的是undefined，而不是预料的dog。原因在于 ES2022 标准的 Class Fields 部分，与早期的 TypeScript 实现不一致，导致子类的那些只设置类型、没有设置初值的顶层成员在基类中被赋值后，会在子类被重置为undefined。


解决方法就是使用declare命令，去声明顶层成员的类型，告诉 TypeScript 这些成员的赋值由基类实现。


`class DogHouse extends AnimalHouse {
  declare resident: Dog;

  constructor(dog: Dog) {
    super(dog);
  }
}`


上面示例中，resident属性的类型声明前面用了declare命令，这样就能确保在编译目标大于等于ES2022时（或者打开useDefineForClassFields时），代码行为正确。


## 11.5 可访问性修饰符


类的内部成员的外部可访问性，由三个可访问性修饰符（access modifiers）控制：public、private和protected。


这三个修饰符的位置，都写在属性或方法的最前面。


### 11.5.1 public


public修饰符表示这是公开成员，外部可以自由访问。


`class Greeter {
  public greet() {
    console.log("hi!");
  }
}

const g = new Greeter();
g.greet();`


public修饰符是默认修饰符，如果省略不写，实际上就带有该修饰符。因此，类的属性和方法默认都是外部可访问的。


正常情况下，除非为了醒目和代码可读性，**public都是省略不写的。**


### 11.5.2 private


private修饰符表示私有成员，只能用在当前类的内部，类的实例和子类都不能使用该成员。


`class A {
  private x: number = 0;
}

const a = new A();
a.x; // 报错

class B extends A {
  showX() {
    console.log(this.x); // 报错
  }
}`


注意，子类不能定义父类私有成员的同名成员。


`class A {
  private x = 0;
}

class B extends A {
  x = 1; // 报错
}`


如果在类的内部，当前类的实例可以获取私有成员。


`class A {
  private x = 10;

  f(obj: A) {
    console.log(obj.x);
  }
}

const a = new A();
a.f(a); // 10`


严格地说，private定义的私有成员，并不是真正意义的私有成员。一方面，编译成 JavaScript 后，private关键字就被剥离了，这时外部访问该成员就不会报错。另一方面，由于前一个原因，TypeScript 对于访问private成员没有严格禁止，使用方括号写法（[]）或者in运算符，实例对象就能访问该成员。


`class A {
  private x = 1;
}

const a = new A();
a["x"]; // 1

if ("x" in a) {
  // 正确
  // ...
}`


由于private存在这些问题，加上它是 ES6 标准发布前出台的，而 ES6 引入了自己的私有成员写法#propName。因此建议不使用private，改用 ES6 的写法，获得真正意义的私有成员。


`class A {
  #x = 1;
}

const a = new A();
a["x"]; // 报错`


上面示例中，采用了 ES6 的私有成员写法（属性名前加#），TypeScript 就正确识别了实例对象没有属性x，从而报错。 构造方法也可以是私有的，这就直接防止了使用new命令生成实例对象，只能在类的内部创建实例对象。


这时一般会有一个静态方法，充当工厂函数，强制所有实例都通过该方法生成。


`class Singleton {
  private static instance?: Singleton;

  private constructor() {}

  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}

const s = Singleton.getInstance();`


### 11.5.3 protected


protected修饰符表示该成员是保护成员，只能在类的内部使用该成员，实例无法使用该成员，但是子类内部可以使用。


`class A {
  protected x = 1;
}

class B extends A {
  getX() {
    return this.x;
  }
}

const a = new A();
const b = new B();

a.x; // 报错
b.getX(); // 1`


子类不仅可以拿到父类的保护成员，还可以定义同名成员。


`class A {
  protected x = 1;
}

class B extends A {
  x = 2;
}`


上面示例中，子类B定义了父类A的同名成员x，并且父类的x是保护成员，子类将其改成了公开成员。B类的x属性前面没有修饰符，等同于修饰符是public，外界可以读取这个属性。


在类的外部，实例对象不能读取保护成员，但是在类的内部可以。


`class A {
  protected x = 1;

  f(obj: A) {
    console.log(obj.x);
  }
}

const a = new A();

a.x; // 报错
a.f(a); // 1`


### 11.5.4 实例属性的简写形式


实际开发中，很多实例属性的值，是通过构造方法传入的。


`class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}`


这样的写法等于对同一个属性要声明两次类型，一次在类的头部，另一次在构造方法的参数里面。这有些累赘，TypeScript 就提供了一种简写形式。


`class Point {
  constructor(public x: number, public y: number) {}
}

const p = new Point(10, 10);
p.x; // 10
p.y; // 10`


上面示例中，构造方法的参数x前面有public修饰符，这时 TypeScript 就会自动声明一个公开属性x，不必在构造方法里面写任何代码，同时还会设置x的值为构造方法的参数值。**注意，这里的public不能省略**。


除了public修饰符，构造方法的参数名只要有private、protected、readonly修饰符，都会自动声明对应修饰符的实例属性。


`class A {
  constructor(
    public a: number,
    protected b: number,
    private c: number,
    readonly d: number
  ) {}
}

// 编译结果
class A {
  a;
  b;
  c;
  d;
  constructor(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
}`


readonly还可以与其他三个可访问性修饰符，一起使用。


`class A {
  constructor(
    public readonly x: number,
    protected readonly y: number,
    private readonly z: number
  ) {}
}`


## 11.6 静态成员


类的内部可以使用staic关键字，定义静态成员。 静态成员是只能通过类本身使用的成员，不能通过实例对象使用。


`class MyClass {
  static x = 0;
  static printX() {
    console.log(MyClass.x);
  }
}

MyClass.x; // 0
MyClass.printX(); // 0`


上面示例中，x是静态属性，printX()是静态方法。它们都必须通过MyClass获取，而不能通过实例对象调用。


static关键字前面可以使用 public、private、protected 修饰符。


`class MyClass {
  private static x = 0;
}

MyClass.x; // 报错`


上面示例中，静态属性x前面有private修饰符，表示只能在MyClass内部使用，如果在外部调用这个属性就会报错。


静态私有属性也可以用 ES6 语法的#前缀表示，上面示例可以改写如下。


`class MyClass {
  static #x = 0;
}`


public和protected的静态成员可以被继承。


`class A {
  public static x = 1;
  protected static y = 1;
}

class B extends A {
  static getY() {
    return B.y;
  }
}

B.x; // 1
B.getY(); // 1`


## 11.7 泛型类


类也可以写成泛型，使用类型参数。


`class Box<Type> {
  contents: Type;

  constructor(value: Type) {
    this.contents = value;
  }
}

const b: Box<string> = new Box("hello!");`


上面示例中，类Box有类型参数Type，因此属于泛型类。新建实例时，变量的类型声明需要带有类型参数的值，不过本例等号左边的Box<**string**>可以省略不写，因为可以从等号右边推断得到。


注意，静态成员不能使用泛型的类型参数。


`class Box<Type> {
  static defaultContents: Type; // 报错
}`


上面示例中，静态属性defaultContents的类型写成类型参数Type会报错。因为这意味着调用时必须给出类型参数（即写成Box<**string**>.defaultContents），并且类型参数发生变化，这个属性也会跟着变，这并不是好的做法。


## 11.8 抽象类，抽象成员


TypeScript 允许在类的定义前面，加上关键字abstract，表示该类不能被实例化，只能当作其他类的模板。这种类就叫做“抽象类”（abastract class）。


`abstract class A {
  id = 1;
}

const a = new A(); // 报错`


抽象类只能当作基类使用，用来在它的基础上定义子类。


`abstract class A {
  id = 1;
}

class B extends A {
  amount = 100;
}

const b = new B();

b.id; // 1
b.amount; // 100`


抽象类的子类也可以是抽象类，也就是说，抽象类可以继承其他抽象类。


`abstract class A {
  foo: number;
}

abstract class B extends A {
  bar: string;
}`


抽象类的内部可以有已经实现好的属性和方法，也可以有还未实现的属性和方法。后者就叫做“抽象成员”（abstract member），即属性名和方法名有abstract关键字，表示该方法需要子类实现。如果子类没有实现抽象成员，就会报错。


`abstract class A {
  abstract foo: string;
  bar: string = "";
}

class B extends A {
  foo = "b";
}`


上面示例中，抽象类A定义了抽象属性foo，子类B必须实现这个属性，否则会报错。


如果抽象类的属性前面加上abstract，就表明子类必须给出该方法的实现。


`abstract class A {
  abstract execute(): string;
}

class B extends A {
  execute() {
    return `B executed`;
  }
}`


这里有几个注意点。


（1）抽象成员只能存在于抽象类，不能存在于普通类。


（2）抽象成员不能有具体实现的代码。也就是说，已经实现好的成员前面不能加abstract关键字。


（3）抽象成员前也不能有private修饰符，否则无法在子类中实现该成员。


（4）一个子类最多只能继承一个抽象类。


总之，抽象类的作用是，确保各种相关的子类都拥有跟基类相同的接口，可以看作是模板。其中的抽象成员都是必须由子类实现的成员，非抽象成员则表示基类已经实现的、由所有子类共享的成员。


## 11.9 this 问题


类的方法经常用到this关键字，它表示该方法当前所在的对象。


`class A {
  name = "A";

  getName() {
    return this.name;
  }
}

const a = new A();
a.getName(); // 'A'

const b = {
  name: "b",
  getName: a.getName,
};
b.getName(); // 'b'`


上面示例中，变量a和b的getName()是同一个方法，但是执行结果不一样，原因就是它们内部的this指向不一样的对象。如果getName()在变量a上运行，this指向a；如果在b上运行，this指向b。


有些场合需要给出this类型，但是 JavaScript 函数通常不带有this参数，这时TypeScript 允许函数增加一个名为this的参数，放在参数列表的第一位，用来描述函数内部的this关键字的类型。


`// 编译前
function fn(this: SomeType, x: number) {
  /* ... */
}

// 编译后
function fn(x) {
  /* ... */
}`


上面示例中，函数fn()的第一个参数是this，用来声明函数内部的this的类型。编译时，TypeScript 一旦发现函数的第一个参数名为this，则会去除这个参数，即编译结果不会带有该参数。


`class A {
  name = "A";

  getName(this: A) {
    return this.name;
  }
}

const a = new A();
const b = a.getName;

b(); // 报错`


上面示例中，类A的getName()添加了this参数，如果直接调用这个方法，this的类型就会跟声明的类型不一致，从而报错。 this参数的类型可以声明为各种对象。


`function foo(this: { name: string }) {
  this.name = "Jack";
  this.name = 0; // 报错
}

foo.call({ name: 123 }); // 报错`


TypeScript 提供了一个noImplicitThis编译选项。如果打开了这个设置项，如果this的值推断为any类型，就会报错。


`// noImplicitThis 打开

class Rectangle {
  constructor(public width: number, public height: number) {}

  getAreaFunction() {
    return function () {
      return this.width * this.height; // 报错
    };
  }
}`


上面示例中，getAreaFunction()方法返回一个函数，这个函数里面用到了this，但是这个this跟Rectangle这个类没关系，它的类型推断为any，所以就报错了。


在类的内部，this本身也可以当作类型使用，表示当前类的实例对象。


`class Box {
  contents: string = "";

  set(value: string): this {
    this.contents = value;
    return this;
  }
}`


注意，this类型不允许应用于静态成员。


`class A {
  static a: this; // 报错
}`


有些方法返回一个布尔值，表示当前的this是否属于某种类型。这时，这些方法的返回值类型可以写成this is Type的形式，其中用到了is运算符。


`class FileSystemObject {
  isFile(): this is FileRep {
    return this instanceof FileRep;
  }

  isDirectory(): this is Directory {
    return this instanceof Directory;
  }

  // ...
}`


上面示例中，两个方法的返回值类型都是布尔值，写成this is Type的形式，可以精确表示返回值。


# 十二、TypeScript 泛型


## 12.1 简介


有些时候，函数返回值的类型与参数类型是相关的。


`function getFirst(arr) {
  return arr[0];
}`


为了解决这个问题，TypeScript 就引入了“泛型”（generics）。泛型的特点就是带有“类型参数”（type parameter）。


`function getFirst<T>(arr: T[]): T {
  return arr[0];
}`


上面示例中，函数getFirst()的函数名后面尖括号的部分，就是类型参数，参数要放在一对尖括号（<>）里面。本例只有一个类型参数T，可以将其理解为类型声明需要的变量，需要在调用时传入具体的参数类型。


上例的函数getFirst()的参数类型是T[]，返回值类型是T，就清楚地表示了两者之间的关系。比如，输入的参数类型是number[]，那么 T 的值就是number，因此返回值类型也是number。


函数调用时，需要提供类型参数。


`getFirst<number>([1, 2, 3]);`


为了方便，函数调用时，往往省略不写类型参数的值，让 TypeScript 自己推断。


`getFirst([1, 2, 3]);`


有些复杂的使用场景，TypeScript 可能推断不出类型参数的值，这时就必须显式给出了。


`function comb<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.concat(arr2);
}`


类型参数的名字，可以随便取，但是必须为合法的标识符。习惯上，类型参数的第一个字符往往采用大写字母。一般会使用T（type 的第一个字母）作为类型参数的名字。如果有多个类型参数，则使用 T 后面的 U、V 等字母命名，各个参数之间使用逗号（“,”）分隔。


`function map<T, U>(arr: T[], f: (arg: T) => U): U[] {
  return arr.map(f);
}

// 用法实例
map<string, number>(["1", "2", "3"], (n) => parseInt(n)); // 返回 [1, 2, 3]`


上面示例将数组的实例方法map()改写成全局函数，它有两个类型参数T和U。含义是，原始数组的类型为T[]，对该数组的每个成员执行一个处理函数f，将类型T转成类型U，那么就会得到一个类型为U[]的数组。


总之，泛型可以理解成一段类型逻辑，需要类型参数来表达。有了类型参数以后，可以在输入类型与输出类型之间，建立一一对应关系。


## 12.2 泛型的写法


泛型主要用在四个场合：函数、接口、类和别名。


### 12.2.1 函数的泛型写法


function关键字定义的泛型函数，类型参数放在尖括号中，写在函数名后面。


`function id<T>(arg: T): T {
  return arg;
}`


那么对于变量形式定义的函数，泛型有下面两种写法。


`// 写法一
let myId: <T>(arg: T) => T = id;

// 写法二
let myId: { <T>(arg: T): T } = id;`


### 12.2.2 接口的泛型写法


interface 也可以采用泛型的写法。


`interface Box<Type> {
  contents: Type;
}

let box: Box<string>;`


上面示例中，使用泛型接口时，需要给出类型参数的值（本例是string）。


`interface Comparator<T> {
  compareTo(value: T): number;
}

class Rectangle implements Comparator<Rectangle> {
  compareTo(value: Rectangle): number {
    // ...
  }
}`


泛型接口还有第二种写法。


`interface Fn {
  <Type>(arg: Type): Type;
}

function id<Type>(arg: Type): Type {
  return arg;
}

let myId: Fn = id;`


此外，第二种写法还有一个差异之处。那就是它的类型参数定义在某个方法之中，其他属性和方法不能使用该类型参数。前面的第一种写法，类型参数定义在整个接口，接口内部的所有属性和方法都可以使用该类型参数。


### 12.2.3 类的泛型写法


泛型类的类型参数写在类名后面。


`class Pair<K, V> {
  key: K;
  value: V;
}`


下面是继承泛型类的例子。


`class A<T> {
  value: T;
}

class B extends A<any> {}`


类A有一个类型参数T，使用时必须给出T的类型，所以类B继承时要写成A<**any**>。


泛型也可以用在类表达式。


`const Container = class<T> {
  constructor(private readonly data: T) {}
};

const a = new Container<boolean>(true);
const b = new Container<number>(0);`


上面示例中，新建实例时，需要同时给出类型参数T和类参数data的值。


`class C<NumType> {
  value!: NumType;
  add!: (x: NumType, y: NumType) => NumType;
}

let foo = new C<number>();

foo.value = 0;
foo.add = function (x, y) {
  return x + y;
};`


上面示例中，先新建类C的实例foo，然后再定义示例的value属性和add()方法。类的定义中，属性和方法后面的感叹号是非空断言，告诉 TypeScript 它们都是非空的，后面会赋值。


JavaScript 的类本质上是一个构造函数，因此也可以把泛型类写成构造函数。


`type MyClass<T> = new (...args: any[]) => T;

// 或者
interface MyClass<T> {
  new (...args: any[]): T;
}

// 用法实例
function createInstance<T>(AnyClass: MyClass<T>, ...args: any[]): T {
  return new AnyClass(...args);
}`


上面示例中，函数createInstance()的第一个参数AnyClass是构造函数（也可以是一个类），它的类型是MyClass<T>，这里的T是createInstance()的类型参数，在该函数调用时再指定具体类型。


注意，泛型类描述的是类的实例，不包括静态属性和静态方法，因为这两者定义在类的本身。因此，它们不能引用类型参数。


`class C<T> {
  static data: T; // 报错
  constructor(public value: T) {}
}`


### 12.2.4 类型别名的泛型写法


type 命令定义的类型别名，也可以使用泛型。


`type Nullable<T> = T | undefined | null;`


下面是另一个例子。


`type Container<T> = { value: T };

const a: Container<number> = { value: 0 };
const b: Container<string> = { value: "b" };`


## 12.3 类型参数的默认值


类型参数可以设置默认值。使用时，如果没有给出类型参数的值，就会使用默认值。


`function getFirst<T = string>(arr: T[]): T {
  return arr[0];
}`


上面示例中，T = string表示类型参数的默认值是string。调用getFirst()时，如果不给出T的值，TypeScript 就认为T等于string。


但是，因为 TypeScript 会从实际参数推断出T的值，从而覆盖掉默认值，所以下面的代码不会报错。


`getFirst([1, 2, 3]); // 正确`


类型参数的默认值，往往用在类中。


`class Generic<T = string> {
  list: T[] = [];

  add(t: T) {
    this.list.push(t);
  }
}`


上面示例中，类Generic有一个类型参数T，默认值为string。这意味着，属性list默认是一个字符串数组，方法add()的默认参数是一个字符串。


`const g = new Generic();

g.add(4); // 报错
g.add("hello"); // 正确`


新建Generic的实例g时，没有给出类型参数T的值，所以T就等于string。因此，向add()方法传入一个数值会报错，传入字符串就不会。


一旦类型参数有默认值，就表示它是可选参数。如果有多个类型参数，可选参数必须在必选参数之后。


`<T = boolean, U> // 错误

<T, U = boolean> // 正确`


## 12.4 数组的泛型表示


数组类型有一种表示方法是Array<**T**>。这就是泛型的写法，Array是 TypeScript 原生的一个类型接口，T是它的类型参数。声明数组时，需要提供T的值。


`let arr: Array<number> = [1, 2, 3];`


同样的，如果数组成员都是字符串，那么类型就写成Array<**string**>。事实上，在TypeScript 内部，数组类型的另一种写法number[]、string[]，只是Array<**number**>、Array<**string**>的简写形式。


在 TypeScript 内部，Array是一个泛型接口，类型定义基本是下面的样子。


`interface Array<Type> {
  length: number;

  pop(): Type | undefined;

  push(...items: Type[]): number;

  // ...
}`


上面代码中，push()方法的参数item的类型是Type[]，跟Array()的参数类型Type保持一致，表示只能添加同类型的成员。调用push()的时候，TypeScript 就会检查两者是否一致。


其他的 TypeScript 内部数据结构，比如Map、Set和Promise，其实也是泛型接口，完整的写法是Map<**K, V**>、Set<**T**>和Promise<**T**>。


TypeScript 默认还提供一个ReadonlyArray<**T**>接口，表示只读数组。


`function doStuff(values: ReadonlyArray<string>) {
  values.push("hello!"); // 报错
}`


如果不希望函数内部改动参数数组，就可以将该参数数组声明为ReadonlyArray<**T**>类型。


## 12.5 类型参数的约束条件


很多类型参数并不是无限制的，对于传入的类型存在约束条件。


`function comp<Type>(a: Type, b: Type) {
  if (a.length >= b.length) {
    return a;
  }
  return b;
}`


上面示例中，类型参数 Type 有一个隐藏的约束条件：它必须存在length属性。如果不满足这个条件，就会报错。


TypeScript 提供了一种语法，允许在类型参数上面写明约束条件，如果不满足条件，编译时就会报错。这样也可以有良好的语义，对类型参数进行说明。


`function comp<T extends { length: number }>(a: T, b: T) {
  if (a.length >= b.length) {
    return a;
  }
  return b;
}`


上面示例中，T extends { length: number }就是约束条件，表示类型参数 T 必须满足{ length: number }，否则就会报错。


`comp([1, 2], [1, 2, 3]); // 正确
comp("ab", "abc"); // 正确
comp(1, 2); // 报错`


类型参数的约束条件采用下面的形式。


`<TypeParameter extends ConstraintType>`


上面语法中，TypeParameter表示类型参数，extends是关键字，这是必须的，ConstraintType表示类型参数要满足的条件，即类型参数应该是ConstraintType的子类型。


类型参数可以同时设置约束条件和默认值，前提是默认值必须满足约束条件。


`type Fn<A extends string, B extends string = "world"> = [A, B];

type Result = Fn<"hello">; // ["hello", "world"]`


上面示例中，类型参数A和B都有约束条件，并且B还有默认值。所以，调用Fn的时候，可以只给出A的值，不给出B的值。


泛型本质上是一个类型函数，通过输入参数，获得结果，两者是一一对应关系。


如果有多个类型参数，一个类型参数的约束条件，可以引用其他参数。


`<T, U extends T>
// 或者
<T extends U, U>`


但是，约束条件不能引用类型参数自身。


`<T extends T>               // 报错
<T extends U, U extends T>  // 报错`


上面示例中，T的约束条件不能是T自身。同理，多个类型参数也不能互相约束（即T的约束条件是U、U的约束条件是T），因为互相约束就意味着约束条件就是类型参数自身。


## 12.6 使用注意点


（1）尽量少用泛型。 泛型虽然灵活，但是会加大代码的复杂性，使其变得难读难写。一般来说，只要使用了泛型，类型声明通常都不太易读，容易写得很复杂。因此，可以不用泛型就不要用。


（2）类型参数越少越好。 多一个类型参数，多一道替换步骤，加大复杂性。因此，类型参数越少越好。


`function filter<T, Fn extends (arg: T) => boolean>(arr: T[], func: Fn): T[] {
  return arr.filter(func);
}`


（3）类型参数需要出现两次。 如果类型参数在定义后只出现一次，那么很可能是不必要的。


只有当类型参数用到两次或两次以上，才是泛型的适用场合。


（4）泛型可以嵌套。 类型参数可以是另一个泛型。


# 十三、TypeScript 的 Enum 类型


Enum 是 TypeScript 新增的一种数据结构和类型，中文译为“**枚举**”。


## 13.1 简介


实际开发中，经常需要定义一组相关的常量。


`const RED = 1;
const GREEN = 2;
const BLUE = 3;

let color = userInput();

if (color === RED) {
  /* */
}
if (color === GREEN) {
  /* */
}
if (color === BLUE) {
  /* */
}

throw new Error("wrong color");`


TypeScript 就设计了 Enum 结构，用来将相关常量放在一个容器里面，方便使用。


`enum Color {
  Red, // 0
  Green, // 1
  Blue, // 2
}`


上面示例声明了一个 Enum 结构Color，里面包含三个成员Red、Green和Blue。第一个成员的值默认为整数0，第二个为1，第二个为2，以此类推。


使用时，调用 Enum 的某个成员，与调用对象属性的写法一样，可以使用点运算符，也可以使用方括号运算符。


`let c = Color.Green; // 1
// 等同于
let c = Color["Green"]; // 1`


Enum 结构本身也是一种类型。比如，上例的变量c等于1，它的类型可以是Color，也可以是number。


`let c: Color = Color.Green; // 正确
let c: number = Color.Green; // 正确`


Enum 结构的特别之处在于，它既是一种类型，也是一个值。绝大多数 TypeScript语法都是类型语法，编译后会全部去除，但是 Enum 结构是一个值，编译后会变成JavaScript 对象，留在代码中。


`// 编译前
enum Color {
  Red, // 0
  Green, // 1
  Blue, // 2
}

// 编译后
let Color = {
  Red: 0,
  Green: 1,
  Blue: 2,
};`


上面示例是 Enum 结构编译前后的对比。


由于 TypeScript 的定位是 JavaScript 语言的类型增强，所以官方建议谨慎使用Enum 结构，因为它不仅仅是类型，还会为编译后的代码加入一个对象。


Enum 结构比较适合的场景是，成员的值不重要，名字更重要，从而增加代码的可读性和可维护性。


`enum Operator {
  ADD,
  DIV,
  MUL,
  SUB,
}

function compute(op: Operator, a: number, b: number) {
  switch (op) {
    case Operator.ADD:
      return a + b;
    case Operator.DIV:
      return a / b;
    case Operator.MUL:
      return a * b;
    case Operator.SUB:
      return a - b;
    default:
      throw new Error("wrong operator");
  }
}

compute(Operator.ADD, 1, 3); // 4`


Enum 作为类型有一个缺点，就是输入任何数值都不报错。


`enum Bool {
  No,
  Yes,
}

function foo(noYes: Bool) {
  // ...
}

foo(33); // 不报错`


另外，由于 Enum 结构编译后是一个对象，所以不能有与它同名的变量（包括对象、函数、类等）。


`enum Color {
  Red,
  Green,
  Blue,
}

const Color = "red"; // 报错`


很大程度上，Enum 结构可以被对象的as const断言替代。


`enum Foo {
  A,
  B,
  C,
}

const Bar = {
  A: 0,
  B: 1,
  C: 2,
} as const;

if （x === Foo.A）{}
// 等同于
if (x === Bar.A) {}`


上面示例中，对象Bar使用了as const断言，作用就是使得它的属性无法修改。这样的话，Foo和Bar的行为就很类似了，前者完全可以用后者替代，而且后者还是 JavaScript 的原生数据结构。


## 13.2 Enum 成员的值


Enum 成员默认不必赋值，系统会从零开始逐一递增，按照顺序为每个成员赋值。


但是，也可以为 Enum 成员显式赋值。


`enum Color {
  Red,
  Green,
  Blue,
}

// 等同于
enum Color {
  Red = 0,
  Green = 1,
  Blue = 2,
}`


成员的值可以是任意数值，但不能是大整数（Bigint）。


`enum Color {
  Red = 90,
  Green = 0.5,
  Blue = 7n, // 报错
}`


成员的值甚至可以相同。


`enum Color {
  Red = 0,
  Green = 0,
  Blue = 0,
}`


如果只设定第一个成员的值，后面成员的值就会从这个值开始递增。


`enum Color {
  Red = 7,
  Green, // 8
  Blue, // 9
}

// 或者
enum Color {
  Red, // 0
  Green = 7,
  Blue, // 8
}`


Enum 成员的值也可以使用计算式。


`enum Permission {
  UserRead = 1 << 8,
  UserWrite = 1 << 7,
  UserExecute = 1 << 6,
  GroupRead = 1 << 5,
  GroupWrite = 1 << 4,
  GroupExecute = 1 << 3,
  AllRead = 1 << 2,
  AllWrite = 1 << 1,
  AllExecute = 1 << 0,
}

enum Bool {
  No = 123,
  Yes = Math.random(),
}`


Enum 成员值都是只读的，不能重新赋值。


`enum Color {
  Red,
  Green,
  Blue,
}

Color.Red = 4; // 报错`


为了让这一点更醒目，通常会在 enum 关键字前面加上const修饰，表示这是常量，不能再次赋值。


`const enum Color {
  Red,
  Green,
  Blue,
}`


加上const还有一个好处，就是编译为 JavaScript 代码后，代码中 Enum 成员会被替换成对应的值，这样能提高性能表现。


`const enum Color {
  Red,
  Green,
  Blue,
}

const x = Color.Red;
const y = Color.Green;
const z = Color.Blue;

// 编译后
const x = 0; /* Color.Red */
const y = 1; /* Color.Green */
const z = 2; /* Color.Blue */`


如果希望加上const关键词后，运行时还能访问 Enum 结构（即编译后依然将Enum 转成对象），需要在编译时打开preserveConstEnums编译选项。


## 13.3 同名 Enum 的合并


多个同名的 Enum 结构会自动合并。


`enum Foo {
  A,
}

enum Foo {
  B = 1,
}

enum Foo {
  C = 2,
}

// 等同于
enum Foo {
  A,
  B = 1，
  C = 2
}`


Enum 结构合并时，只允许其中一个的首成员省略初始值，否则报错。


`enum Foo {
  A,
}

enum Foo {
  B, // 报错
}`


同名 Enum 合并时，不能有同名成员，否则报错。


同名 Enum 合并的另一个限制是，所有定义必须同为 const 枚举或者非 const 枚举，不允许混合使用。


同名 Enum 的合并，最大用处就是补充外部定义的 Enum 结构。


## 13.4 字符串 Enum


Enum 成员的值除了设为数值，还可以设为字符串。也就是说，Enum 也可以用作一组相关字符串的集合。


`enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}`


注意，字符串枚举的所有成员值，都必须显式设置。如果没有设置，成员值默认为数值，且位置必须在字符串成员之前。


`enum Foo {
  A, // 0
  B = "hello",
  C, // 报错
}`


Enum 成员可以是字符串和数值混合赋值。


`enum Enum {
  One = "One",
  Two = "Two",
  Three = 3,
  Four = 4,
}`


除了数值和字符串，Enum 成员不允许使用其他值（比如 Symbol 值）。


变量类型如果是字符串 Enum，就不能再赋值为字符串，这跟数值 Enum 不一样。


`enum MyEnum {
  One = "One",
  Two = "Two",
}

let s = MyEnum.One;
s = "One"; // 报错`


由于这个原因，如果函数的参数类型是字符串 Enum，传参时就不能直接传入字符串，而要传入 Enum 成员。


`enum MyEnum {
  One = "One",
  Two = "Two",
}

function f(arg: MyEnum) {
  return "arg is " + arg;
}

f("One"); // 报错`


所以，字符串 Enum 作为一种类型，有限定函数参数的作用。


`const enum MediaTypes {
  JSON = "application/json",
  XML = "application/xml",
}

const url = "localhost";

fetch(url, {
  headers: {
    Accept: MediaTypes.JSON,
  },
}).then((response) => {
  // ...
});`


上面示例中，函数fetch()的参数对象的属性Accept，只能接受一些指定的字符串。这时就很适合把字符串放进一个 Enum 结构，通过成员值来引用这些字符串。


字符串 Enum 可以使用联合类型（union）代替。


`function move(where: "Up" | "Down" | "Left" | "Right") {
  // ...
}`


注意，字符串 Enum 的成员值，不能使用表达式赋值。


`enum MyEnum {
  A = "one",
  B = ["T", "w", "o"].join(""), // 报错
}`


## 13.5 keyof 运算符


keyof 运算符可以取出 Enum 结构的所有成员名，作为联合类型返回。


`enum MyEnum {
  A = "a",
  B = "b",
}

// 'A'|'B'
type Foo = keyof typeof MyEnum;`


上面示例中，keyof typeof MyEnum可以取出MyEnum的所有成员名，所以类型Foo等同于联合类型'A'|'B'。


注意，这里的typeof是必需的，否则keyof MyEnum相当于keyof number。


`type Foo = keyof MyEnum;
// "toString" | "toFixed" | "toExponential" |
// "toPrecision" | "valueOf" | "toLocaleString"`


上面示例中，类型Foo等于类型number的所有原生属性名组成的联合类型。 这是因为 Enum 作为类型，本质上属于number或string的一种变体，而typeof MyEnum会将MyEnum当作一个值处理，从而先其转为对象类型，就可以再用keyof运算符返回该对象的所有属性名。


如果要返回 Enum 所有的成员值，可以使用in运算符。


`enum MyEnum {
  A = "a",
  B = "b",
}

// { a：any, b: any }
type Foo = { [key in MyEnum]: any };`


## 13.6 反向映射


数值 Enum 存在反向映射，即可以通过成员值获得成员名。


`enum Weekdays {
  Monday = 1,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

console.log(Weekdays[3]); // Wednesday`


这是因为 TypeScript 会将上面的 Enum 结构，编译成下面的 JavaScript 代码。


`var Weekdays;
(function (Weekdays) {
  Weekdays[(Weekdays["Monday"] = 1)] = "Monday";
  Weekdays[(Weekdays["Tuesday"] = 2)] = "Tuesday";
  Weekdays[(Weekdays["Wednesday"] = 3)] = "Wednesday";
  Weekdays[(Weekdays["Thursday"] = 4)] = "Thursday";
  Weekdays[(Weekdays["Friday"] = 5)] = "Friday";
  Weekdays[(Weekdays["Saturday"] = 6)] = "Saturday";
  Weekdays[(Weekdays["Sunday"] = 7)] = "Sunday";
})(Weekdays || (Weekdays = {}));`


上面代码中，实际进行了两组赋值，以第一个成员为例。


`Weekdays[(Weekdays["Monday"] = 1)] = "Monday";`


注意，这种情况**只发生在数值 Enum**，对于字符串 Enum，不存在反向映射。这是因为字符串 Enum 编译后只有一组赋值。


```javascript
enum MyEnum {
  A = "a",
  B = "b",
}

// 编译后
var MyEnum;
(function (MyEnum) {
  MyEnum["A"] = "a";
  MyEnum["B"] = "b";
})(MyEnum || (MyEnum = {}));
```


# 十四、TypeScript 的类型断言


## 14.1 简介


对于没有类型声明的值，TypeScript 会进行类型推断，很多时候得到的结果，未必是开发者想要的。


`type T = "a" | "b" | "c";
let foo = "a";

let bar: T = foo; // 报错`


上面示例中，最后一行报错，原因是 TypeScript 推断变量foo的类型是string，而变量bar的类型是'a'|'b'|'c'，前者是后者的父类型。父类型不能赋值给子类型，所以就报错了。


TypeScript 提供了“类型断言”这样一种手段，允许开发者在代码中“断言”某个值的类型，告诉编译器此处的值是什么类型。TypeScript 一旦发现存在类型断言，就不再对该值进行类型推断，而是直接采用断言给出的类型。


这种做法的实质是，允许开发者在某个位置“绕过”编译器的类型推断，让本来通不过类型检查的代码能够通过，避免编译器报错。这样虽然削弱了 TypeScript 类型系统的严格性，但是为开发者带来了方便，毕竟开发者比编译器更了解自己的代码。


`type T = "a" | "b" | "c";

let foo = "a";
let bar: T = foo as T; // 正确`


最后一行的foo as T表示告诉编译器，变量foo的类型断言为T，所以这一行不再需要类型推断了，编译器直接把foo的类型当作T，就不会报错了。


总之，类型断言并不是真的改变一个值的类型，而是提示编译器，应该如何处理这个值。


类型断言有两种语法。


`// 语法一：<类型>值
<Type>value;

// 语法二：值 as 类型
value as Type;`


上面两种语法是等价的，value表示值，Type表示类型。早期只有语法一，后来因为 TypeScript 开始支持 React 的 JSX 语法（尖括号表示 HTML 元素），为了避免两者冲突，就引入了语法二。


目前，**推荐使用语法二**。


`// 语法一
let bar: T = <T>foo;

// 语法二
let bar: T = foo as T;`


上面示例是两种类型断言的语法，其中的语法一因为跟 JSX 语法冲突，使用时必须关闭 TypeScript 的 React 支持，否则会无法识别。由于这个原因，现在一般都使用语法二。


下面看一个例子。


`// 报错
const p: { x: number } = { x: 0, y: 0 };`


上面示例中，等号右侧是一个对象字面量，多出了属性y，导致报错。解决方法就是使用类型断言，可以用两种不同的断言。


`// 正确
const p0: { x: number } = { x: 0, y: 0 } as { x: number };

// 正确
const p1: { x: number } = { x: 0, y: 0 } as { x: number; y: number };`


上面示例中，两种类型断言都是正确的。第一种断言将类型改成与等号左边一致，第二种断言使得等号右边的类型是左边类型的子类型，子类型可以赋值给父类型，同时因为存在类型断言，就没有严格字面量检查了，所以不报错。


下面是一个网页编程的实际例子。


`const username = document.getElementById("username");

if (username) {
  (username as HTMLInputElement).value; // 正确
}`


注意，上例的类型断言的圆括号是必需的，否则username会被断言成HTMLInputElement.value，从而报错。


类型断言不应滥用，因为它改变了 TypeScript 的类型检查，很可能埋下错误的隐患。


`const data: object = {
  a: 1,
  b: 2,
  c: 3,
};

data.length; // 报错

(data as Array<string>).length; // 正确`


上面示例中，变量data是一个对象，没有length属性。但是通过类型断言，可以将它的类型断言为数组，这样使用length属性就能通过类型检查。但是，编译后的代码在运行时依然会报错，所以类型断言可以让错误的代码通过编译。


类型断言的一大用处是，指定 unknown 类型的变量的具体类型。


`const value: unknown = "Hello World";

const s1: string = value; // 报错
const s2: string = value as string; // 正确`


上面示例中，unknown 类型的变量value不能直接赋值给其他类型的变量，但是可以将它断言为其他类型，这样就可以赋值给别的变量了。


另外，类型断言也适合指定联合类型的值的具体类型。


`const s1: number | string = "hello";
const s2: number = s1 as number;`


## 14.2 类型断言的条件


类型断言并不意味着，可以把某个值断言为任意类型。


`const n = 1;
const m: string = n as string; // 报错`


类型断言的使用前提是，值的实际类型与断言的类型必须满足一个条件。


`expr as T;`


上面代码中，expr是实际的值，T是类型断言，它们必须满足下面的条件：expr是T的子类型，或者T是expr的子类型。


也就是说，类型断言要求实际的类型与断言的类型兼容，实际类型可以断言为一个更加宽泛的类型（父类型），也可以断言为一个更加精确的类型（子类型），但不能断言为一个完全无关的类型。


但是，如果真的要断言成一个完全无关的类型，也是可以做到的。那就是连续进行两次类型断言，先断言成 unknown 类型或 any 类型，然后再断言为目标类型。因为any类型和unknown类型是所有其他类型的父类型，所以可以作为两种完全无关的类型的中介。


`// 或者写成 <T><unknown>expr
expr as unknown as T;`


## 14.3 as const 断言


如果没有声明变量类型，let 命令声明的变量，会被类型推断为 TypeScript 内置的基本类型之一；const 命令声明的变量，则被推断为值类型常量。


`// 类型推断为基本类型 string
let s1 = "JavaScript";

// 类型推断为字符串 “JavaScript”
const s2 = "JavaScript";`


上面示例中，变量s1的类型被推断为string，变量s2的类型推断为值类型JavaScript。后者是前者的子类型，相当于 const 命令有更强的限定作用，可以缩小变量的类型范围。


有些时候，let 变量会出现一些意想不到的报错，变更成 const 变量就能消除报错。


`let s = "JavaScript";

type Lang = "JavaScript" | "TypeScript" | "Python";

function setLang(language: Lang) {
  /* ... */
}

setLang(s); // 报错`


上面示例中，最后一行报错，原因是函数setLang()的参数language类型是Lang，这是一个联合类型。但是，传入的字符串s的类型被推断为string，属于Lang的父类型。父类型不能替代子类型，导致报错。


一种解决方法就是把 let 命令改成 const 命令。


`const s = "JavaScript";`


另一种解决方法是使用类型断言。TypeScript 提供了一种特殊的类型断言as const，用于告诉编译器，推断类型时，可以将这个值推断为常量，即把 let 变量断言为 const 变量，从而把内置的基本类型变更为值类型。


`let s = "JavaScript" as const;
setLang(s); // 正确`


使用了**as const断言以后，let 变量就不能再改变值了**。


`let s = "JavaScript" as const;
s = "Python"; // 报错`


注意，as const断言只能用于字面量，不能用于变量。


`let s = "JavaScript";
setLang(s as const); // 报错`


另外，as const也不能用于表达式。


`let s = ("Java" + "Script") as const; // 报错`


as const也可以写成前置的形式。


`// 后置形式
expr as const

// 前置形式
<const>expr`


as const断言可以用于整个对象，也可以用于对象的单个属性，这时它的类型缩小效果是不一样的。


`const v1 = {
  x: 1,
  y: 2,
}; // 类型是 { x: number; y: number; }

const v2 = {
  x: 1 as const,
  y: 2,
}; // 类型是 { x: 1; y: number; }

const v3 = {
  x: 1,
  y: 2,
} as const; // 类型是 { readonly x: 1; readonly y: 2; }`


上面示例中，第二种写法是对属性x缩小类型，第三种写法是对整个对象缩小类型。


总之，as const会将字面量的类型断言为不可变类型，缩小成 TypeScript 允许的最小类型。


下面是数组的例子。


`// a1 的类型推断为 number[]
const a1 = [1, 2, 3];

// a2 的类型推断为 readonly [1, 2, 3]
const a2 = [1, 2, 3] as const;`


上面示例中，数组字面量使用as const断言后，类型推断就变成了只读元组。


由于as const会将数组变成只读元组，所以很适合用于函数的 rest 参数。


`function add(x: number, y: number) {
  return x + y;
}

const nums = [1, 2];
const total = add(...nums); // 报错`


上面示例中，变量nums的类型推断为number[]，导致使用扩展运算符...传入函数add()会报错，因为add()只能接受两个参数，而...nums并不能保证参数的个数。


事实上，对于固定参数个数的函数，如果传入的参数包含扩展运算符，那么扩展运算符只能用于元组。只有当函数定义使用了 rest 参数，扩展运算符才能用于数组。


解决方法就是使用as const断言，将数组变成元组。


`const nums = [1, 2] as const;
const total = add(...nums); // 正确`


Enum 成员也可以使用as const断言。


`enum Foo {
  X,
  Y,
}
let e1 = Foo.X; // Foo
let e2 = Foo.X as const; // Foo.X`


上面示例中，如果不使用as const断言，变量e1的类型被推断为整个 Enum 类型；使用了as const断言以后，变量e2的类型被推断为 Enum 的某个成员，这意味着它不能变更为其他成员。


## 14.4 非空断言


对于那些可能为空的变量（即可能等于undefined或null），TypeScript 提供了非空断言，保证这些变量不会为空，写法是在变量名后面加上感叹号!。


`function f(x?: number | null) {
  validateNumber(x); // 自定义函数，确保 x 是数值
  console.log(x!.toFixed());
}

function validateNumber(e?: number | null) {
  if (typeof e !== "number") throw new Error("Not a number");
}`


上面示例中，函数f()的参数x的类型是number|null，即可能为空。如果为空，就不存在x.toFixed()方法，这样写会报错。但是，开发者可以确认，经过validateNumber()的前置检验，变量x肯定不会为空，这时就可以使用非空断言，为函数体内部的变量x加上后缀!，x!.toFixed()编译就不会报错了。


非空断言在实际编程中很有用，有时可以省去一些额外的判断。


`const root = document.getElementById("root");

// 报错
root.addEventListener("click", (e) => {
  /* ... */
});`


上面示例中，getElementById()有可能返回空值null，即变量root可能为空，这时对它调用addEventListener()方法就会报错，通不过编译。但是，开发者如果可以确认root元素肯定会在网页中存在，这时就可以使用非空断言。


`const root = document.getElementById("root")!;`


不过，非空断言会造成安全隐患，只有在确定一个表达式的值不为空时才能使用。比较保险的做法还是手动检查一下是否为空。


`const root = document.getElementById("root");

if (root === null) {
  throw new Error("Unable to find DOM element #root");
}

root.addEventListener("click", (e) => {
  /* ... */
});`


上面示例中，如果root为空会抛错，比非空断言更保险一点。


非空断言还可以用于赋值断言。TypeScript 有一个编译设置，要求类的属性必须初始化（即有初始值），如果不对属性赋值就会报错。


`class Point {
  x: number; // 报错
  y: number; // 报错

  constructor(x: number, y: number) {
    // ...
  }
}`


上面示例中，属性x和y会报错，因为 TypeScript 认为它们没有初始化。 这时就可以使用非空断言，表示这两个属性肯定会有值，这样就不会报错了。


`class Point {
  x!: number; // 正确
  y!: number; // 正确

  constructor(x: number, y: number) {
    // ...
  }
}`


另外，非空断言只有在打开编译选项strictNullChecks时才有意义。如果不打开选项，编译器就不会检查某个变量是否可能为undefined或null。


## 14.5 断言函数


断言函数是一种特殊函数，用于保证函数参数符合某种类型。如果函数参数达不到要求，就会抛出错误，中断程序执行；如果达到要求，就不进行任何操作，让代码按照正常流程运行。


`function isString(value) {
  if (typeof value !== "string") throw new Error("Not a string");
}`


断言函数的类型可以写成下面这样。


`function isString(value: unknown): void {
  if (typeof value !== "string") throw new Error("Not a string");
}`


上面代码中，函数参数value的类型是unknown，返回值类型是void，即没有返回值。可以看到，单单从这样的类型声明，很难看出isString()是一个断言函数。


为了更清晰地表达断言函数，TypeScript 3.7 引入了新的类型写法。


`function isString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new Error("Not a string");
}`


上面示例中，函数isString()的返回值类型写成asserts value is string，其中asserts和is都是关键词，value是函数的参数名，string是函数参数的预期类型。它的意思是，该函数用来断言参数value的类型是string，如果达不到要求，程序就会在这里中断。


使用了断言函数的新写法以后，TypeScript 就会自动识别，只要执行了该函数，对应的变量都为断言的类型。


注意，函数返回值的断言写法，只是用来更清晰地表达函数意图，真正的检查是需要开发者自己部署的。而且，如果内部的检查与断言不一致，TypeScript 也不会报错。


`function isString(value: unknown): asserts value is string {
  if (typeof value !== "number") throw new Error("Not a number");
}`


上面示例中，函数的断言是参数value类型为字符串，但是实际上，内部检查的却是它是否为数值，如果不是就抛错。这段代码能够正常通过编译，表示 TypeScript并不会检查断言与实际的类型检查是否一致。


另外，断言函数的asserts语句等同于void类型，所以如果返回除了undefined和null以外的值，都会报错。


`function isString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new Error("Not a string");
  return true; // 报错
}`


如果要断言参数非空，可以使用工具类型NonNullable<**T**>。


`function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}`


如果要将断言函数用于函数表达式，可以采用下面的写法。


`// 写法一
const assertIsNumber = (value: unknown): asserts value is number => {
  if (typeof value !== "number") throw Error("Not a number");
};

// 写法二
type AssertIsNumber = (value: unknown) => asserts value is number;

const assertIsNumber: AssertIsNumber = (value) => {
  if (typeof value !== "number") throw Error("Not a number");
};`


注意，断言函数与类型保护函数（type guard）是两种不同的函数。它们的区别是，断言函数不返回值，而类型保护函数总是返回一个布尔值。


`function isString(value: unknown): value is string {
  return typeof value === "string";
}`


上面示例就是一个类型保护函数isString()，作用是检查参数value是否为字符串。如果是的，返回true，否则返回false。该函数的返回值类型是value is string，其中的is是一个类型运算符，如果左侧的值符合右侧的类型，则返回true，否则返回false。


如果要断言某个参数保证为真（即不等于false、undefined和null），TypeScript 提供了断言函数的一种简写形式。


`function assert(x: unknown): asserts x {
  // ...
}`


上面示例中，函数assert()的断言部分，asserts x省略了谓语和宾语，表示参数x保证为真（true）。


同样的，参数为真的实际检查需要开发者自己实现。


`function assert(x: unknown): asserts x {
  if (!x) {
    throw new Error(`${x} should be a truthy value.`);
  }
}`


这种断言函数的简写形式，通常用来检查某个操作是否成功。


`type Person = {
  name: string;
  email?: string;
};

function loadPerson(): Person | null {
  return null;
}

let person = loadPerson();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Error: Person is not defined
assert(person, "Person is not defined");
console.log(person.name);`


上面示例中，只有loadPerson()返回结果为真（即操作成功），assert()才不会报错。


# 十五、TypeScript 模块


## 15.1 简介


任何包含 import 或 export 语句的文件，就是一个模块（module）。相应地，如果文件不包含 export 语句，就是一个全局的脚本文件。


模块本身就是一个作用域，不属于全局作用域。模块内部的变量、函数、类只在内部可见，对于模块外部是不可见的。暴露给外部的接口，必须用 export 命令声明；如果其他文件要使用模块的接口，必须用 import 命令来输入。


如果一个文件不包含 export 语句，但是希望把它当作一个模块（即内部变量对外不可见），可以在脚本头部添加一行语句。


`export {};`


上面这行语句不产生任何实际作用，但会让当前文件被当作模块处理，所有它的代码都变成了内部代码。


TypeScript 模块除了支持所有 ES 模块的语法，特别之处在于允许输出和输入类型。


`export type Bool = true | false;`


上面示例中，当前脚本输出一个类型别名Bool。这行语句把类型定义和接口输出写在一行，也可以写成两行。


`type Bool = true | false;

export { Bool };`


假定上面的模块文件为a.ts，另一个文件b.ts就可以使用 import 语句，输入这个类型。


`import { Bool } from "./a";

let foo: Bool = true;`


TypeScript 允许加载模块时，省略模块文件的后缀名，它会自动定位。


编译时，可以两个脚本同时编译。


`tsc a.ts b.ts`


上面命令会将a.ts和b.ts分别编译成a.js和b.js。


也可以只编译b.ts，因为它是入口脚本，tsc 会自动编译它依赖的所有脚本。


`tsc b.ts`


上面命令发现b.ts依赖a.js，就会自动寻找a.ts，也将其同时编译，因此编译产物还是a.js和b.js两个文件。


如果想将a.ts和b.ts编译成一个文件，可以使用--outFile参数。


`$ tsc --outFile result.js b.ts`


## 15.2 import type 语句


import 在一条语句中，可以同时输入类型和正常接口。


`// a.ts
export interface A {
  foo: string;
}

export let a = 123;

// b.ts
import { A, a } from "./a";`


这样很不利于区分类型和正常接口，容易造成混淆。为了解决这个问题，TypeScript引入了两个解决方法。


第一个方法是在 import 语句输入的类型前面加上type关键字。


`import { type A, a } from "./a";`


上面示例中，import 语句输入的类型A前面有type关键字，表示这是一个类型。


第二个方法是使用 import type 语句，这个语句只能输入类型，不能输入正常接口。


`// 正确
import type { A } from "./a";

// 报错
import type { a } from "./a";`


import type 语句也可以输入默认类型。


`import type DefaultType from "moduleA";`


import type 在一个名称空间下，输入所有类型的写法如下。


`import type * as TypeNS from "moduleA";`


同样的，export 语句也有两种方法，表示输出的是类型。


`type A = "a";
type B = "b";

// 方法一
export { type A, type B };

// 方法二
export type { A, B };`


上面示例中，方法一是使用type关键字作为前缀，表示输出的是类型；方法二是使用 export type 语句，表示整行输出的都是类型。


下面是 export type 将一个类作为类型输出的例子。


`class Point {
  x: number;
  y: number;
}

export type { Point };`


上面示例中，由于使用了 export type 语句，输出的并不是 Point 这个类，而是Point 代表的实例类型。输入时，只能作为类型输入。


`import type { Point } from "./module";

const p: Point = { x: 0, y: 0 };`


## 15.3 importsNotUsedAsValues


TypeScript 提供了importsNotUsedAsValues编译设置项，有三个可能的值。


（1）remove：这是默认值，自动删除输入类型的 import 语句。


（2）preserve：保留输入类型的 import 语句。


（3）error：保留输入类型的 import 语句（与preserve相同），但是必须写成import type 的形式，否则报错。


下面是一个输入类型的 import 语句。


`import { TypeA } from "./a";`


上面示例中，TypeA是一个类型。 remove的编译结果会将该语句删掉。


preserve的编译结果会保留该语句，但会把删掉类型的部分。


`import "./a";`


上面示例中，编译后的 import 语句不从a.js输入任何接口，但是会引发a.js的执行，因此会保留a.js里面的副作用。


error的结果与preserve相同，但是编译过程会报错，因为输入类型的 import 语句必须写成 import type 的形式。原始语句改成下面的形式，就不会报错。


`import type { TypeA } from "./a";`


## 15.4 CommonJS 模块


CommonJS 是 Node.js 的专用模块格式，与 ES 模块格式不兼容。


TypeScript 使用**import =**语句输入 CommonJS 模块。


`import fs = require("fs");
const code = fs.readFileSync("hello.ts", "utf8");`


上面示例中，使用import =语句和require()命令输入了一个 CommonJS 模块。模块本身的用法跟 Node.js 是一样的。


除了使用import =语句，TypeScript 还允许使用**import * as [接口名] from** **"模块文件"**输入 CommonJS 模块。


`import * as fs from "fs";
// 等同于
import fs = require("fs");`


TypeScript 使用**export =**语句，输出 CommonJS 模块的对象，等同于 CommonJS的module.exports对象。


`let obj = { foo: 123 };

export = obj;`


export = 语句输出的对象，只能使用import =语句加载。


`import obj = require("./a");

console.log(obj.foo); // 123`


## 15.5 模块定位


模块定位（module resolution）指的是确定 import 语句和 export 语句里面的模块文件位置。


`import { TypeA } from "./a";`


模块定位有两种方法，一种称为 Classic 方法，另一种称为 Node 方法。可以使用编译参数moduleResolution，指定使用哪一种方法。


没有指定定位方法时，就看原始脚本采用什么模块格式。如果模块格式是CommonJS（即编译时指定--module commonjs），那么模块定位采用 Node 方法，否则采用 Classic 方法（模块格式为 es2015、 esnext、amd, system, umd 等等）。


### 15.5.1 相对模块，非相对模块


加载模块时，目标模块分为相对模块（relative import）和非相对模块两种（nonrelative import）。


相对模块指的是路径以/、./、../开头的模块。下面 import 语句加载的模块，都是相对模块。

- import Entry from "./components/Entry";
- import { DefaultHeaders } from "../constants/http";
- import "/mod";

非相对模块指的是不带有路径信息的模块。下面 import 语句加载的模块，都是非相对模块。

- import * as $ from "jquery";
- import { Component } from "@angular/core";

### 15.5.2 Classic 方法


Classic 方法以当前脚本的路径作为“基准路径”，计算相对模块的位置。比如，脚本a.ts里面有一行代码import { b } from "./b"，那么 TypeScript 就会在a.ts 所在的目录，查找b.ts和b.d.ts。


至于非相对模块，也是以当前脚本的路径作为起点，一层层查找上级目录。比如，脚本a.ts里面有一行代码import { b } from "b"，那么就会查找b.ts和b.d.ts。


### 15.5.3 Node 方法


Node 方法就是模拟 Node.js 的模块加载方法。 相对模块依然是以当前脚本的路径作为“基准路径”。比如，脚本文件a.ts里面有一行代码let x = require("./b");，TypeScript 按照以下顺序查找。

1. 当前目录是否包含b.ts、b.tsx、b.d.ts。
2. 当前目录是否有子目录b，该子目录是否存在文件package.json，该文件的 types字段是否指定了入口文件，如果是的就加载该文件。
3. 当前目录的子目录b是否包含index.ts、index.tsx、index.d.ts。

非相对模块则是以当前脚本的路径作为起点，逐级向上层目录查找是否存在子目录node_modules。比如，脚本文件a.js有一行let x = require("b");， TypeScript 按照以下顺序进行查找。

1. 当前目录的子目录node_modules是否包含b.ts、b.tsx、b.d.ts。
2. 当前目录的子目录node_modules，是否存在文件package.json，该文件的types字段是否指定了入口文件，如果是的就加载该文件。
3. 当前目录的子目录node_modules里面，是否包含子目录@types，在该目录中查找文件b.d.ts。
4. 当前目录的子目录node_modules里面，是否包含子目录b，在该目录中查找index.ts、index.tsx、index.d.ts。
5. 进入上一层目录，重复上面4步，直到找到为止。

### 15.5.4 路径映射


TypeScript 允许开发者在tsconfig.json文件里面，手动指定脚本模块的路径。


（1）baseUrl


baseUrl字段可以手动指定脚本模块的基准目录。


`{
  "compilerOptions": {
    "baseUrl": "."
  }
}`


上面示例中，baseUrl是一个点，表示基准目录就是tsconfig.json所在的目录。


（2）paths


paths字段指定非相对路径的模块与实际脚本的映射。


`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "jquery": ["node_modules/jquery/dist/jquery"]
    }
  }
}`


上面示例中，加载模块jquery时，实际加载的脚本是 node_modules/jquery/dist/jquery，它的位置要根据baseUrl字段计算得到。


注意，上例的jquery属性的值是一个数组，可以指定多个路径。如果第一个脚本路 //径不存在，那么就加载第二个路径，以此类推。


（3）rootDirs


rootDirs字段指定模块定位时必须查找的其他目录。


`{
  "compilerOptions": {
    "rootDirs": ["src/zh", "src/de", "src/#{locale}"]
  }
}`


上面示例中，rootDirs指定了模块定位时，需要查找的不同的国际化目录。


### 15.5.5 tsc 的--traceResolution参数


由于模块定位的过程很复杂，tsc 命令有一个--traceResolution参数，能够在编译时在命令行显示模块定位的每一步。


`tsc --traceResolution`


### 15.5.6 tsc 的--noResolve参数


tsc 命令的--noResolve参数，表示模块定位时，只考虑在命令行传入的模块。


举例来说，app.ts包含如下两行代码。


`import * as A from "moduleA";
import * as B from "moduleB";`


使用下面的命令进行编译。


`tsc app.ts moduleA.ts --noResolve`


上面命令使用--noResolve参数，因此可以定位到moduleA.ts，因为它从命令行传入了；无法定位到moduleB，因为它没有传入，因此会报错。


# 十六、TypeScript namespace


namespace 是一种将相关代码组织在一起的方式，中文译为“命名空间”。


## 16.1 基本用法


namespace 用来建立一个容器，内部的所有变量和函数，都必须在这个容器里面使用。


`namespace Utils {
  function isString(value: any) {
    return typeof value === "string";
  }

  // 正确
  isString("yes");
}

Utils.isString("no"); // 报错`


如果要在命名空间以外使用内部成员，就必须为该成员加上export前缀，表示对外输出该成员。


`namespace Utility {
  export function log(msg: string) {
    console.log(msg);
  }
  export function error(msg: string) {
    console.error(msg);
  }
}

Utility.log("Call me");
Utility.error("maybe!");`


只要加上export前缀，就可以在命名空间外部使用内部成员。


编译出来的 JavaScript 代码如下。


`namespace Utility {
  export function log(msg: string) {
    console.log(msg);
  }
  export function error(msg: string) {
    console.error(msg);
  }
}

Utility.log("Call me");
Utility.error("maybe!");`


上面代码中，命名空间Utility变成了 JavaScript 的一个对象，凡是export的内部成员，都成了该对象的属性。


这就是说，namespace 会变成一个值，保留在编译后的代码中。这一点要小心，它不是纯的类型代码。


namespace 内部还可以使用import命令输入外部成员，相当于为外部成员起别名。当外部成员的名字比较长时，别名能够简化代码。


`namespace Utils {
  export function isString(value: any) {
    return typeof value === "string";
  }
}

namespace App {
  import isString = Utils.isString;

  isString("yes");
  // 等同于
  Utils.isString("yes");
}`


import命令指定在命名空间App里面，外部成员Utils.isString的别名为isString。


import命令也可以在 namespace 外部，指定别名。


`namespace Shapes {
  export namespace Polygons {
    export class Triangle {}
    export class Square {}
  }
}

import polygons = Shapes.Polygons;

// 等同于 new Shapes.Polygons.Square()
let sq = new polygons.Square();`


import命令在命名空间Shapes的外部，指定 Shapes.Polygons的别名为polygons。


namespace 可以嵌套。


`namespace Utils {
  export namespace Messaging {
    export function log(msg: string) {
      console.log(msg);
    }
  }
}

Utils.Messaging.log("hello"); // "hello"`


注意，如果要在外部使用Messaging，必须在它前面加上export命令。


使用嵌套的命名空间，必须从最外层开始引用，比如Utils.Messaging.log()。


namespace 不仅可以包含实义代码，还可以包括类型代码。


`namespace N {
  export interface MyInterface {}
  export class MyClass {}
}`


namespace 与模块的作用是一致的，都是把相关代码组织在一起，对外输出接口。区别是一个文件只能有一个模块，但可以有多个 namespace。由于模块可以取代namespace，而且是 JavaScript 的标准语法，还不需要编译转换，所以建议总是使用模块，替代 namespace。


如果 namespace 代码放在一个单独的文件里，那么引入这个文件需要使用三斜杠的语法。


`/// <reference path = "SomeFileName.ts" />`


## 16.2 namespace 的输出


namespace 本身也可以使用export命令输出，供其他文件使用。


`// shapes.ts
export namespace Shapes {
  export class Triangle {
    // ...
  }
  export class Square {
    // ...
  }
}`


其他脚本文件使用import命令，加载这个命名空间。


`// 写法一
import { Shapes } from "./shapes";
let t = new Shapes.Triangle();

// 写法二
import * as shapes from "./shapes";
let t = new shapes.Shapes.Triangle();`


不过，更好的方法还是建议使用模块，采用模块的输出和输入。


`// shapes.ts
export class Triangle {
  /* ... */
}
export class Square {
  /* ... */
}

// shapeConsumer.ts
import * as shapes from "./shapes";
let t = new shapes.Triangle();`


## 16.3 namespace 的合并


多个同名的 namespace 会自动合并，这一点跟 interface 一样。


`namespace Animals {
  export class Cat {}
}
namespace Animals {
  export interface Legged {
    numberOfLegs: number;
  }
  export class Dog {}
}

// 等同于
namespace Animals {
  export interface Legged {
    numberOfLegs: number;
  }
  export class Cat {}
  export class Dog {}
}`


这样做的目的是，如果同名的命名空间分布在不同的文件中，TypeScript 最终会它们合并在一起。这样就比较方便扩展别人的代码。


合并命名空间时，命名空间中的非export的成员不会被合并，但是它们只能在各自的命名空间中使用。


`namespace N {
  const a = 0;

  export function foo() {
    console.log(a); // 正确
  }
}

namespace N {
  export function bar() {
    foo(); // 正确
    console.log(a); // 报错
  }
}`


命名空间还可以跟同名函数合并，但是要求同名函数必须在命名空间之前声明。这样做是为了确保先创建出一个函数对象，然后同名的命名空间就相当于给这个函数对象添加额外的属性。


`function f() {
  return f.version;
}

namespace f {
  export const version = "1.0";
}

f(); // '1.0'
f.version; // '1.0'`


命名空间也能与同名 class 合并，同样要求class 必须在命名空间之前声明，原因同上。


`class C {
  foo = 1;
}

namespace C {
  export const bar = 2;
}

C.bar; // 2`


命名空间还能于同名 Enum 合并。


`enum E {
  A,
  B,
  C,
}

namespace E {
  export function foo() {
    console.log(E.C);
  }
}

E.foo(); // 2`


注意，Enum 成员与命名空间导出成员不允许同名。


`enum E {
  A, // 报错
  B,
}

namespace E {
  export function A() {} // 报错
}`


# 十七、TypeScript 装饰器


## 17.1 简介


装饰器（Decorator）是一种语法结构，用来在定义时修改类（class）的行为。


在语法上，装饰器有如下几个特征。


（1）第一个字符（或者说前缀）是@，后面是一个表达式。


（2）@后面的表达式，必须是一个函数（或者执行后可以得到一个函数）。


（3）这个函数接受所修饰对象的一些相关值作为参数。


（4）这个函数要么不返回值，要么返回一个新对象取代所修饰的目标对象。


下面就是一个最简单的装饰器。


`function simpleDecorator() {
  console.log("hi");
}

@simpleDecorator
class A {} // "hi"`


上面示例中，函数simpleDecorator()用作装饰器，附加在类A之上，后者在代码解析时就会打印一行日志。


编译上面的代码会报错，提示没有用到装饰器的参数。现在就为装饰器加上参数，让它更像正式运行的代码。


`function simpleDecorator(target: any, context: any) {
  console.log("hi, this is " + target);
  return target;
}

@simpleDecorator
class A {} // "hi, this is class A {}"`


类A在执行前会先执行装饰器simpleDecorator()，并且会向装饰器自动传入参数就可以了。


装饰器有多种形式，基本上只要在@符号后面添加表达式都是可以的。下面都是合法的装饰器。


`@myFunc
@myFuncFactory(arg1, arg2)

@libraryModule.prop
@someObj.method(123)

@(wrap(dict['prop']))`


注意，@后面的表达式，最终执行后得到的应该是一个函数。 相比使用子类改变父类，装饰器更加简洁优雅，缺点是不那么直观，功能也受到一些限制。所以，装饰器一般只用来为类添加某种特定行为。


`@frozen
class Foo {
  @configurable(false)
  @enumerable(true)
  method() {}

  @throttle(500)
  expensiveMethod() {}
}`


上面示例中，一共有四个装饰器，一个用在类本身（@frozen），另外三个用在类的方法（@configurable、@enumerable、@throttle）。它们不仅增加了代码的可读性，清晰地表达了意图，而且提供一种方便的手段，增加或修改类的功能。


## 17.2 装饰器的版本


目前，TypeScript 5.0 同时支持两种装饰器语法。标准语法可以直接使用，传统语法需要打开--experimentalDecorators编译参数。


`tsc --target ES5 --experimentalDecorators`


## 17.3 装饰器的结构


装饰器函数的类型定义如下。


`type Decorator = (
  value: DecoratedValue,
  context: {
    kind: string;
    name: string | symbol;
    addInitializer?(initializer: () => void): void;
    static?: boolean;
    private?: boolean;
    access: {
      get?(): unknown;
      set?(value: unknown): void;
    };
  }
) => void | ReplacementValue;`


上面代码中，Decorator是装饰器的类型定义。它是一个函数，使用时会接收到 value和context两个参数。

- value：所装饰的对象。
- context：上下文对象，TypeScript 提供一个原生接口ClassMethodDecoratorContext，描述这个对象。

`function decorator(value: any, context: ClassMethodDecoratorContext) {
  // ...
}`


上面是一个装饰器函数，其中第二个参数context的类型就可以写成ClassMethodDecoratorContext。


context对象的属性，根据所装饰对象的不同而不同，其中只有两个属性（kind和name）是必有的，其他都是可选的。 （1）kind：字符串，表示所装饰对象的类型，可能取以下的值。

- 'class'
- 'method'
- 'getter'
- 'setter'
- 'field'
- 'accessor'

这表示一共有六种类型的装饰器。


（2）name：字符串或者 Symbol 值，所装饰对象的名字，比如类名、属性名等。


（3）addInitializer()：函数，用来添加类的初始化逻辑。以前，这些逻辑通常放在构造函数里面，对方法进行初始化，现在改成以函数形式传入addInitializer()方法。注意，addInitializer()没有返回值。


（4）private：布尔值，表示所装饰的对象是否为类的私有成员。


（5）static：布尔值，表示所装饰的对象是否为类的静态成员。


（6）access：一个对象，包含了某个值的 get 和 set 方法。


## 17.4 类装饰器


类装饰器的类型描述如下。


`type ClassDecorator = (
  value: Function,
  context: {
    kind: "class";
    name: string | undefined;
    addInitializer(initializer: () => void): void;
  }
) => Function | void;`


类装饰器接受两个参数：value（当前类本身）和context（上下文对象）。其中，context对象的kind属性固定为字符串class。


类装饰器一般用来对类进行操作，可以不返回任何值，请看下面的例子。


`function Greeter(value, context) {
  if (context.kind === "class") {
    value.prototype.greet = function () {
      console.log("你好");
    };
  }
}

@Greeter
class User {}

let u = new User();
u.greet(); // "你好"`


类装饰器@Greeter在类User的原型对象上，添加了一个greet()方法，实例就可以直接使用该方法。


类装饰器可以返回一个函数，替代当前类的构造方法。


`function countInstances(value: any, context: any) {
  let instanceCount = 0;

  const wrapper = function (...args: any[]) {
    instanceCount++;
    const instance = new value(...args);
    instance.count = instanceCount;
    return instance;
  } as unknown as typeof MyClass;

  wrapper.prototype = value.prototype; // A
  return wrapper;
}

@countInstances
class MyClass {}

const inst1 = new MyClass();
inst1 instanceof MyClass; // true
inst1.count; // 1`


类装饰器@countInstances返回一个函数，替换了类MyClass的构造方法。新的构造方法实现了实例的计数，每新建一个实例，计数器就会加一，并且对实例添加count属性，表示当前实例的编号。


注意，上例为了确保新构造方法继承定义在MyClass的原型之上的成员，特别加入A行，确保两者的原型对象是一致的。否则，新的构造函数wrapper的原型对象，与MyClass不同，通不过instanceof运算符。


类装饰器也可以返回一个新的类，替代原来所装饰的类。


`function countInstances(value: any, context: any) {
  let instanceCount = 0;

  return class extends value {
    constructor(...args: any[]) {
      super(...args);
      instanceCount++;
      this.count = instanceCount;
    }
  };
}

@countInstances
class MyClass {}

const inst1 = new MyClass();
inst1 instanceof MyClass; // true
inst1.count; // 1`


下面的例子是通过类装饰器，禁止使用new命令新建类的实例。


`function functionCallable(
  value as any, {kind} as any
) {
  if (kind === 'class') {
    return function (...args) {
      if (new.target !== undefined) {
        throw new TypeError('This function can’t be new-invoked');
      }
      return new value(...args);
    }
  }
}

@functionCallable
class Person {
  constructor(name) {
    this.name = name;
  }
}
const robin = Person('Robin');
robin.name // 'Robin'`


上面示例中，类装饰器@functionCallable返回一个新的构造方法，里面判断new.target是否不为空，如果是的，就表示通过new命令调用，从而报错。


类装饰器的上下文对象context的addInitializer()方法，用来定义一个类的初始化函数，在类完全定义结束后执行。


`function customElement(name: string) {
  return <Input extends new (...args: any) => any>(
    value: Input,
    context: ClassDecoratorContext
  ) => {
    context.addInitializer(function () {
      customElements.define(name, value);
    });
  };
}

@customElement("hello-world")
class MyComponent extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `<h1>Hello World</h1>`;
  }
}`


上面示例中，类MyComponent定义完成后，会自动执行类装饰器@customElement()给出的初始化函数，该函数会将当前类注册为指定名称（本例为<hello-world>）的自定义 HTML 元素。


## 17.5 方法装饰器


方法装饰器用来装饰类的方法（method）。它的类型描述如下。


`type ClassMethodDecorator = (
  value: Function,
  context: {
    kind: "method";
    name: string | symbol;
    static: boolean;
    private: boolean;
    access: { get: () => unknown };
    addInitializer(initializer: () => void): void;
  }
) => Function | void;`


方法装饰器是一个函数，接受两个参数：value和context。 参数value是方法本身，参数context是上下文对象，有以下属性。

- kind：值固定为字符串method，表示当前为方法装饰器。
- name：所装饰的方法名，类型为字符串或 Symbol 值。
- static：布尔值，表示是否为静态方法。该属性为只读属性。
- private：布尔值，表示是否为私有方法。该属性为只读属性。
- access：对象，包含了方法的存取器，但是只有get()方法用来取值，没有
- set()方法进行赋值。
- addInitializer()：为方法增加初始化函数。

方法装饰器会改写类的原始方法，实质等同于下面的操作。


`function trace(decoratedMethod) {
  // ...
}

class C {
  @trace
  toString() {
    return "C";
  }
}

// `@trace` 等同于
// C.prototype.toString = trace(C.prototype.toString);`


如果方法装饰器返回一个新的函数，就会替代所装饰的原始函数。


`function replaceMethod() {
  return function () {
    return `How are you, ${this.name}?`;
  };
}

class Person {
  constructor(name) {
    this.name = name;
  }

  @replaceMethod
  hello() {
    return `Hi ${this.name}!`;
  }
}

const robin = new Person("Robin");

robin.hello(); // 'How are you, Robin?'`


上面示例中，装饰器@replaceMethod返回的函数，就成为了新的hello()方法。


`class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @log
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

function log(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }

  return replacementMethod;
}

const person = new Person("张三");
person.greet();
// "LOG: Entering method 'greet'."
// "Hello, my name is 张三."
// "LOG: Exiting method 'greet'."`


上面示例中，装饰器@log的返回值是一个函数replacementMethod，替代了原始方法greet()。在replacementMethod()内部，通过执行originalMethod.call()完成了对原始方法的调用。 利用方法装饰器，可以将类的方法变成延迟执行。


`function delay(milliseconds: number = 0) {
  return function (value, context) {
    if (context.kind === "method") {
      return function (...args: any[]) {
        setTimeout(() => {
          value.apply(this, args);
        }, milliseconds);
      };
    }
  };
}

class Logger {
  @delay(1000)
  log(msg: string) {
    console.log(`${msg}`);
  }
}

let logger = new Logger();
logger.log("Hello World");`


上面示例中，方法装饰器@delay(1000)将方法log()的执行推迟了1秒（1000毫秒）。这里真正的方法装饰器，是delay()执行后返回的函数，delay()的作用是接收参数，用来设置推迟执行的时间。这种通过高阶函数返回装饰器的做法，称为“工厂模式”，即可以像工厂那样生产出一个模子的装饰器。


方法装饰器的参数context对象里面，有一个addInitializer()方法。它是一个钩子方法，用来在类的初始化阶段，添加回调函数。这个回调函数就是作为addInitializer()的参数传入的，它会在构造方法执行期间执行，早于属性（field）的初始化。


下面是addInitializer()方法的一个例子。我们知道，类的方法往往需要在构造方法里面，进行this的绑定。


`class Person {
  name: string;
  constructor(name: string) {
    this.name = name;

    // greet() 绑定 this
    this.greet = this.greet.bind(this);
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const g = new Person("张三").greet;
g(); // "Hello, my name is 张三."`


上面例子中，类Person的构造方法内部，将this与greet()方法进行了绑定。如果没有这一行，将greet()赋值给变量g进行调用，就会报错了。


this的绑定必须放在构造方法里面，因为这必须在类的初始化阶段完成。现在，它可以移到方法装饰器的addInitializer()里面。


`function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  if (context.private) {
    throw new Error(`不能绑定私有方法 ${methodName as string}`);
  }
  context.addInitializer(function () {
    this[methodName] = this[methodName].bind(this);
  });
}`


下面再看一个例子，通过addInitializer()将选定的方法名，放入一个集合。


`function collect(value, { name, addInitializer }) {
  addInitializer(function () {
    if (!this.collectedMethodKeys) {
      this.collectedMethodKeys = new Set();
    }
    this.collectedMethodKeys.add(name);
  });
}

class C {
  @collect
  toString() {}

  @collect
  [Symbol.iterator]() {}
}

const inst = new C();
inst.collectedMethodKeys; // new Set(['toString', Symbol.iterator])`


## 17.6 属性装饰器


属性装饰器用来装饰定义在类顶部的属性（field）。它的类型描述如下。


`type ClassFieldDecorator = (
  value: undefined,
  context: {
    kind: "field";
    name: string | symbol;
    static: boolean;
    private: boolean;
    access: { get: () => unknown; set: (value: unknown) => void };
    addInitializer(initializer: () => void): void;
  }
) => (initialValue: unknown) => unknown | void;`


注意，装饰器的第一个参数value的类型是undefined，这意味着这个参数实际上没用的，装饰器不能从value获取所装饰属性的值。另外，第二个参数context对象的kind属性的值为字符串field，而不是“property”或“attribute”，这一点是需要注意的。


属性装饰器要么不返回值，要么返回一个函数，该函数会自动执行，用来对所装饰属性进行初始化。该函数的参数是所装饰属性的初始值，该函数的返回值是该属性的最终值。


`function logged(value, context) {
  const { kind, name } = context;
  if (kind === "field") {
    return function (initialValue) {
      console.log(`initializing ${name} with value ${initialValue}`);
      return initialValue;
    };
  }
}

class Color {
  @logged name = "green";
}

const color = new Color();
// "initializing name with value green"`


上面示例中，属性装饰器@logged装饰属性name。@logged的返回值是一个函数，该函数用来对属性name进行初始化，它的参数initialValue就是属性name的初始值green。新建实例对象color时，该函数会自动执行。


属性装饰器的返回值函数，可以用来更改属性的初始值。


`function twice() {
  return (initialValue) => initialValue * 2;
}

class C {
  @twice
  field = 3;
}

const inst = new C();
inst.field; // 6`


属性装饰器的上下文对象context的access属性，提供所装饰属性的存取器，请看 下面的例子。


`let acc;

function exposeAccess(value, { access }) {
  acc = access;
}

class Color {
  @exposeAccess
  name = "green";
}

const green = new Color();
green.name; // 'green'

acc.get(green); // 'green'

acc.set(green, "red");
green.name; // 'red'`


上面示例中，access包含了属性name的存取器，可以对该属性进行取值和赋值。


## 17.7 getter 装饰器，setter 装饰器


getter 装饰器和 setter 装饰器，是分别针对类的取值器（getter）和存值器（setter）的装饰器。它们的类型描述如下。


`type ClassGetterDecorator = (
  value: Function,
  context: {
    kind: "getter";
    name: string | symbol;
    static: boolean;
    private: boolean;
    access: { get: () => unknown };
    addInitializer(initializer: () => void): void;
  }
) => Function | void;

type ClassSetterDecorator = (
  value: Function,
  context: {
    kind: "setter";
    name: string | symbol;
    static: boolean;
    private: boolean;
    access: { set: (value: unknown) => void };
    addInitializer(initializer: () => void): void;
  }
) => Function | void;`


注意，getter 装饰器的上下文对象context的access属性，只包含get()方法；setter 装饰器的access属性，只包含set()方法。


这两个装饰器要么不返回值，要么返回一个函数，取代原来的取值器或存值器。


下面的例子是将取值器的结果，保存为一个属性，加快后面的读取。


`class C {
  @lazy
  get value() {
    console.log("正在计算……");
    return "开销大的计算结果";
  }
}

function lazy(value: any, { kind, name }: any) {
  if (kind === "getter") {
    return function (this: any) {
      const result = value.call(this);
      Object.defineProperty(this, name, {
        value: result,
        writable: false,
      });
      return result;
    };
  }
  return;
}

const inst = new C();
inst.value;
// 正在计算……
// '开销大的计算结果'
inst.value;
// '开销大的计算结果'`


上面示例中，第一次读取inst.value，会进行计算，然后装饰器@lazy将结果存入只读属性value，后面再读取这个属性，就不会进行计算了。


## 17.8 accessor 装饰器


装饰器语法引入了一个新的属性修饰符accessor。


`class C {
  accessor x = 1;
}`


accessor修饰符等同于为属性x自动生成取值器和存值器，它们作用于私有属性x。也就是说，上面的代码等同于下面的代码。


`class C {
  #x = 1;

  get x() {
    return this.#x;
  }

  set x(val) {
    this.#x = val;
  }
}`


accessor也可以与静态属性和私有属性一起使用。


`class C {
  static accessor x = 1;
  accessor #y = 2;
}`


accessor 装饰器的类型如下。


`type ClassAutoAccessorDecorator = (
  value: {
    get: () => unknown;
    set: (value: unknown) => void;
  },
  context: {
    kind: "accessor";
    name: string | symbol;
    access: { get(): unknown; set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  }
) => {
  get?: () => unknown;
  set?: (value: unknown) => void;
  init?: (initialValue: unknown) => unknown;
} | void;`


accessor 装饰器的value参数，是一个包含get()方法和set()方法的对象。该装饰器可以不返回值，或者返回一个新的对象，用来取代原来的get()方法和set()方法。此外，装饰器返回的对象还可以包括一个init()方法，用来改变私有属性的初始值。


`class C {
  @logged accessor x = 1;
}

function logged(value, { kind, name }) {
  if (kind === "accessor") {
    let { get, set } = value;

    return {
      get() {
        console.log(`getting ${name}`);

        return get.call(this);
      },

      set(val) {
        console.log(`setting ${name} to ${val}`);

        return set.call(this, val);
      },

      init(initialValue) {
        console.log(`initializing ${name} with value ${initialValue}`);
        return initialValue;
      },
    };
  }
}

let c = new C();

c.x;
// getting x

c.x = 123;
// setting x to 123`


上面示例中，装饰器@logged为属性x的存值器和取值器，加上了日志输出。


## 17.9 装饰器的执行顺序


装饰器的执行分为两个阶段。


（1）评估（evaluation）：计算@符号后面的表达式的值，得到的应该是函数。


（2）应用（application）：将评估装饰器后得到的函数，应用于所装饰对象。


也就是说，装饰器的执行顺序是，先评估所有装饰器表达式的值，再将其应用于当前类。


应用装饰器时，顺序依次为方法装饰器和属性装饰器，然后是类装饰器。


`function d(str: string) {
  console.log(`评估 @d(): ${str}`);
  return (value: any, context: any) => console.log(`应用 @d(): ${str}`);
}

function log(str: string) {
  console.log(str);
  return str;
}

@d("类装饰器")
class T {
  @d("静态属性装饰器")
  static staticField = log("静态属性值");

  @d("原型方法")
  [log("计算方法名")]() {}

  @d("实例属性")
  instanceField = log("实例属性值");
}`


上面示例中，类T有四种装饰器：类装饰器、静态属性装饰器、方法装饰器、属性装饰器。


它的运行结果如下。


`// "评估 @d(): 类装饰器"
// "评估 @d(): 静态属性装饰器"
// "评估 @d(): 原型方法"
// "计算方法名"
// "评估 @d(): 实例属性"
// "应用 @d(): 原型方法"
// "应用 @d(): 静态属性装饰器"
// "应用 @d(): 实例属性"
// "应用 @d(): 类装饰器"
// "静态属性值"`


可以看到，类载入的时候，代码按照以下顺序执行。


（1）装饰器评估：这一步计算装饰器的值，首先是类装饰器，然后是类内部的装饰器，按照它们出现的顺序。


注意，如果属性名或方法名是计算值（本例是“计算方法名”），则它们在对应的装饰器评估之后，也会进行自身的评估。


（2）装饰器应用：实际执行装饰器函数，将它们与对应的方法和属性进行结合。


原型方法的装饰器首先应用，然后是静态属性和静态方法装饰器，接下来是实例属性装饰器，最后是类装饰器。


注意，“实例属性值”在类初始化的阶段并不执行，直到类实例化时才会执行。


如果一个方法或属性有多个装饰器，则内层的装饰器先执行，外层的装饰器后执行。


`class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @bound
  @log
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}`


上面示例中，greet()有两个装饰器，内层的@log先执行，外层的@bound针对得到的结果再执行。


# 十八、装饰器（旧语法）


TypeScript 早在2014年就支持装饰器，不过使用的是旧语法。


## 18.1 experimentalDecorators 编译选项


使用装饰器的旧语法，需要打开--experimentalDecorators编译选项。


`tsc --target ES5 --experimentalDecorators`


此外，还有另外一个编译选项--emitDecoratorMetadata，用来产生一些装饰器的元数据，供其他工具或某些模块（比如 reflect-metadata ）使用。 这两个编译选项可以在命令行设置，也可以在tsconfig.json文件里面进行设置。


`{
  "compilerOptions": {
    "target": "ES6",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}`


## 18.2 装饰器的种类


按照所装饰的不同对象，装饰器可以分成五类。

- 类装饰器（Class Decorators）：用于类。
- 属性装饰器（Property Decorators）：用于属性。
- 方法装饰器（Method Decorators）：用于方法。
- 存取器装饰器（Accessor Decorators）：用于类的 set 或 get 方法。
- 参数装饰器（Parameter Decorators）：用于方法的参数。

`@ClassDecorator() // （A）
class A {
  @PropertyDecorator() // （B）
  name: string;

  @MethodDecorator() //（C）
  fly(
    @ParameterDecorator() // （D）
    meters: number
  ) {
    // code
  }

  @AccessorDecorator() // （E）
  get egg() {
    // code
  }
  set egg(e) {
    // code
  }
}`


上面示例中，A 是类装饰器，B 是属性装饰器，C 是方法装饰器，D 是参数装饰器，E 是存取器装饰器。


注意，构造方法没有方法装饰器，只有参数装饰器。类装饰器其实就是在装饰构造方法。


另外，装饰器只能用于类，要么应用于类的整体，要么应用于类的内部成员，不能用于独立的函数。


## 18.3 类装饰器


类装饰器应用于类（class），但实际上是应用于类的构造方法。


类装饰器有唯一参数，就是构造方法，可以在装饰器内部，对构造方法进行各种改造。如果类装饰器有返回值，就会替换掉原来的构造方法。


类装饰器的类型定义如下。


`type ClassDecorator = <TFunction extends Function>(
  target: TFunction
) => TFunction | void;`


上面定义中，类型参数TFunction必须是函数，实际上就是构造方法。类装饰器的返回值，要么是返回处理后的原始构造方法，要么返回一个新的构造方法。


`function f(target: any) {
  console.log("apply decorator");
  return target;
}

@f
class A {}
// 输出：apply decorator`


上面示例中，使用了装饰器@f，因此类A的构造方法会自动传入f。


类A不需要新建实例，装饰器也会执行。装饰器会在代码加载阶段执行，而不是在运行时执行，而且只会执行一次。


由于 TypeScript 存在编译阶段，所以装饰器对类的行为的改变，实际上发生在编译阶段。这意味着，TypeScript 装饰器能在编译阶段运行代码，也就是说，它本质就是编译时执行的函数。


`@sealed
class BugReport {
  type = "report";
  title: string;

  constructor(t: string) {
    this.title = t;
  }
}

function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}`


上面示例中，装饰器@sealed()会锁定BugReport这个类，使得它无法新增或删除静态成员和实例成员。


如果除了构造方法，类装饰器还需要其他参数，可以采取“工厂模式”，即把装饰器写在一个函数里面，该函数可以接受其他参数，执行后返回装饰器。但是，这样就需要调用装饰器的时候，先执行一次工厂函数。


`function factory(info: string) {
  console.log("received: ", info);
  return function (target: any) {
    console.log("apply decorator");
    return target;
  };
}

@factory("log something")
class A {}`


函数factory()的返回值才是装饰器，所以加载装饰器的时候，要先执行一次@factory('log something')，才能得到装饰器。这样做的好处是，可以加入额外的参数，本例是参数info。


总之，@后面要么是一个函数名，要么是函数表达式，甚至可以写出下面这样的代码。


`@((constructor: Function) => {
  console.log("log something");
})
class InlineDecoratorExample {
  // ...
}`


@后面是一个箭头函数，这也是合法的。


类装饰器可以没有返回值，如果有返回值，就会替代所装饰的类的构造函数。由于JavaScript 的类等同于构造函数的语法糖，所以装饰器通常返回一个新的类，对原有的类进行修改或扩展。


`function decorator(target: any) {
  return class extends target {
    value = 123;
  };
}

@decorator
class Foo {
  value = 456;
}

const foo = new Foo();
console.log(foo.value); // 123`


## 18.4 方法装饰器


方法装饰器用来装饰类的方法，它的类型定义如下。


`type MethodDecorator = <T>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;`


方法装饰器一共可以接受三个参数。

- target：（对于类的静态方法）类的构造函数，或者（对于类的实例方法）类的原型。
- propertyKey：所装饰方法的方法名，类型为string|symbol。
- descriptor：所装饰方法的描述对象。

方法装饰器的返回值（如果有的话），就是修改后的该方法的描述对象，可以覆盖原始方法的描述对象。


`function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value;
  };
}

class Greeter {
  greeting: string;

  constructor(message: string) {
    this.greeting = message;
  }

  @enumerable(false)
  greet() {
    return "Hello, " + this.greeting;
  }
}`


方法装饰器@enumerable()装饰 Greeter 类的greet()方法，作用是修改该方法的描述对象的可遍历性属性enumerable。@enumerable(false)表示将该方法修改成不可遍历。


## 18.5 属性装饰器


属性装饰器用来装饰属性，类型定义如下。


`type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;`


属性装饰器函数接受两个参数。

- target：（对于实例属性）类的原型对象（prototype），或者（对于静态属性）类的构造函数。
- propertyKey：所装饰属性的属性名，注意类型有可能是字符串，也有可能是Symbol 值。

属性装饰器不需要返回值，如果有的话，也会被忽略。


`function ValidRange(min: number, max: number) {
  return (target: Object, key: string) => {
    Object.defineProperty(target, key, {
      set: function (v: number) {
        if (v < min || v > max) {
          throw new Error(`Not allowed value ${v}`);
        }
      },
    });
  };
}

// 输出 Installing ValidRange on year
class Student {
  @ValidRange(1920, 2020)
  year!: number;
}

const stud = new Student();

// 报错 Not allowed value 2022
stud.year = 2022;`


上面示例中，装饰器ValidRange对属性year设立了一个上下限检查器，只要该属性赋值时，超过了上下限，就会报错。


注意，属性装饰器的第一个参数，对于实例属性是类的原型对象，而不是实例对象（即不是this对象）。这是因为装饰器执行时，类还没有新建实例，所以实例对象不存在。


由于拿不到this，所以属性装饰器无法获得实例属性的值。这也是它没有在参数里面提供属性描述对象的原因。


`function logProperty(target: Object, member: string) {
  const prop = Object.getOwnPropertyDescriptor(target, member);
  console.log(`Property ${member} ${prop}`);
}

class PropertyExample {
  @logProperty
  name: string = "Foo";
}
// 输出 Property name undefined`


上面示例中，属性装饰器@logProperty内部想要获取实例属性name的属性描述对象，结果拿到的是undefined。因为上例的target是类的原型对象，不是实例对象，所以拿不到name属性，也就是说target.name是不存在的，所以拿到的是undefined。只有通过this.name才能拿到name属性，但是这时this还不存在。


属性装饰器不仅无法获得实例属性的值，也不能初始化或修改实例属性，而且它的返回值也会被忽略。因此，它的作用很有限。


不过，如果属性装饰器设置了当前属性的存取器（getter/setter），然后在构造函数里面就可以对实例属性进行读写。


`function Min(limit: number) {
  return function (target: Object, propertyKey: string) {
    let value: string;

    const getter = function () {
      return value;
    };

    const setter = function (newVal: string) {
      if (newVal.length < limit) {
        throw new Error(`Your password should be bigger than ${limit}`);
      } else {
        value = newVal;
      }
    };
    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
    });
  };
}

class User {
  username: string;

  @Min(8)
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}

const u = new User("Foo", "pass");
// 报错 Your password should be bigger than 8`


## 18.6 存取器装饰器


存取器装饰器用来装饰类的存取器（accessor）。所谓“存取器”指的是某个属性的取值器（getter）和存值器（setter）。


存取器装饰器的类型定义，与方法装饰器一致。


`type AccessorDecorator = <T>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;`


存取器装饰器有三个参数。

- target：（对于静态属性的存取器）类的构造函数，或者（对于实例属性的存取器）类的原型。
- propertyKey：存取器的属性名。
- descriptor：存取器的属性描述对象。

存取器装饰器的返回值（如果有的话），会作为该属性新的描述对象。


`function configurable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = value;
  };
}

class Point {
  private _x: number;
  private _y: number;
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  @configurable(false)
  get x() {
    return this._x;
  }

  @configurable(false)
  get y() {
    return this._y;
  }
}`


上面示例中，装饰器@configurable(false)关闭了所装饰属性（x和y）的属性描述对象的configurable键（即关闭了属性的可配置性）。


TypeScript 不允许对同一个属性的存取器（getter 和 setter）使用同一个装饰器，也就是说只能装饰两个存取器里面的一个，且必须是排在前面的那一个，否则报错。


`// 报错
class Person {
  #name: string;

  @Decorator
  set name(n: string) {
    this.#name = n;
  }

  @Decorator // 报错
  get name() {
    return this.#name;
  }
}`


但是，下面的写法不会报错。


`class Person {
  #name: string;

  @Decorator
  set name(n: string) {
    this.#name = n;
  }
  get name() {
    return this.#name;
  }
}`


上面示例中，@Decorator只装饰它后面第一个出现的存值器（set name()），并不装饰取值器（get name()），所以不报错。


装饰器之所以不能同时用于同一个属性的存值器和取值器，原因是装饰器可以从属性描述对象上面，同时拿到取值器和存值器，因此只调用一次就够了。


## 18.7 参数装饰器


参数装饰器用来装饰构造方法或者其他方法的参数。它的类型定义如下。


`type ParameterDecorator = (
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) => void;`


参数装饰器接受三个参数。

- target：（对于静态方法）类的构造函数，或者（对于类的实例方法）类的原型对象。
- propertyKey：所装饰的方法的名字，类型为string|symbol。
- parameterIndex：当前参数在方法的参数序列的位置（从0开始）。

该装饰器不需要返回值，如果有的话会被忽略。


`function log(
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) {
  console.log(`${String(propertyKey)} NO.${parameterIndex} Parameter`);
}

class C {
  member(@log x: number, @log y: number) {
    console.log(`member Paremeters: ${x} ${y}`);
  }
}

const c = new C();
c.member(5, 5);
// member NO.1 Parameter
// member NO.0 Parameter
// member Paremeters: 5 5`


上面示例中，参数装饰器会输出参数的位置序号。注意，后面的参数会先输出。


跟其他装饰器不同，参数装饰器主要用于输出信息，没有办法修改类的行为。


## 18.8 装饰器的执行顺序


装饰器只会执行一次，就是在代码解析时执行，哪怕根本没有调用类新建实例，也会执行，而且从此就不再执行了。 执行装饰器时，按照如下顺序执行。

1. 实例相关的装饰器。
2. 静态相关的装饰器。
3. 构造方法的参数装饰器。
4. 类装饰器。

`function f(key: string): any {
  return function () {
    console.log("执行：", key);
  };
}

@f("类装饰器")
class C {
  @f("静态方法")
  static method() {}

  @f("实例方法")
  method() {}

  constructor(@f("构造方法参数") foo: any) {}
}`


加载上面的示例，输出如下。


`执行： 实例方法
执行： 静态方法
执行： 构造方法参数
执行： 类装饰器`


同一级装饰器的执行顺序，是按照它们的代码顺序。但是，参数装饰器的执行总是早于方法装饰器。


`function f(key: string): any {
  return function () {
    console.log("执行：", key);
  };
}

class C {
  @f("方法1")
  m1(@f("参数1") foo: any) {}

  @f("属性1")
  p1: number;

  @f("方法2")
  m2(@f("参数2") foo: any) {}

  @f("属性2")
  p2: number;
}`


`执行： 参数1
执行： 方法1
执行： 属性1
执行： 参数2
执行： 方法2
执行： 属性2`


上面示例中，实例装饰器的执行顺序，完全是按照代码顺序的。但是，同一个方法的参数装饰器，总是早于该方法的方法装饰器执行。


如果同一个方法或属性有多个装饰器，那么装饰器将顺序加载、逆序执行。


`function f(key: string): any {
  console.log("加载：", key);
  return function () {
    console.log("执行：", key);
  };
}

class C {
  @f("A")
  @f("B")
  @f("C")
  m1() {}
}
// 加载： A
// 加载： B
// 加载： C
// 执行： C
// 执行： B
// 执行： A`


如果同一个方法有多个参数，那么参数也是顺序加载、逆序执行。


`function f(key: string): any {
  console.log("加载：", key);
  return function () {
    console.log("执行：", key);
  };
}

class C {
  method(@f("A") a: any, @f("B") b: any, @f("C") c: any) {}
}
// 加载： A
// 加载： B
// 加载： C
// 执行： C
// 执行： B
// 执行： A`


## 18.9 为什么装饰器不能用于函数？


装饰器只能用于类和类的方法，不能用于函数，主要原因是存在函数提升。 JavaScript 的函数不管在代码的什么位置，都会提升到代码顶部。


如果允许装饰器可以用于普通函数，那么就有可能导致意想不到的情况。


`let counter = 0;

let add = function (target:any) {
  counter++;
};

@add
function foo() {
  //...
}`


上面示例中，本来的意图是装饰器@add每使用一次，变量counter就加1，但是实际上会报错，因为函数提升的存在，使得实际执行的代码是下面这样。


`@add // 报错
function foo() {
  //...
}

let counter = 0;
let add = function (target:any) {
  counter++;
};`


总之，由于存在函数提升，使得装饰器不能用于函数。类是不会提升的，所以就没有这方面的问题。 另一方面，如果一定要装饰函数，可以采用高阶函数的形式直接执行，没必要写成装饰器。


`function doSomething(name) {
  console.log("Hello, " + name);
}

function loggingDecorator(wrapped) {
  return function () {
    console.log("Starting");
    const result = wrapped.apply(this, arguments);
    console.log("Finished");
    return result;
  };
}

const wrapped = loggingDecorator(doSomething);`


## 18.10 多个装饰器的合成


多个装饰器可以应用于同一个目标对象，可以写在一行。


`@f @g x`


多个装饰器也可以写成多行。


`@f
@g
x`


多个装饰器的效果，类似于函数的合成，按照从里到外的顺序执行。对于上例来说，就是执行f(g(x))。


前面也说过，如果f和g是表达式，那么需要先从外到里求值。


# 十九、declare 关键字


## 19.1 简介


declare 关键字用来告诉编译器，某个类型是存在的，可以在当前文件中使用。


它的主要作用，就是让当前文件可以使用其他文件声明的类型。举例来说，自己的脚本使用外部库定义的函数，编译器会因为不知道外部函数的类型定义而报错，这时就可以在自己的脚本里面使用declare关键字，告诉编译器外部函数的类型。这样的话，编译单个脚本就不会因为使用了外部类型而报错。


declare 关键字可以描述以下类型。

- 变量（const、let、var 命令声明）
- type 或者 interface 命令声明的类型
- class
- enum
- 函数（function）
- 模块（module）
- 命名空间（namespace）

declare 关键字的重要特点是，它只是通知编译器某个类型是存在的，不用给出具体实现。


declare 只能用来描述已经存在的变量和数据结构，不能用来声明新的变量和数据结构。另外，所有 declare 语句都不会出现在编译后的文件里面。


## 19.2 declare variable


declare 关键字可以给出外部变量的类型描述。


举例来说，当前脚本使用了其他脚本定义的全局变量x。


`x = 123; // 报错`


上面示例中，变量x是其他脚本定义的，当前脚本不知道它的类型，编译器就会报错。 这时使用 declare 命令给出它的类型，就不会报错了。


`declare let x: number;
x = 1;`


如果 declare 关键字没有给出变量的具体类型，那么变量类型就是any。


`declare let x;
x = 1;`


下面的例子是脚本使用浏览器全局对象document。


`declare var document;
document.title = "Hello";`


上面示例中，declare 告诉编译器，变量document的类型是外部定义的（具体定义在 TypeScript 内置文件lib.d.ts）。


如果 TypeScript 没有找到document的外部定义，这里就会假定它的类型是any。


注意，declare 关键字只用来给出类型描述，是纯的类型代码，不允许设置变量的初始值，即不能涉及值。


`// 报错
declare let x: number = 1;`


## 19.3 declare function


declare 关键字可以给出外部函数的类型描述。


`declare function sayHello(name: string): void;

sayHello("张三");`


注意，这种单独的函数类型声明语句，只能用于declare命令后面。一方面，TypeScript 不支持单独的函数类型声明语句；另一方面，declare 关键字后面也不能带有函数的具体实现。


## 19.4 declare class


declare 给出 class 的描述描述写法如下。


`declare class Animal {
  constructor(name: string);
  eat(): void;
  sleep(): void;
}`


`declare class C {
  // 静态成员
  public static s0(): string;
  private static s1: string;

  // 属性
  public a: number;
  private b: number;

  // 构造函数
  constructor(arg: number);

  // 方法
  m(x: number, y: number): number;

  // 存取器
  get c(): number;
  set c(value: number);

  // 索引签名
  [index: string]: any;
}`


declare 后面不能给出 Class 的具体实现或初始值。


## 19.5 declare module，declare namespace


如果想把变量、函数、类组织在一起，可以将 declare 与 module 或 namespace 一起使用。


`declare namespace AnimalLib {
  class Animal {
    constructor(name: string);
    eat(): void;
    sleep(): void;
  }

  type Animals = "Fish" | "Dog";
}

// 或者
declare module AnimalLib {
  class Animal {
    constructor(name: string);
    eat(): void;
    sleep(): void;
  }

  type Animals = "Fish" | "Dog";
}`


上面示例中，declare 关键字给出了 module 或 namespace 的类型描述。 declare module 和 declare namespace 里面，加不加 export 关键字都可以。


`declare namespace Foo {
  export var a: boolean;
}

declare module "io" {
  export function readFile(filename: string): string;
}`


下面的例子是当前脚本使用了myLib这个外部库，它有方法makeGreeting()和属性numberOfGreetings。


`let result = myLib.makeGreeting("你好");
console.log("欢迎词：" + result);
let count = myLib.numberOfGreetings;`


myLib的类型描述就可以这样写。


`declare namespace myLib {
  function makeGreeting(s: string): string;
  let numberOfGreetings: number;
}`


declare 关键字的另一个用途，是为外部模块添加属性和方法时，给出新增部分的类型描述。


`import { Foo as Bar } from "moduleA";

declare module "moduleA" {
  interface Bar extends Foo {
    custom: {
      prop1: string;
    };
  }
}`


下面是另一个例子。一个项目有多个模块，可以在一个模型中，对另一个模块的接口进行类型扩展。


`// a.ts
export interface A {
  x: number;
}

// b.ts
import { A } from "./a";

declare module "./a" {
  interface A {
    y: number;
  }
}

const a: A = { x: 0, y: 0 };`


上面示例中，脚本a.ts定义了一个接口A，脚本b.ts为这个接口添加了属性y。declare module './a' {}表示对a.ts里面的模块，进行类型声明，而同名interface 会自动合并，所以等同于扩展类型。


使用这种语法进行模块的类型扩展时，有几点需要注意：


（1）declare module NAME语法里面的模块名NAME，跟 import 和 export 的模块名规则是一样的，且必须跟当前文件加载该模块的语句写法（上例import { A } from './a'）保持一致。


（2）不能创建新的顶层类型。也就是说，只能对a.ts模块中已经存在的类型进行扩展，不允许增加新的顶层类型，比如新定义一个接口B。


（3）不能对默认的default接口进行扩展，只能对 export 命令输出的命名接口进行扩充。这是因为在进行类型扩展时，需要依赖输出的接口名。


某些第三方模块，原始作者没有提供接口类型，这时可以在自己的脚本顶部加上下面一行命令。


`declare module "模块名";

// 例子
declare module "hot-new-module";`


加上上面的命令以后，外部模块即使没有类型，也可以通过编译。但是，从该模块输入的所有接口都将为any类型。


declare module 描述的模块名可以使用通配符。


`declare module "my-plugin-*" {
  interface PluginOptions {
    enabled: boolean;
    priority: number;
  }

  function initialize(options: PluginOptions): void;
  export = initialize;
}`


## 19.6 declare global


如果要为 JavaScript 引擎的原生对象添加属性和方法，可以使用declare global {}语法。


`export {};

declare global {
  interface String {
    toSmallString(): string;
  }
}

String.prototype.toSmallString = (): string => {
  // 具体实现
  return "";
};`


这个示例第一行的空导出语句export {}，作用是强制编译器将这个脚本当作模块处理。这是因为declare global必须用在模块里面。


`export {};

declare global {
  interface window {
    myAppConfig: object;
  }
}

const config = window.myAppConfig;`


declare global 只能扩充现有对象的类型描述，不能增加新的顶层类型。


## 19.7 declare enum


declare 关键字给出 enum 类型描述的例子如下，下面的写法都是允许的。


`declare enum E1 {
  A,
  B,
}

declare enum E2 {
  A = 0,
  B = 1,
}

declare const enum E3 {
  A,
  B,
}

declare const enum E4 {
  A = 0,
  B = 1,
}`


## 19.8 declare module 用于类型声明文件


我们可以为每个模块脚本，定义一个.d.ts文件，把该脚本用到的类型定义都放在这个文件里面。但是，更方便的做法是为整个项目，定义一个大的.d.ts文件，在这个文件里面使用declare module定义每个模块脚本的类型。


`declare module "url" {
  export interface Url {
    protocol?: string;
    hostname?: string;
    pathname?: string;
  }

  export function parse(
    urlStr: string,
    parseQueryString?,
    slashesDenoteHost?
  ): Url;
}

declare module "path" {
  export function normalize(p: string): string;
  export function join(...paths: any[]): string;
  export var sep: string;
}`


使用时，自己的脚本使用三斜杠命令，加载这个类型声明文件。


`/// <reference path="node.d.ts"/>`


如果没有上面这一行命令，自己的脚本使用外部模块时，就需要在脚本里面使用declare 命令单独给出外部模块的类型。


# 二十、d.ts 类型声明文件


## 20.1 简介


单独使用的模块，一般会同时提供一个单独的类型声明文件（declaration file），把本模块的外部接口的所有类型都写在这个文件里面，便于模块使用者了解接口，也便于编译器检查使用者的用法是否正确。


类型声明文件里面只有类型代码，没有具体的代码实现。它的文件名一般为[模块名].d.ts的形式，其中的d表示 declaration（声明）。


`const maxInterval = 12;
function getArrayLength(arr) {
  return arr.length;
}
module.exports = {
  getArrayLength,
  maxInterval,
}; 

//它的类型声明文件可以写成下面这样。 
export function getArrayLength(arr: any[]): number;
export const maxInterval: 12;`


类型声明文件也可以使用export =命令，输出对外接口。下面是 moment 模块的类型声明文件的例子。


`declare module 'moment' {
  function moment(): any;
  export = moment;
}`


模块moment内部有一个函数moment()，而export =表示module.exports输出的就是这个函数。 除了使用export =，模块输出在类型声明文件中，也可以使用export default表示。


`// 模块输出
module.exports = 3.142;
// 类型输出文件
// 写法一
declare const pi: number;
export default pi;
// 写法二
declare const pi: number;
export= pi;`


下面是一个如何使用类型声明文件的简单例子。有一个类型声明文件types.d.ts。


`// types.d.ts
export interface Character {
  catchphrase?: string;
  name: string;
}`


然后，就可以在 TypeScript 脚本里面导入该文件声明的类型。


`// index.ts
import { Character } from "./types";
export const character:Character = {
  catchphrase: "Yee-haw!",
  name: "Sandy Cheeks",
};`


类型声明文件也可以包括在项目的 tsconfig.json 文件里面，这样的话，编译器打包项目时，会自动将类型声明文件加入编译，而不必在每个脚本里面加载类型声明文件。比如，moment 模块的类型声明文件是moment.d.ts，使用 moment 模块的项目可以将其加入项目的 tsconfig.json 文件。


`{
  "compilerOptions": {},
  "files": [
    "src/index.ts",
    "typings/moment.d.ts"
  ]
}`


## 20.2 类型声明文件的来源


类型声明文件主要有以下三种来源。

- TypeScript 编译器自动生成。
- TypeScript 内置类型文件。
- 外部模块的类型声明文件，需要自己安装。

### 20.2.1 自动生成


只要使用编译选项declaration，编译器就会在编译时自动生成单独的类型声明文 件。 下面是在tsconfig.json文件里面，打开这个选项。


`{
  "compilerOptions": {
    "declaration": true
  }
}`


也可以在命令行打开这个选项。


`$ tsc --declaration`


### 20.2.2 内置声明文件


安装 TypeScript 语言时，会同时安装一些内置的类型声明文件，主要是内置的全局对象（JavaScript 语言接口和运行环境 API）的类型声明。 这些内置声明文件位于 TypeScript 语言安装目录的lib文件夹内，数量大概有几十个。


这些内置声明文件的文件名统一为“lib.[description].d.ts”的形式，其中description部分描述了文件内容。


TypeScript 编译器会自动根据编译目标target的值，加载对应的内置声明文件，所以不需要特别的配置。但是，可以使用编译选项lib，指定加载哪些内置声明文件。


`{
  "compilerOptions": {
    "lib": ["dom", "es2021"]
  }
}`


编译选项noLib会禁止加载任何内置声明文件。


### 20.2.3 外部类型声明文件


如果项目中使用了外部的某个第三方代码库，那么就需要这个库的类型声明文件。


（1）这个库自带了类型声明文件。 一般来说，如果这个库的源码包含了[vendor].d.ts文件，那么就自带了类型声明文件。其中的vendor表示这个库的名字，比如moment这个库就自带moment.d.ts。使用这个库可能需要单独加载它的类型声明文件。


（2）这个库没有自带，但是可以找到社区制作的类型声明文件。 第三方库如果没有提供类型声明文件，社区往往会提供。TypeScript 社区主要使用DefinitelyTyped 仓库，各种类型声明文件都会提交到那里，已经包含了几千个第三方库。 这些声明文件都会作为一个单独的库，发布到 npm 的@types名称空间之下。


如果类型声明文件不是index.d.ts，那么就需要在package.json的types或typings字段，指定类型声明文件的文件名。 TypeScript 会自动加载node_modules/@types目录下的模块，但可以使用编译选项typeRoots改变这种行为。


`{
  "compilerOptions": {
    "typeRoots": ["./typings", "./vendor/types"]
  }
}`


默认情况下，TypeScript 会自动加载typeRoots目录里的所有模块，编译选项types可以指定加载哪些模块。


`{
  "compilerOptions": {
    "types" : ["jquery"]
  }
}`


上面设置中，types属性是一个数组，成员是所要加载的类型模块，要加载几个模块，这个数组就有几个成员，每个类型模块在typeRoots目录下都有一个自己的子目录。这样的话，TypeScript 就会自动去jquery子目录，加载 jQuery 的类型声明文件。


（3）找不到类型声明文件，需要自己写。 有时实在没有第三方库的类型声明文件，又很难完整给出该库的类型描述，这时你可以告诉 TypeScript 相关对象的类型是any。


`declare var $:any
// 或者
declare type JQuery = any;
declare var $:JQuery;`


也可以采用下面的写法，将整个外部模块的类型设为any。


`declare module '模块名';`


## 20.3 declare 关键字


类型声明文件只包含类型描述，不包含具体实现，所以非常适合使用 declare 语句来描述类型。


类型声明文件里面，变量的类型描述必须使用declare命令，否则会报错，因为变量声明语句是值相关代码。


`declare let foo:string;`


interface 类型有没有declare都可以，因为 interface 是完全的类型代码。


`interface Foo {} // 正确
declare interface Foo {} // 正确`


类型声明文件里面，顶层可以使用export命令，也可以不用，除非使用者脚本会显式使用export命令输入类型。


`export interface Data {
  version: string;
}`


下面是类型声明文件的一些例子。先看 moment 模块的类型描述文件moment.d.ts。


`declare module 'moment' {
  export interface Moment {
    format(format:string): string;
    add(
      amount: number,
      unit: 'days' | 'months' | 'years'
    ): Moment;
    subtract(
      amount:number,
      unit:'days' | 'months' | 'years'
    ): Moment;
  }
  function moment(
    input?: string | Date
  ): Moment;
  export default moment;
}`


## 20.4 模块发布


当前模块如果包含自己的类型声明文件，可以在 package.json 文件里面添加一个types字段或typings字段，指明类型声明文件的位置。


`{
  "name": "awesome",
  "author": "Vandelay Industries",
  "version": "1.0.0",
  "main": "./lib/main.js",
  "types": "./lib/main.d.ts"
}`


注意，如果类型声明文件名为index.d.ts，且在项目的根目录中，那就不需要在package.json里面注明了。 有时，类型声明文件会单独发布成一个 npm 模块，这时用户就必须同时加载该模块。


`{
  "name": "browserify-typescript-extension",
  "author": "Vandelay Industries",
  "version": "1.0.0",
  "main": "./lib/main.js",
  "types": "./lib/main.d.ts",
  "dependencies": {
    "browserify": "latest",
    "@types/browserify": "latest",
    "typescript": "next"
  }
}`


上面示例是一个模块的 package.json 文件，该模块需要 browserify 模块。由于后者的类型声明文件是一个单独的模块@types/browserify，所以还需要加载那个模块。


## 20.5 三斜杠命令


如果类型声明文件的内容非常多，可以拆分成多个文件，然后入口文件使用三斜杠命令，加载其他拆分后的文件。


三斜杠命令（///）是一个 TypeScript 编译器命令，用来指定编译器行为。它只能用在文件的头部，如果用在其他地方，会被当作普通的注释。另外，若一个文件中使用了三斜线命令，那么在三斜线命令之前只允许使用单行注释、多行注释和其他三斜线命令，否则三斜杠命令也会被当作普通的注释。 除了拆分类型声明文件，三斜杠命令也可以用于普通脚本加载类型声明文件。 三斜杠命令主要包含三个参数，代表三种不同的命令。

- path
- types
- lib

/// <**reference path=""** />是最常见的三斜杠命令，告诉编译器在编译时需要包括的文件，常用来声明当前脚本依赖的类型文件。


`/// <reference path="./lib.ts" />
let count = add(1, 2);`


上面示例表示，当前脚本依赖于./lib.ts，里面是add()的定义。编译当前脚本时，还会同时编译./lib.ts。编译产物会有两个 JS 文件，一个当前脚本，另一个就是./lib.js。


下面的例子是当前脚本依赖于 Node.js 类型声明文件。


`/// <reference path="node.d.ts"/>
import * as URL from "url";
let myUrl = URL.parse("https://www.typescriptlang.org");`


编译器会在预处理阶段，找出所有三斜杠引用的文件，将其添加到编译列表中，然后一起编译。 path参数指定了所引入文件的路径。如果该路径是一个相对路径，则基于当前脚本的路径进行计算。 使用该命令时，有以下两个注意事项。

- path参数必须指向一个存在的文件，若文件不存在会报错。
- path参数不允许指向当前文件。

默认情况下，每个三斜杠命令引入的脚本，都会编译成单独的 JS 文件。如果希望编译后只产出一个合并文件，可以使用编译选项outFile。但是，outFile编译选项不支持合并 CommonJS 模块和 ES 模块，只有当编译参数module的值设为 None、System 或 AMD 时，才能编译成一个文件。 如果打开了编译参数noResolve，则忽略三斜杠指令。将其当作一般的注释，原样保留在编译产物中。


types 参数用来告诉编译器当前脚本依赖某个 DefinitelyTyped 类型库，通常安装在nodemodules/@types目录。 types 参数的值是类型库的名称，也就是安装到nodemodules/@types目录中的子目录的名字。


`/// <reference types="node" />`


上面示例中，这个三斜杠命令表示编译时添加 Node.js 的类型库，实际添加的脚本是node_modules目录里面的@types/node/index.d.ts。 可以看到，这个命令的作用类似于import命令。 注意，这个命令只在你自己手写类型声明文件（.d.ts文件）时，才有必要用到，也就是说，只应该用在.d.ts文件中，普通的.ts脚本文件不需要写这个命令。如果是普通的.ts脚本，可以使用tsconfig.json文件的types属性指定依赖的类型库。


/// <**reference lib="..."** />命令允许脚本文件显式包含内置 lib 库，等同于在tsconfig.json文件里面使用lib属性指定 lib 库。


# 二十一、TypeScript 类型运算符


## 21.1 keyof 运算符


### 21.1.1 简介


keyof 是一个单目运算符，接受一个对象类型作为参数，返回该对象的所有键名组成的联合类型。


`type MyObj = {
  foo: number;
  bar: string;
};

type Keys = keyof MyObj; // 'foo'|'bar'`


由于 JavaScript 对象的键名只有三种类型，所以对于任意对象的键名的联合类型就是string|number|symbol。


`// string | number | symbol
type KeyT = keyof any;`


对于没有自定义键名的类型使用 keyof 运算符，返回never类型，表示不可能有这样类型的键名。


`type KeyT = keyof object; // never`


由于 keyof 返回的类型是string|number|symbol，如果有些场合只需要其中的一种类型，那么可以采用交叉类型的写法。


`type Capital<T extends string> = Capitalize<T>;

type MyKeys<Obj extends object> = Capital<keyof Obj>; // 报错`


类型Capital只接受字符串作为类型参数，传入keyof Obj会报错，原因是这时的类型参数是string|number|symbol，跟字符串不兼容。采用下面的交叉类型写法，就不会报错。


`type MyKeys<Obj extends object> = Capital<string & keyof Obj>;`


如果对象属性名采用索引形式，keyof 会返回属性名的索引类型。


`// 示例一
interface T {
  [prop: number]: number;
}

// number
type KeyT = keyof T;

// 示例二
interface T {
  [prop: string]: number;
}

// string|number
type KeyT = keyof T;`


上面的示例二，keyof T返回的类型是string|number，原因是 JavaScript 属性名为字符串时，包含了属性名为数值的情况，因为数值属性名会自动转为字符串。


如果 keyof 运算符用于数组或元组类型，得到的结果可能出人意料。


`type Result = keyof ["a", "b", "c"];
// 返回 number | "0" | "1" | "2"
// | "length" | "pop" | "push" | ···`


上面示例中，keyof 会返回数组的所有键名，包括数字键名和继承的键名。


对于联合类型，keyof 返回成员共有的键名。


`type A = { a: string; z: boolean };
type B = { b: string; z: boolean };

// 返回 'z'
type KeyT = keyof (A | B);`


对于交叉类型，keyof 返回所有键名。


`type A = { a: string; x: boolean };
type B = { b: string; y: number };

// 返回 'a' | 'x' | 'b' | 'y'
type KeyT = keyof (A & B);

// 相当于
keyof (A & B) ≡ keyof A | keyof B`


keyof 取出的是键名组成的联合类型，如果想取出键值组成的联合类型，可以像下面这样写。


`type MyObj = {
  foo: number;
  bar: string;
};

type Keys = keyof MyObj;

type Values = MyObj[Keys]; // number|string`


### 21.1.2 keyof 运算符的用途


keyof 运算符往往用于精确表达对象的属性类型。


举例来说，取出对象的某个指定属性的值，JavaScript 版本可以写成下面这样。


`function prop(obj, key) {
  return obj[key];
}`


上面这个函数添加类型


`function prop(obj: object, key: string): any {
  return obj[key];
}`


上面的类型声明有两个问题，一是无法表示参数key与参数obj之间的关系，二是返回值类型只能写成any。


有了 keyof 以后，就可以解决这两个问题，精确表达返回值类型。


`function prop<Obj, K extends keyof Obj>(
  obj:Obj, key:K
):Obj[K] {
  return obj[key];
}`


keyof 的另一个用途是用于属性映射，即将一个类型的所有属性逐一映射成其他值。


`type NewProps<Obj> = {
  [Prop in keyof Obj]: boolean;
};

// 用法
type MyObj = { foo: number };

// 等于 { foo: boolean; }
type NewObj = NewProps<MyObj>;`


上面示例中，类型NewProps是类型Obj的映射类型，前者继承了后者的所有属性，但是把所有属性值类型都改成了boolean。


下面的例子是去掉 readonly 修饰符。


`type Mutable<Obj> = {
  -readonly [Prop in keyof Obj]: Obj[Prop];
};

// 用法
type MyObj = {
  readonly foo: number;
};

// 等于 { foo: number; }
type NewObj = Mutable<MyObj>;`


上面示例中，[Prop in keyof Obj](https://www.notion.so/boolean;)是Obj类型的所有属性名，-readonly表示去除这些属性的只读特性。对应地，还有+readonly的写法，表示添加只读属性设置。


下面的例子是让可选属性变成必有的属性。


`type Concrete<Obj> = {
  [Prop in keyof Obj]-?: Obj[Prop];
};

// 用法
type MyObj = {
  foo?: number;
};

// 等于 { foo: number; }
type NewObj = Concrete<MyObj>;`


上面示例中，[Prop in keyof Obj](https://www.notion.so/boolean;)后面的-?表示去除可选属性设置。对应地，还有+?的写法，表示添加可选属性设置。


## 21.2 in 运算符


JavaScript 语言中，in运算符用来确定对象是否包含某个属性名。


`const obj = { a: 123 };

if ("a" in obj) console.log("found a");`


TypeScript 语言的类型运算中，in运算符有不同的用法，用来取出（遍历）联合类型的每一个成员类型。


`type U = "a" | "b" | "c";

type Foo = {
  [Prop in U]: number;
};
// 等同于
type Foo = {
  a: number;
  b: number;
  c: number;
};`


## 21.3 方括号运算符


方括号运算符（[]）用于取出对象的键值类型，比如T[K]会返回对象T的属性K的类型。


`type Person = {
  age: number;
  name: string;
  alive: boolean;
};

// Age 的类型是 number
type Age = Person["age"];`


方括号的参数如果是联合类型，那么返回的也是联合类型。


`type Person = {
  age: number;
  name: string;
  alive: boolean;
};

// number|string
type T = Person["age" | "name"];

// number|string|boolean
type A = Person[keyof Person];`


如果访问不存在的属性，会报错。


`type T = Person["notExisted"]; // 报错`


方括号运算符的参数也可以是属性名的索引类型。


`type Obj = {
  [key: string]: number;
};

// number
type T = Obj[string];`


上面示例中，Obj的属性名是字符串的索引类型，所以可以写成Obj[string]，代表所有字符串属性名，返回的就是它们的类型number。


这个语法对于数组也适用，可以使用number作为方括号的参数。


`// MyArray 的类型是 { [key:number]：string }
const MyArray = ["a", "b", "c"];

// 等同于 (typeof MyArray)[number]
// 返回 string
type Person = (typeof MyArray)[number];`


注意，方括号里面不能有值的运算。


`// 示例一
const key = 'age';
type Age = Person[key]; // 报错

// 示例二
type Age = Person['a' + 'g' + 'e']; // 报错`


## 21.4 extends...?: 条件运算符


TypeScript 提供类似 JavaScript 的?:运算符这样的三元运算符，但多出了一个extends关键字。 条件运算符extends...?:可以根据当前类型是否符合某种条件，返回不同的类型。


`T extends U ? X : Y`


上面式子中的extends用来判断，类型T是否可以赋值给类型U，即T是否为U的子类型，这里的T和U可以是任意类型。


如果T能够赋值给类型U，表达式的结果为类型X，否则结果为类型Y。


一般来说，调换extends两侧类型，会返回相反的结果。


如果需要判断的类型是一个联合类型，那么条件运算符会展开这个联合类型。


`(A|B) extends U ? X : Y

// 等同于

(A extends U ? X : Y) |
(B extends U ? X : Y)`


上面示例中，A|B是一个联合类型，进行条件运算时，相当于A和B分别进行运算符，返回结果组成一个联合类型。


如果不希望联合类型被条件运算符展开，可以把extends两侧的操作数都放在方括号里面。


`// 示例一
type ToArray<Type> = Type extends any ? Type[] : never;

// string[]|number[]
type T = ToArray<string | number>;

// 示例二
type ToArray<Type> = [Type] extends [any] ? Type[] : never;

// (string | number)[]
type T = ToArray<string | number>;`


上面的示例一，传入ToArray<Type>的类型参数是一个联合类型，所以会被展开，返回的也是联合类型。示例二是extends两侧的运算数都放在方括号里面，所以传入的联合类型不会展开，返回的是一个数组。


条件运算符还可以嵌套使用。


`type LiteralTypeName<T> = T extends undefined
  ? "undefined"
  : T extends null
  ? "null"
  : T extends boolean
  ? "boolean"
  : T extends number
  ? "number"
  : T extends bigint
  ? "bigint"
  : T extends string
  ? "string"
  : never;`


上面示例是一个多重判断，返回一个字符串的值类型，对应当前类型。下面是它的用法。


`// "bigint"
type Result1 = LiteralTypeName<123n>;

// "string" | "number" | "boolean"
type Result2 = LiteralTypeName<true | 1 | "a">;`


## 21.5 infer 关键字


infer关键字用来定义泛型里面推断出来的类型参数，而不是外部传入的类型参数。 它通常跟条件运算符一起使用，用在extends关键字后面的父类型之中。


`type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;`


上面示例中，infer Item表示Item这个参数是 TypeScript 自己推断出来的，不用显式传入，而Flatten<Type>则表示Type这个类型参数是外部传入的。Type extends Array<infer Item>则表示，如果参数Type是一个数组，那么就将该数组的成员类型推断为Item，即Item是从Type推断出来的。


一旦使用Infer Item定义了Item，后面的代码就可以直接调用Item了。下面是上例的泛型Flatten<Type>的用法。


`// string
type Str = Flatten<string[]>;

// number
type Num = Flatten<number>;`


上面示例中，第一个例子Flatten<string[]>传入的类型参数是string[]，可以推断出Item的类型是string，所以返回的是string。第二个例子Flatten<number>传入的类型参数是number，它不是数组，所以直接返回自身。


如果不用infer定义类型参数，那么就要传入两个类型参数。


`type ReturnPromise<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : T;`


上面是不使用infer的写法，每次调用Fleatten的时候，都要传入两个参数，就比较麻烦。


下面的例子使用infer，推断函数的参数类型和返回值类型。


`type ReturnPromise<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : T;`


上面示例中，如果T是函数，就返回这个函数的 Promise 版本，否则原样返回。infer A表示该函数的参数类型为A，infer R表示该函数的返回值类型为R。


如果不使用infer，就不得不把ReturnPromise<T>写成ReturnPromise<T, A, R>，这样就很麻烦，相当于开发者必须人肉推断编译器可以完成的工作。


下面是infer提取对象指定属性的例子。


`type MyType<T> = T extends {
  a: infer M;
  b: infer N;
}
  ? [M, N]
  : never;

// 用法示例
type T = MyType<{ a: string; b: number }>;
// [string, number]`


## 21.6 is 运算符


函数返回布尔值的时候，可以使用is运算符，限定返回值与参数之间的关系。


is运算符用来描述返回值属于true还是false。


`function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}`


is运算符总是用于描述函数的返回值类型，写法采用parameterName is Type的形式，即左侧为当前函数的参数名，右侧为某一种类型。它返回一个布尔值，表示左侧参数是否属于右侧的类型。


`type A = { a: string };
type B = { b: string };

function isTypeA(x: A | B): x is A {
  if ("a" in x) return true;
  return false;
}`


is运算符可以用于类型保护。


`function isCat(a: any): a is Cat {
  return a.name === "kitty";
}

let x: Cat | Dog;

if (isCat(x)) {
  x.meow(); // 正确，因为 x 肯定是 Cat 类型
}`


上面示例中，函数isCat()的返回类型是a is Cat，它是一个布尔值。后面的if语句就用这个返回值进行判断，从而起到类型保护的作用，确保x是 Cat 类型，从而x.meow()不会报错（假定Cat类型拥有meow()方法）。 is运算符还有一种特殊用法，就是用在类（class）的内部，描述类的方法的返回值。


`class Teacher {
  isStudent(): this is Student {
    return false;
  }
}

class Student {
  isStudent(): this is Student {
    return true;
  }
}`


注意，this is T这种写法，只能用来描述方法的返回值类型，而不能用来描述属性的类型。


## 21.7 模板字符串


TypeScript 允许使用模板字符串，构建类型。 模板字符串的最大特点，就是内部可以引用其他类型。


`type World = "world";

// "hello world"
type Greeting = `hello ${World}`;`


注意，模板字符串可以引用的类型一共6种，分别是 string、number、bigint、boolean、null、undefined。引用这6种以外的类型会报错。


模板字符串里面引用的类型，如果是一个联合类型，那么它返回的也是一个联合类型，即模板字符串可以展开联合类型。


`type T = "A" | "B";

// "A_id"|"B_id"
type U = `${T}_id`;`


如果模板字符串引用两个联合类型，它会交叉展开这两个类型。


`type T = "A" | "B";

type U = "1" | "2";

// 'A1'|'A2'|'B1'|'B2'
type V = `${T}${U}`;`


# 二十二、TypeScript 的类型映射


## 22.1 简介


映射（mapping）指的是，将一种类型按照映射规则，转换成另一种类型，通常用于对象类型。 举例来说，现有一个类型A和另一个类型B。


`type A = {
  foo: number;
  bar: number;
};

type B = {
  foo: string;
  bar: string;
};`


使用类型映射，就可以从类型A得到类型B。


`type A = {
  foo: number;
  bar: number;
};

type B = {
  [prop in keyof A]: string;
};`


在语法上，prop in keyof A是一个属性名表达式，表示这里的属性名需要计算得到。具体的计算规则如下：

- prop：属性名变量，名字可以随便起。
- in：运算符，用来取出右侧的联合类型的每一个成员。
- Keyof A：返回类型A的每一个属性名，组成一个联合类型。

下面是复制原始类型的例子。


`type A = {
  foo: number;
  bar: string;
};

type B = {
  [prop in keyof A]: A[prop];
};`


为了增加代码复用性，可以把常用的映射写成泛型。


`type ToBoolean<Type> = {
  [Property in keyof Type]: boolean;
};`


不使用联合类型，直接使用某种具体类型进行属性名映射，也是可以的。


`type MyObj = {
  [p in "foo"]: number;
};

// 等同于
type MyObj = {
  foo: number;
};`


上面示例中，p in 'foo'可以看成只有一个成员的联合类型，因此得到了只有这一个属性的对象类型。


甚至还可以写成p in string。


`type MyObj = {
  [p in string]: boolean;
};

// 等同于
type MyObj = {
  [p: string]: boolean;
};`


上面示例中，[p in string](https://www.notion.so/boolean;)就是属性名索引形式[p: string](https://www.notion.so/boolean;)的映射写法。


通过映射，可以某个对象的所有属性改成可选属性。


`type A = {
  a: string;
  b: number;
};

type B = {
  [Prop in keyof A]?: A[Prop];
};`


事实上，TypeScript 的内置工具类型Partial<**T**>，就是这样实现的。 TypeScript内置的工具类型Readonly<**T**>可以将所有属性改为只读属性，实现也是通过映射。


`// 将 T 的所有属性改为只读属性
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

//它的用法如下

typescript
type T = { a: string; b: number };

type ReadonlyT = Readonly<T>;
// {
//   readonly a: string;
//   readonly b: number;
// }`


## 22.2 映射修饰符


映射会原样复制原始对象的可选属性和只读属性。


`type A = {
  a?: string;
  readonly b: number;
};

type B = {
  [Prop in keyof A]: A[Prop];
};

// 等同于
type B = {
  a?: string;
  readonly b: number;
};`


如果要删改可选和只读这两个特性，并不是很方便。为了解决这个问题，TypeScript引入了两个映射修饰符，用来在映射时添加或移除某个属性的?修饰符和readonly修饰符。

- +修饰符：写成+?或+readonly，为映射属性添加?修饰符或readonly修饰符。
- –修饰符：写成-?或-readonly，为映射属性移除?修饰符或readonly修饰符。

下面是添加或移除可选属性的例子。


`// 添加可选属性
type Optional<Type> = {
  [Prop in keyof Type]+?: Type[Prop];
};

// 移除可选属性
type Concrete<Type> = {
  [Prop in keyof Type]-?: Type[Prop];
};`


注意，+?或-?要写在属性名的后面。


下面是添加或移除只读属性的例子。


`// 添加 readonly
type CreateImmutable<Type> = {
  +readonly [Prop in keyof Type]: Type[Prop];
};

// 移除 readonly
type CreateMutable<Type> = {
  -readonly [Prop in keyof Type]: Type[Prop];
};`


注意，+readonly和-readonly要写在属性名的前面。


如果同时增删?和readonly这两个修饰符，写成下面这样。


`// 增加
type MyObj<T> = {
  +readonly [P in keyof T]+?: T[P];
};

// 移除
type MyObj<T> = {
  -readonly [P in keyof T]-?: T[P];
};`


TypeScript 原生的工具类型Required<**T**>专门移除可选属性，就是使用-?修饰符实现的。


注意，–?修饰符移除了可选属性以后，该属性就不能等于undefined了，实际变成必选属性了。但是，这个修饰符不会移除null类型。


另外，+?修饰符可以简写成?，+readonly修饰符可以简写成readonly。


`type A<T> = {
  +readonly [P in keyof T]+?: T[P];
};

// 等同于
type B<T> = {
  readonly [P in keyof T]?: T[P];
};`


## 22.3 键名重映射


### 22.3.1 语法


TypeScript 4.1 引入了键名重映射（key remapping），允许改变键名。


`type A = {
  foo: number;
  bar: number;
};

type B = {
  [p in keyof A as `${p}ID`]: number;
};

// 等同于
type B = {
  fooID: number;
  barID: number;
}；`


键名重映射的语法是在键名映射的后面加上as + 新类型子句。这里的“新类型”通常是一个模板字符串，里面可以对原始键名进行各种操作。


`interface Person {
  name: string;
  age: number;
  location: string;
}

type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

type LazyPerson = Getters<Person>;
// 等同于
type LazyPerson = {
  getName: () => string;
  getAge: () => number;
  getLocation: () => string;
};`


它的修改键名的代码是一个模板字符串get${Capitalize<**string & P**>}，下面是各个部分的解释。

- get：为键名添加的前缀。
- Capitalize<**T**>：一个原生的工具泛型，用来将T的首字母变成大写。
- string & P：一个交叉类型，其中的P是 keyof 运算符返回的键名联合类型string|number|symbol，但是Capitalize<**T**>只能接受字符串作为类型参数，因此string & P只返回P的字符串属性名。

### 22.3.2 属性过滤


键名重映射还可以过滤掉某些属性。下面的例子是只保留字符串属性。


`type User = {
  name: string;
  age: number;
};

type Filter<T> = {
  [K in keyof T as T[K] extends string ? K : never]: string;
};

type FilteredUser = Filter<User>; // { name: string }`


它的键名重映射as T[K] extends string ? K : never]，使用了条件运算符。如果属性值T[K]的类型是字符串，那么属性名不变，否则属性名类型改为never，即这个属性名不存在。这样就等于过滤了不符合条件的属性，只保留属性值为字符串的属性。


### 22.3.3 联合类型的映射


由于键名重映射可以修改键名类型，所以原始键名的类型不必是string|number|symbol，任意的联合类型都可以用来进行键名重映射。


`type S = {
  kind: "square";
  x: number;
  y: number;
};

type C = {
  kind: "circle";
  radius: number;
};

type MyEvents<Events extends { kind: string }> = {
  [E in Events as E["kind"]]: (event: E) => void;
};

type Config = MyEvent<S | C>;
// 等同于
type Config = {
  square: (event: S) => void;
  circle: (event: C) => void;
};`


原始键名的映射是E in Events，这里的Events是两个对象组成的联合类型S|C。所以，E是一个对象，然后再通过键名重映射，得到字符串键名E['kind']。


# 二十三、TypeScript 的注释指令


TypeScript 接受一些注释指令。 所谓“注释指令”，指的是采用 JS 双斜杠注释的形式，向编译器发出的命令。


## 23.1 // @ts-nocheck


// @ts-nocheck告诉编译器不对当前脚本进行类型检查，可以用于 TypeScript 脚本，也可以用于 JavaScript 脚本。


`// @ts-nocheck

const element = document.getElementById(123);`


document.getElementById(123)存在类型错误，但是编译器不对该脚本进行类型检查，所以不会报错。


## 23.2 // @ts-check


如果一个 JavaScript 脚本顶部添加了// @ts-check，那么编译器将对该脚本进行类型检查，不论是否启用了checkJs编译选项。


`// @ts-nocheck

const element = document.getElementById(123);`


上面示例是一个 JavaScript 脚本，// @ts-check告诉 TypeScript 编译器对其进行类型检查，所以最后一行会报错，提示拼写错误。


## 23.3 // @ts-ignore


// @ts-ignore或// @ts-expect-error，告诉编译器不对下一行代码进行类型检查，可以用于 TypeScript 脚本，也可以用于 JavaScript 脚本。


`let x: number;

x = 0;

// @ts-expect-error
x = false; // 不报错`


最后一行是类型错误，变量x的类型是number，不能等于布尔值。但是因为前面加上了// @ts-expect-error，编译器会跳过这一行的类型检查，所以不会报错。


## 23.4 JSDoc


TypeScript 直接处理 JS 文件时，如果无法推断出类型，会使用 JS 脚本里面的 JSDoc注释。


使用 JSDoc 时，有两个基本要求。


（1）JSDoc 注释必须以/*_开始，其中星号（_）的数量必须为两个。若使用其他形式的多行注释，则 JSDoc 会忽略该条注释。


（2）JSDoc 注释必须与它描述的代码处于相邻的位置，并且注释在上，代码在下。


`/**
 * @param {string} somebody
 */
function sayHello(somebody) {
  console.log("Hello " + somebody);
}`


TypeScript 编译器支持大部分的 JSDoc 声明。


### 23.4.1 @typedef


@typedef命令创建自定义类型，等同于 TypeScript 里面的类型别名。


`/**
 * @typedef {(number | string)} NumberLike
 */`


定义了一个名为NumberLike的新类型，它是由number和string构成的联合类型，等同于 TypeScript 的如下语句。


`type NumberLike = string | number;`


### 23.4.2 @type


@type命令定义变量的类型。


`/**
 * @type {string}
 */
let a;`


在@type命令中可以使用由@typedef命令创建的类型。


`/**
 * @typedef {(number | string)} NumberLike
 */

/**
 * @type {NumberLike}
 */
let a = 0;`


在@type命令中允许使用 TypeScript 类型及其语法。


`/**@type {true | false} */
let a;

/** @type {number[]} */
let b;

/** @type {Array<number>} */
let c;

/** @type {{ readonly x: number, y?: string }} */
let d;

/** @type {(s: string, b: boolean) => number} */
let e;`


### 23.4.3 @param


@param命令用于定义函数参数的类型。


`/**
 * @param {string}  x
 */
function foo(x) {}`


如果是可选参数，需要将参数名放在方括号[]里面。


`/**
 * @param {string}  [x]
 */
function foo(x) {}`


方括号里面，还可以指定参数默认值。


`/**
 * @param {string} [x="bar"]
 */
function foo(x) {}`


### 23.4.4 @return，@returns


@return和@returns命令的作用相同，指定函数返回值的类型。


`/**
 * @return {boolean}
 */
function foo() {
  return true;
}

/**
 * @returns {number}
 */
function bar() {
  return 0;
}`


### 23.4.5 @extends 和类型修饰符


@extends命令用于定义继承的基类。


`/**
 * @extends {Base}
 */
class Derived extends Base {}`


@public、@protected、@private分别指定类的公开成员、保护成员和私有成员。


@readonly指定只读成员。


`class Base {
  /**
   * @public
   * @readonly
   */
  x = 0;

  /**
   *  @protected
   */
  y = 0;
}`


# 二十四、tsc 命令行编译器


tsc 是 TypeScript 官方的命令行编译器，用来检查代码，并将其编译成 JavaScript 代码。


tsc 默认使用当前目录下的配置文件tsconfig.json，但也可以接受独立的命令行参数。命令行参数会覆盖tsconfig.json，比如命令行指定了所要编译的文件，那么 tsc 就会忽略tsconfig.json的files属性。


tsc 的基本用法如下。


`# 使用 tsconfig.json 的配置
tsc

# 只编译 index.ts
tsc index.ts

# 编译 src 目录的所有 .ts 文件
tsc src/*.ts

# 指定编译配置文件
tsc --project tsconfig.production.json

# 只生成类型声明文件，不编译出 JS 文件
tsc index.js --declaration --emitDeclarationOnly

# 多个 TS 文件编译成单个 JS 文件
tsc app.ts util.ts --target esnext --outfile index.js`


---


参考文章：


[https://v2.scrimba.com/learn-typescript-c0l?via=roadmap](https://v2.scrimba.com/learn-typescript-c0l?via=roadmap)


[https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)


[https://www.tutorialspoint.com/typescript/index.htm](https://www.tutorialspoint.com/typescript/index.htm)


[https://thenewstack.io/what-is-typescript/](https://thenewstack.io/what-is-typescript/)


[https://thenewstack.io/typescript-tutorial-go-beyond-hello-world/](https://thenewstack.io/typescript-tutorial-go-beyond-hello-world/)


[https://thenewstack.io/typescript-tutorial-a-guide-to-using-the-programming-language/](https://thenewstack.io/typescript-tutorial-a-guide-to-using-the-programming-language/)


[https://typescript.p6p.net/typescript-tutorial/intro.html](https://typescript.p6p.net/typescript-tutorial/intro.html)