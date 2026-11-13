// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { format } from 'prettier';
import { guidanceMarkdown, readGuidance, renderGuidance } from '../../../shared/guidance.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSnapshotPath = path.join(appRoot, 'content/StorybookIndex.snapshot.json');
const isDocumentationStory = (entry) =>
  entry.type === 'story' && (!entry.tags || entry.tags.includes('manifest'));

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
        return Object.values(index.entries).filter(isDocumentationStory);
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
  return Object.values(index.entries).filter(isDocumentationStory);
}

async function readStorybookMarkdown(directory, entries, required) {
  if (directory === null) {
    if (required) throw new Error('A production build requires Storybook Markdown.');
    return { version: 1, documents: [] };
  }
  let source;
  try {
    source = await fs.readFile(path.join(directory, 'index.json'), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT' || required) {
      throw new Error(
        'Unable to read Storybook Markdown. Run npm run build:storybook before building the docsite.',
        { cause: error },
      );
    }
    console.warn(
      'Storybook Markdown is unavailable; generating guidance only. Run npm run build:storybook for APIs and examples.',
    );
    return { version: 1, documents: [] };
  }
  const index = JSON.parse(source);
  if (index.version !== 1 || !Array.isArray(index.documents) || !index.documents.length) {
    throw new Error('Storybook Markdown index must contain version 1 and nonempty documents.');
  }
  const ids = new Set();
  const storyIds = new Set();
  const storiesById = new Map(entries.map((entry) => [entry.id, entry]));
  const documents = [];
  for (const document of index.documents) {
    if (
      !document ||
      typeof document.id !== 'string' ||
      !/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(document.id) ||
      ids.has(document.id) ||
      typeof document.title !== 'string' ||
      !document.title.trim() ||
      !['component', 'docs'].includes(document.kind) ||
      document.path !== `llms/${document.id}.md` ||
      !Array.isArray(document.storyIds)
    ) {
      throw new Error('Invalid or duplicate document in Storybook Markdown index.');
    }
    ids.add(document.id);
    for (const id of document.storyIds) {
      const story = storiesById.get(id);
      if (!story || storyIds.has(id) || story.title !== document.title) {
        throw new Error(`Storybook Markdown does not match its story index: ${id}`);
      }
      storyIds.add(id);
    }
    const markdown = await fs.readFile(path.join(directory, `${document.id}.md`), 'utf8');
    if (!markdown.trim()) throw new Error(`Empty Storybook Markdown: ${document.id}`);
    documents.push({ ...document, markdown });
  }
  const missing = entries.filter((entry) => !storyIds.has(entry.id));
  if (missing.length) {
    throw new Error(
      `Storybook Markdown is missing stories: ${missing.map(({ id }) => id).join(', ')}`,
    );
  }
  return { version: 1, documents };
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
  storybookRoot = process.env.STORYBOOK_ROOT ?? 'http://localhost:6006',
  indexUrl = process.env.STORYBOOK_INDEX_URL ?? `${storybookRoot}/index.json`,
  contentDirectory,
  storybookMarkdownDirectory = refresh || indexPath === null
    ? null
    : path.join(
        indexPath
          ? path.dirname(indexPath)
          : path.resolve(appRoot, '../storybook/storybook-static'),
        'llms',
      ),
  requireStorybookMarkdown = false,
} = {}) {
  const pagesDirectory = path.join(outputDirectory, 'pages');
  const authored = await readGuidance(contentDirectory);
  const entries = await readStorybookEntries({ refresh, indexPath, snapshotPath, indexUrl });
  const storybookMarkdown = await readStorybookMarkdown(
    storybookMarkdownDirectory,
    entries,
    requireStorybookMarkdown,
  );
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
    const guidance = guidanceMarkdown(record, resources);
    const references = titles.flatMap((title) =>
      storybookMarkdown.documents.filter(
        (document) => document.kind === 'component' && document.title === title,
      ),
    );
    const markdown = [guidance, ...references.map(({ markdown }) => markdown)].join('\n\n');
    components.push({
      id: record.id,
      title: record.title,
      summary: { text: record.summary },
      navigation: { group: 'Components', showInSidebar: true, ...record.navigation },
      sources,
      ...(preview === 'storybook' ? { previewSourceId: storybookSource.id } : {}),
      ...(preview === 'figma' ? { figmaPreviewSourceId: figmaSource.id } : {}),
      resourceSourceIds: sources.map((source) => source.id),
      anchors,
      searchText: markdownToSearchText(guidance),
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
  const markdownDirectory = path.join(outputDirectory, 'llms');
  await fs.mkdir(markdownDirectory, { recursive: true });
  const documents = storybookMarkdown.documents.map(({ markdown, ...document }) => {
    void markdown;
    return document;
  });
  for (const document of storybookMarkdown.documents) {
    await writeIfChanged(path.join(markdownDirectory, `${document.id}.md`), document.markdown);
  }
  const documentIds = new Set(documents.map(({ id }) => id));
  for (const file of await fs.readdir(markdownDirectory)) {
    if (/^[a-z0-9-]+\.md$/.test(file) && !documentIds.has(path.parse(file).name)) {
      await fs.unlink(path.join(markdownDirectory, file));
    }
  }
  await writeIfChanged(
    path.join(markdownDirectory, 'index.json'),
    JSON.stringify({ version: 1, documents }, null, 2) + '\n',
  );
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
  await generateContent({
    refresh: process.argv.includes('--refresh-storybook'),
    requireStorybookMarkdown: process.argv.includes('--require-storybook-markdown'),
  });
