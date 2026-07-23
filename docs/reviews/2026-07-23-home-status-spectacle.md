# Review, home-status-spectacle (spec 0005), 2026-07-23

**Reviewed by**: claude-opus-4-8-thinking-high (author on Composer / Cursor)
**Scope**: 17 source files, uncommitted (working tree on master)
**Verdict**: Changes requested

## Summary

本次改动为首页新增「状态条裂隙 + 巨兽穿梭」彩蛋：独立 `client:load` 特效 island、纯函数模型、独立 WebGL 门户/鲨鱼场景、cosmos 事件协作、资产准备与预算门禁，以及 Vitest + Playwright 覆盖。整体架构清晰、与 spec 0005 的合约（相位常量、事件成对、博客排除、glb 预算）贴合度高，纯函数与门禁测试尤其扎实。但有两处应在合并前处理：其一，特效场景**完全缺失 WebGL context-loss / 渲染异常兜底**（AC-5 明列 `webglcontextlost`，且渲染循环无 try/catch），一旦 `update()` 抛错会让全屏 `pointer-events:auto` 覆盖层永久盖住页面、cosmos 永久锁死、`spectacle:end` 永不派发（破坏 AC-8 成对不变量）；其二，55 MB 鲨鱼源资产（`.blend` + 4K 贴图）落在 `public/` 下且未 gitignore，会被提交进仓库历史并随 GitHub Pages 部署。另有若干叙事保真度与热循环性能的次要问题。

## Major

### 🟠 特效场景缺少 WebGL context-loss / 渲染异常兜底，异常时锁死整页并破坏事件成对, `src/components/islands/spectacleScene.ts:191`、`src/components/islands/StatusSpectacleIsland.tsx:195`

**Problem**: `buildSpectacleScene` 创建的 `renderer` 没有注册 `webglcontextlost` 监听（对照 `CosmicStarfieldIsland.tsx:361` 本仓库既有的既定做法），而 AC-5 明确把 `webglcontextlost` 列为必须触发降级并「恰好一次 `spectacle:end`」的场景。更进一步，island 的渲染循环 `tick`（`StatusSpectacleIsland.tsx:195-200`）对 `sceneHandles.update()` 无任何 try/catch。`update()` 内每帧调用 `renderer.render()`、`mixer.update()`、`publishProbe()`；一旦上下文丢失或渲染抛错，`tick` 抛出后 `rafId = requestAnimationFrame(tick)` 那行不再执行，rAF 循环静默死亡。此时：`onBeastComplete()`（位于 `update()` 内）永不触发 → `finishToIdle()` 不跑 → `spectacle:end` 永不派发。
**Why it matters**: 生产后果严重且直接违反合约：(1) 覆盖层停留在 `pointer-events: auto`（`StatusSpectacleIsland.tsx:104-107`）的全屏 `fixed inset-0 z-[50]` 状态，整站不可点击，只能刷新恢复；(2) cosmos 收不到 `spectacle:end`，`spectacleLocked` 永为 `true`（`CosmicStarfieldIsland.tsx` 事件回合），探索永久失效；(3) 打破 AC-8「`start` 与 `end` 成对」这一 Key invariant。虽然触发前提（上下文丢失/渲染异常）在正常使用中不常见，但影响是页面级锁死，接近 Blocker。
**Suggested fix**: 在 `spectacleScene` 内为 `renderer.domElement` 注册 `webglcontextlost`（`preventDefault` + 标记失败并触发一次收尾回调），并在 island 的 `tick` 中用 try/catch 包裹 `update()`，捕获后走与降级同一路径：`disposeScene()` + 若 `startedEvent` 则 `endSpectacleEvent()` + `finishToIdle()`（click 保留短文案回退），确保任何异常都恰好补一次 `end` 并释放覆盖层与 cosmos 锁。

### 🟠 55 MB 鲨鱼源资产位于 `public/` 且未被 gitignore，会入库并随站点部署, `public/threejs-assets/pyjama-shark-free/`

