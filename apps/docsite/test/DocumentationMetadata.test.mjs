// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import matter from 'gray-matter';
import { createDocumentationMetadata } from '../scripts/DocumentationMetadata.mjs';

const source = matter.stringify('\n# Instructions\n\nKeep these rules.\n', {
  name: 'coreai-ds-fluentui-react',
  description: 'Use CoreAI guidance over HTTPS.',
  metadata: { owner: 'documentation' },
});

test('one UTC timestamp stamps the published skill and hashes its actual bytes', () => {
  const lastUpdated = '2026-11-17T17:35:43.121Z';
  const { documentation, skillSource } = createDocumentationMetadata(source, '0.12.0', lastUpdated);
  const skill = matter(skillSource);
  assert.equal(documentation.lastUpdated, lastUpdated);
  assert.equal(documentation.skill.lastUpdated, lastUpdated);
  assert.equal(skill.data.metadata['last-updated'], lastUpdated);
  assert.equal(skill.data.metadata['package-version'], '0.12.0');
  assert.equal(skill.data.metadata.changelog, documentation.changelog);
  assert.equal(
    documentation.changelog,
    'https://microsoft.github.io/coreai-design-system/overview/Changelog.md',
  );
  assert.ok(skill.data.description.includes(lastUpdated));
  assert.equal(skill.content, matter(source).content);
  assert.equal(skill.data.metadata.owner, 'documentation');
  assert.equal(documentation.skill.sha256, createHash('sha256').update(skillSource).digest('hex'));
  assert.notEqual(documentation.skill.sha256, createHash('sha256').update(source).digest('hex'));
  assert.equal(matter(source).data.metadata['last-updated'], undefined);
  assert.equal(documentation.version, undefined);
  assert.equal(skill.data.metadata.version, undefined);
});

test('rebuilds change the stamp and provenance without a documentation version bump', () => {
  const first = createDocumentationMetadata(source, '0.12.0', '2026-11-17T17:00:00.000Z');
  const second = createDocumentationMetadata(source, '0.12.0', '2026-11-17T18:00:00.000Z');
  assert.notEqual(first.documentation.skill.sha256, second.documentation.skill.sha256);
  assert.equal(first.documentation.packageVersion, second.documentation.packageVersion);
  assert.throws(() => createDocumentationMetadata(source, '0.12.0', '2026-11-17'));
  assert.throws(() => createDocumentationMetadata(source, '0.12.0', 'invalid'));
});
