// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import packageJson from './package.json';

const dependencies = Object.keys(packageJson.dependencies);

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: (id) =>
        !/\.css(?:\?|$)/.test(id) &&
        (/^react(?:-dom)?(?:\/|$)/.test(id) ||
          dependencies.some((dependency) => id === dependency || id.startsWith(`${dependency}/`))),
    },
  },
});
