---
title: 学 DeepSeek Harness（1）：Cordis 内核，从第一行 `apply` 到挂进 Web UI
slug: 2026-08-15-deepseek-harness-1-cordis-apply-web-ui
description: |-
  DeepSeek Harness笔记 · 1
  需要：能跑起来的 deepseek-harness 源码树、一次成功的 pnpm dsh web。API Key 本篇大半时间用不上。
author: 墨韵
date: 2026-08-15
categories:
  - note
tags:
  - ai
  - Agent
draft: false
notionId: 3bddf5c0-26f4-80c6-a245-c3be081e9d43
notionSyncedAt: 2026-08-15T10:08:21.609Z
---

打开 DeepSeek Harness 的 `dump-config`，会看到一件有点反直觉的事：屏幕上不是「程序主流程」，而是一长串可增删改的插件条目。口号写得很冲——**Everything is a Plugin**——但口号救不了你。真正要弄明白的是：这些条目在运行时靠什么活着？


答案叫 **Cordis**。本篇我按官方教程亲手走了一遍：先在临时目录里把 Cordis 五件事摸熟，再把一个最小插件塞进真实的 Web UI。全程不改仓库核心包，只写自己的插件和 patch。


心法先记一句：

> **Agent = Model + Harness**
>
> Model 负责想；Harness 负责让 Agent 在真实环境里干活。Harness 这一侧，几乎一切都是插件。
>
>

---


## 先建立一个「空房间」


克隆并安装好依赖后，在仓库根目录建一个会被 git 忽略的练习场：


```bash
mkdir -p tmp/cordis-tutorial
cd tmp/cordis-tutorial
```


以后这章所有实验都在这个目录里跑同一条命令：


```bash
node --import tsx ../../vendor/cordis/bin.js
```


它会起一个根 `Context`，然后去读**当前目录**的 `cordis.yml`。我第一次建完空文件夹就敲了命令，立刻吃瘪：


```plain text
config file not found: .../tmp/cordis-tutorial/cordis.yml
```


教程里那条命令是「每章共用的启动方式」，不是「什么都没有也能跑」。先写文件，再点火。


---


## 最小插件：其实就一个函数


创建 `hello.ts`：


```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'hello'

export function apply(ctx: Context) {
  console.log('hello from my first plugin')
}
```


再写 `cordis.yml`，告诉 loader 挂谁：


```yaml
- name: './hello.ts'
```


跑起来，终端只回你一句：


```plain text
hello from my first plugin
```


然后进程自己退出。没有常驻服务时，这很正常。


到这里，Cordis 的第一印象可以落地了：**插件不是你去 new 一个框架，而是框架来调用你的** **`apply(ctx)`**。`ctx` 就是那间共享的房间——服务容器。以后别人要用你的能力，靠的是 `ctx` 上的稳定名字，而不是直接 import 你的实现文件。


---


## 卸载时，谁来收拾桌子？


第二个实验让我真正理解「Registrations are reversible effects」。


```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'lifecycle-demo'

function heartbeat(ctx: Context) {
  console.log('heartbeat plugin loading')
  ctx.effect(() => {
    const timer = setInterval(() => console.log('tick'), 200)
    return () => {
      clearInterval(timer)
      console.log('heartbeat cleaned up')
    }
  })
}

export function apply(ctx: Context) {
  const fiber = ctx.plugin(heartbeat)
  ctx.effect(() => {
    const timer = setTimeout(async () => {
      await fiber.dispose()
      console.log('disposed')
      process.exit(0)
    }, 700)
    return () => clearTimeout(timer)
  })
}
```


`cordis.yml` 改成只加载它，输出大概是这样（`tick` 次数会抖）：


```plain text
heartbeat plugin loading
tick
tick
tick
heartbeat cleaned up
disposed
```


注意顺序：先 `cleaned up`，再 `disposed`。定时器不是靠你记得到处 `clearInterval`，而是挂在 `ctx.effect` 上——插件一卸，清理函数自动跑。


