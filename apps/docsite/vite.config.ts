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
  type StorybookMarkdownDocument,
} from './src/data/ComponentContent';
import { buildSiteRegistry, type SiteRegistry } from './src/data/RegistryBuilder';
import { generateContent } from './scripts/GenerateContent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentContentDirectory = path.resolve(__dirname, 'content/components');
const generatedContentDirectory = path.resolve(__dirname, 'content/generated');
const generatedComponentsPath = path.join(generatedContentDirectory, 'metadata.json');
const generatedPagesDirectory = path.join(generatedContentDirectory, 'pages');
const storybookManifestPath = path.join(generatedContentDirectory, 'storybook-manifest.json');
const storybookMarkdownDirectory = path.join(generatedContentDirectory, 'llms');
const storybookMarkdownIndexPath = path.join(storybookMarkdownDirectory, 'index.json');

function readStorybookMarkdownIndex(): { version: number; documents: StorybookMarkdownDocument[] } {
  return JSON.parse(fs.readFileSync(storybookMarkdownIndexPath, 'utf8'));
}

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
    fs.readFileSync(path.resolve(__dirname, 'SiteRegistry.json'), 'utf8'),
  ) as SiteRegistry;
  return buildSiteRegistry(baseRegistry, readComponentContent());
}

function componentContentForPath(urlPath: string): string | undefined {
  if (
    !['/llms.txt', '/llms-full.txt'].includes(urlPath) &&
    !/^\/(?:components|llms)\/[a-z0-9-]+\.md$/.test(urlPath)
  )
    return undefined;
  const documents = readStorybookMarkdownIndex().documents;
  if (urlPath.startsWith('/llms/')) {
    const document = documents.find((document) => `/${document.path}` === urlPath);
    return document
      ? fs.readFileSync(path.join(storybookMarkdownDirectory, `${document.id}.md`), 'utf8')
      : undefined;
  }
  const components = readComponentContent();
  if (urlPath === '/llms.txt') {
    return renderLlmsIndex(components, documents);
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
      fileName: 'SiteRegistry.json',
      source: JSON.stringify(readMergedSiteRegistry(), null, 2),
    });
    this.emitFile({
      type: 'asset',
      fileName: 'Changelog.json',
      source: fs.readFileSync(path.resolve(__dirname, 'Changelog.json')),
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
      if (pathname === '/SiteRegistry.json' && !requestUrl.searchParams.has('import')) {
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
      if (pathname === '/llms/index.json') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(fs.readFileSync(storybookMarkdownIndexPath));
        return;
      }
      const content = componentContentForPath(pathname);
      if (!content) {
        if (/^\/(?:components|llms)\/[a-z0-9-]+\.md$/.test(pathname)) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end('Not found.');
          return;
        }
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
    const index = readStorybookMarkdownIndex();
    for (const component of components) {
      this.emitFile({
        type: 'asset',
        fileName: `components/${component.id}.md`,
        source: renderComponentMarkdown(component),
      });
    }
    for (const document of index.documents) {
      this.emitFile({
        type: 'asset',
        fileName: document.path,
        source: fs.readFileSync(path.join(storybookMarkdownDirectory, `${document.id}.md`)),
      });
    }
    this.emitFile({
      type: 'asset',
      fileName: 'llms/index.json',
      source: JSON.stringify(index, null, 2) + '\n',
    });
    this.emitFile({
      type: 'asset',
      fileName: 'llms.txt',
      source: renderLlmsIndex(components, index.documents),
    });
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
