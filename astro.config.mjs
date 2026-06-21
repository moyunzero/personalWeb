import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { SITE } from './scripts/lib/site-config.mjs';

export default defineConfig({
    site: SITE.origin,
    base: `${SITE.basePath}/`,
    trailingSlash: 'always',
    output: 'static',
    build: {
        format: 'directory',
    },
    integrations: [
        react(),
        tailwind({ applyBaseStyles: false }),
        sitemap(),
    ],
    markdown: {
        shikiConfig: {
            theme: 'github-dark',
        },
    },
});
