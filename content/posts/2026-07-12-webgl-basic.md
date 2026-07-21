---
title: WebGL Basic
slug: 2026-07-12-webgl-basic
description: 一、 WebGL 简介与背景 1. WebGL 的定义与核心价值 WebGL (Web Graphics Library) 是一种用于
  Web 的 实时图形 API ，它允许在浏览器中直接驱动 2D 和 3D 图形渲染。 直接访问 GPU： 它最强大的特性是提供了对 GPU（图形处理器）
  处理能力的直接访问，使复杂计算…
author: 墨韵
date: 2026-07-12
categories:
  - note
tags:
  - frontend
  - WebGL
draft: false
notionId: 3a1df5c0-26f4-8058-bcba-ff26189b2e36
notionSyncedAt: 2026-07-21T07:41:54.603Z
---

## 一、 WebGL 简介与背景


### 1. WebGL 的定义与核心价值


**WebGL (Web Graphics Library)** 是一种用于 Web 的**实时图形 API**，它允许在浏览器中直接驱动 2D 和 3D 图形渲染。

- **直接访问 GPU：** 它最强大的特性是提供了对 **GPU（图形处理器）** 处理能力的直接访问，使复杂计算能够并行化处理。
- **Web 的便携性：** 与传统的桌面应用不同，WebGL 利用了 Web 的**便携性**和**用户友好型分发模型**，用户无需安装插件或额外软件即可在浏览器中体验高性能图形。
- **应用场景：** 除了常见的游戏、音乐网站和图形演示（Demos）外，它也被广泛用于 **Lucidchart** 等商业应用中，提供流畅的交互式绘图体验。

### 2. 技术渊源：从 OpenGL 到 WebGL


WebGL 并非凭空产生，它与图形学界的工业标准有着深刻的血缘关系：

- **OpenGL 的后代：** WebGL 与其父级 API **OpenGL** 几乎完全相同（注：WebGL 1.0 基于 OpenGL ES 2.0，WebGL 2.0 基于 OpenGL ES 3.0）。
- **概念通用性：** 学习 WebGL 是进入计算机图形学的绝佳起点，因为它涵盖了所有主流图形 API（如 OpenGL 家族）通用的核心概念。
- **环境优势：** 在传统的 C/C++ 开发中，处理图像文件解析和设置绘图表面（Drawing Surface）非常繁杂，而**浏览器**为 WebGL 处理了这些繁琐的底层开销，降低了入门门槛。

### 3. 版本演进：WebGL 1 与 WebGL 2


虽然目前存在两个版本，但现代开发的重点已发生转移：

- **推荐使用 WebGL 2：** WebGL 2 已经发布了很长时间，它比 WebGL 1 更加先进且功能丰富。
- **兼容性保障：** 尽管 WebGL 2 是首选，但在某些特殊的极端情况下（如极老旧的浏览器），可能仍需检查对 WebGL 1 的支持作为回退方案。

### 4. 现代图形技术栈中的定位


在当前的 Web 开发生态中，开发者有不同的路径选择：

- **高层库（Ease of Use）：** 如果追求开发速度和易用性，可以选择 **Three.js**、**Babylon.js**（侧重 3D）或 **PixiJS**（侧重 2D），这些库封装了 WebGL 的底层复杂性。
- **新一代 API（WebGPU）：** **WebGPU** 是比 WebGL 更现代的 API，具有更强的开发者友好性和更丰富的功能，适合追求极致低层控制的场景。
- **WebGL 的独特性：** 虽然有新技术出现，但 WebGL 依然是理解图形管线（Pipeline）和学习底层控制逻辑的基础，且兼容性目前最为广泛。

## 二、 核心挑战：为什么代码这么多？


绘制一个简单的“Hello Triangle”在 WebGL 中通常需要约 130 行代码。这种“代码量大”的现象并非设计缺陷，而是由其底层架构和追求极致性能的目标决定的。


核心挑战可以归纳为以下几点：


### 1. GPU 并行处理的复杂性 (Parallelism)


GPU 的设计初衷与 CPU 完全不同。虽然它处理单个任务的速度并不快，但它能**同时执行成千上万个任务**（并行化）。

- **拆分工作的代价：** 为了利用这种并行能力，开发者不能像在 CPU 上那样简单地写一个循环来画点。你必须将绘图工作拆分成一个个可以并行处理的“块”。
- **编写专属程序：** 你需要为每个顶点（Vertex Shader）和每个像素片段（Fragment Shader）编写独立的小程序（着色器），并手动配置它们如何在渲染管线中协作。

### 2. 独立的显存空间与数据传输 (Separate Memory)


GPU 拥有自己独立的内存区域，其工作方式与程序员习惯的主内存（RAM）截然不同。

