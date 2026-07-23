import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './cosmosHitTest';
import {
    AUTO_INITIAL_DELAY_MS,
    COPY_DEAD,
    COPY_FISHING,
    PHASE_MS,
    canStart,
    sampleAutoDelayMs,
    sampleBeastDurationMs,
    samplePortalAnchor,
    shouldAffectStatus,
    type PortalAnchor,
    type SpectaclePhase,
    type SpectacleTrigger,
    type StatusCopy,
} from './spectacleModel';

type GsapLike = {
    set: (targets: unknown, vars: Record<string, unknown>) => void;
    to: (
        targets: unknown,
        vars: Record<string, unknown> & { onComplete?: () => void },
    ) => { kill: () => void };
    timeline: (vars?: Record<string, unknown>) => {
        to: (
            targets: unknown,
            vars: Record<string, unknown>,
            position?: number | string,
        ) => unknown;
        set: (targets: unknown, vars: Record<string, unknown>, position?: number | string) => unknown;
        kill: () => void;
    };
};

function readRects(): DOMRect[] {
    const rects: DOMRect[] = [];
    const header = document.querySelector('header');
    if (header) rects.push(header.getBoundingClientRect());
    const hit = document.querySelector('[data-status-spectacle-hit]');
    if (hit) rects.push(hit.getBoundingClientRect());
    return rects;
}

function setCopy(node: HTMLElement | null, copy: StatusCopy) {
    if (!node) return;
    node.textContent = copy === 'dead' ? COPY_DEAD : COPY_FISHING;
}

function dispatchSpectacle(name: 'spectacle:start' | 'spectacle:end', trigger: SpectacleTrigger) {
    document.dispatchEvent(
        new CustomEvent(name, { bubbles: true, detail: { trigger } }),
    );
}

function webglAvailable(): boolean {
    try {
        const c = document.createElement('canvas');
        return Boolean(
            c.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
                c.getContext('experimental-webgl'),
        );
    } catch {
        return false;
    }
}

/**
 * Home status rift + beast spectacle (spec 0005).
 * Click path: split → portal → beast → heal + copy.
 * Auto path: portal → beast only.
 */
