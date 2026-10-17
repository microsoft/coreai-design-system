// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createStoryInventory } from './story-inventory.mjs';

async function withSources(sources, callback) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-story-inventory-'));
  try {
    const files = {};
    for (const [name, source] of Object.entries(sources)) {
      const file = path.join(root, name);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, source);
      files[name] = file;
    }
    await callback(root, files);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('local overrides win, upstream aliases resolve, local-only variants and metadata survive', async () => {
  await withSources(
    {
      'upstream/index.stories.tsx': `
import { Accordion } from '@fluentui/react-components';
export { Default, Example as Controlled } from './leaf';
export default { title: 'Components/Accordion', component: Accordion, decorators: [upstreamDecorator] };
`,
      'upstream/leaf.tsx': `
import * as React from 'react';
import { Accordion } from '@fluentui/react-components';
export const Default = () => <Accordion />;
export const Example = () => <Accordion multiple />;
`,
      'local.stories.tsx': `
import { Accordion } from '@coreai-ds/react-components';
const unrelated = { title: 'Not the component title' };
/** Local default documentation. */
export const Default = { render: () => <Accordion /> };
Default.args = { collapsible: true };
export const LocalOnly = { render: () => <Accordion multiple /> };
export const helper = 1;
const meta = {
 title: 'Components/Accordion', component: Accordion,
 subcomponents: { AccordionItem }, parameters: { design: designLink },
 includeStories: ['Default', 'LocalOnly'],
};
export default meta;
`,
    },
    async (root, files) => {
      const options = {
        root,
        localFiles: [files['local.stories.tsx']],
        fluentFiles: [files['upstream/index.stories.tsx']],
      };
      const inventory = await createStoryInventory(options);
      assert.deepEqual(await createStoryInventory(options), inventory);
      const [component] = inventory.components;
      assert.equal(component.title, 'Components/Accordion');
      assert.equal(component.stories.length, 3);
      const local = component.stories.find((story) => story.exportName === 'Default');
      assert.equal(local.origin, 'local');
      assert.equal(local.overridden.origin, 'fluent');
      assert.equal(local.overridden.implementationFile, 'upstream/leaf.tsx');
      assert.ok(local.annotations[0].includes('Default.args'));
      assert.match(local.documentation[0], /Local default documentation/);
      const controlled = component.stories.find((story) => story.exportName === 'Controlled');
      assert.equal(controlled.implementationExport, 'Example');
      assert.equal(controlled.implementationFile, 'upstream/leaf.tsx');
      assert.ok(controlled.dependencies.some((entry) => entry.specifier === 'react'));
      assert.ok(component.stories.some((story) => story.exportName === 'LocalOnly'));
      const localSource = component.sources.find((source) => source.origin === 'local');
      assert.equal(localSource.metadata.component, 'Accordion');
      assert.match(localSource.metadata.subcomponents, /AccordionItem/);
      assert.match(localSource.metadata.parameters, /designLink/);
      assert.match(component.sources[0].metadata.decorators, /upstreamDecorator/);
    },
  );
});

test('same-origin duplicate story IDs fail with both source paths', async () => {
  await withSources(
    {
      'first.stories.tsx': `export default { title: 'Components/Test' }; export const Default = () => null;`,
      'second.stories.tsx': `export default { title: 'Components/Test' }; export const Default = () => null;`,
    },
    async (root, files) => {
      for (const origin of ['local', 'fluent']) {
        await assert.rejects(
          createStoryInventory({
            root,
            localFiles: origin === 'local' ? Object.values(files) : [],
            fluentFiles: origin === 'fluent' ? Object.values(files) : [],
          }),
          /Conflicting (local|fluent) story components-test--default: first\.stories\.tsx and second\.stories\.tsx/,
        );
      }
    },
  );
});

test('explicit meta IDs and Storybook story IDs are preserved', async () => {
  await withSources(
    {
      'custom.stories.tsx': `
export default { title: 'Components/Custom', id: 'stable-component' };
export const Default = { name: 'Human label', parameters: { __id: 'stable-story' }, render: () => null };
`,
    },
    async (root, files) => {
      const inventory = await createStoryInventory({
        root,
        localFiles: Object.values(files),
        fluentFiles: [],
      });
      assert.equal(inventory.components[0].id, 'stable-component');
      assert.equal(inventory.components[0].stories[0].id, 'stable-story');
      assert.equal(inventory.components[0].stories[0].name, 'Human label');
    },
  );
});