- **不可直接读取：** GPU 无法直接读取 JavaScript 中的变量或数组。
- **复杂的搬运过程：** 将数据从 CPU 传输到 GPU 需要一系列繁琐的步骤：
    1. **转换格式：** 将 JavaScript 的 64 位浮点数数组转换为 GPU 偏好的 32 位浮点数（`Float32Array`）。
    2. **创建缓冲区：** 在 GPU 上申请空间（Buffer）。
    3. **绑定与上传：** 通过“附件点”（Attachment Point）建立连接，并使用 `bufferData` 将数据正式推送到显存。
    4. **提供性能暗示：** 你还必须告知 WebGL 数据的使用频率（如 `STATIC_DRAW`），以便驱动程序优化存储位置。

### 3. “状态机”模式与显式配置 (State Machine & Explicit Setup)


WebGL 沿用了 OpenGL 的**状态机模型**。在发出最终的绘制指令前，你必须事无巨细地配置好整个图形管线的状态。

- **输入汇编配置（最难的步骤）：** 你发送给 GPU 的数据只是原始的 0 和 1。GPU 并不知道这些二进制流代表什么。
- **手动定义解析规则：** 你必须使用 `vertexAttribPointer` 显式告诉 GPU：每几个数字组成一个属性？是从第几个字节开始读？数据类型是浮点数还是整数？。即便是像“步长”（Stride）和“偏移量”（Offset）这种底层的内存算术运算，也需要开发者自行计算或指定。

### 4. 缺乏自动化工具的调试挑战


由于 WebGL 是底层 API，它在运行时非常“沉默”：

- **着色器编译：** 顶点和片段着色器是以**字符串**形式写在 JavaScript 里的。这意味着你没有 IDE 的自动补全，甚至语法错误也只能在运行时通过 `getShaderParameter` 等指令手动检查并提取日志。
- **链接与兼容性：** 你还需要手动检查不同着色器阶段链接在一起时是否兼容（例如顶点着色器的输出是否能正确对接到片段着色器的输入）。

## 三、 图形渲染管线的概念流程


在 WebGL 的渲染流程中，数据从 CPU（JavaScript 应用逻辑）流向 GPU 并最终显示在屏幕上，需要经过一个多阶段的**图形渲染管线 (Graphics Rendering Pipeline)**。


### 1. 顶点定义与应用逻辑 (Application Logic)

- **原始数据：** 渲染始于在 JavaScript 中定义的三角形顶点。在本例中，每个顶点仅包含 **X 和 Y 坐标**，这些数据最初存储在系统的主内存（RAM）中。
- **内存转换：** 由于 GPU 偏好连续的、特定格式的二进制数据，开发者必须将 64 位浮点数的 JavaScript 数组转换为 **32 位浮点型数组 (****`Float32Array`****)**，以确保数据在内存中紧凑排列。

### 2. GPU 缓冲区数据传输 (Data Transfer & Buffers)

- **显存分配：** 开发者在 GPU 上创建一个**缓冲区 (Buffer)**（本质上是一块字节区域），并将数据从 RAM 传输到显存中。
- **数据足迹：** 一个由 3 个顶点组成的三角形，若每个顶点由 2 个 4 字节的浮点数构成，则总共占用 **24 字节** 的 GPU 显存。
- **绑定与暗示：** 通过将缓冲区绑定到 `ARRAY_BUFFER` 附件点，并使用 `STATIC_DRAW`（暗示数据不经常更新但会被频繁读取）来优化 GPU 的存储策略。

### 3. 顶点着色器 (Vertex Shader) —— 空间转换

- **并行处理：** 这是管线中第一个利用 GPU 并行能力的阶段。**每个顶点**都会独立运行一次顶点着色器小程序。
- **裁剪空间 (Clip Space)：** 顶点着色器的核心任务是决定点在裁剪空间中的最终位置。该空间的坐标范围是 **X (-1 到 1)** 和 **Y (-1 到 1)**。
- **内置输出：** 每个顶点着色器必须设置内置变量 `gl_Position`（一个 vec4 类型），其中包含 X, Y, Z（深度值，介于 -1 到 1 之间）和 W（用于透视除法，通常设为 1.0）。

### 4. 图元装配 (Primitive Assembly) —— 形状构建

- **连接顶点：** 在处理完所有顶点后，GPU 根据开发者的指令（如 `gl.TRIANGLES`）将这些孤立的点组合成几何形状。
- **默认逻辑：** WebGL 默认每三个顶点为一组，将其视为一个三角形。

### 5. 光栅化 (Rasterization) —— 从几何到像素

- **片段生成：** GPU 查看渲染窗口的尺寸，并将几何三角形转换为一系列待处理的像素列表，称为**像素片段 (Pixel Fragments)**。
- **三角形优势：** 相比其他复杂形状，三角形的光栅化算法极其简单高效，这也是它是图形学核心基石的原因。

