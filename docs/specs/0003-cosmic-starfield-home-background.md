# 0003. 首页宇宙星空 / 动态太阳系背景

**Date**: 2026-07-21（2026-07-21 UX 增补；2026-07-21 太阳系增强；2026-08-02 首屏加载路径；2026-08-12 冷启动带宽优先）
**Status**: Accepted

## Summary

首页用 Three.js 交付可探索的宇宙背景：以本地优化后的 `HDR_blue_nebulae_3` 为环境天空，中央程序化太阳驱动八大行星按视觉化开普勒模型自动公转与自转。页面滚动按成长叙事切换相机焦点（Hero 水星+金星 → 关于地球 → 技能火星+木星 → 作品土星 → 联系天王星+海王星）。减弱动效、WebGL 失败或弱环境时回退到 CSS / HDR poster，不保留损坏 GPU 场景。博客路由永不加载该 3D island。构建仍守现有首页 Lighthouse 门槛。

## Context

> ⚠️ 前提说明：整页 WebGL 背景即便好看，也可能拖累 LCP、耗电、伤低端机。本功能接受该风险，前提是 scope 已要求明确的非 WebGL 回退、仅挂首页、以及现有 Lighthouse 下限为硬门槛。原始 HDR（约 86MB、10000×5000）与 8K 行星贴图合计约 140MB、GPU 可达 GB 级，**禁止原样进入运行时**；页面只请求 `public/threejs-assets/web/` 下的衍生图。若中端笔记本上门槛失败，须再降衍生分辨率、像素比或效果，或只发回退，不得放宽门槛。

v1（已落地）将 `ParticleIsland` 替换为 `CosmicStarfieldIsland`：程序化 Points 星场、空白 chrome 拖拽/缩放、CSS 回退、Ctrl/Cmd+滚轮缩放、首页隐藏滚动条。UAT 后产品目标升级为「随时间逻辑运动的太阳系」：访客在阅读作品集时看到有结构的天体系统，而非纯抽象星点。

相关约束：Astro 静态页 + React islands；重库必须在 island 内动态 `import()`；首页还有 `HomeMotion`、`StatusSpectacleIsland`、`GameIsland`、`MouseTrailIsland`（冷启动后除宇宙外默认 `client:idle`）；区段锚点已存在（`#home` `#about` `#skill` `#work` `#contact`）；islands AGENTS.md 目标为 Lighthouse performance ≥ 0.85、LCP ≤ 2500ms。GitHub Pages 冷带宽极紧：对 HDR 或 `sun.jpg` 做 HTML `prefetch`，或让多个 `client:load` 岛与 `three.js` 并行抢包，都会导致首次进入长时间只见 poster、刷新后才有行星。

若不做决定：要么停留在抽象星场无法承载行星叙事，要么原样加载 8K/HDR 直接撞穿 AC-7，要么在无书面合约下发明轨道模型与区段映射。

## Requirements

**用户故事**：
- 作为首页访客，我希望背景是可感知的太阳系（太阳 + 八大行星），且随时间自动运动，第一印象沉浸但不挡阅读。
- 作为首页访客，我希望向下滚动时背景焦点随区段叙事变化，同时仍可在空白 chrome 上拖拽与缩放探索。
- 作为开启减弱动效或弱设备的访客，我希望有非 WebGL 的深空 poster / CSS 回退，页面仍完整可用。
- 作为博客读者，我希望博客路由不加载 3D island 与行星资产，文章页保持轻量。

**验收标准**（合约；每条有 ID，可独立检查）：

- **AC-1（场景）**：首页在允许 WebGL 时，背景为优化后的蓝星云 HDR equirectangular（源：`HDR_blue_nebulae_3.hdr`，经 `HDRLoader`，`EquirectangularReflectionMapping`），中央有程序化太阳（发光球 + `PointLight`）。八大行星按水星→金星→地球→火星→木星→土星→天王星→海王星顺序，使用对应本地衍生贴图：
  - 地球：日图 + 夜图（暗面城市灯）+ 独立云层球
  - 金星：表面 + 半透明大气球
  - 土星：表面 + `RingGeometry` 环（alpha 贴图）
  - 其余：对应表面贴图
  - Astro 回退兄弟始终在初始 HTML（`data-cosmos-fallback`，经 `HomeLayout` 的 `background` slot，**在 `z-10` 正文外**），优先使用 HDR poster；仅在成功 init 后 WebGL 淡入。`ParticleIsland` 保持已删除。
