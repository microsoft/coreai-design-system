// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { format } from 'prettier';
import { guidanceMarkdown, readGuidance, renderGuidance } from '../../../shared/guidance.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSnapshotPath = path.join(appRoot, 'content/storybook-index.snapshot.json');

async function writeIfChanged(file, content) {
  try {
    if ((await fs.readFile(file, 'utf8')) === content) return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(file, content);
}

async function readStorybookEntries({ refresh, indexPath, snapshotPath, indexUrl }) {
  if (!refresh || indexPath) {
    const sourcePath =
      indexPath === undefined
        ? path.resolve(appRoot, '../storybook/storybook-static/index.json')
        : indexPath;
    if (sourcePath) {
      try {
        const index = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
        if (!index.entries) throw new Error(`${sourcePath} is not a Storybook index.`);
        return Object.values(index.entries).filter((entry) => entry.type === 'story');
      } catch (error) {
        if (error.code !== 'ENOENT' || indexPath) throw error;
      }
    }
    const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
    if (!Array.isArray(snapshot.stories)) throw new Error(`${snapshotPath} has no stories array.`);
    return snapshot.stories;
  }
  const response = await fetch(indexUrl);
  if (!response.ok) throw new Error(`Unable to fetch Storybook index: ${response.status}`);
  const index = await response.json();
  if (!index.entries) throw new Error(`${indexUrl} is not a Storybook index.`);
  return Object.values(index.entries).filter((entry) => entry.type === 'story');
}

function resourceSource(resource, index) {
  const hostname = new URL(resource.url).hostname;
  const kind =
    hostname === 'figma.com' || hostname.endsWith('.figma.com')
      ? 'figma'
      : hostname.includes('fluent') || resource.url.includes('github.com/microsoft/fluentui')
        ? 'fluent'
        : 'resource';
  return { id: `resource-${index}`, kind, ...resource };
}

function markdownToSearchText(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[`*_>#|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateContent({
  outputDirectory = path.join(appRoot, 'content/generated'),
  snapshotPath = defaultSnapshotPath,
  indexPath = process.env.STORYBOOK_INDEX_PATH,
  refresh = false,
  storybookRoot = process.env.STORYBOOK_ROOT ?? 'https://coreai-ds-storybook.azurewebsites.net',
  indexUrl = process.env.STORYBOOK_INDEX_URL ?? `${storybookRoot}/index.json`,
  contentDirectory,
} = {}) {
  const pagesDirectory = path.join(outputDirectory, 'pages');
  const authored = await readGuidance(contentDirectory);
  const entries = await readStorybookEntries({ refresh, indexPath, snapshotPath, indexUrl });
  const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
  const components = [];
  const manifest = { storybookRoot, components: {}, guidanceByStoryTitle: {} };
  await fs.mkdir(pagesDirectory, { recursive: true });
  for (const record of authored) {
    const sources = record.resources.map(resourceSource);
    const titles = record.storybookTitles ?? [];
    const matching = entries
      .filter((entry) => titles.includes(entry.title))
      .sort(
        (left, right) =>
          titles.indexOf(left.title) - titles.indexOf(right.title) ||
          Number(right.id.endsWith('--default')) - Number(left.id.endsWith('--default')) ||
          compare(left.id, right.id),
      );
    for (const title of titles) {
      if (!matching.some((entry) => entry.title === title))
        throw new Error(`${record.id}: missing Storybook title "${title}".`);
      (manifest.guidanceByStoryTitle[title] ??= []).push(
        record.navigation?.canonicalId ?? record.id,
      );
    }
    let storybookSource;
    if (matching.length) {
      const defaultStory = record.storybookDefaultStory
        ? matching.find((entry) => entry.name === record.storybookDefaultStory)
        : (matching.find((entry) => entry.title === titles[0] && entry.id.endsWith('--default')) ??
          matching[0]);
      if (!defaultStory) throw new Error(`${record.id}: missing preferred Storybook story.`);
      const stories = matching.map((entry) => ({
        storyId: entry.id,
        label: entry.name.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
      }));
      storybookSource = {
        id: 'storybook',
        kind: 'storybook',
        label: 'Storybook',
        url: storybookRoot,
        storyId: defaultStory.id,
        stories,
      };
      sources.unshift(storybookSource);
      manifest.components[record.id] = {
        titles,
        defaultStoryId: defaultStory.id,
        stories: matching.map((entry, index) => ({ title: entry.title, ...stories[index] })),
      };
    }
    const figmaSource = record.figmaPreviewUrl
      ? sources.find((source) => source.url === record.figmaPreviewUrl && source.kind === 'figma')
      : undefined;
    if (record.figmaPreviewUrl && !figmaSource)
      throw new Error(`${record.id}: figmaPreviewUrl must match a Figma resource.`);
    const preview =
      record.preview ?? (storybookSource ? 'storybook' : figmaSource ? 'figma' : undefined);
    if (preview === 'storybook' && !storybookSource)
      throw new Error(`${record.id}: Storybook preview requires stories.`);
    if (preview === 'figma' && !figmaSource)
      throw new Error(`${record.id}: Figma preview requires a Figma resource.`);
    const { html, anchors } = renderGuidance(record.body);
    const resources = sources.map((source) => ({
      label: source.label,
      url:
        source.kind === 'storybook' ? `${source.url}/?path=/story/${source.storyId}` : source.url,
    }));
    const markdown = guidanceMarkdown(record, resources);
    components.push({
      id: record.id,
      title: record.title,
      summary: { text: record.summary },
      navigation: { group: 'Components', showInSidebar: true, ...record.navigation },
      status: record.status ?? 'complete',
      sources,
      ...(preview === 'storybook' ? { previewSourceId: storybookSource.id } : {}),
      ...(preview === 'figma' ? { figmaPreviewSourceId: figmaSource.id } : {}),
      resourceSourceIds: sources.map((source) => source.id),
      anchors,
      searchText: markdownToSearchText(markdown),
    });
    await Promise.all([
      writeIfChanged(path.join(pagesDirectory, `${record.id}.html`), html),
      writeIfChanged(path.join(pagesDirectory, `${record.id}.md`), markdown),
    ]);
  }
  for (const title of Object.keys(manifest.guidanceByStoryTitle)) {
    manifest.guidanceByStoryTitle[title] = [
      ...new Set(manifest.guidanceByStoryTitle[title]),
    ].sort();
  }
  const ids = new Set(authored.map((record) => record.id));
  for (const file of await fs.readdir(pagesDirectory)) {
    if (/\.(html|md)$/.test(file) && !ids.has(path.parse(file).name))
      await fs.unlink(path.join(pagesDirectory, file));
  }
  for (const [file, value] of [
    ['metadata.json', components],
    ['storybook-manifest.json', manifest],
  ]) {
    await writeIfChanged(
      path.join(outputDirectory, file),
      await format(JSON.stringify(value), { parser: 'json', printWidth: 100 }),
    );
  }
  if (refresh) {
    const titles = new Set(authored.flatMap((record) => record.storybookTitles ?? []));
    const stories = [
      ...new Map(
        entries
          .filter((entry) => titles.has(entry.title))
          .map((entry) => [
            entry.id,
            {
              id: entry.id,
              title: entry.title,
              name: entry.name,
            },
          ]),
      ).values(),
    ].sort((left, right) => compare(left.id, right.id));
    await writeIfChanged(
      snapshotPath,
      await format(JSON.stringify({ stories }), { parser: 'json', printWidth: 100 }),
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await generateContent({ refresh: process.argv.includes('--refresh-storybook') });
