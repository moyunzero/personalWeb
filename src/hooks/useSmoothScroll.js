import { useCallback } from 'react';

/**
 * 滚动偏移量常量
 */
export const SCROLL_OFFSET = 80;

/**
 * 平滑滚动 Hook
 * 提供统一的滚动到指定元素的功能
 * @returns {Function} 滚动函数
 */
export const useSmoothScroll = () => {
    const scrollToElement = useCallback((elementId, offset = SCROLL_OFFSET) => {
        if (typeof window === 'undefined') return;
        
        const element = document.getElementById(elementId);
        if (element) {
            const elementTop = element.offsetTop;
            const scrollPosition = elementTop - offset;
            
            window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }, []);

    return scrollToElement;
};
