import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';

export const useScrollToTop = () => {
    const location = useLocation();

    // 处理路由变化时的滚动
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [location]);

    // 初始化 Lenis
    useEffect(() => {
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

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);
}; 