---
title: Jev – Prefill-Only Inference & Decision Models from Scratch
slug: 2026-11-03-jev-prefill-only-inference-decision-mode
description: 代码仓库：https://github.com/vivekkalyanarangan30/how jev works 概述
  不是教你“调用 API”，而是 从第一性原理 教你如何亲手构建一个 Prefill Only 决策模型 。 传统 LLM 的问题： Decode
  阶段是自回归的，每生成一个 token 就要完整跑…
author: 墨韵
date: 2026-11-03
categories:
  - note
tags:
  - ai
  - Jev
draft: false
notionId: 40ddf5c0-26f4-80eb-bddc-ee65983f017b
notionSyncedAt: 2026-11-16T08:23:28.703Z
---

> 代码仓库：[https://github.com/vivekkalyanarangan30/how-jev-works](https://github.com/vivekkalyanarangan30/how-jev-works)

## 概述

不是教你“调用 API”，而是**从第一性原理**教你如何亲手构建一个 **Prefill-Only 决策模型**。

传统 LLM 的问题：

- Decode 阶段是自回归的，每生成一个 token 就要完整跑一次模型
- 输出不可控（格式错误、废话、幻觉）
- 延迟随输出长度线性增长
- 概率难以直接被程序使用

Jev 的本质：

> 把大语言模型从“会说话的生成器”变成“只做一次前向传播就能给出结构化、可校准决策的高速决策引擎”。

最终目标是构建一个系统，让你输入一段状态（state）+ 一组问题，模型只做一次 Prefill，就返回每个问题的概率分布，且这些概率是**诚实校准**的（高置信度时真的准）。 

## 1. 什么是 Jev？Prefill vs Decode 深度解析

### 1.1 LLM 标准推理的两个阶段

**Prefill（预填充）阶段**：

- 输入整个 prompt（可能几百到几千个 token）
- 模型并行处理所有 token
- 计算并缓存每一层的 Key 和 Value（KV Cache）
- 这一步计算密集，但并行度高，相对高效

**Decode（解码）阶段**：

- 从第一个生成 token 开始
- 每生成一个新 token，都要把当前完整序列（包括已生成的）再喂进去跑一次完整前向
- 本质是“串行”的，无法有效并行
- 延迟 = 单步时间 × 输出 token 数

举例：

- 输入 500 个 token
- 生成 50 个 token 的 JSON
- 实际要跑 1 次 Prefill + 50 次 Decode

**Jev 的核心操作**：
直接跳过整个 Decode 阶段，只做一次 Prefill，然后从模型内部状态中“读取”决策结果。

好处：

1. 延迟变成固定的一次前向时间
2. 输出结构完全由你定义（不会乱说话）
3. 概率天然可校准，适合程序直接决策

## 2. Jev 三大接口深度讲解

Jev 提供三种决策类型，统一用“每个问题一个 Softmax”作为骨干：

### 2.1 Choice（名义型 / Nominal）

- 选项之间**无顺序关系**
- 例子：路由到哪个部门？`["billing", "technical", "sales"]`
- 输出：每个选项的概率 + 最终选择

### 2.2 Score（有序型 / Ordinal）

- 选项之间**有明确顺序**
- 例子：客户情绪强度？`["平静", "轻度沮丧", "愤怒", "非常愤怒"]`
- 输出：每个等级的概率 + 期望分数

### 2.3 Boolean / Noul（二元）

- 简单的 Yes / No
- 输出：P(Yes) 的概率
- 最常用，也是校准最容易的类型

强调：这三种接口的细微差别必须被尊重，但可以用统一的骨干架构实现，再根据类型做差异化处理。

## 3. 补充知识点

### 3.1. Attention 机制（尤其 Causal Attention）

**本质**：Attention 是一个“加权查询”操作。给定 Query（当前要处理的位置）、Key（所有可供参考的位置）、Value（对应的内容），输出是 Value 按注意力权重的加权和。

标准缩放点积 Attention：

$$
\mathrm{Att}(Q,K,V)=\mathrm{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

**Causal Attention 的唯一区别**：在 softmax 之前加一个**因果掩码** \(M\)，把“未来位置”的注意力分数强制置为-∞ （经 softmax 后权重为 0）：

$$
\mathrm{Att}_{\mathrm{Causal}}(Q,K,V)=\mathrm{softmax}\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V
$$

其中 $M_{ij}=0$ 当 $j \le i$（允许 attend 到当前及过去），其中 $M_{ij}<-∞ $  当 $j > i$（禁止 attend 到未来）。Causal mask 确保每个 token 只依赖**前面已经出现过的 token**，这是自回归生成和 Decoder-Only 架构的基础。

**与 Jev 的关联**：Jev 的 Decoder-Only 路径需要**自定义 Causal Mask**，在标准因果掩码的基础上进一步控制“哪些问题之间可以互相看见”。不理解标准 Causal Attention 的 mask 语义，就无法设计出正确的自定义多问题掩码。

### 3.2. KV Cache 的存储与复用原理

**问题背景**：自回归 Decode 每生成一个新 token，都要把“整个已生成序列”重新喂进模型跑一次完整前向。如果不做缓存，第 t 步就要重新计算前t-1个 token 在所有层的 Key 和 Value——大量计算是**重复的**。

**KV Cache 的做法**：在 Prefill 阶段一次性算出所有输入 token 在每一层的 Key 和 Value，存下来；Decode 第 t 步时，**只计算新 token 的 Q、K、V**，K 和 V 追加到缓存中，然后直接用缓存的完整 K/V 做 Attention。

Decode 第 _t_ 步的 

$$
\mathrm{Attention}_t
=
\mathrm{softmax}\left(
\frac{q_t\,[K_{\mathrm{cache}};\,k_t]^T}{\sqrt{d_k}}
\right)
[V_{\mathrm{cache}};\,v_t]
$$

**本质**：**以存换算**——用显存（存 KV）换计算（避免重复前向）。KV Cache 的显存占用与序列长度、层数、隐藏维度、批大小成正比，长序列下会成为显存瓶颈。

**与 Jev 的关联**：Jev 的核心操作是“一次 Prefill 后从 KV Cache 中读取决策”，而不是继续 Decode。如果不理解 KV Cache 里存的是什么、位于哪些位置、如何按层访问，就无法从特定决策点提取 logits。

### 3.3. Logits 是什么、Softmax 如何把 logits 变成概率

**Logits**：模型最后一层线性投影输出的**未归一化实数分数**，维度等于词表大小（或分类类别数）。它是“原始证据”，可正可负，不要求和为 1。

**Softmax**：把一组 logits 变成合法概率分布：

$$
p_i=\frac{\exp(z_i)}{\sum_j \exp(z_j)}
$$

其中 $z_i$ 是第 $i$ 个类别的 logit。Softmax 保留相对大小关系（logit 越大，概率越大），但把输出压缩到 $[0,1]$ 且总和为 1。

```python
logits = torch.tensor([2.1, -0.5, 1.3])
probs = torch.softmax(logits, dim=-1)   # tensor([0.6834, 0.0508, 0.2658])
```

**与 Jev 的关联**：Jev 的输出不是生成的文本，而是从决策点提取的 logits 经过 Softmax 得到的概率分布。Choice、Score、Boolean 三种接口的差异，本质上就是“对哪一组 logits 做 Softmax、如何解释 Softmax 的输出”。概率校准的目标（RLCD Loss）也是作用在这个概率分布上。

### 3.4. PyTorch 基础：Tensor 操作与模型前向

**Tensor**：PyTorch 中的多维数组，接口类似 NumPy，但支持 GPU 加速和自动求导。Jev 中所有输入拼接、mask 构造、张量切片都基于 Tensor 操作。

**模型前向传播**：在 `nn.Module` 子类中实现 `forward` 方法；调用模型实例时执行的就是 `forward`。

```python
class TinyDecisionHead(nn.Module):
    def __init__(self, d_in, n_classes):
        super().__init__()
        self.linear = nn.Linear(d_in, n_classes)

    def forward(self, x):          # x: [batch, d_in]
        logits = self.linear(x)    # [batch, n_classes]
        return logits
```

Jev 的关键前向不是“生成”，而是**一次** **`forward`** **调用后直接从中间表示或输出位置取 logits**。这要求你能读懂 `forward` 中每一层的 shape 变化，并能在指定位置用索引/切片提取张量。

### 3.5. Hugging Face Transformers 的使用

**核心抽象**：Hugging Face 把 Transformer 模型的使用收敛为 **Config / Tokenizer / Model** 的“铁三角”。加载一个预训练模型并做前向，通常只需要三行：

```python
from transformers import AutoConfig, AutoTokenizer, AutoModel

config = AutoConfig.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModel.from_pretrained("bert-base-uncased")

inputs = tokenizer("state: ... question: ...", return_tensors="pt")
outputs = model(**inputs)
last_hidden = outputs.last_hidden_state   # [batch, seq_len, hidden]
```

**为什么在 Jev 中重要**：Jev 的 Encoder-Only 路径和 Decoder-Only 路径都以一个预训练 Transformer 为骨干。你需要能够：

- 加载正确的模型类型（`AutoModel` / `AutoModelForCausalLM`）；
- 通过 `tokenizer` 把“状态 + 问题 + 选项”变成 input_ids 和 attention_mask；
- 访问 `outputs.hidden_states` 或 `outputs.logits`，从指定层/位置提取决策表示。

如果不会用 Transformers 加载和调用模型，Jev 的实现就只能从随机初始化的小模型开始，无法利用预训练知识。

### 3.6. VS Code Debugger

**为什么调试对这门课特别关键**：Jev 的许多核心机制发生在**张量的中间状态**中——Causal Mask 的形状、KV Cache 的层索引、决策点位置的 logits 切片、Multi-Token Collision 下的概率聚合。只看最终输出，很难判断这些中间步骤是否正确。

**需要掌握的最小调试技能**：

| 技能               | 在 Jev 中的用途                                             |
| ---------------- | ------------------------------------------------------ |
| **断点 + 逐行步进**    | 进入 `forward` 内部，观察每一层 tensor 的 shape 变化                |
| **变量面板 / Watch** | 跟踪 `attention_mask`、`kv_cache`、`question_span` 等关键变量的值 |
| **条件断点**         | 只在特定 batch/位置/层命中时暂停，避免在长循环中手动跳过                       |
| **调用栈查看**        | 定位是 Mask 构造错误还是 logits 提取位置错误                          |

### 3.7. Encoder 与 Decoder 架构的区别

| 维度         | Encoder                      | Decoder                                                               |
| ---------- | ---------------------------- | --------------------------------------------------------------------- |
| **自注意力方向** | **双向**：每个 token 可以看到序列中所有位置  | **单向/因果**：每个 token 只能看到当前及之前的位置                                       |
| **核心模块**   | 双向 Self-Attention + FFN      | Masked Self-Attention + **Cross-Attention**（Encoder-Decoder 架构中）+ FFN |
| **训练目标**   | 通常为掩码语言建模（如 BERT 的 MLM）      | 通常为自回归下一 token 预测（如 GPT）                                              |
| **推理特性**   | 一次前向编码整个序列，天然适合 Prefill-Only | 预训练目标就是生成，但**可以跳过 Decode**，只做 Prefill                                 |

**与 Jev 的直接关联**：

- Encoder-Only：更快、更简单，但上下文建模能力和多问题支持较弱；
- Decoder-Only：稍慢但更强，且**借助自定义 Causal Mask 可以优秀地支持多问题打包**。

如果不清楚 Encoder 的双向注意力与 Decoder 的因果注意力的根本差异，就无法理解为什么 Decoder-Only Jev 需要自定义 Mask，也无法判断在什么场景下应该选择哪条路径。

| 知识点                            | 在 Jev 中的位置                            |
| ------------------------------ | ------------------------------------- |
| Causal Attention + Causal Mask | 理解 Decoder 为什么不能“看见未来”；自定义 Mask 的语义基础 |
| KV Cache                       | Jev 跳过 Decode、从缓存读取决策的物理载体            |
| Logits → Softmax               | Jev 输出结构化概率的数学通道                      |
| PyTorch 前向                     | 所有 Jev 实现的代码形态                        |
| Hugging Face Transformers      | 预训练骨干的加载与调用方式                         |
| VS Code Debugger               | 验证 Mask、Cache、决策点位置的中间状态              |
| Encoder vs Decoder             | 第20节选型对比的理论依据                         |

**一句话主线**：Encoder 和 Decoder 的注意力差异决定了 Jev 两条路径的形态 → Causal Attention 是 Decoder-Only 路径必须掌握的核心约束 → KV Cache 是“一次 Prefill”能成立的前提 → PyTorch 和 Transformers 是把这些机制写成可运行代码的工具 → Debugger 是在中间张量上验证这一切是否正确的手段 → Logits/Softmax 是最终把内部状态变成可校准决策输出的出口。

## 4. Baseline：传统 Token-by-Token 解码

```python
"""Asking a model for JSON the ordinary way.

You prompt it and it writes `{`, then `"`, then `priority`, one token at a time, and you hope the
whole thing parses. That is one forward pass per token - watch `passes` climb.

We also score it: keep each token's probability as it comes out, then multiply the ones that wrote
a value. It looks like a confidence. It isn't, and the last block says why.
"""
import json
import re
import pathlib
import sys
import time

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
import torch

from common import CONTEXT, SCHEMA, load, naive_prompt

tok, model = load()
prompt = naive_prompt(tok, CONTEXT, SCHEMA)
inputs = tok(prompt, add_special_tokens=False, return_tensors="pt").to(model.device)
print("prompt tokens:", inputs.input_ids.shape)

eos = model.generation_config.eos_token_id
stop = set(eos if isinstance(eos, list) else [eos]) | {tok.eos_token_id}
cache, generated, passes = None, [], 0
text = "{\n  "
spans = []
t0 = time.perf_counter()

for _ in range(200):
    out = model(**inputs, past_key_values=cache, use_cache=True)
    cache, passes = out.past_key_values, passes + 1
    probs = out.logits[0, -1].float().softmax(-1)
    token = int(probs.argmax())
    if token in stop:
        break
    generated.append(token)
    grown = "{\n  " + tok.decode(generated)
    spans.append((len(text), len(grown), float(probs[token])))
    text = grown
    try:
        if isinstance(json.loads(text), dict):
            break
    except ValueError:
        pass
    inputs = {
        "input_ids": torch.tensor([[token]], device=model.device),
        "attention_mask": torch.cat(
            [inputs["attention_mask"], torch.ones(1, 1, dtype=torch.long, device=model.device)], 1),
    }

print(text)
print(f"tokens={len(generated)}  forward_passes={passes}  ms={(time.perf_counter() - t0) * 1000:.0f}")
print("valid json:", isinstance(json.loads(text), dict) if text.strip().endswith("}") else False)

for name in SCHEMA:
    match = re.search(rf'"{re.escape(name)}"\s*:\s*', text)
    if not match:
        continue
    start = match.end()
    end, quoted = start, False
    while end < len(text) and (quoted or text[end] not in ',\n}'):
        quoted = not quoted if text[end] == '"' and text[end - 1] != "\\" else quoted
        end += 1
    inside = [p for a, b, p in spans if a < end and b > start]
    product = 1.0
    for p in inside:
        product *= p
    print(f"{name:<9} = {text[start:end].strip():<14} p(path)={product:.3f} over {len(inside)} token(s)"
          f"  weakest={min(inside, default=1.0):.3f}")

print("\nThat p(path) is not a decision probability. It normalises over the whole vocabulary, not "
      "over the allowed values; it multiplies without length normalisation, so long values look "
      "unlikely; it is conditioned on the fields already written, so field order changes it; and "
      "the alternatives were never scored at all. Part 2 fixes every one of those.")
```

### 4.1 这段代码到底在演示什么

**用最普通的方式让 LLM 生成 JSON，并记录它花了多少次前向传播、每写一个值消耗了多少“看起来像置信度”的概率。**

它同时做了三件事：

1. **构造一个朴素 prompt**：`naive_prompt(tok, CONTEXT, SCHEMA)` 把上下文和期望的 JSON schema 直接塞进提示，没有约束解码、没有结构化输出接口。
2. **手写自回归 Decode 循环**：不用 `model.generate()`，而是自己循环调用 `model(**inputs, past_key_values=cache)`，显式暴露 Prefill 与 Decode 的边界。
3. **记录每个 token 的概率**：每步对 `out.logits[0, -1]` 做 softmax，取 argmax 作为下一个 token，同时保存该 token 的概率，最后按字段做连乘。

### 4.2 逐段拆解

① Prompt 与 Prefill

```python
prompt = naive_prompt(tok, CONTEXT, SCHEMA)
inputs = tok(prompt, add_special_tokens=False, return_tensors="pt").to(model.device)
print("prompt tokens:", inputs.input_ids.shape)
```

- `inputs.input_ids` 形状是 `[1, prompt_len]`。**整个 prompt 一次性进入模型**，这就是 Prefill。
- 第一次循环中 `cache=None`，`model(**inputs, past_key_values=None)` 会对全部 prompt token 做并行前向，并返回每一层的 KV Cache。
- 输出 `out.logits[0, -1]` 只取**最后一个位置**的 logits，因为只有它用于预测第一个生成 token。

**关键点**：Prefill 只发生一次，处理的是“输入”；后面的循环处理的是“输出”。

② 第一次循环 = Prefill + 生成第 1 个 token

```python
for _ in range(200):
    out = model(**inputs, past_key_values=cache, use_cache=True)
    cache, passes = out.past_key_values, passes + 1
    probs = out.logits[0, -1].float().softmax(-1)
    token = int(probs.argmax())
```

第一次迭代：

- `cache=None` → 模型对完整 prompt 做前向 → **这就是 Prefill**；
- 同时从最后一个位置拿到 logits，选出第一个生成 token；
- `passes` 加 1。

所以严格说：**第 1 次** **`passes`** **包含 Prefill，第 2 次到第 N 次才是纯 Decode。**

③ 后续循环 = Decode，每 token 一次完整前向

```python
inputs = {
    "input_ids": torch.tensor([[token]], device=model.device),
    "attention_mask": torch.cat([...], 1),
}
```

第二次迭代开始，`inputs.input_ids` 只有**新生成的 1 个 token**，`past_key_values=cache` 带着之前所有 token 的 KV。

但注意：**`passes`** **仍然每次加 1**，因为模型仍然要跑一次完整的前向——只是这次前向的序列长度是 1（新 token），历史信息从 KV Cache 读。这就是原文说的：

> “That is one forward pass per token — watch `passes` climb.”

**成本公式**（概念上）：

- Prefill：1 次前向，序列长度 = prompt_len，并行度高；
- Decode：每生成 1 个 token 就要 1 次前向，共 N 次，**串行**；
- 总前向次数 ≈ 1 + N（实现上第一次兼做 Prefill 和首 token 预测，所以 `passes` 约等于生成 token 数 + 1）。

④ 提前停止条件

```python
if token in stop:
    break
...
try:
    if isinstance(json.loads(text), dict):
        break
except ValueError:
    pass
```

两个停止条件：

- 生成了 EOS；
- 当前文本已经能被 `json.loads` 解析为 dict。

这模拟了真实工程中的“生成到能解析就停”，但也暴露了问题：**能否提前停取决于文本碰巧闭合，而不是模型知道“我答完了”。**

⑤ 记录每个 token 的概率与字段 span

```python
spans.append((len(text), len(grown), float(probs[token])))
```

`spans` 里每个元素是 `(起始字符位置, 结束字符位置, 该 token 的概率)`。后面用正则找到每个 schema 字段的值区间，再把落在该区间内的 token 概率连乘：

```python
inside = [p for a, b, p in spans if a < end and b > start]
product = 1.0
for p in inside:
    product *= p
```

得到 `p(path)`，打印为“该字段取这个值的路径概率”。

### 4.3 为什么 `p(path)` 不是决策概率

原因一：归一化空间错了

`probs = out.logits[0, -1].softmax(-1)` 是在**整个词表**上做 softmax。

但决策问题是“在 `["billing", "technical", "sales"]` 里选一个”，合法答案只有 3 个。模型给 `"billing"` 的概率 0.42，分母却是 5 万多个 token，其中大量概率质量落在与决策无关的 token 上（空格、标点、其他词）。

**结果**：这个 0.42 不是“选 billing 的概率”，而是“下一个 token 恰好是 billing 这个词元的概率”。两者语义不同。

原因二：连乘没有长度归一化

字段值由多个 token 组成时，概率直接相乘：

- 值 `"high"` 若被切成 1 个 token，概率约 0.8；
- 值 `"technical support"` 若被切成 4 个 token，每个 0.8，连乘后 0.41。

**值越长，p(path) 越接近 0**，但这反映的是“token 数量多”，不是“这个决策更不确定”。比较不同长度选项的概率会被系统性扭曲。

原因三：条件依赖已写字段，字段顺序会改变结果

自回归生成是**条件概率**：写 `priority` 时，模型已经看到了前面写出的 `category`。

所以：

- 先写 `category` 再写 `priority`，与先写 `priority` 再写 `category`，得到的 `p(path)` 不同；
- 字段顺序、JSON 缩进、是否带空格，都会改变概率。

**结果**：这个概率不是对“决策本身”的度量，而是对“某个特定序列化顺序下这段文本”的度量。

原因四：替代选项从未被评分

模型只生成了它选中的那一个值。`"billing"` 的 p(path) 是 0.42，但 `"technical"` 和 `"sales"` 在这个上下文下分别是什么概率？**没有算过。**

而在决策场景里，你需要的是**同一问题下所有选项的相对概率**，才能做阈值、校准、人工介入。单条路径的概率无法回答“如果换成另一个选项，模型有多愿意”。

## 4.4 这段 Baseline 真正要建立的直觉

| 观察                    | 含义                                   |
| --------------------- | ------------------------------------ |
| `passes ≈ 生成 token 数` | 延迟随输出长度**线性增长**，且 Decode 是串行的，无法并行摊薄 |
| 需要写 prompt 教模型输出 JSON | 格式靠“祈祷”，不是结构保证                       |
| 生成中途可能解析失败            | 需要重试、截断、修复，工程复杂度上升                   |
| 每个值要连乘多个 token 概率     | 概率被长度、分词、字段顺序污染                      |
| 只评了被选中的路径             | 没有选项间的可比概率，无法直接做决策                   |

这五点正是 Jev 要消除的：

- **Prefill-Only**：把“生成 N 个 token”变成“一次前向”；
- **结构化输出**：输出空间就是你定义的选项集合，不是整个词表；
- **每问题一个 Softmax**：在合法选项上归一化，得到可比较的分布；
- **校准**：概率经过训练目标（Log Loss + Spherical + RPS）校准，高置信度时真的准；
- **可程序化决策**：高置信度自动执行，低置信度人工介入。

### 4.5 与 Jev 的逐项对照

| 维度         | Baseline（本节代码）           | Jev（Prefill-Only）    |
| ---------- | ------------------------ | -------------------- |
| 前向次数       | 1 次 Prefill + N 次 Decode | 1 次 Prefill          |
| 延迟         | 随输出长度线性增长                | 固定为一次前向时间            |
| 输出空间       | 整个词表，靠 prompt 约束         | 预定义选项集合              |
| 概率归一化      | 全词表 softmax              | 每个问题在合法选项上 softmax   |
| 多 token 选项 | 连乘，长度偏差                  | 通过决策点/聚合策略处理         |
| 替代选项       | 未评分                      | 全部选项同时得到概率           |
| 格式错误       | 可能发生，需重试                 | 结构由接口保证，不生成自由文本      |
| 概率用途       | 只能当“路径似然”看               | 可校准、可阈值、可程序决策        |
| 多问题        | 需要多次生成或复杂 prompt         | 自定义 Causal Mask 一次打包 |

## 5. 深入 KV Cache 与自回归循环

```python
for _ in range(200):
    out = model(**inputs, past_key_values=cache, use_cache=True)
    cache, passes = out.past_key_values, passes + 1
    probs = out.logits[0, -1].float().softmax(-1)
    token = int(probs.argmax())
    ...
    # 然后把新 token 喂回去，继续循环
```

每循环一次，就是一次 **完整的前向传播（Forward Pass）**。

- 第一次循环：处理整个 prompt → 这是 **Prefill**
- 之后每一次循环：只处理**一个新 token** → 这是 **Decode**
- `passes` 会一路往上爬，输出越长，前向次数越多

这就是“Asking a model for JSON the ordinary way”的本质：**一个 token 一次前向**。

### 5.1 KV Cache 到底存了什么？

Transformer 的每一层都有 Attention：

$$
Att(Q, K, V) = softmax( Q·Kᵀ / sqrt(d_k) ) · V
$$

其中：

- $Q$（Query）来自**当前**要处理的 token
- $K$（Key）和 $V$（Value）来自**所有已经处理过的 token**（包括 prompt + 已经生成的部分）

**KV Cache** 就是把每一层、每一个已经处理过的 token 的 $K$ 和 $V$ 存起来。

具体存的是：

- 形状大致是：`(batch, num_layers, num_heads, seq_len, head_dim)` 的 Key 和 Value
- 每生成一个新 token，就把这个 token 对应的 K 和 V **追加**进 cache

没有 cache 的话，每生成一个新 token，模型都要把整个序列（prompt + 已生成）重新算一遍 K 和 V，计算量会爆炸。

### 5.2 为什么 Decode 每步还是要重新算 Attention？

即使有了 KV Cache，**当前 token 的 Q 还是要和缓存里所有历史 K 做点积**。

流程是这样的：

1. 取出当前 token 的 hidden state
2. 用它算出当前 token 的 $Q$
3. 把 $Q$ 和 **整个 KV Cache** 里的所有 $K$ 做矩阵乘法（Attention Score）
4. Softmax 后加权 $V$
5. 得到当前 token 的输出，再过后续层，最终得到 logits
6. 采样出下一个 token，把它的 K、V 再追加进 cache

所以：

- **计算量降低了**（不用重新算历史 token 的 K/V）
- 但 **Attention 计算本身仍然是串行的**，每一步都要做一次完整的 Attention

这就是为什么代码里 `passes` 会随着生成长度线性增长。

### 5.3 自回归循环的计算图本质

可以把整个过程画成这样：

```plain text
Prefill:
  [prompt tokens] → 一次前向 → 生成完整 KV Cache + 第一个生成 token 的 logits

Decode 循环:
  token_1 → 用 cache 算 Attention → 得到 token_2 的 logits → 更新 cache
  token_2 → 用 cache 算 Attention → 得到 token_3 的 logits → 更新 cache
  token_3 → ...
  ...
```

关键点：

- 每一步的输入只是**一个 token**（+ cache）
- 但每一步的 Attention 都要看**整个历史**
- 因此延迟 ≈ 单步时间 × 输出 token 数

代码里的这段正是在统计这个成本：

```python
print(f"tokens={len(generated)}  forward_passes={passes}  ms=...")
```

---

### 5.4 为什么传统 Decode 依然慢？（即使有 Cache）

有三个根本原因：

1. **串行依赖**

    必须等上一个 token 生成完，才能开始下一个。无法有效并行。

2. **Attention 计算随长度增长**

    每一步的 Attention 复杂度是 $O(\text{当前序列长度})$。输出越长，每一步越慢。

3. **内存带宽瓶颈**

    现代 GPU 上，Decode 阶段经常是 memory-bound 而不是 compute-bound。每一步都要把巨大的 KV Cache 从显存读出来做计算。

这就是为什么生成 50 个 token 的 JSON，实际前向次数接近 50+，延迟远高于一次 Prefill。

### 5.5 与 Jev 的直接关系（为什么后面要复用 KV Cache）

做 Decoder-Only Jev 时，核心操作就是：

1. 把**状态 + 所有问题**一起放进 prompt
2. 做一次 Prefill，得到完整的 KV Cache
3. **不再继续生成任何 token**
4. 直接从特定位置的 logits 里“读取”决策结果

也就是说：

- 传统方法：Prefill + 很多次 Decode
- Jev 方法：只做 Prefill，然后从 cache 对应的位置直接拿 logits

这正是“复用 KV Cache 做决策”的本质。

### 5.6 代码里“看起来像置信度”的 p(path) 为什么不是真正的决策概率

```python
product = 1.0
for p in inside:
    product *= p
print(f"... p(path)={product:.3f} ...")
```

| 问题       | 说明                             |
| -------- | ------------------------------ |
| 归一化范围错误  | Softmax 是对整个词表做的，而不是对“允许的选项”做的 |
| 没有长度归一化  | 长选项的 token 概率连乘会天然更小           |
| 条件依赖     | 后面字段的概率被前面已生成内容严重影响            |
| 从未评分其他选项 | 只走了一条路径，其他可能值根本没被计算过           |

要解决的核心问题——**真正的决策概率必须在允许的选项集合上做归一化，并且一次前向就对所有选项打分**。

## 6. Encoder-Only 架构设计

6.1 核心思想

Encoder-Only 方案的本质是：**彻底放弃生成，把决策变成一次编码 + 提取**。

传统 Decoder 需要“写”出答案（一个 token 一个 token 地生成），而 Encoder-Only 只做一件事：

1. 把**状态（Context）和问题（Question**）一起喂给编码器
2. 编码器对整个输入做一次完整的双向（或单向）编码
3. 从编码结果中**直接提取**与决策相关的表示
4. 通过简单的交互和线性头得到最终概率

整个过程**没有任何 token 生成**，因此延迟完全固定，只等于一次前向传播的时间。

### 6.2 为什么 Encoder 适合做这件事？

编码器（如 BERT 类模型）的特点是：

- 每个 token 都能看到完整的上下文（双向 Attention）
- 输出的是每个位置的**丰富语义表示**，而不是下一个 token 的预测
- 结构简单，没有因果掩码的限制，更容易做多问题打包

因此它天然适合“理解一段文本后给出分类/评分”的任务，而不是“继续写下去”。

### 6.3 整体数据流

```plain text
输入构建：
  [状态文本] + [问题文本] + [特殊标记]

          ↓
    Encoder 一次前向
          ↓
  得到每个 token 的 hidden states
          ↓
  定位 Question Span（问题所在位置）
          ↓
  Mean Pooling → 得到问题向量
          ↓
  与各个选项向量做 Dot Product 交互
          ↓
  Linear Head → Logits → Softmax
          ↓
  输出每个选项的概率
```

---

### 6.4 关键设计点

**1. 输入如何构建**

- 状态（Context）和问题（Question）被拼接在一起
- 使用特殊 token（如 `[MASK]` 或自定义标记）明确标出“这里是问题区域”
- 有时会在问题后追加候选选项，让模型在编码阶段就看到完整决策空间

**2. Question Spans 提取**

- 不是用整个序列的表示，而是精确定位问题所在的 token 范围
- 通过记录问题文本在输入中的起止位置，只取这一段的 hidden states

**3. Mean Pooling**

- 把 Question Span 内多个 token 的表示做平均，得到一个固定维度的**问题向量**
- 这比用单个 `[CLS]` token 更聚焦于问题本身的语义

**4. 与选项的交互**

- 每个选项也有自己的向量表示（可以是选项文本编码后的结果，或可学习的 embedding）
- 问题向量与每个选项向量做 **Dot Product**，得到相似度分数
- 再通过一个 Linear Head 映射成最终 logits

**5. 输出**

- Softmax 后直接得到每个选项的概率
- 完全没有生成过程，因此不存在格式错误、重复、废话等问题

### 6.5 优势总结

| 优势        | 说明                                              |
| --------- | ----------------------------------------------- |
| **结构极简**  | 不需要自定义 Causal Mask，不需要处理生成逻辑                    |
| **速度固定**  | 延迟 = 一次 Encoder 前向，与输出长度无关                      |
| **实现门槛低** | 用现成的 Encoder 模型（BERT、RoBERTa、或现代 Encoder）即可快速落地 |
| **易于微调**  | 决策头很小，冻结骨干只训练头，或全量微调都比较轻量                       |
| **多问题友好** | 可以在同一个输入里放多个问题，一次编码同时得到多个决策                     |

---

### 6.6 与 Decoder-Only 的本质区别

- **Encoder-Only**：把决策当成“理解后分类”，直接从表示中读出答案
- **Decoder-Only**：仍然借用语言模型的生成能力，但通过巧妙的 Mask 和位置设计，让它在 Prefill 阶段就把决策“写”在特定位置的 logits 上

Encoder-Only 更轻、更快、更容易实现，适合问题空间相对固定、对延迟要求极高的场景。

## 7. Encoder-Based Jev 的完整 PyTorch 实现

### 7.1 核心设计

这段实现对应的是开源 Jev 风格模型 **Laya** 的做法：

> **一个问题对应一个完整序列**。状态被放在最后，每个选项前面都插一个 `[MASK]` 标记。

输入格式严格为：

```plain text
[CLS] instructions [SEP] [MASK] opt0 [MASK] opt1 ... [SEP] state [SEP]
                             ↑           ↑
                        从这两个位置读取向量，打分后 Softmax
```

关键特性：

- **双向 Attention**：每个 token 都能看到所有其他 token（包括状态和所有选项）
- **不需要 Causal Mask**
- **不需要 Segment IDs**
- **不需要伪造位置**

代价也很明确：

> 每问一个问题，整段状态都要重新过一遍 Encoder。没有任何缓存可复用，因为换一个问题，所有状态向量都会改变。

### 7.2 完整代码拆解

1. 加载模型与定义数据

```python
ENCODER_ID = os.environ.get("ENCODER_ID", "answerdotai/ModernBERT-base")
STATE = ("Ticket #8812: charged twice for the same order, no reply in four days. "
         "Cancel it and give me my money back, or I am disputing with my bank.")
QUESTIONS = [("Is the customer asking for money back?", ["no", "yes"]),
             ("Which team owns this?", ["billing", "technical"])]

tok = AutoTokenizer.from_pretrained(ENCODER_ID)
encoder = AutoModel.from_pretrained(ENCODER_ID).float().eval()
```

- 使用 **ModernBERT** 作为编码器骨干（也可以换成其他 Encoder）
- `STATE` 是统一的状态文本
- `QUESTIONS` 里每个问题自带候选选项

---

2. 构建输入序列的核心函数 `build()`

```python
def build(state, instructions, options):
    """[CLS] instructions [SEP] [MASK] opt0 [MASK] opt1 ... [SEP] state [SEP]
    Also returns where the instructions sit, so they can be pooled into a query below.
    """
    question = tok.encode(instructions, add_special_tokens=False)
    ids = [tok.cls_token_id] + question + [tok.sep_token_id]
    span = (1, 1 + len(question))          # 记录问题文本的起止位置
    markers = []
    for option in options:
        markers.append(len(ids))           # 记录每个 [MASK] 的位置
        ids += [tok.mask_token_id] + tok.encode(option, add_special_tokens=False)
    ids += [tok.sep_token_id] + tok.encode(state, add_special_tokens=False) + [tok.sep_token_id]
    return ids, markers, span
```

**这一步做了三件关键的事：**

1. **构建序列**：严格按 `[CLS] 问题 [SEP] [MASK] 选项1 [MASK] 选项2 ... [SEP] 状态 [SEP]` 拼接
2. **记录 Question Span**：`span = (1, 1 + len(question))`，后面用来对问题部分做 Mean Pooling
3. **记录所有 Marker 位置**：`markers` 列表保存每个 `[MASK]` 的下标，后面直接从这些位置取向量

注意这里的 `[MASK]` **不是 Attention Mask**，而是 BERT 预训练时的 **占位 Token**，专门用来作为“读取点”。

3. 前向传播与决策提取

```python
for instructions, options in QUESTIONS:
    ids, markers, span = build(STATE, instructions, options)
    hidden = encoder(input_ids=torch.tensor([ids])).last_hidden_state[0].float()

    # 1. 对问题部分做 Mean Pooling，得到 query 向量
    query = hidden[span[0]:span[1]].mean(0)

    # 2. 取出所有 [MASK] 位置的向量作为选项表示
    option_vectors = hidden[torch.tensor(markers)]

    # 3. 点积 + 缩放 + Softmax
    probs = torch.softmax(option_vectors @ query / query.shape[0] ** 0.5, -1)

    print(...)
```

**决策逻辑拆解：**

| 步骤   | 代码                                | 含义                           |
| ---- | --------------------------------- | ---------------------------- |
| 编码   | `encoder(...).last_hidden_state`  | 得到每个 token 的语义向量             |
| 问题表示 | `hidden[span[0]:span[1]].mean(0)` | 对问题文本做 Mean Pooling，得到 query |
| 选项表示 | `hidden[markers]`                 | 直接读取每个 `[MASK]` 位置的向量        |
| 打分   | `option_vectors @ query`          | 问题向量与每个选项向量做点积               |
| 缩放   | `/ query.shape[0] ** 0.5`         | 类似 Attention 的缩放，防止点积过大      |
| 概率   | `torch.softmax(..., -1)`          | 在选项维度上归一化                    |

最终输出的就是每个选项的概率分布。

### 7.3 关键设计

1. **用** **`[MASK]`** **作为读取点**

    不是用 `[CLS]`，也不是用选项本身的最后一个 token，而是在每个选项前面专门插一个 `[MASK]`，专门从这个位置读取表示。这是借用了 BERT 的 MLM 预训练习惯。

2. **用池化后的问题向量作为 Query**

    而不是直接用 `[CLS]`。因为纯 MLM 训练的 Encoder 并没有学会把 `[CLS]` 当作全局摘要。

3. **一个问题 = 一次完整编码**

    两个问题就要把同一段状态编码两次。这是 Encoder-Only 方案最明显的效率瓶颈。

4. **无任何生成、无 Causal Mask、无复杂位置处理**

    代码量极小，逻辑清晰，这正是 Encoder 方案“实现门槛低”的原因。

### 7.4 运行结果示例

```plain text
XX tokens, markers at [.., ..], '[CLS] Is the customer asking for money back? [SEP] [MASK] no [MASK] yes ...'
  Is the customer asking for money back?   {'no': 0.xxx, 'yes': 0.xxx}

XX tokens, markers at [.., ..], ...
  Which team owns this?                    {'billing': 0.xxx, 'technical': 0.xxx}
```

注意：这段代码是**未训练**的点积打分，所以概率数字本身没有参考价值，重点是看机制。

注意：真正的 Laya 会用**训练过的 MLP** 对每个 marker 打分，甚至不需要 query 向量。

---

## 8. Question Spans、Mask Tokens 与 Mean Pooling

### 8.1 Question Spans 的真实作用

在 `build()` 函数里：

```python
question = tok.encode(instructions, add_special_tokens=False)
ids = [tok.cls_token_id] + question + [tok.sep_token_id]
span = (1, 1 + len(question))
```

`span` 精确记录了**问题文本**在序列中的起止位置（跳过了 `[CLS]`）。

后续：

```python
query = hidden[span[0]:span[1]].mean(0)
```

这里对问题部分的所有 token 做 **Mean Pooling**，得到一个固定维度的 query 向量。

**原因**：

- 纯 MLM 预训练的 Encoder（如 ModernBERT）**从来没有学过把** **`[CLS]`** **当作全局摘要**。
- 直接用问题文本本身的平均表示，比用 `[CLS]` 更聚焦、更稳定。
- 这是“用池化后的问题向量作为 Query”的核心设计，而不是传统分类里常用的 `[CLS]`。

### 8.2 `[MASK]` Token 的双重含义

代码注释里特别写了：

> Note the two senses of "mask": `[MASK]` here is a placeholder TOKEN, borrowed from BERT pretraining and used as a place to read from. It has nothing to do with the attention masks in files 3 and 4.

关键点：

- 这里的 `[MASK]` **不是 Attention Mask**。
- 它是 BERT 预训练时的**占位符 token**，被故意插在每个选项前面。
- 模型在编码时会自然地给这个位置一个有意义的向量（因为它在预训练中见过大量 `[MASK]` 需要被上下文填充的情况）。
- 我们**只从这些** **`[MASK]`** **位置读取向量**，作为该选项的表示：

```python
markers.append(len(ids))
ids += [tok.mask_token_id] + tok.encode(option, add_special_tokens=False)
...
option_vectors = hidden[torch.tensor(markers)]
```

这是整个 Encoder-Only 方案最巧妙的地方：**用预训练已经学会的** **`[MASK]`** **位置作为“读取点”**。

---

### 8.3 Dot Product 交互的真实计算

```python
probs = torch.softmax(option_vectors @ query / query.shape[0] ** 0.5, -1)
```

拆解：

1. `option_vectors` 形状：`(num_options, hidden_dim)`
2. `query` 形状：`(hidden_dim,)`
3. `option_vectors @ query` → 得到每个选项与问题的原始相似度分数
4. 除以 `sqrt(hidden_dim)`（`query.shape[0] ** 0.5`）做缩放，防止点积数值过大
5. Softmax 在选项维度上归一化，得到最终概率

**说明**：

- 这是**未训练**的点积打分，数字本身没有参考价值。
- 目的是展示机制，而不是展示效果。
- 真正的 Laya（开源 Jev）会对每个 marker 使用**训练过的 MLP** 来打分，甚至**完全不需要 query 向量**。

---

### 8.4 为什么一个问题就要重新编码整段状态？

在代码注释强调：

> The cost is in the first line: one sequence PER QUESTION means the whole state goes through the encoder again for every question you ask of it. Nothing can be cached, because changing the question changes every state vector.

原因：

- 问题文本被放在序列的前面。
- 双向 Attention 下，问题文本会直接影响后面所有状态 token 的表示。
- 换一个问题，整个状态的 hidden states 都会改变。
- 因此**无法跨问题复用任何计算结果**。

这就是 Encoder-Only 方案最明显的效率瓶颈，也是后面为什么要引入 Decoder-Only + 自定义 Causal Mask 的直接原因。

### 8.5. 整体数据流回顾

```plain text
1. 构建序列：
   [CLS] + 问题文本 + [SEP] + [MASK] + 选项1 + [MASK] + 选项2 + ... + [SEP] + 状态 + [SEP]

2. 一次 Encoder 前向 → 得到所有 token 的 hidden states

3. 用 span 对问题部分做 Mean Pooling → 得到 query

4. 从 markers 位置取出所有 [MASK] 的向量 → 得到 option_vectors

5. option_vectors @ query / sqrt(d) → Softmax → 概率
```

整个过程**没有任何 token 生成**，也**没有 Causal Mask**，逻辑极简。

## 9. Dot Product 交互、Linear Heads 与微调策略

### 9.1  Dot Product 交互（未训练版本）

在 Encoder 部分给出的打分代码是：

```python
query = hidden[span[0]:span[1]].mean(0)          # 问题文本 Mean Pooling
option_vectors = hidden[torch.tensor(markers)]   # 每个 [MASK] 位置的向量
probs = torch.softmax(option_vectors @ query / query.shape[0] ** 0.5, -1)
```

**实际在做什么：**

1. `option_vectors` 形状为 `(num_options, hidden_dim)`
2. `query` 形状为 `(hidden_dim,)`
3. 矩阵乘法 `option_vectors @ query` 得到每个选项与问题的原始相似度分数
4. 除以 `√hidden_dim` 做缩放（防止点积数值过大导致 Softmax 饱和）
5. Softmax 在选项维度上归一化，得到最终概率

这是**完全未训练**的点积打分，明确说：

> Untrained dot product against the pooled question, so read the mechanism, not the numbers.

目的是让你看清“问题表示如何与选项表示交互”，而不是展示最终效果。

### 9.2 真实系统中的 Linear Head / MLP（Laya 的做法）

关键差异：

| 项目         | 演示代码（未训练）                | 真实 Laya（训练后）              |
| ---------- | ------------------------ | ------------------------- |
| 交互方式       | 问题向量 × 选项向量（Dot Product） | 直接对每个 `[MASK]` 位置的向量过 MLP |
| 是否需要 query | 需要（问题 Mean Pooling）      | **不需要**                   |
| 打分位置       | 依赖 query 与 option 的相似度   | 只看 marker 位置本身的表示         |
| 可训练参数      | 无                        | MLP 的权重                   |

也就是说，真正可用的 Encoder-Only 决策模型，通常会：

1. 从每个 `[MASK]` 位置取出 hidden state
2. 喂给一个小型 **Linear Head** 或 **MLP**
3. 直接输出该选项的 logit
4. 再 Softmax 得到概率

不再依赖“问题向量与选项向量的点积”，而是让模型自己学会“在这个标记位置上，这个选项有多合适”。

---

### 9.3 从 Dot Product 到 Linear Head 的演进逻辑

演进路径是：

1. **最简单版本**（当前代码）：

    用问题池化向量做 query，与选项向量做点积。

    → 零训练，只为展示机制。

2. **实用版本**（Laya）：

    去掉 query，直接对 marker 位置的向量接一个可训练的 Linear / MLP Head。

    → 模型自己学习如何从该位置的表示中读出选项分数。

这样做的好处：

- 参数量极小（通常只有一个小的线性层或两层 MLP）
- 可以针对决策任务专门优化
- 不再依赖人工设计的“问题与选项相似度”

---

### 9.4 微调策略对比

常见策略如下：

**策略 A：LInear Head，只训练决策头（最常用）**

- 冻结整个 Encoder 的参数
- 只训练接在 `[MASK]` 位置上的 Linear / MLP Head
- 优点：训练极快、显存占用低、不容易破坏预训练知识
- 适合数据量不大、或只想快速适配特定决策任务的场景

**策略 B：全量微调**

- Encoder + 决策头全部解冻一起训练
- 优点：上限更高，能让底层表示也适应决策任务
- 缺点：需要更多数据、更容易过拟合、训练成本高

**策略 C：差分学习率（Differential Learning Rates）**

- 骨干使用很小的学习率（例如 1e-5 或更低）
- 决策头使用较大的学习率（例如 1e-4 ~ 1e-3）
- 在“保留预训练知识”和“快速适应决策任务”之间取得平衡
- 实际中经常比单纯冻结或全量微调更稳

注意：因为决策头本身非常小，**优先尝试冻结骨干 + 只训练头**，通常已经能获得不错的效果；如果效果不够，再考虑差分学习率或全量微调。

## 10. Decoder-Only 架构与 Context Caching

### 10.1 为什么转向 Decoder-Only

Encoder-Only 的核心瓶颈已经很清楚：每换一个问题，整段状态都要重新编码一次，无法复用。

Decoder-Only 的目标是解决这个问题——**让多个问题共享同一次对状态的编码**。

预训练语言模型本身就是 Decoder 架构，直接使用它有两个实际好处：

1. 可以充分利用已经学到的语言建模能力
2. 天然支持 KV Cache，为后续复用打下基础

### 10.2Context Caching 的核心思路

在 Decoder-Only 方案中，输入被重新组织为：

```plain text
[状态文本] + [问题1 + 选项] + [问题2 + 选项] + ...
```

流程变为：

1. 先对**状态**做一次完整 Prefill，得到状态部分的 KV Cache
2. 后续每个问题只需要在已有 Cache 的基础上继续计算
3. 从每个问题对应的特定位置直接读取 logits，而不再生成任何 token

这样一来，状态只被编码一次，多个问题可以共享这份计算结果。

### 10.3 与 Encoder-Only 的关键差异

| 点            | Encoder-Only | Decoder-Only           |
| ------------ | ------------ | ---------------------- |
| 状态编码次数       | 每个问题都要重新编码一次 | 状态只编码一次，后续问题复用         |
| Attention 方式 | 双向，全部可见      | 因果（需要自定义 Mask 才能支持多问题） |
| 缓存可能性        | 几乎没有         | 天然支持 KV Cache 复用       |
| 主要代价         | 重复计算状态       | 需要精心设计 Causal Mask 和位置 |

### 10.4 要解决的核心问题

Decoder 默认是因果的：每个位置只能看到它前面的内容。

如果把多个问题直接拼在状态后面，后一个问题会看到前一个问题的内容，产生信息泄漏；同时也不方便从固定位置统一读取决策结果。

## 11. 自定义 Causal Attention Mask（多问题打包）

### 11.1 问题本质

Decoder 默认使用标准 Causal Mask：每个位置只能看到它自己及之前的位置。

当把多个问题直接拼在状态后面时，会出现两个直接冲突：

1. **信息泄漏**：后面的问题能看到前面问题的内容和选项，导致决策互相污染。
2. **读取困难**：无法干净地从固定位置统一提取每个问题的决策 logits。

因此必须自定义 Attention Mask，让模型在一次 Prefill 中同时处理多个问题，同时满足：

- 所有问题都能完整看到状态
- 问题之间互相隔离（看不到彼此的选项和决策点）
- 每个问题内部保持正常的因果顺序

### 11.2 自定义 Mask 的核心设计

做法是把输入组织成：

```plain text
[状态] + [问题1 + 选项标记] + [问题2 + 选项标记] + ...
```

然后构造一个特殊的 Attention Mask，规则如下：

- **状态部分**：内部正常因果，所有后续位置都可以看到完整状态
- **每个问题块**：
    - 可以看到完整的状态
    - 可以看到自己问题块内部的内容
    - **不能**看到其他问题块的任何内容
- 决策读取点（通常是每个选项前的特殊标记，或问题结束位置）只在自己的问题范围内可见

这样实现了“共享状态 + 问题隔离”的效果。

### 11.3 为什么必须这样做

如果不做自定义 Mask，直接用标准 Causal Mask：

- 后一个问题会看到前一个问题的选项和中间结果
- 模型可能把前一个问题的信息当成额外上下文，导致概率偏移
- 多个问题的决策不再独立，校准性被破坏

自定义 Mask 的本质是在一次前向中模拟“多个独立的问题”，同时只对状态编码一次。

### 11.4 实现上的关键点

1. **Mask 的形状**：仍然是标准的 `(seq_len, seq_len)` 下三角结构，但在问题块之间人为制造“阻断”。
2. **位置编码**：保持正常的绝对或相对位置，不需要额外伪造。
3. **与 KV Cache 的配合**：Prefill 时使用这个自定义 Mask 生成完整 Cache，后续提取决策时直接使用对应位置的 logits，不再继续生成。

### 11.5 这一步的效果

完成自定义 Causal Mask 后，Decoder-Only 方案才真正具备实用价值：

- 状态只计算一次
- 多个问题可以打包在同一次 Prefill 中完成
- 决策之间保持独立
- 为后面的“从决策点直接提取 logits”打下基础

## 12. Decoder-Based Jev + KV Cache 复用完整实现

```python
"""Pure decoding: read the state once, then answer questions against it.

    [ the state ]  ->  cache          read once, never read again
    [ question 1 + its options ]      sees the cached state, and itself
    [ question 2 + its options ]      sees the cached state, and itself, never question 1

Each question ends at a decision position - the point where the model is about to write its
answer. Take the vocabulary logits there, keep only the rows for the options you allowed, and
softmax over those. The model's own output head does the scoring, so nothing is trained and
nothing can be generated outside the option set.

Every step is a line in this file. Run them one at a time and look at what each makes:
cache, ids, segments, visible, mask, positions, logits.

Only the option's FIRST token is read, so two options that start alike - FRAUD and FRAUD_REVIEW -
cannot be told apart. pack() refuses them rather than returning a tie.
"""
import copy
import pathlib
import sys

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
import torch

from common import load, pack, prefill, question_mask

STATE = ("Ticket #8812: charged twice for the same order, no reply in four days. "
         "Cancel it and give me my money back, or I am disputing with my bank.")
QUESTIONS = [("Is the customer asking for money back?", ["no", "yes"]),
             ("Which team owns this?", ["billing", "technical"])]

tok, model = load(attn_implementation="eager")

cache, state_length = prefill(tok, model, STATE)

def answer(questions):
    ids, segments, decisions, options, candidates = pack(tok, "", questions)

    mask, visible = question_mask(model, segments, state_length)

    positions = torch.tensor([[state_length + i - segments.index(seg)
                               for i, seg in enumerate(segments)]]).to(model.device)

    logits = model(input_ids=torch.tensor([ids], device=model.device), attention_mask=mask,
                   position_ids=positions,
                   past_key_values=copy.deepcopy(cache)).logits[0].float().cpu()

    for (instructions, choices), decision, option_ids in zip(questions, decisions, candidates):
        probs = torch.softmax(logits[decision][torch.tensor(option_ids)], -1)
        print(f"  {instructions:<40} {dict(zip(choices, [round(p, 3) for p in probs.tolist()]))}")
    print(f"    {len(ids)} question tokens through the model, {state_length} state tokens reused")

answer(QUESTIONS)
answer([("How angry is the customer?", ["calm", "furious"])])
```

### 12.1 核心设计

```plain text
[ the state ]  →  cache          只读一次，之后不再重复计算
[ question 1 + its options ]     只能看到 cache 中的状态 + 自己
[ question 2 + its options ]     只能看到 cache 中的状态 + 自己，看不到问题1
```

每个问题结束于一个 **decision position**（模型即将写出答案的位置）。

在这个位置取出词汇表 logits，只保留允许的选项对应的行，然后 Softmax。

评分完全由模型自己的输出头完成，无需额外训练，也无法生成选项之外的内容。

---

### 12.2 代码执行流程

1. **Prefill 状态（只做一次）**

    ```python
    cache, state_length = prefill(tok, model, STATE)
    ```

    状态被完整编码，KV Cache 被保存，后续所有问题直接复用。

2. **打包多个问题**

    ```python
    ids, segments, decisions, options, candidates = pack(tok, "", questions)
    ```

    - `ids`：所有问题拼接后的 token 序列
    - `segments`：标记每个 token 属于哪个问题
    - `decisions`：每个问题的决策读取位置
    - `candidates`：每个问题允许的选项 token id 列表
3. **构建自定义 Mask 与位置**

    ```python
    mask, visible = question_mask(model, segments, state_length)
    positions = torch.tensor([[state_length + i - segments.index(seg)
                               for i, seg in enumerate(segments)]]).to(model.device)
    ```

    - `mask`：确保每个问题只能看到状态 + 自身，看不到其他问题
    - `positions`：正确的位置编码，让模型知道当前处于序列的什么位置
4. **一次前向提取所有决策**

    ```python
    logits = model(input_ids=torch.tensor([ids], device=model.device),
                   attention_mask=mask,
                   position_ids=positions,
                   past_key_values=copy.deepcopy(cache)).logits[0]
    ```

    使用已缓存的状态 + 自定义 mask，一次前向得到所有位置的 logits。

5. **从决策点读取并 Softmax**

    ```python
    probs = torch.softmax(logits[decision][torch.tensor(option_ids)], -1)
    ```

    只取允许选项对应的 logits，在选项集合上做 Softmax，得到最终概率。

### 12.3 关键限制

> Only the option's FIRST token is read, so two options that start alike - FRAUD and FRAUD_REVIEW - cannot be told apart. pack() refuses them rather than returning a tie.

只读取每个选项的**第一个 token**。

如果两个选项共享相同的前缀（如 `FRAUD` 和 `FRAUD_REVIEW`），模型无法区分，`pack()` 会直接拒绝，而不是返回平局结果。

### 12.4 运行效果

```python
answer(QUESTIONS)          # 同时回答两个问题，状态只计算一次
answer([("How angry is the customer?", ["calm", "furious"])])  # 新问题直接复用同一份 cache
```

输出会显示每个问题的概率，以及：

```plain text
XX question tokens through the model, YY state tokens reused
```

状态 token 被真正复用，问题部分才是新计算的开销。

### 12.5 与 Encoder-Only 的本质区别

- Encoder：每个问题都要把状态重新编码一遍
- Decoder：状态只 Prefill 一次，后续问题通过 KV Cache + 自定义 Mask 共享

这是 Decoder-Only 方案能支持高效多问题打包的根本原因。

## 13. 提取决策点 Logits 与 Token 概率

如何从模型输出中精确定位决策位置：

- 使用特殊标记或精确的位置索引
- 提取对应 token 的完整 logits
- 转换为概率
- 处理不同问题类型的差异

### 13.1 提取逻辑

在 Decoder-Only 实现中，决策不是生成出来的，而是**从特定位置的 logits 直接读取**。

关键代码：

```python
logits = model(...).logits[0].float().cpu()

for (instructions, choices), decision, option_ids in zip(questions, decisions, candidates):
    probs = torch.softmax(logits[decision][torch.tensor(option_ids)], -1)
```

含义：

1. `logits[decision]`：取出该问题决策位置上，整个词汇表的原始分数
2. `logits[decision][option_ids]`：只保留允许选项对应的那些行
3. Softmax 在**选项集合内部**做归一化，得到最终概率

模型自己的输出头负责打分，无需额外训练的决策头。

### 13.2 为什么只取决策位置

每个问题被打包后，会在选项结束的地方形成一个明确的 **decision position**——模型在这个位置上“即将写出答案”。

通过自定义 Mask 和位置编码，确保这个位置：

- 能完整看到状态
- 能看到当前问题的完整内容
- 看不到其他问题

因此，该位置的 logits 已经包含了做出决策所需的全部信息。

### 13.3 概率的真实含义

这里的概率是**在你允许的选项集合上的条件概率**，而不是对整个词汇表的概率。

这直接解决了早期 naive 生成中的几个问题：

- 不再对整个词表归一化
- 选项之间公平比较
- 不会生成选项之外的内容

### 13.4 与 Multi-Token 选项的衔接

当前实现只读取每个选项的**第一个 token** 的 logits。

局限性：当两个选项共享相同前缀时（如 `FRAUD` 与 `FRAUD_REVIEW`），无法区分。`pack()` 会直接拒绝这类冲突，而不是返回错误的平局结果。

## 14. 处理 Multi-Token Collision 问题

### 14.1 问题本质

当前 Decoder-Only 实现只读取每个选项的**第一个 token** 的 logits。

因此当两个选项共享相同前缀时：

- `FRAUD` 与 `FRAUD_REVIEW`
- `yes` 与 `yes_please`
- `technical` 与 `technical_support`

模型在决策位置上看到的第一个 token 完全一样，无法区分，概率会错误地合并或产生平局。

文章处理方式非常直接：

> Only the option's FIRST token is read, so two options that start alike cannot be told apart. **pack() refuses them rather than returning a tie.**

`pack()` 在构建候选时会检测选项的首 token 是否冲突。一旦发现冲突，直接拒绝该问题，而不是返回不可靠的结果。

---

### 14.2 为什么只读首 token

1. 实现简单，与模型原生输出头完全对齐
2. 决策位置的 logits 已经是模型对“下一个 token 是什么”的完整预测
3. 避免了多 token 序列的概率连乘、长度归一化等复杂问题

代价就是对选项集合有约束：**所有选项的首 token 必须唯一**。

---

### 14.3 实际应对策略（取舍）

没有引入复杂的位置编码技巧或后处理聚合，而是选择了最干净的工程方案：

- **预防为主**：在 `pack()` 阶段就检测并拒绝首 token 冲突的选项
- 用户需要保证选项在 tokenize 后的第一个 token 互不相同
- 如果业务上必须使用容易冲突的选项，就改写选项文本（例如把 `FRAUD_REVIEW` 改成 `REVIEW_FRAUD`，或使用更短的标签）

这种处理方式与整个 Prefill-Only 的设计哲学一致：**保持决策路径简单、可预测、不引入额外训练或复杂后处理**。

### 14.4 与早期 naive 生成的对比

早期逐 token 生成时，多 token 选项的概率是路径概率连乘，存在长度偏差和条件依赖问题。

现在改为“只在决策点对首 token 做 Softmax”，虽然引入了首 token 唯一性约束，但彻底消除了那些偏差，概率含义更清晰。

---

## 15. 训练工作流与 Teacher-Student 蒸馏

### 15.1 为什么需要训练

前面所有实现（Encoder-Only 点积、Decoder-Only 首 token logits）都是**零训练**的推理技巧。

它们能跑通机制，但概率并未针对决策任务校准，实际效果有限。

要让模型输出真正可用的、校准良好的决策概率，必须进行训练。

### 15.2 Teacher-Student 蒸馏流程

采用的标准路径是：

1. **Teacher**：使用更强的模型（或已经对齐的决策模型）对大量状态生成高质量的决策标签（每个问题的目标概率分布或硬标签）。
2. **Student**：用较小的 Decoder 或 Encoder 模型，学习拟合 Teacher 的输出。
3. 损失函数通常是针对决策位置的 logits，让 Student 在相同的选项集合上逼近 Teacher 的概率分布。

蒸馏的核心收益：

- Student 可以更小、更快
- 保留 Teacher 的决策能力和一定的校准性
- 推理时完全走 Prefill-Only 路径，延迟极低

### 15.3 训练时的数据形式

训练样本通常是：

- 一个状态（state）
- 一组问题 + 对应的选项
- Teacher 给出的目标概率（或 argmax 标签）

模型在决策位置上的输出与目标分布对齐，而不是做传统的 next-token 预测。

### 15.4与 后面 RL 的关系

蒸馏解决的是“有监督对齐”问题，能快速获得一个可用的决策模型。

但要进一步提升**概率的诚实度**（高置信度时真的准），会引入强化学习方法（GRPO + RLCD）。

蒸馏是基础，RL 是为了校准。

---

## 16. 强化学习 GRPO 与扰动轨迹

### 16.1 为什么需要 RL

蒸馏只能让 Student 模仿 Teacher 的输出分布。

它能提高准确率，但无法保证概率是**校准的**——即模型说 0.9 的时候，真的有 90% 的把握。

决策模型最终要被程序直接使用（高置信度自动执行，低置信度转人工），因此校准比单纯准确率更重要。视频在这里引入强化学习来专门优化这一点。

---

### 16.2 GRPO 的核心思路

GRPO（Group Relative Policy Optimization）在本文的用法是：

- 对同一个状态，生成一组**扰动轨迹**（Perturbed Trajectories）
- 在这组轨迹上比较不同决策的相对好坏
- 用相对优势来更新策略，而不是依赖绝对奖励的精确数值

这样做的好处是降低对奖励模型精度的依赖，训练更稳定。

---

### 16.3 Perturbed Trajectories 的作用

通过故意对输入或中间状态加入受控扰动，让模型看到“相似但不同”的情况。

目标是：

- 让决策边界更稳健
- 减少对特定表述的过拟合
- 提升在真实分布上的校准表现

---

### 16.4 与蒸馏的衔接

典型训练流程是：

1. 先用 Teacher-Student 蒸馏获得一个较好的初始决策模型
2. 再在此基础上用 GRPO + 扰动轨迹做强化学习
3. 进一步优化概率的校准性和鲁棒性

蒸馏解决“学会做正确决策”，RL 解决“学会诚实地表达自己的把握”。

## 17. 损失函数深度讲解

把决策模型的训练目标拆成三个互补的损失组件，最终为 RLCD 服务。

### 17.1 Log Loss（交叉熵）

标准分类损失：

$$
\mathcal{L}_{\mathrm{Log}} = -\sum_i y_i \log p_i
$$

- $y$ 是目标分布（可以是 hard label 或 soft label）
- $p$ 是模型在选项集合上的预测概率

作用：

- 直接优化决策准确率
- 迫使模型把概率质量放在正确选项上

局限：

- 对校准不敏感。模型可以很自信地错，或者很犹豫地对，Log Loss 都不会强烈惩罚“概率是否诚实”。

### 17.2 Spherical Scores

专门用于提升概率校准的评分规则。

核心思想是奖励“既准确又自信”的预测，同时惩罚过度自信的错误。它属于 proper scoring rule 的一种，能直接激励模型输出接近真实后验的概率。

与 Log Loss 相比：

- Log Loss 更关注把正确选项的概率推高
- Spherical Score 更关注整体分布的校准质量（说 0.9 的时候是否真的该有 90% 把握）

在决策场景中，这能让高置信度的输出更值得程序直接信任。

### 17.3 Ranked Probability Score (RPS)

针对 **Score（有序）** 类型问题的损失。

当选项本身有顺序（例如 calm → frustrated → furious）时，普通交叉熵把所有错误一视同仁。RPS 会考虑顺序距离：

- 预测“平静”但真实是“非常愤怒” → 惩罚更大
- 预测“沮丧”但真实是“非常愤怒” → 惩罚较小

数学上，RPS 计算的是累积分布之间的差异，对有序结果更合理。

因此：

- Choice / Boolean 问题主要用 Log Loss + Spherical
- Score 问题会额外加入 RPS

---

### 17.4 三者如何配合

- **Log Loss** 负责基本的分类正确性
- **Spherical Scores** 负责概率校准（诚实度）
- **RPS** 负责有序问题的顺序敏感性

它们不是互相替代，而是针对决策模型的不同需求组合使用。最终会在下一步被统一进 RLCD Loss。

---

## 18. 最终 RLCD Loss 的构建

### 18.1 RLCD 的目标

**RLCD = Reinforcement Learning for Calibrated Decisions**

核心诉求不是单纯提高准确率，而是让模型输出的概率**诚实**：

- 说 0.9 的时候，真的有约 90% 的正确率
- 高置信度可以放心交给程序自动执行
- 低置信度则转人工或走更重的模型

### 18.2 最终损失的组合方式

把前面三个组件组合成最终训练目标：

1. **Log Loss**

    提供基本的分类梯度，确保模型把概率放在正确选项上。

2. **Spherical Scores**

    直接优化校准，抑制“盲目自信”或“过度犹豫”。

3. **Ranked Probability Score (RPS)**

    仅在有序（Score）问题上启用，让模型理解选项之间的顺序距离。

实际实现中，通常是加权求和：

$$
\mathcal{L}{\text{RLCD}} = \lambda_1 \mathcal{L}{\text{Log}} + \lambda_2 \mathcal{L}{\text{Spherical}} + \lambda_3 \mathcal{L}{\text{RPS}}

$$

权重 $\lambda$ 根据任务类型（Choice / Boolean / Score）和数据特性调整。布尔和 Choice 问题可以弱化或去掉 RPS。

### 18.3 与 GRPO 的配合

这个损失不是单纯做监督学习，而是嵌入在 GRPO 的框架里：

- 通过扰动轨迹生成一组对比样本
- 用 RLCD 损失评估每条轨迹的决策质量与校准程度
- 用相对优势更新模型

蒸馏提供起点，GRPO + RLCD 损失负责把概率变得更可信。

### 18.4 最终效果

训练完成后，模型在 Prefill-Only 推理下就能直接输出：

- 结构正确的决策
- 具有实际参考价值的置信度