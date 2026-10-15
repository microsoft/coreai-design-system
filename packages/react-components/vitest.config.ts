// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@coreai-ds/react-components': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react/jsx-dev-runtime', 'react-router-dom'],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', '../../apps/storybook/src/test/**/*.test.{ts,tsx}'],
    browser: {
      enabled: true,
      headless: true,
      api: { port: 4173 },
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
    },
  },
});
