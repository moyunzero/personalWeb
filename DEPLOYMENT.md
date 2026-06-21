# 部署指南

墨韵个人站为 **Astro 静态站点**，生产环境部署在 **GitHub Pages**：

**https://moyunzero.github.io/personalWeb/**

构建产物输出到 `dist/`，站点 `base` 为 `/personalWeb/`（见 `astro.config.mjs`）。

---

## 日常发布流程

大多数更新只需推送到 `master`：

```bash
git push origin master
```

GitHub Actions（[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)）会自动：

1. `yarn install`
2. `yarn build`（内含 `seo:audit`）
3. 将 `dist/` 部署到 GitHub Pages

部署完成后等待 1–3 分钟，运行冒烟检查：

```bash
yarn verify:prod
```

---

## 本地构建与预览

```bash
yarn install
yarn build          # 生成 dist/
yarn preview        # 默认 http://localhost:4321/personalWeb/
```

预览时请使用带 `base` 的完整路径访问（例如 `/personalWeb/blog/`），不要只用根路径 `/`。

仅构建、跳过 SEO 审计：

```bash
yarn build:astro
```

---

## GitHub Pages 首次配置

若 fork 或新建仓库，需确认：

1. **仓库 Settings → Pages → Build and deployment**
   - Source：**GitHub Actions**（非 legacy `gh-pages` 分支）
2. **默认分支**为 `master`（与 workflow 一致）
3. 首次 push 后于 **Actions** 查看 `Deploy static content to Pages` 是否成功

站点 URL 形如：`https://<user>.github.io/personalWeb/`

---

## 从 Notion 同步并部署

### 本地同步

配置 `.env.local` 后：

```bash
yarn notion:sync
git add content/posts public/images/blog
git commit -m "post: sync from Notion"
git push
```

### GitHub Actions 同步

工作流：[`.github/workflows/notion-sync.yml`](./.github/workflows/notion-sync.yml)

1. 仓库 **Settings → Secrets and variables → Actions** 添加：
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`
2. **Actions → Sync blog from Notion → Run workflow**
3. 工作流会执行 `yarn notion:sync` 并自动 commit + push，随后触发部署 workflow

---

## 环境变量

| 场景 | 文件 / 位置 | 变量 |
|------|-------------|------|
| 本地开发 | `.env.local` | `VITE_CHAT_API_URL`、`NOTION_*` |
| 生产构建 | 仓库 Variables 或 workflow `env` | `VITE_CHAT_API_URL`（若需聊天功能） |
| Notion CI | Actions Secrets | `NOTION_TOKEN`、`NOTION_DATABASE_ID` |

模板见 [.env.example](./.env.example)。**不要**把 Token 提交进 Git。

---

## 站长验证文件

Google / Bing 等验证文件放在 `public/`，构建后位于 `dist/` 根目录：

```text
public/googleef60eaecd43955c6.html
public/BingSiteAuth.xml
public/baidu_verify_*.html   # 可选
```

添加或更新后 `git push`，再于站长平台点验证。详见 [docs/WEBMASTER-SUBMISSION.md](./docs/WEBMASTER-SUBMISSION.md)。

---

## 上线后检查

完整清单见 [docs/LAUNCH.md](./docs/LAUNCH.md)。常用命令：

```bash
yarn verify:prod     # 首页、验证文件、sitemap、博客链接
yarn perf:audit      # Lighthouse（本地 preview）
yarn test:uat:4      # 相关文章与性能冒烟
```

---

## 常见问题

### 链接跳到 `github.io/` 根路径（没有 `/personalWeb`）

站内链接应使用 `import.meta.env.BASE_URL` 或绝对路径 `/personalWeb/...`。若从旧缓存页面点击，请硬刷新（Ctrl+Shift+R）。

### 博客文章 404

- 确认 `content/posts/<slug>.md` 存在且 `draft: false`
- URL 需带尾部斜杠：`/personalWeb/blog/<slug>/`（`trailingSlash: 'always'`）
- 确认已 push 且 Actions 部署成功

### 构建失败：`seo:audit` 报错

根据终端提示修正 frontmatter 或运行 `yarn seo:meta-batch --dry-run` 查看缺口。

### 本地 preview 与线上一致性

线上由 Actions 在 Node 22 下构建；本地建议 Node 20+。构建前可执行：

```bash
yarn build && yarn verify:prod --skip-network
```

---

## 其他托管平台（可选）

项目可部署到 Vercel / Netlify 等静态托管，但需注意：

- 必须配置 **base path** `/personalWeb`（或修改 `scripts/lib/site-config.mjs` 中的 `basePath` 并全量替换链接）
- 构建命令：`yarn build`，输出目录：`dist`
- 当前 CI 与文档以 **GitHub Pages** 为准

---

## 回滚

```bash
git revert <commit>
git push origin master
```

或在 GitHub Actions 中重新运行上一次成功的部署 workflow（需仓库已启用 Pages 历史）。
