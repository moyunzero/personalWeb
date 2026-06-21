# 站长平台提交指南

## 站点信息

| 项 | URL |
|----|-----|
| 站点首页 | https://moyunzero.github.io/personalWeb/ |
| Sitemap | https://moyunzero.github.io/personalWeb/sitemap-index.xml |
| robots.txt | https://moyunzero.github.io/personalWeb/robots.txt |
| Google 验证文件 | https://moyunzero.github.io/personalWeb/googleef60eaecd43955c6.html |
| Bing 验证文件 | https://moyunzero.github.io/personalWeb/BingSiteAuth.xml |
| 百度验证文件 | 待添加 `public/baidu_verify_*.html` 后部署（见下方百度站长平台） |

验证文件位于仓库 `public/`，构建后随 `dist/` 一并部署。

## Google Search Console

1. 打开 [Google Search Console](https://search.google.com/search-console)
2. 添加资源 → **网址前缀** → `https://moyunzero.github.io/personalWeb/`
3. 所有权验证 → 选择 **HTML 文件**，确认文件名为 `googleef60eaecd43955c6.html`
4. **先部署**（见下方「部署顺序」），在浏览器打开上表 Google 验证 URL，应看到一行 `google-site-verification: ...`
5. 回到 Search Console 点击 **验证**
6. 左侧 **站点地图** → 提交：`https://moyunzero.github.io/personalWeb/sitemap-index.xml`
7. **网址检查** → 抽查博客文章是否可编入索引

## 必应 Webmaster Tools

1. 打开 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 添加站点 `https://moyunzero.github.io/personalWeb/`
3. 验证方式 → **XML 文件**，确认 `BingSiteAuth.xml` 可访问（上表 Bing 验证 URL）
4. **先部署**，打开 Bing 验证 URL 应返回 XML（含 `4A7B2111...`）
5. 在 Bing 控制台点击 **验证**
6. **Sitemaps** → 提交：`https://moyunzero.github.io/personalWeb/sitemap-index.xml`

## 部署顺序（验证前必做）

Astro v1.0 已于 2026-06-21 部署到生产。日常更新：

```bash
yarn build && yarn seo:audit   # 本地门禁
git push origin master         # 触发 GitHub Actions 部署
```

首次添加验证文件时：

```bash
# 将平台下载的文件放入 public/
git add public/googleef60eaecd43955c6.html public/BingSiteAuth.xml public/baidu_verify_*.html
git commit -m "chore: add site verification files"
git push origin master
```

部署完成后（通常 1–3 分钟），运行生产冒烟：

```bash
yarn verify:prod
```

预期输出 `Production verify: 0 error(s)`。可用 `PRODUCTION_URL` 覆盖目标站点。

用浏览器访问验证 URL 后，再在各平台点「验证」。

## 生产环境验证

部署后等待 1–3 分钟 CDN 传播，然后：

```bash
yarn verify:prod
```

检查项：首页 200 + `zh-CN`、Google/Bing 验证文件、sitemap-index.xml。若存在 `public/baidu_verify_*.html`，脚本会自动增加百度 URL 检查。

## 百度站长平台

1. 打开 [百度搜索资源平台](https://ziyuan.baidu.com/)
2. 添加站点 `https://moyunzero.github.io/personalWeb/`
3. 选择 **文件验证**，下载 `baidu_verify_xxxx.html`，放入仓库 `public/`（勿改文件名）
4. `git push` 部署后，用 `yarn verify:prod` 或浏览器确认百度验证 URL 返回 200
5. 链接提交 → **sitemap** → 提交 `https://moyunzero.github.io/personalWeb/sitemap-index.xml`
6. 注意：GitHub Pages 在国内访问与收录可能较慢

## Rich Results 抽查

在 [Rich Results Test](https://search.google.com/test/rich-results) 中验证以下 URL，预期类型为 **BlogPosting** / 文章结构化数据有效：

| 文章 | URL | 预期 |
|------|-----|------|
| HTML 入门 | https://moyunzero.github.io/personalWeb/blog/2023-03-12-html/ | BlogPosting |
| TypeScript | https://moyunzero.github.io/personalWeb/blog/2023-04-20-typescript/ | BlogPosting |
| RAG 实践 | https://moyunzero.github.io/personalWeb/blog/2025-05-20-rag/ | BlogPosting |

## 上线检查清单

- [x] `yarn build` 0 error
- [x] `yarn seo:audit` 0 error
- [x] `yarn perf:audit` 通过（Performance ≥ 85，LCP < 2.5s）
- [x] `yarn verify:prod` 0 error（生产冒烟）
- [ ] Google / 必应 / 百度 三平台 sitemap 已提交
- [ ] Rich Results Test 上述 3 篇通过
- [x] 生产环境抽查 `/blog/`、样本文章、分类页可访问

## 本地维护命令

```bash
yarn seo:meta-batch --dry-run   # 元数据缺口报告
yarn seo:top-n-score --dry-run  # Top N 评分预览
yarn seo:top-n-checklist        # Top N 深度优化 checklist
yarn perf:audit                 # Lighthouse 性能门禁（需 preview）
yarn verify:prod                # 生产环境冒烟（部署后 1–3 分钟）
yarn test:uat:4                 # Phase 4 自动化 UAT
```
