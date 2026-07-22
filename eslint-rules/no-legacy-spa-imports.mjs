import path from 'node:path';
import { isBannedResolvedPath, resolveToRepoPath, root } from '../scripts/lib/legacy-spa-import-guard.mjs';

function repoRelativePath(context) {
    const filename = context.filename ?? context.getFilename?.();
    if (!filename) return null;
    const rel = path.relative(root, filename);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    return rel.split(path.sep).join('/');
}

function literalValue(node) {
    if (!node) return null;
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
    return null;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow imports that resolve to banned legacy Vite SPA paths',
        },
        messages: {
            banned:
                'Import "{{specifier}}" resolves to banned legacy path "{{resolved}}"',
        },
        schema: [],
    },
    create(context) {
        const importerRel = repoRelativePath(context);
        if (!importerRel) return {};

        function report(node, specifier, resolved) {
            context.report({
                node,
                messageId: 'banned',
                data: { specifier, resolved },
            });
        }

        function check(node, specifier) {
            if (typeof specifier !== 'string' || !specifier.startsWith('.')) return;
            const resolved = resolveToRepoPath(importerRel, specifier);
            if (resolved && isBannedResolvedPath(resolved)) {
                report(node, specifier, resolved);
            }
        }

        return {
            ImportDeclaration(node) {
                check(node.source, literalValue(node.source));
            },
            ExportNamedDeclaration(node) {
                if (node.source) check(node.source, literalValue(node.source));
            },
            ExportAllDeclaration(node) {
                check(node.source, literalValue(node.source));
            },
            ImportExpression(node) {
                check(node.source, literalValue(node.source));
            },
            CallExpression(node) {
                const specifier = literalValue(node.arguments[0]);
                if (!specifier) return;

                if (
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'require'
                ) {
                    check(node.arguments[0], specifier);
                }
            },
        };
    },
};

export default rule;
