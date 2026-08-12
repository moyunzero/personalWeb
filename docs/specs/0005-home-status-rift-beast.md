# 0005. 首页状态条裂隙与巨兽穿梭特效

**Date**: 2026-07-22（2026-07-23 交叉检查补合约；2026-08-12 冷启动改为 `client:idle`）
**Status**: Accepted

## Summary

首页 Hero 状态条（头像色块与「正在摸鱼中」）支持点击彩蛋：该行做分裂，视口内随机出现黑洞或漩涡，巨兽（Pyjama Shark）从门户穿出、游走后再穿回消失；文案先变为「已 dead」，治愈后再慢速改回摸鱼。偶尔自动触发时只播门户与巨兽，不改状态条。减弱动效或无 WebGL 时跳过 3D。博客不加载本特效与鲨鱼衍生资产。

## Context

> ⚠️ Premise note: 首页已有宇宙 WebGL、`HomeMotion`、MouseTrail、GameIsland 等客户端岛。本功能再加特效岛与第二层 WebGL，会抬高首屏与 GPU 风险。合约仍守与 spec 0003 相同的 Lighthouse 下限；超标时先砍衍生体积、像素比或缩短兽游段，不得放宽门槛。为把冷带宽让给宇宙 `three.js`，本岛与 GameIsland / HomeMotion 一样用 `client:idle`（见 0003 AC-7），接受首次可点略晚于首屏。另：状态条定为仅鼠标或触摸可点、不做成可键盘按钮，键盘用户无法触发彩蛋；这是产品选择，不是无障碍默认最优。

产品要在「摸鱼」状态上做动漫级彩蛋：点击有完整叙事（裂 → 门户 → 兽 → 文案 → 愈），自动触发只做惊喜旁观，不打断身份文案。黑洞观感应参考引力透镜与吸积盘类 shader 思路，但不整仓 vendoring 外部 demo。巨兽素材候选为本地 `public/threejs-assets/pyjama-shark-free/`（Sketchfab Free Standard；站上选择不署名）。

相关约束：Astro 静态页 + React islands；重库动态 `import()`；路径用 `import.meta.env.BASE_URL`；宇宙背景已占用 `background` slot 与探索手势；特效播放期须盖住指针并通知 cosmos 暂停探索。构建方式为本功能 Journey：先打通点击整条用户路径，再补自动路径，最后硬化与门禁。

若不做决定：要么特效与宇宙互相抢拖拽，要么原样加载 4K 贴图与 `.blend` 撞穿性能，要么在未约定状态下发明文案是否回写与自动节奏。

## Requirements

**用户故事**：
- 作为首页访客，我想点击头像或「正在摸鱼中」一行，看到裂隙、黑洞、巨兽穿梭的完整彩蛋，并看到文案短暂变为「已 dead」再改回摸鱼。
- 作为停留在首页的访客，我偶尔想在不碰状态条的情况下看到同样的门户与巨兽旁观彩蛋。
- 作为开启减弱动效或弱设备的访客，我希望不被 3D 特效拖垮，页面仍可用。
- 作为博客读者，我希望文章与列表不加载本特效与鲨鱼资产。

**验收标准**（合约；每条有 ID，可独立检查）：

