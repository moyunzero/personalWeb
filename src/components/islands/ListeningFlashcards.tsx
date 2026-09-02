import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListeningEntry } from '../../lib/listening';

export interface ListeningFlashcardsProps {
    entries: ListeningEntry[];
    /** BASE_URL for audio resolve in 03-02 */
    baseUrl: string;
}

/**
 * Single /listening/ island: empty state + focus stage with full 揭晓/收起
 * (sentence + vocab + takeaways + conditional YouTube) and native mp3 controls.
 * T-03-02: text nodes only; T-03-07: youtubeUrl href only when present + noopener.
 */
export default function ListeningFlashcards({
    entries,
    baseUrl,
}: ListeningFlashcardsProps) {
    // Newest is first after getListeningEntries sort (D-03).
    const [revealed, setRevealed] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [audioBroken, setAudioBroken] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const focus = entries.length > 0 ? entries[0] : null;
    const audioSrc = focus?.audioSrc;
    const hasAudio = Boolean(audioSrc) && !audioBroken;
    const resolvedSrc =
        audioSrc != null ? `${baseUrl}${audioSrc}` : undefined;

    useEffect(() => {
        setAudioBroken(false);
        setPlaying(false);
        const el = audioRef.current;
        if (el) {
            el.pause();
            el.currentTime = 0;
        }
    }, [audioSrc]);

    const onPlayPause = useCallback(async () => {
        const el = audioRef.current;
        if (!el || !hasAudio) return;
        if (playing) {
            el.pause();
            setPlaying(false);
            return;
        }
        try {
            await el.play();
            setPlaying(true);
        } catch {
            setAudioBroken(true);
            setPlaying(false);
        }
    }, [hasAudio, playing]);

    const onReplay = useCallback(async () => {
        const el = audioRef.current;
        if (!el || !hasAudio) return;
        el.currentTime = 0;
        try {
            await el.play();
            setPlaying(true);
        } catch {
            setAudioBroken(true);
            setPlaying(false);
        }
    }, [hasAudio]);

    const onAudioEnded = useCallback(() => {
        setPlaying(false);
    }, []);

    const onAudioError = useCallback(() => {
        setAudioBroken(true);
        setPlaying(false);
    }, []);

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

    // focus is non-null when entries.length > 0
    const card = focus!;
    const hasVocab = card.vocab.length > 0;
    const hasTakeaways = card.takeaways.trim().length > 0;
    const youtubeUrl = card.youtubeUrl;

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
                    {card.title}
                </h1>
                {resolvedSrc ? (
                    <audio
                        ref={audioRef}
                        src={resolvedSrc}
                        preload="metadata"
                        onEnded={onAudioEnded}
                        onError={onAudioError}
                    />
                ) : null}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-sky-600/70 bg-sky-500/15 text-sky-200 transition-colors hover:border-sky-400 hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-[0.35] disabled:hover:border-sky-600/70 disabled:hover:bg-sky-500/15"
                        aria-label={playing ? '暂停' : '播放'}
                        disabled={!hasAudio}
                        title={!hasAudio ? '暂无音频' : undefined}
                        onClick={() => {
                            void onPlayPause();
                        }}
                    >
                        <span aria-hidden="true" className="text-lg font-semibold">
                            {playing ? '❚❚' : '▶'}
                        </span>
                    </button>
                    <button
                        type="button"
                        className="rounded-lg border border-sky-700/60 px-3 py-1.5 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-500 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-[0.35] disabled:hover:border-sky-700/60 disabled:hover:text-sky-300"
                        disabled={!hasAudio}
                        title={!hasAudio ? '暂无音频' : undefined}
                        onClick={() => {
                            void onReplay();
                        }}
                    >
                        重播
                    </button>
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
                    <div className="mt-6 grid grid-cols-1 gap-6 border-t border-zinc-800 pt-6 min-[840px]:grid-cols-[1.2fr_0.8fr]">
                        <div className="flex min-w-0 flex-col gap-4">
                            <p className="border-l-2 border-sky-500/60 bg-sky-500/5 py-3 pl-4 font-serif text-sm italic leading-normal text-sky-100">
                                {card.sentence}
                            </p>
                            {hasVocab ? (
                                <table className="w-full border-collapse text-left text-sm text-zinc-300">
                                    <thead>
                                        <tr>
                                            <th className="border-b border-zinc-800 py-1 pr-2 text-[11px] font-normal leading-[1.3] text-zinc-500">
                                                词
                                            </th>
                                            <th className="border-b border-zinc-800 py-1 px-2 text-[11px] font-normal leading-[1.3] text-zinc-500">
                                                音标
                                            </th>
                                            <th className="border-b border-zinc-800 py-1 pl-2 text-[11px] font-normal leading-[1.3] text-zinc-500">
                                                释义
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {card.vocab.map((row) => (
                                            <tr key={row.word}>
                                                <td className="border-b border-zinc-800/80 py-2 pr-2 align-top text-zinc-200">
                                                    {row.word}
                                                </td>
                                                <td className="border-b border-zinc-800/80 py-2 px-2 align-top font-mono text-zinc-400">
                                                    {row.phonetic}
                                                </td>
                                                <td className="border-b border-zinc-800/80 py-2 pl-2 align-top text-zinc-300">
                                                    {row.meaning}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : null}
                        </div>
                        <div className="flex min-w-0 flex-col gap-4">
                            {hasTakeaways ? (
                                <p className="whitespace-pre-wrap text-sm leading-normal text-zinc-300">
                                    {card.takeaways}
                                </p>
                            ) : null}
                            {youtubeUrl ? (
                                <a
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-sky-400 transition-colors hover:text-sky-300"
                                >
                                    ↗ 在 YouTube 听
                                </a>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
