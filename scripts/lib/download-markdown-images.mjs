import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extFromUrl, hashUrl } from './notion-helpers.mjs';

const IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const HTML_IMG_RE = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

function isRemoteUrl(url) {
    return /^https?:\/\//i.test(url);
}

function shouldDownload(url) {
    if (!isRemoteUrl(url)) return false;
    return (
        url.includes('amazonaws.com') ||
        url.includes('notion.so') ||
        url.includes('notion-static.com') ||
        url.includes('prod-files-secure')
    );
}

/** Notion 导出的 S3 链接是预签名 URL，不能带 Authorization，否则会 400 */
function isPresignedS3Url(url) {
    try {
        const { searchParams } = new URL(url);
        return searchParams.has('X-Amz-Signature') || searchParams.has('X-Amz-Algorithm');
    } catch {
        return false;
    }
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRemoteImage(url, notionToken, retries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            let res;
            if (isPresignedS3Url(url)) {
                res = await fetch(url);
            } else {
                const authed = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${notionToken}`,
                        'Notion-Version': '2022-06-28',
                    },
                });
                if (authed.ok) {
                    return authed;
                }
                res = await fetch(url);
                if (!res.ok) res = authed;
            }

            if (res.ok || attempt === retries) {
                return res;
            }
        } catch (err) {
            lastError = err;
            if (attempt === retries) throw err;
        }

        await sleep(1000 * attempt);
    }

    throw lastError ?? new Error('图片下载失败');
}

export async function downloadMarkdownImages(markdown, { slug, imageDir, notionToken }) {
    const urlMap = new Map();
    const urls = new Set();

    for (const re of [IMAGE_RE, HTML_IMG_RE]) {
        re.lastIndex = 0;
        let match = re.exec(markdown);
        while (match) {
            const url = match[2] || match[1];
            if (shouldDownload(url)) urls.add(url);
            match = re.exec(markdown);
        }
    }

    if (urls.size === 0) {
        return { markdown, downloaded: 0 };
    }

    await mkdir(imageDir, { recursive: true });

    let index = 0;
    for (const url of urls) {
        index += 1;
        try {
            const res = await fetchRemoteImage(url, notionToken);
            if (!res.ok) {
                const hint = res.status === 403 ? '（链接可能已过期，请重新 sync）' : '';
                console.warn(`  ⚠ 图片下载失败 (${res.status})${hint}: ${url.slice(0, 80)}…`);
                continue;
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            const ext = extFromUrl(url, res.headers.get('content-type'));
            const filename = `img-${hashUrl(url)}${ext}`;
            const absolutePath = path.join(imageDir, filename);
            await writeFile(absolutePath, buffer);
            const publicPath = `images/blog/${slug}/${filename}`;
            urlMap.set(url, publicPath);
        } catch (err) {
            console.warn(`  ⚠ 图片下载异常: ${url.slice(0, 80)}…`, err.message);
        }
    }

    let result = markdown;
    for (const [remote, local] of urlMap) {
        result = result.split(remote).join(local);
    }

    return { markdown: result, downloaded: urlMap.size };
}

export async function downloadCoverImage(url, { slug, imageDir, notionToken }) {
    if (!url) return null;

    await mkdir(imageDir, { recursive: true });
    const res = await fetchRemoteImage(url, notionToken);
    if (!res.ok) {
        const hint = res.status === 403 ? '（链接可能已过期）' : '';
        console.warn(`  ⚠ 封面下载失败 (${res.status})${hint}`);
        return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = extFromUrl(url, res.headers.get('content-type'));
    const filename = `cover${ext}`;
    await writeFile(path.join(imageDir, filename), buffer);
    return `images/blog/${slug}/${filename}`;
}
