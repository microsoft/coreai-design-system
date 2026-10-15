// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, URL } from 'node:url';
import test from 'node:test';
import { generateContent } from '../scripts/generate-content.mjs';
import { readGuidance } from '../../../shared/guidance.mjs';

test('offline snapshot is read-only; generation is deterministic and skips unchanged output', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'docsite-generation-'));
  try {
    const content = path.join(directory, 'content');
    await fs.mkdir(content);
    await fs.writeFile(
      path.join(content, 'avatar.md'),
      '---\nid: avatar\ntitle: Avatar\nsummary: Avatar guidance.\nresources: []\nstorybookTitles:\n  - Components/Avatar\n  - Components/AvatarGroup\n---\n\n## Guidance\n\nA paragraph.',
    );
    const stories = [
      { id: 'components-avatargroup--default', title: 'Components/AvatarGroup', name: 'Default' },
      { id: 'components-avatar--size', title: 'Components/Avatar', name: 'Size' },
      { id: 'components-avatar--default', title: 'Components/Avatar', name: 'Custom display name' },
    ];
    const snapshotPath = path.join(directory, 'snapshot.json');
    const snapshot = JSON.stringify({ stories });
    await fs.writeFile(snapshotPath, snapshot);
    const options = {
      contentDirectory: pathToFileURL(`${content}${path.sep}`),
      snapshotPath,
      indexPath: null,
      outputDirectory: path.join(directory, 'generated'),
      storybookRoot: 'http://localhost:6006',
    };
    await generateContent(options);
    const output = path.join(options.outputDirectory, 'storybook-manifest.json');
    const first = await fs.readFile(output, 'utf8');
    assert.equal(JSON.parse(first).components.avatar.defaultStoryId, 'components-avatar--default');
    await fs.utimes(output, new Date(0), new Date(0));
    await generateContent(options);
    assert.equal((await fs.stat(output)).mtimeMs, 0);
    assert.equal(await fs.readFile(snapshotPath, 'utf8'), snapshot);
    const indexPath = path.join(directory, 'index.json');
    await fs.writeFile(
      indexPath,
      JSON.stringify({
        entries: Object.fromEntries(
          [...stories].reverse().map((story) => [story.id, { ...story, type: 'story' }]),
        ),
      }),
    );
    await generateContent({ ...options, indexPath });
    assert.equal(await fs.readFile(output, 'utf8'), first);
    await assert.rejects(
      generateContent({ ...options, indexPath: path.join(directory, 'missing.json') }),
      /ENOENT/,
    );
    await generateContent({ ...options, indexPath, refresh: true });
    const refreshed = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
    assert.deepEqual(
      refreshed.stories.map((story) => story.id),
      stories.map((story) => story.id).sort(),
    );
    assert.equal('storybookRoot' in refreshed, false);
    const request = context.mock.method(globalThis, 'fetch', async (url) => {
      assert.equal(url, 'https://storybook.example/index.json');
      return new globalThis.Response(
        JSON.stringify({
          entries: Object.fromEntries(
            stories.map((story) => [story.id, { ...story, type: 'story' }]),
          ),
        }),
      );
    });
    await generateContent({
      ...options,
      indexPath: null,
      refresh: true,
      indexUrl: 'https://storybook.example/index.json',
    });
    assert.equal(request.mock.callCount(), 1);
    await fs.writeFile(path.join(options.outputDirectory, 'pages/stale.md'), 'stale');
    await generateContent(options);
    await assert.rejects(fs.stat(path.join(options.outputDirectory, 'pages/stale.md')), /ENOENT/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('all authored guidance generates offline into an empty output directory', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'docsite-offline-'));
  const snapshotPath = new URL('../content/storybook-index.snapshot.json', import.meta.url);
  const snapshot = await fs.readFile(snapshotPath, 'utf8');
  context.mock.method(globalThis, 'fetch', () => {
    throw new Error('Offline generation must not fetch.');
  });
  try {
    await generateContent({ outputDirectory: directory, snapshotPath, indexPath: null });
    const records = JSON.parse(await fs.readFile(path.join(directory, 'metadata.json'), 'utf8'));
    const authored = (await fs.readdir(new URL('../content/components/', import.meta.url))).filter(
      (name) => name.endsWith('.md'),
    );
    assert.equal(records.length, authored.length);
    for (const record of records) {
      await fs.access(path.join(directory, 'pages', `${record.id}.html`));
      await fs.access(path.join(directory, 'pages', `${record.id}.md`));
    }
    const guidance = await readGuidance();
    for (const id of ['page-header', 'top-nav', 'left-nav']) {
      const record = records.find((record) => record.id === id);
      const authored = guidance.find((record) => record.id === id);
      assert.ok(record, `${id} guidance must retain its Figma resource.`);
      assert.equal(record.previewSourceId, undefined);
      const resource = record.sources.find((source) => source.kind === 'figma');
      assert.ok(resource, `${id} must have a Figma source.`);
      assert.equal(resource.url, authored.resources[0].url);
      assert.ok(record.resourceSourceIds.includes(resource.id));
      if (authored.figmaPreviewUrl) {
        assert.equal(record.figmaPreviewSourceId, resource.id);
        assert.equal(resource.url, authored.figmaPreviewUrl);
      } else {
        assert.equal(record.figmaPreviewSourceId, undefined);
        assert.equal(record.navigation.canonicalId, authored.navigation.canonicalId);
      }
      const markdown = await fs.readFile(path.join(directory, 'pages', `${id}.md`), 'utf8');
      assert.ok(markdown.includes(`[${resource.label}](${resource.url})`));
    }
    assert.equal(await fs.readFile(snapshotPath, 'utf8'), snapshot);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('Figma previews require a matching Figma resource and can coexist with Storybook resources', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'docsite-figma-'));
  const [record] = (await readGuidance()).filter((record) => record.id === 'page-header');
  const source = (extra, resources) =>
    `---\nid: page-header\ntitle: Page header\nsummary: Summary\n${extra}\nresources: ${resources}\n---\n\nGuidance.`;
  try {
    const content = path.join(directory, 'content');
    await fs.mkdir(content);
    const input = path.join(content, 'PageHeader.md');
    const options = {
      contentDirectory: pathToFileURL(`${content}${path.sep}`),
      snapshotPath: new URL('../content/storybook-index.snapshot.json', import.meta.url),
      indexPath: null,
      outputDirectory: path.join(directory, 'generated'),
    };
    await fs.writeFile(input, source(`figmaPreviewUrl: ${record.figmaPreviewUrl}`, '[]'));
    await assert.rejects(generateContent(options), /figmaPreviewUrl must match a Figma resource/);
    await fs.writeFile(input, source('preview: figma', '[]'));
    await assert.rejects(generateContent(options), /Figma preview requires a Figma resource/);
    await fs.writeFile(
      input,
      source(
        `figmaPreviewUrl: ${record.figmaPreviewUrl}\npreview: figma\nstorybookTitles:\n  - Components/Avatar`,
        `\n  - label: Figma component\n    url: ${record.figmaPreviewUrl}`,
      ),
    );
    await generateContent(options);
    const [generated] = JSON.parse(
      await fs.readFile(path.join(options.outputDirectory, 'metadata.json'), 'utf8'),
    );
    assert.equal(generated.previewSourceId, undefined);
    assert.equal(
      generated.sources.find((source) => source.id === generated.figmaPreviewSourceId)?.url,
      record.figmaPreviewUrl,
    );
    assert.ok(generated.sources.some((source) => source.kind === 'storybook'));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
