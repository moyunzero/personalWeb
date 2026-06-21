import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

/** Legacy alias: redirect /sitemap.xml → sitemap-index.xml */
export const GET: APIRoute = () => {
    const target = `${SITE.origin}${SITE.basePath}/sitemap-index.xml`;
    return new Response(null, {
        status: 301,
        headers: { Location: target },
    });
};