export default function StatusSpectacleIsland() {
    const overlayRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const overlay = overlayRef.current;
        const canvas = canvasRef.current;
        if (!overlay || !canvas) return;

        const hit = document.querySelector<HTMLElement>('[data-status-spectacle-hit]');
        const copyNode = document.querySelector<HTMLElement>('[data-status-spectacle-copy]');
        if (!hit) return;

        let phase: SpectaclePhase = 'idle';
        let copy: StatusCopy = 'fishing';
        let activeTrigger: SpectacleTrigger | null = null;
        let startedEvent = false;
        let cancelled = false;
        let rafId = 0;
        let autoTimer: ReturnType<typeof setTimeout> | null = null;
        let copyFadeTimer: ReturnType<typeof setTimeout> | null = null;
        let healWaitTimer: ReturnType<typeof setTimeout> | null = null;
        let splitTimeline: { kill: () => void } | null = null;
        let sceneHandles: {
            update: (now: number, dt: number) => void;
            resize: (w: number, h: number) => void;
            dispose: () => void;
            ready: Promise<void>;
        } | null = null;
        let lastTs = 0;
        let splitClones: HTMLElement[] = [];

        const setOverlayActive = (on: boolean) => {
            overlay.style.pointerEvents = on ? 'auto' : 'none';
            overlay.setAttribute('aria-hidden', on ? 'false' : 'true');
        };
        setOverlayActive(false);

        const clearAuto = () => {
            if (autoTimer != null) {
                clearTimeout(autoTimer);
                autoTimer = null;
            }
        };

        const clearCopyFade = () => {
            if (copyFadeTimer != null) {
                clearTimeout(copyFadeTimer);
                copyFadeTimer = null;
            }
        };

        const clearHealWait = () => {
            if (healWaitTimer != null) {
                clearTimeout(healWaitTimer);
                healWaitTimer = null;
            }
        };

        const stopLoop = () => {
            cancelAnimationFrame(rafId);
            rafId = 0;
        };

        const disposeScene = () => {
            stopLoop();
            sceneHandles?.dispose();
            sceneHandles = null;
            canvas.style.opacity = '0';
        };

        const clearSplitClones = () => {
            splitTimeline?.kill();
            splitTimeline = null;
            for (const el of splitClones) el.remove();
            splitClones = [];
            hit.style.visibility = '';
        };

        const endSpectacleEvent = () => {
            if (!startedEvent || !activeTrigger) return;
            dispatchSpectacle('spectacle:end', activeTrigger);
            startedEvent = false;
        };

        const finishToIdle = () => {
            disposeScene();
            clearSplitClones();
            setOverlayActive(false);
            endSpectacleEvent();
            phase = 'idle';
            activeTrigger = null;
            scheduleAuto(false);
        };

        const forceCancel = () => {
            clearAuto();
            clearCopyFade();
            clearHealWait();
            disposeScene();
            clearSplitClones();
            setOverlayActive(false);
            if (copy === 'dead') {
                copy = 'fishing';
                setCopy(copyNode, 'fishing');
            }
            endSpectacleEvent();
            phase = 'idle';
            activeTrigger = null;
        };

        /** withInitialGate: first mount / return to tab → 30s then random window (AC-3, AC-9). */
        const scheduleAuto = (withInitialGate = false) => {
            clearAuto();
            if (cancelled || document.hidden) return;
            const delay =
                (withInitialGate ? AUTO_INITIAL_DELAY_MS : 0) + sampleAutoDelayMs();
            autoTimer = setTimeout(() => {
                void startRun('auto');
            }, delay);
        };

        const runCopyFadeBack = () => {
            clearCopyFade();
            copyFadeTimer = setTimeout(() => {
                copy = 'fishing';
                setCopy(copyNode, 'fishing');
                finishToIdle();
            }, PHASE_MS.copyFadeBack);
        };

        const tick = (now: number) => {
            const dt = Math.min(0.064, (now - lastTs) / 1000);
            lastTs = now;
            try {
                sceneHandles?.update(now, dt);
            } catch {
                // AC-5 / AC-8: never leave overlay locked or start without end.
                forceCancel();
                scheduleAuto(false);
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        const startLoop = () => {
            if (rafId) return;
            lastTs = performance.now();
            rafId = requestAnimationFrame(tick);
        };

        const beginPortalBeast = async (trigger: SpectacleTrigger, portal: PortalAnchor) => {
            if (cancelled) return;
            if (prefersReducedMotion() || !webglAvailable()) {
                throw new Error('3d skipped');
            }

            // Cover pointers for both click and auto before any async work (AC-8).
            setOverlayActive(true);
            // Lock re-entry while assets load (auto would otherwise stay idle).
            phase = 'portal';

            const THREE = await import('three');
            if (cancelled) return;

            const { buildSpectacleScene } = await import('./spectacleScene');
            if (cancelled) return;

            const beastMs = sampleBeastDurationMs();
            canvas.style.opacity = '1';
            sceneHandles = buildSpectacleScene({
                THREE,
                canvas,
                baseUrl: import.meta.env.BASE_URL,
                portal,
                beastDurationMs: beastMs,
                onBeastComplete: () => {
                    if (cancelled) return;
                    disposeScene();
                    if (trigger === 'click') {
                        void healSplit();
                    } else {
                        finishToIdle();
                    }
                },
                onFatalError: () => {
                    // AC-5 webglcontextlost: unlock overlay + pair end.
                    forceCancel();
                    scheduleAuto(false);
                },
            });

            startLoop();
            try {
                await sceneHandles.ready;
            } catch (err) {
                disposeScene();
                throw err;
            }
            if (cancelled) {
                disposeScene();
                return;
            }

            // Fire start once the timed portal narrative can begin (AC-1, AC-8).
            if (!startedEvent) {
                dispatchSpectacle('spectacle:start', trigger);
                startedEvent = true;
            }
        };

        const healSplit = async () => {
            phase = 'healing';
            // Bricks already cleared after shatter; brief beat then fade copy back.
            if (splitClones.length > 0) {
                const gsapMod = await import('gsap');
                const gsap = gsapMod.default as unknown as GsapLike;
                await new Promise<void>((resolve) => {
                    splitTimeline = gsap.to(splitClones, {
                        opacity: 0,
                        scale: 0.6,
                        duration: PHASE_MS.healing / 1000,
                        ease: 'power2.in',
                        stagger: 0.015,
                        onComplete: () => resolve(),
                    });
                });
                clearSplitClones();
            } else {
                await new Promise<void>((resolve) => {
                    healWaitTimer = setTimeout(() => {
                        healWaitTimer = null;
                        resolve();
                    }, PHASE_MS.healing);
                });
            }
            if (cancelled || document.hidden) return;
            hit.style.visibility = '';
            runCopyFadeBack();
        };

        const runSplit = async () => {
            phase = 'splitting';
            setOverlayActive(true);
            const gsapMod = await import('gsap');
            const gsap = gsapMod.default as unknown as GsapLike;

            const rect = hit.getBoundingClientRect();
            // Brick shatter grid (rough masonry tiles).
            const cols = Math.max(5, Math.round(rect.width / 28));
            const rows = Math.max(2, Math.round(rect.height / 16));
            const brickW = rect.width / cols;
            const brickH = rect.height / rows;
            const shards: HTMLElement[] = [];

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const shard = hit.cloneNode(true) as HTMLElement;
                    shard.removeAttribute('data-status-spectacle-hit');
                    shard.querySelectorAll('[data-status-spectacle-copy]').forEach((n) => {
                        n.removeAttribute('data-status-spectacle-copy');
                    });
                    const x = rect.left + col * brickW;
                    const y = rect.top + row * brickH;
                    shard.style.position = 'fixed';
                    shard.style.left = `${rect.left}px`;
                    shard.style.top = `${rect.top}px`;
                    shard.style.width = `${rect.width}px`;
                    shard.style.height = `${rect.height}px`;
                    shard.style.margin = '0';
                    shard.style.zIndex = '51';
                    shard.style.pointerEvents = 'none';
                    shard.style.overflow = 'hidden';
                    shard.style.willChange = 'transform, opacity';
                    shard.style.clipPath = `inset(${row * brickH}px ${
                        rect.width - (col + 1) * brickW
                    }px ${rect.height - (row + 1) * brickH}px ${col * brickW}px)`;
                    // Anchor transform from brick center.
                    const ox = x + brickW / 2 - (rect.left + rect.width / 2);
                    const oy = y + brickH / 2 - (rect.top + rect.height / 2);
                    shard.style.transformOrigin = `${50 + (ox / rect.width) * 100}% ${
                        50 + (oy / rect.height) * 100
                    }%`;
                    document.body.appendChild(shard);
                    shards.push(shard);
                    // Stash flight target on the element for the tween.
                    const angle = Math.atan2(oy + (Math.random() - 0.5) * 8, ox + (Math.random() - 0.5) * 8);
                    const dist = 60 + Math.random() * 140;
                    (shard as HTMLElement & { __dx?: number; __dy?: number; __rot?: number }).__dx =
                        Math.cos(angle) * dist;
                    (shard as HTMLElement & { __dx?: number; __dy?: number; __rot?: number }).__dy =
                        Math.sin(angle) * dist + 40 + Math.random() * 50;
                    (shard as HTMLElement & { __dx?: number; __dy?: number; __rot?: number }).__rot =
                        (Math.random() - 0.5) * 520;
                }
            }

            splitClones = shards;
            hit.style.visibility = 'hidden';

            // Copy flips as soon as the shatter begins (分裂后立刻「已 dead」).
            if (shouldAffectStatus('click')) {
                copy = 'dead';
                setCopy(copyNode, 'dead');
            }

            await new Promise<void>((resolve) => {
                const tl = gsap.timeline({
                    onComplete: () => resolve(),
                });
                splitTimeline = tl;
                for (const shard of shards) {
                    const s = shard as HTMLElement & {
                        __dx?: number;
                        __dy?: number;
                        __rot?: number;
                    };
                    tl.to(
                        shard,
                        {
                            x: s.__dx ?? 0,
                            y: s.__dy ?? 80,
                            rotation: s.__rot ?? 90,
                            opacity: 0,
                            duration: PHASE_MS.splitting / 1000,
                            ease: 'power3.out',
                        },
                        Math.random() * 0.12,
                    );
                }
            });

            // Reveal the row with「已 dead」so the copy change is visible during the spectacle.
            for (const shard of shards) shard.remove();
            splitClones = [];
            hit.style.visibility = '';
        };

        const shortCopyOnly = async () => {
            // AC-5 click without 3D: no spectacle events.
            if (!canStart(phase)) return;
            phase = 'splitting';
            activeTrigger = 'click';
            clearAuto();
            setOverlayActive(true);
            copy = 'dead';
            setCopy(copyNode, 'dead');
            await new Promise((r) => setTimeout(r, 400));
            if (cancelled) return;
            copy = 'fishing';
            setCopy(copyNode, 'fishing');
            setOverlayActive(false);
            phase = 'idle';
            activeTrigger = null;
            scheduleAuto(false);
        };

        const startRun = async (trigger: SpectacleTrigger) => {
            if (cancelled || !canStart(phase) || document.hidden) return;
            activeTrigger = trigger;
            clearAuto();

            const portal = samplePortalAnchor(
                { vw: window.innerWidth, vh: window.innerHeight },
                readRects(),
            );

            try {
                if (trigger === 'click') {
                    await runSplit();
                    if (cancelled) return;
                    try {
                        await beginPortalBeast(trigger, portal);
                    } catch {
                        // 3D failed after split: still heal + restore copy; end event if started.
                        endSpectacleEvent();
                        await healSplit();
                    }
                } else {
                    try {
                        await beginPortalBeast(trigger, portal);
                    } catch {
                        // Auto: silent cancel (AC-5).
                        endSpectacleEvent();
                        finishToIdle();
                    }
                }
            } catch {
                forceCancel();
                scheduleAuto(false);
            }
        };

        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return;
            if (!canStart(phase)) return;
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (!target.closest('[data-status-spectacle-hit]')) return;
            event.preventDefault();
            if (prefersReducedMotion() || !webglAvailable()) {
                void shortCopyOnly();
                return;
            }
            void startRun('click');
        };

        const onVisibility = () => {
            if (document.hidden) {
                forceCancel();
            } else {
                scheduleAuto(true);
            }
        };

        const onResize = () => {
            sceneHandles?.resize(window.innerWidth, window.innerHeight);
        };

        hit.style.cursor = 'pointer';
        hit.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('resize', onResize);
        scheduleAuto(true);

        return () => {
            cancelled = true;
            forceCancel();
            clearAuto();
            hit.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('resize', onResize);
            hit.style.cursor = '';
        };
    }, []);

    return (
        <div
            ref={overlayRef}
            className="pointer-events-none fixed inset-0 z-[50]"
            aria-hidden="true"
            data-status-spectacle-overlay
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full opacity-0"
                style={{ display: 'block' }}
            />
        </div>
    );
}