- **AC-2（交互）**：相机默认观察整个压缩太阳系。空白 chrome 按住拖拽解锁环绕；**桌面缩放**：`Ctrl`/`Cmd` + 滚轮；**触控**：双指捏合；普通滚轮不拦截（页滚优先）。pitch 限制 ±30°（或规格实现时标定的等价夹角）。缩放夹在实现常量区间内。松开后 yaw 衰减半衰期约 `120ms`。触控默认垂直页滚；约 `8px` 水平主导后才探索；`touch-action: pan-y`。
- **AC-3**：探索不粘滞。松开或 pointer cancel 结束拖拽；公转继续；页滚、导航、CTA 无需 Exit/Esc。
- **AC-4**：命中测试同前：`elementFromPoint` 为 cosmos canvas / fallback / `[data-cosmos-hit]` 祖先，且不匹配交互选择器与 `[data-no-cosmos]`。GameIsland 标 `data-no-cosmos`。层叠：`background` `z-0`；正文 `z-10`；header `z-40`；MouseTrail `z-[9999]`；GameIsland 不变。
- **AC-5**：`prefers-reduced-motion: reduce`、WebGL 失败、或 `webglcontextlost` → 拆除 renderer，静默留 fallback/poster，无 toast。WebGL 探测先试 `failIfMajorPerformanceCaveat: true`，失败再试普通 `webgl` / `webgl2`，避免 caveat GPU 静默永远停在 poster。单颗行星贴图失败时该行星用近似纯色材质，不拖垮全场景。
  - **骨架就绪（可测）**：`WebGLRenderer` 已创建；太阳 mesh 与八颗行星 mesh（可用 fallback 纯色）已挂进 scene graph；cosmos host canvas 已淡入（opacity > 0）；`data-cosmos-fallback` 的 opacity 已收为 0。**不要求** `sun.jpg`、行星 albedo 或 HDR 加载完成。骨架就绪后贴图/HDR 失败不得把页面打回永久 poster。
- **AC-6**：博客列表、文章及其他非首页不 import / hydrate 太阳系 island，不请求 `threejs-assets/web/` 行星或 HDR 衍生资源。
- **AC-7**：`yarn build` 后首页 `yarn perf:audit` 仍须 performance ≥ 0.85、LCP ≤ 2500ms。失败则降衍生分辨率、像素比、移动端档位或效果；不得放宽门槛。运行时请求的衍生贴图合计建议硬顶约 **4–8 MB**；禁止请求原始 8K/10K 与源 HDR。首屏关键路径：
  - HTML 预取**白名单**（仅此）：`index.astro` **preload** `hdr_blue_nebulae_poster.webp`（`as="image"`，`fetchpriority="high"`）。**不得**对 `sun.jpg`、`hdr_blue_nebulae.hdr`、行星 albedo 或其它 `threejs-assets/web/` 路径做 HTML `preload` / `prefetch`；一律由场景代码在骨架后请求。
  - 首页 hydrate：**仅** `CosmicStarfieldIsland` 用 `client:load`，且在 `index.astro` 里排在其它首页 island 之前，让模块级 `import('three')` 先占冷带宽。`HomeMotion`、`StatusSpectacleIsland`、`GameIsland`、`MouseTrailIsland` 用 `client:idle`（允许 Astro idle 超时参数，如 `client:idle="react"`）。`ContactIsland` 等轻岛可用 `client:visible`；禁止再增加与 three/Phaser 抢冷带宽的 `client:load` 重岛。`GameIsland` 仍只提前「启动忍者」按钮，**Phaser 仍点击后**动态加载；允许 pointerenter/focus 预热，禁止模块加载时预取、禁止 HTML prefetch。`StatusSpectacleIsland` 仅在 Run 开始时才 `import('three')` / 拉 glTF，不得在 idle hydrate 时抢包。`HomeMotion` 在 GSAP 就绪前不得把已在视口内的 `.reveal-up` 先藏成透明。
  - **淡入门闩**：与 AC-5「骨架就绪」相同。`sun.jpg`、行星 albedo、HDR 一律在门闩之后并行请求；任一项失败只降级该资源（纯色 / 无 HDR），不撤销淡入、不恢复永久 poster。
  - **骨架就绪后才允许启动衍生 HDR 的 `loadAsync`**；不得在模块级 `import('three')` 未完成时抢跑 HDR，也不得用 HTML 提前拉 HDR。LCP 锚定 preload 的 poster。
