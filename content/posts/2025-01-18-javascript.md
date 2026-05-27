---
title: "使用 JavaScript 生成随机迷宫 "
slug: 2025-01-18-javascript
description: 随机迷宫
author: 墨韵
date: 2025-01-18
categories:
  - note
tags:
  - JavaScript
draft: false
notionId: 36ddf5c0-26f4-808e-a949-ca65d1742f8c
notionSyncedAt: 2026-05-27T04:40:20.456Z
---

[embed](https://codepen.io/phebert/pen/zYgqwVe)


# 定义约束


有很多不同类型的迷宫以及制作它们的方法。在开始编写代码之前，我仔细思考了对迷宫的需求以及避免陷入复杂性的因素。我最终确定了一些基本约束条件：

- 迷宫将是矩形的。
- 有一条穿过迷宫的唯一路径。
- 路径始终从左侧边缘到右侧边缘。
- 应该可以访问迷宫中的每一个方块。

## The Game Plan 


把迷宫创建过程分为三个步骤：

1. 创建一个矩形网格。
2. 找到从网格左侧到右侧的路径。
3. 偏离主路径以填充剩余的网格

### 第一步：创建矩形网格


首先，我们需要对我们的网格做一些选择。目前，我们将从一个十乘十的网格开始。我们将把这些选择存储为变量，以便以后重用并便于稍后更改：


```sql
const gridHeight = 10;
const gridWidth = 10;
```


### 第二步：在迷宫中找到一条路径


现在，我们需要找到从左侧边缘到右侧边缘的路径。我们可以将路径存储为一系列具有 X 和 Y 坐标的点。


我们需要为迷宫选择一个起点。我们将选择一个随机的 Y 坐标，并使用它添加两个点：一个位于网格的左侧边缘，另一个位于网格内部。


```sql
import { randomInt } from 'https://unpkg.com/randomness-helpers@0.0.1/dist/index.js';

function mainPathStartPoints() {
  const yStart = randomInt(0, gridHeight - 1);
  
  return [
    {
      x: -1, 
      y: yStart
    },
    {
      x: 0, 
      y: yStart
    }
  ]
}
```


从这里开始，我们需要构建我们路径的其余部分。首先，我们将编写一个函数，该函数接受一个点并返回它旁边网格上的一个随机点：


```sql
import { randomItemInArray } from 'https://unpkg.com/randomness-helpers@0.0.1/dist/index.js';

function findNextPoint(point) {
  // Build an array of adjacent points
  const potentialPoints = [];
  
  // If "up" is within our grid add it as a potential point
  if(point.y - 1 > 0) {
    potentialPoints.push({
      y: point.y - 1,
      x: point.x
    });
  }
  
  // If "down" is within our grid, add it as a potential point
  if(point.y + 1 < gridHeight) {
    potentialPoints.push({
      y: point.y + 1,
      x: point.x
    });
  }
  
  // If "left" is within our grid, add it as a potential point
  if(point.x - 1 > 0) {
    potentialPoints.push({
      y: point.y,
      x: point.x - 1
    });
  }
  
  // If "right" is within our grid, add it as a potential point
  if(point.x + 1 < gridWidth) {
    potentialPoints.push({
      y: point.y,
      x: point.x + 1
    });
  }

  // Randomly pick one of these points to add to our path  
  return randomItemInArray(potentialPoints);
}
```


我们可以反复调用此函数来构建我们的路径。当我们到达网格的右端时，我们将停止调用它。然后，我们将在右侧边缘外添加一个最终点。


```sql
function getMainPathPoints() {
  const mainPathPoints = mainPathStartPoints();

  // Keep adding points until our last point is on the right edge
  while(mainPathPoints.at(-1).x > gridWidth - 1) {
    mainPathPoints.push(findNextPoint(mainPathPoints.at(-1)));
  }

  // Add another point with the same Y coordinate as our final point, 
  // but off the right edge.
  mainPathPoints.push({
    x: gridWidth,
    y: mainPathPoints.at(-1).y
  });
}
```


[embed](https://codepen.io/phebert/pen/KKOyQwV)


目前逻辑有一个问题，我们的路线不断地折返。这样有几个问题：

- 迷宫里有太多的路可走了！
- 需要很长时间才能到达正确的边缘。
- 我们不知道我们已经填充了哪些单元格，所以我们不知道如何绘制迷宫的其余部分。

我们可以通过记录哪些单元格已经被访问过并且不再访问它们来解决所有这些问题。我们可以在 JavaScript 中创建一个二维数组，每个空单元格用0表示。为了标记一个单元格已被占用，我们可以将该0改为1。


```sql
const gridData = new Array(gridHeight).fill().map(
  () => new Array(gridWidth).fill(0)
);

//类似
[
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
```


我们将添加另一个功能来标记特定的网格单元格为“已被占用”，通过将 0 翻转为 1：


```sql
function markPointAsTaken(point, value = 1) {
  gridData[point.y][point.x] = value;
}
```


我们将添加另一个辅助函数，以检查特定的网格单元是否在网格内并且为空。（我们将更新上面编写的findNextPoint函数，只返回可用的点。）


```sql
function isCellEmpty(point) {
  // Check if the cell is off our grid
  if(
    point.x < 0 || 
    point.x >= gridWidth || 
    point.y < 0 || 
    point.y >= gridHeight || 
  ) {
    return false;
  }

  // Check the grid cell and see if it's empty.
  return gridData[point.y][point.x] === 0;
}
```


现在，我们已经拥有了穿过网格所需的所有工具。但我们还有一个决定需要做：如果我们遇到“困境”时该怎么办？（如果所有相邻的网格单元都被占用了，我们该怎么走？）


最简单的解决方案就是在我们遇到困境时选择放弃并重新开始我们的路径。点击下面的“绘制路径”几次，以查看实际效果。


[embed](https://codepen.io/phebert/pen/jOgaZKy)


但如果尝试用这个逻辑处理更大的网格，找到有效路径可能需要很长时间：


[embed](https://codepen.io/phebert/pen/ExqbQOp)


我们可以通过尝试“退回”几步来使我们的逻辑变得更聪明，如果我们陷入困境，就可以从另一个位置继续。这样有更好的机会在更少的尝试中找到通过网格的路径。（如果我们真的陷入困境，我们还是会从头开始。）尝试下面的演示来查看这个选项的实际效果。


[embed](https://codepen.io/phebert/pen/xxvPYmy)


### **步骤 3：从主路径分支，填充剩余的网格。**


现在我们有了主路径，我们只需要填写网格。我们将添加一个辅助函数，它会告诉我们网格中的每个单元格是否被占用：


```sql
function mazeComplete() { 
  // Flatten our array of arrays into a single array.
  // Then check whether they're all set to 1.
  return gridData.flat().every(cell => cell === 1);
}
```


现在，我们可以持续循环直到网格填满。我们将创建一个额外的路径数组，并用点填充它。在每次循环中，我们将执行几个步骤：

1. 遍历每条路径，如果可能的话，向路径中添加另一个点
2. 遍历我们所有路径中的所有点，随机在这些点中添加新的路径
3. 继续直到网格填满！

```sql
import { randomChance } from 'https://unpkg.com/randomness-helpers@0.0.1/dist/index.js';

const otherPaths = [];

function buildOtherPaths() {
  while(!mazeComplete()) { 
    // Add some more paths
    addMorePaths();
  
    // Iterate over our paths
    otherPaths.forEach((path) => {
      // Try and add another point to each path
      const nextPoint = findNextPoint(path.at(-1));
      
      if(nextPoint) {
        path.push(nextPoint);
        markPointAsTaken(nextPoint);
      }
    });
  }
}

function addMorePaths() {
  // Iterate over all of the cells in the grid
  gridData.forEach((row, y) => {
    row.forEach((cell, x) => {
      // If a cell is occupied, set a 10% chance to start a new path from that cell
      if(cell && randomChance(0.1)) {
        otherPaths.push([{
          y,
          x,
        }]);
      }
    })
  })
}
```


上述代码将持续添加新路径并扩展这些路径，直到整个网格填满。这为我们提供了一个完整的迷宫！点击“随机化”以生成新的迷宫！


[embed](https://codepen.io/phebert/pen/zYgqwVe)