# 墨韵 - 个人网站

基于 React 18 和 Vite 构建的现代化个人网站，展示作品集、博客和个人技能。项目采用最新的前端技术栈，注重性能优化和用户体验。

## 🚀 技术栈

- **核心框架**: React 18
- **构建工具**: Vite
- **路由管理**: React Router v7
- **样式解决方案**: TailwindCSS
- **动画效果**: GSAP
- **滚动优化**: Lenis
- **代码规范**: ESLint
- **类型检查**: PropTypes
- **Markdown 解析**: react-markdown
- **代码高亮**: highlight.js

## 📁 项目结构

```
zero-web/
├── src/
│   ├── assets/            # 静态资源（图片、字体等）
│   ├── components/        # 组件目录
│   │   ├── common/       # 通用组件
│   │   └── home/         # 首页相关组件
│   ├── constants/        # 常量配置
│   │   └── styles.js     # 样式常量（颜色、间距、字体等）
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useScrollToTop.js  # 滚动处理
│   │   └── useMediaQuery.js   # 响应式布局
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   │   ├── Home.jsx     # 首页
│   │   ├── Blog.jsx     # 博客列表页
│   │   └── BlogDetail.jsx # 博客详情页
│   ├── components/       # 组件目录
│   │   ├── blog/        # 博客相关组件
│   │   │   ├── BlogNavbar.jsx # 博客导航栏
│   │   │   └── BlogEditor.jsx # 博客编辑器
│   ├── data/            # 数据文件
│   │   └── blogs.js     # 博客文章数据
│   ├── routes/          # 路由配置
│   ├── utils/           # 工具函数（防抖、节流等）
│   ├── App.jsx          # 应用入口
│   └── main.jsx         # 主入口文件
```

## ✨ 核心特性

- 🎯 **性能优化**
  - 路由懒加载
  - 组件记忆化
  - 图片懒加载
  - 滚动性能优化

- 📱 **响应式设计**
  - 移动端优先
  - 断点管理
  - 媒体查询封装

- 🎨 **现代化 UI**
  - TailwindCSS 样式
  - GSAP 动画
  - 平滑滚动
  - 主题定制

- 🛡️ **可靠性**
  - 错误边界处理
  - PropTypes 类型检查
  - 统一的错误处理
  - 加载状态反馈

- ✍️ **博客系统**
  - Markdown 编辑器
  - 实时预览
  - 一键发布
  - 代码高亮
  - 标签管理


## 🚀 快速开始

1. **克隆项目**
```bash
git clone [repository-url]
```

2. **安装依赖**
```bash
yarn install
```

3. **开发环境运行**
```bash
yarn dev
```

4. **生产环境构建**
```bash
yarn build
```

## ⚙️ 环境配置

在项目根目录创建 `.env` 文件：

```env
# API配置
VITE_API_URL=http://localhost:3000

# 环境标识
VITE_ENV=development

# 应用配置
VITE_APP_TITLE=墨韵
VITE_APP_DESCRIPTION=展示作品、博客和技能的个人网站
```

## 📝 博客功能使用指南

### 如何写博客文章

1. **访问编辑器**
   - 在博客列表页面点击"写文章"按钮
   - 或直接访问 `/blog/editor` 路由

2. **编辑文章**
   - 填写文章基本信息（标题、简介、作者、日期等）
   - 使用 Markdown 格式编写文章内容
   - 右侧实时预览效果

3. **保存和发布**
   - **保存草稿**：文章会保存到浏览器本地存储
   - **导出 JSON**：导出文章数据，可手动添加到 `src/data/blogs.js`
   - **一键发布**：文章会保存到 localStorage，立即在博客列表显示

### Markdown 语法支持

编辑器支持完整的 Markdown 语法：
- 标题（# ## ###）
- 列表（有序、无序）
- 代码块（支持语法高亮）
- 链接和图片
- 粗体、斜体
- 表格
- 引用块

### 永久保存文章

由于这是纯前端项目，文章默认保存在浏览器 localStorage 中。要永久保存：

1. **方法一：手动添加到代码**
   - 点击"导出 JSON"按钮
   - 将导出的 JSON 内容添加到 `src/data/blogs.js` 文件的 `blogs` 数组中

2. **方法二：集成后端 API**
   - 修改 `src/services/api.js` 中的 `blogApi`
   - 实现后端接口来持久化存储文章

### 博客数据结构

每篇博客文章包含以下字段：
```javascript
{
  id: '文章ID（用于URL）',
  title: '文章标题',
  description: '文章简介',
  author: '作者名称',
  publishDate: '发布日期（YYYY-MM-DD）',
  tags: ['标签1', '标签2'],
  readTime: 5, // 预计阅读时间（分钟，可选）
  content: 'Markdown 格式的文章内容'
}
```

## 📖 开发指南

### 组件开发规范
- 使用函数组件和 Hooks
- 必要时使用 React.memo() 优化性能
- 使用 PropTypes 进行类型检查
- 组件文件使用 .jsx 扩展名
- 遵循单一职责原则

### 样式开发规范
- 优先使用 TailwindCSS 类名
- 遵循 styles.js 中的预定义常量
- 使用语义化的类名
- 保持样式的可复用性

### 性能优化实践
- 合理使用 React.lazy() 和 Suspense
- 使用 useCallback 和 useMemo 优化性能
- 图片使用 loading="lazy" 属性
- 使用防抖和节流控制事件频率

### 工具函数使用
- 从 utils/index.js 导入通用函数
- 使用 JSDoc 注释保持文档完整性
- 遵循函数式编程原则
- 保持函数的纯粹性

## 🔧 构建部署

### 本地构建

1. **构建项目**
```bash
yarn build
```
构建完成后，会在项目根目录生成 `dist` 文件夹，包含所有需要部署的静态文件。

2. **预览构建结果**
```bash
yarn preview
```
在浏览器中打开显示的地址（通常是 `http://localhost:4173`），检查构建结果是否正常。

### 线上部署

详细的部署指南请查看 [**DEPLOYMENT.md**](./DEPLOYMENT.md) 文档。

**快速部署方案推荐：**

- 🌟 **Vercel**（推荐新手）- 零配置，5分钟完成部署
- 🚀 **Netlify** - 功能丰富，支持表单和函数
- 📄 **GitHub Pages** - 适合已有 GitHub 仓库的项目
- 🖥️ **云服务器 (Nginx)** - 完全控制，适合有服务器经验的开发者

**部署步骤概览：**
1. 构建项目：`yarn build`
2. 选择部署平台（推荐 Vercel）
3. 按照 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的详细步骤操作
4. 部署完成后检查路由、移动端适配等功能

详细步骤、配置说明、常见问题排查等，请查看 [**DEPLOYMENT.md**](./DEPLOYMENT.md)。

## 📄 许可证

MIT
