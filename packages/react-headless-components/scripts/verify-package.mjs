// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { log } from 'node:console';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const entry = path.join(root, manifest.exports['.'].import);
assert.doesNotMatch(
  readFileSync(entry, 'utf8'),
  /import\s*['"]@fluentui\/react-icons\/headless\/styles\.css['"]/,
  'Headless icon defaults must be emitted in the component layer, not imported unlayered',
);

for (const dependency of Object.keys(manifest.dependencies)) {
  assert(
    dependency !== '@coreai-ds/react-components' &&
      dependency !== '@fluentui/react-components' &&
      !dependency.startsWith('@griffel/'),
    `Unexpected styled runtime dependency: ${dependency}`,
  );
}

const css = readFileSync(path.join(root, manifest.exports['./styles.css']), 'utf8');
assert.match(css, /@layer fluent-components/);
assert.match(css, /coreai-overrides/);
assert.match(css, /--fui-/);
assert(
  /(?:^|[{}])\s*\[data-fui-icon-hidden\]\s*\{/.test(css),
  'Missing emitted global headless icon visibility rule',
);

assert(process.env.npm_execpath, 'Run this verifier through npm run test:package');
const packed = JSON.parse(
  execFileSync(
    process.execPath,
    [process.env.npm_execpath, 'pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd: root, encoding: 'utf8' },
  ),
);
assert.equal(packed.length, 1, 'Expected one workspace tarball');
const files = new Set(packed[0].files.map((file) => file.path));
for (const file of [
  manifest.exports['.'].import,
  manifest.exports['.'].types,
  manifest.exports['./styles.css'],
  manifest.exports['./fonts/fonts.css'],
]) {
  assert(files.has(file.replace(/^\.\//, '')), `Missing packaged export: ${file}`);
}
assert([...files].every((file) => !file.includes('__screenshots__')));
for (const file of files) {
  if (!file.endsWith('.d.ts')) continue;
  assert.doesNotMatch(
    readFileSync(path.join(root, file), 'utf8'),
    /['"]@coreai-ds\/react-components(?:\/[^'"]*)?['"]/,
    `Old CoreAI types reached the packaged declaration: ${file}`,
  );
}

// Bundle the complete public surface, not a single tree-shaken Button proxy.
const bundled = await build({
  configFile: false,
  root,
  logLevel: 'error',
  build: {
    write: false,
    minify: false,
    lib: { entry, formats: ['es'], fileName: 'consumer' },
    rollupOptions: { external: [/^react(?:-dom)?(?:\/|$)/] },
  },
});
const outputs = Array.isArray(bundled) ? bundled : [bundled];
let moduleCount = 0;
const forbidden = [];
let keyborgBytes = 0;
for (const output of outputs) {
  assert('output' in output, 'Expected a completed consumer build');
  for (const chunk of output.output) {
    if (chunk.type !== 'chunk') continue;
    for (const [id, module] of Object.entries(chunk.modules)) {
      if (!module.renderedLength) continue;
      moduleCount++;
      const normalized = id.replace(/\\/g, '/');
      if (
        /\/node_modules\/(?:@griffel\/|tabster\/|@fluentui\/react-components\/)/.test(normalized) ||
        /\/packages\/react-components\//.test(normalized)
      ) {
        forbidden.push(normalized);
      }
      if (/\/node_modules\/keyborg\//.test(normalized)) keyborgBytes += module.renderedLength;
    }
  }
}
assert.deepEqual(forbidden, [], 'Styled/legacy code reached the complete consumer bundle');

// Use a real CSS-aware consumer build for SSR. Native Node cannot load the
// current public icon entries' CSS imports, and inlining shared icon contexts
// into the published library would split them from consumers' own glyphs.
const scratch = mkdtempSync(path.join(root, '.bundle-check-'));
try {
  const serverBuild = await build({
    configFile: false,
    root,
    logLevel: 'error',
    ssr: { noExternal: true },
    build: {
      ssr: entry,
      write: false,
      minify: false,
      rollupOptions: {
        external: [/^react(?:-dom)?(?:\/|$)/],
        output: {
          format: 'es',
          entryFileNames: 'consumer-ssr.mjs',
          chunkFileNames: 'chunks/[name]-[hash].mjs',
        },
      },
    },
  });
  const serverOutputs = Array.isArray(serverBuild) ? serverBuild : [serverBuild];
  const chunks = serverOutputs.flatMap((output) => {
    assert('output' in output, 'Expected a completed SSR consumer build');
    return output.output.filter((chunk) => chunk.type === 'chunk');
  });
  for (const chunk of chunks) {
    const target = path.join(scratch, chunk.fileName);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, chunk.code);
  }
  const entries = chunks.filter((chunk) => chunk.isEntry);
  assert.equal(entries.length, 1, 'Expected one complete public consumer entry');
  const components = await import(pathToFileURL(path.join(scratch, entries[0].fileName)).href);
  const markup = renderToString(
    React.createElement(
      components.CoreAIFluentProvider,
      { theme: components.coreaiDarkTheme, dir: 'rtl' },
      React.createElement(components.Button, { type: 'button' }, 'Server-rendered button'),
    ),
  );
  assert.match(markup, /--colorBrandBackground:/);
  assert.match(markup, /--colorInteractiveBackgroundHover:/);
  assert.match(markup, /dir="rtl"/);
  assert.match(markup, /Server-rendered button/);
  assert.doesNotMatch(markup, /<style|data-make-styles-bucket/);
  log(
    `Verified ${Object.keys(components).length} public exports, consumer-bundled SSR, packaged CSS/fonts, and ${moduleCount} consumer modules without Griffel, the Tabster engine, or the old CoreAI package.`,
  );
  if (keyborgBytes) {
    log(
      `Current pinned headless behavior retains ${keyborgBytes} bytes of Keyborg focus helpers; no dependency internals are patched.`,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
