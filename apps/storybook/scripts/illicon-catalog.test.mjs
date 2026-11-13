// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

test('static Storybook exposes Illicon docs, catalog, and unchanged packaged SVGs', () => {
  const source = new URL('../../../packages/react-components/illicons/', import.meta.url);
  const output = new URL('../storybook-static/', import.meta.url);
  const manifestBytes = readFileSync(new URL('manifest.json', source));
  const manifest = JSON.parse(manifestBytes);
  const builtSources = readdirSync(new URL('assets/', output))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(new URL(`assets/${file}`, output), 'utf8'));
  for (const icon of manifest.icons) {
    const original = readFileSync(new URL(icon.file, source));
    const found = builtSources.some((source) =>
      source.includes(`data:image/svg+xml;base64,${original.toString('base64')}`),
    );
    assert.ok(found, `${icon.file}: original SVG must be included unchanged`);
  }
  const index = JSON.parse(readFileSync(new URL('index.json', output), 'utf8'));
  assert.equal(index.entries['components-illicon--documentation']?.type, 'docs');
  assert.equal(index.entries['components-illicon--catalog']?.type, 'story');
  const docs = JSON.parse(readFileSync(new URL('manifests/docs.json', output), 'utf8'));
  assert.ok(docs.docs['components-illicon--documentation']);
});
