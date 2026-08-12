/**
 * @vitest-environment jsdom
 *
 * Behaviour notes: Vite may prebundle `phaser`, so constructing a real Phaser.Game
 * in jsdom is unreliable without changing vitest.config. These tests lock the GH Pages
 * load contracts (critical path, timeout/retry UI, idle prefetch) and the failure path.
 */
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const gameIslandPath = path.resolve('src/components/islands/GameIsland.tsx');

const { phaserCtrl } = vi.hoisted(() => ({
    phaserCtrl: { fail: false as boolean },
}));

vi.mock('phaser', () => ({
    get default() {
        if (phaserCtrl.fail) {
            throw new Error('phaser chunk failed');
        }
        class Scene {}
        return {
            AUTO: 1,
            Scale: { RESIZE: 3 },
            Scene,
            Game: class PhaserGame {
                destroy() {}
            },
        };
    },
}));

vi.mock('../src/game/scenes/GameScene.js', () => ({
    default: class GameScene {},
}));

vi.mock('../src/game/GameTooltip.jsx', () => ({
    default: function GameTooltip() {
        return createElement('div', { 'data-testid': 'game-tooltip' }, 'tooltip');
    },
}));

vi.mock('../src/components/chat/ChatTrigger.jsx', () => ({
    default: function ChatTrigger() {
        return createElement('div', { 'data-testid': 'chat-trigger' }, 'trigger');
    },
}));

vi.mock('../src/components/chat/ChatPanel.jsx', () => ({
    default: function ChatPanel() {
        return createElement('div', { 'data-testid': 'chat-panel' }, 'panel');
    },
}));

describe('GameIsland phaser gating (source contracts)', () => {
    const source = readFileSync(gameIslandPath, 'utf8');

    it('does not top-level import phaser', () => {
        expect(source).not.toMatch(/from\s+['"]phaser['"]/);
        expect(source).toMatch(/import\s*\(/);
    });

    it('starts Phaser without waiting on chat UI chunks', () => {
        expect(source).toMatch(
            /withTimeout\(\s*Promise\.all\(\[\s*import\(['"]phaser['"]\)\s*,\s*import\(['"][^'"]*GameScene['"]\)\s*\]\)/,
        );
        const afterNinja = source.slice(source.indexOf('setLoading(false)'));
        expect(afterNinja).toMatch(/import\(['"][^'"]*ChatTrigger['"]\)/);
        expect(afterNinja).toMatch(/import\(['"][^'"]*ChatPanel['"]\)/);
        expect(afterNinja).toMatch(/import\(['"][^'"]*GameTooltip['"]\)/);
    });

    it('surfaces load failure with retry instead of hanging forever', () => {
        expect(source).toMatch(/PHASER_LOAD_TIMEOUT_MS/);
        expect(source).toMatch(/withTimeout/);
        expect(source).toMatch(/\.catch\(/);
        expect(source).toMatch(/loadError/);
        expect(source).toMatch(/onRetry/);
        expect(source).toMatch(/加载较慢或失败，点击重试/);
    });

    it('defers hover prefetch to idle so cosmos HDR is not starved', () => {
        expect(source).toMatch(/schedulePrefetchPhaserBundle/);
        expect(source).toMatch(/requestIdleCallback/);
        expect(source).toMatch(/onPointerEnter=\{onWarmup\}/);
        expect(source).toMatch(/schedulePrefetchPhaserBundle\(\)/);
    });
});

describe('GameIsland GH Pages load behaviour', () => {
    beforeEach(() => {
        phaserCtrl.fail = false;
        cleanup();
    });

    afterEach(() => {
        cleanup();
    });

    async function loadIsland() {
        vi.resetModules();
        const mod = await import('../src/components/islands/GameIsland');
        return mod.default;
    }

    it('shows an accessible start control before the game loads', async () => {
        const GameIsland = await loadIsland();
        render(createElement(GameIsland));
        const btn = screen.getByRole('button', { name: '点击启动忍者小游戏' });
        expect(btn).toBeTruthy();
        expect(btn.textContent).toMatch(/点击启动忍者/);
    });

    it('shows a retry control when Phaser fails to load instead of hanging', async () => {
        phaserCtrl.fail = true;
        const user = userEvent.setup();
        const GameIsland = await loadIsland();
        render(createElement(GameIsland));

        await user.click(screen.getByRole('button', { name: '点击启动忍者小游戏' }));

        const retry = await screen.findByRole('button', {
            name: '忍者加载失败，点击重试',
        });
        expect(retry.textContent).toMatch(/加载较慢或失败，点击重试/);
        expect(screen.queryByText('忍者登场中…')).toBeNull();
    });
});
