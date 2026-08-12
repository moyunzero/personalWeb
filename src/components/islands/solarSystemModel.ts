/** Visual Kepler solar system: compressed orbits + section focus (AC-9, AC-10). */

export type PlanetId =
    | 'mercury'
    | 'venus'
    | 'earth'
    | 'mars'
    | 'jupiter'
    | 'saturn'
    | 'uranus'
    | 'neptune';

export type SectionId = 'home' | 'about' | 'skill' | 'work' | 'contact';

const deg = (d: number) => (d * Math.PI) / 180;

export type PlanetElements = {
    id: PlanetId;
    /** Semi-major axis in AU (source). */
    aAu: number;
    eccentricity: number;
    /** Orbital inclination (radians). */
    inclination: number;
    /** Longitude of ascending node Ω (radians). */
    longAscendingNode: number;
    /** Argument of periapsis ω (radians). */
    argPeriapsis: number;
    /**
     * Mean anomaly at t=0 (radians). Derived from a staged initial mean
     * longitude, not a J2000 ephemeris claim (AC-9).
     */
    meanAnomaly0: number;
    /** Sidereal orbit period in Earth days. */
    periodDays: number;
    /** Sidereal rotation period in Earth days (negative = retrograde). */
    rotationDays: number;
    /** Axial tilt / obliquity (radians). */
    axialTilt: number;
    /** Exaggerated visual radius in scene units. */
    visualRadius: number;
    fallbackColor: number;
};

/** Island's initial camera yaw. */
export const INITIAL_CAMERA_YAW = 0.35;

/** Initial camera pitch: above the ecliptic so orbits read as ellipses
 *  with real depth instead of a flat lineup (within the ±30° AC-2 limit). */
export const INITIAL_CAMERA_PITCH = 0.38;

const TAU = Math.PI * 2;

/**
 * Staged initial MEAN LONGITUDE (L ≈ Ω + ω + M) per planet, in degrees.
 * Spaced ~55–60° apart so home framing does not stack discs on one ray
 * (Mercury+Saturn used to share ~86° and looked glued). Staging L (not M)
 * keeps the scatter meaningful in world space.
 */
const STAGED_LONGITUDE_DEG: Record<PlanetId, number> = {
    mercury: 25,
    venus: 85,
    earth: 145,
    mars: 205,
    jupiter: 265,
    saturn: 325,
    uranus: 40,
    neptune: 100,
};

export function stagedMeanAnomaly0(
    id: PlanetId,
    longAscendingNode: number,
    argPeriapsis: number,
): number {
    const M = deg(STAGED_LONGITUDE_DEG[id]) - longAscendingNode - argPeriapsis;
    return ((M % TAU) + TAU) % TAU;
}

