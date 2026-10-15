// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { createStoryInventory } from './story-inventory.mjs';
import { extractStorySource } from './story-source.mjs';
import { appRoot } from './generate-component-stories.mjs';
import { generateComponentStories } from './generate-component-stories.mjs';
import { componentStoryDocsProvider } from './component-story-docs.mjs';

test('source-backed examples retain helpers, data, styles, types and package imports', async () => {
  const inventory = await createStoryInventory();
  const cache = new Map();
  for (const [id, storyName, markers] of [
    ['components-accordion', 'Default', ['Accordion Panel 3']],
    ['components-accordion', 'Controlled', ['React.useState', 'setOpenItems']],
    [
      'components-button-button',
      'Appearance',
      ['makeStyles', 'bundleIcon', 'CalendarMonthRegular'],
    ],
    ['components-datagrid', 'Default', ['items', 'columns']],
    ['components-tree', 'LazyLoading', ['mockFetch', 'useQuery']],
  ]) {
    const component = inventory.components.find((item) => item.id === id);
    const story = component.stories.find((item) => item.exportName === storyName);
    assert.ok(story, `${id}/${storyName}`);
    const result = await extractStorySource(story, { root: appRoot, cache });
    for (const marker of markers)
      assert.ok(result.snippet.includes(marker), `${story.id}: ${marker}`);
    assert.doesNotMatch(result.snippet, /from ['"](?:@fluentui\/react-components|\.\/|\.\.\/)/);
    assert.doesNotMatch(result.snippet, /figmaDesign|export default|StoryObj/);
    assert.equal(
      ts.transpileModule(result.snippet, {
        compilerOptions: { jsx: ts.JsxEmit.React },
        reportDiagnostics: true,
      }).diagnostics.length,
      0,
    );
  }
});

test('missing or conflicting relative dependencies produce explicit errors', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-story-source-'));
  try {
    await fs.writeFile(
      path.join(root, 'story.tsx'),
      `import { helper } from './missing'; export const Default = () => helper();`,
    );
    await assert.rejects(
      extractStorySource(
        { id: 'test--default', implementationFile: 'story.tsx', implementationExport: 'Default' },
        { root },
      ),
      /Cannot resolve example dependency/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('Fluent Markdown dependencies are sanitized in both snippets and descriptions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-source-markdown-'));
  try {
    const directory = path.join(root, 'fluent-stories');
    await fs.mkdir(directory);
    await fs.writeFile(
      path.join(directory, 'description.md'),
      '[Internal task](https://example.visualstudio.com/project/_workitems/edit/123) ' +
        '[Public docs](https://example.com/docs)',
    );
    await fs.writeFile(
      path.join(directory, 'story.tsx'),
      `
import description from './description.md';
export const Default = () => <div>{description}</div>;
`,
    );
    const result = await extractStorySource(
      {
        id: 'test--default',
        implementationFile: 'fluent-stories/story.tsx',
        implementationExport: 'Default',
      },
      { root },
    );
    for (const text of [result.snippet, result.description]) {
      assert.doesNotMatch(text, /visualstudio\.com/);
      assert.match(text, /Internal task/);
      assert.match(text, /example\.com/);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('Fluent optional picker props omit inline-label settings without changing runtime code', async () => {
  const inventory = await createStoryInventory();
  for (const [id, type] of [
    ['components-combobox', 'ComboboxProps'],
    ['components-dropdown', 'DropdownProps'],
  ]) {
    const story = inventory.components
      .find((component) => component.id === id)
      .stories.find((item) => item.exportName === 'Controlled');
    const original = await fs.readFile(path.join(appRoot, story.implementationFile), 'utf8');
    const result = await extractStorySource(story, { root: appRoot });
    assert.ok(result.snippet.includes(`Partial<Omit<${type}, "label" | "dynamicWidth">>`));
    assert.ok(original.includes(`Partial<${type}>`));
    assert.equal(await fs.readFile(path.join(appRoot, story.implementationFile), 'utf8'), original);
    assert.match(result.snippet, /\{\.\.\.props\}/);
    assert.match(result.snippet, /from "@coreai-ds\/react-components"/);
    assert.doesNotMatch(result.snippet, /@ts-ignore|@ts-expect-error|as any/);
    const unadapted = await extractStorySource({ ...story, origin: 'local' }, { root: appRoot });
    const emit = (source) =>
      ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
      }).outputText;
    assert.equal(
      emit(result.snippet),
      emit(unadapted.snippet),
      'Type adaptation must not change JavaScript',
    );
  }
});

test('prop adaptation follows import aliases and leaves local or unrelated Partial types unchanged', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-picker-props-'));
  try {
    await fs.writeFile(
      path.join(root, 'story.tsx'),
      `import { Combobox, type ComboboxProps as PickerProps, type ButtonProps } from '@fluentui/react-components';
export const Default = (props: Partial<PickerProps>, other: Partial<ButtonProps>) => <Combobox {...props} />;
`,
    );
    const story = {
      id: 'test--default',
      implementationFile: 'story.tsx',
      implementationExport: 'Default',
    };
    const fluent = await extractStorySource({ ...story, origin: 'fluent' }, { root });
    assert.ok(fluent.snippet.includes('Partial<Omit<PickerProps, "label" | "dynamicWidth">>'));
    assert.ok(fluent.snippet.includes('Partial<ButtonProps>'));
    const local = await extractStorySource({ ...story, origin: 'local' }, { root });
    assert.ok(local.snippet.includes('Partial<PickerProps>'));
    assert.ok(!local.snippet.includes('Omit<PickerProps'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('every inventoried implementation can produce an explicit source closure', async (t) => {
  const inventory = await createStoryInventory();
  const cache = new Map();
  let count = 0;
  for (const component of inventory.components) {
    for (const story of component.stories) {
      const result = await extractStorySource(story, { root: appRoot, cache });
      assert.ok(result.snippet.trim());
      assert.ok(result.requirements.length > 0);
      count++;
    }
  }
  t.diagnostic(`Extracted ${count} selected examples; consumer type-checking is a separate gate.`);
});

test('inventory-backed provider publishes both local and Fluent stories and delegates unrelated entries', async () => {
  await generateComponentStories();
  let delegated = 0;
  const provider = componentStoryDocsProvider(async () => {
    delegated++;
    return undefined;
  });
  const payload = await provider({
    entry: {
      title: 'Components/Accordion',
      importPath: './.storybook/.cache/component-stories/components-accordion.stories.js',
    },
  });
  assert.equal(payload.id, 'components-accordion');
  assert.ok(
    payload.stories['components-accordion--default'].description.includes('local CoreAI override'),
  );
  assert.ok(
    payload.stories['components-accordion--controlled'].description.includes('Fluent upstream'),
  );
  assert.ok(payload.stories['components-accordion--controlled'].snippet.includes('setOpenItems'));
  assert.equal(payload.import, undefined, 'Provider examples already contain their own imports');
  assert.equal(delegated, 0);
  await provider({
    entry: { title: 'Templates/Test', importPath: './src/stories/templates/Test.stories.tsx' },
  });
  assert.equal(delegated, 1);
});
