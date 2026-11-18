// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const packageRoot = fileURLToPath(new URL('../../../packages/react-components/', import.meta.url));

export function createDocumentationMetadata(source, packageVersion, lastUpdated) {
  if (new Date(lastUpdated).toISOString() !== lastUpdated)
    throw new Error('lastUpdated must be a canonical UTC timestamp.');
  const skill = matter(source);
  if (typeof skill.data.description !== 'string' || !skill.data.description.trim())
    throw new Error('The skill must have a description.');
  const changelog = 'https://microsoft.github.io/coreai-design-system/overview/Changelog.md';
  const skillSource = matter.stringify(skill.content, {
    ...skill.data,
    description: `Last updated ${lastUpdated}; package v${packageVersion}. ${skill.data.description}`,
    metadata: {
      ...skill.data.metadata,
      'last-updated': lastUpdated,
      'package-version': packageVersion,
      changelog,
    },
  });
  return {
    documentation: {
      lastUpdated,
      packageVersion,
      changelog,
      skill: {
        lastUpdated,
        path: 'source/package/SKILL.md',
        sha256: createHash('sha256').update(skillSource).digest('hex'),
      },
    },
    skillSource,
  };
}

export async function readDocumentationMetadata({ lastUpdated = new Date().toISOString() } = {}) {
  const [componentPackage, source] = await Promise.all([
    fs.readFile(path.join(packageRoot, 'package.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(packageRoot, 'agent/SKILL.md'), 'utf8'),
  ]);
  return createDocumentationMetadata(source, componentPackage.version, lastUpdated);
}