- **AC-1（点击路径）**：在首页，对带 `data-status-spectacle-hit` 的状态条行指针按下或触摸后，播放完整序列：该行分裂 → 视口内出现门户 → 巨兽穿出、游走、穿回消失 → 分裂慢速治愈。默认相位时长：分裂 1.2s、门户现身 1.5s、兽游 `U(5000,7000)` ms（`sampleBeastDurationMs`）、治愈 1.5s；总和夹在 8～12s。文案在分裂结束时变为「已 dead」；治愈结束后再花 0.8s 淡回「正在摸鱼中 🐟」。仅鼠标与触摸可触发；不做成可键盘激活的 `button`。`pointerdown` 先经 `canStart` 再进入 `splitting`；覆盖层在 `splitting` 开始时启用（`z-[50]`，介于正文与 MouseTrail），`idle` 时 `pointer-events: none`。**Island 尚未 hydrate 时**：SSR 状态条上的 `pointerdown` 为 no-op、不排队、无反馈（接受首次可点略晚于首屏）。
- **AC-2（文案）**：默认文案由 Astro SSR 写在带 `data-status-spectacle-copy` 的节点上。仅 `trigger=click` 时 island 改该节点 `textContent`（`fishing` ↔ `dead` 字面量见 Feature design）。自动触发不得改该节点或状态条视觉。
- **AC-3（自动路径）**：`StatusSpectacleIsland` **hydrate / mount 之后**先等 30s（`AUTO_INITIAL_DELAY_MS`，不是文档导航时刻），再在 120～300s 均匀随机窗内排第一次自动播放（仅内存）。每次 Run **结束后**再抽下一窗。自动相位为 `idle → portal → beast → idle`，无分裂、无治愈、不碰状态条。进行中忽略一切新触发。若 hydrate 晚于用户停留，自动彩蛋会比「进首页 30s」字面更晚，这是 `client:idle` 的已知代价。
- **AC-4（门户落点）**：开播时采样 `PortalAnchor`：`r = min(120, 0.12 * min(vw, vh))`；`x,y` 为视口随机点，圆盘不得与禁区相交。禁区 = 顶栏导航与状态条行的 `getBoundingClientRect()` 各外扩 16px。最多重试 8 次；仍失败则用视口点 `(0.5 * vw, 0.62 * vh)`，必要时缩小 `r` 直至不碰禁区。
- **AC-5（降级）**：`prefers-reduced-motion: reduce`、WebGL 不可用、`webglcontextlost`、动态 `import('three')` 失败、或 glTF **必需资源**失败时，跳过门户与巨兽 3D 并 dispose。WebGL 探测与 0003 对齐：先 `failIfMajorPerformanceCaveat: true`，再试普通 `webgl` / `webgl2`。点击路径仍可做极短文案切换（dead → 再改回摸鱼）；自动路径静默取消。若已派发 `spectacle:start`，收尾必须恰好一次 `spectacle:end`。无错误 toast。
- **AC-6（博客排除）**：博客列表、文章及其他非首页不 import / hydrate 本特效 island，不请求 `threejs-assets/web/spectacle/` 下任何文件。
- **AC-7（资产）**：运行时只请求 `public/threejs-assets/web/spectacle/pyjama-shark/model.glb`（及同目录导出的外部贴图文件，若有）。源可留在 `pyjama-shark-free/`，禁止运行时请求 `.blend` 或源 4K。**必需资源**：glTF 根场景至少一根可渲染 mesh；动画 clip 优先名 `Swim`，否则取第一条；glb 内嵌贴图与同目录被引用的外部贴图一律视为必需（任一张失败 → AC-5）。该目录合计硬顶 **2.5 MB**；检查脚本超预算则构建失败。遵守 NoAI。站上不署名。门户外观为**单一**自研 shader（引力透镜 + 吸积盘观感合一），**不是**「黑洞 / 漩涡」二选一随机。
- **AC-8（与宇宙协作）**：在真正进入 `portal` 相位之前派发 `spectacle:start`；任意收尾（正常结束、降级取消、隐藏取消、unmount）恰好一次 `spectacle:end`。事件为冒泡 `CustomEvent`，`detail: { trigger: 'click' | 'auto' }`。播放期覆盖层接管指针；cosmos 监听后暂停探索。无声。降级且从未进入 `portal` 的 click 短文案路径不发 `start`/`end`。本岛仅在 Run 开始时才 `import('three')` / 拉 glTF（见 0003 AC-7），不得在 idle hydrate 时抢冷带宽。
- **AC-9（可见性与卸载）**：`document.hidden` 或 island unmount：立刻取消 Run、停止 rAF/定时器、dispose GPU、释放指针、相位 `idle`；若当时 `copy=dead` 则立即改回 `fishing`（无动画）；若已 `start` 则发 `end`。回到前台只重建自动排程（自本次 mount 起再先 30s 再入随机窗），不补播。动态 import 未完成时卸载则丢弃结果，不挂场景。
- **AC-10（性能）**：`yarn build` 后首页 `yarn perf:audit` 仍须 performance ≥ 0.85、LCP ≤ 2500ms。失败时调参顺序：先压鲨鱼衍生至 ≤2.5 MB 内更小档 → 降特效 canvas 像素比 → 缩短兽游至 5s 下限；不得放宽门槛。不与 cosmos 合并 renderer（保持独立 island）。

**3D 叙事常量（可测）**：透视相机；兽从门户中心沿水平弧线游过约 0.4 * vw；身长约 `1.8 * 2r`（世界单位按锚点映射）；出入各用缩放+透明度 0.4s；兽游时长 `sampleBeastDurationMs` → `U(5000,7000)`。

