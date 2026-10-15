// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { createStorybookMcpHandler } from '@storybook/mcp';
import { createStoryInventory } from './story-inventory.mjs';

const root = new URL('../storybook-static/', import.meta.url);
const liveUrl = process.env.MCP_TEST_URL;
const handler = await createStorybookMcpHandler({
  manifestProvider: async (_request, manifestPath) =>
    fs.readFile(new URL(manifestPath, root), 'utf8'),
});
let requestId = 2000;

test('generated real component IDs publish selected local and Fluent stories with source-complete snippets', async () => {
  const inventory = await createStoryInventory();
  const listing = await callTool('docs-list', { withStoryIds: true });
  for (const id of [
    'components-accordion',
    'components-button-button',
    'components-datagrid',
    'components-combobox',
    'components-dropdown',
  ]) {
    const component = inventory.components.find((item) => item.id === id);
    assert.ok(listing.includes(`(${id})`));
    const docs = await callTool('docs-show', { id });
    assert.match(docs, /## Props/);
    for (const story of component.stories) {
      assert.ok(listing.includes(`(${story.id})`), `Missing selected story ${story.id}`);
    }
    for (const name of ['Default', 'Controlled']) {
      const story = component.stories.find((item) => item.exportName === name);
      if (!story) continue;
      const example = await callTool('docs-show-story', { storyId: story.id });
      assert.ok(
        example.includes(
          story.origin === 'local' ? 'Source: local CoreAI override' : 'Source: Fluent upstream',
        ),
      );
      assert.ok(example.includes('@coreai-ds/react-components'));
      assert.doesNotMatch(example, /No code snippet|from ['"]@fluentui\/react-components['"]/);
      if (name === 'Controlled' && ['components-combobox', 'components-dropdown'].includes(id)) {
        assert.match(example, /Partial<Omit<(Combobox|Dropdown)Props, "label" \| "dynamicWidth">>/);
      }
    }
  }
  const accordion = await callTool('docs-show-story', { storyId: 'components-accordion--default' });
  assert.match(accordion, /Accordion Panel 3/);
  const button = await callTool('docs-show-story', {
    storyId: 'components-button-button--appearance',
  });
  assert.match(button, /makeStyles/);
  assert.match(button, /bundleIcon/);
  const combobox = await callTool('docs-show-story', {
    storyId: 'components-combobox--inline-label',
  });
  assert.match(combobox, /Source: local CoreAI override/);
});

test('component docs survive minimal local overrides and later Dev files', async () => {
  const listing = await callTool('docs-list', { withStoryIds: false });
  assert.match(listing, /- Card \(components-card-card\):/);
  assert.match(listing, /- TabList \(components-tablist\):/);
  const card = await callTool('docs-show', { id: 'components-card-card' });
  const tabList = await callTool('docs-show', { id: 'components-tablist' });
  for (const docs of [card, tabList]) {
    assert.match(docs, /ID: [^\n]+\n\n(?!## Stories)[^\n]+/);
  }
  for (const [id, children] of [
    ['components-combobox', ['Option', 'Listbox']],
    ['components-dropdown', ['Option', 'Listbox']],
    ['components-tablist', ['Tab']],
  ]) {
    const docs = id === 'components-tablist' ? tabList : await callTool('docs-show', { id });
    assert.match(docs, /## Subcomponents/);
    for (const child of children) {
      assert.ok(docs.includes(`### ${child}`), `${id} must publish ${child} props`);
    }
  }
});

test('MCP accepts the same story display names as the UI', async () => {
  const docs = await callTool('docs-show-story', {
    componentId: 'components-button-button',
    storyName: 'With Long Text',
  });
  assert.equal(
    docs,
    await callTool('docs-show-story', {
      storyId: 'components-button-button--with-long-text',
    }),
  );
  assert.match(docs, /With Long Text/);
  const aliased = await callTool('docs-show-story', {
    componentId: 'components-tree',
    storyName: 'Flat Tree',
  });
  assert.equal(
    aliased,
    await callTool('docs-show-story', {
      storyId: 'components-tree--flat-tree',
    }),
  );
});

test('CounterBadge publishes one combined catalog with the local Default', async () => {
  const listing = await callTool('docs-list', { withStoryIds: true });
  assert.equal((listing.match(/^- CounterBadge \(/gm) ?? []).length, 1);
  assert.match(listing, /components-badge-counter-badge--appearance/);
  assert.doesNotMatch(listing, /components-badge-counterbadge/);
  const docs = await callTool('docs-show-story', {
    storyId: 'components-badge-counter-badge--default',
  });
  assert.match(docs, /Source: local CoreAI override/);
  assert.match(docs, /Default\.args = \{\s*count: 5/s);
});

async function callTool(name, args) {
  const id = requestId++;
  const request = new Request(liveUrl ?? 'http://localhost/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    signal: AbortSignal.timeout(180000),
  });
  const response = await (liveUrl ? fetch(request) : handler(request));
  assert.equal(response.status, 200);
  const body = await response.text();
  const messages = response.headers.get('content-type')?.includes('text/event-stream')
    ? body
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => JSON.parse(line.slice(5)))
    : [JSON.parse(body)];
  const message = messages.find((entry) => entry.id === id);
  assert.ok(message, `Missing response for ${name}`);
  assert.equal(message.error, undefined, `Protocol error for ${name}`);
  assert.notEqual(message.result?.isError, true, `Tool error for ${name}`);
  assert.ok(Array.isArray(message.result?.content));
  return message.result.content
    .filter((entry) => entry.type === 'text')
    .map((entry) => entry.text)
    .join('\n');
}

test('normal discovery contains no temporary experiment stories or docs', async () => {
  const listing = await callTool('docs-list', { withStoryIds: true });
  assert.doesNotMatch(listing, /experiments-mcp-|Experiments\/MCP/);
  const index = liveUrl
    ? await fetch(new URL('/index.json', liveUrl), { signal: AbortSignal.timeout(30000) }).then(
        async (response) => {
          assert.equal(response.status, 200);
          return response.json();
        },
      )
    : JSON.parse(await fs.readFile(new URL('index.json', root), 'utf8'));
  assert.ok(
    Object.values(index.entries).every(
      (entry) =>
        !entry.id.startsWith('experiments-') && !entry.importPath?.includes('/experiments/'),
    ),
  );
});
