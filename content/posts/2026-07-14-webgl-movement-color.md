---
title: WebGL - Movement, Color
slug: 2026-07-14-webgl-movement-color
description: 1. Uniform 变量 (Uniform Values) 在 WebGL 中， Uniform 变量（Uniform
  Values） 是着色器的一种重要输入方式，用于在图形渲染过程中提供全局配置信息。 1.1 定义与特性 配置变量属性 ：Uniform
  变量可以被看作是着色器的 配置变量 或输入参数。 全局统一性…
author: 墨韵
date: 2026-07-13
categories:
  - note
tags:
  - frontend
  - WebGL
draft: false
notionId: 3a3df5c0-26f4-803d-8513-cd0483d80c08
notionSyncedAt: 2026-08-21T10:23:23.057Z
---

## 1. Uniform 变量 (Uniform Values)


在 WebGL 中，**Uniform 变量（Uniform Values）**是着色器的一种重要输入方式，用于在图形渲染过程中提供全局配置信息。


### 1.1 定义与特性

- **配置变量属性**：Uniform 变量可以被看作是着色器的**配置变量**或输入参数。
- **全局统一性**：不同于随顶点变化的“属性（Attribute）”，Uniform 变量在一次绘制调用（Draw Call）中，对所有输入的顶点都**保持相同的值**。
- **作用域**：在 GLSL 着色器代码中，它们被放置在与输入属性相同的**顶层作用域**中。

### 1.2 核心功能：几何变换

- **无需重传数据**：通过更改 Uniform 值，开发者可以调整图形的大小（缩放）或位置（平移），而**无需重新上传**包含数千个顶点的缓冲区数据，这极大地提高了性能。
- **空间转换**：
    - 顶点着色器的核心任务是计算**裁剪空间坐标（Clip Space）**。
    - 通常将顶点位置定义在“模型空间”中，通过 Uniform 定义的变换矩阵或偏移量，将其映射到 WebGL 的裁剪空间。

### 1.3 像素坐标到裁剪空间的转换逻辑


为了方便以像素为单位控制图形，通常需要进行以下数学转换：

- **归一化百分比**：将顶点的像素位置除以画布的像素尺寸，得到 **0 到 1** 之间的百分比坐标。
- **范围映射**：由于裁剪空间期望的范围是 **1 到 1**，转换公式为：`结果 = (百分比 * 2) - 1`。
    - Y 轴方向：Canvas/WebGL 的像素坐标通常是 Y 轴向下，而裁剪空间 Y 轴向上。

        ```plain text
        float y= (pixelY/ height)* 2.0 - 1.0;
        y= -y;   // 翻转 Y 轴
        ```

    - Uniform 默认值为 0 的提醒非常重要！忘记设置 u_resolution 或 u_scale，导致图形变成一个点或完全不可见。
- **默认值陷阱**：Uniform 变量的默认值为 **0**。如果控制图形尺寸的 Uniform 忘记赋值，图形将因尺寸为 0 而无法显示。

### 1.4 程序端操作流程

- **获取位置**：在 JavaScript 中，首先需要通过 `gl.getUniformLocation` 获取着色器中对应变量的地址。
- **赋值时机**：Uniform 值的设置必须在**激活着色器程序**（`gl.useProgram`）之后、**执行绘制指令**（`gl.drawArrays` 等）之前完成。
- **赋值函数**：使用类似 `gl.uniform2f` 的方法进行赋值，其中 `2` 代表分量个数（如 X 和 Y），`f` 代表数据类型为浮点数。

## 2. 颜色与插值 (Color and Interpolation)


在 WebGL 中，**颜色与插值（Color and Interpolation）**是实现丰富视觉效果的核心。


### 2.1 颜色数据的传递流程

- **属性定义**：在顶点着色器中，除了位置属性（`a_position`）外，还需要增加一个**顶点颜色属性（****`vertexColor`****）**。
- **着色器间的桥接**：
    - **顶点着色器**：定义一个输出变量（`out`），例如 `fragmentColor`，并将接收到的顶点颜色直接传递给它。
    - **片元着色器**：定义一个同名、同类型（`vec3`）的输入变量（`in`）来接收该值。
- **链接检查**：WebGL 的链接阶段会检查着色器对。如果片元着色器的输入在顶点着色器中没有对应的输出（名称和类型必须完全匹配），将会产生链接错误。

### 2.2 插值（Interpolation）的原理

- **光栅化器的角色**：在顶点着色器处理完顶点后，**光栅化器（Rasterizer）**会将几何图形（如三角形）分解为像素。
- **自动混合**：对于光栅化器生成的每一个像素，它会自动对顶点着色器的输出值进行**线性插值**。
    - **示例**：如果三角形的三个顶点分别为红、绿、蓝，光栅化器会根据像素距离各顶点的远近，计算出一个混合后的颜色。
- **视觉效果**：这种机制使得三角形表面呈现出平滑的颜色渐变，而不是单一的纯色。这是实现 3D 光照模型等高级效果的基础。

### 2.3 数据优化：归一化（Normalization）

