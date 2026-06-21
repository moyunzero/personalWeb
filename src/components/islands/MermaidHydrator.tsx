import { useEffect } from 'react';

let mermaidInitialized = false;
let renderQueue = Promise.resolve();

function enqueueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
    const next = renderQueue.then(task, task);
    renderQueue = next.catch(() => {});
    return next;
}

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

function decodeMermaidPayload(base64: string): string {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

/** Hydrates `.mermaid-diagram-host[data-mermaid]` placeholders from SSG HTML. */
export default function MermaidHydrator() {
    useEffect(() => {
        const hosts = document.querySelectorAll<HTMLElement>('.mermaid-diagram-host[data-mermaid]');
        if (!hosts.length) return;

        let cancelled = false;

        const run = async () => {
            const mermaid = await ensureMermaid();
            let counter = 0;

            for (const host of hosts) {
                const payload = host.dataset.mermaid;
                if (!payload) continue;

                const chart = decodeMermaidPayload(payload);
                host.removeAttribute('aria-busy');
                host.textContent = '';

                try {
                    const { svg } = await enqueueMermaidRender(() =>
                        mermaid.render(`mermaid-hydrate-${counter++}`, chart),
                    );
                    if (cancelled) return;
                    host.classList.add('mermaid-diagram');
                    host.innerHTML = svg;
                } catch (err) {
                    if (cancelled) return;
                    const message = err instanceof Error ? err.message : '图表渲染失败';
                    host.classList.add('border-amber-500/30', 'bg-amber-500/5');
                    host.innerHTML = `<p class="mb-2 text-sm text-amber-300">Mermaid 图表渲染失败: ${message}</p><pre class="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-400">${chart}</pre>`;
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
