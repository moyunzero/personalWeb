---
title: "HTML5 Canvas "
slug: 2026-05-24-html5-canvas
description: 1. 渲染上下文 (Rendering Context) Canvas 元素本身只是一个 画布容器
  （位图表面），所有绘图操作都必须通过 JavaScript 获取其 渲染上下文 对象来完成。 获取方式 ： 上下文类型 ：
  ：CanvasRenderingContext2D 接口，提供丰富的 2D 绘图 API。 /…
author: 墨韵
date: 2026-05-24
categories:
  - note
tags:
  - canvas
  - frontend
draft: false
notionId: 3a1df5c0-26f4-804d-ab3b-c95366b1703d
notionSyncedAt: 2026-07-18T09:02:45.622Z
---

### 1. 渲染上下文 (Rendering Context)


Canvas 元素本身只是一个**画布容器**（位图表面），所有绘图操作都必须通过 JavaScript 获取其**渲染上下文**对象来完成。

- **获取方式**：

    ```javascript
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');   // 2D 上下文（最常用）
    ```

- **上下文类型**：
    - `'2d'`：CanvasRenderingContext2D 接口，提供丰富的 2D 绘图 API。
    - `'webgl'` / `'webgl2'`：用于 3D 渲染（WebGL）。
    - `'bitmaprenderer'` 等其他上下文。
- **继承机制**：绘图方法（如 `arc`、`fillRect`）定义在 `CanvasRenderingContext2D` 的原型链上。上下文对象包含所有样式属性和绘制方法。

**最佳实践**：只获取一次上下文并缓存，避免重复调用 `getContext()`。


### 2. 坐标系统与基础形状

- **坐标系统**：二维笛卡尔坐标系，原点 `(0, 0)` 位于**画布左上角**。X 轴向右，Y 轴向下（与屏幕坐标一致）。
- **基础矩形绘制**：
    - `fillRect(x, y, width, height)`：填充矩形（立即绘制）。
    - `strokeRect(x, y, width, height)`：绘制矩形轮廓。
    - `clearRect(x, y, width, height)`：清除指定区域像素（透明黑色）。

**路径版本**：`ctx.rect()` 只添加路径，需配合 `fill()` / `stroke()` 渲染。


### 3. 路径 API (Path API) 与画笔原理


Canvas 对复杂图形采用**路径（Path）**系统，类似于“提起画笔 → 移动 → 绘制 → 落笔渲染”。

- **核心流程**：
    1. `ctx.beginPath()`：开始一条新路径（清空当前子路径，防止与之前图形连接）。
    2. 定义路径：`moveTo()`、`lineTo()`、`arc()`、`bezierCurveTo()` 等。
    3. 渲染：`ctx.fill()`（填充内部）或 `ctx.stroke()`（绘制轮廓）。
    4. `ctx.closePath()`：闭合路径（可选）。
- **绘制圆弧**：

    ```javascript
    ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    ```

    - `x, y` 是**圆心坐标**。
    - 角度单位为**弧度**（radians）：完整圆 = `Math.PI * 2`。
    - `startAngle = 0` 为正 X 轴方向。
- **高级路径**：
    - `ellipse()`：椭圆。
    - `roundRect()`：圆角矩形（较新 API）。
    - `Path2D` 对象：可复用路径，提高性能。

### 4. 样式控制与动态色彩

- **全局样式属性**：
    - `ctx.fillStyle`：填充颜色/渐变/图案。
    - `ctx.strokeStyle`：轮廓颜色/渐变/图案。
    - `ctx.lineWidth`：线条宽度（默认 1）。
    - 其他：`lineCap`、`lineJoin`、`miterLimit`、`shadow*`（阴影）等。
- **HSL 颜色模型**（推荐用于动画）：

    ```javascript
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ```

    - Hue（色相）：0–360（0=红，120=绿，240=蓝）。
    - Saturation（饱和度）、Lightness（亮度）。
- **动态效果**：在动画循环中递增 `hue` 值即可实现彩虹/渐变色循环。
- **扩展**：
    - 渐变：`createLinearGradient()`、`createRadialGradient()`、`createConicGradient()`。
    - 图案：`createPattern(image, repetition)`。
    - 文本样式：`font`、`textAlign`、`textBaseline` 等。

### 5. 动画循环与视觉优化