## Options considered

### Option 1: 独立特效 island + 自研门户 shader + Pyjama Shark glTF（选定）

新建 React island（`client:idle`，与 0003 冷启动合约一致），GSAP 做 DOM 分裂，独立 WebGL 层画门户，加载鲨鱼 glTF 动画；与 `CosmicStarfieldIsland` 用事件松耦合。

**Pros**：职责清晰；博客易排除；可复用现有 Three / GSAP / 资产管线习惯；不与宇宙抢冷带宽。  
**Cons**：首次可点略晚于 `client:load`；双 WebGL 需严格门禁与暂停策略。

### Option 1b: 同 Option 1 但 `client:load`（已否决，2026-08-12）

**Pros**：点击路径 hydrate 更早。  
**Cons**：与宇宙 / Phaser / GSAP 并行抢冷带宽，生产首次进入无行星。否决。

### Option 2: 把特效塞进 CosmicStarfieldIsland

**Pros**：少一个 hydrate 点、单 WebGL context。  
**Cons**：宇宙与彩蛋耦合；博客排除与测试面变糊。否决为默认（交叉检查仍维持本否决）。

### Option 3: CSS / 2D 近似漩涡 + 无模型剪影

**Pros**：更轻。  
**Cons**：达不到约定的动漫级门户与巨兽观感。否决为默认。

### Option 4: 整仓 vendoring black hole demo 仓库

**Pros**：视觉现成。  
**Cons**：栈与许可耦合重，难控体积。否决。

## Decision

**Chosen option**: Option 1

