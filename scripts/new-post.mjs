#!/usr/bin/env node
/**
 * 创建新博客文章模板
 * 用法: yarn blog:new "文章标题" --categories daily,note
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractExcerpt } from '../src/blog/excerpt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs(argv) {
    const titleParts = [];
    let categories = ['note'];

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--categories' || arg === '-c') {
            categories = (argv[i + 1] || 'note').split(',').map((s) => s.trim()).filter(Boolean);
            i += 1;
        } else if (!arg.startsWith('-')) {
            titleParts.push(arg);
        }
    }

    return {
        title: titleParts.join(' ').trim() || `新文章-${new Date().toISOString().slice(0, 10)}`,
        categories,
    };
}

function slugify(title) {
    const date = new Date().toISOString().slice(0, 10);
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return `${date}-${base || 'post'}`.replace(/-+/g, '-');
}

async function exists(filePath) {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

const { title, categories } = parseArgs(process.argv.slice(2));
const slug = slugify(title);
const postPath = path.join(root, 'content/posts', `${slug}.md`);
const imageDir = path.join(root, 'public/images/blog', slug);

if (await exists(postPath)) {
    console.error(`已存在: content/posts/${slug}.md`);
    process.exit(1);
}

const categoryYaml = categories.map((c) => `  - ${c}`).join('\n');
const sampleImage = `images/blog/${slug}/photo.jpg`;
const introBody = `# ${title}\n\n在这里开始写作…`;
const descriptionStub = extractExcerpt(introBody, 120);

const template = `---
title: ${JSON.stringify(title)}
slug: ${slug}
description: ${JSON.stringify(descriptionStub)}
author: 墨韵
date: ${new Date().toISOString().slice(0, 10)}
categories:
${categoryYaml}
tags: []
draft: true
featured: false
---

${introBody}

![示例图片](${sampleImage})
`;

await mkdir(imageDir, { recursive: true });
await writeFile(path.join(imageDir, '.gitkeep'), '');
await writeFile(postPath, template, 'utf8');

console.log('✓ 已创建文章:', `content/posts/${slug}.md`);
console.log('✓ 已创建图片目录:', `public/images/blog/${slug}/`);
console.log('');
console.log('下一步:');
console.log('  1. 编辑 Markdown 文件，将 draft 改为 false');
console.log('  2. 把图片放入 public/images/blog/' + slug + '/');
console.log('  3. yarn dev 预览，git push 发布');