- **AC-8**：首页隐藏原生垂直滚动条，滚动能力保留；博客保持默认滚动条。
- **AC-9（轨道与时间）**：视觉化开普勒模型——真实轨道顺序、偏心率、倾角、自转方向/周期为来源；距离、行星尺寸、公转周期做单调压缩，使八颗可见且外行星仍有可感知运动。进入页面后自动加速运行，无控制面板；`visibilityState === hidden` 时暂停。不宣称实时天文位置或真实比例。压缩函数与时间倍率集中在 `solarSystemModel.ts`。
- **AC-10（滚动叙事）**：`IntersectionObserver` 监听 `#home` `#about` `#skill` `#work` `#contact`。焦点映射（成长叙事）：
  - `#home` → 水星 + 金星
  - `#about` → 地球
  - `#skill` → 火星 + 木星
  - `#work` → 土星
  - `#contact` → 天王星 + 海王星
  滚动只平滑改变相机 target、distance 与重点行星视觉权重；所有行星始终继续公转。用户拖拽为相机偏移，不停止公转。

## Options considered

### Option A: 在现有 CosmicStarfieldIsland 上升级为太阳系（选定）

保留 island 门控、命中测试、回退与交互；场景内容从 Points 换为 HDR + 太阳 + 八行星；轨道数学与场景构建拆模块。

**Pros**：复用已验证的交互与 AC-3…AC-8；Tracer Bullet 增量。  
**Cons**：须修订 AC-1；资产管线与性能工作量大。

### Option B: 新开独立 SolarSystemIsland

**Pros**：与星场解耦。  
**Cons**：重复门控与层叠；首页双背景风险。

### Option C: 原样加载 8K/HDR，不做衍生

**Pros**：实现快。  
**Cons**：约 140MB 下载、GB 级 GPU，无法满足 AC-7。否决。

### Option D: 真实历书实时位置

**Pros**：天文准确。  
**Cons**：产品要的是可读叙事与自动加速观感，非观测工具。否决。

### Option E: 纯圆轨道艺术编排

**Pros**：实现最简。  
**Cons**：用户明确要求「按逻辑」运动；开普勒压缩更诚实。否决为默认。

### Option F: 冷启动带宽优先（2026-08-12 选定，修订 Phase C）

仅宇宙岛 `client:load` 且最先挂载；去掉 `sun.jpg` HTML prefetch；motion / spectacle / game 改为 `client:idle`；WebGL caveat 探测降级；HomeMotion 不先藏起已可见文案。

**Pros**：修复 GitHub Pages 首次进入无行星、无动效；three 冷包不再被 sun / Phaser / GSAP 饿死。  
**Cons**：忍者按钮与状态彩蛋首次可点略晚于 Phase C 的并行 `client:load`；太阳贴图不再 HTML 预热，改由场景代码拉取。

### Option G: 维持 Phase C 并行 `client:load` + sun prefetch

**Pros**：与 2026-08-02 合约字面一致。  
**Cons**：生产冷启动实测首次进站长时间停在 poster。否决。

## Decision

**Chosen option**: Option A + 视觉化开普勒 + 自动加速 + 成长叙事区段焦点 + 网页衍生资产 + Option F 冷启动带宽优先