反过来想：如果注册不可逆，热更新连载两次，旧的 `tick` 还在跳，新的又来一套。这不是风格问题，是必现的脏状态。


---


## 服务要先「就位」，再用 `inject` 声明


光会打日志不够。真正的能力通常是一个挂在 `ctx` 上的服务。


`greeter.ts`：


```typescript
import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    greeter: GreeterService
  }
}

export class GreeterService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'greeter')
  }

  greet(who: string) {
    return `Hello, ${who}!`
  }
}

export const name = 'greeter'

export function apply(ctx: Context) {
  ctx.plugin(GreeterService)
}
```


`consumer.ts`：


```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'consumer'
export const inject = ['greeter']

export function apply(ctx: Context) {
  console.log(ctx.greeter.greet('world'))
}
```


```yaml
- name: './greeter.ts'
- name: './consumer.ts'
```


终端：


```plain text
Hello, world!
```


那行 `inject = ['greeter']` 不是装饰。它在说：等 `greeter` 就绪再叫我。加载顺序由此用**依赖**表达，而不是靠 YAML 谁写在谁上面。以后你要往 `ctx.tools` 上注册工具，通常也得先 `inject: ['tools']`，道理一样。


插曲：我第一次跑这段时，卡在一个跟 Cordis 毫无关系的报错上：


```plain text
consumer.ts:1:6: ERROR: Expected ";" but found "type"
```


`import` 被我打成了 `mport`——手滑丢了首字母 `i`。esbuild 把 `mport` 当成一个表达式，读到 `type` 发现前面没有分号，就炸了。读 esbuild 语法错误的通用姿势：报错指到哪个 token，就往**前**看一个 token，通常是拼写或标点问题，而不是环境问题。这个坑跟路径、端口那些"环境坑"不一样，纯粹是打字的事。


---


## 事件：先学会喊一嗓子，再学会拦路


事件有五种分发模式（emit / parallel / serial / bail / waterfall），模式是事件契约的一部分。本篇只深入最常用的两种——广播和瀑布；另外三种先留个名字：`parallel` 并行，`serial` 串行且首个非空返回值胜出（Harness 里 `agent/turn-stopping` 用的就是它），`bail` 是 serial 的同步版。


### 广播：`emit`


`stats.ts` 负责计数，并在变化时喊一声：


```typescript
import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    stats: StatsService
  }
  interface Events {
    'stats/report'(name: string, count: number): void
  }
}

export class StatsService extends Service {
  private counts = new Map<string, number>()

  constructor(ctx: Context) {
    super(ctx, 'stats')
  }

  bump(name: string) {
    const next = (this.counts.get(name) ?? 0) + 1
    this.counts.set(name, next)
    this.ctx.emit('stats/report', name, next)
  }
}

export const name = 'stats'

export function apply(ctx: Context) {
  ctx.plugin(StatsService)
}
```


`reporter.ts` 只负责听：


```typescript
import type { Context } from '@deepseek-ai/cordis'
import type {} from './stats.ts'

export const name = 'reporter'
export const inject = ['stats']

export function apply(ctx: Context) {
  ctx.on('stats/report', (name, count) => {
    console.log(`[stats] ${name} -> ${count}`)
  })
  ctx.stats.bump('tool_call')
  ctx.stats.bump('tool_call')
  ctx.stats.bump('prompt')
}
```


```yaml
- name: './stats.ts'
- name: './reporter.ts'
```


```plain text
[stats] tool_call -> 1
[stats] tool_call -> 2
[stats] prompt -> 1
```


`ctx.on` 同样是可逆的：插件卸了，监听器跟着走，不必自己维护 `removeListener` 名单。


### 瀑布：`waterfall`（最容易踩坑的一种）


Harness 里很多关键决策是 waterfall——听起来像「事件」，用起来像中间件：你拿到参数和一个 `next`，要么加工后再往下传，要么直接返回，把后面整段掐掉。


我一开始犯了个蠢：在 `stats.ts` 上改两行，以为自己在做 waterfall 实验。终端还在老老实实打 `[stats]`，我还纳闷「怎么没变化」。后来才发现：教程要你**另起一个文件**，并且让 `cordis.yml` 只指向它。


