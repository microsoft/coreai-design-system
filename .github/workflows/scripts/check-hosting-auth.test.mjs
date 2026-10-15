// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { validateHostingAuth } from './check-hosting-auth.mjs';

const docsite = {
  platform: { enabled: true },
  globalValidation: { requireAuthentication: true },
  identityProviders: {
    azureActiveDirectory: { enabled: true, registration: { clientId: 'docsite' } },
  },
};
const storybook = {
  platform: { enabled: false },
  globalValidation: { requireAuthentication: false },
};
test('requires public Storybook while preserving docsite authentication', () => {
  assert.doesNotThrow(() => validateHostingAuth(docsite, storybook, []));
  assert.throws(() => validateHostingAuth(docsite, {}, []), /Storybook/);
  assert.throws(() => validateHostingAuth({}, storybook, []), /docsite/);
  assert.throws(
    () => validateHostingAuth(docsite, { ...storybook, platform: { enabled: true } }, []),
    /Storybook/,
  );
  assert.throws(
    () =>
      validateHostingAuth(
        docsite,
        { ...storybook, globalValidation: { requireAuthentication: true } },
        [],
      ),
    /anonymous/,
  );
  for (const name of ['MCP_ENTRA_TENANT_ID', 'MCP_OAUTH_CLIENT_ID', 'MCP_AUTH_ENABLED']) {
    assert.throws(
      () => validateHostingAuth(docsite, storybook, [{ name, value: 'unused' }]),
      /retired/,
    );
  }
});