独立首页特效 island；门户用**单一** Three 自定义 shader（引力透镜 + 吸积盘观感合一，非二选一随机）；巨兽用 Pyjama Shark Free 导出的带动画 glTF；DOM 分裂与治愈用 GSAP；自动与点击共享门户与兽段，仅 click 驱动状态机中的分裂 / 治愈 / 文案；hydrate 用 `client:idle`。

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) · `threejs-fundamentals` (`cloudai-x/threejs-skills`, `.agents/skills/threejs-fundamentals/`) · `threejs-animation` (`cloudai-x/threejs-skills`, `.agents/skills/threejs-animation/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

Journey 要求先交付一条完整点击用户路径，再补自动旁观路径，避免半套特效长期挂着。独立 island 保住博客排除与宇宙模块边界，事件协作比共享 store 更贴合现有双岛首页。自研 shader 可控依赖；鲨鱼 Free Standard 允许站内展示，站上不署名是明确产品选择（仍须遵守 NoAI）。`client:idle` 把冷带宽让给宇宙 `three.js`（0003 AC-7），用 2.5 MB 硬顶与 AC-10 调参顺序对冲体积成本；接受彩蛋首次可点略晚，且自动 30s 自 hydrate 起算。交叉检查后把相位时长、排程、DOM/事件合约、资产路径、pre-hydrate 点击与必需资源写成可执行常量，避免 `/develop` 发明行为。

## Feature design

**Data model sketch**（仅运行时，无持久化）：

| 实体 | 字段 | 约束 |
|---|---|---|
| `StatusChip` | `copy`: `fishing` \| `dead` | 单例；默认 `fishing`；字面量 `正在摸鱼中 🐟` / `已 dead` |
| `SpectacleRun` | `id`, `trigger`: `click` \| `auto`, `phase`, `startedAt`, `portal` | 全局最多 1 个 |
| `PortalAnchor` | `x`, `y`, `r`（视口 px） | 与 Run 1:1；`r` 公式见 AC-4 |

**State transitions**：

- 点击：`idle → splitting → portal → beast → healing → idle`；分裂结束时 `copy=dead`；治愈结束后 0.8s 淡回 `fishing`。
- 自动：`idle → portal → beast → idle`；不改 `StatusChip`。
- 任意非 `idle`：拒绝新 Run。
- 降级短路：无 3D 时 click 可 `idle → (文案 dead) → (文案 fishing) → idle`（不发 spectacle 事件）；auto 直接留在 `idle`。
- 隐藏/卸载：强制 `→ idle`，必要时立即 `copy=fishing`。
- pre-hydrate：无 island 监听 → 点击 no-op（AC-1）。

**API surface**：

| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| 状态条 DOM（Astro） | `data-status-spectacle-hit` 行 + `data-status-spectacle-copy` 文案节点 | SSR 默认文案 | island 绑定目标 | public | pre-hydrate 点击忽略 |
| 新特效 island | `client:idle`，仅首页 | 无必填 props | Run / 文案 / `z-[50]` 覆盖层 | public | 能力失败 → AC-5 |
| `spectacleModel` 纯模块 | 函数 | phase、禁区矩形、viewport | canStart、samplePortal、shouldAffectStatus、`sampleBeastDurationMs`、相位毫秒表 | n/a | 无 |
| 门户 + 兽场景 | 动态 `import('three')`（仅 Run 开始） | THREE、BASE_URL、anchor、glb URL | dispose | public | 必需资源失败 → AC-5 |
| cosmos 协作 | `spectacle:start` / `end` | `detail.trigger` | 暂停/恢复探索 | public | 无监听则仅靠指针层 |
| 资产准备 / 检查 | CLI | `pyjama-shark-free` 源 | `web/spectacle/pyjama-shark/` + ≤2.5 MB | n/a | 超预算 exit ≠ 0 |

**Value sourcing**：

| Action | Value produced / displayed | Source |
|---|---|---|
| 显示文案 | 「正在摸鱼中 🐟」或「已 dead」 | Astro SSR 初始；之后 `StatusChip.copy` → `data-status-spectacle-copy` |
| 是否改文案 | boolean | `SpectacleRun.trigger === 'click'` |
| 相位时长 | ms | AC-1：分裂 1200、门户 1500、兽 `sampleBeastDurationMs`→`U(5000,7000)`、治愈 1500、文案淡回 800 |
| 门户位置与半径 | `PortalAnchor` | AC-4 公式 + 禁区外扩 16px + 8 次重试 + 安全点 |
| 门户外观 | 单一 shader（透镜+吸积盘） | `spectacleScene` 自研 shader；非二选一随机（AC-7） |
| 自动首次门闩 | 30s | island hydrate/mount 起算 `AUTO_INITIAL_DELAY_MS`（AC-3） |
| 自动下次时刻 | timestamp | 门闩后 `U(120s,300s)`；每次 Run 结束后再抽；隐藏恢复后重建（AC-3、AC-9） |
| 巨兽必需资源 | mesh + clip + 贴图 | `model.glb`；clip `Swim` 或首条；内嵌/同目录外部贴图皆必需（AC-7） |
| 兽运动 | 弧线、缩放 | AC「3D 叙事常量」 |
| 分裂与治愈 | DOM transform/opacity | GSAP，时长服从 AC-1 |
| cosmos 是否可拖 | 探索开关 | `spectacle:*` + `detail.trigger`（AC-8） |
| 覆盖层是否拦指针 | pointer-events / z-index | 非 idle 且已进入 splitting 或 portal 起：`z-[50]` + `auto`（AC-1） |
| pre-hydrate 点击 | 无 | no-op（AC-1） |
| 性能证明 | LHCI 分数 | `yarn perf:audit`；调参顺序 AC-10 |

**Key invariants**：
- 同时最多一个 `SpectacleRun`。
- 自动路径永不写 `StatusChip`。
- 博客路由零引用本 island 与 `web/spectacle/`。
- 运行时永不请求 `.blend` 或源 4K。
- `spectacle:start` 与 `end` 成对；从未 `start` 则不发 `end`。
- 特效覆盖层仅在非 `idle` 且已开始 splitting/portal 时 `pointer-events: auto`。
- unmount / hidden 全量 dispose，无泄漏定时器与 GPU。
- 无音效；无新密钥环境变量。
- pre-hydrate 点击为 no-op；自动 30s 自 hydrate 起算。
- 门户为单一 shader；兽游时长为 `U(5000,7000)`。
- WebGL 探测与 0003 同序（caveat → 普通）。

**Security model**：
- 全站公共装饰；无鉴权、无用户上传、无密钥。
- 资产遵守 Sketchfab Free Standard 与 NoAI；站上不署名（产品选择）。
- 指针层不得在 `idle` 挡住页面正常点击。

**Configuration required**：
- 无新环境变量。
- 扩展现有 `prepare-threejs-assets` / 资产检查脚本：输出并校验 `web/spectacle/pyjama-shark/` ≤ 2.5 MB。
- `three` 与 `gsap` 已存在于项目。

**Critical test scenarios**：
- 快乐路径（点击）：相位时长与文案时点符合 AC-1/AC-2，验证 **AC-1**、**AC-2**
- pre-hydrate 点击：hydrate 前点状态条无反应、不排队，验证 **AC-1**
- 自动路径：不改 `data-status-spectacle-copy`；30s 自 mount 起算，验证 **AC-3**
- 重入锁定：播放中点击与到期自动均被忽略，验证 **AC-3**
- 门户禁区与安全点：圆盘不碰外扩禁区，验证 **AC-4**
- 减弱动效 / 无 WebGL / 加载失败：无 3D；已 start 则必有 end；click 短文案无事件，验证 **AC-5**、**AC-8**
- 博客排除：无模块与 `web/spectacle/` 请求，验证 **AC-6**
- 资产门禁：>2.5 MB 失败；运行时 URL 指向约定 glb；必需资源定义可测，验证 **AC-7**
- cosmos 事件：`detail.trigger` 正确；start/end 成对，验证 **AC-8**
- 隐藏与卸载：取消 Run、文案立即 fishing、dispose、恢复后重排程不补播，验证 **AC-9**
- 性能：`yarn build` && `yarn perf:audit`，验证 **AC-10**
- 纯函数：`canStart`、`shouldAffectStatus`、锚点采样与 `r`、`sampleBeastDurationMs`，验证 **AC-3**、**AC-4**、**AC-1**

## Build plan

按 Journey：先完成点击整条路径，再自动路径，再硬化。

1. 落地运行时模型与纯函数（`canStart`、`shouldAffectStatus`、门户采样与禁区、相位毫秒表），并加 Vitest，satisfies **AC-2**、**AC-3**、**AC-4**
2. Journey 路径一（点击壳）：`data-status-spectacle-*` 绑定、文案两态、GSAP 分裂与治愈、覆盖层 `z-[50]`、island `client:idle` 与播放锁，satisfies **AC-1**、**AC-2**
3. Journey 路径一（3D）：导出 `web/spectacle/pyjama-shark/model.glb`、门户 shader、兽弧线叙事接到点击时序，satisfies **AC-1**、**AC-7**
4. Journey 路径二（自动）：+30s 后随机窗排程；Run 结束后再抽；共享 3D 段，satisfies **AC-3**
5. 硬化：成对 `spectacle:*`、隐藏/卸载 dispose、博客排除、2.5 MB 门禁、降级与 AC-10 调参顺序、perf:audit，satisfies **AC-5**、**AC-6**、**AC-7**、**AC-8**、**AC-9**、**AC-10**
6. [x] 冷启动对齐（2026-08-12）：本岛改为 `client:idle`，与 0003 AC-7 / Phase D 一致；回归测试锁定
7. [x] 交叉检查补丁：AC-3 计时自 hydrate 起算、pre-hydrate no-op、兽游 `U(5,7)`、单一门户 shader、必需资源清单、WebGL 探测对齐 0003

## Consequences

**Positive**：
- 首页多一条可传播的彩蛋叙事，且自动旁观不污染「摸鱼」身份文案。
- 与宇宙 island 边界清晰，博客保持轻量。
- 交叉检查后的常量让 `/develop` 少发明行为。
- `client:idle` 与宇宙冷启动合约一致，减少首次进入无行星。

**Negative / tradeoffs**：
- 第二 WebGL 层仍抬高复杂度；`client:idle` 使首次可点与自动 30s 门闩都略晚于旧 `client:load` 方案。
- 仅指针可点，键盘无法触发。
- 站上不署名，依赖 Standard 许可条款而非公开展示致谢。

**Neutral**：
- islands AGENTS 与资产脚本需在 `/sync` 时记上新约定。
- 弱设备档位仍可与 cosmos deferred 项一并考虑，本规格不单开弱档 UI。

## Follow-up

- [x] `/sync` 时把特效 island、`spectacle:*` detail、博客排除与 `web/spectacle/pyjama-shark/` 写入 `src/components/islands/AGENTS.md`
- [x] 冷启动：本岛改为 `client:idle`（与 0003 Phase D）；不再默认改回 `client:load` / `client:visible`
- [x] 交叉检查缺口已写入 AC-1/3/5/7 与 Value sourcing
- [ ] cosmos 源资产许可确认仍见 scope Deferred（spec 0003）；与本鲨鱼许可记录分开跟踪
