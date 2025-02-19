import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';

// 懒加载页面组件
const Home = lazy(() => import('../pages/Home'));
const Blog = lazy(() => import('../pages/Blog'));

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
    ],
};

// 导航配置
export const navigation = routes.children.map(({ path, title }) => ({
    name: title,
    path: path || '/',
}));

// 获取当前路由的标题
export const getRouteTitle = (pathname) => {
    const route = routes[0].children.find(
        route => route.path === pathname || (route.index && pathname === '/')
    );
    return route?.title || '个人网站';
}; 