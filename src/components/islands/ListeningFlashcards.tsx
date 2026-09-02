import { useState } from 'react';
import type { ListeningEntry } from '../../lib/listening';

export interface ListeningFlashcardsProps {
    entries: ListeningEntry[];
    /** BASE_URL for audio resolve in 03-02 */
    baseUrl: string;
}

/**
 * Single /listening/ island: empty state + focus stage with sentence 揭晓/收起
 * (D-01…D-06 sentence path). Audio + rail expand in later plans.
 */
export default function ListeningFlashcards({
    entries,
}: ListeningFlashcardsProps) {
    // Newest is first after getListeningEntries sort (D-03).
    const [revealed, setRevealed] = useState(false);

    if (entries.length === 0) {
        return (
            <div className="mx-auto max-w-[min(52rem,100%)] py-12 text-center">
                <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.035em] text-zinc-100">
                    暂无记录
                </h1>
                <p className="mt-4 text-sm text-zinc-500">
                    有完成的条目后会出现在这里。
                </p>
            </div>
        );
    }

    const focus = entries[0];

    return (
        <div className="mx-auto flex max-w-[min(52rem,100%)] flex-col gap-6">
            <section
                className="rounded-[1.35rem] border border-zinc-700 bg-gradient-to-b from-[#1c1c20] to-[#141416] p-6"
                aria-live="polite"
            >
                <p className="text-[11px] leading-[1.3] text-zinc-500">
                    正在练习
                </p>
                <h1 className="mt-2 text-[clamp(1.625rem,4vw,2.0625rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-zinc-50">
                    {focus.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        className="rounded-lg border border-sky-700/60 px-3 py-1.5 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-500 hover:text-sky-200"
                        aria-expanded={revealed}
                        onClick={() => setRevealed((open) => !open)}
                    >
                        {revealed ? '收起' : '揭晓'}
                    </button>
                </div>
                {revealed ? (
                    <div className="mt-6 border-t border-zinc-800 pt-6">
                        <p className="border-l-2 border-sky-500/60 bg-sky-500/5 py-3 pl-4 font-serif text-sm italic leading-normal text-sky-100">
                            {focus.sentence}
                        </p>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
