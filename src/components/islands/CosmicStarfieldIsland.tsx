import { useEffect, useRef } from 'react';
import {
    CLEAR_COLOR,
    DEFAULT_DISTANCE,
    IDLE_YAW_RAD_PER_S,
    PITCH_LIMIT,
    TOUCH_EXPLORE_PX,
    YAW_HALF_LIFE_MS,
    clampZoomFactor,
    dampHalfLife,
    distanceFromZoomFactor,
    isCosmosExploreTarget,
    prefersReducedMotion,
    reseedLastPointerAfterPinch,
} from './cosmosHitTest';
import {
    INITIAL_CAMERA_PITCH,
    INITIAL_CAMERA_YAW,
    SECTION_FOCUS,
    SECTION_ORDER,
    TIME_SCALE_DAYS_PER_SEC,
    focusPoseFor,
    lerp,
    smoothstep,
    systemStateAt,
    type PlanetId,
    type SectionId,
} from './solarSystemModel';
import {
    applyPlanetStates,
    buildSolarSystemScene,
    type SolarSystemHandles,
} from './solarSystemScene';

/** Screen-space framing: pan the projection so the system sits low-right,
 *  clear of the centered copy column (negative x pans view left → scene right;
 *  negative y pans view up → scene lower). */
const VIEW_OFFSET_X = -0.1;
const VIEW_OFFSET_Y = -0.14;

/** Start downloading three.js as soon as this island chunk parses. */
const threeModule = import('three');

function sectionFromId(id: string | null): SectionId | null {
    if (!id) return null;
    return (SECTION_ORDER as readonly string[]).includes(id) ? (id as SectionId) : null;
}

