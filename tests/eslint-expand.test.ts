import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ESLint, RuleTester } from 'eslint';
import noLegacySpaImports from '../eslint-rules/no-legacy-spa-imports.mjs';
import { bannedFilePaths as bannedFromMjs } from '../scripts/lib/legacy-spa-paths.mjs';
import { bannedFilePaths as bannedFromFixture } from './fixtures/legacy-spa-paths';
import {
    findBannedImportsInSource,
    isBannedResolvedPath,
    resolveToRepoPath,
} from '../scripts/lib/legacy-spa-import-guard.mjs';

const root = path.resolve('.');

function readText(relativePath: string) {
    return readFileSync(path.join(root, relativePath), 'utf8');
}

function runEslint(args: string, input?: string) {
    try {
        const out = execSync(`yarn eslint ${args}`, {
            cwd: root,
            encoding: 'utf8',
            input,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { exitCode: 0, combined: out };
    } catch (error) {
        const err = error as { status?: number; stdout?: string; stderr?: string };
        return {
            exitCode: err.status ?? 1,
            combined: `${err.stdout ?? ''}${err.stderr ?? ''}`,
        };
    }
}

describe('eslint expand TypeScript and Astro (spec 0004)', () => {
    describe('shared legacy SPA guard (AC-5, AC-8)', () => {
        it('keeps tests/fixtures re-export aligned with scripts/lib/legacy-spa-paths.mjs (AC-5)', () => {
            expect(bannedFromFixture).toEqual(bannedFromMjs);
        });

        it('matches resolved paths with extension, not basename alone (AC-4, AC-8)', () => {
            const importer = 'src/pages/blog/index.astro';
            const kept = resolveToRepoPath(importer, '../../components/blog/LedgerRow.astro');
            const banned = resolveToRepoPath(importer, '../../components/blog/BlogPostCard.jsx');
            expect(kept).toBe('src/components/blog/LedgerRow.astro');
            expect(banned).toBe('src/components/blog/BlogPostCard.jsx');
            expect(isBannedResolvedPath(kept!)).toBe(false);
            expect(isBannedResolvedPath(banned!)).toBe(true);
        });

        it('findBannedImportsInSource flags static legacy imports (AC-4)', () => {
            const source = "import App from '../../App.jsx';";
            const hits = findBannedImportsInSource('src/components/chat/ChatBubble.jsx', source);
            expect(hits).toEqual([{ specifier: '../../App.jsx', resolved: 'src/App.jsx' }]);
        });

        it('findBannedImportsInSource flags dynamic import() specifiers (AC-4)', () => {
            const source = "const mod = import('../../App.jsx');";
            const hits = findBannedImportsInSource('src/components/chat/ChatBubble.jsx', source);
            expect(hits).toEqual([{ specifier: '../../App.jsx', resolved: 'src/App.jsx' }]);
        });
    });

    describe('local ESLint rule (AC-4)', () => {
        const ruleTester = new RuleTester({
            languageOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
        });

        it('reports banned resolved imports at error severity via RuleTester (AC-4)', () => {
            ruleTester.run('no-legacy-spa-imports', noLegacySpaImports, {
                valid: [
                    {
                        code: "import { x } from './cosmosHitTest.ts';",
                        filename: path.join(root, 'src/components/islands/HomeMotion.tsx'),
                    },
                    {
                        code: "import Card from '../../components/blog/LedgerRow.astro';",
                        filename: path.join(root, 'src/pages/blog/index.astro'),
                    },
                ],
                invalid: [
                    {
                        code: "import App from '../../App.jsx';",
                        filename: path.join(root, 'src/components/chat/ChatBubble.jsx'),
                        errors: [
                            {
                                messageId: 'banned',
                                data: {
                                    specifier: '../../App.jsx',
                                    resolved: 'src/App.jsx',
                                },
                            },
                        ],
                    },
                    {
                        code: "const hook = require('../../hooks/useScroll.js');",
                        filename: path.join(root, 'src/components/chat/ChatBubble.jsx'),
                        errors: [
                            {
                                messageId: 'banned',
                                data: {
                                    specifier: '../../hooks/useScroll.js',
                                    resolved: 'src/hooks/useScroll.js',
                                },
                            },
                        ],
                    },
                    {
                        code: "const mod = import('../../App.jsx');",
                        filename: path.join(root, 'src/components/chat/ChatBubble.jsx'),
                        errors: [
                            {
                                messageId: 'banned',
                                data: {
                                    specifier: '../../App.jsx',
                                    resolved: 'src/App.jsx',
                                },
                            },
                        ],
                    },
                    {
                        code: "export { App } from '../../App.jsx';",
                        filename: path.join(root, 'src/components/chat/ChatBubble.jsx'),
                        errors: [
                            {
                                messageId: 'banned',
                                data: {
                                    specifier: '../../App.jsx',
                                    resolved: 'src/App.jsx',
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it('flags banned dynamic import() through the full ESLint pipeline (AC-4)', async () => {
            const eslint = new ESLint();
            const [result] = await eslint.lintText("const m = import('../../App.jsx');", {
                filePath: path.join(root, 'src/components/chat/ChatBubble.jsx'),
            });
            const legacyMessages = result.messages.filter(
                (message) => message.ruleId === 'local/no-legacy-spa-imports',
            );
            expect(legacyMessages).toHaveLength(1);
            expect(legacyMessages[0]?.message).toMatch(/src\/App\.jsx/);
        });
    });

    describe('eslint.config.js contract (AC-1, AC-2, AC-3, AC-9)', () => {
        it('ignores scripts/** while linting src TypeScript (AC-1)', () => {
            const scriptsResult = runEslint('scripts/seo-audit.mjs');
            expect(scriptsResult.combined).toMatch(/ignored/i);

            const tsResult = runEslint('src/components/islands/cosmosHitTest.ts');
            expect(tsResult.exitCode).toBe(0);
        }, 20_000);

        it('lints Astro sources without parse errors (AC-3)', () => {
            const astroResult = runEslint('src/components/blog/LedgerRow.astro');
            expect(astroResult.exitCode).toBe(0);
            expect(astroResult.combined).not.toMatch(/Parsing error/i);
        }, 20_000);

        it('registers eslint-plugin-astro recommended config for Astro sources (AC-3)', () => {
            const config = readText('eslint.config.js');
            expect(config).toMatch(/eslint-plugin-astro/);
            expect(config).toMatch(/eslintPluginAstro\.configs\.recommended/);
        });

        it('uses typescript-eslint recommended without type-aware project linting (AC-2)', async () => {
            const config = readText('eslint.config.js');
            expect(config).toMatch(/typescript-eslint/);
            expect(config).toMatch(/eslint-plugin-astro/);
            expect(config).not.toMatch(/projectService/);
            expect(config).not.toMatch(/parserOptions\.project/);

            const eslint = new ESLint();
            const resolved = await eslint.calculateConfigForFile(
                path.join(root, 'src/components/islands/HomeMotion.tsx'),
            );

            function expectErrorRule(name: string) {
                const entry = resolved.rules?.[name];
                expect(entry).toBeDefined();
                const severity = Array.isArray(entry) ? entry[0] : entry;
                expect(severity === 'error' || severity === 2).toBe(true);
            }

            expectErrorRule('@typescript-eslint/no-unused-vars');
            expectErrorRule('@typescript-eslint/no-explicit-any');
        });

        it('does not enforce removed SPA package names through ESLint (AC-9)', () => {
            const config = readText('eslint.config.js');
            expect(config).not.toMatch(/removedDirectDeps/);
            expect(config).not.toMatch(/no-restricted-imports/);
        });
    });

    describe('CI and yarn lint gate (AC-6, AC-7)', () => {
        it('ci.yml runs yarn lint after build and before test (AC-7)', () => {
            const ci = readText('.github/workflows/ci.yml');
            const buildIdx = ci.indexOf('yarn build');
            const lintIdx = ci.indexOf('yarn lint');
            const testIdx = ci.indexOf('yarn test');
            expect(buildIdx).toBeGreaterThan(-1);
            expect(lintIdx).toBeGreaterThan(buildIdx);
            expect(testIdx).toBeGreaterThan(lintIdx);
        });

        it('yarn lint exits zero on the clean tree (AC-6)', () => {
            const result = runEslint('.');
            expect(result.exitCode).toBe(0);
        }, 30_000);
    });

    describe('legacy SPA Vitest scan regression (AC-8)', () => {
        it('keeps collectBannedImports green on the production tree (AC-8)', async () => {
            const { collectBannedImports } = await import('./lib/legacy-spa-import-scan');
            expect(collectBannedImports()).toEqual([]);
        });
    });
});
