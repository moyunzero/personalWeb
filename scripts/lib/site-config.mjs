/** @type {{ name: string, title: string, description: string, url: string, author: string, language: string, basePath: string }} */
export const SITE = {
    name: '墨韵',
    title: '墨韵 · 博客',
    description: '日常、笔记与思考 — 技术文章、阅读笔记与开发实践。',
    url: (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://moyunzero.github.io/personalWeb').replace(/\/$/, ''),
    author: '墨韵',
    language: 'zh-CN',
    basePath: '/personalWeb',
};
