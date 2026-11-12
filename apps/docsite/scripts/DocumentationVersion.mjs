// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import semver from 'semver';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = path.resolve(appRoot, '../../packages/react-components');
const versionPrefix = (version, packageVersion) =>
  `Docs/skill v${version}; package v${packageVersion}. `;

function assertVersion(version, label) {
  if (typeof version !== 'string' || semver.valid(version) !== version)
    throw new Error(`${label} must be a semantic version.`);
}

export function synchronizeSkillVersions(source, version, packageVersion) {
  assertVersion(version, 'Documentation version');
  assertVersion(packageVersion, 'Package version');
  const skill = matter(source);
  if (typeof skill.data.description !== 'string' || !skill.data.description.trim())
    throw new Error('The skill must have a description.');
  const previous = skill.data.metadata;
  if (
    previous?.['package-version'] &&
    previous['package-version'] !== packageVersion &&
    semver.valid(previous.version) &&
    !semver.gt(version, previous.version)
  ) {
    throw new Error('Bump the docsite version before synchronizing a package release.');
  }
  const description = skill.data.description.replace(/^Docs\/skill v\S+; package v\S+\.\s*/, '');
  return matter.stringify(skill.content, {
    ...skill.data,
    description: versionPrefix(version, packageVersion) + description,
    metadata: {
      ...previous,
      version,
      'package-version': packageVersion,
    },
  });
}

export async function readDocumentationVersion({
  docsiteManifestPath = path.join(appRoot, 'package.json'),
  packageManifestPath = path.join(packageRoot, 'package.json'),
  skillPath = path.join(packageRoot, 'agent/SKILL.md'),
} = {}) {
  const [docsite, componentPackage, skillSource] = await Promise.all([
    fs.readFile(docsiteManifestPath, 'utf8').then(JSON.parse),
    fs.readFile(packageManifestPath, 'utf8').then(JSON.parse),
    fs.readFile(skillPath, 'utf8'),
  ]);
  assertVersion(docsite.version, 'Documentation version');
  assertVersion(componentPackage.version, 'Package version');
  const skill = matter(skillSource);
  if (
    skill.data.metadata?.version !== docsite.version ||
    skill.data.metadata?.['package-version'] !== componentPackage.version ||
    typeof skill.data.description !== 'string' ||
    !skill.data.description.startsWith(versionPrefix(docsite.version, componentPackage.version))
  ) {
    throw new Error(
      'Skill versions differ from the manifests. Bump the docsite version when needed, then run npm --workspace apps/docsite run sync:versions.',
    );
  }
  return {
    documentation: {
      version: docsite.version,
      packageVersion: componentPackage.version,
      skill: {
        version: skill.data.metadata.version,
        path: 'source/package/SKILL.md',
        sha256: createHash('sha256').update(skillSource).digest('hex'),
      },
    },
    skillSource,
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.includes('--sync')) {
    const [docsite, componentPackage, source] = await Promise.all([
      fs.readFile(path.join(appRoot, 'package.json'), 'utf8').then(JSON.parse),
      fs.readFile(path.join(packageRoot, 'package.json'), 'utf8').then(JSON.parse),
      fs.readFile(path.join(packageRoot, 'agent/SKILL.md'), 'utf8'),
    ]);
    await fs.writeFile(
      path.join(packageRoot, 'agent/SKILL.md'),
      synchronizeSkillVersions(source, docsite.version, componentPackage.version),
    );
  }
  const { documentation } = await readDocumentationVersion();
  console.log(
    `Docs/skill ${documentation.version}; @coreai-ds/react-components ${documentation.packageVersion}.`,
  );
}