1. **引擎**：继续 `three@^0.185`，动态 `import('three')` 与 `three/addons/loaders/HDRLoader.js`（r180+；勿用已弃用 `RGBELoader` 主路径）。
2. **背景**：优化后的 `HDR_blue_nebulae_3`；SSR/回退用 poster。
3. **天体**：程序化太阳；八大行星及地球夜/云、金星大气、土星环，全部来自 `public/threejs-assets/web/`。
4. **运动**：开普勒方程 + 单调压缩；自动加速；无 UI 面板。
5. **叙事**：AC-10 区段映射。
6. **资产管线**：`scripts/prepare-threejs-assets.mjs` 从源目录生成衍生文件并校验预算；源文件可保留但禁止运行时请求；`.blend` 与第二份 HDR（`HDR_multi_nebulae_1`）不进发布路径。
7. **首屏加载路径（2026-08-02；2026-08-12 冷启动修订）**：
   - **仅** `CosmicStarfieldIsland` 使用 `client:load`，并在 `index.astro` 中先于其它首页 island 声明。
   - `HomeMotion`、`StatusSpectacleIsland`、`GameIsland`、`MouseTrailIsland` 使用 `client:idle`。Phaser 仍点击后加载；允许 pointerenter/focus 预热，禁止模块加载时预取与 HTML 抢包。Spectacle 仅在 Run 开始时拉 three/glTF。
   - `index.astro` HTML 预取白名单：仅 preload `hdr_blue_nebulae_poster.webp`；**禁止** prefetch `sun.jpg` 与其余 `threejs-assets/web/`。
   - HDR（`hdr_blue_nebulae.hdr`）：仅在 renderer 已创建、太阳（及 fallback 色行星）已挂上 scene graph 之后，由 `solarSystemScene` 异步 `loadAsync`；不得与模块级 `import('three')` 抢首包。
   - Status spectacle 的 glTF 等大资源：不得 HTML 首屏 prefetch，且不得阻塞 cosmos 骨架淡入。
   - 场景仍先以纯色/太阳骨架淡入，贴图与 HDR 异步补齐；骨架就绪后隐藏 poster。
   - WebGL 探测：caveat 优先，失败则普通 WebGL（AC-5）。
   - `HomeMotion`：视口内 `.reveal-up` 保持可见，直至 GSAP/ScrollTrigger 就绪（AC-7）。
8. **范围外**：行星点击详情、标签、音效、博客宇宙背景、实时历书。

**Implementation skills**: `astro` · `threejs-fundamentals` · `threejs-animation` · `threejs-interaction`（interaction 仍为建议性）· `threejs-textures` / `threejs-loaders`（若已安装则遵循）

## Rationale

产品要从「氛围星点」升级到「有时间逻辑的太阳系」，才能匹配用户对八大行星贴图与「随时间移动」的意图。抽象 Points 无法承载该叙事；真实历书过重且非目标。

视觉化开普勒保留「内快外慢、倾角、椭圆」的可读逻辑，又通过压缩尺度保证构图。自动加速无需面板，符合装饰背景定位。区段焦点把长页阅读与天体叙事绑在一起，而不把滚动直接驱动物理时间（避免阅读停顿时宇宙冻结）。

衍生资产是 AC-7 的前提：原样 HDR/8K 与 Lighthouse 合约不可同时成立。交互与回退沿用 v1 已验证合约（Ctrl/Cmd 滚轮、层叠、减弱动效），降低回归面。

**2026-07-21 UX 增补（v1）**：层叠 slot、圆形星点、Ctrl/Cmd+滚轮、隐藏滚动条。  
**2026-07-21 太阳系增强**：HDR 环境、八行星、开普勒压缩、自动加速、区段叙事、衍生资产硬顶。  
**2026-08-02 首屏加载路径**：生产站实测 `client:visible` 使 `three.js` 排队到约 5s 后才开始下载，叠加 HDR 早期 prefetch 争用带宽；改为宇宙岛 `client:load` 并取消 HDR prefetch（当时仍保留 poster/sun），行星骨架更早可用。  
**2026-08-12 冷启动带宽优先**：冷缓存下 sun prefetch 与多个 `client:load` 岛（motion / spectacle / game）仍饿死 `three.js`，首次进入无行星；Option F 把 HTML hint 收成仅 poster，并把非宇宙岛改为 `client:idle`，让 three 独占冷启动关键路径。

## Feature design

**Data model sketch**：
- 无持久实体。运行时：模拟时间 `t`、八行星轨道根数与压缩后状态、相机（yaw/pitch/distance + section target）、探索拖拽状态、能力标志、已加载贴图句柄。

**State transitions**：
- `fallback` → 减弱动效 / WebGL 失败 / context lost（终端态，无自动重试 UI）。
- `loading` → WebGL ok，正在建 renderer 与 fallback 色太阳/行星 mesh；仍可显示 poster。
- `running` → **骨架就绪**（AC-5）：canvas 已淡入，poster（`data-cosmos-fallback`）已隐藏；自动推进 `t`；公转+自转。`sun.jpg` / albedo / HDR 可在 `running` 中并行补齐，完成与否不改变本态。
- `explore` → `running` 上叠加指针拖拽相机偏移；松开回到仅 `running`。