### 6. 片段着色器 (Fragment Shader) —— 颜色计算

- **像素着色：** 每一个由光栅化生成的片段都会运行一次片段着色器，这又是另一个大规模并行的过程。
- **输出颜色：** 它的主要职责是输出该像素的 **RGBA 颜色值**。在本例中，所有像素被统一设置为靛蓝色（Indigo：29.4% 红，0% 绿，51% 蓝）。
- **多样性：** 片段着色器可以处理复杂的视觉效果，如阴影图生成（单通道输出）或 HDR（多颜色输出）。

### 7. 混合/输出合并 (Blending / Output Merging)

- **图像合成：** 这是管线的最后一步。WebGL 检查片段着色器输出的颜色，并根据当前画布上已有的像素（如背景色）进行**合并或覆盖**。
- **透明度处理：** 虽然在本例中只是简单覆盖背景，但在复杂场景中，这一步负责处理透明物体的相互遮挡和颜色混合。

### 关键配置：输入汇编 (Input Assembler)

- **解析规则：** 数据在 GPU 缓冲区里只是原始的 0 和 1。**输入汇编阶段**通过 `vertexAttribPointer` 告诉 GPU 如何解析这些数据（例如：每两个浮点数代表一个位置属性），从而将缓冲区与顶点着色器的输入属性相连接。

---


## 四、 开发环境与初始化


### 1. HTML 设置

- 使用 `<canvas>` 元素开辟绘图区域。
- 添加一个错误显示区域（Error Box），方便在移动端或调试时直接查看报错。
- 通过 `<script>` 标签引入 JavaScript 文件。

### 2. 获取 WebGL 上下文


```plain text
const canvas = document.getElementById('my-canvas');
const gl = canvas.getContext('webgl2'); // 推荐使用 WebGL 2 版本
if (!gl) {
    showError('不支持 WebGL 2');
}
```

- `gl` 是与 API 交互的核心对象（这只是命名惯例，并非关键字）。

---


## 五、 清理画布与设置颜色


在 WebGL 中，**清理画布**不仅是为了视觉上的美观（如设置背景色），更是管理 GPU 渲染状态的关键步骤。


### 1. WebGL 的渲染层级结构

- **透明层概念：** WebGL 渲染的图像实际上是覆盖在 HTML `<canvas>` 元素之上的一层**透明图像**。
- **Salmon（三文鱼色）调试法：** 即将 Canvas 的 CSS 背景色设为一种独特的颜色（如三文鱼色）。如果在运行中看到了这个颜色，说明 WebGL 的透明层处理或清理逻辑出现了问题。

### 2. 深入理解三大缓冲区 (Buffers)


WebGL 并不是只在单一图像上绘图，它维护着三个主要的缓冲区：

- **颜色缓冲区 (Color Buffer)：** 存储每个像素的 RGBA 颜色信息，是用户最终看到的画面。
- **深度缓冲区 (Depth Buffer)：** 存储每个像素的深度信息（Z 轴坐标），用于决定在 3D 空间中哪个物体在另一个物体前面。
- **模板缓冲区 (Stencil Buffer)：** 用于裁剪渲染区域或实现某些特殊图形特效。

### 3. 清除颜色的设置 (`gl.clearColor`)


在执行清除动作前，必须先定义“清除后是什么颜色”：

- **RGBA 值范围：** 这里的红色、绿色、蓝色和 Alpha（不透明度）参数不是 0-255，而是 **0.0 到 1.0 之间的浮点数**（比例值）。
- **Alpha 含义：** Alpha 代表不透明度（Opacity），即透明度的反面。0.0 代表完全透明，1.0 代表完全不透明

### 4. 执行清除与位掩码 (Bit Flags)


WebGL 沿用了 C 语言风格（OpenGL）的配置方式：

- **`gl.clear()`** **指令：** 该命令用于正式执行清除动作。
- **按位或 (Bitwise OR) 运算：** 为了提高效率，WebGL 允许通过 `|` 操作符将多个缓冲区的标志合并。例如，`gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)` 可以通过**一次函数调用**同时重置颜色和深度缓冲区。
- **默认状态：** 如果不调用 `gl.clearColor`，默认的清除颜色通常是完全透明的（即 Alpha 为 0）。

### 5. 关键陷阱：画布尺寸调整

- **重置机制：** 当通过 JavaScript 修改 Canvas 元素的 `width` 或 `height` 属性时，WebGL 会**自动生成一个新的透明图像**。
- **顺序要求：** 即使你之前调用过清除代码，一旦调整了尺寸，背景又会变回透明。因此，**必须在设置完画布尺寸后，再执行清除代码**。

### 6. 获取上下文的规范

