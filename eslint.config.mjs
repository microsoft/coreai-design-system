// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import prototypeRules from './apps/prototype/eslint.rules.js';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/storybook-static/**',
      'apps/prototype/build/**',
      'apps/prototype/.react-router/**',
      'apps/docsite/src/assets/vendor/**',
      'apps/storybook/fluent-stories/**',
      'apps/storybook/src/stories/templates/*.mdx',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: [
      'eslint.config.mjs',
      'apps/docsite/{build.mjs,server.js}',
      'apps/prototype/*config.ts',
      'apps/prototype/test/**/*.mjs',
      'apps/docsite/scripts/**/*.{js,mjs}',
      'apps/docsite/src/{site-data,utils}.mjs',
      'apps/storybook/.storybook/**/*.{js,mjs,ts,tsx}',
      'apps/storybook/host/**/*.{js,mjs}',
      'apps/storybook/scripts/**/*.{js,mjs}',
      '.github/scripts/**/*.{js,mjs}',
      '.github/workflows/scripts/**/*.{js,mjs}',
      'scripts/**/*.mjs',
      'shared/**/*.mjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      'apps/docsite/src/assets/**/*.{js,mjs}',
      'apps/prototype/app/**/*.{js,jsx,ts,tsx}',
      'apps/prototype/test/**/*.mjs',
      'apps/storybook/src/**/*.{js,jsx,ts,tsx}',
      'packages/*/src/**/*.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        hljs: 'readonly',
      },
    },
  },
  {
    files: [
      'apps/storybook/src/**/*.{jsx,tsx}',
      'apps/prototype/app/**/*.{jsx,tsx}',
      'packages/*/src/**/*.{jsx,tsx}',
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  ...storybook.configs['flat/recommended'],
  ...prototypeRules.map((config) => ({
    ...config,
    basePath: fileURLToPath(new URL('./apps/prototype', import.meta.url)),
  })),
  prettier,
);
