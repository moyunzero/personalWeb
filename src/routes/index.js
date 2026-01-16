import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';

// 懒加载页面组件
const Home = lazy(() => import('../pages/Home'));
const Blog = lazy(() => import('../pages/Blog'));
const BlogDetail = lazy(() => import('../pages/BlogDetail'));
const BlogEditor = lazy(() => import('../components/blog/BlogEditor'));

// 路由配置
export const routes = {
    element: MainLayout,
    children: [
        {
            index: true,
            path: '/',
            element: Home,
            title: '首页',
        },
        {
            path: '/blog',
            element: Blog,
            title: '博客',
        },
        {
            path: '/blog/:id',
            element: BlogDetail,
            title: '博客详情',
        },
        {
            path: '/blog/editor',
            element: BlogEditor,
            title: '博客编辑器',
        },
    ],
};

// 导航配置
export const navigation = routes.children.map(({ path, title }) => ({
    name: title,
    path: path || '/',
}));

// 获取当前路由的标题
export const getRouteTitle = (pathname) => {
    const route = routes.children.find(
        route => route.path === pathname || (route.index && pathname === '/')
    );
    return route?.title || '个人网站';
}; 