---
title: TypeScript 工具类型：完整指南
slug: 2026-05-27-typescript
description: 实用类型是 TypeScript 中预定义的泛型类型，它们使现有类型能够转换为新的变体类型。
author: 墨韵
date: 2024-12-10
categories:
  - note
tags:
  - frontend
  - TypeScript
draft: false
notionId: 36ddf5c0-26f4-80a3-ae24-ef4b41832322
notionSyncedAt: 2026-05-27T05:50:57.665Z
---

# 理解 TypeScript 工具类型


实用类型是 TypeScript 中预定义的泛型类型，它们使现有类型能够转换为新的变体类型。可以将它们看作类型级别的函数，这些函数将现有类型作为参数，并根据某些转换规则返回新类型。


# 核心工具类型及其实际应用


## **Partial**


`Partial<Type>` 实用类型接受一个类型并使其所有属性变为可选。此实用类型在类型是嵌套的情况下特别有用，因为它会递归地使属性变为可选。


例如，假设你正在创建一个用户资料更新功能。在这种情况下，如果用户不想更新所有字段，你可以只使用部分类型（Partial type）并仅更新所需字段。这在表单和API中非常方便，因为并不是所有字段都是必填的。


```javascript
interface User {
  id: number;
  name: string;
  email?: string;
}

const updateUser = (user: Partial<User>) => {
  console.log(Updating user: ${user.name} );
};

updateUser({ name: 'Alice' });
```


## **Required**


`Required<Type>`工具类型构建一种类型，其中提供类型的所有属性都被设置为必需的。这对于确保在将对象保存到数据库之前，所有属性都是可用的非常有用。


例如，如果Required用于车辆注册，它将确保在创建或保存新的车辆记录时不会遗漏任何必要的属性，如品牌、型号和里程。这对数据完整性而言至关重要。


```javascript
interface Car {
  make: string;
  model: string;
  mileage?: number;
}

const myCar: Required<Car> = {
  make: 'Ford',
  model: 'Focus',
  mileage: 12000,
};
```


## **Readonly** 


`Readonly<Type>` 实用类型创建一个所有属性都是只读类型的类型。这在配置管理中非常有用，可以保护关键设置不被不必要地更改。


例如，当你的应用依赖于特定的 API 端点时，它们在应用运行过程中不应发生变化。将它们设为只读可以确保它们在应用的整个生命周期内保持不变。


```javascript
interface Config {
  apiEndpoint: string;
}

const config: Readonly<Config> = { apiEndpoint: 'https://api.example.com' };

// config.apiEndpoint = 'https://another-url.com'; // Error: Cannot assign to 'apiEndpoint'
```


## **Pick<Type, Keys>**


Pick<Type, Keys> 是一种工具类型，它通过从一个已存在的类型中挑选一组属性来构建一个新类型。这在需要筛选出重要信息时非常有用，例如用户的姓名和电子邮件，以在仪表板或摘要视图中显示。这有助于提高数据的安全性和清晰度。


```javascript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserSummary = Pick<User, 'name' | 'email'>;

const userSummary: UserSummary = {
  name: 'Alice',
  email: 'alice@example.com',
};
```


## **Omit<Type, Keys>**


`Omit<Type, Keys>` 工具类型通过从现有类型中排除特定属性来构造新类型。


例如，如果你想与第三方共享用户数据但不包含敏感信息（如电子邮件地址），“省略”功能将非常有用。你可以通过定义一个新类型来排除那些字段。特别是在API中，你可能需要注意你的API响应中传递出去的内容。


```javascript
interface User {
  id: number;
  name: string;
  email?: string;
}

const userWithoutEmail: Omit<User, 'email'> = {
  id: 1,
  name: 'Bob',
};
```


## **Record<Keys, Type>** 


Record<Keys, Type> 实用类型创建具有指定键和值的对象类型，这在处理结构化映射时非常有用。


例如，在库存管理系统的上下文中，Record类型可以在物品与数量之间进行显式映射。使用这种类型的结构，可以轻松访问和修改库存数据，同时确保所有预期的物品都被记录在案。


```javascript
type Fruit = 'apple' | 'banana' | 'orange';
type Inventory = Record<Fruit, number>;

const inventory: Inventory = {
  apple: 10,
  banana: 5,
  orange: 0,
};
```


## **Exclude<Type, ExcludedUnion>**


Exclude<Type, ExcludedUnion> 实用程序类型通过从联合类型中排除特定类型来构造一种类型。


在设计仅应接受某些原始类型（例如，数字或布尔值而不是字符串）的函数时，可以使用 Exclude。这可以防止由于意外类型在执行过程中可能导致的错误。


```javascript
type Primitive = string | number | boolean;

const value: Exclude<Primitive, string> = true; // Only allows number or boolean.
```


## **Extract<Type, Union>** 


Extract<Type, Union> 工具类型通过从联合类型中提取特定类型来构造类型。


在需要从混合类型的集合中处理仅有的数值（比如进行计算）的场景下，使用 Extract 可以确保只传递数字。这在数据处理管道中非常有用，因为严格的类型可以防止运行时错误。


```javascript
type Primitive = string | number | boolean;

const value2: Extract<Primitive, number> = 42; // Only allows numbers.
```


## **NonNullable**


NonNullable<Type> 工具类型通过从给定类型中排除 null 和 undefined 来构建一个类型。


在某些需要随时定义一些值的应用程序中，例如用户名或产品ID，将它们设为NonNullable（非空）可以确保这些关键字段永远不会为null或未定义。这在表单验证和来自API的响应中非常有用，因为缺少值可能会导致问题。


```javascript
type NullableString = string | null | undefined;

const value3: NonNullable<NullableString> = 'Hello'; // null and undefined are not allowed.
```


## **ReturnType**


ReturnType<Type> 工具类型用于提取函数的返回类型。


当处理高阶函数或返回复杂对象的回调（例如坐标）时，使用ReturnType可以简化定义预期的返回类型，而不需要每次手动声明它们。这可以通过减少与类型不匹配相关的错误来加快开发速度。


```javascript
type PointGenerator = () => { x: number; y: number };

const point: ReturnType<PointGenerator> = {
  x: 10,
  y: 20,
};
```


## **Parameters**


Parameters<Type> 工具会将函数的参数类型提取为一个元组。


这允许在希望动态地操作或验证函数参数的情况下，轻松提取和重用参数类型，例如在编写函数包装器时。通过确保函数签名的一致性，它极大地增加了代码库中代码的可重用性和可维护性。


```javascript
function createUser(name: string, age: number): User {
  return { name, age };
}

type CreateUserParams = Parameters<typeof createUser>;
```