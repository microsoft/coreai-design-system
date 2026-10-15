// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { renderGuidance, guidanceMarkdown } from './guidance.mjs';
import { readGuidance } from './guidance.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const markdown =
  '# Avatar\n\nUse **names** and {initials}.\n\n## Examples\n\n| State | Copy |\n| --- | --- |\n| Empty | Add a photo |\n\n- Parent\n  - Child\n\n```tsx\n<Avatar name={name} />\n```\n\n## Examples\n\n![Avatar](/assets/avatar.png)\n\n[Unsafe](javascript:alert)\n';

test('standard Markdown supports rich guidance and stable unique anchors', () => {
  const { html, anchors } = renderGuidance(markdown);
  assert.match(html, /<strong>names<\/strong>/);
  assert.match(html, /<table>/);
  assert.match(html, /<ul>[\s\S]*<ul>/);
  assert.match(html, /language-tsx/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.deepEqual(anchors, [
    { id: 'guidance-examples', label: 'Examples' },
    { id: 'guidance-examples-1', label: 'Examples' },
  ]);
  assert.match(html, /id="guidance-examples"/);
});

test('best practices render paired cards without losing rich content or surrounding sections', () => {
  const body =
    '## Best practices\n\nIntro paragraph.\n\n### Do\n\nUse **clear** labels and [links](https://example.com).\n\n- Parent\n  - Child\n\n### Don\u2019t\n\n> Avoid ambiguity.\n\n```js\nconst example = true;\n```\n\n## Behavior and states\n\nKeep this outside the cards.';
  const { html, anchors } = renderGuidance(body);
  assert.match(html, /Intro paragraph\.<\/p>[\s\S]*<div class="do-dont-grid">/);
  assert.match(html, /do-dont-card--do[\s\S]*<strong>clear<\/strong>[\s\S]*<ul>[\s\S]*<ul>/);
  assert.match(html, /do-dont-card--dont[\s\S]*<blockquote>[\s\S]*language-js/);
  assert.match(html, /<\/div><\/div><h2 id="guidance-behavior-and-states">/);
  assert.equal(anchors.length, 2);
  const record = { title: 'Example', summary: 'Summary', resources: [], body };
  assert.ok(guidanceMarkdown(record).includes(body));
});

test('Do stays left and incomplete or unrelated sections remain ordinary Markdown', () => {
  const reversed = renderGuidance(
    "## Best practices\n\n### Don't\n\nAvoid this.\n\n### Do\n\nTry this.",
  ).html;
  assert.ok(reversed.indexOf('do-dont-card--do"') < reversed.indexOf('do-dont-card--dont"'));
  for (const body of [
    '## Best practices\n\n### Do\n\nOne side only.',
    "## Best practices\n\n### Do\n\n### Don't\n\nOne side empty.",
    "## Examples\n\n### Do\n\nYes.\n\n### Don't\n\nNo.",
    "## Best practices\n\n### Do\n\nYes.\n\n### Don't\n\nNo.\n\n### Other\n\nMore guidance.",
  ]) {
    assert.doesNotMatch(renderGuidance(body).html, /do-dont-grid/);
  }
});

test('headings and local links agree, and authored HTML cannot execute', () => {
  const markdown =
    '## Details\n\n[Jump](#details)\n\n<script>alert(1)</script>\n\n![Example](/assets/example.png)';
  const { html } = renderGuidance(markdown);
  assert.match(html, /id="guidance-details"/);
  assert.match(html, /href="#guidance-details"/);
  assert.doesNotMatch(html, /<script/);
});

test('resource-free guidance omits an empty resources section and preserves status', () => {
  const record = {
    title: 'Example',
    summary: 'Summary',
    status: 'under-construction',
    resources: [],
    body: 'Guidance.',
  };
  const markdown = guidanceMarkdown(record);
  assert.match(markdown, /## Status\n\nPage under construction\./);
  assert.match(markdown, /Guidance\./);
  assert.doesNotMatch(markdown, /## Resources/);
  assert.match(
    guidanceMarkdown(record, [{ label: 'Documentation', url: 'https://example.com' }]),
    /## Resources\n\n- \[Documentation\]\(https:\/\/example\.com\)/,
  );
});

test('Figma metadata preserves authored preview URLs and validates page IDs', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'guidance-figma-'));
  const url = pathToFileURL(`${directory}${path.sep}`);
  const [record] = (await readGuidance()).filter((record) => record.id === 'page-header');
  const source = (pageId) =>
    `---\nid: page-header\ntitle: Page header\nsummary: Summary\nfigmaPageId: '${pageId}'\nfigmaPreviewUrl: ${record.figmaPreviewUrl}\npreview: figma\nresources:\n  - label: Figma component\n    url: ${record.figmaPreviewUrl}\n---\n\nGuidance.`;
  try {
    await fs.writeFile(new URL('PageHeader.md', url), source(record.figmaPageId));
    const [parsed] = await readGuidance(url);
    assert.equal(parsed.figmaPageId, record.figmaPageId);
    assert.equal(parsed.figmaPreviewUrl, record.figmaPreviewUrl);
    assert.equal(parsed.preview, 'figma');
    assert.ok(guidanceMarkdown(parsed).includes(`[Figma component](${record.figmaPreviewUrl})`));
    await fs.writeFile(new URL('PageHeader.md', url), source('not-a-page-id'));
    await assert.rejects(readGuidance(url), /invalid figmaPageId/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('source filenames do not change guidance IDs, ordering, or alias targets', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'guidance-names-'));
  const url = pathToFileURL(`${directory}${path.sep}`);
  const source = (id, extra = '') =>
    `---\nid: ${id}\ntitle: Example\nsummary: Summary\nresources: []\n${extra}\n---\n\nBody.`;
  try {
    await fs.writeFile(new URL('avatar.md', url), source('avatar'));
    await fs.writeFile(
      new URL('avatar-group.md', url),
      source('avatar-group', 'navigation:\n  showInSidebar: false\n  canonicalId: avatar'),
    );
    const before = await readGuidance(url);
    await fs.rename(new URL('avatar.md', url), new URL('Avatar.md', url));
    await fs.rename(new URL('avatar-group.md', url), new URL('AvatarGroup.md', url));
    assert.deepEqual(await readGuidance(url), before);
    await fs.writeFile(new URL('Avatar-duplicate.md', url), source('avatar'));
    await assert.rejects(readGuidance(url), /Duplicate guidance id/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('metadata validation rejects unknown fields and alias cycles', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'guidance-'));
  const url = pathToFileURL(`${directory}${path.sep}`);
  const source = (id, extra) =>
    `---\nid: ${id}\ntitle: Example\nsummary: Summary\nresources: []\n${extra}\n---\n\n## Guidance\n\nFreeform prose.`;
  try {
    await fs.writeFile(new URL('first.md', url), source('first', 'unexpected: true'));
    await assert.rejects(readGuidance(url), /unsupported metadata/);
    await fs.writeFile(
      new URL('first.md', url),
      source('first', 'navigation:\n  showInSidebar: false\n  canonicalId: second'),
    );
    await fs.writeFile(
      new URL('second.md', url),
      source('second', 'navigation:\n  showInSidebar: false\n  canonicalId: first'),
    );
    await assert.rejects(readGuidance(url), /cyclic/);
    await fs.writeFile(new URL('second.md', url), source('second', ''));
    const records = await readGuidance(url);
    assert.equal(records[0].navigation.canonicalId, 'second');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
