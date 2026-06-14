import { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';

let mermaidInitialized = false;

/** 串行化 Mermaid 渲染，避免同页多图并发导致偶发失败 */
let renderQueue = Promise.resolve();

/**
 * @template T
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
function enqueueMermaidRender(task) {
    const next = renderQueue.then(task, task);
    renderQueue = next.catch(() => {});
    return next;
}

/**
 * 懒加载并初始化 Mermaid（暗色主题，与博客样式一致）
 * @returns {Promise<import('mermaid').default>}
 */
async function ensureMermaid() {
    const mermaid = (await import('mermaid')).default;
    if (!mermaidInitialized) {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'inherit',
        });
        mermaidInitialized = true;
    }
    return mermaid;
}

/**
 * 将 Markdown 中的 Mermaid 代码块渲染为 SVG 图表
 */
function MermaidDiagram({ chart }) {
    const reactId = useId().replace(/:/g, '');
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const source = chart?.trim() ?? '';

        if (!source) {
            setSvg('');
            setError(null);
            return undefined;
        }

        async function render() {
            setError(null);
            setSvg('');

            try {
                const { svg: rendered } = await enqueueMermaidRender(async () => {
                    const mermaid = await ensureMermaid();
                    const renderId = `mermaid-${reactId}-${Date.now()}`;
                    return mermaid.render(renderId, source);
                });
                if (!cancelled) {
                    setSvg(rendered);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : '图表渲染失败');
                }
            }
        }

        render();

        return () => {
            cancelled = true;
        };
    }, [chart, reactId]);

    if (error) {
        return (
            <div
                className="my-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
                role="img"
                aria-label="Mermaid 图表渲染失败"
            >
                <p className="mb-2 text-sm text-amber-300">Mermaid 图表渲染失败</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-400">{chart}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div
                className="my-8 flex min-h-[120px] items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950 text-sm text-zinc-500"
                aria-busy="true"
                aria-label="正在加载图表"
            >
                正在加载图表…
            </div>
        );
    }

    return (
        <div
            className="my-8 flex justify-center overflow-x-auto rounded-xl border border-zinc-700/80 bg-zinc-950 p-6 [&_svg]:max-w-full"
            role="img"
            aria-label="Mermaid diagram"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

MermaidDiagram.propTypes = {
    chart: PropTypes.string.isRequired,
};

export default MermaidDiagram;