- **内存效率**：大多数显示器每颜色通道仅支持 8 位（256 色）。因此，使用 32 位浮点数存储颜色会浪费内存。
- **使用 Uint8**：建议使用 **8 位无符号整数（Uint8/Unsigned Byte）**来存储颜色值（0-255）。
- **归一化处理**：在调用 `gl.vertexAttribPointer` 时，将 `normalized` 参数设置为 `true`。
    - **作用**：WebGL 会自动将 0-255 的整数转换为 0.0 到 1.0 之间的浮点数，以便着色器直接使用。

### 2.4.开发中的常见问题

- **必须启用属性**：必须调用 `gl.enableVertexAttribArray` 来启用颜色属性。如果忘记这一步，WebGL 将使用默认值。
- **默认值陷阱**：属性的默认值通常是 **0**。如果属性未正确启用或数据未正确绑定，图形将显示为**纯黑色**（R:0, G:0, B:0）。
- **数据交错存储（Interleaving）**：为了性能，可以将位置和颜色数据放在同一个缓冲区中，通过设置正确的步长（Stride）和偏移量（Offset）来读取。

## 3. 顶点数组对象 (Vertex Array Objects, VAOs)


在 WebGL 中，**顶点数组对象（Vertex Array Objects, VAOs）** 是提升渲染效率和代码整洁度的核心机制。


### 3.1 核心定义：输入状态的“快照”

- **状态封装**：VAO 基本上是**输入汇编器状态（Input Assembler State）的快照**。它记录了所有关于顶点属性的配置信息。
- **对比传统方式**：在没有 VAO 时，绘制每个形状都需要重复：绑定缓冲区、更新关联属性、执行绘制，然后为下一个形状重复此过程。这种方式代码冗长且极易出错。
- **VAO 方式**：VAO 将这些复杂的属性设置“捕获”起来。在绘制时，你只需要**重新绑定 VAO** 并发出绘制指令，它就会自动恢复之前记录的所有属性绑定状态。

### 3.2 VAO 的主要优势

- **驱动程序效率**：VAO 允许图形驱动程序更高效地运行，因为它大幅**减少了状态更新（State Updates）的次数**。
- **代码简化**：渲染循环（Rendering Loop）变得非常简洁，不再需要大量的属性绑定代码，提升了代码的可读性和可维护性。
- **现代 API 的基础**：理解 VAO 有助于未来学习更高级的 API（如 Vulkan、Web GPU 或现代 OpenGL），因为这些 API 使用了非常相似的构造。

### 3.3 VAO 的操作逻辑与最佳实践

- **配置流程**：
    1. 创建一个 VAO 并将其绑定（`gl.bindVertexArray`）。
    2. 在绑定状态下，执行属性配置：启用顶点属性、绑定对应的缓冲区（Buffer）、设置属性指针（`gl.vertexAttribPointer`）。
    3. 完成配置后**解绑 VAO**（绑定到 null）。
- **防止全局状态污染**：
    - **重要提示**：在设置完 VAO 后将其解绑是一个非常好的习惯。
    - 由于 WebGL 存在大量的全局状态，如果不及时解绑，后续的操作可能会意外地覆盖或损坏已有的 VAO 配置，这类 bug 往往极难调试。
- **渲染阶段**：在实际渲染形状时，原本需要的 `gl.enableVertexAttribArray`、`gl.bindBuffer` 和 `gl.vertexAttribPointer` 等调用都可以被单次 `gl.bindVertexArray` 调用所取代。

### 3.4 数据组织的灵活性

- VAO 能够胜任不同的数据组织方式：
    - **独立缓冲区**：VAO 可以同时记录来自多个不同缓冲区的属性（例如位置在一个 Buffer，颜色在另一个 Buffer）。
    - **交错缓冲区（Interleaved Data）**：它同样可以记录在单个缓冲区中交错存储的位置和颜色数据。在这种情况下，VAO 会记录你手动指定的**步长（Stride）和偏移量（Offset）**信息。

通过使用 VAO，WebGL 应用从繁琐的底层属性管理中解脱出来，使得处理具有不同几何结构（如三角形、正方形、多段圆形）的复杂模拟变得更加容易。


## 4. 动画与模拟逻辑 (Animation and Simulation)


在 WebGL 动画与模拟逻辑中，核心目标是通过不断更新物体的状态并在屏幕上重新绘制，从而创造出连续运动的视觉效果。


### 4.1 动画的核心机制：请求动画帧

- **动画的本质**：动画实际上是快速连续显示的一系列图像。在 WebGL 中，这些图像不是预先生成的，而是根据应用程序的逻辑实时生成的。
- **`requestAnimationFrame`**：这是浏览器提供的关键 JavaScript 方法。它会在显示器准备好接收新图像时立即调用指定的函数（如 `frame` 函数）。
- **递归调用**：通过在 `frame` 函数内部再次调用 `requestAnimationFrame`，可以创建一个持续循环，使浏览器以约每秒 60 次的速度不断重绘图像。

### 4.2 时间驱动的模拟：Delta Time (DT)

- **计算 DT**：为了让运动平滑且不受帧率波动影响，需要计算 **Delta Time (DT)**，即两帧之间经过的秒数。
    - 使用 `performance.now()` 获取高精度时间戳。
    - **公式**：`当前时间 - 上一帧时间 = DT`。计算完后需更新“上一帧时间”记录，供下一帧使用。
