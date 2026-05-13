import { useEffect, useState } from 'react';

/**
 * ChatTrigger — 忍者点击触发聊天面板
 * --------------------
 * 实现要点：
 * 1. Phaser canvas 设置了 pointer-events: none（见 PhaserGame.jsx），点击事件会穿透。
 *    因此本组件创建一个独立的透明命中区 div，覆盖在忍者精灵上方，提供可点击区域。
 * 2. 命中区位置实时跟随 window.__shinobiRect（GameScene 每帧导出忍者的视口包围盒）。
 * 3. 点击后打开聊天面板（codex-chat:open）。
 * 4. hover 时在忍者头顶显示气泡提示（仅桌面端，移动端无 hover）。
 */
const HIT_PADDING = 12; // 命中区比精灵大一些，方便点击
const SYNC_INTERVAL = 100; // ms

const ChatTrigger = () => {
    const [rect, setRect] = useState(null);
    const [hovered, setHovered] = useState(false);

    // 同步忍者位置
    useEffect(() => {
        const sync = () => {
            const r = window.__shinobiRect;
            if (
                r &&
                typeof r.left === 'number' &&
                typeof r.right === 'number' &&
                r.right > r.left
            ) {
                setRect((prev) => {
                    // 避免无意义的 setState（rect 抖动很频繁）
                    if (
                        prev &&
                        prev.left === r.left &&
                        prev.top === r.top &&
                        prev.right === r.right &&
                        prev.bottom === r.bottom
                    ) {
                        return prev;
                    }
                    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
                });
            } else {
                setRect(null);
            }
        };

        sync();
        const id = window.setInterval(sync, SYNC_INTERVAL);
        return () => window.clearInterval(id);
    }, []);

    const handleClick = () => {
        if (typeof window.openCodexChat === 'function') {
            window.openCodexChat();
        } else {
            // 兜底：直接派发事件
            window.dispatchEvent(new CustomEvent('codex-chat:open'));
        }
    };

    if (!rect) return null;

    const left = rect.left - HIT_PADDING;
    const top = rect.top - HIT_PADDING;
    const width = rect.right - rect.left + HIT_PADDING * 2;
    const height = rect.bottom - rect.top + HIT_PADDING * 2;
    const hintLeft = (rect.left + rect.right) / 2;
    const hintTop = rect.top - 12;

    return (
        <>
            {/* 透明命中区：实际响应点击 */}
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                aria-label="点击和 AI 聊一聊"
                title="聊一下"
                style={{
                    position: 'fixed',
                    left,
                    top,
                    width,
                    height,
                    zIndex: 60, // 高于 Phaser canvas (50)，低于 GameTooltip (200) 和 ChatPanel (90)
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                }}
            />

            {/* 头顶提示气泡 */}
            {hovered && (
                <div
                    role="presentation"
                    style={{
                        position: 'fixed',
                        left: hintLeft,
                        top: hintTop,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 199,
                        pointerEvents: 'none',
                        animation:
                            'chatHintIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '14px',
                            background:
                                'linear-gradient(135deg, rgba(24,24,27,0.92) 0%, rgba(15,23,42,0.95) 100%)',
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            border: '1px solid rgba(34,211,238,0.35)',
                            boxShadow:
                                '0 4px 16px rgba(0,0,0,0.4), 0 0 24px rgba(34,211,238,0.15)',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'rgba(186,230,253,0.95)',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.02em',
                        }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: 'rgba(34,211,238,1)',
                                boxShadow: '0 0 8px rgba(34,211,238,0.8)',
                                animation: 'glow-pulse 1.5s ease-in-out infinite',
                            }}
                        />
                        点我聊一下
                    </div>
                    {/* 小三角箭头 */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: -5,
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: 8,
                            height: 8,
                            background: 'rgba(15,23,42,0.95)',
                            borderRight: '1px solid rgba(34,211,238,0.35)',
                            borderBottom: '1px solid rgba(34,211,238,0.35)',
                        }}
                    />
                </div>
            )}
        </>
    );
};

export default ChatTrigger;
