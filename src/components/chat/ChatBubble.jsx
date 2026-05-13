import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

/**
 * 聊天消息气泡组件
 *
 * 视觉规范：
 * - 用户消息：右对齐，sky-500 实色填充，白色文字
 * - AI 消息：左对齐，zinc-800/70 玻璃质感 + cyan-400/30 边框（呼应忍者 cyber 主题）
 * - 流式输出时尾部显示闪烁光标 `▍`
 */
const ChatBubble = ({ role, content, streaming = false, error = false }) => {
    const isUser = role === 'user';
    const isAssistant = role === 'assistant';

    return (
        <div
            className={`flex w-full items-start gap-2.5 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
        >
            {/* 头像圆环 */}
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isUser
                        ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40'
                        : 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40'
                }`}
                aria-hidden="true"
            >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                    {isUser ? 'person' : 'smart_toy'}
                </span>
            </div>

            {/* 气泡主体 */}
            <div
                className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                        ? 'bg-sky-500 text-white'
                        : error
                          ? 'border border-rose-500/40 bg-rose-500/10 text-rose-200'
                          : 'border border-cyan-400/20 bg-zinc-800/70 text-zinc-100 backdrop-blur-sm'
                }`}
            >
                {isAssistant && !error ? (
                    <div className="markdown-chat">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                // 链接强制新开页签（解构 node 丢弃，避免传到 DOM）
                                // eslint-disable-next-line no-unused-vars
                                a: ({ node, ...props }) => (
                                    <a
                                        {...props}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-400 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-300"
                                    />
                                ),
                                // 段落紧凑一些
                                // eslint-disable-next-line no-unused-vars
                                p: ({ node, ...props }) => (
                                    <p {...props} className="mb-2 last:mb-0" />
                                ),
                                // 代码块基本样式
                                code: ({ inline, className, children, ...props }) =>
                                    inline ? (
                                        <code
                                            {...props}
                                            className="rounded bg-zinc-900/70 px-1 py-0.5 text-xs text-cyan-200"
                                        >
                                            {children}
                                        </code>
                                    ) : (
                                        <code
                                            {...props}
                                            className={`${className || ''} block overflow-x-auto rounded-lg bg-zinc-900/80 p-2 text-xs`}
                                        >
                                            {children}
                                        </code>
                                    ),
                                // eslint-disable-next-line no-unused-vars
                                ul: ({ node, ...props }) => (
                                    <ul
                                        {...props}
                                        className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0"
                                    />
                                ),
                                // eslint-disable-next-line no-unused-vars
                                ol: ({ node, ...props }) => (
                                    <ol
                                        {...props}
                                        className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0"
                                    />
                                ),
                            }}
                        >
                            {content || ''}
                        </ReactMarkdown>
                        {streaming && (
                            <span
                                className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-cyan-400 align-middle"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap break-words">{content}</p>
                )}
            </div>
        </div>
    );
};

ChatBubble.propTypes = {
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    streaming: PropTypes.bool,
    error: PropTypes.bool,
};

export default ChatBubble;