**Section focus map**（AC-10）：

| 区段 | DOM id | 突出天体 |
|---|---|---|
| Hero | `#home` | 水星、金星 |
| 关于 | `#about` | 地球 |
| 技能 | `#skill` | 火星、木星 |
| 作品 | `#work` | 土星 |
| 联系 | `#contact` | 天王星、海王星 |

**Asset budget（发布）**：

v1 落地为**单档衍生**（桌面与移动共用同一 `web/` 集；运行时 `tier` 只调球体分段，不换贴图 URL）。目标合计仍 ≤ 4–8 MB。

| 用途 | 衍生规格 | 备注 |
|---|---|---|
| HDR 环境 | 1024×512 `.hdr` | 源 10000×5000 禁止请求 |
| HDR poster | ~2K WebP | SSR / 回退 |
| 太阳 / 八行星表面等 | 1024（月球 512） | `SRGBColorSpace` |
| 土星环 | 1024×64 | alpha |
| 合计下载 | 硬顶 8 MB（`check-cosmos-assets` + prepare 双闸） | 源 8K/HDR 仅本地，不进 git |

**API surface**：
| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Astro fallback + poster | 始终在 `index.astro`；HTML 仅 preload poster（AC-7） | `hdr_blue_nebulae_poster.webp` | 首屏深空（LCP 锚） | public | 无 |
| `CosmicStarfieldIsland` | `client:load`，仅首页，声明顺序最先 | 无必填 | WebGL 太阳系或留回退 | public | init/context lost → 回退 |
| `GameIsland` | `client:idle` 启动按钮；Phaser 点击后 | 无必填 | 忍者小游戏 | public | 超时可重试 |
| `HomeMotion` / `StatusSpectacleIsland` | `client:idle` | 无必填 | 滚动显隐 / 状态彩蛋 | public | 见 0005 |
| `solarSystemModel.ts` | 纯函数 | `t`、行星根数 | 位置/姿态 | n/a | 无 |
| `solarSystemScene.ts` | 构建/释放；贴图并行；HDR 在太阳 mesh 挂上后异步 | THREE、BASE_URL、档位 | scene graph + dispose | public | 单贴图失败 → 纯色；HDR 失败 → 颜色回退 |
| `prepare-threejs-assets.mjs` | CLI | 源目录 | `web/` 衍生 + 预算报告 | n/a | 超预算 exit ≠ 0 |
| 指针命中 / 缩放 | 同 v1 | AC-2/AC-4 | 允许或忽略 | public | 忽略交互区 |

**Value sourcing**：
| Action | Value | Source |
|---|---|---|
| 环境天空 | 运行时 `hdr_blue_nebulae.hdr`（源自 `HDR_blue_nebulae_3`） | 骨架就绪后 `solarSystemScene` `loadAsync`（AC-1、AC-7）；禁止 HTML prefetch |
| 首屏 / 回退 | `hdr_blue_nebulae_poster.webp` | `index.astro` preload（AC-1/AC-5/AC-7）；LCP 锚；骨架就绪后隐藏 |
| 太阳贴图 | `sun.jpg` | 骨架就绪后门闩后场景代码并行请求（AC-7）；**禁止** HTML prefetch；失败 → 太阳留 fallback 色 |
| 八行星外观 | 衍生 albedo 等 | 同太阳：门闩后并行；单张失败 → 该行星纯色（AC-1/AC-5/AC-7） |
| 轨道位置 | 压缩开普勒 | `solarSystemModel.ts`（AC-9） |
| 区段焦点 | 相机 target 权重 | IntersectionObserver + AC-10 表 |
| 时间推进 | 自动加速 `t` | rAF delta，隐藏暂停（AC-9） |
| 缩放 / 页滚 | 同 v1 | AC-2/AC-8 |
| 性能证明 | LHCI 分数 | `yarn perf:audit`（AC-7） |