- **版本选择：** 强烈建议获取 `webgl2` 上下文。虽然 WebGL 1 仍有极小众的兼容性需求，但 WebGL 2 已是现代开发的主流标准。
- **命名惯例：** 将返回的上下文对象命名为 `gl` 是行业通用惯例（非关键字），因为它简洁且在代码中会被高频使用。

```plain text
gl.clearColor(0.08, 0.08, 0.08, 1.0); // 设置清除颜色（深灰色）
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 执行清除
```


---


## 六、 缓冲区与数据传输


在 WebGL 中，将数据从 CPU（JavaScript）传输到 GPU 是渲染管线的关键步骤。


### 1. CPU 侧的数据准备


在 JavaScript 中定义好顶点坐标后，必须进行格式转换才能被 GPU 有效读取：

- **32 位浮点数：** JavaScript 默认使用 64 位浮点数，但 **GPU 偏好 32 位浮点数**。
- **内存连续性：** 普通 JavaScript 数组不保证数据在内存中是连续排列的。因此，必须使用 **`Float32Array`** 将数据打包成一个连续的二进制块（CPU 缓冲区），以便整体发送给 GPU。
- **坐标系：** 数据定义在**裁剪空间 (Clip Space)** 中，中心点为 (0,0)，范围从 -1 到 1。

### 2. 创建 GPU 缓冲区句柄

- **不透明句柄 (Opaque Handle)：** 使用 `gl.createBuffer()` 会在 GPU 上创建一个 WebGL 缓冲区对象。
- **句柄本质：** 这个返回的对象被称为“不透明句柄”，它本身不包含顶点数据，而是作为开发者与 GPU 显存通信的**引用标识**。

### 3. 状态机模式：绑定附件点 (Attachment Points)


WebGL 采用一种“间接”的方式操作缓冲区：

- **插槽概念：** 开发者不能直接向缓冲区写数据，必须先将其挂载到 GPU 的**附件点（也称绑定点）**上。
- **`ARRAY_BUFFER`****：** 对于顶点位置等属性数据，需要绑定到 `gl.ARRAY_BUFFER` 附件点。一旦绑定，后续所有针对该附件点的操作（如数据上传）都会作用于当前绑定的缓冲区对象。

### 4. 数据上传与性能暗示 (Usage Hints)


使用 `gl.bufferData()` 执行实际的传输工作，该函数不仅传输数据，还负责在 GPU 上分配内存：

- **内存分配：** WebGL 会根据 `Float32Array` 的大小，在显存中开辟对应字节的空间。
- **`gl.STATIC_DRAW`** **的意义：** 这是一个向显存驱动程序提供的**性能提示**。
    - **STATIC：** 告知 WebGL 这些数据在上传后不会经常更改（即“静态”数据）。
    - **DRAW：** 告知 WebGL 这些数据会被频繁用于绘图指令。
- **驱动优化：** 驱动程序会根据这个提示决定将数据存放在 GPU 的哪种类型内存中，以达到最优的读取效率。

### 5. 数据解析预告


此时，数据已作为一串原始的 0 和 1 存储在 GPU 中。尽管数据已经到位，但 GPU 此时仍然不知道如何解析这些二进制流（例如：每两个数字代表一个点，还是每三个数字代表一个点），这需要后续在“输入汇编 (Input Assembler)”阶段通过设置**顶点属性指针**来解决。


---


## 七、 着色器与 GLSL 编程


在 WebGL 开发中，**着色器（Shaders）**是运行在 GPU 上的小程序，使用 **GLSL**（OpenGL Shading Language）编写。由于它们是以字符串形式嵌入在 JavaScript 中的，因此需要一套独特的编译和管理流程。以下是根据视频内容整理的详细补充：


### 1. GLSL 语言基础与规范

- **版本声明：** 每一个 WebGL 2.0 的着色器必须以 `#version 300 es` 开头，且必须位于**代码的第一行**，前面不能有任何空格或换行。
- **精度设置：** 使用 `precision mediump float;` 声明浮点数精度。**`mediump`****（中精度）** 是移动端的理想选择，因为它在保证视觉效果的同时，比高精度（`highp`）更省电且运行更快。
- **线性代数类型：** GLSL 核心基于线性代数，频繁使用 `vec2`、`vec3` 和 `vec4`（分别代表 2、3、4 分量的向量）来处理坐标和颜色。

### 2. 顶点着色器 (Vertex Shader)

- **核心任务：** 接收原始顶点数据，并计算出它们在**裁剪空间（Clip Space）**中的最终位置。
- **输入属性 (Attributes)：** 使用 `in` 关键字声明从缓冲区读取的输入（例如 `in vec2 position;`）。
- **内置输出变量：** 每一个顶点着色器必须设置内置变量 **`gl_Position`**。它是一个 `vec4` 类型，包含：
    - **X, Y：** 裁剪空间坐标（-1.0 到 1.0）。
    - **Z：** 深度信息（-1.0 到 1.0），决定物体的前后遮挡关系。
    - **W：** 特殊分量，通常设为 `1.0`。在后续阶段，X、Y、Z 会被除以 W。

