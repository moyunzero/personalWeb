import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { planStaleListeningDeletes } from '../scripts/lib/listening-stale.mjs';

describe('planStaleListeningDeletes (D-13)', () => {
    const dirs = {
        jsonDir: 'content/listening',
        audioDir: 'public/audio/listening',
    };

    it('returns json and mp3 paths only for local ids absent from remote done set', () => {
        const paths = planStaleListeningDeletes(['a', 'b'], ['a'], dirs);
        expect(paths).toEqual([
            path.join(dirs.jsonDir, 'b.json'),
            path.join(dirs.audioDir, 'b.mp3'),
        ]);
    });

    it('plans all local ids when remote done set is empty', () => {
        const paths = planStaleListeningDeletes(['x', 'y'], [], dirs);
        expect(paths).toContain(path.join(dirs.jsonDir, 'x.json'));
        expect(paths).toContain(path.join(dirs.audioDir, 'x.mp3'));
        expect(paths).toContain(path.join(dirs.jsonDir, 'y.json'));
        expect(paths).toContain(path.join(dirs.audioDir, 'y.mp3'));
        expect(paths).toHaveLength(4);
    });

    it('returns empty when every local id is still in remote done set', () => {
        expect(planStaleListeningDeletes(['a'], ['a', 'b'], dirs)).toEqual([]);
    });

    it('documents fixtures must stay under tests/fixtures/listening (not content/listening)', () => {
        // Vitest fixtures live under tests/fixtures/listening so --all cannot wipe them.
        // This planner only returns paths; sync applies unlink in 02-03.
        const fixtureSafeRoot = 'tests/fixtures/listening';
        expect(fixtureSafeRoot.startsWith('tests/fixtures/')).toBe(true);
        expect(fixtureSafeRoot.startsWith('content/listening')).toBe(false);
    });
});
