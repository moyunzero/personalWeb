---
title: 学 DeepSeek Harness（2）：Profile / Bundle / Patch，把运行时「叠」出来
slug: 2026-08-15-deepseek-harness-2-profile-bundle-patch
description: >2-
   DeepSeek Harness笔记 · 2 
  需要：第 1 篇里那个能 --patch 进 Web 的最小插件；会跑 pnpm dsh --profile web --dump-config。本篇不需要
  API Key。
author: 墨韵
date: 2026-08-15
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3bedf5c0-26f4-80ae-9ecc-c8dc4c53823a
notionSyncedAt: 2026-08-17T02:48:18.648Z
---

第 1 篇结束时，终端里出现过一句很爽的话：`[hello-plugin] plugin loaded!`。爽完之后有个更扎人的问题：**这一行到底插进了整棵树的哪一层？**


已经见过 `dump-config` 满屏的 `# == @deepseek-ai/dsh-base` 和 `patched by @deepseek-ai/dsh-web-app`。阶段 1 你会写插件、会 `insert`。阶段 2 要学会的是启动期那句心法：

> **运行时 = 从空列表一层层叠出来的插件树。**
>
> 叠出来的东西就是全部——没有「编译进二进制、碰不得」的特权核心。
>
>

本篇-四件事：**Profile / Bundle / Patch** 三个粒度、从空列表叠起的顺序、用 `dump-config` 看见 `--patch` 落在最顶层、以及怎么读 `# ==` 来源注释。


---


## 三个词，三种粒度


一句话区分：


**Patch（补丁）** 是一层操作列表——YAML 数组。它可以 `insert` 新行，也可以按 `id` 覆盖某行的**整份** `config`（不是深度合并；要保留的字段得自己重述）。它声明「树长什么样」，本身不携带插件代码。


**Bundle（组合包）** 是「配置 + 代码」的分发单元。npm 包在 manifest 里声明大致如下：


```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```


`cordis.patch.yml` 是它贡献的配置层；包里的模块则是那些 row 的 `name` 所指向的实现。它回答：**这个包贡献什么？**


**Profile（配置档）** 是组装清单，通常在 `$DSH_HOME/profiles/<name>/`（未设 `DSH_HOME` 时多为 `~/.dsh/profiles/<name>/`）。里面有 `package.json`（`dsh.profile.bundles` 列出要叠哪些 bundle、什么顺序）和用户自己的 `cordis.patch.yml`。它回答：**我要用哪些 bundle、按什么顺序叠、最后自己再补什么。**


关系可以记成：

> Bundle 是 Patch 的载体；Profile 是 Bundle 的编排者；CLI `--patch` 是临时盖在最上面的一张纸。

发行版里几乎每个 profile 的第一层都是 [`@deepseek-ai/dsh-base`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle/base)（仓库内路径 `packages/bundle/base/`）；[`dsh-web-app`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle/web-app) / `dsh-headless` 再叠上去，变成浏览器应用或一次性 runner——同一条 spine，不同产品面。


要把自己的能力发成可安装层、真正进到叠加顺序 **①**：按官方教程打成 bundle 后，用 **`dsh plugin add <package>`** 装进某个 profile（细节见 `docs/user/develop/basic/publish.zh.md`）。只 `--patch` 本地文件，还停在第 ④ 层实验态。


---


## 从空列表叠到最终树


官方文档写明的顺序是（起点：空条目列表）：

1. **每个 Bundle 的 patch**，按 profile 的 `dsh.profile.bundles` **列表顺序**（base 通常第一，然后是 web-app / headless / 你用 `dsh plugin add` 装上的包）
2. **Profile 自己的** `cordis.patch.yml`（`$DSH_HOME/profiles/<name>/cordis.patch.yml`）
3. **Home 级** `cordis.patch.yml`（`$DSH_HOME/cordis.patch.yml`，跨 profile 的机器本地偏好；应用在 profile patch **之后**，因此比 ② 更高）
4. 每个 **`-patch <path>`** **overlay**，按 argv 顺序（最顶层）

第 1 篇里这条命令：


```bash
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```


你的 overlay 落在 **第 ④ 层**——权限最高：可以盖住前面所有层里的任意行。临时实验放这就对；想长期只给 web 用，应挪到 ②；想所有 profile 都生效，放 ③。


### 冷热不对称（选层时很要紧）

- **① Bundle**：装进 profile 的 `bundles` 列表后，这一层在当次进程里相对「冷」——改 bundle 内容通常要重装/改 manifest 再启动，不是改一个 YAML 就热更新。
- **②③ 用户 patch 文件**：长寿命 surface 上由 `watchUserPatches` 监视；改 profile / home 的 `cordis.patch.yml` 会触发重新组合，**改完即时生效**（热）。
- **④** **`-patch`** **overlay**：启动时读入并叠在最顶；热重载时复用的是启动时已加载的 overlay 内容——**改 overlay 文件本身不会像 ②③ 那样被单独 watch 重读**。实验方便，但要「改文件即生效、又想长期留下」，更该迁到 ②。