### 3. 片段着色器 (Fragment Shader)

- **核心任务：** 为光栅化后生成的每一个像素片段计算最终颜色。
- **手动声明输出：** 与顶点着色器不同，片段着色器没有内置的颜色输出变量，必须手动声明（例如 `out vec4 outColor;`）。
- **灵活的应用：** 虽然本例中仅输出了固定的**靛蓝色（Indigo: 29.4%红, 0%绿, 51%蓝）**，但片段着色器还常用于生成阴影贴图（单通道输出）或 HDR 渲染（多颜色输出）。

### 4. 编译与调试：WebGL 的“沉默”挑战


由于着色器在 JavaScript 中只是普通字符串，没有任何语法高亮或自动补全，调试极其困难。因此，**必须手动检查编译状态**：

1. **创建与编译：** 使用 `gl.createShader`、`gl.shaderSource` 和 `gl.compileShader`。
2. **错误捕获：** 调用 `gl.getShaderParameter(shader, gl.COMPILE_STATUS)` 检查是否编译成功。
3. **提取日志：** 如果失败，使用 **`gl.getShaderInfoLog`** 获取具体的错误信息（如变量未定义、语法错误等）并显示在屏幕上。

### 5. 着色器程序 (WebGL Program)

- **程序链接：** 顶点着色器和片段着色器不能独立工作。必须创建一个 **WebGL Program 对象**，将两者通过 `gl.attachShader` 附加后，调用 `gl.linkProgram` 进行链接。
- **兼容性检查：** 链接阶段会检查顶点着色器的输出与片段着色器的输入是否匹配。同样需要使用 `gl.getProgramParameter` 和 `gl.getProgramInfoLog` 检查链接错误。
- **属性寻址：** 链接完成后，通过 **`gl.getAttribLocation`** 获取着色器中属性（如 `position`）的索引。这通常是一个从 0 开始的数字，用于后续在绘图阶段将缓冲区数据精准对接到对应的着色器变量上。

### 总结


着色器不仅是绘图逻辑的核心，也是连接 CPU 数据和 GPU 处理能力的桥梁。通过 GLSL 编程，开发者可以将简单的 24 字节顶点数据，转化成屏幕上数以万计的彩色像素。


---


## 八、 配置图形管线状态


在 WebGL 中，**配置图形管线状态**是执行实际绘制指令之前的最后一步。这一阶段就像是“设置相机的参数”和“连接各个部件”，确保 GPU 知道如何解释内存中的二进制数据并将其渲染到屏幕的正确位置。、


### 1. 配置状态的时机与性能策略

- **配置时机：** 通常在着色器编译完成、几何数据已上传至 GPU 后进行。
- **状态切换开销：** 在 WebGL 中切换状态（State Switching）是耗时的操作。
- **性能优化：** 建议将共享相同状态的对象（如使用相同着色器的多个模型）进行**批处理 (Batching)**，以减少状态切换的频率。
- **顺序灵活性：** 除了绘制指令必须在最后执行外，管线中其他五个步骤的配置顺序通常不影响最终画面，但建议采用固定的逻辑顺序以提高代码可维护性。

### 2. 输出合并 (Output Merger)

- **画布尺寸：** 必须确保 `canvas` 元素的 `width` 和 `height` 属性设置为期望的像素大小（这与 CSS 样式设置的显示大小可能不同）。
- **关键陷阱：** 每当重新设置画布的宽度或高度时，WebGL 会自动生成一个全新的、默认透明的图像层。
- **修正操作：** **必须在调整画布尺寸后，重新执行清理画布的代码 (****`gl.clear`****)**，否则之前设置的背景色（如深灰色）会失效，变回 Salmon（三文鱼色）调试背景或透明色。

### 3. 光栅化配置 (Rasterizer)

- **视口设置 (****`gl.viewport`****)：** 告知光栅化阶段在画布的哪个区域进行绘图。
- **参数含义：** 接收四个参数：起始坐标 `x`、`y`，以及渲染区域的 `width` 和 `height`。
- **局部渲染：** 如果只需要在画布的一部分绘图（例如在角落绘制一个小地图），可以调整视口参数，使光栅化器只专注于特定区域，从而节省处理开销。

### 4. GPU 程序加载 (GPU Program)

- **激活程序：** 使用 `gl.useProgram(program)` 告诉 GPU 当前绘图操作应使用哪一对顶点/片段着色器。
- **启用属性：** 这是一个容易遗漏的步骤：必须通过 `gl.enableVertexAttribArray(location)` 手动启用每一个需要在着色器中使用的输入属性（Attributes）。

