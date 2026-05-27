---
title: 深入浅出 JavaScript 继承 - 7 个强大技巧
slug: 2024-11-23-javascript-7
description: 在 JavaScript 中，继承是重用代码和管理复杂对象关系的一种基本方式。
author: 墨韵
date: 2024-11-23
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-80cc-8b54-cd6a3cbdf263
notionSyncedAt: 2026-05-27T04:34:44.753Z
---

在 JavaScript 中，继承是重用代码和管理复杂对象关系的一种基本方式。凭借其基于原型的模型，JavaScript 拥有几种继承模式，每种模式都提供了独特的优势。让我们探讨这些技术，并了解每种模式在何时最为有效。


# **1. 原型链继承**


原型链继承是最直接的继承方法之一。它允许一个对象通过连接原型的“链”继承属性和方法。


```javascript
function Animal() {
  this.species = 'Mammal';
  this.habits = ['sleep', 'eat'];
}
function Dog() {
  this.breed = 'Bulldog';
}
Dog.prototype = new Animal();

let d1 = new Dog();
let d2 = new Dog();
d1.habits.push('bark');
```


优点：简单设置；使子类能够访问所有父原型方法。


缺点：共享引用类型可能导致副作用；父构造函数为每个实例调用。


# **2. 构造函数继承**


在这个模式中，子对象通过在子构造函数中直接调用父构造函数来继承属性。


```javascript
function Animal(species) {
  this.species = species;
  this.activities = [];
}
function Dog(breed) {
  Animal.call(this, 'Mammal');
  this.breed = breed;
}
```


优点：每个实例具有独特的属性；可以将参数传递给父类。


缺点：实例间无法复用方法，可能导致冗余。


# **3. 复合继承**


复合继承将原型链和构造函数继承合并，为子类提供独特的属性并访问父类方法。


```javascript
function Animal(species) {
  this.species = species;
  this.activities = [];
}
Animal.prototype.getSpecies = function() {
  return this.species;
};
function Dog(breed) {
  Animal.call(this, 'Mammal');
  this.breed = breed;
}
Dog.prototype = new Animal();
Dog.prototype.constructor = Dog;
```


优点：子类有它们自己的属性和原型方法。


缺点：父构造函数被调用两次，增加了开销。


# **4. 寄生继承**


寄生继承中，创建、修改并返回一个对象，使继承变得灵活但增加了复杂性。


```javascript
function Animal() {
  this.species = 'Mammal';
  this.habits = ['eat', 'sleep'];
}
function Dog() {
  Animal.call(this);
  this.breed = 'Bulldog';
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
```


优点：允许在克隆对象上扩展原型。


缺点：不太适合大型继承结构。


# **5. 原型继承**


这种模式使用 **`Object.create`** 直接创建具有指定原型的对象。


```javascript
let animal = {
  species: 'Mammal',
  traits: ['warm-blooded', 'vertebrate']
};
function createClone(obj) {
  let clone = Object.create(obj);
  clone.getTraits = function() {
    return this.traits;
  };
  return clone;
}
let dog = createClone(animal);
```


优点：简单且不需要构造函数。


缺点：所有实例共享原型属性。


# **6. 寄生组合继承**


一种改进的复合继承，通过使用 **`Object.create`** 来复制属性，避免了多次构造函数调用。


```javascript
function Animal(species) {
  this.species = species;
  this.traits = [];
}
function Dog(breed) {
  Animal.call(this, 'Mammal');
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
```


优点：解决双重构造函数调用；保留复合优势。


缺点：代码复杂性和需要额外的封装。


## **7. ES6 类继承**


使用 ES6，JavaScript 引入了 **`class`** 语法，使继承对开发者来说更加直观。


```javascript
class Animal {
  constructor(species) {
    this.species = species;
  }
  getSpecies() {
    return this.species;
  }
}

class Dog extends Animal {
  constructor(breed) {
    super('Mammal');
    this.breed = breed;
  }
}
```


优点：干净的、易于阅读的语法，类似于传统的面向对象编程。


缺点：可能需要转译；与基于原型的方法相比，性能略有差异。