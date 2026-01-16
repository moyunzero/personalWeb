/**
 * Node Modules
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';

import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useScrollToTop } from './hooks/useScrollToTop';
import { routes } from './routes';

/**
 * 滚动处理组件
 * 直接在 App 组件中使用 Hook，避免创建额外的组件
 */
const ScrollToTop = () => {
    useScrollToTop();
    return null;
};

/**
 * 渲染路由配置
 */
const renderRoutes = (routeConfig) => {
    return routeConfig.children.map((route) => {
        const RouteComponent = route.element;
        if (route.index) {
            return (
                <Route
                    key="index"
                    index
                    element={<RouteComponent />}
                />
            );
        }
        return (
            <Route
                key={route.path}
                path={route.path}
                element={<RouteComponent />}
            />
        );
    });
};

const App = () => {
    return (
        <ErrorBoundary>
            <Router>
                <ScrollToTop />
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            {renderRoutes(routes)}
                        </Route>
                    </Routes>
                </Suspense>
            </Router>
        </ErrorBoundary>
    );
};

export default App;