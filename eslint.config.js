import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintPluginAstro from 'eslint-plugin-astro'
import noLegacySpaImports from './eslint-rules/no-legacy-spa-imports.mjs'

const localPlugin = {
  rules: {
    'no-legacy-spa-imports': noLegacySpaImports,
  },
}

const legacyRule = {
  'local/no-legacy-spa-imports': 'error',
}

const reactPluginBundle = {
  react,
  'react-hooks': reactHooks,
  'react-refresh': reactRefresh,
  local: localPlugin,
}

const reactJsxRules = {
  ...react.configs.recommended.rules,
  ...react.configs['jsx-runtime'].rules,
  ...reactHooks.configs.recommended.rules,
  'react/jsx-no-target-blank': 'off',
  'react/prop-types': 'off',
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true },
  ],
}

const tsRecommendedRules = {
  ...tseslint.configs.recommended[1].rules,
  ...tseslint.configs.recommended[2].rules,
}

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'scripts/**',
      'node_modules/**',
      'public/**',
      'content/**',
      'assets/**',
      'eslint-rules/**',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}', 'tests/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: reactPluginBundle,
    rules: {
      ...js.configs.recommended.rules,
      ...reactJsxRules,
      ...legacyRule,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      ...reactPluginBundle,
    },
    rules: {
      ...tsRecommendedRules,
      ...reactJsxRules,
      ...legacyRule,
    },
  },
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['src/**/*.astro', 'tests/**/*.astro'],
    plugins: { local: localPlugin },
    rules: legacyRule,
  },
  {
    files: ['src/env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: ['vitest.config.js', 'eslint.config.js', 'astro.config.mjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]
