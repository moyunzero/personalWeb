import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import { toHtml } from 'hast-util-to-html';
import type { Root } from 'hast';
import { rehypeMermaidMark } from './rehype-mermaid';

export function normalizeMarkdownAssets(markdown: string): string {
    return markdown.replace(
        /\]\((?!https?:\/\/|\/)(images\/)/g,
        '](/personalWeb/$1'
    );
}

export async function renderMarkdown(source: string): Promise<string> {
    const normalized = normalizeMarkdownAssets(source);
    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: false })
        .use(rehypeMermaidMark)
        .use(rehypeHighlight);

    const file = processor.parse(normalized);
    const tree = (await processor.run(file)) as Root;
    return toHtml(tree, { allowDangerousHtml: true });
}
