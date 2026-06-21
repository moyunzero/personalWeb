import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

export function normalizeMarkdownAssets(markdown: string): string {
    return markdown.replace(
        /\]\((?!https?:\/\/|\/)(images\/)/g,
        '](/personalWeb/$1'
    );
}

export async function renderMarkdown(source: string): Promise<string> {
    const normalized = normalizeMarkdownAssets(source);
    const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: false })
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .process(normalized);
    return String(result);
}
