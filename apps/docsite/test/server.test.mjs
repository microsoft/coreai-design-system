// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import process from 'node:process';
import test from 'node:test';
import { clearTimeout, setTimeout } from 'node:timers';
import { URL } from 'node:url';

test('production server serves content and navigation', async (t) => {
  const port = 19000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  t.after(() => child.kill('SIGTERM'));

  let startupTimer;
  try {
    await Promise.race([
      once(child.stdout, 'data'),
      new Promise((_, reject) => {
        startupTimer = setTimeout(
          () => reject(new Error('Docsite server did not start in time.')),
          5000,
        );
      }),
    ]);
  } finally {
    clearTimeout(startupTimer);
  }

  for (const route of ['/', '/colors', '/colors/', '/accordion/']) {
    const response = await globalThis.fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/, route);
    assert.match(await response.text(), /id="root"/, route);
  }
  const missing = await globalThis.fetch(`http://127.0.0.1:${port}/nonexistent-page/`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /id="root"/);

  const healthResponse = await globalThis.fetch(`http://127.0.0.1:${port}/healthz`);
  assert.equal(healthResponse.status, 200);
  assert.equal(healthResponse.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });
  const healthHead = await globalThis.fetch(`http://127.0.0.1:${port}/healthz`, {
    method: 'HEAD',
  });
  assert.equal(healthHead.status, 200);
  assert.equal(await healthHead.text(), '');
  const healthPost = await globalThis.fetch(`http://127.0.0.1:${port}/healthz`, {
    method: 'POST',
  });
  assert.equal(healthPost.status, 405);
  assert.equal(healthPost.headers.get('allow'), 'GET, HEAD');

  const markdownResponse = await globalThis.fetch(
    `http://127.0.0.1:${port}/components/accordion.md`,
  );
  assert.equal(markdownResponse.status, 200);
  assert.equal(markdownResponse.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(markdownResponse.headers.get('cache-control'), 'no-cache');
  assert.match(await markdownResponse.text(), /^# Accordion/m);

  const llmsResponse = await globalThis.fetch(`http://127.0.0.1:${port}/llms.txt`);
  assert.equal(llmsResponse.status, 200);
  assert.equal(llmsResponse.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(llmsResponse.headers.get('cache-control'), 'no-cache');

  const redirects = new Map([
    ['/guidance/', '/package/'],
    ['/accordions/', '/accordion/'],
    ['/foundational-skill/', '/coreai-skill/'],
    ['/agent-skill/', '/coreai-skill/'],
    ['/design-md/', '/coreai-skill/'],
  ]);
  for (const [source, target] of redirects) {
    const redirectResponse = await globalThis.fetch(
      `http://127.0.0.1:${port}${source}?source=legacy`,
      { redirect: 'manual' },
    );
    assert.equal(redirectResponse.status, 308, source);
    assert.equal(redirectResponse.headers.get('location'), `${target}?source=legacy`, source);
    assert.equal(redirectResponse.headers.get('cache-control'), 'no-cache', source);
  }
});
