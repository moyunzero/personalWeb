import { useState, useEffect, useRef, useCallback, type ComponentType } from 'react';

let phaserPrefetchStarted = false;

function prefetchPhaserBundle() {
    if (phaserPrefetchStarted) return;
    phaserPrefetchStarted = true;
    void import('phaser');
    void import('../../game/scenes/GameScene');
}

type GameUiModule = {
    GameTooltip: ComponentType;
    ChatTrigger: ComponentType;
    ChatPanel: ComponentType;
};

export default function GameIsland() {
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gameUi, setGameUi] = useState<GameUiModule | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<import('phaser').Game | null>(null);

    useEffect(() => {
        if (!started) return;

        let cancelled = false;
        setLoading(true);

        void Promise.all([
            import('phaser'),
            import('../../game/scenes/GameScene'),
            import('../../game/GameTooltip'),
            import('../chat/ChatTrigger'),
            import('../chat/ChatPanel'),
        ]).then(
            ([
                { default: Phaser },
                { default: GameScene },
                { default: GameTooltip },
                { default: ChatTrigger },
                { default: ChatPanel },
            ]) => {
                if (cancelled || !containerRef.current) return;

                setGameUi({ GameTooltip, ChatTrigger, ChatPanel });

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
                setLoading(false);
            },
        );

        return () => {
            cancelled = true;
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [started]);

    const onWarmup = useCallback(() => {
        prefetchPhaserBundle();
    }, []);

    const onStart = useCallback(() => {
        prefetchPhaserBundle();
        setStarted(true);
    }, []);

    if (!started) {
        return (
            <button
                type="button"
                data-no-cosmos
                onClick={onStart}
                onPointerEnter={onWarmup}
                onFocus={onWarmup}
                className="fixed bottom-6 left-6 z-[100] px-4 py-2 rounded-xl bg-zinc-800/90 text-sm text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-zinc-700 transition-colors"
                aria-label="点击启动忍者小游戏"
            >
                点击启动忍者 🥷
            </button>
        );
    }

    const { GameTooltip, ChatTrigger, ChatPanel } = gameUi ?? {};

    return (
        <>
            <div
                ref={containerRef}
                id="phaser-container"
                data-no-cosmos
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                }}
            />
            {loading ? (
                <div
                    data-no-cosmos
                    className="fixed bottom-6 left-6 z-[100] px-4 py-2 rounded-xl bg-zinc-800/90 text-sm text-cyan-300 ring-1 ring-cyan-400/30"
                    aria-live="polite"
                >
                    忍者登场中…
                </div>
            ) : null}
            {GameTooltip ? <GameTooltip /> : null}
            {ChatTrigger ? <ChatTrigger /> : null}
            {ChatPanel ? <ChatPanel /> : null}
        </>
    );
}