/** Order: Mercury → Neptune (AC-1). Orbital numbers from NASA/Wikipedia fact sheets. */
const PLANETS_RAW: readonly Omit<PlanetElements, 'meanAnomaly0'>[] = [
    {
        id: 'mercury',
        aAu: 0.387,
        eccentricity: 0.2056,
        inclination: deg(7.0),
        longAscendingNode: deg(48.33),
        argPeriapsis: deg(29.12),
        periodDays: 87.97,
        rotationDays: 58.65,
        axialTilt: deg(0.03),
        visualRadius: 1.0,
        fallbackColor: 0x9a9a9a,
    },
    {
        id: 'venus',
        aAu: 0.723,
        eccentricity: 0.0068,
        inclination: deg(3.39),
        longAscendingNode: deg(76.68),
        argPeriapsis: deg(54.85),
        periodDays: 224.7,
        rotationDays: -243.02,
        axialTilt: deg(177.36),
        visualRadius: 2.0,
        fallbackColor: 0xc4a35a,
    },
    {
        id: 'earth',
        aAu: 1.0,
        eccentricity: 0.0167,
        inclination: 0,
        longAscendingNode: 0,
        argPeriapsis: deg(114.21),
        periodDays: 365.256,
        rotationDays: 0.9973,
        axialTilt: deg(23.44),
        visualRadius: 2.2,
        fallbackColor: 0x3a6ea5,
    },
    {
        id: 'mars',
        aAu: 1.524,
        eccentricity: 0.0934,
        inclination: deg(1.85),
        longAscendingNode: deg(49.56),
        argPeriapsis: deg(286.5),
        periodDays: 686.98,
        rotationDays: 1.026,
        axialTilt: deg(25.19),
        visualRadius: 1.5,
        fallbackColor: 0xb85c38,
    },
    {
        id: 'jupiter',
        aAu: 5.203,
        eccentricity: 0.0484,
        inclination: deg(1.3),
        longAscendingNode: deg(100.46),
        argPeriapsis: deg(273.87),
        periodDays: 4332.59,
        rotationDays: 0.414,
        axialTilt: deg(3.13),
        // Sized so adjacent compressed orbits still clear (incl. rings / highlight).
        visualRadius: 4.2,
        fallbackColor: 0xc9a36a,
    },
    {
        id: 'saturn',
        aAu: 9.537,
        eccentricity: 0.0539,
        inclination: deg(2.49),
        longAscendingNode: deg(113.64),
        argPeriapsis: deg(339.39),
        periodDays: 10759.22,
        rotationDays: 0.444,
        axialTilt: deg(26.73),
        visualRadius: 3.6,
        fallbackColor: 0xd4c08a,
    },
    {
        id: 'uranus',
        aAu: 19.191,
        eccentricity: 0.0472,
        inclination: deg(0.77),
        longAscendingNode: deg(74.02),
        argPeriapsis: deg(96.99),
        periodDays: 30688.5,
        rotationDays: -0.718,
        axialTilt: deg(97.77),
        visualRadius: 2.8,
        fallbackColor: 0x7ec8c8,
    },
    {
        id: 'neptune',
        aAu: 30.069,
        eccentricity: 0.0086,
        inclination: deg(1.77),
        longAscendingNode: deg(131.72),
        argPeriapsis: deg(273.19),
        periodDays: 60182,
        rotationDays: 0.671,
        axialTilt: deg(28.32),
        visualRadius: 2.8,
        fallbackColor: 0x3f6fd6,
    },
] as const;

export const PLANETS: readonly PlanetElements[] = PLANETS_RAW.map((p) => ({
    ...p,
    meanAnomaly0: stagedMeanAnomaly0(p.id, p.longAscendingNode, p.argPeriapsis),
}));

/** Growth narrative focus (AC-10). */
export const SECTION_FOCUS: Record<SectionId, readonly PlanetId[]> = {
    home: ['mercury', 'venus'],
    about: ['earth'],
    skill: ['mars', 'jupiter'],
    work: ['saturn'],
    contact: ['uranus', 'neptune'],
};

export const SECTION_ORDER: readonly SectionId[] = [
    'home',
    'about',
    'skill',
    'work',
    'contact',
];

/** Simulated days advanced per real second (auto accelerate, AC-9). */
export const TIME_SCALE_DAYS_PER_SEC = 4;

/** Exponent for monotone period compression (AC-9). */
export const PERIOD_COMPRESS_EXP = 0.45;

/** Visual spin damping so rotation reads as slow turning, not a blur.
 *  Orbit timeScale still drives spin; without this, Jupiter (~0.4 day) blurs. */
export const SPIN_SCALE = 0.008;

/**
 * Orbit band. ORBIT_MIN clears the sun disc. ORBIT_MAX is a soft aesthetic
 * ceiling for log targets; actual radii are raised as needed so peri/apo
 * discs never mesh (AC-9).
 */
export const ORBIT_MIN = 30;
export const ORBIT_MAX = 160;
/** Extra gap beyond disc extents when checking / sizing orbits. */
export const DISC_CLEARANCE = 3;
/** Matches applyPlanetStates highlight scale (lit planets grow slightly). */
export const HIGHLIGHT_SCALE = 1.14;
/**
 * Visual eccentricity scale. Full fact-sheet e on a compressed orbit lets
 * peri/apo ranges overlap. Keep a readable ellipse without mesh collisions.
 */
