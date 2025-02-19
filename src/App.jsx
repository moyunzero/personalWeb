/**
 * Node Modules
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { useScrollToTop } from './hooks/useScrollToTop';

// 使用懒加载替换直接导入
const Home = lazy(() => import('./pages/Home'));
const Blog = lazy(() => import('./pages/Blog'));

// 创建一个新组件来处理滚动
const ScrollHandler = () => {
    useScrollToTop();
    return null;
};

const App = () => {
    return (
        <ErrorBoundary>
            <Router>
                <ScrollHandler />
                <Suspense fallback={
                    <div className="w-full h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400"></div>
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="blog" element={<Blog />} />
                        </Route>
                    </Routes>
                </Suspense>
            </Router>
        </ErrorBoundary>
    );
};

export default App;