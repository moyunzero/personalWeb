import { describe, expect, it } from 'vitest';
import {
    collectBannedImports,
    extractImportSpecifiers,
    findBannedImportsInSource,
    isBannedResolvedPath,
    resolveToRepoPath,
} from './lib/legacy-spa-import-scan';

describe('legacy SPA import scan', () => {
    it('does not statically import banned legacy paths under src, scripts, or tests (AC-4, AC-5)', () => {
        const hits = collectBannedImports();
        expect(
            hits,
            hits.map((h) => `${h.file} imports ${h.specifier} -> ${h.resolved}`).join('\n') ||
                'no banned imports',
        ).toEqual([]);
    });

    it('matches by resolved path with extension, not basename alone (AC-4)', () => {
        const importer = 'src/pages/blog/index.astro';
        const kept = resolveToRepoPath(importer, '../../components/blog/BlogPostCard.astro');
        const banned = resolveToRepoPath(importer, '../../components/blog/BlogPostCard.jsx');
        expect(kept).toBe('src/components/blog/BlogPostCard.astro');
        expect(banned).toBe('src/components/blog/BlogPostCard.jsx');
        expect(isBannedResolvedPath(kept!)).toBe(false);
        expect(isBannedResolvedPath(banned!)).toBe(true);
    });

    it('ignores non-import string literals that mention banned paths (AC-4, AC-5)', () => {
        const sample = `
            import { existsSync } from 'node:fs';
            const gone = existsSync('src/main.jsx');
            // import legacy from '../pages/_Home.jsx';
            /* import x from '../App.jsx' */
        `;
        const specs = extractImportSpecifiers(sample);
        expect(specs).toEqual(['node:fs']);
        expect(specs.some((s) => s.includes('main.jsx') || s.includes('_Home'))).toBe(false);
    });

    it('flags require() of a banned relative path (AC-4)', () => {
        const source = "const App = require('../../App.jsx');";
        const hits = findBannedImportsInSource('src/components/chat/ChatBubble.jsx', source);
        expect(hits).toEqual([{ specifier: '../../App.jsx', resolved: 'src/App.jsx' }]);
    });

    it('flags dynamic import() of a banned relative path (AC-4)', () => {
        const source = 'const mod = await import("./pages/_Home.jsx");';
        const hits = findBannedImportsInSource('src/main.jsx', source);
        expect(hits).toEqual([{ specifier: './pages/_Home.jsx', resolved: 'src/pages/_Home.jsx' }]);
    });

    it('flags imports under the src/hooks directory sentinel (AC-4)', () => {
        const source = "import useScroll from '../../hooks/useScrollToTop.js';";
        const hits = findBannedImportsInSource('src/components/chat/ChatBubble.jsx', source);
        expect(hits).toEqual([
            { specifier: '../../hooks/useScrollToTop.js', resolved: 'src/hooks/useScrollToTop.js' },
        ]);
        expect(isBannedResolvedPath('src/hooks/useScrollToTop.js')).toBe(true);
    });

    it('ignores import-like text inside string literals in source files (AC-4, AC-5)', () => {
        const sample = `
            const template = "import App from '../src/App.jsx';\\n";
            const gone = existsSync('src/main.jsx');
        `;
        const specs = extractImportSpecifiers(sample);
        expect(specs).toEqual([]);
    });
});
