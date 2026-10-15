// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { checkFile } from './check-public-source.mjs';

test('rejects restricted assets and internal configuration paths', () => {
  for (const filename of [
    'packages/example/fonts/Aptos.ttf',
    'public/fonts/Aptos.woff2',
    'azure-pipelines/deploy.yml',
    '.github/compliance/inventory.yml',
    'es-metadata.yml',
    '.env.local',
    'deploy/private.pem',
  ]) {
    assert.ok(checkFile(filename, '').length > 0, filename);
  }
});

test('identifies legacy and internal URLs without exposing their contents', () => {
  for (const host of [
    ['dev', 'azure', 'com'].join('.'),
    ['teams', 'microsoft', 'com/l/channel/private'].join('.'),
    ['myaccount', 'microsoft', 'com/groups/private'].join('.'),
    ['github', 'com/coreai-microsoft/coreai-ds'].join('.'),
  ]) {
    const content = `https://${host}`;
    const findings = checkFile('README.md', content);
    assert.ok(findings.length > 0);
    assert.ok(findings.every((finding) => !finding.includes(content)));
  }
});

test('rejects credential signatures but permits environment placeholders', () => {
  const token = ['npm', 'a'.repeat(36)].join('_');
  assert.ok(checkFile('config.json', token).includes('npm credential'));
  assert.ok(checkFile('.npmrc', `_authToken=${token}`).includes('registry credential assignment'));
  assert.deepEqual(checkFile('.npmrc', '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}'), []);
  assert.ok(
    checkFile('config.txt', ['-----BEGIN', 'PRIVATE KEY-----'].join(' ')).includes('private key'),
  );
});

test('allows retained Figma design links without allowing credentials', () => {
  for (const kind of ['design', 'file', 'proto', 'embed']) {
    assert.deepEqual(checkFile('README.md', `https://www.figma.com/${kind}/example`), []);
  }
  const token = ['ghp', 'a'.repeat(36)].join('_');
  assert.ok(
    checkFile('README.md', `https://www.figma.com/design/example?token=${token}`).includes(
      'GitHub credential',
    ),
  );
});

test('allows intended public targets, hosted auth, font docs and local CSS', () => {
  assert.deepEqual(
    checkFile(
      'README.md',
      `
https://github.com/microsoft/coreai-design-system
https://registry.npmjs.org/
https://coreai-ds-storybook.azurewebsites.net/mcp
https://www.microsoft.com/en-us/download/details.aspx?id=106087
Aptos remains preferred; review the license before use.
`,
    ),
    [],
  );
  assert.deepEqual(checkFile('fonts/fonts.css', 'src: local("Aptos");'), []);
});
