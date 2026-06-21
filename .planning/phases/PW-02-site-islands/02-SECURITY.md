---
phase: PW-02
slug: site-islands
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-21
verified: 2026-06-21
---

# Phase 2 — Security

> 整站页面与交互岛：首页 Astro 静态层、React 交互岛（GSAP/Lenis/Phaser）、移除 web editor。

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| React islands → DOM | 客户端动画与游戏画布 | 仅可见性/交互状态 |
| Contact form → getform.io | 访客提交联系表单 | 姓名、邮箱、消息（第三方 SaaS） |
| GameIsland → Phaser | 点击后加载本地游戏 | 无用户账户数据 |
| Project cards → external URLs | 作品集外链 | 出站导航至 App Store / GitHub 等 |
| Legacy SPA routes | `src/routes/index.js` 保留 Vite 遗留 | 生产构建不经过此路径 |
| Astro home → dist | 静态 HTML + 延迟 JS chunks | 公开首页内容 |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-PW02-01 | Denial of service | GSAP/Lenis island | mitigate | `client:only="react"` 延迟岛加载；`HomeMotion.tsx` 检测 `prefers-reduced-motion` 跳过动画 | closed |
| T-PW02-02 | Tampering | Lenis anchor scroll | mitigate | 锚点导航由 `HomeHeader` + `#about/#work` 原生 smooth scroll；Phase 2 UAT Test 2 pass | closed |
| T-PW02-03 | Tampering | Phaser canvas | accept | 本地小游戏，`pointer-events: none`，无持久化用户数据 | closed |
| T-PW02-04 | Spoofing | project external links | mitigate | `ProjectCard.astro` 外链 `rel="noopener noreferrer"` | closed |
| T-PW02-05 | Information disclosure | removed editor | mitigate | `BlogEditor.jsx` 已删除；`routes/index.js` 无 `/blog/editor`；`tests/editor-route.test.ts`；dist 无 editor 路径 | closed |

*Disposition: mitigate = 实现已验证 · accept = 已记录于 Accepted Risks Log*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-PW02-01 | T-PW02-03 | Phaser 为本地娱乐画布，不处理认证或敏感数据；攻击面限于客户端渲染 | Phase 2 security audit | 2026-06-21 |
| AR-PW02-02 | — | 联系表单通过 getform.io 第三方提交（遗留行为）；PII 由第三方托管，非本 Phase 新增威胁 | Phase 2 security audit | 2026-06-21 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-21 | 5 | 5 | 0 | gsd-secure-phase 2 |

### Audit 2026-06-21 — Evidence Summary

| Threat | Verification |
|--------|----------------|
| T-PW02-01 | `index.astro` 岛组件均为 `client:only`；`HomeMotion.tsx` `prefersReducedMotion()` |
| T-PW02-02 | `HomeHeader.tsx` 锚点 `scrollToId`；UAT 锚点导航 pass |
| T-PW02-03 | `GameIsland.tsx` 本地 Phaser，`aria-hidden` 容器 |
| T-PW02-04 | `ProjectCard.astro` line 51 `rel="noopener noreferrer"` |
| T-PW02-05 | `BlogEditor.jsx` 不存在；`editor-route.test.ts` pass；`deploy.yml` 无 `VITE_CHAT_API_URL`；首页未挂载 ChatTrigger/ChatPanel |

### D-22 Compliance

- Astro 生产路径（`index.astro`, `BlogLayout.astro`）未引用 `ChatTrigger` / `ChatPanel`
- CI `deploy.yml` 构建步骤无聊天 API 环境变量

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Note:** `README.md` 目录树仍列出已删除的 `BlogEditor.jsx`（文档陈旧，非安全漏洞）。可在后续文档清理中修正。
