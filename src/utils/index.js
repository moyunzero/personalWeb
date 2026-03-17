/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
};

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}; 

/**
 * 获取 public 目录下资源的正确路径（兼容 GitHub Pages 子路径部署）
 * @param {string} path - 以 / 开头的路径，如 /images/logo.svg
 * @returns {string} 带 base 前缀的完整路径
 */
export const getAssetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
