// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@coreai-ds/react-components': fileURLToPath(
        new URL('../react-components/src/index.ts', import.meta.url),
      ),
      '@coreai-ds/react-headless-components': fileURLToPath(
        new URL('./src/index.ts', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react/jsx-dev-runtime',
      '@fluentui/react-headless-components-preview/button',
      '@fluentui/react-headless-components-preview/field',
      '@fluentui/react-headless-components-preview/input',
      '@fluentui/react-headless-components-preview/label',
      '@fluentui/react-headless-components-preview/link',
      '@fluentui/react-headless-components-preview/textarea',
    ],
  },
  test: {
    include: ['src/**/*.test.tsx'],
    browser: {
      enabled: true,
      headless: true,
      api: { port: 4175 },
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
    },
  },
});
