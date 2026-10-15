// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveComponentEntry, resolveDocEntry } from 'storybook/internal/toolsets-docs';
import { assertExpectedManifestProblems } from './verify-manifest-problems.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = path.join(root, 'storybook-static');
const indexPath = path.join(buildRoot, 'index.json');
const componentsManifestPath = path.join(buildRoot, 'manifests', 'components.json');
const docsManifestPath = path.join(buildRoot, 'manifests', 'docs.json');

if (!fs.existsSync(indexPath)) {
  throw new Error(`Storybook index is missing: ${indexPath}`);
}

let index;
try {
  index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
} catch (error) {
  throw new Error(`Storybook index is not valid JSON: ${indexPath}`, { cause: error });
}

if (!index || typeof index.entries !== 'object' || Array.isArray(index.entries)) {
  throw new Error(`Storybook index has no valid entries object: ${indexPath}`);
}

function readManifest(file, collectionName) {
  if (!fs.existsSync(file)) {
    throw new Error(`Storybook ${collectionName} manifest is missing: ${file}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Storybook ${collectionName} manifest is not valid JSON: ${file}`, {
      cause: error,
    });
  }

  const collection = manifest[collectionName];
  if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
    throw new Error(`Storybook ${collectionName} manifest has no valid ${collectionName} object`);
  }
  return { manifest, collection };
}

const { manifest: componentsManifest, collection: components } = readManifest(
  componentsManifestPath,
  'components',
);
const { collection: docs } = readManifest(docsManifestPath, 'docs');
const manifestProvider = async (_request, manifestPath) =>
  fs.promises.readFile(path.join(buildRoot, manifestPath), 'utf8');
const componentEntries = await Promise.all(
  Object.values(components).map((component) =>
    resolveComponentEntry(component, undefined, manifestProvider),
  ),
);
await Promise.all(
  Object.values(docs).map((doc) => resolveDocEntry(doc, undefined, manifestProvider)),
);

if (componentsManifest.meta?.docgen !== 'react-component-meta') {
  throw new Error(
    `Storybook component manifest used unexpected docgen engine: ${componentsManifest.meta?.docgen ?? 'missing'}`,
  );
}

const entries = Object.values(index.entries);
const experimentEntries = [...entries, ...componentEntries, ...Object.values(docs)].filter(
  (entry) =>
    entry.id?.startsWith('experiments-') ||
    entry.importPath?.includes('/experiments/') ||
    entry.path?.includes('/experiments/'),
);
if (experimentEntries.length) {
  throw new Error(
    `Temporary experiments leaked into normal build: ${experimentEntries.map((entry) => entry.id).join(', ')}`,
  );
}
const normalizedImportPaths = entries.map((entry) => entry.importPath?.replaceAll('\\', '/') ?? '');

const requiredSources = [
  {
    label: 'generated component owners',
    present: normalizedImportPaths.some((importPath) => importPath.includes('/component-stories/')),
  },
  {
    label: 'generated template documentation',
    present: normalizedImportPaths.some(
      (importPath) => importPath.includes('/src/stories/templates/') && importPath.endsWith('.mdx'),
    ),
  },
  {
    label: 'generated Agent Skill documentation',
    present: normalizedImportPaths.some((importPath) =>
      importPath.endsWith('/docs/AgentSkill.mdx'),
    ),
  },
];

const missingSources = requiredSources.filter(({ present }) => !present).map(({ label }) => label);
if (missingSources.length > 0) {
  throw new Error(`Storybook build is missing required content: ${missingSources.join(', ')}`);
}

const fluentStoryCount = normalizedImportPaths.filter((importPath) =>
  importPath.includes('/component-stories/'),
).length;
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, '.storybook', '.cache', 'component-stories', 'inventory.json'),
    'utf8',
  ),
);
for (const expected of inventory.components) {
  const component = componentEntries.find((entry) => entry.id === expected.id);
  if (!component) throw new Error(`Generated component is missing from manifest: ${expected.id}`);
  for (const story of expected.stories) {
    const entry = index.entries[story.id];
    const documented = component.stories.find((item) => item.id === story.id);
    if (
      !entry?.importPath?.includes('/component-stories/') ||
      !documented?.snippet ||
      documented.error
    ) {
      throw new Error(`Selected story is not published through its generated owner: ${story.id}`);
    }
  }
}
const componentStories = componentEntries.flatMap((component) => component.stories ?? []);
const duplicateStoryIds = componentStories
  .map((story) => story.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);

if (componentEntries.length === 0 || Object.keys(docs).length === 0) {
  throw new Error('Storybook manifests must contain both component and docs entries');
}
if (duplicateStoryIds.length > 0) {
  throw new Error(
    `Storybook component manifest contains duplicate story ids: ${[...new Set(duplicateStoryIds)].join(', ')}`,
  );
}

const publicArtifactRules = [
  ['internal Azure DevOps URL', /(?:dev\.azure\.com|[\w-]+\.visualstudio\.com)\//i],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['GitHub credential', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['npm credential', /\bnpm_[A-Za-z0-9]{30,}\b/],
];
const textArtifactPattern = /\.(?:css|html|js|json|md|mjs|txt)$/i;
const disclosureFindings = [];

for (const relativePath of fs.readdirSync(buildRoot, { recursive: true })) {
  const filePath = path.join(buildRoot, relativePath);
  if (!fs.statSync(filePath).isFile()) {
    continue;
  }
  if (filePath.endsWith('.map')) {
    disclosureFindings.push(`${relativePath}: source map`);
    continue;
  }
  if (!textArtifactPattern.test(filePath)) {
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const [label, pattern] of publicArtifactRules) {
    if (pattern.test(content)) {
      disclosureFindings.push(`${relativePath}: ${label}`);
    }
  }
}

if (disclosureFindings.length > 0) {
  throw new Error(
    `Storybook build contains public-disclosure findings:\n${disclosureFindings.join('\n')}`,
  );
}

const manifestProblems = assertExpectedManifestProblems(componentEntries);

console.log(
  `Verified Storybook build with ${fluentStoryCount} generated component story entries, ` +
    `${componentEntries.length} manifest components, ${Object.keys(docs).length} docs entries, ` +
    `and ${manifestProblems} reported manifest problems.`,
);
