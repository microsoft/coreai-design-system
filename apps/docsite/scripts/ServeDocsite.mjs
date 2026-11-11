// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { preview } from 'vite';
import { appRoot, outputDirectory } from './BuildDocsite.mjs';

export async function serveReferenceProof({ port = 8081, outDir = outputDirectory } = {}) {
  const metadata = JSON.parse(await fs.readFile(path.join(outDir, 'llms/index.json'), 'utf8'));
  const assets = new Map();
  const assetPrefix = `${metadata.basePath}assets/`;
  async function cacheAssets() {
    const directory = path.join(outDir, 'assets');
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(js|css)$/.test(entry.name) || assets.has(entry.name)) continue;
      assets.set(entry.name, await fs.readFile(path.join(directory, entry.name)));
    }
  }
  // Open tabs can still request lazy chunks from an earlier local build.
  await cacheAssets();
  return preview({
    configFile: false,
    root: appRoot,
    appType: 'mpa',
    base: metadata.basePath,
    build: { outDir },
    plugins: [
      {
        name: 'coreai:reference-preview-assets',
        configurePreviewServer(server) {
          server.middlewares.use((request, response, next) => {
            const pathname = request.url?.split('?')[0] ?? '';
            if (!pathname.startsWith(assetPrefix)) return next();
            const filename = pathname.slice(assetPrefix.length);
            if (!/^[^/]+\.(js|css)$/.test(filename)) return next();
            async function serveAsset() {
              if (!assets.has(filename)) await cacheAssets();
              const content = assets.get(filename);
              if (!content) return next();
              response.setHeader(
                'Content-Type',
                filename.endsWith('.css') ? 'text/css' : 'text/javascript',
              );
              response.end(content);
            }
            void serveAsset().catch(next);
          });
        },
      },
    ],
    preview: { host: '127.0.0.1', port, strictPort: true },
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const server = await serveReferenceProof();
  server.printUrls();
}
