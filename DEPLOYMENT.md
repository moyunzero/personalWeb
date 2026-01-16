# 📦 项目部署指南

本指南将详细介绍如何将这个 React + Vite 个人网站部署到线上环境。项目是纯前端应用，支持多种部署方案。

---

## 🎯 部署前准备

### 1. 构建生产版本

在部署之前，需要先构建项目：

```bash
# 安装依赖（如果还没有安装）
yarn install

# 构建生产版本
yarn build
```

构建完成后，会在项目根目录生成 `dist` 文件夹，里面包含了所有需要部署的静态文件。

### 2. 本地预览构建结果

构建完成后，建议先本地预览一下，确保没有问题：

```bash
yarn preview
```

在浏览器中打开显示的本地地址（通常是 `http://localhost:4173`），检查网站是否正常显示。

---

## 🚀 方案一：Vercel 部署（推荐，最简单）

Vercel 是专门为前端项目优化的部署平台，对 React、Vite 等项目支持非常好，部署非常方便。

### 优点
- ✅ 完全免费（个人项目）
- ✅ 自动 HTTPS 证书
- ✅ 全球 CDN 加速
- ✅ 自动部署（Git 推送即部署）
- ✅ 完美支持 React Router
- ✅ 零配置，开箱即用

### 部署步骤

#### 方式 A：通过 Vercel 网站部署（推荐新手）

1. **注册账号**
   - 访问 [https://vercel.com](https://vercel.com)
   - 使用 GitHub、GitLab 或 Bitbucket 账号登录（推荐）

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 连接你的 Git 仓库（GitHub/GitLab/Bitbucket）
   - 选择本项目的仓库

3. **配置项目**
   - **Framework Preset**: 选择 "Vite"
   - **Root Directory**: 保持默认（通常是 `./`）
   - **Build Command**: `yarn build` 或 `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `yarn install` 或 `npm install`

4. **环境变量（如果需要）**
   - 如果项目使用了 `.env` 文件中的变量（如 `VITE_API_URL`），在这里添加环境变量
   - 变量名不需要加 `VITE_` 前缀，但代码中访问时仍用 `import.meta.env.VITE_API_URL`

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常 1-2 分钟）
   - 部署成功后，会获得一个免费的域名（如 `your-project.vercel.app`）

6. **自定义域名（可选）**
   - 在项目设置中找到 "Domains"
   - 添加你的自定义域名（如 `www.yourname.com`）
   - 按照提示配置 DNS 解析

#### 方式 B：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   # 或
   yarn global add vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 在项目根目录执行
   vercel
   ```
   
   第一次部署时，CLI 会询问一些问题：
   - Set up and deploy? → `Y`
   - Which scope? → 选择你的账号
   - Link to existing project? → `N`（首次部署）
   - What's your project's name? → 输入项目名称
   - In which directory is your code located? → `./`（直接回车）
   - Want to override the settings? → `N`（首次部署）

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

### 自动部署配置

Vercel 默认会在你推送代码到 Git 仓库的 `main` 或 `master` 分支时自动重新部署。你也可以在项目设置中配置：

- **Production Branch**: 通常设置为 `main` 或 `master`
- **Preview Deployments**: 其他分支的提交会自动创建预览部署

### Vercel 配置文件（可选）

如果需要自定义配置，可以在项目根目录创建 `vercel.json`：

```json
{
  "buildCommand": "yarn build",
  "outputDirectory": "dist",
  "devCommand": "yarn dev",
  "installCommand": "yarn install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

`rewrites` 配置确保 React Router 的路由能正常工作。

---

## 🌐 方案二：Netlify 部署

Netlify 是另一个非常流行的前端部署平台，功能类似 Vercel。

### 优点
- ✅ 免费额度充足
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 支持表单提交、函数等高级功能
- ✅ 完美支持 SPA 路由

### 部署步骤

#### 方式 A：通过 Netlify 网站部署

1. **注册账号**
   - 访问 [https://www.netlify.com](https://www.netlify.com)
   - 使用 GitHub 等账号登录

2. **导入项目**
   - 点击 "Add new site" → "Import an existing project"
   - 连接 Git 仓库并选择项目

3. **配置构建**
   - **Build command**: `yarn build`
   - **Publish directory**: `dist`
   - **Base directory**: `./`（默认）

4. **部署**
   - 点击 "Deploy site"
   - 等待构建完成
   - 获得免费域名（如 `your-project.netlify.app`）

#### 方式 B：通过 Netlify CLI 部署

1. **安装 CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录**
   ```bash
   netlify login
   ```

3. **部署**
   ```bash
   # 构建项目
   yarn build
   
   # 部署到 Netlify
   netlify deploy --prod --dir=dist
   ```

### Netlify 配置文件

创建 `netlify.toml` 文件（项目根目录）：

```toml
[build]
  command = "yarn build"
  publish = "dist"

# SPA 路由支持
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

这个配置文件确保所有路由请求都会被重定向到 `index.html`，让 React Router 能正确处理客户端路由。

---

## 📄 方案三：GitHub Pages 部署

GitHub Pages 适合已经有 GitHub 仓库的项目，免费但功能相对简单。

### 优点
- ✅ 完全免费
- ✅ 与 GitHub 集成
- ✅ 支持自定义域名

### 缺点
- ⚠️ 不支持服务端配置（需要额外处理 SPA 路由）
- ⚠️ 构建需要配置 GitHub Actions

### 部署步骤

#### 1. 安装 GitHub Pages 插件

```bash
yarn add -D gh-pages
```

#### 2. 修改 package.json

添加部署脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "yarn build && gh-pages -d dist"
  }
}
```

#### 3. 配置 Vite 的 base 路径

修改 `vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/', // 改为你的 GitHub 仓库名，如果部署到根域名则设为 '/'
  // ... 其他配置
})
```

#### 4. 创建 404.html（处理 SPA 路由）

在 `public` 目录创建 `404.html`：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      // 获取当前路径
      var path = window.location.pathname;
      // 如果是仓库路径，移除仓库名
      var repoPath = '/your-repo-name/';
      if (path.startsWith(repoPath)) {
        path = path.slice(repoPath.length - 1);
      }
      // 重定向到 index.html
      var redirect = repoPath + 'index.html' + window.location.search + window.location.hash;
      window.location.replace(redirect);
    </script>
  </head>
  <body>
    <p>Redirecting...</p>
  </body>
</html>
```

