import { Children, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import PropTypes from 'prop-types';
import { normalizeMarkdown } from '../../blog/normalizeMarkdown';
import { resolveBlogAsset } from '../../blog/utils';
import MermaidDiagram from './MermaidDiagram';

import 'highlight.js/styles/github-dark.css';

const PROSE_CLASS = `prose prose-invert prose-lg max-w-none
    prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight
    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-zinc-700/60
    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
    prose-p:text-zinc-300 prose-p:leading-[1.85] prose-p:my-5
    prose-a:text-sky-400 prose-a:no-underline hover:prose-a:text-sky-300 hover:prose-a:underline
    prose-strong:text-white prose-strong:font-semibold
    prose-code:text-sky-300 prose-code:bg-zinc-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
    prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-700/80 prose-pre:my-8 prose-pre:rounded-xl
    prose-blockquote:border-l-sky-500 prose-blockquote:text-zinc-400 prose-blockquote:bg-zinc-800/30
    prose-blockquote:py-2 prose-blockquote:px-1 prose-blockquote:rounded-r prose-blockquote:not-italic
    prose-ul:text-zinc-300 prose-ol:text-zinc-300 prose-li:text-zinc-300 prose-li:my-1.5
    prose-ul:my-5 prose-ol:my-5
    prose-img:my-0 prose-hr:border-zinc-700/80 prose-hr:my-10`;

function MarkdownImage({ src, alt, title, ...props }) {
    const [failed, setFailed] = useState(false);
    const resolvedSrc = useMemo(() => resolveBlogAsset(src) ?? src, [src]);

    if (!resolvedSrc || failed) {
        return (
            <div
                className="my-8 flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-600/80 bg-zinc-900/60 px-4 py-6 text-center text-sm text-zinc-500"
                role="img"
                aria-label={alt || '图片无法加载'}
            >
                <span>图片无法加载</span>
                {alt ? <span className="max-w-md truncate text-xs text-zinc-600">{alt}</span> : null}
            </div>
        );
    }

    return (
        <img
            src={resolvedSrc}
            alt={alt ?? ''}
            title={title}
            loading="lazy"
            decoding="async"
            className="my-8 w-full rounded-xl border border-zinc-700/50 bg-zinc-900/40"
            onError={() => setFailed(true)}
            {...props}
        />
    );
}

MarkdownImage.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string,
    title: PropTypes.string,
};

function CodeBlock({ children, ...props }) {
    const preRef = useRef(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const codeEl = preRef.current?.querySelector('code');
        const text = codeEl?.innerText ?? preRef.current?.innerText ?? '';
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard 不可用时静默失败
        }
    };

    return (
        <div className="group relative my-8">
            <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 top-3 z-10 rounded-md border border-zinc-600 bg-zinc-800/90 px-2.5 py-1 text-xs text-zinc-300 opacity-0 transition-opacity hover:border-zinc-500 hover:text-white focus:opacity-100 group-hover:opacity-100"
                aria-label={copied ? '已复制' : '复制代码'}
            >
                {copied ? '已复制' : '复制'}
            </button>
            <pre
                ref={preRef}
                className="!my-0 overflow-x-auto rounded-xl border border-zinc-700/80 bg-zinc-950 p-4 pt-10 text-sm"
                {...props}
            >
                {children}
            </pre>
        </div>
    );
}

CodeBlock.propTypes = {
    children: PropTypes.node,
};

/**
 * 从 react-markdown 的 <pre><code> 子节点提取 Mermaid 源码
 * @param {import('react').ReactNode} children
 * @returns {string | null}
 */
function extractMermaidChart(children) {
    const child = Children.only(children);
    if (!child || typeof child !== 'object' || !('props' in child)) {
        return null;
    }

    const className = child.props?.className ?? '';
    if (!String(className).includes('language-mermaid')) {
        return null;
    }

    return String(child.props.children ?? '').replace(/\n$/, '').trim();
}

function PreBlock({ children, ...props }) {
    const chart = extractMermaidChart(children);
    if (chart) {
        return <MermaidDiagram chart={chart} />;
    }

    return <CodeBlock {...props}>{children}</CodeBlock>;
}

PreBlock.propTypes = {
    children: PropTypes.node,
};

/**
 * 统一 Markdown 渲染（编辑器预览 + 文章详情）
 */
const MarkdownContent = ({ content, className = '' }) => {
    const prepared = useMemo(() => normalizeMarkdown(content), [content]);

    if (!prepared) {
        return null;
    }

    return (
        <div className={`${PROSE_CLASS} ${className}`.trim()}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                components={{
                    img: MarkdownImage,
                    pre: PreBlock,
                    a: ({ href, children, ...props }) => (
                        <a
                            href={href}
                            target={href?.startsWith('http') ? '_blank' : undefined}
                            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {prepared}
            </ReactMarkdown>
        </div>
    );
};

MarkdownContent.propTypes = {
    content: PropTypes.string,
    className: PropTypes.string,
};

export default MarkdownContent;
