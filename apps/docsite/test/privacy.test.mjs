// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { URL } from 'node:url';

const repoRoot = new URL('../../../', import.meta.url);
const read = (relativePath) => fs.readFile(new URL(relativePath, repoRoot), 'utf8');

test('docsite source and shipped scripts contain no application analytics integration', async () => {
  for (const directory of ['apps/docsite/src/', 'apps/docsite/dist/']) {
    const root = new URL(directory, repoRoot);
    const files = await fs.readdir(root, { recursive: true });
    for (const file of files.filter((file) => /\.(?:[cm]?[jt]sx?|html)$/.test(file))) {
      const source = await fs.readFile(new URL(file.split(path.sep).join('/'), root), 'utf8');
      assert.doesNotMatch(
        source,
        /applicationinsights|telemetry-config\.json|trackDocsiteEvent|TELEMETRY_EVENTS|RouteTelemetry|clarity\.ms|data-clarity|analytics.session/i,
        `${directory}${file}`,
      );
    }
  }

  const manifest = JSON.parse(await read('apps/docsite/package.json'));
  assert.equal('@microsoft/applicationinsights-web' in manifest.dependencies, false);
  assert.doesNotMatch(
    await read('apps/docsite/server.js'),
    /APPLICATIONINSIGHTS|CLARITY_PROJECT_ID|COREAI_ENVIRONMENT|telemetry/i,
  );
});

test('Storybook usage telemetry remains disabled', async () => {
  assert.match(
    await read('apps/storybook/.storybook/main.ts'),
    /core:\s*\{\s*disableTelemetry:\s*true,\s*\}/,
  );
});

test('MCP host does not record request or authentication diagnostics', async () => {
  assert.doesNotMatch(
    await read('apps/storybook/host/server.mjs'),
    /MCP_AUTH_DIAGNOSTICS|authDiagnostics|logAuth|clientLabel|mcp-auth/,
  );
});

test('hosting preserves docsite Entra auth and public Storybook without monitoring resources', async () => {
  const source = await read('infra/main.bicep');
  const parameters = await read('infra/main.bicepparam');
  assert.doesNotMatch(
    source + parameters,
    /Microsoft\.Insights|Microsoft\.OperationalInsights|telemetry|clarity|ApplicationInsights|logAnalytics|COREAI_ENVIRONMENT/i,
  );
  assert.deepEqual(
    [...source.matchAll(/^resource (\w+) /gm)].map((match) => match[1]),
    ['appServicePlan', 'docsiteApp', 'docsiteAuth', 'storybookApp', 'storybookAuth'],
  );
  for (const setting of ['SCM_DO_BUILD_DURING_DEPLOYMENT', 'WEBSITE_AUTH_AAD_ALLOWED_TENANTS']) {
    assert.ok(source.includes(`name: '${setting}'`), setting);
  }
  assert.equal((source.match(/name: 'authsettingsV2'/g) ?? []).length, 2);
  assert.equal((source.match(/requireAuthentication: true/g) ?? []).length, 1);
  assert.equal((source.match(/requireAuthentication: false/g) ?? []).length, 1);
  assert.equal(
    (source.match(/unauthenticatedClientAction: 'RedirectToLoginPage'/g) ?? []).length,
    1,
  );
  assert.equal((source.match(/'response_type=id_token'/g) ?? []).length, 1);
  assert.match(source, /clientId: docsiteEntraClientId/);
  assert.doesNotMatch(
    source + parameters,
    /storybookEntraClientId|mcpEntra|MCP_(?:ENTRA|OAUTH)|oauth\//,
  );
  const storybookAuth = source.slice(source.indexOf('resource storybookAuth'));
  assert.match(storybookAuth, /platform:\s*\{\s*enabled: false/);
  assert.match(storybookAuth, /unauthenticatedClientAction: 'AllowAnonymous'/);
  assert.ok(source.includes("'/healthz'"));
});
