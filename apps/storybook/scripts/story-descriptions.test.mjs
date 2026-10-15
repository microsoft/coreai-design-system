// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readStoryDescriptions, descriptionComment } from './story-descriptions.mjs';
import { appRoot } from './generate-component-stories.mjs';
import { publicMarkdown } from './public-markdown.mjs';

test('local component and story JSDoc and upstream parameter descriptions are preserved', async () => {
  const component = await readStoryDescriptions(
    path.join(appRoot, 'src', 'stories', 'components', 'Accordion.stories.tsx'),
  );
  assert.match(component.description, /toggle the display of content/);
  assert.match(component.summary, /Vertically stacked/);
  const local = await readStoryDescriptions(
    path.join(appRoot, 'src', 'stories', 'components', 'Button.stories.tsx'),
    'Shape',
  );
  assert.match(local.description, /each available button shape/);
  const upstream = await readStoryDescriptions(
    path.join(
      appRoot,
      'fluent-stories',
      'packages',
      'react-components',
      'react-accordion',
      'stories',
      'src',
      'Accordion',
      'AccordionCollapsible.stories.tsx',
    ),
    'Collapsible',
  );
  assert.match(upstream.description, /multiple panels collapsed/);
  const markdown = await readStoryDescriptions(
    path.join(
      appRoot,
      'fluent-stories',
      'packages',
      'react-components',
      'react-accordion',
      'stories',
      'src',
      'Accordion',
      'index.stories.tsx',
    ),
  );
  assert.match(markdown.description, /expanding or collapsing sections/);
});

test('imported Fluent Markdown uses the same public cleanup as Vite, without changing local docs', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-public-markdown-'));
  try {
    const content =
      '[Internal task](https://example.visualstudio.com/project/_workitems/edit/123) ' +
      `[Other task](https://${['dev', 'azure', 'com'].join('.')}/example/project/_workitems/edit/456) ` +
      '[Public docs](https://example.com/docs)';
    for (const directory of ['fluent-stories', 'local']) {
      const dir = path.join(root, directory);
      await fs.mkdir(dir);
      const markdown = path.join(dir, 'description.md');
      await fs.writeFile(markdown, content);
      const story = path.join(dir, 'index.stories.tsx');
      await fs.writeFile(
        story,
        `
import description from './description.md';
export default { title: 'Test', parameters: { docs: { description: { component: description } } } };
`,
      );
      const result = await readStoryDescriptions(story);
      assert.equal(result.description, publicMarkdown(content, markdown));
      assert.equal(result.description, publicMarkdown(content, markdown.replaceAll('\\', '/')));
      if (directory === 'fluent-stories') {
        assert.doesNotMatch(result.description, /visualstudio\.com|dev\.azure\.com/);
        assert.match(result.description, /Internal task Other task/);
        assert.match(result.description, /\[Public docs\]\(https:\/\/example\.com\/docs\)/);
      } else {
        assert.equal(result.description, content);
      }
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('literal parameters, concatenated strings, meta JSDoc, summaries and safe comment output', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-descriptions-'));
  try {
    const file = path.join(root, 'Example.stories.tsx');
    await fs.writeFile(
      file,
      `
/** Component text.
 * @summary Compact component.
 */
const meta = { title: 'Test' };
export default meta;
export const Literal = { render: () => null, parameters: { docs: { description: { story: 'first ' + 'second' } } } };
/** Story text.
 * @summary Compact story.
 */
export const Documented = () => null;
Documented.parameters = { docs: { description: { story: 'parameter fallback' } } };
`,
    );
    assert.deepEqual(await readStoryDescriptions(file), {
      description: 'Component text.',
      summary: 'Compact component.',
    });
    assert.equal((await readStoryDescriptions(file, 'Literal')).description, 'first second');
    assert.deepEqual(await readStoryDescriptions(file, 'Documented'), {
      description: 'Story text.',
      summary: 'Compact story.',
    });
    assert.ok(!descriptionComment({ description: 'A */ B' }).includes('A */'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
