import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

export const GET: APIRoute = () => {
    const sitemapUrl = `${SITE.origin}${SITE.basePath}/sitemap-index.xml`;
    const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;
    return new Response(body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
