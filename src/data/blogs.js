/**
 * 博客文章数据
 * 
 * 每篇博客文章包含以下字段：
 * - id: 唯一标识符（用于路由）
 * - title: 文章标题
 * - description: 文章简介（显示在列表页）
 * - author: 作者名称
 * - publishDate: 发布日期（格式：YYYY-MM-DD）
 * - updateDate: 更新日期（可选）
 * - tags: 标签数组
 * - coverImage: 封面图片路径（可选）
 * - content: Markdown 格式的文章内容
 * - readTime: 预计阅读时间（分钟，可选）
 */

export const blogs = [
    {
        id: 'getting-started-with-react',
        title: 'React 入门指南',
        description: '这是一篇关于 React 基础知识的入门教程，适合初学者学习。',
        author: '墨韵',
        publishDate: '2024-03-21',
        tags: ['React', '前端', '教程'],
        readTime: 5,
        content: `# React 入门指南

欢迎来到 React 的世界！React 是一个用于构建用户界面的 JavaScript 库。

## 什么是 React？

React 是由 Facebook 开发的一个用于构建用户界面的 JavaScript 库。它采用组件化的开发方式，让代码更加模块化和可复用。

## 核心概念

### 1. 组件（Components）

组件是 React 的核心概念。你可以将 UI 拆分成独立的、可复用的部分。

\`\`\`jsx
function Welcome() {
  return <h1>Hello, World!</h1>;
}
\`\`\`

### 2. JSX

JSX 是 JavaScript 的语法扩展，它让你可以在 JavaScript 中写类似 HTML 的代码。

### 3. Props

Props 是组件之间传递数据的方式。

\`\`\`jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
\`\`\`

## 总结

React 让前端开发变得更加简单和高效。通过组件化的方式，我们可以构建出复杂而优雅的用户界面。

希望这篇指南能帮助你开始 React 的学习之旅！`
    },
    {
        id: 'modern-web-development',
        title: '现代 Web 开发实践',
        description: '探讨现代 Web 开发的最佳实践和工具链。',
        author: '墨韵',
        publishDate: '2024-03-20',
        tags: ['Web开发', '最佳实践'],
        readTime: 8,
        content: `# 现代 Web 开发实践

现代 Web 开发已经发生了翻天覆地的变化。本文将探讨一些最佳实践。

## 工具链

现代 Web 开发离不开强大的工具链：

- **构建工具**: Vite, Webpack, Rollup
- **框架**: React, Vue, Angular
- **样式**: TailwindCSS, CSS Modules
- **类型检查**: TypeScript

## 开发流程

1. 项目初始化
2. 开发环境配置
3. 代码编写
4. 测试与调试
5. 构建与部署

## 性能优化

- 代码分割
- 懒加载
- 图片优化
- CDN 加速

## 总结

遵循最佳实践可以让你的 Web 应用更加高效和可维护。`
    }
];

/**
 * 根据 ID 获取博客文章
 * @param {string} id - 博客文章 ID
 * @returns {Object|null} 博客文章对象，如果不存在则返回 null
 */
export const getBlogById = (id) => {
    return blogs.find(blog => blog.id === id) || null;
};

/**
 * 获取所有博客文章（按发布日期倒序）
 * @returns {Array} 博客文章数组
 */
export const getAllBlogs = () => {
    return [...blogs].sort((a, b) => {
        return new Date(b.publishDate) - new Date(a.publishDate);
    });
};

/**
 * 根据标签获取博客文章
 * @param {string} tag - 标签名称
 * @returns {Array} 匹配的博客文章数组
 */
export const getBlogsByTag = (tag) => {
    return blogs.filter(blog => blog.tags.includes(tag));
};
