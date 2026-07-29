import { useEffect, useId, useState } from 'react';
import { matchesPostQuery } from '../../lib/filterPosts';

interface BlogSearchProps {
    listId?: string;
    totalCount: number;
    /** Years with posts, newest first. Enables year filter (default: latest year). */
    years?: number[];
}

type YearFilter = number | 'all';

function cardMatches(card: HTMLElement, query: string): boolean {
    const q = query.trim();
    if (!q) return true;

    const raw = card.dataset.blogSearch;
    if (raw) {
        try {
            const fields = JSON.parse(raw) as {
                title: string;
                description?: string;
                tags?: string[];
            };
            if (matchesPostQuery(fields, q)) return true;
        } catch {
            if (raw.toLowerCase().includes(q.toLowerCase())) return true;
        }
    }

    // Fallback: visible title/description/tags text (survives bad JSON payloads)
    return (card.textContent ?? '').toLowerCase().includes(q.toLowerCase());
}

/** Tailwind `.grid` overrides the HTML `hidden` attribute; use `!hidden` (!important). */
function setVisuallyHidden(el: HTMLElement, hide: boolean): void {
    el.classList.toggle('!hidden', hide);
    el.hidden = hide;
}

function isVisuallyHidden(el: HTMLElement): boolean {
    return el.classList.contains('!hidden') || el.hidden;
}

function applyListVisibility(
    root: HTMLElement,
    query: string,
    year: YearFilter,
    totalCount: number,
    listId: string
): void {
    const q = query.trim();
    const searching = q.length > 0;
    let visibleCount = 0;

    root.querySelectorAll<HTMLElement>('[data-blog-search]').forEach((card) => {
        const section = card.closest<HTMLElement>('[data-blog-year]');
        const sectionYear = section?.dataset.year
            ? Number(section.dataset.year)
            : NaN;
        const inYear =
            searching ||
            year === 'all' ||
            (!Number.isNaN(sectionYear) && sectionYear === year);
        const show = inYear && cardMatches(card, q);
        setVisuallyHidden(card, !show);
        if (show) visibleCount += 1;
    });

    root.querySelectorAll<HTMLElement>('[data-blog-year]').forEach((section) => {
        const sectionYear = section.dataset.year
            ? Number(section.dataset.year)
            : NaN;
        const yearAllowed =
            searching ||
            year === 'all' ||
            (!Number.isNaN(sectionYear) && sectionYear === year);
        const hasVisible = [
            ...section.querySelectorAll<HTMLElement>('[data-blog-search]'),
        ].some((card) => !isVisuallyHidden(card));
        setVisuallyHidden(section, !yearAllowed || !hasVisible);
    });

    const countEl = document.getElementById(`${listId}-count`);
    if (countEl) {
        if (searching) {
            countEl.textContent = `${visibleCount} / ${totalCount} 篇`;
        } else if (year === 'all') {
            countEl.textContent = `${totalCount} 篇`;
        } else {
            countEl.textContent = `${visibleCount} 篇 · ${year}`;
        }
    }

    const emptyEl = document.getElementById(`${listId}-empty`);
    if (emptyEl) {
        setVisuallyHidden(emptyEl, !searching || visibleCount > 0);
    }
}

export default function BlogSearch({
    listId = 'blog-post-list',
    totalCount,
    years = [],
}: BlogSearchProps) {
    const sortedYears = [...years].filter((y) => y > 0).sort((a, b) => b - a);
    const [query, setQuery] = useState('');
    const [composing, setComposing] = useState(false);
    const [year, setYear] = useState<YearFilter>(
        sortedYears.length > 0 ? sortedYears[0] : 'all'
    );
    const inputId = useId();

    useEffect(() => {
        if (composing) return;
        const root = document.getElementById(listId);
        if (!root) return;
        applyListVisibility(root, query, year, totalCount, listId);
    }, [query, year, listId, totalCount, composing]);

    const hasQuery = query.trim().length > 0;
    const showYearFilter = sortedYears.length > 1;

    return (
        <div className="mb-6 space-y-3">
            {showYearFilter ? (
                <nav
                    className="flex flex-wrap gap-2"
                    aria-label="按年份筛选"
                >
                    <button
                        type="button"
                        onClick={() => setYear('all')}
                        className={
                            year === 'all' && !hasQuery
                                ? 'rounded-full bg-sky-500/20 px-3 py-1 text-sm text-sky-300'
                                : 'rounded-full px-3 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200'
                        }
                    >
                        全部年份
                    </button>
                    {sortedYears.map((y) => (
                        <button
                            type="button"
                            key={y}
                            onClick={() => setYear(y)}
                            className={
                                year === y && !hasQuery
                                    ? 'rounded-full bg-sky-500/20 px-3 py-1 font-mono text-sm text-sky-300'
                                    : 'rounded-full px-3 py-1 font-mono text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200'
                            }
                        >
                            {y}
                        </button>
                    ))}
                </nav>
            ) : null}
            <label htmlFor={inputId} className="sr-only">
                搜索文章
            </label>
            <input
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={(event) => {
                    setComposing(false);
                    setQuery(event.currentTarget.value);
                }}
                placeholder="搜索标题、摘要或标签…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                <span id={`${listId}-count`}>
                    {sortedYears.length > 0 && year !== 'all'
                        ? `… · ${year}`
                        : `${totalCount} 篇`}
                </span>
                {hasQuery && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="text-sky-400 hover:text-sky-300"
                    >
                        清除搜索
                    </button>
                )}
            </div>
            {hasQuery ? (
                <p className="text-xs text-zinc-600">
                    已在全部年份中匹配标题 / 摘要 / 标签
                </p>
            ) : null}
        </div>
    );
}