正确的第一版：


```typescript
import type { Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Events {
    'demo/transform'(input: string, next: () => Promise<string>): Promise<string>
  }
}

export const name = 'waterfall-demo'

export function apply(ctx: Context) {
  ctx.on('demo/transform', async (input, next) => {
    const downstream = await next()
    return downstream.toUpperCase()
  })

  ctx.on('demo/transform', async (input, next) => {
    if (input.includes('blocked')) return '** blocked **'
    return next()
  })

  void (async () => {
    console.log(await ctx.waterfall('demo/transform', 'hello', async () => 'hello'))
    console.log(await ctx.waterfall('demo/transform', 'blocked words', async () => 'blocked words'))
  })()
}
```


```yaml
- name: './waterfall-demo.ts'
```


```plain text
HELLO
** BLOCKED **
```


第二行值得放慢看：外层先 `next()`，进到内层；内层看见 `blocked`，**不调** `next()` 直接返回；最里面的默认函数根本没跑；返回途中外层再把结果变成大写。


然后我做了受控破坏——外层直接短路：


```typescript
ctx.on('demo/transform', async (input, next) => {
  return 'skipped'
})
```


```plain text
skipped
skipped
```


两次调用都被否决了。这就是以后写「只想打日志」的监听器时最危险的姿势：忘了 `return next()`，等于你在生产流水线上按了急停。


还有一种半吊子改法更糟：外层还在 `await next()` 并 `.toUpperCase()`，内层却不返回字符串——我会直接拿到：


```plain text
TypeError: Cannot read properties of undefined (reading 'toUpperCase')
```


记住一句就够：**观察者必须把链传下去；不调** **`next()`** **只留给真正要否决的人。**


---


## 把玩具挂进真·Web UI


沙盒玩够了，按官方「第一个 Harness 插件」教程进场。仍然不改核心包。


在仓库根目录：


```bash
mkdir -p scratch-plugin/src
```


插件本身朴素得可以（存成 `scratch-plugin/src/my-plugin.ts`——下面 `cordis.yml` 里引用的就是这个文件名）：


```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'hello-plugin'

export function apply(ctx: Context) {
  console.log('[hello-plugin] plugin loaded!')
}
```


真正的关键是 overlay。新建 `scratch-plugin/cordis.yml`：


```yaml
- insert:
    - id: hello
      name: '/ABS/PATH/TO/REPO/scratch-plugin/src/my-plugin.ts'
```


`/ABS/PATH/TO/REPO` 请换成你仓库根的绝对路径——在根目录跑一次 `pwd` 再拼上去。为什么不能写 `./src/my-plugin.ts`？因为 patch **只往配置树里塞一行**；真正解析模块时，基准目录是 profile（类似 `~/.dsh/profiles/web/`），相对路径不会魔法般落到你的 `scratch-plugin/` 下。


我这边第一次手滑，少打了一个 `/`，错误信息里的路径变成了 `.../deepseek-harnessscratch-plugin/...`——两个目录名粘在一起，模块当然不存在。


另一个并发错误更常见：旧的 `pnpm dsh web` 还占着 `3080`，新的带 `--patch` 的进程再抢端口，直接 `EADDRINUSE`。先把旧进程停掉。


然后：


```bash
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```


成功时终端会先报喜，再给你 URL：


```plain text
[hello-plugin] plugin loaded!
dsh web: <http://127.0.0.1:3080>
```


那一刻，阶段 0 看到的「可 patch 的插件树」，和阶段 1 亲手 `insert` 的 `id: hello`，终于接上了。


---


## 这设计到底在解决什么？


如果 Harness 做成「一个大单例 + 一堆开关」，你只能打开或关闭别人预留好的能力。插件树换了游戏规则：任意一层都可以插入、替换、禁用；扩展方带着自己的模块和 patch 来，不必 fork 核心，也能跟着上游走。


Cordis 把这件事落到三个习惯上：

