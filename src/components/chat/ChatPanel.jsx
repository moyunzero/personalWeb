import { useState, useEffect, useRef, useCallback } from 'react';
import { streamChat } from '../../services/chatApi';
import ChatBubble from './ChatBubble';

const STORAGE_KEY = 'codex-chat-history';
const MAX_HISTORY = 30; // 最多保存的消息数，避免 localStorage 膨胀

const SUGGESTIONS = [
    { label: '介绍一下「心晴 MO」', value: '介绍一下你的「心晴 MO」项目' },
    { label: '介绍一下你自己', value: '介绍一下你自己，做过哪些有意思的项目？' },
    { label: '最近心情不太好', value: '我最近心情不太好，怎么办？' },
];

const loadHistory = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveHistory = (messages) => {
    try {
        const trimmed = messages.slice(-MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // localStorage 满了或不可用，静默失败
    }
};

/**
 * 聊天面板主体
 * --------------------
 * 监听全局事件 `codex-chat:open` 来打开（可携带 prefill 预填文本）
 * 通过 window.openCodexChat / window.closeCodexChat 暴露命令式 API
 *
 * 状态机：
 * - closed → 不可见
 * - open + idle → 可输入
 * - open + sending → 正在请求 / 流式接收
 */
const ChatPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => loadHistory());
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const listRef = useRef(null);
    const textareaRef = useRef(null);
    const abortRef = useRef(null);

    // ============ 暴露给外部的开关 API ============
    useEffect(() => {
        const handleOpen = (event) => {
            const prefill = event?.detail?.prefill;
            setIsOpen(true);
            if (prefill) {
                setInput(prefill);
                // 等面板渲染完聚焦输入框
                requestAnimationFrame(() => textareaRef.current?.focus());
            }
        };

        const handleClose = () => setIsOpen(false);

        window.addEventListener('codex-chat:open', handleOpen);
        window.addEventListener('codex-chat:close', handleClose);

        window.openCodexChat = (opts) => {
            window.dispatchEvent(
                new CustomEvent('codex-chat:open', { detail: opts || {} })
            );
        };
        window.closeCodexChat = () => {
            window.dispatchEvent(new CustomEvent('codex-chat:close'));
        };

        return () => {
            window.removeEventListener('codex-chat:open', handleOpen);
            window.removeEventListener('codex-chat:close', handleClose);
            delete window.openCodexChat;
            delete window.closeCodexChat;
        };
    }, []);

    // ============ 自动滚到底部 ============
    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, isOpen]);

    // ============ 持久化历史 ============
    useEffect(() => {
        saveHistory(messages);
    }, [messages]);

    // ============ ESC 关闭 ============
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    // ============ 发送消息 ============
    const sendMessage = useCallback(
        async (text) => {
            const content = text?.trim();
            if (!content || sending) return;

            setErrorMsg('');
            setInput('');

            const userMsg = { role: 'user', content };
            // 占位：先塞一条空的 assistant，流式逐步填充
            const assistantPlaceholder = { role: 'assistant', content: '' };

            // 注意：基于上一轮 messages 计算请求历史，避免闭包陷阱
            setMessages((prev) => {
                const next = [...prev, userMsg, assistantPlaceholder];
                return next;
            });

            setSending(true);
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                // 取当前状态构造请求历史（最近若干轮，避免 token 爆炸）
                const historyForRequest = [
                    ...messages.slice(-12), // 仅取最近 12 条作为上下文
                    userMsg,
                ];

                let acc = '';
                for await (const delta of streamChat(historyForRequest, {
                    signal: controller.signal,
                })) {
                    acc += delta;
                    // 更新最后一条 assistant 的内容
                    setMessages((prev) => {
                        const copy = prev.slice();
                        copy[copy.length - 1] = { role: 'assistant', content: acc };
                        return copy;
                    });
                }

                // 流结束，如果没收到任何内容，给个兜底提示
                if (!acc) {
                    setMessages((prev) => {
                        const copy = prev.slice();
                        copy[copy.length - 1] = {
                            role: 'assistant',
                            content: '（没有收到回复，请稍后再试）',
                        };
                        return copy;
                    });
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    // 用户主动取消，保留已经接收到的部分
                    setMessages((prev) => {
                        const copy = prev.slice();
                        const last = copy[copy.length - 1];
                        if (last && last.role === 'assistant' && !last.content) {
                            copy[copy.length - 1] = {
                                role: 'assistant',
                                content: '（已停止生成）',
                            };
                        }
                        return copy;
                    });
                } else {
                    setErrorMsg(err.message || '请求失败');
                    setMessages((prev) => {
                        const copy = prev.slice();
                        copy[copy.length - 1] = {
                            role: 'assistant',
                            content: `请求失败：${err.message || '未知错误'}`,
                        };
                        return copy;
                    });
                }
            } finally {
                setSending(false);
                abortRef.current = null;
            }
        },
        [messages, sending]
    );

    // ============ 中止生成 ============
    const handleStop = () => {
        abortRef.current?.abort();
    };

    // ============ 清空对话 ============
    const handleClear = () => {
        if (sending) return;
        if (messages.length === 0) return;
        setMessages([]);
        setErrorMsg('');
        localStorage.removeItem(STORAGE_KEY);
    };

    // ============ 表单提交 ============
    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e) => {
        // Enter 发送，Shift+Enter 换行
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* 移动端遮罩 */}
            <div
                className="fixed inset-0 z-[88] bg-black/40 backdrop-blur-sm sm:hidden"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            <aside
                role="dialog"
                aria-label="AI 聊天面板"
                className="fixed bottom-0 right-0 z-[90] flex h-[85vh] w-full flex-col overflow-hidden border-cyan-400/20 bg-zinc-900/95 text-zinc-100 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100vh-3rem)] sm:w-[440px] sm:rounded-2xl sm:border"
                style={{
                    animation: 'chatPanelIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* 头部 */}
                <header className="flex items-center justify-between border-b border-zinc-800/80 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/40">
                            <span
                                className="material-symbols-rounded text-cyan-300"
                                style={{ fontSize: 20 }}
                            >
                                forum
                            </span>
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-900" />
                        </div>
                        <div className="leading-tight">
                            <h2 className="text-sm font-semibold text-zinc-100">
                                做个树洞吧～
                            </h2>
                            <p className="text-xs text-zinc-400">
                                了解我的作品，也可以聊心情
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={sending || messages.length === 0}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                            title="清空对话"
                            aria-label="清空对话"
                        >
                            <span
                                className="material-symbols-rounded"
                                style={{ fontSize: 18 }}
                            >
                                delete_sweep
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                            title="关闭（ESC）"
                            aria-label="关闭聊天面板"
                        >
                            <span
                                className="material-symbols-rounded"
                                style={{ fontSize: 18 }}
                            >
                                close
                            </span>
                        </button>
                    </div>
                </header>

                {/* 消息列表 */}
                <div
                    ref={listRef}
                    className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700/60 hover:scrollbar-thumb-zinc-600"
                >
                    {messages.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-400/30">
                                <span
                                    className="material-symbols-rounded text-cyan-300"
                                    style={{ fontSize: 36 }}
                                >
                                    chat_bubble
                                </span>
                            </div>
                            <h3 className="mb-1 text-base font-semibold text-zinc-200">
                                嗨，我是 Mo 的 AI 分身
                            </h3>
                            <p className="mb-5 max-w-[280px] text-xs text-zinc-400">
                                可以聊聊我的项目和经历，也可以做你的树洞。
                                挑一个话题开始吧～
                            </p>
                            <div className="flex w-full flex-col gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s.label}
                                        type="button"
                                        onClick={() => sendMessage(s.value)}
                                        disabled={sending}
                                        className="rounded-xl border border-zinc-700/70 bg-zinc-800/40 px-3 py-2 text-left text-xs text-zinc-200 transition hover:border-cyan-400/40 hover:bg-zinc-800/80 hover:text-cyan-100 disabled:opacity-50"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <ChatBubble
                            key={idx}
                            role={msg.role}
                            content={msg.content}
                            streaming={
                                sending &&
                                idx === messages.length - 1 &&
                                msg.role === 'assistant'
                            }
                            error={
                                msg.role === 'assistant' &&
                                msg.content.startsWith('请求失败：')
                            }
                        />
                    ))}
                </div>

                {/* 错误条 */}
                {errorMsg && (
                    <div className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                        {errorMsg}
                    </div>
                )}

                {/* 输入区 */}
                <form
                    onSubmit={handleSubmit}
                    className="border-t border-zinc-800/80 bg-zinc-900/60 p-3"
                >
                    {/* 输入框
                      * 几何关系（最佳实践）：
                      * - textarea 单行高 = py-3 (12+12) + leading-5 (20) = 44px
                      * - 按钮 h-8 w-8 = 32px
                      * - 上下右间距 = (44-32)/2 = 6px ⇒ bottom-1.5 right-1.5（也是 6px）
                      * - 多行时按钮恒定贴底，textarea 自动撑高
                      */}
                    <div className="relative rounded-xl border border-zinc-700/60 bg-zinc-800/50 transition focus-within:border-cyan-400/50 focus-within:bg-zinc-800/80">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder="按 Enter 发送，Shift+Enter 换行"
                            disabled={sending}
                            className="block w-full resize-none bg-transparent px-3 py-3 pr-12 font-sans text-[13px] leading-5 text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
                            style={{ maxHeight: '120px' }}
                        />
                        {sending ? (
                            <button
                                type="button"
                                onClick={handleStop}
                                className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/80 text-white transition hover:bg-rose-500"
                                title="停止生成"
                                aria-label="停止生成"
                            >
                                <span
                                    className="material-symbols-rounded"
                                    style={{ fontSize: 16 }}
                                >
                                    stop
                                </span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                                title="发送"
                                aria-label="发送消息"
                            >
                                <span
                                    className="material-symbols-rounded"
                                    style={{ fontSize: 16 }}
                                >
                                    send
                                </span>
                            </button>
                        )}
                    </div>
                    <p className="mt-1.5 text-center text-[10px] text-zinc-500">
                        内容由 AI 生成，仅供参考
                    </p>
                </form>
            </aside>
        </>
    );
};

export default ChatPanel;