export const ECCENTRICITY_SCALE = 0.25;
/** Kept visually subordinate to the planet narrative (decorative vista). */
export const SUN_RADIUS = 10;

/** Radial extent used for clearance (Saturn includes ring). */
export function visualExtent(planet: {
    id: string;
    visualRadius?: number;
    radius?: number;
}): number {
    const r = planet.visualRadius ?? planet.radius ?? 0;
    return planet.id === 'saturn' ? r * 2.4 : r;
}

/** Sun equatorial rotation (~25.05 days) and obliquity to the ecliptic. */
export const SUN = {
    rotationDays: 25.05,
    axialTilt: deg(7.25),
} as const;

export function sunSpinAt(tDays: number): number {
    return (tDays / SUN.rotationDays) * Math.PI * 2 * SPIN_SCALE;
}

/** Earth's moon: local companion on the earth group (exaggerated orbit). */
export const MOON = {
    id: 'moon',
    periodDays: 27.322,
    rotationDays: 27.322,
    axialTilt: deg(6.68),
    inclination: deg(5.15),
    meanAnomaly0: 0.4,
    /** Local orbit radius in earth-mesh radii (earth mesh radius = 1). */
    orbitFactor: 3.2,
    visualRadius: 0.85,
    fallbackColor: 0xb8b8b8,
} as const;

const A_MIN = PLANETS[0].aAu;
const A_MAX = PLANETS[PLANETS.length - 1].aAu;
const LOG_SPAN = Math.log(A_MAX / A_MIN);

/** Soft log target (may be raised by clearance packing). */
function logOrbitTarget(aAu: number): number {
    const t = Math.log(Math.max(aAu, A_MIN) / A_MIN) / LOG_SPAN;
    return ORBIT_MIN + (ORBIT_MAX - ORBIT_MIN) * Math.pow(t, 0.85);
}

/**
 * Monotone visual semi-major axes: at least the log compression target, and
 * large enough that worst-case peri/apo on one ray still clears discs.
 */
const ORBIT_BY_ID: Record<PlanetId, number> = (() => {
    const out = {} as Record<PlanetId, number>;
    let prevA = 0;
    for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i];
        const logTarget = logOrbitTarget(p.aAu);
        if (i === 0) {
            out[p.id] = Math.max(ORBIT_MIN, logTarget);
            prevA = out[p.id];
            continue;
        }
        const prev = PLANETS[i - 1];
        const ePrev = prev.eccentricity * ECCENTRICITY_SCALE;
        const eCur = p.eccentricity * ECCENTRICITY_SCALE;
        const need =
            (visualExtent(prev) + visualExtent(p)) * HIGHLIGHT_SCALE + DISC_CLEARANCE;
        const minA = (prevA * (1 + ePrev) + need) / Math.max(1e-6, 1 - eCur);
        out[p.id] = Math.max(logTarget, minA);
        prevA = out[p.id];
    }
    return out;
})();

/** Monotone AU → visual orbit radius with disc clearance (AC-9). */
export function compressSemiMajor(aAu: number): number {
    // Exact planet AU hits the packed table; otherwise interpolate by log target.
    for (const p of PLANETS) {
        if (Math.abs(p.aAu - aAu) < 1e-9) return ORBIT_BY_ID[p.id];
    }
    return logOrbitTarget(aAu);
}

const P_MIN = PLANETS[0].periodDays;

/** Monotone compression of orbital period in days (AC-9). */
export function compressPeriod(periodDays: number): number {
    return P_MIN * Math.pow(Math.abs(periodDays) / P_MIN, PERIOD_COMPRESS_EXP);
}

