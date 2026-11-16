// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';
import { readDocumentationVersion } from './DocumentationVersion.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const changelogPath = 'apps/docsite/content/overview/DocumentationChangelog.md';
const correction =
  'Follow release-docs: advance docs/skill above the target version, synchronize labels, and add documentation release notes.';

export function validateDocumentationRelease({
  version,
  previousVersion,
  lockedVersion,
  changelog,
}) {
  assert.equal(semver.valid(previousVersion), previousVersion, 'Invalid base docs version');
  assert.equal(semver.valid(version), version, 'Invalid docs version');
  assert.ok(semver.gt(version, previousVersion), `Every PR must advance docs/skill. ${correction}`);
  assert.equal(lockedVersion, version, 'Root lockfile docs version differs from the manifest');

  const tree = unified().use(remarkParse).parse(matter(changelog).content);
  const start = tree.children.findIndex((node) => node.type === 'heading' && node.depth === 2);
  assert.ok(start >= 0, `Missing documentation release notes. ${correction}`);
  const heading = toString(tree.children[start]);
  const prefix = `[${version}] - `;
  assert.ok(
    heading.startsWith(prefix),
    `First changelog release must be ${version}. ${correction}`,
  );
  const date = heading.slice(prefix.length);
  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date,
    'Documentation release notes need a valid YYYY-MM-DD date',
  );
  const remaining = tree.children.slice(start + 1);
  const end = remaining.findIndex((node) => node.type === 'heading' && node.depth === 2);
  const notes = end < 0 ? remaining : remaining.slice(0, end);
  assert.ok(
    notes.some((node) => ['paragraph', 'list'].includes(node.type) && toString(node).trim()),
    'Documentation release notes must not be empty',
  );
}

export async function checkDocumentationRelease({ baseRef, repositoryRoot = root }) {
  assert.ok(baseRef, 'Specify --base=<target commit or ref>, for example --base=origin/main');
  const git = (...args) =>
    execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  const base = git('rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`);
  const previous = JSON.parse(git('show', `${base}:apps/docsite/package.json`));
  const { documentation } = await readDocumentationVersion({
    docsiteManifestPath: path.join(repositoryRoot, 'apps/docsite/package.json'),
    packageManifestPath: path.join(repositoryRoot, 'packages/react-components/package.json'),
    skillPath: path.join(repositoryRoot, 'packages/react-components/agent/SKILL.md'),
  });
  const [changelog, lockfile] = await Promise.all([
    fs.readFile(path.join(repositoryRoot, changelogPath), 'utf8'),
    fs.readFile(path.join(repositoryRoot, 'package-lock.json'), 'utf8').then(JSON.parse),
  ]);
  validateDocumentationRelease({
    version: documentation.version,
    previousVersion: previous.version,
    lockedVersion: lockfile.packages?.['apps/docsite']?.version,
    changelog,
  });
  return { version: documentation.version, previousVersion: previous.version, base };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const baseRef = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--base='))
    ?.slice(7);
  const release = await checkDocumentationRelease({ baseRef });
  console.log(
    `Documentation release ${release.previousVersion} -> ${release.version} (base ${release.base}).`,
  );
}