- **匀速运动**：位置的更新应基于 DT（例如：`位置 += 速度 * DT`）。这样无论电脑运行速度快慢，物体在现实时间中的移动速度都能保持一致。

### 4.3 形状对象的模拟逻辑 (Moving Shape Class)


通过创建一个类来管理每个运动形状的状态，可以实现复杂的模拟：

- **状态属性**：每个形状追踪其位置（像素坐标）、速度（像素/秒）、大小、受力（加速度）、剩余存活时间以及用于绘制它的 **VAO 引用**。
- **动态路径**：
    - **线性移动**：位置根据速度和 DT 更新。
    - **曲线移动**：引入“力（Force）”的概念。每一帧，速度会根据 `力 * DT` 进行改变，从而产生动态的曲线轨迹。

### 4.4 形状的生命周期管理


为了防止程序因物体过多而崩溃，必须管理形状的生成与销毁：

- **生成逻辑 (Spawning)**：
    - **生成率**：设置两次生成之间的时间间隔（如 0.08 秒）。
    - **While 循环技巧**：如果一帧内经过的时间（DT）超过了生成间隔，使用 `while` 循环可以在单帧内生成多个形状，确保生成速度稳定。
    - **随机化**：使用三角函数（正弦和余弦）将随机的角度和速率转换为 X/Y 速度分量，使形状向四周喷发。
- **销毁逻辑与内存清理**：
    - **存活时间**：为每个形状分配随机的生命周期（存活时间），每帧减去 DT。
    - **清理存活期满的形状**：使用 JavaScript 的 `filter` 方法移除所有“死亡”的形状（存活时间 $\le$ 0），以防止内存泄漏。
    - **数量限制**：使用 `slice` 限制数组的最大长度（如最多 250 个形状），作为防止系统失控的安全机制。

### 4.5 应用结构总结


一个完整的 WebGL 模拟应用分为两个阶段：

1. **设置与加载阶段**：在循环开始前，完成创建缓冲区、编译着色器、初始化 VAO 等所有耗时的 GPU 数据准备工作。
2. **渲染循环阶段 (Frame Function)**：
    - **计算 DT**。
    - **更新模拟逻辑**：移动形状、改变速度、检查生命周期、生成新形状。
    - **执行渲染**：根据更新后的状态，通过简单的绘制调用（Draw Calls）将模拟状态呈现出来。由于大部分工作已在设置阶段完成，这一步非常高效。

## 5. 数据组织与高级形状


### 5.1 数据组织的两种方式


在处理顶点数据（如位置和颜色）时，通常有两种组织策略：

- **独立缓冲区（Separate Buffers）**：
    - **方式**：为位置和颜色分别创建独立的缓冲区（Buffer）。
    - **特点**：逻辑清晰，但在配置 VAO 时需要绑定多个缓冲区。
- **交错存储数据（Interleaving Data）**：
    - **方式**：将每个顶点的所有属性（如位置 X, Y 和颜色 R, G, B）紧挨着排列在同一个数组/缓冲区中（例如：`XYRGB, XYRGB...`）。
    - **优点**：减少了缓冲区的绑定次数，但在配置时需要手动计算内存布局。

### 5.2 交错数据的核心参数：步长与偏移量


当使用交错缓冲区时，WebGL 无法自动推断属性位置，必须手动指定两个关键参数：

- **步长 (Stride)**：
    - **定义**：指从一个顶点的起始位置到下一个顶点起始位置所经过的**字节数**。
    - **示例**：如果一个顶点包含 2 个位置浮点数和 3 个颜色浮点数，步长就是 `5 * Float32 字节数`。
- **偏移量 (Offset)**：
    - **定义**：指在一个顶点数据块内部，特定属性相对于起始位置的距离。
    - **示例**：位置属性的偏移量通常为 `0`；颜色属性的偏移量则是跳过位置坐标后的字节数（如跳过 2 个浮点数）。

### 5.3 高级形状的几何构建


WebGL 本身主要绘制三角形，复杂的形状需要通过数学模式或多个三角形组合而成：

- **正方形 (Square)**：
    - 由**两个三角形**并排拼接而成，总共需要 6 个顶点。
    - 通常一个三角形占据左下部分，另一个占据右上部分。
- **圆形 (Circle)**：
    - **构建原理**：圆形是由多个三角形“切片”组成的，类似于**切披萨或派**。
    - **顶点布局**：每个三角形的第一个顶点位于**圆心**，另外两个顶点位于**圆周边缘**，彼此之间有一定的角度间隔。
    - **平滑度控制**：圆形的平滑度取决于切片的数量（Segments）。切片越多，边缘越圆滑（例如使用 40 个切片效果优于 20 个）。
    - **数学生成**：由于硬编码圆形顶点非常繁琐，通常使用**三角函数（正弦和余弦）**根据数学模式动态生成顶点列表。

### 5.4 灵活的应用与性能

- **VAO 的适配性**：无论是独立缓冲区还是交错缓冲区，顶点数组对象（VAO）都能将其状态封装起来。这意味着在渲染循环中，你可以通过简单的 `gl.bindVertexArray` 调用在不同数据结构的形状（如三角形、正方形、圆）之间快速切换。
- **选择权衡**：源文件指出，没有绝对的“最佳”组织方式，选择独立缓冲区还是交错存储取决于具体项目的需求和硬件性能表现。

