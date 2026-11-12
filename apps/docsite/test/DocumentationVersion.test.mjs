// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import test from 'node:test';
import matter from 'gray-matter';
import {
  readDocumentationVersion,
  synchronizeSkillVersions,
} from '../scripts/DocumentationVersion.mjs';

const source = matter.stringify('\n# Instructions\n\nKeep these rules.\n', {
  name: 'coreai-ds-fluentui-react',
  description: 'Use CoreAI guidance over HTTPS.',
  metadata: { owner: 'documentation' },
});

test('version synchronization preserves skill content and unrelated metadata', () => {
  const updated = synchronizeSkillVersions(source, '0.1.0', '0.12.0');
  const skill = matter(updated);
  assert.equal(skill.content, matter(source).content);
  assert.equal(skill.data.name, 'coreai-ds-fluentui-react');
  assert.deepEqual(skill.data.metadata, {
    owner: 'documentation',
    version: '0.1.0',
    'package-version': '0.12.0',
  });
  assert.equal(
    skill.data.description,
    'Docs/skill v0.1.0; package v0.12.0. Use CoreAI guidance over HTTPS.',
  );
  const next = matter(synchronizeSkillVersions(updated, '0.1.1', '0.12.0'));
  assert.equal(
    next.data.description,
    'Docs/skill v0.1.1; package v0.12.0. Use CoreAI guidance over HTTPS.',
  );
});

test('publishing rejects skill labels that drift from the docs or package manifests', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-docs-version-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const paths = {
    docsiteManifestPath: path.join(directory, 'Docsite.json'),
    packageManifestPath: path.join(directory, 'Package.json'),
    skillPath: path.join(directory, 'SKILL.md'),
  };
  await fs.writeFile(paths.docsiteManifestPath, JSON.stringify({ version: '0.1.0' }));
  await fs.writeFile(paths.packageManifestPath, JSON.stringify({ version: '0.12.0' }));
  const skillSource = synchronizeSkillVersions(source, '0.1.0', '0.12.0');
  await fs.writeFile(paths.skillPath, skillSource);
  const { documentation } = await readDocumentationVersion(paths);
  assert.deepEqual(documentation, {
    version: '0.1.0',
    packageVersion: '0.12.0',
    skill: {
      version: '0.1.0',
      path: 'source/package/SKILL.md',
      sha256: createHash('sha256').update(skillSource).digest('hex'),
    },
  });
  for (const change of [
    (data) => {
      data.metadata.version = '0.0.9';
    },
    (data) => {
      data.metadata['package-version'] = '0.11.0';
    },
    (data) => {
      data.description = 'Docs/skill v0.0.9; package v0.12.0. Stale label.';
    },
  ]) {
    const skill = matter(skillSource);
    const data = globalThis.structuredClone(skill.data);
    change(data);
    await fs.writeFile(paths.skillPath, matter.stringify(skill.content, data));
    await assert.rejects(readDocumentationVersion(paths), /Skill versions differ/);
  }
});

test('a package version change also requires advancing the docs and skill version', () => {
  const current = synchronizeSkillVersions(source, '0.1.0', '0.12.0');
  assert.throws(
    () => synchronizeSkillVersions(current, '0.1.0', '0.13.0'),
    /Bump the docsite version/,
  );
  const updated = matter(synchronizeSkillVersions(current, '0.1.1', '0.13.0'));
  assert.equal(updated.data.metadata.version, '0.1.1');
  assert.equal(updated.data.metadata['package-version'], '0.13.0');
});
