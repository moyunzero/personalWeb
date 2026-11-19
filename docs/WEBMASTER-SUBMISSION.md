# 站长平台提交指南

## 站点信息

| 项 | URL |
|----|-----|
| 站点首页 | https://moyunzero.github.io/personalWeb/ |
| Sitemap | https://moyunzero.github.io/personalWeb/sitemap-index.xml |
| robots.txt | https://moyunzero.github.io/personalWeb/robots.txt |
| Google 验证文件 | https://moyunzero.github.io/personalWeb/googleef60eaecd43955c6.html |
| Bing 验证文件 | https://moyunzero.github.io/personalWeb/BingSiteAuth.xml |
| IndexNow 密钥 | https://moyunzero.github.io/personalWeb/38b28dfd0832d1c55cec024f8ea1739e.txt |
| 百度验证 | HTML 标签（首页 meta）或 `public/baidu_verify_*.html`（见下方） |

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

## 必应「Top Recommendations」逐条处理

Bing Webmaster Tools 的建议分两类：**技术项**（IndexNow、标题/描述长度）可以用代码修，**站外项**（高质量入站链接）只能靠内容与传播解决。当前处理方式如下。

| 必应建议 | 处理 | 归属 |
|---|---|---|
| Set up IndexNow | 部署后自动提交全部 sitemap URL | `.github/workflows/deploy.yml` + `scripts/seo-indexnow-submit.mjs` |
| Page titles too short | 站点页重写标题；标题过短的文章补 `seoTitle`；构建门禁卡 < 15 字符 | 页面模板 + frontmatter + `scripts/lib/meta-rules.mjs` |
| Meta descriptions too short | 站点页重写描述；占位/过短描述由正文摘要兜底；门禁提示 < 100 字符 | `src/blog/seo-text.js` + frontmatter |
| Not enough inbound links | **代码无法修复**，见下文「入站链接」 | 站外运营 |

### IndexNow

密钥文件 `public/38b28dfd0832d1c55cec024f8ea1739e.txt`（文件名与内容一致）。本站是 GitHub Pages **项目站点**，控制不到 `moyunzero.github.io` 根目录，因此提交请求里带 `keyLocation`：

```json
{
  "host": "moyunzero.github.io",
  "key": "38b28dfd0832d1c55cec024f8ea1739e",
  "keyLocation": "https://moyunzero.github.io/personalWeb/38b28dfd0832d1c55cec024f8ea1739e.txt",
  "urlList": ["https://moyunzero.github.io/personalWeb/blog/..."]
}
```

- 部署流程：`deploy.yml` 在 Pages 部署成功后运行脚本，一次性提交 `dist/sitemap*.xml` 里的全部 URL（≤10,000 条/请求）。
- 脚本先 GET 密钥文件确认可访问再提交，避免整批被拒；CDN 未同步时只告警（`continue-on-error`）。
- 手动：`yarn seo:indexnow`、`yarn seo:indexnow --dry-run`、`yarn seo:indexnow --limit 20`、`yarn seo:indexnow --strict`。
- 换 key：把 `public/<key>.txt` 换掉即可（脚本按「文件名 === 内容」自动发现），再在 Bing 后台重新验证。

提交成功后可在 Bing Webmaster → **IndexNow** 看到 URL 提交记录；Bing 一般数小时到数天内处理。

### 标题与描述长度标准

| 项 | 目标 | 说明 |
|---|---|---|
| `<title>` | 20–65 字符（含 ` · 墨韵`） | Bing 阈值是 15，这里留 5 字符余量；超过 65 会被截断 |
| `description` | 100–200 字符 | 中文 100 字约等于英文 200 字符的展示量，再长会被截断 |

当前实测（`yarn build` 后 326 个可索引页面）：

| 指标 | 修复前 | 修复后 |
|---|---|---|
| 标题 < 15 字符 | 59 个页面 | 0 |
| 标题 > 65 字符 | 16 个页面 | 0 |
| 描述 < 100 字符 | 112 个页面 | 0 |
| 重复标题 | 1 组 | 0 |

标题区间 20–65 字符，描述区间 100–180 字符，由 `tests/seo-meta-length.test.ts` 在 CI 里对 `dist/` 逐个页面回归。

实现只有一处：`src/blog/seo-text.js`。页面渲染与 `yarn seo:audit` 共用同一套 `effectiveTitle` / `effectiveDescription`，避免「门禁过了、线上还是短标题」。

- 文章标题过短/过长：在 frontmatter 加 `seoTitle`（只改 `<title>`，不动 H1 与页面展示标题）。
- 描述不适合当摘要：加 `seoDescription`。
- 描述为空或写成 Notion 项目代号（`workBuddy-3`、`AgentGuide-12`）：构建期自动用正文首段摘要兜底；`yarn notion:sync` 会保留 `seoTitle` / `seoDescription`，不会被下次同步清掉。
- 站点级页面：首页、`/blog/`、`/listening/` 的文案写在各自 `src/pages/**`；分类页写在 `content/categories.json` 的 `seoTitle` / `description`。

### 入站链接（无法用代码修复）

