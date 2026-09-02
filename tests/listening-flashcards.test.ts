/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListeningFlashcards from '../src/components/islands/ListeningFlashcards';

const fixturesDir = path.resolve('tests/fixtures/listening');

function loadEntry(name: string) {
    return JSON.parse(readFileSync(path.join(fixturesDir, name), 'utf8'));
}

afterEach(() => {
    cleanup();
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
});
