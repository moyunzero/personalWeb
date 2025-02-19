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
│   │   └── Blog.jsx     # 博客页
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

## 🚀 快速开始

1. **克隆项目**
```bash
git clone [repository-url]
cd zero-web
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

1. **构建项目**
```bash
yarn build
```

2. **预览构建结果**
```bash
yarn preview
```

3. **部署**
- 将 `dist` 目录部署到服务器
- 确保服务器配置了正确的路由重定向
- 配置适当的缓存策略

## 📄 许可证

MIT
