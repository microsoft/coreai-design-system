// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';
import matter from 'gray-matter';
import { readGuidance, renderGuidance } from '../../../shared/guidance.mjs';

const appRoot = new URL('../', import.meta.url);
const contentRoot = new URL('content/components/', appRoot);
const generatedComponentsUrl = new URL('content/generated/metadata.json', appRoot);
const storybookManifestUrl = new URL('content/generated/storybook-manifest.json', appRoot);
const distRoot = new URL('dist/', appRoot);
const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

async function readComponentRecords() {
  const contents = JSON.parse(await fs.readFile(generatedComponentsUrl, 'utf8'));
  return Promise.all(
    contents.map(async (content) => ({
      fileName: `${content.id}.md`,
      content: {
        ...content,
        markdown: await fs.readFile(
          new URL(`content/generated/pages/${content.id}.md`, appRoot),
          'utf8',
        ),
      },
    })),
  );
}

test('authored Markdown drives every human and agent component page', async () => {
  const records = await readComponentRecords();
  const authoredFileNames = (await fs.readdir(contentRoot)).sort();
  const authoredById = new Map(
    await Promise.all(
      authoredFileNames.map(async (fileName) => {
        const authored = matter(await fs.readFile(new URL(fileName, contentRoot), 'utf8'));
        return [authored.data.id, authored];
      }),
    ),
  );
  const ids = new Set();
  const markdownDocuments = [];
  const llms = await fs.readFile(new URL('llms.txt', distRoot), 'utf8');
  const builtRegistry = JSON.parse(
    await fs.readFile(new URL('site-registry.json', distRoot), 'utf8'),
  );
  const sourceRegistry = JSON.parse(
    await fs.readFile(new URL('site-registry.json', appRoot), 'utf8'),
  );

  assert.ok(records.length > 0);
  assert.match(llms, /\[Storybook manifest\]\(\/storybook-manifest\.json\)/);
  assert.equal(
    authoredFileNames.every((fileName) => fileName.endsWith('.md')),
    true,
    'Component guidance must be authored as Markdown',
  );
  assert.equal(authoredFileNames.length, records.length);
  for (const fileName of authoredFileNames)
    assert.match(fileName, /^[A-Z][A-Za-z0-9]*(?:-[a-z0-9]+)*\.md$/);
  assert.equal(
    sourceRegistry.pages.some((page) => page.group === 'Components'),
    false,
  );
  for (const { fileName, content } of records) {
    assert.match(content.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, fileName);
    assert.ok(
      content.searchText.length > content.summary.text.length,
      `${fileName} has no search text`,
    );
    assert.ok(content.summary.text.length <= 200, `${fileName} summary exceeds 200 characters`);
    assert.ok(
      [...sentenceSegmenter.segment(content.summary.text)].length <= 2,
      `${fileName} summary exceeds two sentences`,
    );
    assert.equal(ids.has(content.id), false, `Duplicate component ID: ${content.id}`);
    ids.add(content.id);
    assert.ok(
      content.navigation === undefined ||
        content.navigation.group === 'Components' ||
        content.navigation.group === 'Templates' ||
        content.navigation.group === 'Assets',
      `${fileName} has an invalid navigation group`,
    );

    const sources = new Map(content.sources.map((source) => [source.id, source]));
    if (content.previewSourceId !== undefined) {
      assert.ok(
        sources.get(content.previewSourceId)?.kind === 'storybook',
        `${fileName} preview must reference Storybook`,
      );
    }
    if (content.figmaPreviewSourceId !== undefined) {
      assert.equal(
        sources.get(content.figmaPreviewSourceId)?.kind,
        'figma',
        `${fileName} Figma preview must reference Figma`,
      );
    }

    for (const source of content.sources) {
      if (source.kind !== 'storybook') {
        assert.doesNotThrow(() => new URL(source.url), `${fileName} has an invalid source URL`);
      }
    }
    for (const sourceId of content.resourceSourceIds) {
      assert.ok(sources.has(sourceId), `${fileName} resource source "${sourceId}" is missing`);
    }
    const authored = authoredById.get(content.id);
    assert.ok(authored, `${content.id} has no authored guidance`);
    const rendered = renderGuidance(authored.content.trim());
    assert.deepEqual(content.anchors, rendered.anchors);
    assert.equal(
      await fs.readFile(new URL(`content/generated/pages/${content.id}.html`, appRoot), 'utf8'),
      rendered.html,
    );
    assert.equal('sections' in content, false);

    const markdown = await fs.readFile(new URL(`components/${content.id}.md`, distRoot), 'utf8');
    markdownDocuments.push(markdown);
    assert.equal(markdown, content.markdown);
    assert.match(markdown, new RegExp(`^# ${content.title}$`, 'm'));
    assert.doesNotMatch(markdown, /^---$/m, `${fileName} public Markdown includes frontmatter`);
    assert.ok(
      markdown.includes(authored.content.trim()),
      `${fileName} must preserve authored guidance`,
    );
    if (content.status === 'under-construction') {
      assert.match(markdown, /^## Status\n\nPage under construction\.$/m);
    }
    if (content.previewSourceId) {
      const preview = sources.get(content.previewSourceId);
      assert.ok(markdown.includes(`- [Storybook](${preview.url}/?path=/story/${preview.storyId})`));
    }
    assert.match(llms, new RegExp(`\\[${content.title}\\]\\(/components/${content.id}\\.md\\)`));
    const registryPage = builtRegistry.pages.find((page) => page.id === content.id);
    if (content.navigation?.canonicalId !== undefined) {
      assert.equal(registryPage, undefined, `${content.id} must redirect to its canonical page`);
      assert.ok(
        builtRegistry.redirects.some(
          (redirect) =>
            redirect.from === `/${content.id}/` &&
            redirect.to === `/${content.navigation.canonicalId}/`,
        ),
        `${content.id} canonical redirect is missing`,
      );
      continue;
    }
    assert.ok(registryPage, `${content.id} must appear in built registry`);
    assert.equal(
      registryPage.showInSidebar,
      content.navigation?.showInSidebar ?? true,
      `${content.id} has incorrect sidebar visibility`,
    );
    assert.equal(
      registryPage.group,
      content.navigation?.group ?? 'Components',
      `${content.id} has incorrect navigation group`,
    );
    assert.equal(
      'incomplete' in registryPage,
      false,
      `${content.id} uses legacy completeness state`,
    );
  }

  for (const { fileName, content } of records) {
    if (content.navigation?.canonicalId !== undefined) {
      assert.ok(
        ids.has(content.navigation.canonicalId),
        `${fileName} canonical component is missing`,
      );
      assert.equal(
        content.navigation.showInSidebar,
        false,
        `${fileName} canonical variants must be hidden from the sidebar`,
      );
    }
  }

  const llmsFull = await fs.readFile(new URL('llms-full.txt', distRoot), 'utf8');
  assert.equal(llmsFull, markdownDocuments.join('\n\n---\n\n'));
});

test('generated Storybook manifest owns preview ids and story lists', async () => {
  const manifest = JSON.parse(await fs.readFile(storybookManifestUrl, 'utf8'));
  const builtManifest = JSON.parse(
    await fs.readFile(new URL('storybook-manifest.json', distRoot), 'utf8'),
  );
  const records = await readComponentRecords();
  assert.deepEqual(builtManifest, manifest);

  for (const { fileName, content } of records) {
    if (!content.previewSourceId) {
      continue;
    }
    const preview = content.sources.find((source) => source.id === content.previewSourceId);
    const generatedPreview = manifest.components[content.id];
    assert.ok(generatedPreview, `${fileName} is missing generated Storybook metadata`);
    assert.equal(preview.storyId, generatedPreview.defaultStoryId);
    assert.deepEqual(
      preview.stories,
      generatedPreview.stories.map(({ label, storyId }) => ({ label, storyId })),
    );
  }
});

test('canonical Figma pages remain represented in authored Markdown', async () => {
  const records = await readComponentRecords();
  const contentById = new Map(records.map(({ content }) => [content.id, content]));
  const authoredFiles = (await fs.readdir(contentRoot)).filter((fileName) =>
    fileName.endsWith('.md'),
  );
  const canonicalPages = [];

  for (const fileName of authoredFiles) {
    const source = await fs.readFile(new URL(fileName, contentRoot), 'utf8');
    const { data } = matter(source);
    if (data.figmaPageId) {
      canonicalPages.push({ fileName, id: data.id, figmaPageId: data.figmaPageId });
    }
  }

  assert.equal(canonicalPages.length, 50);
  assert.equal(new Set(canonicalPages.map((page) => page.figmaPageId)).size, 50);
  for (const page of canonicalPages) {
    const content = contentById.get(page.id);
    assert.ok(content, `${page.fileName} is missing generated content`);
    assert.equal(content.navigation.showInSidebar, true, `${page.fileName} must be in navigation`);
    assert.equal(
      Boolean(content.previewSourceId || content.figmaPreviewSourceId),
      true,
      `${page.fileName} must have a preview`,
    );
  }
});

test('all source records survive generation and aliases resolve directly', async () => {
  const authored = await readGuidance();
  const records = await readComponentRecords();
  assert.equal(records.length, authored.length);
  for (const record of authored) {
    const generated = records.find(({ content }) => content.id === record.id).content;
    assert.equal(generated.navigation.canonicalId, record.navigation?.canonicalId);
  }
});

test('component routes are generic rather than registered per component', async () => {
  const appSource = await fs.readFile(new URL('src/App.tsx', appRoot), 'utf8');
  const componentPageSource = await fs.readFile(
    new URL('src/components/ComponentPage.tsx', appRoot),
    'utf8',
  );
  assert.match(appSource, /page\.group === 'Components'/);
  assert.match(appSource, /page\.group === 'Templates'/);
  assert.match(appSource, /page\.group === 'Assets'/);
  assert.match(appSource, /<Component componentId=\{page\.id\} \/>/);
  assert.doesNotMatch(appSource, /pages\/Accordion/);
  assert.match(componentPageSource, /content\.figmaPreviewSourceId/);
  assert.match(componentPageSource, /Code work in progress/);
  assert.match(
    componentPageSource,
    /content\.status === 'under-construction' \? <WorkInProgress \/>/,
  );
  const constructionState = await fs.readFile(
    new URL('src/components/work-in-progress.tsx', appRoot),
    'utf8',
  );
  assert.match(constructionState, /Page under construction/);
  assert.match(constructionState, /href=\{siteLinks\.feedback\}/);
});

test('templates follow components in sidebar navigation', async () => {
  const registrySource = await fs.readFile(new URL('src/data/registry.ts', appRoot), 'utf8');
  const sidebarSource = await fs.readFile(new URL('src/components/Sidebar.tsx', appRoot), 'utf8');
  const docsiteStyles = await fs.readFile(new URL('src/styles/docsite.css', appRoot), 'utf8');
  assert.match(registrySource, /label: 'Components'[\s\S]*label: 'Templates'/);
  assert.match(docsiteStyles, /\.app-sidenav__section-shell\s*\{[^}]*border-bottom:/);
  assert.match(
    docsiteStyles,
    /\.app-sidenav__nav\s*\{[^}]*scrollbar-color:\s*transparent transparent/,
  );
  assert.match(docsiteStyles, /\.app-sidenav__nav\.is-scrolling\s*\{[^}]*scrollbar-color:/);
  assert.match(sidebarSource, /standaloneGroups\.map\(\(group\) =>/);
  assert.doesNotMatch(sidebarSource, /app-sidenav__accordion-list/);
  assert.doesNotMatch(sidebarSource, /page\.incomplete/);

  const builtRegistry = JSON.parse(
    await fs.readFile(new URL('site-registry.json', distRoot), 'utf8'),
  );
  assert.equal(builtRegistry.pages.find((page) => page.id === 'empty-state')?.group, 'Templates');
});
