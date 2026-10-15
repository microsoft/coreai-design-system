// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import test, { after, before } from 'node:test';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-production-host-'));
await fs.copyFile(new URL('./server.mjs', import.meta.url), path.join(root, 'server.mjs'));
await fs.cp(new URL('../storybook-static/', import.meta.url), path.join(root, 'storybook-static'), {
  recursive: true,
});
const require = createRequire(import.meta.url);
const dependencyRoot = path.resolve(
  path.dirname(require.resolve('@storybook/mcp/package.json')),
  '..',
  '..',
);
await fs.symlink(
  dependencyRoot,
  path.join(root, 'node_modules'),
  process.platform === 'win32' ? 'junction' : 'dir',
);
const { server } = await import(pathToFileURL(path.join(root, 'server.mjs')));
let origin;
before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.unlink(path.join(root, 'node_modules'));
  await fs.rm(root, { recursive: true, force: true });
});

async function callTool(name, args) {
  const response = await fetch(`${origin}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('www-authenticate'), null);
  const body = await response.text();
  const message = response.headers.get('content-type').includes('text/event-stream')
    ? JSON.parse(
        body
          .split(/\r?\n/)
          .find((line) => line.startsWith('data:'))
          .slice(5),
      )
    : JSON.parse(body);
  assert.equal(message.error, undefined);
  assert.notEqual(message.result.isError, true);
  return message.result.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n');
}

test('standalone build serves public UI, snapshots, and real docs tools without the source checkout', async () => {
  for (const endpoint of ['/', '/index.json', '/manifests/components.json']) {
    const response = await fetch(`${origin}${endpoint}`, { redirect: 'manual' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('www-authenticate'), null);
  }
  const index = await (await fetch(`${origin}/index.json`)).json();
  assert.ok(Object.values(index.entries).every((entry) => !entry.id.startsWith('experiments-')));
  const listing = await callTool('docs-list', { withStoryIds: true });
  assert.match(listing, /components-accordion--controlled/);
  assert.match(listing, /components-badge-counter-badge--appearance/);
  assert.doesNotMatch(listing, /experiments-|__CoreAI_|components-badge-counterbadge/);
  const component = await callTool('docs-show', { id: 'components-combobox' });
  assert.match(component, /## Props/);
  assert.match(component, /## Subcomponents/);
  const story = await callTool('docs-show-story', {
    componentId: 'components-button-button',
    storyName: 'With Long Text',
  });
  assert.match(story, /@coreai-ds\/react-components/);
  assert.match(story, /makeStyles/);
  assert.equal((await fetch(`${origin}/.well-known/oauth-authorization-server`)).status, 404);
});
