# Review, home-status-spectacle (spec 0005) r2, 2026-07-23

**Reviewed by**: cursor-grok-4.5-high-fast (author on Composer / Cursor)
**Scope**: 17 files, uncommitted (working tree on master)
**Verdict**: Approve with nits

## Summary

这是对 r1（`docs/reviews/2026-07-23-home-status-spectacle.md`）的复审。r1 的两处 Major 均已落地且有文件级证据：`spectacleScene` 注册 `webglcontextlost` 并经 `onFatalError` 解锁；island `tick` 对 `update()` 有 try/catch 并走 `forceCancel`；鲨鱼源已迁至 gitignored 的 `assets/spectacle-source/`，`public/` 下无 `pyjama-shark-free`，运行时仅 `web/spectacle/pyjama-shark/model.glb`（约 1.1 MB）。愈合等待定时器也已纳入 `healWaitTimer`/`clearHealWait`。剩余问题多为叙事保真度与生产热循环探测开销，不阻塞合并。

## Prior Majors — resolved

### ✅ WebGL context-loss / 渲染异常兜底

- `spectacleScene.ts:214-218`：`webglcontextlost` + `preventDefault` → `notifyFatal`
- `spectacleScene.ts:209-213`：`fatalNotified` 幂等；`spectacleScene.ts:29-30`：`onFatalError` 合约
- `StatusSpectacleIsland.tsx:258-262`：`onFatalError` → `forceCancel` + `scheduleAuto`
- `StatusSpectacleIsland.tsx:204-216`：`tick` try/catch → `forceCancel`（覆盖层释放、成对 `end`、cosmos 解锁）
- 回归：`tests/home-status-spectacle.test.ts:228-243` 源码级断言 listener / try-catch / `forceCancel`

### ✅ 鲨鱼源出 `public/` 且 gitignore

- `.gitignore:79`：`assets/spectacle-source/`；`git check-ignore` 命中 blend
- `prepare-spectacle-assets.mjs:15`：`SRC_DIR = assets/spectacle-source`
- `public/threejs-assets/pyjama-shark-free` 不存在；仅 `web/spectacle/pyjama-shark/model.glb`
- 回归：`tests/home-status-spectacle.test.ts:348-352`

## Minor

### 🟡 `webglcontextlost` 若不抛错，`tick` 会在 `forceCancel` 后再挂一帧 rAF, `src/components/islands/StatusSpectacleIsland.tsx:207-215`

**Problem**: `onFatalError` 在 `update()`/`render` 期间同步调用 `forceCancel`→`stopLoop`，但若 `update()` 本身不抛错，`tick` 的 try 成功后仍执行 `rafId = requestAnimationFrame(tick)`，把已停掉的循环重新挂上；之后 `sceneHandles` 为 null，形成空转 rAF。
**Why it matters**: 页面锁与 AC-8 成对已修好，但 AC-9「停止 rAF」在「事件触发、无 throw」路径上不完整；双 WebGL 首页多一条常驻空循环。
**Suggested fix**: `update` 之后若 `!sceneHandles`（或显式 fatal 标志）则直接 `return`，不再 `requestAnimationFrame`；或让 `onFatalError` 只设标志、由 `tick` 统一收尾并 `return`。

### 🟡 文案在「分裂开始」即翻为「已 dead」，与 AC-1「分裂结束时」不符, `src/components/islands/StatusSpectacleIsland.tsx:373-377`

**Problem**: `runSplit` 在碎裂 timeline 开始前就 `copy='dead'`；AC-1 要求分裂结束时再变。
**Why it matters**: 可测的叙事时点偏差；e2e 3s 内断言无法捕获。
**Suggested fix**: 将 `setCopy(...,'dead')` 移到碎裂 `onComplete` 之后。

### 🟡 「治愈」相位视觉上空转, `src/components/islands/StatusSpectacleIsland.tsx:286-307`

**Problem**: 碎裂结束已清碎片并恢复 hit；`healSplit` 走 `else` 仅 `healWaitTimer` 等待 1.5s，无重组动画。
**Why it matters**: AC-1「分裂慢速治愈」不可见（时长仍守）。
**Suggested fix**: 保留碎片至 healing 再做反向补间，或更新 spec/注释明确取消可见愈合。

### 🟡 生产热循环每帧 `publishProbe`, `src/components/islands/spectacleScene.ts:364`、`:678`

**Problem**: 每帧投影/分配并挂 `window.__spectacleProbe`，无 `DEV`/测试门控。
**Why it matters**: 双 WebGL 下 AC-10 敏感的纯调试开销，并向生产暴露内部状态。
**Suggested fix**: 用 `import.meta.env.DEV` 或显式测试标志包裹发布与每帧调用。

### 🟡 「0.8s 淡回」实为延时后瞬时切换, `src/components/islands/StatusSpectacleIsland.tsx:195-201`

**Problem**: `runCopyFadeBack` 等 800ms 后直接改 `textContent`，无 opacity 过渡。
**Why it matters**: 与 AC-1「淡回」用词不符。
**Suggested fix**: 对 copy 节点做 0.8s opacity 补间，或改 spec 用词。

### 🟡 被测的 3D 叙事常量未被场景消费, `tests/home-status-spectacle.test.ts:146-148`、`spectacleModel.ts:174-181` vs `spectacleScene.ts:46`、`:590`

**Problem**: `beastBodyLength` / `beastArcLength` 有单测，场景仍用 `BEAST_IN_HOLE=1.7` 与 `viewSpan*0.92`。
**Why it matters**: 对「3D 叙事常量」形成误导性覆盖。
**Suggested fix**: 场景调用模型函数，或标注为契约文档而非渲染保证。

## Nits

- ⚪ `src/components/islands/spectacleScene.ts:544`，`update()` 仍长且密布魔数；可抽相位子函数与命名常量。
- ⚪ `src/components/islands/StatusSpectacleIsland.tsx:328`，碎裂克隆整棵 hit 子树（含 ping 头像）约 27 份；可克隆精简静态副本。
- ⚪ `src/components/islands/StatusSpectacleIsland.tsx:38`，禁区依赖 `document.querySelector('header')`；标签改动会静默丢 AC-4 顶栏禁区。
- ⚪ `src/components/islands/spectacleScene.ts:4-8`，文件头 Playwright 调参过程注释可精简为决策结论。
- ⚪ `docs/specs/0005-home-status-rift-beast.md:14` / AC-7 仍写 `pyjama-shark-free/`；实现已迁 `assets/spectacle-source/`，合并前可顺手对齐文案（非运行时缺陷）。

## Strengths

- r1 Major 修复到位且有源码回归 + 资产路径断言，比「只改行为不改测试」更稳。
- `forceCancel` 现清理 `healWaitTimer`/`copyFadeTimer`，隐藏/卸载边角更完整。
- 资产管线与 cosmos 预算解耦清晰：`prepare-spectacle` → gitignored 源，`check-cosmos-assets` 独立 2.5 MB 硬顶，glb ~1.1 MB。

## Test coverage

信号为 configured。r2 新增/保留：context-loss 路径的源码级回归、源出 `public` + gitignore、prepare 指向 `assets/spectacle-source`。仍偏弱：fatal 路径无行为级模拟（事件派发后 overlay/`spectacle:end`/rAF 停止）；`publishProbe` 与相位插值仍靠 e2e/`__spectacleProbe`；`beastBodyLength`/`beastArcLength` 与渲染脱节。AC-10（`yarn perf:audit`）本次复审未重跑，合并前建议确认双 island 下 performance ≥ 0.85、LCP ≤ 2500ms。
