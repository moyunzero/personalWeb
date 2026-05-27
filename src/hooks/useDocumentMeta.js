import { useEffect } from 'react';

const SITE_NAME = '墨韵';

/**
 * 更新 document.title 与 meta description（GitHub Pages SPA 友好）
 * @param {{ title?: string, description?: string }} meta
 */
export function useDocumentMeta({ title, description }) {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;

        let metaTag = document.querySelector('meta[name="description"]');
        const created = !metaTag;
        const previousDescription = metaTag?.getAttribute('content') ?? '';

        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'description');
            document.head.appendChild(metaTag);
        }

        if (description) {
            metaTag.setAttribute('content', description);
        }

        return () => {
            document.title = previousTitle;
            if (!metaTag) return;

            if (created) {
                metaTag.remove();
                return;
            }

            if (previousDescription) {
                metaTag.setAttribute('content', previousDescription);
            } else {
                metaTag.removeAttribute('content');
            }
        };
    }, [title, description]);
}
