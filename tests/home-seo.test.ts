import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { personJsonLd, websiteJsonLd } from '../src/lib/seo';
import { SITE } from '../src/lib/site';

const distIndex = path.resolve('dist/index.html');

describe('home SEO helpers', () => {
    it('personJsonLd returns Person with author name', () => {
        const json = personJsonLd();
        expect(json['@type']).toBe('Person');
        expect(json.name).toBe(SITE.author);
    });

    it('websiteJsonLd returns WebSite', () => {
        const json = websiteJsonLd();
        expect(json['@type']).toBe('WebSite');
        expect(json.name).toBe(SITE.name);
    });
});

describe('home page built HTML', () => {
    it('contains Person and WebSite JSON-LD after build', () => {
        if (!existsSync(distIndex)) {
            return;
        }
        const html = readFileSync(distIndex, 'utf8');
        expect(html).toMatch(/application\/ld\+json/);
        expect(html).toMatch(/Person/);
        expect(html).toMatch(/WebSite/);
    });
});