- **动画循环**：
使用 `requestAnimationFrame(callback)` 创建平滑逐帧动画。它会根据浏览器刷新率（通常 60fps）递归调用自身。

    ```javascript
    function animate() {
      // 清屏 / 更新 / 绘制
      requestAnimationFrame(animate);
    }
    animate();
    ```

- **画布清理技巧**：
    - **完全清除**：`ctx.clearRect(0, 0, canvas.width, canvas.height)` —— 适合单个物体移动。
    - **拖尾效果（Trails）**：使用半透明覆盖：
    旧像素逐渐淡出，形成运动轨迹。

        ```javascript
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ```

- **性能优化**（大量粒子场景）：
    - 当粒子 `size < 0.3` 时，使用 `array.splice(i, 1)` 移除，避免无效计算。
    - 对象池（Object Pooling）：复用已销毁的对象，减少垃圾回收压力。
    - 高 DPI 适配：

        ```javascript
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        ```

    - 复杂场景考虑 `OffscreenCanvas` + Web Worker。
- **状态管理**：
    - `ctx.save()`：保存当前样式、变换、裁剪等状态。
    - `ctx.restore()`：恢复上一次保存的状态。
    - 常用于局部旋转、缩放、颜色变化。

### 6. 其他实用功能（进阶）

- **图像处理**：`drawImage()`、像素操作（`getImageData` / `putImageData`）。
- **变换**：`translate()`、`rotate()`、`scale()`、`transform()`。
- **合成**：`globalCompositeOperation`（多种混合模式）。
- **裁剪**：`clip()`。
- **文本**：`fillText()`、`strokeText()`、`measureText()`。

---


