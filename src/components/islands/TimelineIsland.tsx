import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import type { TimelineEvent, TimelineTrack } from '../../lib/timeline';

const TRACK_META: { id: TimelineTrack; label: string }[] = [
    { id: 'intl', label: '国外' },
    { id: 'cn', label: '国内' },
    { id: 'fw', label: '框架' },
    { id: 'term', label: '术语' },
];

const TRACK_DOT: Record<TimelineTrack, string> = {
    intl: 'bg-sky-400',
    cn: 'bg-amber-400',
    fw: 'bg-emerald-400',
    term: 'bg-violet-400',
};

type Props = { events: TimelineEvent[] };
type SortOrder = 'asc' | 'desc';

/** date | node | content — node column is the shared rail axis */
const ROW =
    'grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[5.75rem_1.25rem_minmax(0,1fr)] sm:gap-x-4';

function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function TimelineIsland({ events }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [mileOnly, setMileOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [activeYear, setActiveYear] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [tracks, setTracks] = useState<Record<TimelineTrack, boolean>>({
        intl: true,
        cn: true,
        fw: true,
        term: true,
    });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const active = TRACK_META.filter((t) => tracks[t.id]).map((t) => t.id);
        const list = events.filter((e) => {
            if (mileOnly && e.tier < 2) return false;
            if (!e.tracks.some((t) => active.includes(t))) return false;
            if (!q) return true;
            const hay = `${e.title} ${e.summary} ${e.category} ${e.date}`.toLowerCase();
            return hay.includes(q);
        });
        const sorted = [...list].sort((a, b) => {
            if (a.sort !== b.sort) return a.sort - b.sort;
            return a.date.localeCompare(b.date, 'zh');
        });
        return sortOrder === 'asc' ? sorted : sorted.reverse();
    }, [events, mileOnly, query, sortOrder, tracks]);

    const years = useMemo(() => {
        const groups: { year: string; items: TimelineEvent[] }[] = [];
        let current: { year: string; items: TimelineEvent[] } | null = null;
        for (const event of filtered) {
            if (!current || current.year !== event.year) {
                current = { year: event.year, items: [] };
                groups.push(current);
            }
            current.items.push(event);
        }
        return groups;
    }, [filtered]);

    const filterKey = `${sortOrder}|${mileOnly}|${query}|${Object.values(tracks).join('')}`;

    useGSAP(
        () => {
            const root = rootRef.current;
            if (!root) return;
            const triggers: import('gsap/ScrollTrigger').ScrollTrigger[] = [];
            let cancelled = false;

            const run = async () => {
                try {
                    const { default: gsap } = await import('gsap');
                    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
                    if (cancelled) return;
                    gsap.registerPlugin(ScrollTrigger);

                    const items = gsap.utils.toArray<HTMLElement>(
                        root.querySelectorAll('.tl-reveal'),
                    );
                    if (prefersReducedMotion()) {
                        gsap.set(items, { opacity: 1, y: 0 });
                    } else {
                        items.forEach((el) => {
                            if (cancelled) return;
                            if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
                                gsap.set(el, { opacity: 1, y: 0 });
                                return;
                            }
                            gsap.set(el, { opacity: 0, y: 16 });
                            triggers.push(
                                ScrollTrigger.create({
                                    trigger: el,
                                    start: 'top 90%',
                                    once: true,
                                    onEnter: () => {
                                        gsap.to(el, {
                                            opacity: 1,
                                            y: 0,
                                            duration: 0.4,
                                            ease: 'power2.out',
                                        });
                                    },
                                }),
                            );
                        });
                    }

                    if (cancelled) {
                        triggers.forEach((t) => t.kill());
                        return;
                    }

                    triggers.push(
                        ScrollTrigger.create({
                            trigger: root,
                            start: 'top 20%',
                            end: 'bottom bottom',
                            onUpdate: (self) => setProgress(self.progress),
                        }),
                    );
                    ScrollTrigger.refresh();
                } catch {
                    root.querySelectorAll('.tl-reveal').forEach((el) => {
                        (el as HTMLElement).style.opacity = '1';
                    });
                }
            };

            void run();
            return () => {
                cancelled = true;
                triggers.forEach((t) => t.kill());
            };
        },
        { dependencies: [filterKey, years.length], scope: rootRef },
    );

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const sections = root.querySelectorAll<HTMLElement>('[data-tl-year]');
        if (!sections.length) {
            setActiveYear(null);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) {
                    setActiveYear(visible[0].target.getAttribute('data-tl-year'));
                }
            },
            { rootMargin: '-18% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
        );

        sections.forEach((s) => observer.observe(s));
        setActiveYear(sections[0].getAttribute('data-tl-year'));
        return () => observer.disconnect();
    }, [filterKey, years.length]);

    function toggleTrack(id: TimelineTrack) {
        setTracks((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    return (
        <div ref={rootRef} className="timeline-ledger relative">
            {/* Toolbar — hairline, no card chrome (DESIGN.md) */}
            <div className="sticky top-0 z-20 mb-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
                <div
                    className="h-px origin-left bg-white/80 transition-transform duration-150 ease-out"
                    style={{ transform: `scaleX(${Math.max(progress, 0.02)})` }}
                    aria-hidden="true"
                />
                <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="block min-w-0 flex-1">
                        <span className="sr-only">搜索</span>
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="搜索标题或摘要…"
                            className="w-full rounded-lg border border-white/25 bg-zinc-800/80 px-3 py-2 font-sans text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/50"
                        />
                    </label>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]">
                        <button
                            type="button"
                            aria-pressed={sortOrder === 'desc'}
                            aria-label={
                                sortOrder === 'asc'
                                    ? '当前从旧到新，点击改为从新到旧'
                                    : '当前从新到旧，点击改为从旧到新'
                            }
                            onClick={() =>
                                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                            }
                            className="rounded-full border border-white/25 px-3 py-1.5 text-[#dadbdf] transition-colors hover:border-white/50 hover:text-white"
                        >
                            {sortOrder === 'asc' ? '旧 → 新' : '新 → 旧'}
                        </button>
                        <button
                            type="button"
                            aria-pressed={mileOnly}
                            onClick={() => setMileOnly((v) => !v)}
                            className={`rounded-full border px-3 py-1.5 transition-colors ${
                                mileOnly
                                    ? 'border-white bg-white text-[#0a0a0a]'
                                    : 'border-white/25 text-[#7d8187] hover:border-white/50 hover:text-white'
                            }`}
                        >
                            里程碑
                        </button>
                        {TRACK_META.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                aria-pressed={tracks[t.id]}
                                onClick={() => toggleTrack(t.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
                                    tracks[t.id]
                                        ? 'border-white/40 text-white'
                                        : 'border-white/15 text-[#7d8187]'
                                }`}
                            >
                                <span
                                    className={`size-1.5 rounded-full ${TRACK_DOT[t.id]}`}
                                    aria-hidden="true"
                                />
                                {t.label}
                            </button>
                        ))}
                        <span className="px-1 tabular-nums text-[#7d8187]">
                            {filtered.length}/{events.length}
                        </span>
                    </div>
                </div>
            </div>

            {activeYear ? (
                <div
                    className="pointer-events-none fixed bottom-6 right-4 z-30 hidden rounded-full border border-white/25 bg-zinc-950/90 px-3 py-1.5 font-mono text-xs tabular-nums tracking-[0.08em] text-white sm:block"
                    aria-hidden="true"
                >
                    {activeYear}
                </div>
            ) : null}

            {years.length === 0 ? (
                <p className="py-24 text-center font-sans text-sm text-[#7d8187]">
                    没有匹配条目，试试放宽筛选或清空搜索。
                </p>
            ) : (
                years.map((group) => {
                    const isActive = activeYear === group.year;
                    return (
                        <section
                            key={`${filterKey}-${group.year}`}
                            data-tl-year={group.year}
                            className="relative mb-16"
                        >
                            {/* Rail centered on the node column (same axis as every node) */}
                            <div
                                className={`pointer-events-none absolute bottom-0 top-3 w-px sm:hidden ${
                                    isActive ? 'bg-white/35' : 'bg-white/12'
                                }`}
                                style={{ left: 'calc(0.625rem - 0.5px)' }}
                                aria-hidden="true"
                            />
                            <div
                                className={`pointer-events-none absolute bottom-0 top-4 hidden w-px sm:block ${
                                    isActive ? 'bg-white/35' : 'bg-white/12'
                                }`}
                                style={{
                                    /* date 5.75rem + gap 1rem + half node 0.625rem */
                                    left: 'calc(5.75rem + 1rem + 0.625rem - 0.5px)',
                                }}
                                aria-hidden="true"
                            />

                            <header className={`${ROW} tl-reveal mb-3 items-center`}>
                                <div className="hidden sm:block" aria-hidden="true" />
                                <div className="relative z-10 flex h-10 items-center justify-center">
                                    <span
                                        className={`size-2 rounded-full ${
                                            isActive ? 'bg-white' : 'bg-white/40'
                                        }`}
                                        aria-hidden="true"
                                    />
                                </div>
                                <h2
                                    className={`font-sans text-3xl font-normal leading-10 tracking-tight text-pretty sm:text-4xl ${
                                        isActive ? 'text-white' : 'text-[#7d8187]'
                                    }`}
                                >
                                    {group.year}
                                </h2>
                            </header>

                            <ul>
                                {group.items.map((event) => {
                                    const mile = event.tier >= 2;
                                    return (
                                        <li
                                            key={event.id}
                                            className={`${ROW} tl-reveal items-start py-5`}
                                        >
                                            {/* Desktop date — same first-line box as node + title */}
                                            <time className="hidden h-7 items-center justify-end font-mono text-xs tabular-nums text-[#7d8187] sm:flex">
                                                {event.date}
                                            </time>

                                            {/* Node — center of rail column, vertically locked to title line */}
                                            <div className="relative z-10 flex h-7 items-center justify-center">
                                                <span
                                                    className={`size-2.5 shrink-0 rounded-full border-2 border-zinc-900 ${
                                                        mile
                                                            ? 'bg-sky-400'
                                                            : 'bg-zinc-600 ring-1 ring-white/25'
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <time className="mb-1 block font-mono text-[11px] tabular-nums text-[#7d8187] sm:hidden">
                                                    {event.date}
                                                </time>
                                                <h3 className="flex min-h-7 items-center text-pretty font-sans text-base font-normal leading-7 text-white">
                                                    {event.sourceUrl ? (
                                                        <a
                                                            href={event.sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="underline-offset-4 transition-colors hover:text-[#a0c3ec] hover:underline"
                                                        >
                                                            {event.title}
                                                        </a>
                                                    ) : (
                                                        event.title
                                                    )}
                                                </h3>
                                                {event.summary ? (
                                                    <p className="mt-1.5 max-w-2xl text-pretty font-sans text-sm leading-relaxed text-[#7d8187]">
                                                        {event.summary}
                                                    </p>
                                                ) : null}
                                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#7d8187]">
                                                    <span className="normal-case tracking-normal">
                                                        {event.category}
                                                    </span>
                                                    {event.tracks.map((t) => (
                                                        <span
                                                            key={t}
                                                            className="inline-flex items-center gap-1"
                                                        >
                                                            <span
                                                                className={`size-1 rounded-full ${TRACK_DOT[t]}`}
                                                                aria-hidden="true"
                                                            />
                                                            {
                                                                TRACK_META.find((m) => m.id === t)
                                                                    ?.label
                                                            }
                                                        </span>
                                                    ))}
                                                    {mile ? (
                                                        <span className="text-[#dadbdf]">
                                                            {event.tier >= 3 ? '范式级' : '高热度'}
                                                        </span>
                                                    ) : null}
                                                    {event.sourceUrl ? (
                                                        <a
                                                            href={event.sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[#a0c3ec] transition-colors hover:text-white"
                                                        >
                                                            来源
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })
            )}
        </div>
    );
}
