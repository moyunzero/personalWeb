/** Interactive / blocked chrome: explore must not start here (AC-4). */
export const COSMOS_BLOCK_SELECTOR =
    'a, button, input, textarea, select, [role="button"], header, nav, [data-no-cosmos]';

/** Cosmos hit surfaces (AC-4). */
export const COSMOS_HIT_SELECTOR =
    '[data-cosmos-canvas], [data-cosmos-fallback], [data-cosmos-hit]';

export function isCosmosExploreTarget(el: Element | null): boolean {
    if (!el || !(el instanceof Element)) return false;
    if (el.closest(COSMOS_BLOCK_SELECTOR)) return false;
    return Boolean(el.closest(COSMOS_HIT_SELECTOR));
}

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * After a pinch drops to one finger, reseed the drag anchor from the
 * surviving pointer so the next move does not treat (0,0) as lastPointer
 * and snap the camera (review Major on CosmicStarfieldIsland).
 * Returns null unless exactly one pointer remains.
 */
export function reseedLastPointerAfterPinch(
    remaining: Iterable<{ x: number; y: number }>,
): { x: number; y: number } | null {
    const pts = [...remaining];
    if (pts.length !== 1) return null;
    return { x: pts[0].x, y: pts[0].y };
}

export const DEFAULT_DISTANCE = 18;
export const IDLE_YAW_RAD_PER_S = 0.012;
export const PITCH_LIMIT = Math.PI / 6; // ±30°
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 1.55;
export const YAW_HALF_LIFE_MS = 120;
export const TOUCH_EXPLORE_PX = 8;
export const CLEAR_COLOR = 0x05060f;

/** Exponential decay toward zero (yaw coast after release). */
export function dampHalfLife(current: number, halfLifeMs: number, dtMs: number): number {
    if (halfLifeMs <= 0) return 0;
    return current * Math.pow(0.5, dtMs / halfLifeMs);
}

/** Clamp a zoom multiplier relative to section base distance (AC-2). */
export function clampZoomFactor(factor: number): number {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
}

export function distanceFromZoomFactor(baseDistance: number, zoomFactor: number): number {
    return baseDistance * clampZoomFactor(zoomFactor);
}
