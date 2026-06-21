# 上线与维护清单

**生产站点：** https://moyunzero.github.io/personalWeb/

本文档汇总部署后的验证步骤与日常维护命令。站长平台细则见 [WEBMASTER-SUBMISSION.md](./WEBMASTER-SUBMISSION.md)。

---

## 发布前（本地）

```bash
yarn build              # 0 error；内含 seo:audit
yarn preview            # http://localhost:4321/personalWeb/
# 抽查：首页模块、/personalWeb/blog/、一篇长文（Mermaid）、分类页
```

可选：

```bash
yarn perf:audit         # Lighthouse 门禁
yarn test:uat:4         # 相关文章 + 性能冒烟
yarn verify:prod --skip-network   # 仅检查 dist 产物
```

---

## 发布后（生产）

等待 GitHub Actions 部署完成（约 1–3 分钟）：

```bash
yarn verify:prod
```

应覆盖：首页、`google`/`bing` 验证文件、sitemap、博客列表文章链接、样本文章页。

手动抽查：

- [ ] https://moyunzero.github.io/personalWeb/
- [ ] https://moyunzero.github.io/personalWeb/blog/
- [ ] 点击文章卡片可进入详情（URL 保持在 `/personalWeb/` 下）
- [ ] https://moyunzero.github.io/personalWeb/sitemap-index.xml

---

## 站长平台

| 平台 | 状态（v1.0） | 文档 |
|------|-------------|------|
| Google Search Console | 已验证 | [WEBMASTER-SUBMISSION.md](./WEBMASTER-SUBMISSION.md) |
| 必应 Webmaster | 已验证 | 同上 |
| 百度 | v1.0 跳过 | 同上 |

Sitemap 提交地址：

`https://moyunzero.github.io/personalWeb/sitemap-index.xml`

---

## 内容工作流

| 任务 | 命令 |
|------|------|
| 新建文章 | `yarn blog:new "标题" --categories note` |
| Notion 增量同步 | `yarn notion:sync` |
| Notion 单篇 | `yarn notion:sync --page <notion-page-id>` |
| 预览同步 | `yarn notion:sync --dry-run` |
| 元数据批量 | `yarn seo:meta-batch --dry-run` / `--apply` |
| Top N 优化 | `yarn seo:top-n-score` / `yarn seo:top-n-checklist` |

同步或改文后：`git push origin master` 即自动部署。

---

## 检查清单（里程碑参考）

- [x] `yarn build` 0 error
- [x] `yarn seo:audit` 0 error
- [x] `yarn perf:audit` 通过
- [x] `yarn verify:prod` 0 error
- [x] Google / Bing sitemap 已提交
- [ ] Rich Results Test（见 WEBMASTER-SUBMISSION 样本 URL）
- [x] 生产博客列表与文章可访问

---

## 相关文档

- [DEPLOYMENT.md](../DEPLOYMENT.md) — 构建与 GitHub Pages
- [WEBMASTER-SUBMISSION.md](./WEBMASTER-SUBMISSION.md) — 站长提交步骤
- [SEO-MIGRATION-DESIGN.md](./SEO-MIGRATION-DESIGN.md) — 迁移设计记录
