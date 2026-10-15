// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { loadCsf } from 'storybook/internal/csf-tools';
import { createStoryInventory } from './story-inventory.mjs';
import {
  appRoot,
  generatedRoot,
  generatedStoryIndexer,
  generateComponentIndex,
  generateComponentStories,
} from './generate-component-stories.mjs';
import { componentMetadata, storyWithMetadata } from './story-metadata.mjs';

test('each generated component owns exactly its selected canonical stories', async () => {
  const inventory = await createStoryInventory();
  for (const component of inventory.components) {
    const source = generateComponentIndex(component);
    const csf = loadCsf(source, {
      fileName: `${component.id}.stories.js`,
      makeTitle: (title) => title,
    }).parse();
    assert.equal(csf.meta.title, component.title);
    assert.deepEqual(
      csf.stories.map((story) => story.id).sort(),
      component.stories.map((story) => story.id).sort(),
    );
    for (const story of component.stories) {
      assert.equal(csf._storyAnnotations[story.exportName].name.value, story.name);
    }
    assert.ok(
      !source.includes('export { Default }'),
      'Definitions must carry source-specific metadata',
    );
  }
  const accordion = inventory.components.find(
    (component) => component.id === 'components-accordion',
  );
  const source = generateComponentIndex(accordion);
  assert.ok(source.includes('src/stories/components/Accordion.stories.tsx'));
  assert.ok(source.includes('fluent-stories/packages/react-components/react-accordion'));
  assert.match(source, /component: Accordion/);
  assert.ok(!source.includes('__CoreAI_'));
  assert.match(source, /subcomponents:/);
});

test('generated index names match the inventory, including aliased exports, without changing other entries', async () => {
  const inventory = await generateComponentStories();
  const indexer = generatedStoryIndexer({
    test: /\.stories\.js$/,
    async createIndex(file) {
      return loadCsf(await fs.readFile(file, 'utf8'), {
        fileName: file,
        makeTitle: (title) => title,
      }).parse().indexInputs;
    },
  });
  for (const component of inventory.components) {
    const entries = await indexer.createIndex(
      path.join(generatedRoot, `${component.id}.stories.js`),
    );
    assert.deepEqual(
      entries.map((entry) => [entry.exportName, entry.name]),
      component.stories.map((story) => [story.exportName, story.name]),
    );
  }
  const localFile = path.join(appRoot, 'src', 'stories', 'components', 'CounterBadge.stories.tsx');
  const original = loadCsf(await fs.readFile(localFile, 'utf8'), {
    fileName: localFile,
    makeTitle: (title) => title,
  }).parse().indexInputs;
  assert.deepEqual(await indexer.createIndex(localFile), original);
});

test('generated owners belong to one configured TypeScript project with CoreAI source mapping', async () => {
  const inventory = await generateComponentStories();
  const configFile = path.join(generatedRoot, 'tsconfig.json');
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, generatedRoot);
  assert.deepEqual(parsed.errors, []);
  const roots = new Set(parsed.fileNames.map((file) => path.resolve(file)));
  for (const component of inventory.components) {
    assert.ok(roots.has(path.join(generatedRoot, `${component.id}.stories.js`)), component.id);
  }
  assert.equal(parsed.options.allowJs, true);
  const resolved = ts.resolveModuleName(
    '@coreai-ds/react-components',
    path.join(generatedRoot, 'components-accordion.stories.js'),
    parsed.options,
    ts.sys,
  );
  assert.equal(
    path.resolve(resolved.resolvedModule.resolvedFileName),
    path.resolve(appRoot, '..', '..', 'packages', 'react-components', 'src', 'index.ts'),
  );
});

test('component fields fall back independently and preserve import aliases', async () => {
  const component = {
    id: 'test',
    title: 'Test',
    sources: [
      {
        sourceFile: 'upstream.stories.tsx',
        metadata: { component: 'Combobox', subcomponents: '{ Item }' },
        imports: [
          {
            specifier: '@fluentui/react-components',
            source: "import { Combobox, Option as Item } from '@fluentui/react-components';",
          },
        ],
      },
      {
        sourceFile: 'local.stories.tsx',
        metadata: { component: 'Combobox' },
        imports: [
          {
            specifier: '@coreai-ds/react-components',
            source: "import { Combobox } from '@coreai-ds/react-components';",
          },
        ],
      },
    ],
    stories: [],
  };
  const source = generateComponentIndex(component);
  assert.match(source, /component: Combobox/);
  assert.match(source, /subcomponents: \{ Item \}/);
  assert.match(source, /Option as Item/);
  assert.doesNotMatch(source, /from '@fluentui\/react-components'/);

  component.sources[1].metadata.subcomponents = '{}';
  assert.match(generateComponentIndex(component), /subcomponents: \{\}/);
  component.sources[1].metadata.subcomponents = '{ Item }';
  component.sources[1].imports[0].source =
    "import { Combobox, Listbox as Item } from '@coreai-ds/react-components';";
  assert.match(generateComponentIndex(component), /Listbox as Item/);
  component.sources[1].imports[0].source =
    "import { Combobox as Item, Combobox } from '@coreai-ds/react-components';";
  component.sources[1].metadata.component = 'Item';
  delete component.sources[1].metadata.subcomponents;
  assert.throws(
    () => generateComponentIndex(component),
    /Conflicting component metadata import Item/,
  );
});