```javascript
/**
 * =============================================================================
 * WebGL「运动与颜色」演示程序
 * =============================================================================
 *
 * 【这个程序做什么？】
 * 想象一块 800×800 的画布，像烟花发射器一样，不断从某个点喷出
 * 彩色的小图形（三角形、正方形、圆形）。每个图形会：
 *   - 朝随机方向飞出去（速度）
 *   - 越飞越快或越飞越慢（加速度）
 *   - 过几秒后消失（生命周期）
 *
 * 【WebGL 在这里扮演什么角色？】
 * 浏览器的 Canvas 只是「显示窗口」，真正负责画像素的是 GPU（显卡）。
 * WebGL 是一套让 JavaScript 指挥 GPU 画图的 API。本 Demo 重点演示：
 *   1. 顶点颜色（Vertex Color）—— 每个角可以有不同的颜色，GPU 会自动渐变
 *   2. Uniform 变换 —— 同一套几何体，通过改「位置/大小」参数重复绘制
 *   3. VAO / Buffer —— 把顶点数据上传到 GPU 并记住如何读取
 *   4. 着色器（Shader）—— 在 GPU 上运行的小程序，负责算位置和颜色
 *
 * 【整体流程】
 *   初始化 → 上传几何数据到 GPU → 每帧更新物体位置 → 让 GPU 重画一帧 → 循环
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// 一、演示参数（调这些数字可以改变视觉效果）
// ---------------------------------------------------------------------------

/** 发射点每隔多少秒换一个位置（秒） */
const SPAWNER_CHANGE_TIME = 5;

/** 每隔多少秒生成一个新图形（数值越小，喷得越快） */
const SPAWN_RATE = 0.08;

/** 图形最短 / 最长存活时间（秒） */
const MIN_SHAPE_TIME = 0.25;
const MAX_SHAPE_TIME = 6;

/** 图形初始飞行速度范围（像素/秒）—— 越大飞得越快 */
const MIN_SHAPE_SPEED = 125;
const MAX_SHAPE_SPEED = 350;

/** 图形加速度大小范围（像素/秒²）—— 让轨迹不是直线，而是弧线 */
const MIN_SHAPE_FORCE = 150;
const MAX_SHAPE_FORCE = 750;

/** 图形显示尺寸范围（像素） */
const MIN_SHAPE_SIZE = 2;
const MAX_SHAPE_SIZE = 50;

/** 屏幕上最多同时存在多少个图形（防止 GPU 过载） */
const MAX_SHAPE_COUNT = 250;

/** 圆形由多少个三角形拼成 —— 段数越多圆越光滑，但顶点也越多 */
const CIRCLE_SEGMENT_COUNT = 40;

// ---------------------------------------------------------------------------
// 二、工具函数
// ---------------------------------------------------------------------------

/**
 * 把错误信息显示在页面底部的红色区域。
 * 为什么不用 console.log？因为在手机等环境下可能打不开开发者工具，
 * 直接在页面上显示错误更友好。
 */
function showError(errorText: string) {
  console.error(errorText);
  const errorBoxDiv = document.getElementById('error-box');
  if (errorBoxDiv === null) {
    return;
  }
  const errorElement = document.createElement('p');
  errorElement.innerText = errorText;
  errorBoxDiv.appendChild(errorElement);
}

// ---------------------------------------------------------------------------
// 三、着色器（Shader）—— 在 GPU 上运行的「画图公式」
// ---------------------------------------------------------------------------
//
// 可以把 GPU 想象成工厂流水线：
//   - 顶点着色器（Vertex Shader）：处理每个「角点」，决定它在屏幕上的位置
//   - 片段着色器（Fragment Shader）：处理每个「像素」，决定它显示什么颜色
//
// 着色器语言是 GLSL，语法类似 C，但运行在显卡上。

/**
 * 【顶点着色器】—— 每个顶点（角点）执行一次
 *
 * 输入：
 *   vertexPosition —— 图形局部坐标（以图形中心为原点，-1 到 1 之间）
 *   vertexColor    —— 该顶点的 RGB 颜色
 *   shapeLocation  —— 图形在画布上的中心位置（像素坐标）
 *   shapeSize      —— 图形缩放倍数
 *   canvasSize     —— 画布宽高（像素）
 *
 * 输出：
 *   gl_Position    —— 该顶点在屏幕上的最终位置（裁剪空间，-1 到 1）
 *   fragmentColor  —— 传给片段着色器的颜色（会在三角形内部自动插值渐变）
 */
const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec2 vertexPosition;
in vec3 vertexColor;

out vec3 fragmentColor;

uniform vec2 canvasSize;
uniform vec2 shapeLocation;
uniform float shapeSize;

void main() {
  // 把顶点颜色传递给片段着色器（GPU 会在三角形内部做颜色插值）
  fragmentColor = vertexColor;

  // 步骤 1：局部坐标 × 大小 + 位置 → 画布上的像素坐标
  vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;

  // 步骤 2：像素坐标 → 裁剪空间（WebGL 要求坐标在 -1 到 1 之间）
  //   画布左上角是 (0,0)，右下角是 (width, height)
  //   裁剪空间中心是 (0,0)，右下角是 (1, -1)（Y 轴向上为正）
  vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

  gl_Position = vec4(clipPosition, 0.0, 1.0);
}`;

