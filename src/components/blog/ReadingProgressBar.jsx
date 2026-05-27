import { useReadingProgress } from '../../hooks/useReadingProgress';

/**
 * 固定在导航栏下方的阅读进度条（仅博客详情等长文页使用）
 */
const ReadingProgressBar = () => {
    const progress = useReadingProgress();

    return (
        <div
            className="pointer-events-none fixed left-0 top-20 z-50 h-0.5 w-full bg-zinc-800/80"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="阅读进度"
        >
            <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default ReadingProgressBar;
