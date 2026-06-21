import { visit } from 'unist-util-visit';
import type { Element, Root, Text } from 'hast';

function hastToText(node: Element | Text): string {
    if (node.type === 'text') return node.value;
    if (node.type !== 'element') return '';
    return node.children
        .map((child) => hastToText(child as Element | Text))
        .join('');
}

function getMermaidChart(pre: Element): string | null {
    const code = pre.children[0];
    if (!code || code.type !== 'element' || code.tagName !== 'code') return null;

    const className = code.properties?.className;
    const classes = Array.isArray(className)
        ? className.map(String)
        : typeof className === 'string'
          ? className.split(/\s+/)
          : [];

    if (!classes.some((c) => c.includes('language-mermaid'))) return null;
    return hastToText(code).trim();
}

/** Build-time: replace ```mermaid with client-hydrated diagram hosts. */
export function rehypeMermaidMark() {
    return (tree: Root) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.tagName !== 'pre' || !parent || index === undefined) {
                return;
            }
            const chart = getMermaidChart(node);
            if (!chart) return;

            const host: Element = {
                type: 'element',
                tagName: 'div',
                properties: {
                    className: [
                        'mermaid-diagram-host',
                        'my-8',
                        'flex',
                        'min-h-[120px]',
                        'items-center',
                        'justify-center',
                        'overflow-x-auto',
                        'rounded-xl',
                        'border',
                        'border-zinc-700/80',
                        'bg-zinc-950',
                        'p-6',
                        'text-sm',
                        'text-zinc-500',
                    ],
                    'data-mermaid': Buffer.from(chart, 'utf8').toString('base64'),
                    role: 'img',
                    'aria-label': 'Mermaid diagram',
                    'aria-busy': 'true',
                },
                children: [{ type: 'text', value: '正在加载图表…' }],
            };

            (parent as { children: Root['children'] }).children[index] = host;
        });
    };
}