**Problem**: `git check-ignore` 显示 `source/Pyjama_Shark.blend`（约 31 MB）与 `textures/4K_Pyjama_*.png`（约 24 MB）均未被忽略，且它们位于 Astro 的 `publicDir`（`public/`）下。`public/` 会被原样复制进 `dist/`，因此这些源文件会：(1) 作为未跟踪文件被提交进 git 历史（每次二进制变更永久膨胀仓库）；(2) 随 `yarn build` 打包并部署到 GitHub Pages，成为可公开下载的 55 MB 冗余体积。这与 `scripts/AGENTS.md` 既定约定「源放在 gitignored 的 `assets/threejs-source/`，只提交 `web/` 衍生物」相冲突。运行时确实只请求 `web/spectacle/pyjama-shark/model.glb`（AC-7 运行时部分满足），但 `check-cosmos-assets.mjs` 的门禁只扫描 `web/`，对该源目录毫无约束。
**Why it matters**: 永久污染仓库历史、拖慢 clone、并把大体积二进制上线部署；也违背本仓库「只入库/上线 `web/` 衍生物」的一致做法。AC-7 虽允许「源可留在 `pyjama-shark-free/`」，但未授权把它放进被服务的 `public/` 或提交进库。
**Suggested fix**: 将源包移出 `public/`（例如 `assets/spectacle-source/`）并 gitignore，`prepare-spectacle-assets.mjs` 的 `SRC_DIR` 随之指向新位置；仓库只保留 `public/threejs-assets/web/spectacle/pyjama-shark/model.glb`。若确需保留在当前位置，至少在 `.gitignore` 忽略源子目录并确认它不会进入部署产物。

## Minor

### 🟡 文案在「分裂开始」即翻为「已 dead」，与 AC-1「分裂结束时变为已 dead」不符, `src/components/islands/StatusSpectacleIsland.tsx:346`

**Problem**: `runSplit` 在碎裂动画开始前就 `copy='dead'`（注释亦写「分裂后立刻」），而 AC-1 规定「文案在分裂结束时变为『已 dead』」（碎裂 1.2s 之后）。
**Why it matters**: 属可测的叙事时点合约偏差；功能上文案仍在彩蛋期间显示 dead，e2e 只断言 3s 内变 dead 故未捕获，但与 spec 约定的时序不一致。
**Suggested fix**: 把 `copy='dead'` 的赋值移到碎裂 timeline 的 `onComplete` 之后，或用 `PHASE_MS.splitting` 延时对齐分裂结束。

### 🟡 「治愈」相位在视觉上是空转，AC-1 的慢速愈合不可见, `src/components/islands/StatusSpectacleIsland.tsx:263`

**Problem**: `runSplit` 结尾已 `for (shard) shard.remove()` 并恢复 `hit.style.visibility=''`，碎片在门户/巨兽段之前就被清除、原行瞬间复位。随后 `healSplit` 因 `splitClones.length===0` 直接走 `else` 分支——`await setTimeout(healing 1500)` 纯等待，无任何重组动画（注释也承认「brief beat then fade copy back」）。
**Why it matters**: AC-1 的「分裂慢速治愈」是可见叙事相位，这里退化为 1.5s 无画面停顿，观感与合约不符（时长预算仍守）。
**Suggested fix**: 保留碎片到 healing 相位再做反向补间（或复制一份用于愈合），让 `healSplit` 走有动画的 `if` 分支；否则更新 spec/注释明确取消可见愈合这一决策。

### 🟡 生产热循环每帧发布 `__spectacleProbe` 调试钩子并做投影/分配, `src/components/islands/spectacleScene.ts:349`、`:663`

**Problem**: `publishProbe()` 在 `update()` 中每帧调用，内部 `new THREE.Vector3()`、`getWorldPosition`、`project(camera)`、`clone()` 等，并把一个新闭包挂到 `window.__spectacleProbe`。这是为 Playwright 探测保留的调试钩子，未按环境门控，随生产构建常驻。
**Why it matters**: 双 WebGL 首页对 AC-10 性能敏感；每帧的投影运算与对象分配是纯调试开销，同时向生产暴露内部状态全局变量。
**Suggested fix**: 用 `import.meta.env.DEV`（或显式测试标志）包裹 `publishProbe` 的发布与每帧调用，仅在开发/E2E 下启用；生产热循环内不做与渲染无关的投影与分配。

### 🟡 `forceCancel` 未清理 `healSplit` 的在途 `setTimeout`，产生陈旧后续空转, `src/components/islands/StatusSpectacleIsland.tsx:281`

**Problem**: `healSplit` 的 `else` 分支用未跟踪的 `setTimeout(healing)`。若愈合期间 `document.hidden` 触发 `forceCancel`，该定时器不会被清除，稍后仍会 resolve 并继续执行 `hit.visibility=''` → `runCopyFadeBack()` → `finishToIdle()`（在隐藏态下 `scheduleAuto` 会早退）。
**Why it matters**: 无用户可见危害，但属于「隐藏/卸载应立即停止所有定时器」（AC-9）的边角遗漏，留下陈旧续跑与重复 dispose。
**Suggested fix**: 将该 `setTimeout` 存入变量并在 `forceCancel`/cleanup 中清理，或在续跑处加 `if (cancelled || document.hidden) return`。

