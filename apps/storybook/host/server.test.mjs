// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test, { after, before } from 'node:test';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-public-host-'));
await fs.copyFile(new URL('./server.mjs', import.meta.url), path.join(root, 'server.mjs'));
await fs.mkdir(path.join(root, 'storybook-static', 'manifests'), { recursive: true });
await fs.writeFile(path.join(root, 'storybook-static', 'index.html'), '<h1>Public Storybook</h1>');
await fs.writeFile(
  path.join(root, 'storybook-static', 'manifests', 'components.json'),
  '{"components":{}}',
);
const { server } = await import(pathToFileURL(path.join(root, 'server.mjs')));
let origin;
before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(root, { recursive: true, force: true });
});

test('static UI and manifests are public without redirects or challenges', async () => {
  for (const endpoint of ['/', '/manifests/components.json']) {
    const response = await fetch(`${origin}${endpoint}`, { redirect: 'manual' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('www-authenticate'), null);
    assert.equal(response.headers.get('location'), null);
  }
  const response = await fetch(origin);
  assert.match(await response.text(), /Public Storybook/);
});

test('OAuth routes and discovery no longer exist', async () => {
  for (const endpoint of [
    '/.well-known/oauth-protected-resource/mcp',
    '/.well-known/oauth-authorization-server',
    '/oauth/register',
    '/oauth/authorize',
    '/oauth/token',
  ]) {
    assert.equal((await fetch(`${origin}${endpoint}`)).status, 404);
  }
});

test('public MCP rejects oversized bodies before loading the handler', async () => {
  const response = await fetch(`${origin}/mcp`, {
    method: 'POST',
    body: 'x'.repeat(128 * 1024),
  });
  assert.equal(response.status, 413);
  assert.equal(response.headers.get('www-authenticate'), null);
});

test('static routes implement HEAD and reject unsupported methods', async () => {
  const head = await fetch(origin, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await fetch(origin, { method: 'POST' });
  assert.equal(post.status, 405);
});
