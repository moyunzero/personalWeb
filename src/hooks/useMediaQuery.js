import { useState, useEffect } from 'react';
import { LAYOUT } from '../constants/styles';

/**
 * 响应式布局 Hook
 * @param {string} query - 媒体查询字符串
 * @returns {boolean} 是否匹配
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
};

// 预定义的响应式断点
export const useBreakpoint = () => {
    const isMobile = useMediaQuery(`(max-width: ${LAYOUT.breakpoints.sm})`);
    const isTablet = useMediaQuery(`(min-width: ${LAYOUT.breakpoints.sm}) and (max-width: ${LAYOUT.breakpoints.lg})`);
    const isDesktop = useMediaQuery(`(min-width: ${LAYOUT.breakpoints.lg})`);

    return { isMobile, isTablet, isDesktop };
}; 