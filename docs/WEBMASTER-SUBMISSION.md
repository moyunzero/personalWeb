# 站长平台提交指南

## 站点信息

| 项 | URL |
|----|-----|
| 站点首页 | https://moyunzero.github.io/personalWeb/ |
| Sitemap | https://moyunzero.github.io/personalWeb/sitemap-index.xml |
| robots.txt | https://moyunzero.github.io/personalWeb/robots.txt |
| Google 验证文件 | https://moyunzero.github.io/personalWeb/googleef60eaecd43955c6.html |
| Bing 验证文件 | https://moyunzero.github.io/personalWeb/BingSiteAuth.xml |

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

```bash
yarn build
git add public/googleef60eaecd43955c6.html public/BingSiteAuth.xml
git commit -m "chore: add Google/Bing site verification files"
git push   # 触发 GitHub Actions 部署到 Pages
```

部署完成后（通常 1–3 分钟），用浏览器访问两个验证 URL，再在各平台点「验证」。

## 百度站长平台

1. 打开 [百度站长平台](https://ziyuan.baidu.com/)
2. 添加站点 `https://moyunzero.github.io/personalWeb/`
3. 完成验证（GitHub Pages 可用文件验证）
4. 链接提交 → **sitemap** → 提交 `sitemap-index.xml` 完整 URL
5. 注意：GitHub Pages 在国内访问与收录可能较慢，可配合主动推送（若可用）

## Rich Results 抽查

在 [Rich Results Test](https://search.google.com/test/rich-results) 中验证以下 URL，预期类型为 **BlogPosting** / 文章结构化数据有效：

| 文章 | URL | 预期 |
|------|-----|------|
| HTML 入门 | https://moyunzero.github.io/personalWeb/blog/2023-03-12-html/ | BlogPosting |
| TypeScript | https://moyunzero.github.io/personalWeb/blog/2023-04-20-typescript/ | BlogPosting |
| RAG 实践 | https://moyunzero.github.io/personalWeb/blog/2025-05-20-rag/ | BlogPosting |

## 上线检查清单

- [ ] `yarn build` 0 error
- [ ] `yarn seo:audit` 0 error
- [ ] `yarn perf:audit` 通过（Performance ≥ 85，LCP < 2.5s）
- [ ] Google / 必应 / 百度 三平台 sitemap 已提交
- [ ] Rich Results Test 上述 3 篇通过
- [ ] 生产环境抽查 `/blog/`、样本文章、分类页可访问

## 本地维护命令

```bash
yarn seo:meta-batch --dry-run   # 元数据缺口报告
yarn seo:top-n-score --dry-run  # Top N 评分预览
yarn seo:top-n-checklist        # Top N 深度优化 checklist
yarn perf:audit                 # Lighthouse 性能门禁（需 preview）
yarn test:uat:4                 # Phase 4 自动化 UAT
```
