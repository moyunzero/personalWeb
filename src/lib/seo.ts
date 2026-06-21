import { SITE } from './site';

export interface SeoInput {
    title: string;
    description?: string;
    path: string;
    canonical?: string;
    ogImage?: string;
    noindex?: boolean;
    type?: 'website' | 'article';
    publishedAt?: string;
    updatedAt?: string;
    keywords?: string[];
}

function normalizePath(path: string): string {
    const withLeading = path.startsWith('/') ? path : `/${path}`;
    if (withLeading.endsWith('/')) return withLeading;
    return `${withLeading}/`;
}

export function siteUrl(path = '/'): string {
    const base = SITE.basePath.replace(/\/$/, '');
    const normalized = normalizePath(path);
    return `${SITE.origin}${base}${normalized === '/' ? '/' : normalized}`;
}

export function canonicalUrl(input: SeoInput): string {
    if (input.canonical) {
        if (input.canonical.startsWith('http')) return input.canonical;
        return siteUrl(input.canonical);
    }
    return siteUrl(input.path);
}

export function ogImageUrl(input: SeoInput): string | undefined {
    const image = input.ogImage;
    if (!image) return undefined;
    if (image.startsWith('http')) return image;
    return siteUrl(image.startsWith('/') ? image : `/${image}`);
}

export function articleJsonLd(input: SeoInput): Record<string, unknown> | null {
    if (input.type !== 'article' || !input.publishedAt) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: input.title,
        description: input.description,
        datePublished: input.publishedAt,
        dateModified: input.updatedAt ?? input.publishedAt,
        author: {
            '@type': 'Person',
            name: SITE.author,
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl(input),
        },
        image: ogImageUrl(input),
    };
}

export function websiteJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE.name,
        url: siteUrl('/'),
        description: SITE.description,
        inLanguage: SITE.language,
    };
}

export function personJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: SITE.author,
        url: siteUrl('/'),
        description: SITE.description,
    };
}