### 🟡 「0.8s 淡回」实为定时后的瞬时 textContent 切换，非透明度淡入, `src/components/islands/StatusSpectacleIsland.tsx:186`

**Problem**: `runCopyFadeBack` 等待 `PHASE_MS.copyFadeBack`(800ms) 后直接 `setCopy(...,'fishing')` 瞬间替换文本，没有任何 opacity 过渡。AC-1 用词为「花 0.8s 淡回」。
**Why it matters**: 叙事保真度偏差；观众看到的是延迟 0.8s 后文字突变，而非淡入。
**Suggested fix**: 对 `copyNode` 做一次 0.8s 的 opacity 补间（GSAP/CSS transition）再切换，或调整 spec 用词。

### 🟡 被测的 3D 叙事常量未被场景使用，测试给出虚假信心, `tests/home-status-spectacle.test.ts:146`、`src/components/islands/spectacleModel.ts:174`

**Problem**: `beastBodyLength`(1.8*2r) 与 `beastArcLength`(0.4vw) 有单测，但 `spectacleScene.ts` 实际用的是自有常量 `BEAST_IN_HOLE=1.7`（体长）与 `edgeX = swimDir*viewSpan*0.92`（弧长），并未引用这两个模型函数。
**Why it matters**: 测试断言的是渲染层忽略的常量，对「3D 叙事常量」这条 spec 项形成误导性覆盖。
**Suggested fix**: 让场景真正消费这些模型常量（把体长/弧长映射改为调用它们），或明确这些函数仅为契约文档并在测试中标注，避免误读为渲染保证。

## Nits

- ⚪ `src/components/islands/spectacleScene.ts:529`, `update()` 单函数近 130 行且密布魔数（`0.92`、`-0.55`、`1.7` 等），后续维护成本高；可抽出相位子函数与命名常量。
- ⚪ `src/components/islands/StatusSpectacleIsland.tsx:303`, 碎裂时对整个 hit 子树（含头像 `animate-ping` 图形）克隆 `cols*rows`(约 27) 份并挂到 body，短暂但有一次性开销；可克隆精简后的静态副本。
- ⚪ `src/components/islands/StatusSpectacleIsland.tsx:36`, `readRects` 依赖 `document.querySelector('header')` 命中顶栏禁区；若 `HomeHeader` 标签从 `<header>` 改动，AC-4 禁区会静默丢失导航项而无告警。
- ⚪ `src/components/islands/spectacleScene.ts:4`, 文件顶部保留了 Playwright 调参过程注释（2026-07-23 late …），属过程记录，建议精简为决策结论。

## Strengths

- 纯函数模型（`canStart`/`shouldAffectStatus`/`samplePortalAnchor`/相位毫秒表）职责清晰、可测性强，`tests/home-status-spectacle.test.ts` 对 AC-2/3/4 的边界（重试→安全点→缩 r）覆盖到位。
- 事件成对与降级路径设计考究：`startedEvent` 门控 + `endSpectacleEvent` 幂等，click 3D 失败后仍愈合并回写文案，auto 静默取消，符合 AC-5/AC-8 主干；`beginPortalBeast` 在异步前先锁 `phase='portal'` 防重入。
- 资产门禁扩展干净：`check-cosmos-assets.mjs` 把 spectacle 目录独立计入 2.5 MB 硬顶并保留对源类文件的封禁，`prepare-*` 脚本把 cosmos 与 spectacle 预算解耦，运行 glb 实测约 1.1 MB 达标。
- 博客排除（AC-6）在 e2e 中以「请求级」断言（无 `web/spectacle`/`pyjama-shark`/island 请求）验证，比仅查源码更可信。

## Test coverage

测试信号为 configured，覆盖较全：AC-1/2 文案与时序、AC-3 锁与窗口、AC-4 采样几何、AC-5 减弱动效短文案无事件、AC-6 博客零请求、AC-7 预算与运行 URL、AC-8 事件成对与 `detail.trigger`、AC-9 隐藏回退，均有对应断言，且含针对「时长预算」与「start 等待 ready」的回归守卫。主要未覆盖的新逻辑：(1) **WebGL context-loss / 渲染异常路径完全无测试**（对应上文 Major，`update()` 抛错后的收尾与解锁无任何验证）；(2) `spectacleScene.ts` 的相位插值/切换几乎全靠 e2e 目视与 `__spectacleProbe`，无单元级断言；(3) 被测的 `beastBodyLength`/`beastArcLength` 与实际渲染脱节（见 Minor）。AC-10 依赖 `yarn build && yarn perf:audit`，本次未在评审内运行，建议合并前确认双 island 下 performance ≥ 0.85、LCP ≤ 2500ms 仍达标。