### 5. 输入汇编配置 (Input Assembler) —— 最核心且复杂的步骤


这个阶段的任务是告诉 GPU 如何从原始的 0 和 1 二进制流中解析出顶点数据。

- **绑定缓冲区：** 在配置属性前，必须确保对应的缓冲区已绑定到 `gl.ARRAY_BUFFER` 附件点。
- **属性指针 (****`gl.vertexAttribPointer`****) 的六个参数：**
    1. **Index:** 属性的位置索引（通过 `getAttribLocation` 获取）。
    2. **Size:** 每个顶点的组件数量（例如位置坐标为 `vec2`，则该值为 2）。
    3. **Type:** 缓冲区中数据的二进制类型（如 `gl.FLOAT` 表示 32 位浮点数）。
    4. **Normalized:** 是否将整数归一化到 [-1, 1] 或 范围。对于直接定义的浮点数坐标，通常设为 `false`。
    5. **Stride (步长):** 两个连续顶点之间间隔的字节数。
        - 设为 `0`：让 WebGL 根据 `Size` 和 `Type` 自动计算。
        - 手动设置：例如两个 4 字节浮点数，步长可设为 `2 * 4 = 8` 字节。
    6. **Offset (偏移量):** 属性数据在缓冲区中开始读取的起始字节位置。在本例中从头开始读取，因此为 `0`。

### 6. 图元装配与最终绘制 (Primitive Assembly & Draw Call)

- **图元类型：** 开发者无需为图元装配编写繁杂代码，只需在绘制指令中指定图元类型。
- **绘制执行 (****`gl.drawArrays`****)：**
    - **参数 1:** 指定如何组织顶点（如 `gl.TRIANGLES` 表示每三个点组成一个独立三角形）。
    - **参数 2:** 起始顶点索引（通常从 0 开始）。
    - **参数 3:** 本次调用处理的顶点总数（绘制一个三角形需 3 个顶点）。

当这一切配置就绪并执行 `drawArrays` 后，数据就会沿着管线流向片段着色器，最终在屏幕上渲染出如 Indigo（靛蓝色）三角形等视觉成果。


---


## 九、 最终绘制


一切配置就绪后，执行绘制指令：


```plain text
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

- `gl.TRIANGLES`：告诉 GPU 将顶点作为独立的三角形处理。
- `0`：从数组的第一个顶点开始。
- `3`：处理三个顶点。

```javascript
/**
 * Hello Triangle —— WebGL 2 最小示例
 *
 * 目标：在 canvas 上画一个紫色三角形，走通完整渲染流程：
 *   1. 获取 WebGL2 上下文
 *   2. 把顶点数据上传到 GPU
 *   3. 编译顶点 / 片元着色器并链接成 Program
 *   4. 配置管线状态，发出绘制命令
 *
 * 坐标说明（裁剪空间 clip space）：
 *   - x、y 大致在 [-1, 1]
 *   - (0, 0) 在画面中心，(+1, +1) 在右上角，(-1, -1) 在左下角
 */

/** 把错误写到页面 #error-box，并同步打到控制台（方便手机端调试） */
function showError(errorText) {
  const errorBoxDiv = document.getElementById('error-box');
  const errorSpan = document.createElement('p');
  errorSpan.innerText = errorText;
  errorBoxDiv.appendChild(errorSpan);
  console.error(errorText);
}

