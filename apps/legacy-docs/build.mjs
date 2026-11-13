// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

await build({
  entryPoints: [fileURLToPath(new URL('./server.mjs', import.meta.url))],
  outfile: fileURLToPath(new URL('./dist/server.mjs', import.meta.url)),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await writeFile(
  new URL('./dist/package.json', import.meta.url),
  `${JSON.stringify(
    {
      name: '@coreai-ds/legacy-docs',
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: { start: 'node server.mjs' },
    },
    null,
    2,
  )}\n`,
);
