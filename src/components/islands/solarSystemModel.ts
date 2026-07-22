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
 * Chosen so the home camera sees distinct discs (no line-of-sight merges)
 * while keeping AC-10 focus pairs in a frameable arc. Staging L (not M)
 * keeps the scatter meaningful in world space.
 */
const STAGED_LONGITUDE_DEG: Record<PlanetId, number> = {
    mercury: 23,
    venus: 105,
    earth: 151,
    mars: 218,
    jupiter: 290,
    saturn: 10,
    uranus: 70,
    neptune: 120,
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
        visualRadius: 2.4,
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
        visualRadius: 1.6,
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
        visualRadius: 6.5,
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
        visualRadius: 6,
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
        visualRadius: 4.0,
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
        visualRadius: 4.0,
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
 * Orbit band after AU compression. ORBIT_MIN stays outside SUN_RADIUS so
 * Mercury clears the sun disc (AC-9).
 */
export const ORBIT_MIN = 28;
export const ORBIT_MAX = 92;
/** Kept visually subordinate to the planet narrative (decorative vista). */
export const SUN_RADIUS = 10;

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

/** Monotone log compression of AU → visual orbit radius (AC-9). */
export function compressSemiMajor(aAu: number): number {
    const t = Math.log(Math.max(aAu, A_MIN) / A_MIN) / LOG_SPAN;
    return ORBIT_MIN + (ORBIT_MAX - ORBIT_MIN) * Math.pow(t, 0.85);
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
    const n = (Math.PI * 2) / compressPeriod(planet.periodDays);
    const M = planet.meanAnomaly0 + n * tDays;
    const E = solveEccentricAnomaly(M, planet.eccentricity);
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const r = a * (1 - planet.eccentricity * cosE);
    const trueAnomaly = Math.atan2(
        Math.sqrt(1 - planet.eccentricity ** 2) * sinE,
        cosE - planet.eccentricity,
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
        return {
            targetX: 0,
            targetY: 0,
            targetZ: 0,
            distance: ORBIT_MAX * 2.8,
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
