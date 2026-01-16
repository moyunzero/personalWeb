import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';

export const useScrollToTop = () => {
    const location = useLocation();

    // 处理路由变化时的滚动
    useEffect(() => {
        // SSR 检查
        if (typeof window === 'undefined') return;
        
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [location]);

    // 初始化 Lenis（当前配置几乎禁用所有功能，评估是否需要）
    useEffect(() => {
        // SSR 检查
        if (typeof window === 'undefined') return;
        
        // 由于 Lenis 配置几乎禁用所有功能，可以考虑移除
        // 但为了保持平滑滚动的一致性，暂时保留
        const lenis = new Lenis({
            duration: 0,
            easing: t => t,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: false,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 1,
            infinite: false,
        });

        let rafId;
        function raf(time) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            lenis.destroy();
        };
    }, []);
}; 