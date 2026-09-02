/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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

        expect(screen.getByText('Newer listening card')).toBeTruthy();
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

    it('wires BlogLayout footerCredit with Piper CC BY-SA line (D-12)', () => {
        const layout = readFileSync(
            path.resolve('src/layouts/BlogLayout.astro'),
            'utf8',
        );
        const page = readFileSync(
            path.resolve('src/pages/listening/index.astro'),
            'utf8',
        );
        expect(layout).toMatch(/footerCredit\??:\s*string/);
        expect(layout).toMatch(/footerCredit/);
        expect(page).toContain('语音：Piper · en_US-amy-medium · CC BY-SA');
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
        expect(playBtn).not.toBeDisabled();
        const replayBtn = screen.getByRole('button', { name: '重播' });
        expect(replayBtn).not.toBeDisabled();

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
});
