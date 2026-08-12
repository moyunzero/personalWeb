import { useState, useEffect, useRef, useCallback, type ComponentType } from 'react';

/** Slow GH Pages cold starts; fail soft so the UI can retry instead of hanging. */
export const PHASER_LOAD_TIMEOUT_MS = 90_000;

let phaserPrefetchStarted = false;

function prefetchPhaserBundle() {
    if (phaserPrefetchStarted) return;
    phaserPrefetchStarted = true;
    void import('phaser');
    void import('../../game/scenes/GameScene');
}

/** Warm Phaser after idle so first paint HDR / cosmos textures are not starved. */
function schedulePrefetchPhaserBundle() {
    if (phaserPrefetchStarted) return;
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => prefetchPhaserBundle(), { timeout: 10_000 });
        return;
    }
    setTimeout(() => prefetchPhaserBundle(), 2500);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (err) => {
                clearTimeout(timer);
                reject(err);
            },
        );
    });
}

type GameUiModule = {
    GameTooltip: ComponentType;
    ChatTrigger: ComponentType;
    ChatPanel: ComponentType;
};

export default function GameIsland() {
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [loadKey, setLoadKey] = useState(0);
    const [gameUi, setGameUi] = useState<GameUiModule | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<import('phaser').Game | null>(null);

    useEffect(() => {
        if (!started) return;

        let cancelled = false;
        setLoading(true);
        setLoadError(false);

        // Critical path only: show the ninja without waiting on chat UI chunks.
        void withTimeout(
            Promise.all([import('phaser'), import('../../game/scenes/GameScene')]),
            PHASER_LOAD_TIMEOUT_MS,
            'phaser',
        )
            .then(([phaserMod, sceneMod]) => {
                if (cancelled || !containerRef.current) return;

                const Phaser = phaserMod.default;
                const GameScene = sceneMod.default;

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
                            gravity: { x: 0, y: 800 },
                            debug: false,
                        },
                    },
                    scene: [GameScene],
                    banner: false,
                });

                gameRef.current = game;
                setLoading(false);

                // Chat / tooltip are optional overlays; load after the sprite is up.
                void Promise.all([
                    import('../../game/GameTooltip'),
                    import('../chat/ChatTrigger'),
                    import('../chat/ChatPanel'),
                ])
                    .then(([tooltipMod, triggerMod, panelMod]) => {
                        if (cancelled) return;
                        setGameUi({
                            GameTooltip: tooltipMod.default,
                            ChatTrigger: triggerMod.default,
                            ChatPanel: panelMod.default,
                        });
                    })
                    .catch(() => {
                        /* ninja still playable without chat chrome */
                    });
            })
            .catch(() => {
                if (cancelled) return;
                setLoading(false);
                setLoadError(true);
            });

        return () => {
            cancelled = true;
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [started, loadKey]);

    const onWarmup = useCallback(() => {
        schedulePrefetchPhaserBundle();
    }, []);

    const onStart = useCallback(() => {
        prefetchPhaserBundle();
        setStarted(true);
    }, []);

    const onRetry = useCallback(() => {
        prefetchPhaserBundle();
        setLoadError(false);
        setLoadKey((k) => k + 1);
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
            {loadError ? (
                <button
                    type="button"
                    data-no-cosmos
                    onClick={onRetry}
                    className="fixed bottom-6 left-6 z-[100] px-4 py-2 rounded-xl bg-zinc-800/90 text-sm text-amber-300 ring-1 ring-amber-400/40 hover:bg-zinc-700 transition-colors"
                    aria-label="忍者加载失败，点击重试"
                >
                    加载较慢或失败，点击重试
                </button>
            ) : null}
            {GameTooltip ? <GameTooltip /> : null}
            {ChatTrigger ? <ChatTrigger /> : null}
            {ChatPanel ? <ChatPanel /> : null}
        </>
    );
}