#### 5. 执行部署

```bash
yarn deploy
```

#### 6. 配置 GitHub Pages

1. 进入 GitHub 仓库的 Settings
2. 找到 "Pages" 选项
3. Source 选择 "gh-pages" 分支
4. 保存后，网站会在 `https://your-username.github.io/your-repo-name/` 可访问

---

## 🖥️ 方案四：云服务器部署（Nginx）

如果你有自己的云服务器（如阿里云、腾讯云、AWS 等），可以使用 Nginx 部署。

### 优点
- ✅ 完全控制
- ✅ 可以部署多个项目
- ✅ 灵活性高

### 缺点
- ⚠️ 需要自己配置服务器
- ⚠️ 需要配置域名和 SSL 证书
- ⚠️ 需要定期维护

### 部署步骤

#### 1. 服务器准备

确保服务器已安装：
- Node.js（用于构建，也可以本地构建后上传）
- Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. 构建项目

在本地或服务器上构建：

```bash
yarn build
```

#### 3. 上传文件

将 `dist` 目录的所有文件上传到服务器的网站目录：

```bash
# 使用 scp 上传（在本地执行）
scp -r dist/* user@your-server-ip:/var/www/your-website/

# 或使用 rsync
rsync -avz dist/ user@your-server-ip:/var/www/your-website/
```

#### 4. 配置 Nginx

创建或编辑 Nginx 配置文件 `/etc/nginx/sites-available/your-website`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 网站根目录
    root /var/www/your-website;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # SPA 路由支持：所有请求都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 5. 启用站点

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/your-website /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 6. 配置 SSL 证书（HTTPS）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

Certbot 会自动修改 Nginx 配置，添加 HTTPS 支持。

#### 7. 防火墙配置

确保开放 HTTP 和 HTTPS 端口：

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🔍 部署后检查清单

无论使用哪种部署方案，部署完成后都应该检查以下几点：

### ✅ 功能检查

1. **首页是否正常显示**
   - 打开网站首页，检查布局、样式、图片是否正常

2. **路由是否正常工作**
   - 测试所有路由（`/blog`、`/blog/xxx` 等）
   - 直接访问路由 URL，不应出现 404
   - 浏览器刷新页面，路由应该正常显示

3. **移动端适配**
   - 在手机浏览器或开发者工具的移动端模式测试
   - 检查响应式布局是否正常

4. **性能检查**
   - 使用浏览器开发者工具的 Network 面板
   - 检查资源加载时间
   - 确保图片、CSS、JS 文件正确加载

