/** Runtime model for home status rift and beast spectacle (spec 0005). */

export type SpectacleTrigger = 'click' | 'auto';

export type SpectaclePhase =
    | 'idle'
    | 'splitting'
    | 'portal'
    | 'beast'
    | 'healing';

export type StatusCopy = 'fishing' | 'dead';

export const COPY_FISHING = '正在摸鱼中 🐟';
export const COPY_DEAD = '已 dead';

export const PHASE_MS = {
    splitting: 1200,
    portal: 1500,
    beastMin: 5000,
    beastMax: 7000,
    healing: 1500,
    copyFadeBack: 800,
} as const;

/** Initial wait before first auto schedule window (AC-3). */
export const AUTO_INITIAL_DELAY_MS = 30_000;

/** Uniform random window for auto runs after the initial delay (AC-3). */
export const AUTO_WINDOW_MIN_MS = 120_000;
export const AUTO_WINDOW_MAX_MS = 300_000;

export const PORTAL_PAD_PX = 16;
export const PORTAL_MAX_RETRIES = 8;
export const PORTAL_R_CAP = 120;
export const PORTAL_R_VIEW_FRAC = 0.12;
export const PORTAL_SAFE_Y_FRAC = 0.62;

export type RectLike = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};

export type PortalAnchor = {
    x: number;
    y: number;
    r: number;
};

export type ViewportSize = {
    vw: number;
    vh: number;
};

export function canStart(phase: SpectaclePhase): boolean {
    return phase === 'idle';
}

export function shouldAffectStatus(trigger: SpectacleTrigger): boolean {
    return trigger === 'click';
}

export function copyLiteral(copy: StatusCopy): string {
    return copy === 'dead' ? COPY_DEAD : COPY_FISHING;
}

export function portalRadius(vw: number, vh: number): number {
    return Math.min(PORTAL_R_CAP, PORTAL_R_VIEW_FRAC * Math.min(vw, vh));
}

export function expandRect(rect: RectLike, pad: number): RectLike {
    return {
        left: rect.left - pad,
        top: rect.top - pad,
        right: rect.right + pad,
        bottom: rect.bottom + pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
    };
}

/** True when the disc (center x,y radius r) intersects an axis aligned rect. */
export function discIntersectsRect(x: number, y: number, r: number, rect: RectLike): boolean {
    const nearestX = Math.max(rect.left, Math.min(x, rect.right));
    const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));
    const dx = x - nearestX;
    const dy = y - nearestY;
    return dx * dx + dy * dy < r * r;
}

export function discHitsForbidden(
    x: number,
    y: number,
    r: number,
    forbidden: readonly RectLike[],
): boolean {
    return forbidden.some((rect) => discIntersectsRect(x, y, r, rect));
}

export function sampleBeastDurationMs(random = Math.random): number {
    return Math.round(PHASE_MS.beastMin + random() * (PHASE_MS.beastMax - PHASE_MS.beastMin));
}

/** Delay until next auto run after the initial 30s gate (AC-3). */
export function sampleAutoDelayMs(random = Math.random): number {
    return Math.round(
        AUTO_WINDOW_MIN_MS + random() * (AUTO_WINDOW_MAX_MS - AUTO_WINDOW_MIN_MS),
    );
}

/**
 * Sample a portal anchor that clears forbidden rects (nav + status, each padded).
 * Falls back to the safe viewport point and shrinks r if needed (AC-4).
 */
export function samplePortalAnchor(
    viewport: ViewportSize,
    forbidden: readonly RectLike[],
    random = Math.random,
): PortalAnchor {
    const { vw, vh } = viewport;
    let r = portalRadius(vw, vh);
    const padded = forbidden.map((rect) => expandRect(rect, PORTAL_PAD_PX));

    for (let i = 0; i < PORTAL_MAX_RETRIES; i++) {
        const x = random() * vw;
        const y = random() * vh;
        if (!discHitsForbidden(x, y, r, padded)) {
            return { x, y, r };
        }
    }

    const x = 0.5 * vw;
    const y = PORTAL_SAFE_Y_FRAC * vh;
    while (r > 8 && discHitsForbidden(x, y, r, padded)) {
        r *= 0.85;
    }
    if (discHitsForbidden(x, y, r, padded)) {
        // Last resort: keep the safe point with a tiny radius.
        r = Math.min(r, 8);
    }
    return { x, y, r };
}

/** Click path active phases before return to idle (AC-1). */
export const CLICK_PHASES: readonly SpectaclePhase[] = [
    'splitting',
    'portal',
    'beast',
    'healing',
];

/** Auto path active phases before return to idle (AC-3). */
export const AUTO_PHASES: readonly SpectaclePhase[] = ['portal', 'beast'];

export function nextPhase(
    current: SpectaclePhase,
    trigger: SpectacleTrigger,
): SpectaclePhase {
    if (current === 'idle') {
        return trigger === 'click' ? 'splitting' : 'portal';
    }
    const order = trigger === 'click' ? CLICK_PHASES : AUTO_PHASES;
    const idx = order.indexOf(current);
    if (idx < 0 || idx >= order.length - 1) {
        return 'idle';
    }
    return order[idx + 1] ?? 'idle';
}

/** World body length from portal radius in CSS px (mapped 1:1 in NDC helper space). */
export function beastBodyLength(portalR: number): number {
    return 1.8 * 2 * portalR;
}

/** Horizontal swim arc length in viewport px (AC 3D constants). */
export function beastArcLength(vw: number): number {
    return 0.4 * vw;
}
