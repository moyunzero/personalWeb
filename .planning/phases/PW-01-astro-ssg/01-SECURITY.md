---
phase: PW-01
slug: astro-ssg
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-21
verified: 2026-06-21
---

# Phase 1 — Security

> Astro 基础与博客 SSG：静态站点、Content Collections、构建时 SEO、GitHub Pages 部署。

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → package.json | 构建时安装的第三方包 | 依赖源码 / 构建脚本 |
| site-config.mjs → astro.config | 构建时 URL 与 canonical 基准 | 站点元数据 |
| content/posts/*.md → loader | Notion 同步与手写 Markdown | 不可信内容（作者可控） |
| Built HTML → crawlers / 访客 | 静态 HTML 输出 | 公开页面与 meta |
| post.data → JSON-LD | Frontmatter 字段嵌入 script | 结构化元数据 |
| GitHub Actions → dist | CI 构建公开制品 | 静态资源 bundle |
| robots.txt / sitemap | 公开爬取指令 | URL 列表 |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-PW01-01 | Spoofing | npm packages | mitigate | `astro@^5.18.0` + 官方 `@astrojs/*`（见 `package.json`）；RESEARCH 合法性审计 | closed |
| T-PW01-02 | Tampering | package.json scripts | mitigate | `build`: `astro build` only，无 vite/generate-static 回退 | closed |
| T-PW01-SC | Tampering | yarn add | mitigate | RESEARCH Package Legitimacy Audit；无 SLOP 包 | closed |
| T-PW01-03 | Tampering | Markdown body | mitigate | `remarkRehype({ allowDangerousHtml: false })`；无 `rehype-raw`；`set:html` 仅用于 remark 管道输出 HTML | closed |
| T-PW01-04 | Tampering | Frontmatter fields | mitigate | Zod schema（`posts-loader` + `parseData`）；字段有界 | closed |
| T-PW01-05 | Information disclosure | draft posts | mitigate | `getCollection` / `getStaticPaths` 过滤 `!data.draft` | closed |
| T-PW01-06 | Tampering | JSON-LD set:html | mitigate | `JSON.stringify(item)` 写入 `application/ld+json`（`BaseLayout.astro`） | closed |
| T-PW01-07 | Spoofing | og:url canonical | mitigate | `canonicalUrl()` 默认 `siteUrl(path)`；loader 未暴露 frontmatter `canonical` 覆盖 | closed |
| T-PW01-08 | Information disclosure | deploy.yml env | mitigate | 已移除 `VITE_CHAT_API_URL`；CI 无密钥注入 | closed |
| T-PW01-09 | Tampering | CI workflow | mitigate | 单步 `yarn build`；artifact `./dist` | closed |
| T-PW01-10 | Denial of service | sitemap size | accept | ~96 篇静态 sitemap；GH Pages 可接受 | closed |

*Disposition: mitigate = 实现已验证 · accept = 已记录于 Accepted Risks Log*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-PW01-01 | T-PW01-10 | 全站约 96 篇 URL 的 sitemap 体积在 GitHub Pages 免费托管范围内；无动态生成或用户触发路径 | Phase 1 security audit | 2026-06-21 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-21 | 11 | 11 | 0 | gsd-secure-phase 1 |

### Audit 2026-06-21 — Evidence Summary

| Threat | Verification |
|--------|----------------|
| T-PW01-01–02, SC | `package.json`: astro ^5.18.0, scripts `astro build` |
| T-PW01-03 | `src/lib/markdown.ts` allowDangerousHtml false; `[...slug].astro` set:html 仅管道 HTML |
| T-PW01-04 | `src/loaders/posts-loader.ts` Zod schema + `parseData` |
| T-PW01-05 | `src/lib/blog.ts`, `[...slug].astro` draft filter |
| T-PW01-06 | `BaseLayout.astro` JSON.stringify on ld+json |
| T-PW01-07 | `src/lib/seo.ts` canonicalUrl from path/site |
| T-PW01-08–09 | `.github/workflows/deploy.yml` 仅 `yarn build`，无 env secrets |
| T-PW01-10 | Accepted risk AR-PW01-01 |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-21
