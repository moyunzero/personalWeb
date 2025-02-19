/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
        const context = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(context, args), delay);
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
        const context = this;
        if (!inThrottle) {
            fn.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}; 