export default function CosmicStarfieldIsland() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        if (prefersReducedMotion()) return;

        let cancelled = false;
        let rafId = 0;
        let renderer: import('three').WebGLRenderer | null = null;
        let scene: import('three').Scene | null = null;
        let camera: import('three').PerspectiveCamera | null = null;
        let handles: SolarSystemHandles | null = null;

        let yaw = INITIAL_CAMERA_YAW;
        let pitch = INITIAL_CAMERA_PITCH;
        /** User zoom vs section framing; persists after wheel/pinch (AC-2). */
        let zoomFactor = 1;
        let distance = DEFAULT_DISTANCE;
        let yawVelocity = 0;
        let exploring = false;
        let spectacleLocked = false;
        let pendingPointer: { x: number; y: number; touch: boolean } | null = null;
        let lastPointer = { x: 0, y: 0 };
        let lastTs = performance.now();
        let pinchStartDist = 0;
        let pinchStartZoom = 1;
        const activePointers = new Map<number, { x: number; y: number }>();

        let simDays = 0;
        let section: SectionId = 'home';
        let focusBlend = 1;
        let focusFrom = focusPoseFor('home', systemStateAt(0));
        let focusTo = focusFrom;
        let targetX = focusTo.targetX;
        let targetY = focusTo.targetY;
        let targetZ = focusTo.targetZ;
        let baseDistance = focusTo.distance;

        const framedDistance = () => distanceFromZoomFactor(baseDistance, zoomFactor);

        const tearDown = () => {
            cancelAnimationFrame(rafId);
            rafId = 0;
            if (renderer) {
                renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
                if (renderer.domElement.parentNode === host) {
                    host.removeChild(renderer.domElement);
                }
                renderer.dispose();
                renderer = null;
            }
            handles?.dispose();
            handles = null;
            scene = null;
            camera = null;
            host.style.opacity = '0';
            const fallback = document.querySelector<HTMLElement>('[data-cosmos-fallback]');
            if (fallback) fallback.style.opacity = '';
        };

        const onContextLost = (event: Event) => {
            event.preventDefault();
            tearDown();
        };

        const updateCamera = () => {
            if (!camera) return;
            const cp = Math.cos(pitch);
            camera.position.set(
                targetX + Math.sin(yaw) * cp * distance,
                targetY + Math.sin(pitch) * distance,
                targetZ + Math.cos(yaw) * cp * distance,
            );
            camera.lookAt(targetX, targetY, targetZ);
        };

        const resize = () => {
            if (!renderer || !camera) return;
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / Math.max(h, 1);
            camera.setViewOffset(w, h, w * VIEW_OFFSET_X, h * VIEW_OFFSET_Y, w, h);
            camera.updateProjectionMatrix();
        };

        const tick = (now: number) => {
            const dtMs = Math.min(64, now - lastTs);
            lastTs = now;
            const dt = dtMs / 1000;

            simDays += dt * TIME_SCALE_DAYS_PER_SEC;
            const states = systemStateAt(simDays);
            const highlight = new Set<PlanetId>(SECTION_FOCUS[section]);
            if (handles) applyPlanetStates(handles, states, highlight, simDays);

            focusBlend = Math.min(1, focusBlend + dt * 1.6);
            const k = smoothstep(focusBlend);
            const pose = focusPoseFor(section, states);
            focusTo = pose;
            targetX = lerp(focusFrom.targetX, focusTo.targetX, k);
            targetY = lerp(focusFrom.targetY, focusTo.targetY, k);
            targetZ = lerp(focusFrom.targetZ, focusTo.targetZ, k);
            baseDistance = lerp(focusFrom.distance, focusTo.distance, k);

            // Pinch owns distance while two fingers are active; otherwise track framing × zoom.
            if (!(activePointers.size === 2 && pinchStartDist > 0)) {
                distance = framedDistance();
            }

            if (!exploring) {
                if (Math.abs(yawVelocity) > 1e-6) {
                    yaw += yawVelocity * dt;
                    yawVelocity = dampHalfLife(yawVelocity, YAW_HALF_LIFE_MS, dtMs);
                } else {
                    yaw += IDLE_YAW_RAD_PER_S * dt;
                }
            }

            updateCamera();
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
            rafId = requestAnimationFrame(tick);
        };

        const startLoop = () => {
            cancelAnimationFrame(rafId);
            lastTs = performance.now();
            rafId = requestAnimationFrame(tick);
        };

        const stopLoop = () => {
            cancelAnimationFrame(rafId);
            rafId = 0;
        };

        const onVisibility = () => {
            if (document.visibilityState === 'hidden') {
                stopLoop();
            } else if (renderer) {
                startLoop();
            }
        };

        const beginExplore = (x: number, y: number) => {
            exploring = true;
            pendingPointer = null;
            yawVelocity = 0;
            lastPointer = { x, y };
        };

        const endExplore = () => {
            exploring = false;
            pendingPointer = null;
            pinchStartDist = 0;
        };

        const onPointerDown = (event: PointerEvent) => {
            if (!renderer || spectacleLocked) return;
            const under = document.elementFromPoint(event.clientX, event.clientY);
            if (!isCosmosExploreTarget(under)) return;

            activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

            if (event.pointerType === 'touch') {
                if (activePointers.size === 1) {
                    pendingPointer = { x: event.clientX, y: event.clientY, touch: true };
                } else if (activePointers.size === 2) {
                    const pts = [...activePointers.values()];
                    pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                    pinchStartZoom = zoomFactor;
                    pendingPointer = null;
                    exploring = true;
                    yawVelocity = 0;
                }
                return;
            }

            // Mouse: wait for a small drag so text selection is not stolen (AC-2 blank chrome).
            pendingPointer = { x: event.clientX, y: event.clientY, touch: false };
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!renderer || spectacleLocked) return;
            if (!activePointers.has(event.pointerId) && !pendingPointer && !exploring) return;

            if (activePointers.has(event.pointerId)) {
                activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            }

            if (activePointers.size === 2 && pinchStartDist > 0) {
                const pts = [...activePointers.values()];
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                const scale = dist / pinchStartDist;
                zoomFactor = clampZoomFactor(pinchStartZoom * scale);
                distance = framedDistance();
                event.preventDefault();
                return;
            }

            if (pendingPointer && !exploring) {
                const dx = event.clientX - pendingPointer.x;
                const dy = event.clientY - pendingPointer.y;
                if (pendingPointer.touch) {
                    if (Math.abs(dx) > TOUCH_EXPLORE_PX && Math.abs(dx) > Math.abs(dy)) {
                        beginExplore(event.clientX, event.clientY);
                        event.preventDefault();
                    }
                } else if (Math.hypot(dx, dy) > TOUCH_EXPLORE_PX) {
                    beginExplore(event.clientX, event.clientY);
                    event.preventDefault();
                }
                return;
            }

            if (!exploring) return;

            const dx = event.clientX - lastPointer.x;
            const dy = event.clientY - lastPointer.y;
            lastPointer = { x: event.clientX, y: event.clientY };

            yaw -= dx * 0.005;
            pitch -= dy * 0.005;
            pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
            yawVelocity = -dx * 0.05;
            event.preventDefault();
        };

        const onPointerUp = (event: PointerEvent) => {
            activePointers.delete(event.pointerId);
            if (activePointers.size < 2) {
                pinchStartDist = 0;
            }
            if (activePointers.size === 1) {
                const seeded = reseedLastPointerAfterPinch(activePointers.values());
                if (seeded) lastPointer = seeded;
            } else if (activePointers.size === 0) {
                endExplore();
            }
        };

        const onWheel = (event: WheelEvent) => {
            if (!renderer || spectacleLocked) return;
            if (!event.ctrlKey && !event.metaKey) return;
            const under = document.elementFromPoint(event.clientX, event.clientY);
            if (!isCosmosExploreTarget(under)) return;
            event.preventDefault();
            const next = zoomFactor * (event.deltaY > 0 ? 1.06 : 0.94);
            zoomFactor = clampZoomFactor(next);
            distance = framedDistance();
        };

        const onSpectacleStart = () => {
            spectacleLocked = true;
            endExplore();
            activePointers.clear();
        };

        const onSpectacleEnd = () => {
            spectacleLocked = false;
        };

        const setSection = (next: SectionId) => {
            if (next === section) return;
            focusFrom = {
                targetX,
                targetY,
                targetZ,
                distance: baseDistance,
            };
            section = next;
            focusBlend = 0;
        };

        const observers: IntersectionObserver[] = [];

        // Register before async Three init so an early spectacle:start is not missed.
        document.addEventListener('spectacle:start', onSpectacleStart);
        document.addEventListener('spectacle:end', onSpectacleEnd);

        (async () => {
            const THREE = await threeModule;
            if (cancelled || !hostRef.current) return;

            const probe = document.createElement('canvas');
            // Prefer non-software GL, but still start cosmos if only a caveat GPU is available
            // (otherwise the page silently keeps the static poster with no planets).
            const gl =
                probe.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
                probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
                probe.getContext('webgl') ||
                probe.getContext('webgl2');
            if (!gl) return;

            try {
                renderer = new THREE.WebGLRenderer({
                    antialias: false,
                    alpha: false,
                    powerPreference: 'low-power',
                });
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.05;
            } catch {
                return;
            }

            if (cancelled) {
                renderer.dispose();
                renderer = null;
                return;
            }

            renderer.setClearColor(CLEAR_COLOR, 1);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
            renderer.setSize(window.innerWidth, window.innerHeight, false);
            renderer.domElement.dataset.cosmosCanvas = '';
            renderer.domElement.setAttribute('aria-hidden', 'true');
            renderer.domElement.className = 'absolute inset-0 h-full w-full';
            renderer.domElement.style.touchAction = 'pan-y';
            renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

            const tier = window.innerWidth < 768 ? 'mobile' : 'desktop';
            const built = buildSolarSystemScene(THREE, {
                baseUrl: import.meta.env.BASE_URL,
                tier,
            });
            if (cancelled) {
                built.handles.dispose();
                renderer?.dispose();
                renderer = null;
                return;
            }

            scene = built.scene;
            handles = built.handles;
            camera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / Math.max(window.innerHeight, 1),
                0.5,
                600,
            );

            const initial = systemStateAt(0);
            applyPlanetStates(handles, initial, new Set(SECTION_FOCUS.home), 0);
            focusFrom = focusPoseFor('home', initial);
            focusTo = focusFrom;
            targetX = focusTo.targetX;
            targetY = focusTo.targetY;
            targetZ = focusTo.targetZ;
            baseDistance = focusTo.distance;
            zoomFactor = 1;
            distance = framedDistance();

            host.appendChild(renderer.domElement);
            updateCamera();
            resize();
            host.style.opacity = '1';
            const fallback = document.querySelector<HTMLElement>('[data-cosmos-fallback]');
            if (fallback) fallback.style.opacity = '0';
            startLoop();

            const io = new IntersectionObserver(
                (entries) => {
                    let best: { id: SectionId; ratio: number } | null = null;
                    for (const entry of entries) {
                        if (!entry.isIntersecting) continue;
                        const id = sectionFromId(entry.target.id);
                        if (!id) continue;
                        if (!best || entry.intersectionRatio > best.ratio) {
                            best = { id, ratio: entry.intersectionRatio };
                        }
                    }
                    if (best) setSection(best.id);
                },
                { threshold: [0.2, 0.4, 0.55, 0.7], rootMargin: '-10% 0px -35% 0px' },
            );
            for (const id of SECTION_ORDER) {
                const el = document.getElementById(id);
                if (el) io.observe(el);
            }
            observers.push(io);

            window.addEventListener('resize', resize);
            document.addEventListener('visibilitychange', onVisibility);
            window.addEventListener('pointerdown', onPointerDown, { passive: true });
            window.addEventListener('pointermove', onPointerMove, { passive: false });
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
            window.addEventListener('wheel', onWheel, { passive: false });
        })();

        return () => {
            cancelled = true;
            stopLoop();
            for (const io of observers) io.disconnect();
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
            document.removeEventListener('spectacle:start', onSpectacleStart);
            document.removeEventListener('spectacle:end', onSpectacleEnd);
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('wheel', onWheel);
            tearDown();
        };
    }, []);

    return (
        <div
            ref={hostRef}
            className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-500"
            style={{ touchAction: 'pan-y' }}
            aria-hidden="true"
            data-cosmos-hit
        >
            {/* Readability scrim over the canvas so copy zones stay legible */}
            <div
                className="absolute inset-0 z-10"
                style={{
                    background:
                        'linear-gradient(to bottom, rgba(5,6,15,0.55) 0%, rgba(5,6,15,0.25) 22%, rgba(5,6,15,0.08) 45%, rgba(5,6,15,0.18) 100%)',
                }}
            />
        </div>
    );
}