「没有来自高质量域名的入站链接」是站外信号，改模板、加 IndexNow 都不会改善。现实做法（按性价比排序）：

1. 把真正有复用价值的文章同步到 掘金 / 知乎 / dev.to / Medium，并在文首注明原文链接（**不要**只放链接的镜像，会被判重复）。
2. GitHub Profile README、同主题开源仓库的文档里链回具体文章（不是首页）。
3. 参与社区问答时引用自己写过的深度文章，而不是每帖都甩链接。
4. 在 Bing Webmaster 的 **Backlinks** 里看现有外链，确认质量。

不建议买链接、批量互链或做链接农场——这是 Bing 明确会打击的行为，短期可能有效，长期会拖累整站。

### 复查

本地构建后可直接量测产物（改文案或加文章后跑一遍）：

```bash
yarn build
yarn seo:audit      # 0 error 才算过：标题 < 15 会 fail
yarn test           # 含 dist 级标题/描述长度回归
```

线上复查：

```bash
yarn verify:prod    # 含 IndexNow 密钥文件可达性
yarn seo:index-check
```

---

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

`github.io` 子域名**无法使用 CNAME 验证**，推荐二选一：

### 方式 A：HTML 标签验证（推荐，适合 GitHub Pages）

1. 打开 [百度搜索资源平台](https://ziyuan.baidu.com/) → 登录 → **用户中心** → **站点管理** → **添加网站**
2. 站点地址填：`https://moyunzero.github.io/personalWeb/`（与浏览器实际访问一致）
3. 验证方式选 **HTML标签验证**，复制 `content` 值（一串字母数字，不是整段 meta）
4. 将 code 发给维护者，或本地设置环境变量后构建部署：

```bash
export BAIDU_SITE_VERIFICATION=你的content值
yarn build && git push origin master
```

生产首页 `<head>` 会出现 `<meta name="baidu-site-verification" content="...">`。在平台点击 **完成验证**。

也可在 GitHub Actions 的 `deploy.yml` build 步骤注入 `BAIDU_SITE_VERIFICATION` 密钥（Repository secrets）。

### 方式 B：文件验证

1. 同上添加站点后，选 **文件验证**
2. 下载 `baidu_verify_xxxx.html`，**不要改文件名**
3. 放入仓库 `public/`，`git push` 部署
4. 浏览器打开 `https://moyunzero.github.io/personalWeb/baidu_verify_xxxx.html` 应可访问
5. 回到平台点击 **完成验证**

### 提交 sitemap

验证通过后：链接提交 → **sitemap** → `https://moyunzero.github.io/personalWeb/sitemap-index.xml`

注意：GitHub Pages 在国内访问与收录可能较慢。

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
- [x] Google / 必应 sitemap 已提交（百度 v1.0 跳过）
- [ ] Rich Results Test 上述 3 篇通过
- [x] 生产环境抽查 `/blog/`、样本文章、分类页可访问

## 收录验收（`yarn seo:index-check`）

发布后可用本地命令做分层验收（**不进 CI**，见 spec 0006）：

| 层 | 含义 | 条件 |
|----|------|------|
| **A 可收录** | robots 允许抓取、sitemap 含博客文、抽样文章 200 / 无 `noindex` / 有 BlogPosting、站长验证文件可达 | 始终运行；失败则 exit 1 |
| **B 真收录** | Google Search Console URL Inspection 抽查样本索引状态 | 需本机服务账号 JSON；未配置则 `SKIP`，不失败 |

```bash
# 仅 A 层（无需密钥）
yarn seo:index-check

# 抽样数量 / 未收录也失败
yarn seo:index-check --sample 10
yarn seo:index-check --strict

# A + B：先按上文「Google Search Console」验证站点，再创建 GCP 服务账号并下载 JSON 密钥
# 1) Cloud Console → 启用「Google Search Console API」
# 2) 创建服务账号 → 密钥 → JSON（保存到本机，勿提交 git）
# 3) Search Console → 用户和权限 → 添加服务账号邮箱（完整权限）
export GOOGLE_APPLICATION_CREDENTIALS="/绝对路径/到/密钥.json"
# 可选：与 GSC「网址前缀」资源一致
export GSC_SITE_URL="https://moyunzero.github.io/personalWeb/"
yarn seo:index-check
```

也可覆盖生产基址：`PRODUCTION_URL`（与 `yarn verify:prod` 相同）。  
默认未收录只打 **warning**（exit 0）；加 `--strict` 才把未收录或 Inspection 失败当作 exit 1。

## 本地维护命令

完整清单见 [LAUNCH.md](./LAUNCH.md)。

```bash
yarn seo:meta-batch --dry-run   # 元数据缺口报告
yarn seo:top-n-score --dry-run  # Top N 评分预览
yarn seo:top-n-checklist        # Top N 深度优化 checklist
yarn seo:index-check            # 可收录 + 可选 GSC 真收录抽查
yarn perf:audit                 # Lighthouse 性能门禁（yarn preview 后执行）
yarn verify:prod                # 生产冒烟：首页、验证文件、sitemap、博客链接
yarn test:uat:4                 # 相关文章与性能 UAT
```