5. **控制台检查**
   - 打开浏览器控制台（F12）
   - 检查是否有 JavaScript 错误
   - 检查是否有资源加载失败

### ✅ SEO 和元数据

1. **页面标题**
   - 每个页面应有正确的 `<title>` 标签

2. **Meta 标签**
   - 检查 `index.html` 中的 meta 描述、关键词等

3. **Open Graph 标签（可选）**
   - 如果需要在社交媒体分享，添加 OG 标签

### ✅ 性能优化

1. **资源压缩**
   - 确保生产构建已压缩 CSS、JS
   - 图片已优化（可以考虑使用 WebP 格式）

2. **缓存策略**
   - 静态资源应设置长期缓存
   - HTML 文件应设置较短的缓存时间

3. **CDN 加速**
   - 如果使用 Vercel、Netlify 等服务，自动享受 CDN
   - 云服务器可以配置 CDN（如阿里云 CDN、腾讯云 CDN）

---

## 🐛 常见问题排查

### 问题 1：路由 404 错误

**现象**：直接访问 `/blog` 等路由时出现 404

**原因**：服务器没有配置 SPA 路由重定向

**解决方案**：
- Vercel/Netlify：添加 `rewrites` 或 `redirects` 配置（见上文）
- Nginx：确保有 `try_files $uri $uri/ /index.html;`
- GitHub Pages：使用 404.html 重定向方案

### 问题 2：资源路径错误

**现象**：图片、CSS、JS 文件加载失败（404）

**原因**：Vite 的 `base` 路径配置不正确

**解决方案**：
- 如果部署在子路径（如 `/repo-name/`），设置 `vite.config.js` 的 `base: '/repo-name/'`
- 如果部署在根域名，设置 `base: '/'`

### 问题 3：环境变量未生效

**现象**：代码中的 `import.meta.env.VITE_*` 变量为 `undefined`

**原因**：部署平台没有配置环境变量

**解决方案**：
- Vercel/Netlify：在平台设置中添加环境变量
- 注意：只有以 `VITE_` 开头的变量才会暴露给客户端

### 问题 4：构建失败

**现象**：部署时构建错误

**解决方案**：
1. 本地先执行 `yarn build`，确保本地构建成功
2. 检查 `package.json` 中的构建脚本
3. 检查 Node.js 版本是否匹配（可在部署平台指定版本）

### 问题 5：HTTPS 证书问题

**现象**：浏览器显示"不安全"警告

**解决方案**：
- Vercel/Netlify：自动提供 HTTPS，检查域名是否正确配置
- 云服务器：确保已配置 SSL 证书（如 Let's Encrypt）

---

## 📚 推荐的部署方案

根据你的需求选择合适的方案：

| 方案 | 适合场景 | 难度 | 成本 |
|------|---------|------|------|
| **Vercel** | 个人项目、快速部署 | ⭐ 简单 | 免费 |
| **Netlify** | 需要表单、函数等功能 | ⭐ 简单 | 免费 |
| **GitHub Pages** | 已有 GitHub 仓库 | ⭐⭐ 中等 | 免费 |
| **云服务器** | 需要完全控制、多个项目 | ⭐⭐⭐ 较难 | 付费 |

### 新手推荐

如果你是第一次部署，强烈推荐使用 **Vercel**：
- 配置最简单，几乎零配置
- 部署速度最快
- 自动 HTTPS 和 CDN
- 支持自动部署（Git 推送即部署）

---

## 🎉 部署完成后的下一步

1. **设置自定义域名**（可选）
   - 在部署平台添加你的域名
   - 配置 DNS 解析

2. **监控和优化**
   - 使用 Google Analytics 或其他工具监控访问
   - 根据访问数据优化性能

3. **持续集成**
   - 配置自动部署（推送代码自动部署）
   - 设置预览部署（PR 自动创建预览环境）

4. **备份**
   - 定期备份代码到 Git 仓库
   - 重要数据（如博客文章）考虑备份到云存储

---

## 💡 总结

这个 React + Vite 项目是纯前端应用，部署非常简单。推荐顺序：

1. **首选**：Vercel（最简单、最快）
2. **备选**：Netlify（功能更多）
3. **进阶**：云服务器（需要更多控制时）

无论选择哪种方案，关键点都是：
- ✅ 正确配置 SPA 路由重定向
- ✅ 设置正确的 base 路径（如果部署在子路径）
- ✅ 确保环境变量正确配置
- ✅ 部署后进行全面测试

祝你部署顺利！🎊