test('display names preserve explicit labels and normalize re-export aliases', async () => {
  await withSources(
    {
      'upstream/index.stories.tsx': `
export default { title: 'Components/Test' };
export { WithLongText, WithLongText as AliasedExample, ObjectName, FunctionName } from './leaf';
`,
      'upstream/leaf.tsx': `
export const WithLongText = () => null;
export const ObjectName = { name: 'ObjectName', render: () => null };
export const FunctionName = () => null;
FunctionName.storyName = 'FunctionName';
`,
      'local.stories.tsx': `
export default { title: 'Components/Local' };
export const LocalExample = { name: 'Local label!', render: () => null };
`,
    },
    async (root, files) => {
      const inventory = await createStoryInventory({
        root,
        localFiles: [files['local.stories.tsx']],
        fluentFiles: [files['upstream/index.stories.tsx']],
      });
      const stories = inventory.components.flatMap((component) => component.stories);
      for (const [exportName, name] of [
        ['WithLongText', 'With Long Text'],
        ['AliasedExample', 'Aliased Example'],
        ['ObjectName', 'ObjectName'],
        ['FunctionName', 'FunctionName'],
        ['LocalExample', 'Local label!'],
      ]) {
        assert.equal(stories.find((story) => story.exportName === exportName).name, name);
      }
    },
  );
});

test('missing source modules and missing explicit titles fail visibly', async () => {
  await withSources(
    {
      'missing.stories.tsx': `export default { title: 'Components/Test' }; export { Default } from './absent';`,
      'untitled.stories.tsx': `export default {}; export const Default = () => null;`,
    },
    async (root, files) => {
      await assert.rejects(
        createStoryInventory({ root, localFiles: [], fluentFiles: [files['missing.stories.tsx']] }),
        /Cannot resolve story implementation/,
      );
      await assert.rejects(
        createStoryInventory({
          root,
          localFiles: [files['untitled.stories.tsx']],
          fluentFiles: [],
        }),
        /explicit component title/,
      );
    },
  );
});

test('colliding component titles and cross-component story IDs fail instead of overwriting', async () => {
  await withSources(
    {
      'one.stories.tsx': `export default { title: 'Components/Some Name' }; export const First = () => null;`,
      'two.stories.tsx': `export default { title: 'Components/Some-Name' }; export const Second = () => null;`,
      'three.stories.tsx': `export default { title: 'Components/Other' }; export const Third = { parameters: { __id: 'components-some-name--first' }, render: () => null };`,
    },
    async (root, files) => {
      await assert.rejects(
        createStoryInventory({
          root,
          fluentFiles: [],
          localFiles: [files['one.stories.tsx'], files['two.stories.tsx']],
        }),
        /Component ID collision/,
      );
      await assert.rejects(
        createStoryInventory({
          root,
          fluentFiles: [],
          localFiles: [files['one.stories.tsx'], files['three.stories.tsx']],
        }),
        /Story ID collision across components/,
      );
    },
  );
});

test('real catalog preserves every local story and expected upstream variants without templates', async () => {
  const inventory = await createStoryInventory();
  const accordion = inventory.components.find(
    (component) => component.id === 'components-accordion',
  );
  assert.equal(accordion.stories.find((story) => story.exportName === 'Default').origin, 'local');
  const controlled = accordion.stories.find((story) => story.exportName === 'Controlled');
  assert.equal(controlled.origin, 'fluent');
  assert.ok(controlled.implementationFile.endsWith('/AccordionControlled.stories.tsx'));
  const stories = inventory.components.flatMap((component) => component.stories);
  assert.equal(new Set(stories.map((story) => story.id)).size, stories.length);
  assert.equal(stories.filter((story) => story.origin === 'local').length, 147);
  for (const name of ['AccordionCard', 'ContentAlignmentDev']) {
    assert.equal(accordion.stories.find((story) => story.exportName === name)?.origin, 'local');
  }
  assert.equal(stories.filter((story) => story.origin === 'fluent').length, 545);
  assert.ok(stories.some((story) => story.id === 'components-popover--non-interactive-content'));
  assert.ok(stories.some((story) => story.id === 'components-tooltip--overflow-hidden'));
  assert.equal(stories.filter((story) => story.overridden).length, 70);
  assert.equal(inventory.components.length, 76);
  const counterBadge = inventory.components.find(
    (component) => component.id === 'components-badge-counter-badge',
  );
  assert.equal(
    counterBadge.stories.find((story) => story.exportName === 'Default').origin,
    'local',
  );
  assert.ok(counterBadge.stories.some((story) => story.exportName === 'Appearance'));
  assert.equal(
    inventory.components.filter((component) =>
      component.sources.some((source) => source.metadata.component === 'CounterBadge'),
    ).length,
    1,
  );
  assert.ok(stories.every((story) => !story.sourceFile.includes('/templates/')));
  assert.ok(stories.every((story) => !story.sourceFile.includes('/experiments/')));
  assert.ok(!inventory.scope.fluentPackages.includes('react-divider'));
  const root = fileURLToPath(new URL('../', import.meta.url));
  for (const story of stories) {
    await fs.access(path.join(root, story.implementationFile));
  }
});
