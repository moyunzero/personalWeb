/**
 * Shared banned list for legacy Vite SPA cleanup guards.
 * Membership mirrors the frozen deletion matrix in docs/specs/0001-remove-legacy-vite-spa.md
 * and the lists previously inlined in tests/legacy-vite-spa-cleanup.test.ts.
 */

export const legacyEntryFiles = [
    'index.html',
    'vite.config.js',
    'src/main.jsx',
    'src/App.jsx',
    'src/routes/index.js',
    'src/layouts/MainLayout.jsx',
    'src/pages/_Home.jsx',
    'src/pages/_Blog.jsx',
    'src/pages/_BlogDetail.jsx',
] as const;

export const legacySpaOnlyFiles = [
    'src/services/api.js',
    'src/game/PhaserGame.jsx',
    'src/components/ErrorBoundary.jsx',
    'src/components/common/Header.jsx',
    'src/components/common/Footer.jsx',
    'src/components/common/Navbar.jsx',
    'src/components/common/Button.jsx',
    'src/components/common/LoadingSpinner.jsx',
    'src/components/common/ParticleCanvas.jsx',
    'src/components/common/MouseTrail.jsx',
    'src/components/home/Main.jsx',
    'src/components/home/About.jsx',
    'src/components/home/Skill.jsx',
    'src/components/home/Work.jsx',
    'src/components/home/ProjectCard.jsx',
    'src/components/home/SkillCard.jsx',
    'src/components/blog/BlogNavbar.jsx',
    'src/components/blog/BlogPostCard.jsx',
    'src/components/blog/BlogFeaturedCard.jsx',
    'src/components/blog/BlogFooter.jsx',
    'src/components/blog/MarkdownContent.jsx',
    'src/components/blog/MermaidDiagram.jsx',
    'src/components/blog/BlogPostNav.jsx',
    'src/components/blog/ReadingProgressBar.jsx',
    'scripts/generate-static.mjs',
    'scripts/lib/build-posts-index.mjs',
] as const;

export const legacyBlogHelpers = [
    'src/blog/loadPosts.js',
    'src/blog/index.js',
    'src/blog/filterPosts.js',
    'src/blog/groupPostsByYear.js',
    'src/blog/getFeaturedPosts.js',
    'src/blog/getAdjacentPosts.js',
    'src/blog/normalizeMarkdown.js',
    'src/blog/buildMarkdown.js',
] as const;

/** Directory sentinels: any resolved import under these prefixes is banned. */
export const legacyDirSentinels = ['src/hooks'] as const;

export const removedDirectDeps = [
    'react-router-dom',
    'react-tsparticles',
    'tsparticles',
    'prop-types',
    '@vitejs/plugin-react',
    'vite',
    'terser',
] as const;

/** All banned file paths (entry + SPA only + blog helpers). */
export const bannedFilePaths: readonly string[] = [
    ...legacyEntryFiles,
    ...legacySpaOnlyFiles,
    ...legacyBlogHelpers,
];
