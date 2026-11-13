// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createLegacyServer, destination, migrationNotice } from './dist/server.mjs';
import legacyTools from './tools.json' with { type: 'json' };

async function host(t, mcpEnabled = false) {
  const server = createLegacyServer({ mcpEnabled });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}

test('old website paths redirect to the fixed root without forwarding queries or request bodies', async (t) => {
  const origin = await host(t);
  for (const endpoint of ['/', '/old/page?next=https://example.com/&token=private', '/mcp']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await fetch(origin + endpoint, { method, redirect: 'manual' });
      assert.equal(response.status, 302);
      assert.equal(response.headers.get('location'), destination);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      if (method === 'HEAD') assert.equal(await response.text(), '');
    }
  }
  assert.equal((await fetch(origin, { method: 'POST', body: 'private' })).status, 405);
  const health = await (await fetch(origin + '/healthz')).json();
  assert.equal(health.mcpEnabled, false);
});

test('a real MCP client discovers the old schemas and receives a retirement result for every old call', async (t) => {
  const origin = await host(t, true);
  const client = new Client({ name: 'migration-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(origin + '/mcp')));
  try {
    const listing = await client.listTools();
    assert.deepEqual(
      listing.tools.map(({ name, inputSchema }) => ({ name, inputSchema })),
      legacyTools,
    );
    assert.ok(listing.tools.every((tool) => tool.description.startsWith('Retired')));
    for (const [name, args] of [
      ['docs-list', { withStoryIds: true }],
      ['docs-show', { id: 'components-button-button' }],
      ['docs-show-story', { storyId: 'components-button-button--default' }],
      ['docs-show-story', { componentId: 'components-button-button', storyName: 'Default' }],
    ]) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, true);
      assert.deepEqual(result.content, [{ type: 'text', text: migrationNotice }]);
    }
  } finally {
    await client.close();
  }
});

test('cached old calls still work without initialization and with an old session header', async (t) => {
  const origin = await host(t, true);
  const response = await fetch(origin + '/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Mcp-Session-Id': 'previous-server-session',
      'MCP-Protocol-Version': '2025-03-26',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'docs-list', arguments: {} },
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  const message = await response.json();
  assert.equal(message.error, undefined);
  assert.equal(message.result.isError, true);
  assert.equal(message.result.content[0].text, migrationNotice);
});

test('the legacy GET event stream stays on the MCP host rather than redirecting', async (t) => {
  const origin = await host(t, true);
  const controller = new AbortController();
  const response = await fetch(origin + '/mcp', { signal: controller.signal, redirect: 'manual' });
  try {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('location'), null);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    const first = await response.body.getReader().read();
    assert.match(new TextDecoder().decode(first.value), /connected/);
  } finally {
    controller.abort();
  }
});

test('malformed, oversized, and cross-origin MCP requests fail explicitly', async (t) => {
  const origin = await host(t, true);
  const post = (body, extra = {}) =>
    fetch(origin + '/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...extra,
      },
      body,
    });
  assert.equal((await post('{')).status, 400);
  assert.equal((await post('x'.repeat(128 * 1024))).status, 413);
  assert.equal((await post('{}', { Origin: 'https://example.com' })).status, 403);
});