/**
 * 【片段着色器】—— 每个像素执行一次
 *
 * 直接把顶点着色器传过来的颜色输出，
 * 不做任何额外计算。颜色渐变是 GPU 在顶点之间自动插值完成的。
 */
const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;

void main() {
  // vec4 的第四个分量是 alpha（透明度），1.0 表示完全不透明
  outputColor = vec4(fragmentColor, 1.0);
}`;

// ---------------------------------------------------------------------------
// 四、几何数据 —— 定义「长什么样、什么颜色」
// ---------------------------------------------------------------------------
//
// WebGL 不直接认识「三角形」「圆形」，它只认识「顶点列表」。
// 每个顶点至少需要：位置 (x, y) 和颜色 (r, g, b)。

/**
 * 用三角形扇（Triangle Fan）拼出一个近似圆形。
 *
 * 【原理】
 * 就像切蛋糕：从圆心出发，每切一刀形成一个三角形，
 * 切 40 刀就得到 40 个小三角形，拼起来看起来像圆。
 *
 * 【数据格式】
 * 这里采用「交错存储」：每个顶点是 (x, y, r, g, b) 五个数连在一起。
 * 圆心用浅蓝色，边缘用深蓝色，形成从中心向外的渐变。
 */
function buildCircleVertexBufferData() {
  const vertexData = [];

  for (let i = 0; i < CIRCLE_SEGMENT_COUNT; i++) {
    // 当前扇形两条边的角度（弧度制，0 到 2π 一圈）
    const vertex1Angle = i * Math.PI * 2 / CIRCLE_SEGMENT_COUNT;
    const vertex2Angle = (i + 1) * Math.PI * 2 / CIRCLE_SEGMENT_COUNT;

    const x1 = Math.cos(vertex1Angle);
    const y1 = Math.sin(vertex1Angle);
    const x2 = Math.cos(vertex2Angle);
    const y2 = Math.sin(vertex2Angle);

    // 圆心顶点 —— 浅蓝色
    vertexData.push(
      0, 0,                         // 位置：圆心 (0, 0)
      0.678, 0.851, 0.957           // 颜色：浅蓝（0~1 浮点数）
    );

    // 扇形边缘的两个顶点 —— 深蓝色
    vertexData.push(
      x1, y1,                       // 位置：圆周一上的点
      0.251, 0.353, 0.856
    );
    vertexData.push(
      x2, y2,
      0.251, 0.353, 0.856
    );
  }

  return new Float32Array(vertexData);
}

// --- 三角形：3 个顶点，每个顶点 2 个坐标 (x, y) ---
// 局部坐标系下，顶点在 y=1（上）、(-1,-1)（左下）、(1,-1)（右下）
const trianglePositions = new Float32Array([ 0, 1, -1, -1, 1, -1 ]);

// --- 正方形：6 个顶点（2 个三角形拼成），每个顶点 2 个坐标 ---
const squarePositions = new Float32Array([ -1, 1, -1, -1, 1, -1,  -1, 1, 1, -1, 1, 1 ]);

// RGB 三角形：三个角分别是红、绿、蓝 —— 演示顶点颜色插值
const rgbTriangleColors = new Uint8Array([
  255, 0, 0,    // 红
  0, 255, 0,    // 绿
  0, 0, 255,    // 蓝
]);

// 火焰色三角形：红 → 黄 → 橙 的暖色调
const fireyTriangleColors = new Uint8Array([
  229, 47, 15,   // 辣椒红
  246, 206, 29,  // 水仙黄
  233, 154, 26   // 姜黄
]);

// 靛蓝渐变正方形：上边浅紫、下边深紫
const indigoGradientSquareColors = new Uint8Array([
  167, 153, 255,  // 左上 —— 热带靛蓝
  88, 62, 122,    // 左下 —— 深紫
  88, 62, 122,    // 右下
  167, 153, 255,  // （第二个三角形的顶点）
  88, 62, 122,
  167, 153, 255
]);

// 纯灰色正方形：所有顶点同色
const graySquareColors = new Uint8Array([
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45
]);

// ---------------------------------------------------------------------------
// 五、WebGL 资源创建函数
// ---------------------------------------------------------------------------

/**
 * 创建 GPU 顶点缓冲区（Buffer），把 JavaScript 数组上传到显卡。
 *
 * 【类比】Buffer 就像把「图纸」复印一份交给 GPU 保管。
 * STATIC_DRAW 表示这些数据创建后不会频繁修改（适合几何形状）。
 */
function createStaticVertexBuffer(gl: WebGL2RenderingContext, data: BufferSource) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    showError('Failed to allocate buffer');
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return buffer;
}

/**
 * 创建 VAO（Vertex Array Object，顶点数组对象）—— 使用「两个独立 Buffer」
 *
 * 
 * VAO 是一张「说明书」，告诉 GPU：
 *   - 位置数据在哪个 Buffer 里、怎么读
 *   - 颜色数据在哪个 Buffer 里、怎么读
 * 绑定 VAO 后，drawArrays 就知道该读哪些数据了。
 *
 * 【本函数的数据布局】
 *   positionBuffer → 只存 (x, y)
 *   colorBuffer    → 只存 (r, g, b)，Uint8 格式（0~255），GPU 自动归一化到 0~1
 */
function createTwoBufferVao(
    gl: WebGL2RenderingContext,
    positionBuffer: WebGLBuffer, colorBuffer: WebGLBuffer,
    positionAttribLocation: number, colorAttribLocation: number) {
  const vao = gl.createVertexArray();
  if (!vao) {
    showError('Failed to allocate VAO for two buffers');
    return null;
  }

  gl.bindVertexArray(vao);

  // 启用两个顶点属性（告诉 GPU 这两个输入变量要从 Buffer 读取）
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

  // 配置「位置」属性：2 个 float，紧密排列，无偏移
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(
    positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

  // 配置「颜色」属性：3 个 unsigned byte，normalized=true 表示 0~255 映射到 0~1
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(
    colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindVertexArray(null);

  return vao;
}

/**
 * 创建 VAO —— 使用「交错 Buffer」（位置和颜色混在一个数组里）
 *
 * 【与上面两种 Buffer 的区别】
 * 交错格式：(x, y, r, g, b)(x, y, r, g, b)(x, y, r, g, b)...
 * 每个顶点占 5 个 float = 20 字节（stride）。
 * 位置从偏移 0 开始读 2 个 float，颜色从偏移 8 字节处读 3 个 float。
 *
 * 【何时用哪种？】
 * - 分开存：同一形状换颜色时，可以复用 positionBuffer
 * - 交错存：每个顶点颜色不同且固定时，读取效率可能更好
 */
function createInterleavedBufferVao(
    gl: WebGL2RenderingContext, interleavedBuffer: WebGLBuffer,
    positionAttribLocation: number, colorAttribLocation: number) {
  const vao = gl.createVertexArray();
  if (!vao) {
    showError('Failed to allocate VAO for two buffers');
    return null;
  }

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuffer);

  // stride = 5 个 float 的字节数；位置偏移 = 0
  gl.vertexAttribPointer(
    positionAttribLocation, 2, gl.FLOAT, false,
    5 * Float32Array.BYTES_PER_ELEMENT,
    0);

  // stride 相同；颜色偏移 = 跳过前 2 个 float（即 x, y）
  gl.vertexAttribPointer(
    colorAttribLocation, 3, gl.FLOAT, false,
    5 * Float32Array.BYTES_PER_ELEMENT,
    2 * Float32Array.BYTES_PER_ELEMENT);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindVertexArray(null);

  return vao;
}

/**
 * 编译并链接 GPU 程序（Program = 顶点着色器 + 片段着色器）
 *
 * 流程：创建 → 填入源码 → 编译 → 检查错误 → 链接成 Program
 * 任何一步失败都会在页面显示具体错误信息。
 */
function createProgram(
    gl: WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!vertexShader || !fragmentShader || !program) {
    showError(`Failed to allocate GL objects (`
      + `vs=${!!vertexShader}, `
      + `fs=${!!fragmentShader}, `
      + `program=${!!program})`);
    return null;
  }

  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(vertexShader);
    showError(`Failed to compile vertex shader: ${errorMessage}`);
    return null;
  }

  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(fragmentShader);
    showError(`Failed to compile fragment shader: ${errorMessage}`);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(program);
    showError(`Failed to link GPU program: ${errorMessage}`);
    return null;
  }

  return program;
}

/**
 * 从 Canvas 元素获取 WebGL 2 上下文（渲染接口）。
 * 如果浏览器只支持 WebGL 1 或完全不支持，抛出明确的错误提示。
 */
function getContext(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    const isWebGl1Supported = !!(document.createElement('canvas')).getContext('webgl');
    if (isWebGl1Supported) {
      throw new Error('WebGL 1 is supported, but not v2 - try using a different device or browser');
    } else {
      throw new Error('WebGL is not supported on this device - try using a different device or browser');
    }
  }

  return gl;
}

/** 生成 [min, max) 范围内的随机浮点数 */
function getRandomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ---------------------------------------------------------------------------
// 六、运动物体 —— CPU 侧的简单物理模拟
// ---------------------------------------------------------------------------

/**
 * 一个会在画布上运动的图形。
 *
 * 【物理模型】
 *   速度 += 加速度 × 时间
 *   位置 += 速度 × 时间
 *
 * force 在这里就是恒定加速度（不是力学里的「力」，但效果一样）。
 * timeRemaining 是倒计时，归零后图形被移除。
 *
 * vao / numVertices 指向 GPU 上已上传的几何体，渲染时直接引用。
 */
class MovingShape {
  constructor(
    public position: [number, number],    // 当前位置 [x, y]（像素）
    public velocity: [number, number],    // 当前速度 [vx, vy]（像素/秒）
    public force: [number, number],       // 恒定加速度 [ax, ay]（像素/秒²）
    public size: number,                  // 显示大小（缩放倍数）
    public timeRemaining: number,         // 剩余存活时间（秒）
    public vao: WebGLVertexArrayObject,   // GPU 上的几何体「说明书」
    public numVertices: number) {}        // 该几何体有多少个顶点

  /** 还活着吗？剩余时间 > 0 就算存活 */
  isAlive() {
    return this.timeRemaining > 0;
  }

  /**
   * 每帧更新一次状态。
   * @param dt —— 距上一帧经过的时间（秒），用于让动画速度与帧率无关
   */
  update(dt: number) {
    // 速度随加速度变化
    this.velocity[0] += this.force[0] * dt;
    this.velocity[1] += this.force[1] * dt;

    // 位置随速度变化
    this.position[0] += this.velocity[0] * dt;
    this.position[1] += this.velocity[1] * dt;

    // 倒计时
    this.timeRemaining -= dt;
  }
}

// ---------------------------------------------------------------------------
// 七、主程序 —— 初始化 + 动画循环
// ---------------------------------------------------------------------------

function movementAndColorDemo() {
  // --- 7.1 获取 Canvas 和 WebGL 上下文 ---
  const canvas = document.getElementById('demo-canvas');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw new Error('Failed to get demo canvas reference');

  const gl = getContext(canvas);

  // --- 7.2 上传所有几何数据到 GPU ---
  const triangleGeoBuffer = createStaticVertexBuffer(gl, trianglePositions);
  const rgbTriangleColorBuffer = createStaticVertexBuffer(gl, rgbTriangleColors);
  const fireyTriangleColorBuffer = createStaticVertexBuffer(gl, fireyTriangleColors);

  const squareGeoBuffer = createStaticVertexBuffer(gl, squarePositions);
  const indigoGradientSquareColorBuffer = createStaticVertexBuffer(gl, indigoGradientSquareColors);
  const graySquareColorsBuffer = createStaticVertexBuffer(gl, graySquareColors);

  const circleInterleavedBuffer = createStaticVertexBuffer(gl, buildCircleVertexBufferData());

  if (!triangleGeoBuffer || !rgbTriangleColorBuffer || !fireyTriangleColorBuffer
      || !squareGeoBuffer || !indigoGradientSquareColorBuffer || !graySquareColorsBuffer
      || !circleInterleavedBuffer) {
    showError(`Failed to create vertex buffers (triangle pos=${!!triangleGeoBuffer},`
      + `, rgb tri color=${!!rgbTriangleColorBuffer}`
      + `, firey tri color=${!!fireyTriangleColorBuffer}`
      + `, square geo=${!!squareGeoBuffer}`
      + `, indigo square color=${!!indigoGradientSquareColorBuffer}`
      + `, gray square color=${!!graySquareColorsBuffer}`
      + `, circle=${!!circleInterleavedBuffer})`);
    return null;
  }

  // --- 7.3 编译着色器，创建 GPU 程序 ---
  const movementAndColorProgram = createProgram(gl, vertexShaderSourceCode, fragmentShaderSourceCode);
  if (!movementAndColorProgram) {
    showError('Failed to create Movement and Color WebGL program');
    return;
  }

  // 查询着色器中变量在 GPU 程序里的「槽位编号」
  // attribute = 每个顶点不同的数据（位置、颜色）
  const vertexPositionAttributeLocation = gl.getAttribLocation(movementAndColorProgram, 'vertexPosition');
  const vertexColorAttributeLocation = gl.getAttribLocation(movementAndColorProgram, 'vertexColor');
  if (vertexPositionAttributeLocation < 0 || vertexColorAttributeLocation < 0) {
    showError(`Failed to get attribute locations: (pos=${vertexPositionAttributeLocation},`
      + ` color=${vertexColorAttributeLocation})`);
    return;
  }

  // uniform = 整次 draw 调用共享的数据（位置、大小、画布尺寸）
  const shapeLocationUniform = gl.getUniformLocation(movementAndColorProgram, 'shapeLocation');
  const shapeSizeUniform = gl.getUniformLocation(movementAndColorProgram, 'shapeSize');
  const canvasSizeUniform = gl.getUniformLocation(movementAndColorProgram, 'canvasSize');
  if (shapeLocationUniform === null || shapeSizeUniform === null || canvasSizeUniform === null) {
    showError(`Failed to get uniform locations (shapeLocation=${!!shapeLocationUniform}`
     + `, shapeSize=${!!shapeSizeUniform}`
     + `, canvasSize=${!!canvasSizeUniform})`);
    return;
  }

  // --- 7.4 为每种形状创建 VAO ---
  // 三角形和正方形：位置 Buffer 共享，颜色 Buffer 不同 → 同一形状换配色
  const rgbTriangleVao = createTwoBufferVao(
    gl, triangleGeoBuffer, rgbTriangleColorBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const fireyTriangleVao = createTwoBufferVao(
    gl, triangleGeoBuffer, fireyTriangleColorBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const indigoSquareVao = createTwoBufferVao(
    gl, squareGeoBuffer, indigoGradientSquareColorBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const graySquareVao = createTwoBufferVao(
    gl, squareGeoBuffer, graySquareColorsBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);

  // 圆形：位置和颜色交错存储在一个 Buffer 里
  const circleVao = createInterleavedBufferVao(
    gl, circleInterleavedBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);

  if (!rgbTriangleVao || !fireyTriangleVao || !indigoSquareVao || !graySquareVao || !circleVao) {
    showError(`Failed to create VAOs: (`
      + `rgbTriangle=${!!rgbTriangleVao}, `
      + `fireyTriangle=${!!fireyTriangleVao}, `
      + `indigoSquare=${!!indigoSquareVao}, `
      + `graySquare=${!!graySquareVao}, `
      + `circle=${!!circleVao})`);
    return;
  }

  // 所有可选的「形状模板」—— 生成新物体时随机挑一个
  const geometryList = [
    { vao: rgbTriangleVao, numVertices: 3 },
    { vao: fireyTriangleVao, numVertices: 3 },
    { vao: indigoSquareVao, numVertices: 6 },
    { vao: graySquareVao, numVertices: 6 },
    { vao: circleVao, numVertices: CIRCLE_SEGMENT_COUNT * 3 },  // 每段 3 顶点
  ];

  // --- 7.5 初始化动画状态 ---
  let shapes: MovingShape[] = [];           // 当前屏幕上所有活着的图形
  let timeToNextSpawn = SPAWN_RATE;         // 距离下次生成的倒计时
  let spawnPosition: [number, number] = [   // 当前「发射点」位置
    getRandomInRange(canvas.width * 0.1, canvas.width * 0.9),
    getRandomInRange(canvas.height * 0.1, canvas.height * 0.9),
  ];
  let timeToSpawnerChange = SPAWNER_CHANGE_TIME;  // 距离发射点换位置的倒计时

  // --- 7.6 动画循环（每帧调用一次） ---
  let lastFrameTime = performance.now();
  const frame = function () {
    // 计算本帧经过的时间（秒），让动画在不同帧率下速度一致
    const thisFrameTime = performance.now();
    const dt = (thisFrameTime - lastFrameTime) / 1000;
    lastFrameTime = thisFrameTime;

    // ---- 更新发射点 ----
    timeToSpawnerChange -= dt;
    if (timeToSpawnerChange < 0) {
      timeToSpawnerChange = SPAWNER_CHANGE_TIME;
      // 在画布中心 80% 区域内随机选新位置
      spawnPosition = [
        getRandomInRange(canvas.width * 0.1, canvas.width * 0.9),
        getRandomInRange(canvas.height * 0.1, canvas.height * 0.9),
      ];
    }

    // ---- 生成新图形 ----
    timeToNextSpawn -= dt;
    while (timeToNextSpawn < 0) {
      timeToNextSpawn += SPAWN_RATE;

      // 随机决定飞行方向和加速度方向（0~2π 全方向）
      const movementAngle = getRandomInRange(0, 2 * Math.PI);
      const movementSpeed = getRandomInRange(MIN_SHAPE_SPEED, MAX_SHAPE_SPEED);
      const forceAngle = getRandomInRange(0, 2 * Math.PI);
      const forceSpeed = getRandomInRange(MIN_SHAPE_FORCE, MAX_SHAPE_FORCE);

      const position: [number, number] = [ spawnPosition[0], spawnPosition[1] ];
      const velocity: [number, number] = [
        Math.sin(movementAngle) * movementSpeed,
        Math.cos(movementAngle) * movementSpeed
      ];
      const force: [number, number] = [
        Math.sin(forceAngle) * forceSpeed,
        Math.cos(forceAngle) * forceSpeed
      ];
      const size = getRandomInRange(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);
      const timeRemaining = getRandomInRange(MIN_SHAPE_TIME, MAX_SHAPE_TIME);

      const geometryIdx = Math.floor(getRandomInRange(0, geometryList.length));
      const geometry = geometryList[geometryIdx];

      const shape = new MovingShape(position, velocity, force, size, timeRemaining, geometry.vao, geometry.numVertices);

      shapes.push(shape);
    }

    // ---- 更新所有图形的位置 ----
    for (let i = 0; i < shapes.length; i++) {
      shapes[i].update(dt);
    }
    // 移除已「死亡」的图形，并限制最大数量
    shapes = shapes.filter((shape) => shape.isAlive()).slice(0, MAX_SHAPE_COUNT);

    // ---- 渲染本帧 ----
    // 同步 canvas 内部分辨率与 CSS 显示尺寸（防止模糊）
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // 清空画布为深灰色（如果 clear 失败，会看到 HTML 里设置的橙红色背景）
    gl.clearColor(0.08, 0.08, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(movementAndColorProgram);

    // 本帧所有图形共享的参数：画布尺寸
    gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

    // 逐个绘制每个图形 —— 每次改位置和大小，再 draw
    for (let i = 0; i < shapes.length; i++) {
      gl.uniform1f(shapeSizeUniform, shapes[i].size);
      gl.uniform2f(shapeLocationUniform, shapes[i].position[0], shapes[i].position[1]);
      gl.bindVertexArray(shapes[i].vao);
      gl.drawArrays(gl.TRIANGLES, 0, shapes[i].numVertices);
    }

    // 请求浏览器在下一帧再调用 frame（通常 60fps）
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// 启动演示；任何未捕获的错误都会显示在页面上
try {
  movementAndColorDemo();
} catch (e) {
  showError(`Uncaught JavaScript exception: ${e}`);
}
```