所以「选层」不只看优先级高低，还看你要的是**一次性覆盖**还是**可热改的用户偏好**还是**可分发的安装单元**。


---


## 动手：两次 dump-config，看见第 ④ 层出现


假定仓库根目录下已有第 1 篇的 scratch 插件。`scratch-plugin/cordis.yml` 形态如下（把路径换成你的仓库根绝对路径；在仓库根执行 `pwd` 再拼接）：


```yaml
- insert:
    - id: hello
      name: '/ABS/PATH/TO/REPO/scratch-plugin/src/my-plugin.ts'
```


在仓库根执行（有 ripgrep 用 `rg`，没有就用后面的 `grep -E`）：


```bash
# A：无 CLI overlay——看 bundle 层签名即可
pnpm dsh --profile web --dump-config 2>/dev/null | rg -n "dsh-base|dsh-web-app|# ==" | head -n 40

# B：带上 scratch overlay——scratch 块在 dump *末尾*，不要对「全部 # ==」再 head
pnpm dsh --profile web --patch ./scratch-plugin/cordis.yml --dump-config 2>/dev/null | rg -n -A 4 "scratch-plugin"
```


无 `rg` 时：


```bash
pnpm dsh --profile web --dump-config 2>/dev/null | grep -nE 'dsh-base|dsh-web-app|# ==' | head -n 40
pnpm dsh --profile web --patch ./scratch-plugin/cordis.yml --dump-config 2>/dev/null | grep -nE 'scratch-plugin|hello|my-plugin' -A 4
```


### A 里你看到什么


大量来源注释在 bundle 层之间跳：


```plain text
# == @deepseek-ai/dsh-base
# == @deepseek-ai/dsh-base, patched by @deepseek-ai/dsh-web-app
…
# == @deepseek-ai/dsh-web-app
```


搜 `hello` / `my-plugin` / `scratch-plugin`：**没有。** 第 ④ 层没叠，树里就没有那一行。


### B 比 A 多了什么


针对 `scratch-plugin` 搜出来的块（路径写成占位）：


```plain text
# == <repo-root>/scratch-plugin/cordis.yml
- id: hello
  name: <repo-root>/scratch-plugin/src/my-plugin.ts
```

- **`id: hello`**：配置树上的稳定名字——以后按 id 覆盖、禁用都靠它。
- **`name`**：真正加载的模块。
- **`# == …/scratch-plugin/cordis.yml`**：明确告诉你——这一段来自 **CLI** **`-patch`** **文件**，不是 base，也不是 web-app。

同一套对比还证明：`dump-config` 和真实启动走同一套组合算法，纸面上看到的就是将要挂载的树。


---


## 踩过的坑


### 坑 1：`head -n 40` 把末尾的 scratch 块截掉了


第一次对比时，命令 B 写成「过滤 `# ==` 再 `head -n 40`」。问题是：`# ==` 匹配极多，前 40 行全是 base / web-app；而 `--patch` 插在的 **dump 末尾**，会被 `head` 直接切掉——于是你以为「B 也没有 hello」，和「输出末尾多出一块」自相矛盾。


**改法**：对 scratch 用 `rg -n -A 4 "scratch-plugin"`（或 `grep -E`），不要对整棵树的来源注释盲目 `head`。


### 坑 2：按 id 覆盖时当成「改一个字段」


按 id 定位的 patch **整份替换**该行的 `config`，不做深度合并。只写想改的那一个键，同级其它字段会丢。官方约定：要保留的字段必须在 patch 里重述；空文件或纯注释的 patch 文件会抛错，禁用该层请写 `[]`。


---


## 学会读 `# ==`：每一层都在签名


| 注释形态                                                              | 含义                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `# == @deepseek-ai/dsh-base`                                      | 来自 base bundle                                           |
| `# == @deepseek-ai/dsh-base, patched by @deepseek-ai/dsh-web-app` | 出身 base，被 web-app 动过（常见：大量 `tool-*` 被标 `disabled: true`） |
| `# == @deepseek-ai/dsh-web-app`                                   | web-app 自己插入的行（host / client UI 等）                       |
| `# == …/profiles/web/cordis.patch.yml`                            | Profile ②：只给 web 的用户补丁（可热更）                              |
| `# == …/cordis.patch.yml`（home）                                   | Home ③：整机共享偏好（可热更）                                       |
| `# == …/scratch-plugin/cordis.yml`                                | CLI ④：这次命令行 overlay（启动时叠上）                               |


**意义不只是好看：**