**Key invariants**：
- 首页背景唯一所有者：cosmos island + Astro fallback；无 `ParticleIsland`。
- 运行时永不请求源 8K/10K/原始大 HDR/`.blend`。
- 回退始终 SSR 首屏；WebGL 仅成功后淡入。
- 宇宙岛为首页唯一 `client:load` 的重岛，且声明最先；`HomeMotion` / spectacle / GameIsland 为 `client:idle`。Phaser / spectacle glTF 不走 HTML 首屏 prefetch，且不阻塞 cosmos 骨架淡入。
- HTML 对 `threejs-assets/web/` 的 preload/prefetch **仅限** poster；禁止 `sun.jpg` 与 HDR 的 HTML hint。
- HDR `loadAsync` 仅在 renderer 已建且太阳（及 fallback 色行星）已入图之后。
- WebGL caveat 探测失败时仍尝试普通 WebGL；骨架就绪后隐藏 poster。
- 博客不加载太阳系模块与衍生资产。
- 装饰 canvas `aria-hidden="true"`。
- 探索不粘滞；公转不依赖拖拽。
- Lighthouse 门槛不可放宽；LCP 元素意图为 preload 的 poster。

**Security model**：
- 公共装饰 UI；无鉴权、无密钥、无用户内容入场景。
- 无新环境变量；贴图仅本地 `BASE_URL` + `threejs-assets/web/`。
- 实施前确认源资产许可；需要时在站点或 README 补署名。

**Configuration required**：
- `three@^0.185`（已有）。
- `yarn` 脚本如 `assets:cosmos` 运行准备脚本。
- v1 仍无功能开关环境变量；档位由宽度 / 能力启发式在代码内选择。

**Critical test scenarios**：
- 快乐路径：HDR + 太阳 + 八行星可见，自动公转自转，拖拽/Ctrl+滚轮探索，验证 **AC-1**、**AC-2**、**AC-3**、**AC-9**
- 区段叙事：滚过五区段焦点按表切换且公转不停，验证 **AC-10**
- 页滚与滚动条：普通滚轮滚页；首页无原生滚动条，验证 **AC-2**、**AC-8**
- 减弱动效 / WebGL 失败：仅 poster/fallback，验证 **AC-5**
- 单贴图失败：该行星纯色，场景仍跑，验证 **AC-5**
- 博客排除：无 island / 无 web 资产请求，验证 **AC-6**
- 资产预算：准备脚本拒绝超预算；构建产物不含源 8K 路径请求，验证 **AC-7**
- 首屏加载路径（静态）：源码/构建 HTML 仅 preload poster；无 `sun.jpg` / HDR / 其它 `threejs-assets/web/` 的 HTML preload/prefetch；宇宙岛为 `client:load` 且声明最先；HomeMotion / StatusSpectacle / GameIsland 为 `client:idle`，验证 **AC-7**
- 首屏烟雾（E2E）：canvas 与「启动忍者」按钮可出现（不设未定义的时延合约），验证 **AC-7** 烟雾面
- 冷启动观感：无缓存首次进入达到 AC-5「骨架就绪」判据（非永久 poster），验证 **AC-5**、**AC-7**
- 性能：`yarn build` && `yarn perf:audit`，验证 **AC-7**
- 轨道模型单测：顺序、近日远日、周期排序、有限位置、section 映射，验证 **AC-9**、**AC-10**

## Build plan

### Phase A — v1 星场壳（已完成）

1. [x] 添加 `three`、fallback、island 壳、删除 `ParticleIsland`、GameIsland `data-no-cosmos`
2. [x] 能力门控、visibility、resize、淡入
3. [x] 程序化 Points 星场与空闲漂移（将被 Phase B 场景替换）
4. [x] 探索命中测试与缩放
5. [x] 单测与博客排除、islands AGENTS
6. [x] `yarn build` + `yarn perf:audit`
7. [x] UX：层叠 slot、圆形星点、Ctrl/Cmd+滚轮、隐藏滚动条

### Phase B — 太阳系增强（已完成）

