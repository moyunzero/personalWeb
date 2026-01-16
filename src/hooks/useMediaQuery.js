import { useState, useEffect } from 'react';
import { LAYOUT } from '../constants/styles';

/**
 * 响应式布局 Hook
 * @param {string} query - 媒体查询字符串
 * @returns {boolean} 是否匹配
 */
export const useMediaQuery = (query) => {
    // 使用懒初始化，避免 SSR 问题
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        // SSR 检查
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        
        // 设置初始值
        setMatches(media.matches);

        const listener = (event) => {
            setMatches(event.matches);
        };

        // 使用现代 API（如果支持）
        if (media.addEventListener) {
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        } else {
            // 兼容旧浏览器
            media.addListener(listener);
            return () => media.removeListener(listener);
        }
    }, [query]); // 只依赖 query，不依赖 matches

    return matches;
};

// 预定义的响应式断点
export const useBreakpoint = () => {
    const isMobile = useMediaQuery(`(max-width: ${LAYOUT.breakpoints.sm})`);
    const isTablet = useMediaQuery(`(min-width: ${LAYOUT.breakpoints.sm}) and (max-width: ${LAYOUT.breakpoints.lg})`);
    const isDesktop = useMediaQuery(`(min-width: ${LAYOUT.breakpoints.lg})`);

    return { isMobile, isTablet, isDesktop };
}; 