/** Solve Kepler’s equation M = E − e sin E (radians). */
export function solveEccentricAnomaly(M: number, e: number, iterations = 8): number {
    let E = e < 0.8 ? M : Math.PI;
    for (let i = 0; i < iterations; i++) {
        E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
}

/**
 * Orbital plane (ω + ν) → ecliptic-like Y-up frame with Ω and i.
 * Matches the classic (Ω, i, ω) rotation chain used in popularizations.
 */
export function orbitalToWorld(
    r: number,
    trueAnomaly: number,
    inclination: number,
    longAscendingNode: number,
    argPeriapsis: number,
): { x: number; y: number; z: number } {
    const u = trueAnomaly + argPeriapsis;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const cO = Math.cos(longAscendingNode);
    const sO = Math.sin(longAscendingNode);
    const ci = Math.cos(inclination);
    const si = Math.sin(inclination);
    return {
        x: r * (cO * cu - sO * su * ci),
        z: r * (sO * cu + cO * su * ci),
        y: r * (su * si),
    };
}

export type PlanetState = {
    id: PlanetId;
    x: number;
    y: number;
    z: number;
    /** Orbit radius (visual). */
    orbitR: number;
    radius: number;
    spin: number;
};

export function planetStateAt(planet: PlanetElements, tDays: number): PlanetState {
    const a = compressSemiMajor(planet.aAu);
    const e = planet.eccentricity * ECCENTRICITY_SCALE;
    const n = (Math.PI * 2) / compressPeriod(planet.periodDays);
    const M = planet.meanAnomaly0 + n * tDays;
    const E = solveEccentricAnomaly(M, e);
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const r = a * (1 - e * cosE);
    const trueAnomaly = Math.atan2(
        Math.sqrt(Math.max(0, 1 - e ** 2)) * sinE,
        cosE - e,
    );
    const { x, y, z } = orbitalToWorld(
        r,
        trueAnomaly,
        planet.inclination,
        planet.longAscendingNode,
        planet.argPeriapsis,
    );

    const spin = (tDays / planet.rotationDays) * Math.PI * 2 * SPIN_SCALE;

    return {
        id: planet.id,
        x,
        y,
        z,
        orbitR: a,
        radius: planet.visualRadius,
        spin,
    };
}

export function systemStateAt(tDays: number): PlanetState[] {
    return PLANETS.map((p) => planetStateAt(p, tDays));
}

export type MoonState = {
    /** Offset in earth's local space (earth mesh radius = 1). */
    dx: number;
    dy: number;
    dz: number;
    radius: number;
    spin: number;
};

/** Local moon pose for parenting under the earth group. */
export function moonStateAt(tDays: number): MoonState {
    const n = (Math.PI * 2) / compressPeriod(MOON.periodDays);
    const ang = MOON.meanAnomaly0 + n * tDays;
    const r = MOON.orbitFactor;
    const i = MOON.inclination;
    return {
        dx: Math.cos(ang) * r,
        dy: Math.sin(ang) * r * Math.sin(i),
        dz: Math.sin(ang) * r * Math.cos(i),
        radius: MOON.visualRadius,
        spin: (tDays / MOON.rotationDays) * Math.PI * 2 * SPIN_SCALE,
    };
}

export type FocusPose = {
    targetX: number;
    targetY: number;
    targetZ: number;
    distance: number;
};

/** Camera look target + preferred distance for a section (AC-10). */
export function focusPoseFor(
    section: SectionId,
    states: PlanetState[],
    byId: Map<PlanetId, PlanetState> = new Map(states.map((s) => [s.id, s])),
): FocusPose {
    const ids = SECTION_FOCUS[section];
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let maxR = 0;
    for (const id of ids) {
        const s = byId.get(id);
        if (!s) continue;
        sx += s.x;
        sy += s.y;
        sz += s.z;
        maxR = Math.max(maxR, Math.hypot(s.x, s.y, s.z));
    }
    const n = Math.max(1, ids.length);
    if (section === 'home') {
        // Wide establishing shot: whole system reads as a mid-distance vista
        const outer = compressSemiMajor(PLANETS[PLANETS.length - 1].aAu);
        return {
            targetX: 0,
            targetY: 0,
            targetZ: 0,
            // Keep planets readable on GH Pages / mid-size viewports (was 2.8).
            distance: outer * 2.15,
        };
    }
    return {
        targetX: sx / n,
        targetY: sy / n,
        targetZ: sz / n,
        distance: Math.max(40, maxR * 2.4 + 30),
    };
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function smoothstep(t: number): number {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
}
