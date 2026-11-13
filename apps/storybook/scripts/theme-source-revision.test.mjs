// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { themeSourceRevision } from './theme-source-revision.mjs';

test('dependency cache revision changes with package exports and nested implementation content', (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'coreai-source-revision-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const index = path.join(directory, 'index.ts');
  writeFileSync(index, 'export const original = true;\n');
  const initial = themeSourceRevision(directory);
  assert.equal(themeSourceRevision(directory), initial);
  mkdirSync(path.join(directory, 'example.test.tsx'));
  assert.equal(themeSourceRevision(directory), initial);
  writeFileSync(index, 'export const original = true;\nexport const Illicon = true;\n');
  const withExport = themeSourceRevision(directory);
  assert.notEqual(withExport, initial);
  mkdirSync(path.join(directory, 'components'));
  const component = path.join(directory, 'components/Illicon.tsx');
  writeFileSync(component, 'export const Illicon = () => null;\n');
  const withComponent = themeSourceRevision(directory);
  assert.notEqual(withComponent, withExport);
  writeFileSync(component, 'export const Illicon = () => <img alt="" />;\n');
  assert.notEqual(themeSourceRevision(directory), withComponent);
});
