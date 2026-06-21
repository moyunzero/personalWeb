import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';

// Legacy Vite SPA routes — production site uses Astro (yarn dev / yarn build).
const Home = lazy(() => import('../pages/_Home'));
const Blog = lazy(() => import('../pages/_Blog'));
const BlogDetail = lazy(() => import('../pages/_BlogDetail'));

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