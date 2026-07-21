import { describe, expect, it } from 'vitest';
import {
    bannedFilePaths,
    legacyBlogHelpers,
    legacyDirSentinels,
    legacyEntryFiles,
    legacySpaOnlyFiles,
    removedDirectDeps,
} from './fixtures/legacy-spa-paths';

describe('legacy SPA banned list fixture (AC-1)', () => {
    it('exports entry, SPA only, and blog helper file lists from the 0001 matrix', () => {
        expect(legacyEntryFiles).toContain('vite.config.js');
        expect(legacyEntryFiles).toContain('src/main.jsx');
        expect(legacySpaOnlyFiles).toContain('src/components/blog/BlogPostCard.jsx');
        expect(legacyBlogHelpers).toContain('src/blog/loadPosts.js');
    });

    it('exports the src/hooks directory sentinel', () => {
        expect(legacyDirSentinels).toEqual(['src/hooks']);
    });

    it('exports removed direct dependency names', () => {
        expect(removedDirectDeps).toEqual(
            expect.arrayContaining([
                'react-router-dom',
                'vite',
                '@vitejs/plugin-react',
                'prop-types',
            ]),
        );
    });

    it('builds bannedFilePaths as the union of all banned file lists', () => {
        expect(bannedFilePaths.length).toBe(
            legacyEntryFiles.length + legacySpaOnlyFiles.length + legacyBlogHelpers.length,
        );
        expect(bannedFilePaths).toContain('src/pages/_Home.jsx');
        expect(bannedFilePaths).not.toContain('src/hooks');
    });
});