8. [x] 修订本规格（本文件）并同步 scope Done when / Build it 子项。满足决策记录
9. [x] `scripts/prepare-threejs-assets.mjs` + `web/` 衍生（HDR、poster、行星、环）；预算校验；`package.json` 脚本。满足 **AC-1**、**AC-7**
10. [x] `solarSystemModel.ts`：开普勒 + 压缩 + section 映射；单测。满足 **AC-9**、**AC-10**
11. [x] `solarSystemScene.ts`：HDRLoader、太阳、八行星材质/环/云/大气、完整 dispose。满足 **AC-1**、**AC-5**
12. [x] 重构 `CosmicStarfieldIsland`：接入场景与自动时间；IntersectionObserver 焦点；保留交互/回退；`index.astro` poster。满足 **AC-1**–**AC-5**、**AC-9**、**AC-10**
13. [x] 扩展 island 测试与资产路径断言；博客不拉衍生资源。满足 **AC-6**、**AC-7**
14. [x] `yarn build`、`yarn test`、`yarn perf:audit`；必要时降档。满足 **AC-7**、**AC-8**

### Phase C — 首屏加载路径（已完成；合约已被 Phase D 修订）

15. [x] `index.astro`：宇宙岛改为 `client:load`；去掉 HDR 早期 prefetch；当时仍保留 poster preload 与 sun prefetch、GameIsland `client:load`；Vitest + Playwright 锁定。满足当时 **AC-7**
16. [x] 将 `startHdrLoad` 挪到太阳（及 fallback 色行星）入图之后，以符合 AC-7 骨架就绪定义

### Phase D — 冷启动带宽优先（已完成）

17. [x] 去掉 `sun.jpg` HTML prefetch；仅宇宙 `client:load` 且最先声明；HomeMotion / StatusSpectacle / GameIsland / MouseTrail → `client:idle`；HomeMotion 不先藏已可见文案；WebGL caveat 降级与 poster 隐藏；测试锁定。满足修订后 **AC-5**、**AC-7**
18. [x] 交叉检查补丁：骨架可测定义、淡入门闩与贴图异步、状态机 `loading`/`running` 与 AC-5 对齐

## Consequences

**Positive**：
- 首页获得可叙事、可感知时间的太阳系背景。
- 区段焦点增强长页阅读节奏。
- 衍生资产路径让 AC-7 仍有机会成立。
- 复用 v1 交互与回退，降低回归。
- 冷启动首次进入即可看到行星骨架，不再依赖二次刷新。

**Negative / tradeoffs**：
- 实现与维护明显重于抽象星场。
- 中端机预算紧；可能需移动端更激进降档。
- 视觉开普勒非真实比例，需接受「示意」而非「天文模拟」。
- 忍者按钮与状态彩蛋首次 hydrate 略晚于 Phase C 并行 load 方案。

**Neutral**：
- MouseTrail、GameIsland、Phaser 职责不变；GameIsland 启动按钮为 `client:idle`，Phaser 仍点击后加载。
- 源大文件可留在仓库作素材，但部署与运行时只认 `web/`。
- 宇宙岛独占首屏 `client:load` 带宽；LCP 仍锚定 preload 的 poster。

## Follow-up

- [x] `/develop` Phase B 按 Build plan 8–14 执行
- [x] Phase C 首屏加载路径（Build plan 15）已落地并有回归测试
- [x] `/sync` 已把太阳系加载约定写入 islands AGENTS.md
- [x] Build plan 16：HDR kickoff 顺序与「骨架就绪」对齐
- [x] Phase D 冷启动带宽优先已落地；规格与 islands AGENTS 已对齐
- [ ] 确认 `threejs-assets` 源文件许可与署名
- [ ] 博客壳层宇宙背景仍延后（scope Deferred）
- [ ] 可选：deviceMemory / hardwareConcurrency 启发式强化 AC-5 档位

## Migration plan

**Strategy**：在现有首页 island 上 strangler 式替换场景内容（Points → 太阳系）；资产经衍生目录并行存在。Phase D 为已上线加载路径修订，无数据迁移。  
**Phases**：
1. 规格与资产管线落地（无运行时大文件）
2. 模型 + 场景模块 + island 接线
3. 测试与 perf 门槛绿灯后再合并
4. Phase D：修订 hydrate / HTML hint，部署后用无痕冷启动验收  
**Rollback**：回退对应提交即可；无数据迁移。  
**Risks**：性能回归；滚动焦点与 Lenis/锚点冲突；贴图许可；误把源 8K 打进请求；误把 sun prefetch 或额外 `client:load` 加回导致冷启动回退。