1. **审计**：行为不对，先问「这行是谁放进来的」，再决定改哪一层。
2. **选层**：临时实验 → ④；要热改、只给某 profile 长期用 → ②；全机 → ③；要发成可安装能力 → 做成 Bundle，用 `dsh plugin add` 进 ①。
3. **读懂产品面**：阶段 0 看见一堆 `disabled: true`，不是「Web 没工具」，而是 **web-app 在改 base**——注释里的 `patched by` 就是证据。

---


## 这设计到底在解决什么？


它把「产品长什么样」从写死的代码，变成了**可叠加、可覆盖、可审计的数据**。


同一套 spine（模型、工具、会话、沙箱、审批……）可以叠出 web / headless / ACP 等不同产品面——差异主要是「叠了哪些 bundle、顺序如何」，而不是三份各自维护的代码副本。


扩展不必 fork `packages/`：带着模块和 patch 来，插进某一层即可；上游升级，你的层还在。要进别人的 profile 列表，再走 `dsh plugin add` 那条分发路径。


若改成「写死启动列表 + 几个开关」：能力集合在作者枚举时就封闭了；开关是布尔积，能关 bash，却**换不掉** bash 的实现。层叠的规则更简单——**后写覆盖前写**——谁都能加一层；「换实现」就是改某一行的 `name`。开关系统还要维护「哪些 flag 组合合法」的隐式知识；patch 树没有这份知识，`dump-config` 就是运行前真相，空 patch、缺 id 还会大声失败。


一句话串起来：

> Bundle 打包配置+代码，Profile 按顺序叠 bundle 再补自己的 patch，`--patch` 是最后一层 override——整棵运行时树就是这样从空列表「叠」出来的；叠的过程中没有任何一行是特权。这就是「一切皆插件」在启动期的落地形态。

---


## 自测与正解


### 1. Profile、Bundle、Patch 各是什么？差在哪？


**正解**

- **Patch**：YAML 操作列表（insert / 按 id 整份替换 config），不携带代码。
- **Bundle**：npm 分发单元 = 自带的 patch 层 + 被引用的插件代码。
- **Profile**：命名组装 = 有序 bundles 列表 + 自己的 `cordis.patch.yml`（及树外依赖等）。

Bundle 是 Patch 的载体；Profile 是 Bundle 的编排者。


### 2. 从空列表开始，叠加顺序是什么？


**正解**：① 各 Bundle（按 profile 列表顺序）→ ② profile 的 `cordis.patch.yml` → ③ home 的 `cordis.patch.yml` → ④ CLI `--patch`（按 argv）。越靠后优先级越高。


### 3. `pnpm dsh web --patch ./scratch-plugin/cordis.yml` 落在哪一层？若长期只给 web 用呢？


**正解**：落在 **④**。长期只给 web：把同一段 `insert` 挪进 **②** `$DSH_HOME/profiles/web/cordis.patch.yml`（还可热更）。全 profile 生效则放 **③**。要进 ①：打成 bundle 后 `dsh plugin add …`。


### 4. `dump-config` 里 `# == …` 有什么用？


**正解**：标注**这一段 row 的来源层**。用来审计「谁贡献/谁改过」、决定改哪一层、理解 `patched by` 与产品面差异。不是装饰性注释。


### 5. 为什么说没有「特权核心」？和这套叠加有何关系？


**正解**：最终树里每一行——包括 agent-loop、tools、llm——都来自某层 patch；上层可以覆盖或禁用。`dsh-base` 只是几乎总在最底的第一层 bundle，不是碰不得的内核。扩展 = 加层，不是 fork。


### 6. 按 id 做覆盖时，是深度合并吗？


**正解**：否。匹配到的条目会**整份替换** **`config`**；需要保留的字段必须在 patch 里重述。常见偏答：「只改一个字段就行」——会把同级其它字段弄丢。


### 7. ②③ 与 ④ 在「热更新」上有何不同？


**正解**：②③ 的 `cordis.patch.yml` 被 `watchUserPatches` 监视，改文件会重新组合。④ 的 `--patch` 在启动时读入；热重载路径不会像 ②③ 那样重读 overlay 文件。选层时要一起考虑「优先级」和「能不能热改」。


---


## 写在后面


这阶段最有用的体感不是背顺序表，而是：

- 同一条 `insert`，在 ④ 是实验，在 ② 是可热改的产品习惯，在 Bundle + `dsh plugin add` 里才是可分发能力；
- `# ==` 会在纸面上把分层签名给你——会读注释，才会选对改哪里；
- 过滤 dump 时别让 `head` 切掉末尾真相；
- 「没有特权核心」不是口号，而是 `dump-config` 里每一行都可以被更上层改写的事实。

---


### 延伸阅读

- `docs/architecture.zh.md`（「Profile 与组合包」）
- `packages/boot/app-boot/README.zh.md`（Profiles、用户 patch 层、`watchUserPatches`）
- `packages/bundle/base/`、`packages/bundle/web-app/`
- `docs/user/develop/basic/publish.zh.md`（`dsh plugin add` 把 bundle 装进 profile）
- 上游仓库：[https://github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)