import { useEffect, useId, useState } from 'react';
import { matchesPostQuery } from '../../lib/filterPosts';

interface BlogSearchProps {
    listId?: string;
    totalCount: number;
}

function cardMatches(card: HTMLElement, query: string): boolean {
    const raw = card.dataset.blogSearch;
    if (!raw) return true;

    try {
        const fields = JSON.parse(raw) as {
            title: string;
            description?: string;
            tags?: string[];
        };
        return matchesPostQuery(fields, query);
    } catch {
        return raw.toLowerCase().includes(query.trim().toLowerCase());
    }
}

export default function BlogSearch({
    listId = 'blog-post-list',
    totalCount,
}: BlogSearchProps) {
    const [query, setQuery] = useState('');
    const inputId = useId();

    useEffect(() => {
        const root = document.getElementById(listId);
        if (!root) return;

        const q = query.trim();
        let visibleCount = 0;

        root.querySelectorAll<HTMLElement>('[data-blog-search]').forEach((card) => {
            const show = cardMatches(card, q);
            card.classList.toggle('!hidden', !show);
            if (show) visibleCount += 1;
        });

        root.querySelectorAll<HTMLElement>('[data-blog-year]').forEach((section) => {
            const hasVisible = [...section.querySelectorAll<HTMLElement>(
                '[data-blog-search]'
            )].some((card) => !card.classList.contains('!hidden'));
            section.classList.toggle('!hidden', !hasVisible);
        });

        const countEl = document.getElementById(`${listId}-count`);
        if (countEl) {
            countEl.textContent = q
                ? `${visibleCount} / ${totalCount} 篇`
                : `${totalCount} 篇`;
        }

        const emptyEl = document.getElementById(`${listId}-empty`);
        if (emptyEl) {
            emptyEl.classList.toggle('!hidden', !q || visibleCount > 0);
        }
    }, [query, listId, totalCount]);

    const hasQuery = query.trim().length > 0;

    return (
        <div className="mb-6 space-y-3">
            <label htmlFor={inputId} className="sr-only">
                搜索文章
            </label>
            <input
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、摘要或标签…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                <span id={`${listId}-count`}>{totalCount} 篇</span>
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
        </div>
    );
}