```javascript
// ========== 初始化 Canvas ==========
// 获取页面上的 canvas 元素，并拿到 2D 绘图上下文
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

// 存放所有存活粒子的数组；每帧会遍历更新/绘制，过小的粒子会被删除
const particleArray = [];

// 色相值（0–360），每帧递增，用来让粒子颜色随时间彩虹渐变
let hue = 0;

// 让画布尺寸与浏览器视口一致（注意：修改 width/height 会重置画布内容）
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 窗口缩放时同步调整画布尺寸，避免变形或留白
window.addEventListener('resize', function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ========== 鼠标位置 ==========
// 用对象记录鼠标坐标；初始为 undefined，表示尚未移动/点击
const mouse = {
    x: undefined,
    y: undefined,
};

// ========== 交互：点击 ==========
// 点击时更新鼠标位置，并在点击处一次生成 5 个粒子
canvas.addEventListener('click', function(event){
    mouse.x = event.x;
    mouse.y = event.y;
    for(let i = 0; i < 5; i++){
        particleArray.push(new Particle());
    }
});

// ========== 交互：鼠标移动 ==========
// 移动时持续更新鼠标位置，并在路径上不断生成粒子，形成拖尾
canvas.addEventListener('mousemove', function(event){
    mouse.x = event.x;
    mouse.y = event.y;
    // drawCircle();
    // ↑ 早期写法：直接在鼠标位置画圆。已改用粒子系统，故注释掉。
    for(let i = 0; i < 5; i++){
        particleArray.push(new Particle());
    }
});

// ========== 粒子类 ==========
// 每个粒子从当前鼠标位置出生，带随机速度与颜色，会逐渐缩小直至消失
class Particle{
    constructor(){
        // 出生位置 = 当前鼠标坐标
        this.x = mouse.x;
        this.y = mouse.y;
        // 初始半径：0.5 ~ 2.5，越小则存活帧数越少、拖尾越短
        this.size = Math.random() * 2 + 0.5;
        // 水平/垂直速度：各约 -2 ~ +2，粒子会向随机方向飘散
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 4 - 2;
        // 颜色取当前全局 hue，饱和度 100%、亮度 50%
        this.color = 'hsl(' + hue + ', 100%, 50%)';
    }

    // 每帧更新：位移 + 缩小
    update(){
        this.x += this.speedX;
        this.y += this.speedY;
        // 只要半径还大于 0.2，就每帧减小；衰减越快，拖尾越短
        if(this.size > 0.2){
            this.size -= 0.05;
        }
    }

    // 在当前坐标画一个实心圆
    draw(){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 处理所有粒子 ==========
// 更新、绘制，并在距离较近的粒子之间连线；过小的粒子从数组中移除
function handleParticles(){
    for(let i = 0; i < particleArray.length; i++){
        particleArray[i].update();
        particleArray[i].draw();

        // 两两比较：距离小于 100 时画连线，形成网状效果
        for(let j = i; j < particleArray.length; j++){
            const dx = particleArray[i].x - particleArray[j].x;
            const dy = particleArray[i].y - particleArray[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < 100){
                ctx.beginPath();
                ctx.moveTo(particleArray[i].x, particleArray[i].y);
                ctx.lineTo(particleArray[j].x, particleArray[j].y);
                // 连线颜色/粗细跟随粒子 i
                ctx.strokeStyle = particleArray[i].color;
                ctx.lineWidth = particleArray[i].size;
                ctx.stroke();
                ctx.closePath();
            }
        }

        // 半径小到几乎看不见时从数组删除；i-- 是为了 splice 后不跳过下一个元素
        if(particleArray[i].size <= 0.2){
            particleArray.splice(i, 1);
            i--;
        }
    }
}

// ========== 动画循环 ==========
function animate(){
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ↑ 完全清空画布：每帧擦光，没有残影，拖尾只靠「还活着的粒子」本身。
    //   与下面「半透明黑矩形」二选一；当前使用半透明覆盖以产生淡出拖尾。

    // 半透明黑色覆盖整屏：上一帧画面逐渐变暗，形成拖尾/残影效果
    // alpha 越小（如 0.02）拖尾越长；越大（如 0.2）拖尾越短、画面越干净
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    handleParticles();

    // 色相每帧 +1，粒子颜色会持续变化（超过 360 时 HSL 会自动回绕）
    hue += 1;

    // 请求浏览器在下一帧再调用 animate，形成约 60fps 的循环
    requestAnimationFrame(animate);
}

// 启动动画
animate();

/*
========== 本文件用到的 Canvas / 相关 API 速查 ==========

【HTMLCanvasElement】
  canvas.getContext('2d')
    获取 2D 绘图上下文 ctx，后续所有绘制都通过 ctx 调用。

  canvas.width / canvas.height
    画布内部像素宽高。赋值会重置画布内容与部分绘图状态。
    本例中与 window.innerWidth / innerHeight 对齐，铺满视口。

  canvas.addEventListener('click' | 'mousemove', ...)
    在 canvas 上监听鼠标事件（标准 DOM API，非 ctx 方法）。

【CanvasRenderingContext2D — 属性】
  ctx.fillStyle
    填充颜色（可用 css 色值，如 hsl(...)、rgba(...)）。
    影响 fill()、fillRect()。

  ctx.strokeStyle
    描边颜色。影响 stroke()。

  ctx.lineWidth
    描边线宽（像素）。本例用粒子半径作为连线粗细。

【CanvasRenderingContext2D — 路径与绘制】
  ctx.beginPath()
    开始一条新路径，清空当前路径状态，避免与上一段连在一起。

  ctx.arc(x, y, radius, startAngle, endAngle)
    向当前路径添加圆弧。角度单位为弧度。
    本例：0 ~ Math.PI * 2 画完整圆（粒子）。

  ctx.moveTo(x, y)
    将路径起点移到 (x, y)，不画线。

  ctx.lineTo(x, y)
    从当前点画直线到 (x, y)。

  ctx.closePath()
    将路径首尾闭合（本例画线段时也可省略，影响不大）。

  ctx.fill()
    用 fillStyle 填充当前路径（粒子实心圆）。

  ctx.stroke()
    用 strokeStyle / lineWidth 描边当前路径（粒子间连线）。

  ctx.fillRect(x, y, width, height)
    直接画填充矩形，无需 beginPath。
    本例用半透明黑矩形盖满画布，制造淡出拖尾。

  ctx.clearRect(x, y, width, height)   ← 代码中已注释
    清除矩形区域内像素为透明。
    若每帧 clearRect 整屏，则无残影；与 fillRect 半透明覆盖是两种清屏策略。

【与动画相关（非 Canvas 专属，但本例依赖）】
  requestAnimationFrame(callback)
    在下一帧重绘前调用 callback，形成流畅动画循环。
*/
```


### 学习资源推荐

- **MDN 官方文档**：
    - [Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
    - [CanvasRenderingContext2D](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D)