test('empty later local metadata cannot erase authored docs or upstream subcomponents', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-component-docs-'));
  try {
    const localRoot = path.join(root, 'src', 'stories', 'components');
    const fluentRoot = path.join(
      root,
      'fluent-stories',
      'packages',
      'react-components',
      'react-tabs',
      'stories',
      'src',
      'Tabs',
    );
    await fs.mkdir(localRoot, { recursive: true });
    await fs.mkdir(fluentRoot, { recursive: true });
    await fs.writeFile(
      path.join(fluentRoot, 'index.stories.tsx'),
      `
import { TabList, Tab } from '@fluentui/react-components';
/** Upstream description.
 * @summary Upstream summary.
 */
export default { title: 'Components/TabList', component: TabList, subcomponents: { Tab } };
export const Default = () => null;
`,
    );
    await fs.writeFile(
      path.join(localRoot, 'TabList.stories.tsx'),
      `
import { TabList } from '@coreai-ds/react-components';
/** Local description.
 * @summary Local summary.
 */
export default { title: 'Components/TabList', component: TabList };
export const Default = () => null;
`,
    );
    await fs.writeFile(
      path.join(localRoot, 'TabListDev.stories.tsx'),
      `
import { TabList } from '@coreai-ds/react-components';
export default { title: 'Components/TabList', component: TabList };
export const DevExample = { name: 'Dev label!', render: () => null };
`,
    );
    const outputRoot = path.join(root, 'generated');
    await generateComponentStories({ root, outputRoot });
    const source = await fs.readFile(
      path.join(outputRoot, 'components-tablist.stories.js'),
      'utf8',
    );
    assert.match(source, /Local description/);
    assert.match(source, /@summary Local summary/);
    assert.doesNotMatch(source, /Upstream description|Upstream summary/);
    assert.match(source, /subcomponents: \{ Tab \}/);
    assert.match(source, /name: "Dev label!"/);

    await fs.writeFile(
      path.join(localRoot, 'TabList.stories.tsx'),
      `
import { TabList } from '@coreai-ds/react-components';
/** Local description. */
export default { title: 'Components/TabList', component: TabList };
export const Default = () => null;
`,
    );
    await generateComponentStories({ root, outputRoot });
    const fallback = await fs.readFile(
      path.join(outputRoot, 'components-tablist.stories.js'),
      'utf8',
    );
    assert.match(fallback, /Local description/);
    assert.match(fallback, /@summary Upstream summary/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('source metadata stays per story, with original functions and nested parameters preserved', () => {
  const render = () => null;
  render.args = { count: 3 };
  const decorator = () => null;
  const loader = () => null;
  const meta = {
    title: 'Test',
    component: render,
    args: { count: 1, label: 'base' },
    decorators: [decorator],
    loaders: [loader],
    parameters: { design: { url: 'figma' }, docs: { description: { component: 'base' } } },
  };
  const story = storyWithMetadata(meta, render, 'test--default');
  assert.equal(story.render, render);
  assert.deepEqual(story.args, { count: 3, label: 'base' });
  assert.deepEqual(story.decorators, [decorator]);
  assert.deepEqual(story.loaders, [loader]);
  assert.equal(story.parameters.design.url, 'figma');
  assert.equal(story.parameters.__id, 'test--default');
  const objectStory = storyWithMetadata(
    meta,
    { render, parameters: { docs: { description: { story: 'variant' } } } },
    'test--variant',
  );
  assert.deepEqual(objectStory.parameters.docs.description, {
    component: 'base',
    story: 'variant',
  });
  const combined = componentMetadata([
    meta,
    { component: render, parameters: { design: 'local' } },
  ]);
  assert.equal(combined.component, render);
  assert.equal(combined.decorators, undefined);
  assert.equal(combined.parameters, undefined);
});

test('regeneration is deterministic and removes only stale generated story files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-generated-indexes-'));
  try {
    await fs.writeFile(path.join(dir, 'removed.stories.js'), 'stale');
    await fs.writeFile(path.join(dir, 'keep.txt'), 'keep');
    const inventory = await generateComponentStories({ outputRoot: dir });
    const file = path.join(dir, `${inventory.components[0].id}.stories.js`);
    const before = await fs.readFile(file, 'utf8');
    await generateComponentStories({ outputRoot: dir });
    assert.equal(await fs.readFile(file, 'utf8'), before);
    assert.equal(await fs.readFile(path.join(dir, 'keep.txt'), 'utf8'), 'keep');
    await assert.rejects(fs.access(path.join(dir, 'removed.stories.js')), { code: 'ENOENT' });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
