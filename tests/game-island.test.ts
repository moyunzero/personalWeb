import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const gameIslandPath = path.resolve('src/components/islands/GameIsland.tsx');

describe('GameIsland phaser gating', () => {
    it('does not top-level import phaser', () => {
        const source = readFileSync(gameIslandPath, 'utf8');
        expect(source).not.toMatch(/from\s+['"]phaser['"]/);
        expect(source).toMatch(/import\s*\(/);
    });
});
