// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import matter from 'gray-matter';
import {
  readDocumentationVersion,
  synchronizeSkillVersions,
} from '../scripts/DocumentationVersion.mjs';
import {
  checkDocumentationRelease,
  validateDocumentationRelease,
} from '../scripts/CheckDocumentationRelease.mjs';

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

test('a later package change reuses the pending PR docs increment when synchronizing', () => {
  const current = synchronizeSkillVersions(source, '0.1.1', '0.12.0');
  const updated = matter(synchronizeSkillVersions(current, '0.1.1', '0.13.0'));
  assert.equal(updated.data.metadata.version, '0.1.1');
  assert.equal(updated.data.metadata['package-version'], '0.13.0');
});

const release = {
  version: '0.1.2',
  previousVersion: '0.1.1',
  lockedVersion: '0.1.2',
  changelog: '## [0.1.2] - 2026-11-16\n\n- Maintain the release workflow.\n',
};

test('every release needs a higher semantic version, including maintenance-only PRs', () => {
  validateDocumentationRelease(release);
  for (const version of ['0.1.1', '0.1.0', '0.1.2-beta.1']) {
    assert.throws(
      () => validateDocumentationRelease({ ...release, previousVersion: '0.1.2', version }),
      /Every PR must advance/,
    );
  }
  assert.throws(
    () => validateDocumentationRelease({ ...release, version: 'invalid' }),
    /Invalid docs version/,
  );
  assert.throws(
    () => validateDocumentationRelease({ ...release, lockedVersion: '0.1.1' }),
    /lockfile docs version differs/,
  );
});

test('release notes must lead the changelog, match the version, and contain dated content', () => {
  for (const changelog of [
    '# History\n',
    '## [0.1.1] - 2026-11-16\n\n- Old release.\n',
    '## [0.1.2] - 2026-02-30\n\n- Impossible date.\n',
    '## [0.1.2] - 2026-11-16\n\n<!-- TODO -->\n\n## [0.1.1] - 2026-11-15\n\n- Old notes.\n',
  ]) {
    assert.throws(
      () => validateDocumentationRelease({ ...release, changelog }),
      /release notes|changelog release/,
    );
  }
  validateDocumentationRelease({
    ...release,
    changelog: matter.stringify(`# History\n\n${release.changelog}`, {
      id: 'documentation-changelog',
      title: 'Documentation changelog',
    }),
  });
});

test('Git-based release checks compare the target, preserve package versions, and allow retries', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-docs-release-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const write = async (relative, text) => {
    const target = path.join(directory, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, text);
  };
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  const manifestPath = 'apps/docsite/package.json';
  const packagePath = 'packages/react-components/package.json';
  const skillPath = 'packages/react-components/agent/SKILL.md';
  const check = () => checkDocumentationRelease({ baseRef: 'HEAD', repositoryRoot: directory });
  git('init', '--initial-branch=main');
  await write(manifestPath, JSON.stringify({ version: '0.1.1' }));
  await write(packagePath, JSON.stringify({ version: '0.12.0' }));
  await write(skillPath, synchronizeSkillVersions(source, '0.1.1', '0.12.0'));
  git('add', '.');
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    '-c',
    'core.hooksPath=.no-hooks',
    'commit',
    '-m',
    'Baseline',
  );
  await write(manifestPath, JSON.stringify({ version: '0.1.2' }));
  await write(skillPath, synchronizeSkillVersions(source, '0.1.2', '0.12.0'));
  await write(
    'package-lock.json',
    JSON.stringify({
      packages: { 'apps/docsite': { version: '0.1.2' } },
    }),
  );
  await write('apps/docsite/content/overview/DocumentationChangelog.md', release.changelog);
  const first = await check();
  assert.equal(first.previousVersion, '0.1.1');
  assert.equal(first.version, '0.1.2');
  assert.deepEqual(await check(), first);
  assert.equal(
    JSON.parse(await fs.readFile(path.join(directory, packagePath), 'utf8')).version,
    '0.12.0',
  );
  await write(skillPath, synchronizeSkillVersions(source, '0.1.1', '0.12.0'));
  await assert.rejects(check(), /Skill versions differ/);
  await write(skillPath, synchronizeSkillVersions(source, '0.1.2', '0.12.0'));
  git('add', '.');
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    '-c',
    'core.hooksPath=.no-hooks',
    'commit',
    '-m',
    'Another PR used this version',
  );
  await assert.rejects(check(), /Every PR must advance/);
});