1. 能力进 `ctx`，用名字协作；
2. 依赖用 `inject` 声明，别手排启动顺序；
3. 注册可逆，卸载/热更新才不会堆尸。

waterfall 则给「多个插件要围着同一个决策吵架」准备了明确协议——加工，或否决，但别假装自己只是路人却按了急停。


---


## 自测


读完不妨合上屏幕先想一想；下面每题都给出**正确答法**（含常见偏答）。这就是本篇要带走的检查点。


### 1. Plugin、Context（`ctx`）、inject 分别是什么？彼此什么关系？


**正解**

- **Plugin**：实现能力的模块，常见形态是导出 `apply(ctx)`；框架挂载时调用它。
- **Context（****`ctx`****）**：服务容器；稳定能力挂在 `ctx.<key>`（如 `ctx.greeter`、`ctx.tools`），别人靠 key 用，不直接绑死某个实现文件。
- **inject**：声明「我依赖哪些 key」；Cordis 等依赖就绪再跑你的 `apply`。

关系一句话：**插件往** **`ctx`** **上挂服务；其他插件用** **`inject`** **等服务就位后再用。**


### 2. 五种 dispatch（emit / parallel / serial / bail / waterfall）里，哪种最容易踩坑？真正坑在哪？


**正解**：`waterfall`。


常见偏答：「因为它有返回值。」——返回值只是表象。


真正要命的是：监听器收到 `next`，**必须调用** **`next()`****（或** **`await next()`****）链才会继续**；不调用等于短路/否决。只想打日志却忘了 `return next()`，会静默掐掉下游（本篇受控实验输出变成两次 `skipped`）。


### 3. 「注册必须是可逆效果」是什么意思？若不可逆，HMR 连续重载两次会怎样？


**正解**

- 通过 `ctx.effect()` / `ctx.on()` 登记的定时器、监听器等，在插件**卸载**时会被自动清理（本篇 `heartbeat cleaned up`）。
- 若不可逆：旧注册清不掉，新插件再挂一份 → **重复 tick、同一事件触发多次、内存泄漏**。

### 4. 如果插件要 `ctx.tools.register(...)`，为什么通常要写 `export const inject = ['tools']`？


**正解**：保证 `apply` 执行时 `ctx.tools` 已经就绪。


不写 `inject`，插件会立即加载——fiber 不会停在 PENDING 等依赖——可能在 tools 服务尚未挂上时就去注册，轻则失败，重则行为不稳定。这和 greeter / consumer 里 `inject = ['greeter']` 是同一条规则。


### 5. 「一切皆插件」解决了什么问题？为什么不用「大单例 + 一堆开关」？


**正解**

- 解决：**可替换、可组合、可卸载**——没有特权核心，扩展用插件 + patch 改运行时树，不必 fork 源码。
- 开关只能开/关已有能力；插件树才能对任意 row **插入 / 替换 / 禁用**（本篇的 `-patch` + `id: hello` 就是在插一行）。

### 6. 挂进 Web 时，为什么 patch 里的插件路径往往要写绝对路径？


**正解**：patch 只往配置树塞配置；模块解析基准是 **profile 目录**（如 `~/.dsh/profiles/web/`），不是你的 `scratch-plugin/` 目录。相对路径会解析错地方。用仓库根 `pwd` 拼出绝对路径；少一个 `/` 就会变成 `deepseek-harnessscratch-plugin` 这种粘连路径（正文里的真实报错）。


---


## 写在后面


这周我真正记住的不是条文，而是三次体感：

- effect 卸掉时，`tick` 真的会停；
- waterfall 忘了 `next()`，下游会消失得干干净净；
- Web 挂载失败时，报错里的路径比文档更能教人——绝对路径、端口、profile 解析基准，全写在堆栈里。

---


### 延伸阅读（仓库内）

- `docs/cordis-primer.zh.md`
- `docs/cordis-tutorial/`（建议至少跟到第 4 章）
- `docs/user/develop/basic/index.zh.md`

上游仓库：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)