function helloTriangle() {
  // ============================================================
  // 步骤 1：拿到 canvas 和 WebGL2 上下文
  // ============================================================
  //
  // canvas：浏览器里的一块绘图区域（HTML <canvas>）
  // gl：WebGLRenderingContext，之后所有绘制 API 都通过它调用
  //     画面最终会显示在关联的 canvas 上
  //

  // JSDoc 仅给 IDE 用，运行时会被忽略
  /** @type {HTMLCanvasElement|null} */
  const canvas = document.getElementById('demo-canvas');
  if (!canvas) {
    showError('Could not find HTML canvas element - check for typos, or loading JavaScript file too early');
    return;
  }

  // getContext('webgl2')：向浏览器申请 WebGL 2 上下文
  // 失败时返回 null（浏览器不支持、被禁用、或已被别的上下文占用）
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    // 再探测一下是「完全不支持 WebGL」还是「只支持 WebGL 1」
    const isWebGl1Supported = !!(document.createElement('canvas')).getContext('webgl');
    if (isWebGl1Supported) {
      showError('WebGL 1 is supported, but not v2 - try using a different device or browser');
    } else {
      showError('WebGL is not supported on this device - try using a different device or browser');
    }
    return;
  }

  // ============================================================
  // 步骤 2：准备顶点数据，并上传到 GPU Buffer
  // ============================================================
  //
  // 三角形三个角的 [x, y]，按「上 → 左下 → 右下」排列：
  //
  //            (0, 0.5) 上中
  //              /\
  //             /  \
  // (-0.5,-0.5)/____\(0.5,-0.5)
  //
  const triangleVertices = [
    // 上中
    0.0, 0.5,
    // 左下
    -0.5, -0.5,
    // 右下
    0.5, -0.5
  ];

  // Float32Array：连续的 32 位浮点数组，WebGL 能直接把这块内存交给 GPU
  // 普通 JS Array 不行，必须先转成类型化数组
  const triangleGeoCpuBuffer = new Float32Array(triangleVertices);

  // createBuffer()：在 GPU 上分配一个空的缓冲对象（此刻还没有数据）
  const triangleGeoBuffer = gl.createBuffer();

  // bindBuffer(target, buffer)：把 buffer 绑到指定「绑定点」
  //   - ARRAY_BUFFER：专门放顶点属性数据（位置、颜色、UV 等）
  // 之后对 ARRAY_BUFFER 的操作，都会作用到当前绑定的这个 buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);

  // bufferData(target, data, usage)：把 CPU 数据拷进当前绑定的 GPU buffer
  //   - data：这里是 Float32Array
  //   - usage 提示 GPU 怎么优化存储：
  //       STATIC_DRAW  —— 数据很少改，主要用于绘制（本例适用）
  //       DYNAMIC_DRAW —— 数据会频繁改
  //       STREAM_DRAW  —— 每帧几乎都换新数据
  gl.bufferData(gl.ARRAY_BUFFER, triangleGeoCpuBuffer, gl.STATIC_DRAW);

  // ============================================================
  // 步骤 3：编写、编译着色器，并链接成 Program
  // ============================================================
  //
  // 着色器是跑在 GPU 上的小程序，用 GLSL 语言编写。
  // WebGL 里通常把 GLSL 源码写成 JS 字符串，再交给 API 编译。
  //
  // 两类必备着色器：
  //   - 顶点着色器（vertex）：每个顶点跑一次，算出它在裁剪空间的位置
  //   - 片元着色器（fragment）：每个被三角形覆盖的像素跑一次，算出颜色
  //
  // Program = 顶点着色器 + 片元着色器 链接后的可执行组合
  //

  // ---------- 3.1 顶点着色器 ----------
  //
  // `#version 300 es`：声明这是 WebGL 2 / GLSL ES 3.00
  // `precision mediump float`：浮点默认用中等精度
  // `in vec2 vertexPosition`：每个顶点的输入（来自我们上传的 buffer）
  // `gl_Position`：内置输出，必须写成 vec4(x, y, z, w)
  //   这里 z=0、w=1，表示 2D、不做透视除法缩放
  //
  const vertexShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec2 vertexPosition;

  void main() {
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
  }`;

  // createShader(type)：创建着色器对象
  //   VERTEX_SHADER / FRAGMENT_SHADER
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);

  // shaderSource(shader, source)：写入 GLSL 源码字符串
  gl.shaderSource(vertexShader, vertexShaderSourceCode);

  // compileShader(shader)：编译；失败时不会抛异常，必须主动查询状态
  gl.compileShader(vertexShader);

  // getShaderParameter(shader, COMPILE_STATUS)：是否编译成功
  // getShaderInfoLog(shader)：失败时的编译错误信息
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(vertexShader);
    showError(`Failed to compile vertex shader: ${errorMessage}`);
    return;
  }

  // ---------- 3.2 片元着色器 ----------
  //
  // `out vec4 outputColor`：本片元最终写出的颜色（RGBA，每个分量 0~1）
  // 这里固定输出紫色，所以整个三角形都是同一颜色
  //
  const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;

  out vec4 outputColor;

  void main() {
    outputColor = vec4(0.294, 0.0, 0.51, 1.0);
  }`;

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(fragmentShader);
    showError(`Failed to compile fragment shader: ${errorMessage}`);
    return;
  }

  // ---------- 3.3 链接 Program ----------
  //
  // createProgram()：创建一个空的 GPU 程序对象
  // attachShader(program, shader)：挂上已编译好的着色器（通常各挂一个）
  // linkProgram(program)：把它们链接成可执行程序
  //   链接阶段会做：匹配 in/out、分配 attribute 位置、检查类型是否一致等
  //
  const helloTriangleProgram = gl.createProgram();
  gl.attachShader(helloTriangleProgram, vertexShader);
  gl.attachShader(helloTriangleProgram, fragmentShader);
  gl.linkProgram(helloTriangleProgram);

  // getProgramParameter(program, LINK_STATUS) / getProgramInfoLog(program)
  // 同样：失败不抛异常，必须自己查
  if (!gl.getProgramParameter(helloTriangleProgram, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(helloTriangleProgram);
    showError(`Failed to link GPU program: ${errorMessage}`);
    return;
  }

  // getAttribLocation(program, name)：
  //   查询着色器里某个 `in` 变量被分配到了哪个 attribute 槽位（整数下标）
  //   后面 vertexAttribPointer / enableVertexAttribArray 都要用这个下标
  //   返回 -1 表示链接后的程序里找不到这个名字（拼写错误或被优化掉）
  //
  // 注：WebGL 2 更推荐用 VAO（Vertex Array Object）一次性记录这套绑定关系；
  //     本示例为了好懂，仍用「手动绑定」的写法。
  const vertexPositionAttributeLocation = gl.getAttribLocation(helloTriangleProgram, 'vertexPosition');
  if (vertexPositionAttributeLocation < 0) {
    showError(`Failed to get attribute location for vertexPosition`);
    return;
  }

  // ============================================================
  // 步骤 4：配置管线状态，画出这一帧
  // ============================================================
  //
  // 下面多数调用只是「改状态」，真正干活的是最后的 drawArrays。
  // 状态设置的顺序大多可调，但 drawArrays 必须放在所有状态都就绪之后。
  //

  // ---------- 4.1 画布尺寸 + 清屏 ----------
  //
  // canvas.width / height：绘图缓冲的真实像素分辨率
  // canvas.clientWidth / clientHeight：CSS 布局尺寸
  // 两者对齐，避免画面被拉伸模糊
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // clearColor(r, g, b, a)：设置清屏要用的颜色（不会立刻清，只是记下来）
  gl.clearColor(0.08, 0.08, 0.08, 1.0);

  // clear(mask)：真正执行清屏
  //   COLOR_BUFFER_BIT —— 清颜色缓冲（用上面的 clearColor）
  //   DEPTH_BUFFER_BIT —— 清深度缓冲
  // 可用 | 组合多个缓冲一起清
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // ---------- 4.2 视口 ----------
  //
  // viewport(x, y, width, height)：
  //   规定裁剪空间 [-1,1] 映射到画布上的哪块像素区域
  //   通常设成整张画布；(0,0) 是画布左下角
  gl.viewport(0, 0, canvas.width, canvas.height);

  // ---------- 4.3 选用 Program，打开顶点属性 ----------
  //
  // useProgram(program)：后续绘制使用这套着色器组合
  gl.useProgram(helloTriangleProgram);

  // enableVertexAttribArray(index)：
  //   打开某个 attribute 槽位，否则 GPU 不会从 buffer 读数据
  //   （关闭时该属性会用 vertexAttrib* 设的常量值）
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);

  // ---------- 4.4 告诉 GPU：怎么从 buffer 解读顶点 ----------
  //
  // 先再次 bindBuffer：vertexAttribPointer 会读取「当前」ARRAY_BUFFER 绑定
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);

  // vertexAttribPointer(index, size, type, normalized, stride, offset)
  //   把「当前 ARRAY_BUFFER」里的数据布局，绑到指定 attribute 槽位：
  //
  //   index      —— attribute 槽位（getAttribLocation 的返回值）
  //   size       —— 每个顶点取几个分量（vec2 → 2，vec3 → 3）
  //   type       —— 每个分量的类型（这里是 FLOAT）
  //   normalized —— 整数类型是否先归一化到 [0,1]/[-1,1]；浮点一般 false
  //   stride     —— 从一个顶点跳到下一个顶点，要跨过多少字节
  //                 本例每个顶点只有 xy 两个 float → 2 * 4 = 8 字节
  //   offset     —— 从 buffer 开头跳过多少字节才是该属性的第一个数据
  //
  gl.vertexAttribPointer(
    /* index */
    vertexPositionAttributeLocation,
    /* size */
    2,
    /* type */
    gl.FLOAT,
    /* normalized */
    false,
    /* stride */
    2 * Float32Array.BYTES_PER_ELEMENT,
    /* offset */
    0
  );

  // ---------- 4.5 发出绘制命令 ----------
  //
  // drawArrays(mode, first, count)：
  //   按当前管线状态，从已绑定的顶点数据里取点并绘制
  //
  //   mode  —— 图元类型：
  //             TRIANGLES —— 每 3 个顶点组成一个三角形
  //             还有 POINTS、LINES、TRIANGLE_STRIP 等
  //   first —— 从第几个顶点开始（0 = 第一个）
  //   count —— 一共用几个顶点（三角形需要 3 个）
  //
  // 调用后 GPU 大致流程：
  //   读顶点 → 跑顶点着色器 → 组装三角形 → 光栅化成像素 → 跑片元着色器 → 写入画布
  //
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

try {
  helloTriangle();
} catch (e) {
  showError(`Uncaught JavaScript exception: ${e}`);
}
```