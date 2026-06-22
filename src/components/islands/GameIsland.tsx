import { useState, useEffect, useRef } from 'react';
import GameTooltip from '../../game/GameTooltip';
import ChatTrigger from '../chat/ChatTrigger';
import ChatPanel from '../chat/ChatPanel';

export default function GameIsland() {
    const [started, setStarted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<import('phaser').Game | null>(null);

    useEffect(() => {
        if (!started) return;

        let cancelled = false;

        (async () => {
            const [{ default: Phaser }, { default: GameScene }] = await Promise.all([
                import('phaser'),
                import('../../game/scenes/GameScene'),
            ]);

            if (cancelled || !containerRef.current) return;

            const game = new Phaser.Game({
                type: Phaser.AUTO,
                transparent: true,
                backgroundColor: 'rgba(0,0,0,0)',
                parent: containerRef.current,
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 800 },
                        debug: false,
                    },
                },
                scene: [GameScene],
                banner: false,
            });

            gameRef.current = game;
        })();

        return () => {
            cancelled = true;
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [started]);

    if (!started) {
        return (
            <button
                type="button"
                onClick={() => setStarted(true)}
                className="fixed bottom-6 left-6 z-[100] px-4 py-2 rounded-xl bg-zinc-800/90 text-sm text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-zinc-700 transition-colors"
                aria-label="点击启动忍者小游戏"
            >
                点击启动忍者 🥷
            </button>
        );
    }

    return (
        <>
            <div
                ref={containerRef}
                id="phaser-container"
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                }}
            />
            <GameTooltip />
            <ChatTrigger />
            <ChatPanel />
        </>
    );
}
