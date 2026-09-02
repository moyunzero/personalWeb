/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListeningFlashcards from '../src/components/islands/ListeningFlashcards';

const fixturesDir = path.resolve('tests/fixtures/listening');

function loadEntry(name: string) {
    return JSON.parse(readFileSync(path.join(fixturesDir, name), 'utf8'));
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('ListeningFlashcards', () => {
    it('shows empty heading and body when entries are empty (D-03)', () => {
        render(
            createElement(ListeningFlashcards, {
                entries: [],
                baseUrl: '/personalWeb/',
            }),
        );

        expect(screen.getByRole('heading', { name: '暂无记录' })).toBeTruthy();
        expect(
            screen.getByText('有完成的条目后会出现在这里。'),
        ).toBeTruthy();
        expect(screen.queryByRole('button', { name: '揭晓' })).toBeNull();
    });

    it('defaults focus to newest title and reveals/hides sentence (D-04, D-05)', async () => {
        const user = userEvent.setup();
        const older = loadEntry('valid-entry.json');
        const newer = loadEntry('entry-newer.json');

        render(
            createElement(ListeningFlashcards, {
                entries: [newer, older],
                baseUrl: '/personalWeb/',
            }),
        );

        expect(
            screen.getByRole('heading', { level: 1 }).textContent,
        ).toBe('Newer listening card');
        expect(screen.queryByText(newer.date)).toBeNull();
        expect(screen.queryByText(older.date)).toBeNull();
        expect(
            screen.queryByText('Fresh practice lands on the focus stage first.'),
        ).toBeNull();

        await user.click(screen.getByRole('button', { name: '揭晓' }));
        expect(
            screen.getByText('Fresh practice lands on the focus stage first.'),
        ).toBeTruthy();

        await user.click(screen.getByRole('button', { name: '收起' }));
        expect(
            screen.queryByText('Fresh practice lands on the focus stage first.'),
        ).toBeNull();
    });

    it('does not reference Web Speech APIs (D-09)', () => {
        const source = readFileSync(
            path.resolve('src/components/islands/ListeningFlashcards.tsx'),
            'utf8',
        );
        expect(source).not.toMatch(/speechSynthesis|webkitSpeech|SpeechSynthesis/);
    });

    it('does not show Piper TTS footer credit on /listening/ (user override of D-12)', () => {
        const layout = readFileSync(
            path.resolve('src/layouts/BlogLayout.astro'),
            'utf8',
        );
        const page = readFileSync(
            path.resolve('src/pages/listening/index.astro'),
            'utf8',
        );
        expect(layout).not.toMatch(/footerCredit/);
        expect(page).not.toContain('语音：Piper');
        expect(page).not.toContain('en_US-amy-medium');
    });

    it('blog index and category nav link 打卡 to /listening/ (ENTRY-01)', () => {
        const blogIndex = readFileSync(
            path.resolve('src/pages/blog/index.astro'),
            'utf8',
        );
        const categoryPage = readFileSync(
            path.resolve('src/pages/blog/category/[id].astro'),
            'utf8',
        );
        const categories = readFileSync(
            path.resolve('content/categories.json'),
            'utf8',
        );
        expect(blogIndex).toMatch(/href=\{`\$\{base\}listening\/`\}/);
        expect(blogIndex).toContain('打卡');
        expect(categoryPage).toMatch(/href=\{`\$\{base\}listening\/`\}/);
        expect(categoryPage).toContain('打卡');
        expect(categories).not.toMatch(/"打卡"/);
        expect(categories).not.toMatch(/"id":\s*"listening"/);
    });

    it('enables play/replay with BASE_URL audio and no autoplay (D-07, D-08, LISTEN-02)', async () => {
        const user = userEvent.setup();
        const entry = loadEntry('entry-with-audio.json');
        const playSpy = vi
            .spyOn(HTMLMediaElement.prototype, 'play')
            .mockResolvedValue(undefined);
        const pauseSpy = vi
            .spyOn(HTMLMediaElement.prototype, 'pause')
            .mockImplementation(() => {});

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        const audio = document.querySelector('audio');
        expect(audio).toBeTruthy();
        expect(audio?.getAttribute('src')).toBe(
            `/personalWeb/${entry.audioSrc}`,
        );
        expect(playSpy).not.toHaveBeenCalled();

        const playBtn = screen.getByRole('button', { name: '播放' });
        expect((playBtn as HTMLButtonElement).disabled).toBe(false);
        const replayBtn = screen.getByRole('button', { name: '重播' });
        expect((replayBtn as HTMLButtonElement).disabled).toBe(false);

        await user.click(playBtn);
        expect(playSpy).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: '暂停' })).toBeTruthy();

        await user.click(screen.getByRole('button', { name: '暂停' }));
        expect(pauseSpy).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: '播放' })).toBeTruthy();

        Object.defineProperty(audio!, 'currentTime', {
            configurable: true,
            writable: true,
            value: 12,
        });
        await user.click(replayBtn);
        expect(audio!.currentTime).toBe(0);
        expect(playSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('disables play and 重播 when audioSrc is missing; 揭晓 still works (D-08, LISTEN-02)', async () => {
        const user = userEvent.setup();
        const entry = loadEntry('valid-entry.json');
        expect(entry.audioSrc).toBeUndefined();

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        expect(document.querySelector('audio')).toBeNull();
        expect(
            (screen.getByRole('button', { name: '播放' }) as HTMLButtonElement)
                .disabled,
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: '重播' }) as HTMLButtonElement)
                .disabled,
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: '揭晓' }) as HTMLButtonElement)
                .disabled,
        ).toBe(false);

        await user.click(screen.getByRole('button', { name: '揭晓' }));
        expect(screen.getByText(entry.sentence)).toBeTruthy();
    });

    it('disables play and 重播 after audio media error; 揭晓 still works (D-08, LISTEN-02)', async () => {
        const user = userEvent.setup();
        const entry = loadEntry('entry-with-audio.json');
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(
            undefined,
        );

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        const audio = document.querySelector('audio');
        expect(audio).toBeTruthy();
        expect(
            (screen.getByRole('button', { name: '播放' }) as HTMLButtonElement)
                .disabled,
        ).toBe(false);

        fireEvent.error(audio!);

        expect(
            (screen.getByRole('button', { name: '播放' }) as HTMLButtonElement)
                .disabled,
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: '重播' }) as HTMLButtonElement)
                .disabled,
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: '揭晓' }) as HTMLButtonElement)
                .disabled,
        ).toBe(false);

        await user.click(screen.getByRole('button', { name: '揭晓' }));
        expect(screen.getByText(entry.sentence)).toBeTruthy();
    });

    it('full reveal shows sentence, vocab table, takeaways, and YouTube outbound (REVEAL-01, REVEAL-02)', async () => {
        const user = userEvent.setup();
        const entry = loadEntry('entry-full-reveal.json');

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        const revealBtn = screen.getByRole('button', { name: '揭晓' });
        expect(revealBtn.getAttribute('aria-expanded')).toBe('false');

        await user.click(revealBtn);

        expect(screen.getByText(entry.sentence)).toBeTruthy();
        expect(screen.getByRole('columnheader', { name: '词' })).toBeTruthy();
        expect(screen.getByRole('columnheader', { name: '音标' })).toBeTruthy();
        expect(screen.getByRole('columnheader', { name: '释义' })).toBeTruthy();
        expect(screen.getByText('clarity')).toBeTruthy();
        expect(screen.getByText('/ˈklærəti/')).toBeTruthy();
        expect(screen.getByText('清晰；明晰')).toBeTruthy();
        expect(screen.getByText(entry.takeaways)).toBeTruthy();

        const yt = screen.getByRole('link', { name: /在 YouTube 听/ });
        expect(yt.getAttribute('href')).toBe(entry.youtubeUrl);
        expect(yt.getAttribute('target')).toBe('_blank');
        expect(yt.getAttribute('rel') ?? '').toContain('noopener');

        expect(
            screen.getByRole('button', { name: '收起' }).getAttribute(
                'aria-expanded',
            ),
        ).toBe('true');

        await user.click(screen.getByRole('button', { name: '收起' }));
        expect(screen.queryByText(entry.sentence)).toBeNull();
        expect(screen.queryByRole('link', { name: /在 YouTube 听/ })).toBeNull();
        expect(
            screen.getByRole('button', { name: '揭晓' }).getAttribute(
                'aria-expanded',
            ),
        ).toBe('false');
    });

    it('renders multi-line sentence and takeaways as numbered lists', async () => {
        const user = userEvent.setup();
        const entry = {
            ...loadEntry('entry-full-reveal.json'),
            sentence: "Jerry, what time do you have?\nI have 5 o'clock.",
            takeaways:
                'Similar sound linking（相似音连读）。\nH-cancellation（H 音脱落）。',
        };

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        await user.click(screen.getByRole('button', { name: '揭晓' }));

        expect(screen.getByText('Jerry, what time do you have?')).toBeTruthy();
        expect(screen.getByText("I have 5 o'clock.")).toBeTruthy();
        expect(
            screen.getByText('Similar sound linking（相似音连读）。'),
        ).toBeTruthy();
        expect(screen.getByText('H-cancellation（H 音脱落）。')).toBeTruthy();

        const lists = screen.getAllByRole('list');
        // stage sentence ol + takeaways ol (+ rail may not use list role for cards — ul has list)
        expect(lists.length).toBeGreaterThanOrEqual(2);
        const stageLists = lists.filter((el) => el.tagName === 'OL');
        expect(stageLists).toHaveLength(2);
        expect(stageLists[0].querySelectorAll('li')).toHaveLength(2);
        expect(stageLists[1].querySelectorAll('li')).toHaveLength(2);
    });

    it('omits empty vocab table, takeaways block, and YouTube when absent (REVEAL-01, REVEAL-02)', async () => {
        const user = userEvent.setup();
        const entry = loadEntry('valid-entry.json');

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        await user.click(screen.getByRole('button', { name: '揭晓' }));

        expect(screen.getByText(entry.sentence)).toBeTruthy();
        expect(screen.queryByRole('columnheader', { name: '词' })).toBeNull();
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByRole('link', { name: /在 YouTube 听/ })).toBeNull();
    });

    it('history rail shows all cards with aria-current on focus; switch collapses reveal (D-01, D-02, LISTEN-01)', async () => {
        const user = userEvent.setup();
        const older = loadEntry('valid-entry.json');
        const newer = loadEntry('entry-newer.json');
        const playSpy = vi
            .spyOn(HTMLMediaElement.prototype, 'play')
            .mockResolvedValue(undefined);

        render(
            createElement(ListeningFlashcards, {
                entries: [newer, older],
                baseUrl: '/personalWeb/',
            }),
        );

        expect(screen.getByText('全部记录')).toBeTruthy();

        const railCards = screen.getAllByRole('button', {
            name: /切换到台面|当前/,
        });
        expect(railCards).toHaveLength(2);
        expect(railCards[0].getAttribute('aria-current')).toBe('true');
        expect(railCards[1].getAttribute('aria-current')).toBeNull();
        expect(screen.queryByText(newer.date)).toBeNull();
        expect(screen.queryByText(older.date)).toBeNull();

        await user.click(screen.getByRole('button', { name: '揭晓' }));
        expect(screen.getByText(newer.sentence)).toBeTruthy();

        const playCallsBefore = playSpy.mock.calls.length;
        await user.click(railCards[1]);

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
            older.title,
        );
        expect(screen.queryByText(newer.sentence)).toBeNull();
        expect(screen.queryByText(older.sentence)).toBeNull();
        expect(screen.getByRole('button', { name: '揭晓' })).toBeTruthy();
        expect(playSpy.mock.calls.length).toBe(playCallsBefore);

        const after = screen.getAllByRole('button', {
            name: /切换到台面|当前/,
        });
        expect(after[1].getAttribute('aria-current')).toBe('true');
        expect(after[0].getAttribute('aria-current')).toBeNull();
    });

    it('single entry still renders one current rail card (LISTEN-01)', () => {
        const entry = loadEntry('valid-entry.json');

        render(
            createElement(ListeningFlashcards, {
                entries: [entry],
                baseUrl: '/personalWeb/',
            }),
        );

        const railCards = screen.getAllByRole('button', {
            name: /切换到台面|当前/,
        });
        expect(railCards).toHaveLength(1);
        expect(railCards[0].getAttribute('aria-current')).toBe('true');
    });
});
