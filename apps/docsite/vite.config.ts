// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  parseComponentContent,
  renderComponentMarkdown,
  renderLlmsIndex,
  type ComponentContent,
} from './src/data/component-content';
import { buildSiteRegistry, type SiteRegistry } from './src/data/registry-builder';
import { generateContent } from './scripts/generate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentContentDirectory = path.resolve(__dirname, 'content/components');
const generatedContentDirectory = path.resolve(__dirname, 'content/generated');
const generatedComponentsPath = path.join(generatedContentDirectory, 'metadata.json');
const generatedPagesDirectory = path.join(generatedContentDirectory, 'pages');
const storybookManifestPath = path.join(generatedContentDirectory, 'storybook-manifest.json');

function readComponentContent(): ComponentContent[] {
  const records = JSON.parse(fs.readFileSync(generatedComponentsPath, 'utf8')) as unknown;
  if (!Array.isArray(records)) {
    throw new Error(`${generatedComponentsPath} must contain an array.`);
  }
  return records.map((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`${generatedComponentsPath}[${index}] must be an object.`);
    }
    const id = 'id' in record && typeof record.id === 'string' ? record.id : '';
    return parseComponentContent(
      {
        ...record,
        markdown: fs.readFileSync(path.join(generatedPagesDirectory, `${id}.md`), 'utf8'),
      },
      `${generatedComponentsPath}[${index}]`,
    );
  });
}

function readMergedSiteRegistry() {
  const baseRegistry = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'site-registry.json'), 'utf8'),
  ) as SiteRegistry;
  return buildSiteRegistry(baseRegistry, readComponentContent());
}

function componentContentForPath(urlPath: string): string | undefined {
  if (
    !['/llms.txt', '/llms-full.txt'].includes(urlPath) &&
    !/^\/components\/[a-z0-9-]+\.md$/.test(urlPath)
  )
    return undefined;
  const components = readComponentContent();
  if (urlPath === '/llms.txt') {
    return renderLlmsIndex(components);
  }
  if (urlPath === '/llms-full.txt') {
    return components.map(renderComponentMarkdown).join('\n\n---\n\n');
  }
  const match = urlPath.match(/^\/components\/([a-z0-9-]+)\.md$/);
  const component = match ? components.find((entry) => entry.id === match[1]) : undefined;
  return component ? renderComponentMarkdown(component) : undefined;
}

const exposeDataFiles: Plugin = {
  name: 'coreai:expose-data-files',
  apply: 'build',
  buildStart() {
    this.emitFile({
      type: 'asset',
      fileName: 'site-registry.json',
      source: JSON.stringify(readMergedSiteRegistry(), null, 2),
    });
    this.emitFile({
      type: 'asset',
      fileName: 'changelog.json',
      source: fs.readFileSync(path.resolve(__dirname, 'changelog.json')),
    });
    this.emitFile({
      type: 'asset',
      fileName: 'storybook-manifest.json',
      source: fs.readFileSync(storybookManifestPath),
    });
  },
};

const serveComponentContent: Plugin = {
  name: 'coreai:serve-component-content',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const requestUrl = request.url
        ? new URL(request.url, 'http://localhost')
        : new URL('http://localhost');
      const pathname = requestUrl.pathname;
      if (pathname === '/site-registry.json' && !requestUrl.searchParams.has('import')) {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(JSON.stringify(readMergedSiteRegistry(), null, 2));
        return;
      }
      if (pathname === '/storybook-manifest.json') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(fs.readFileSync(storybookManifestPath));
        return;
      }
      const content = componentContentForPath(pathname);
      if (!content) {
        next();
        return;
      }
      response.statusCode = 200;
      response.setHeader(
        'Content-Type',
        pathname.endsWith('.md') ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8',
      );
      response.setHeader('Cache-Control', 'no-cache');
      response.end(content);
    });
  },
};

const refreshAuthoredContent: Plugin = {
  name: 'coreai:refresh-authored-content',
  configureServer(server) {
    server.watcher.add(componentContentDirectory);
    let pendingGeneration = Promise.resolve();
    const regenerate = (filePath: string) => {
      if (!filePath.startsWith(componentContentDirectory) || !filePath.endsWith('.md')) {
        return;
      }
      pendingGeneration = pendingGeneration
        .then(() => generateContent())
        .then(() => {
          server.ws.send({ type: 'full-reload' });
        })
        .catch((error: unknown) => {
          server.config.logger.error(
            `Unable to regenerate component content: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
    };
    server.watcher.on('add', regenerate);
    server.watcher.on('change', regenerate);
    server.watcher.on('unlink', regenerate);
  },
};

const exposeComponentContent: Plugin = {
  name: 'coreai:expose-component-content',
  apply: 'build',
  buildStart() {
    const components = readComponentContent();
    for (const component of components) {
      this.emitFile({
        type: 'asset',
        fileName: `components/${component.id}.md`,
        source: renderComponentMarkdown(component),
      });
    }
    this.emitFile({ type: 'asset', fileName: 'llms.txt', source: renderLlmsIndex(components) });
    this.emitFile({
      type: 'asset',
      fileName: 'llms-full.txt',
      source: components.map(renderComponentMarkdown).join('\n\n---\n\n'),
    });
  },
};

const themeBarrel = path.resolve(__dirname, '../../packages/react-components/src/index.ts');

export default defineConfig({
  plugins: [
    react(),
    refreshAuthoredContent,
    exposeDataFiles,
    serveComponentContent,
    exposeComponentContent,
  ],
  resolve: {
    alias: [{ find: /^@coreai-ds\/react-components$/, replacement: themeBarrel }],
  },
  server: {
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  esbuild: {
    tsconfigRaw: '{"compilerOptions":{"jsx":"react-jsx","useDefineForClassFields":false}}',
  },
  optimizeDeps: {
    include: [
      '@coreai-ds/react-components',
      'scheduler',
      'use-sync-external-store',
      'use-sync-external-store/shim',
      'use-sync-external-store/shim/with-selector',
      'react-is',
    ],
  },
});
