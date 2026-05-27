import { useEffect, useState } from 'react';

/**
 * 页面滚动阅读进度 0–100
 */
export function useReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const max = scrollHeight - clientHeight;
            setProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
        };

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return progress;
}
