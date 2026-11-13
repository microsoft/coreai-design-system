// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readStoredValue, writeStoredValue, fragmentId } from '../src/BrowserState.mjs';

test('blocked browser storage reports the failure without preventing documentation startup', (t) => {
  const warning = t.mock.method(globalThis.console, 'warn', () => {});
  globalThis.docsiteTestStorage = {
    getItem() {
      throw new globalThis.DOMException('Storage is blocked.', 'SecurityError');
    },
    setItem() {
      throw new globalThis.DOMException('Storage is blocked.', 'SecurityError');
    },
  };
  t.after(() => {
    delete globalThis.docsiteTestStorage;
  });
  assert.equal(readStoredValue('docsiteTestStorage', 'theme'), null);
  assert.doesNotThrow(() => writeStoredValue('docsiteTestStorage', 'theme', 'dark'));
  assert.equal(warning.mock.calls.length, 2);
});

test('malformed fragments report the problem instead of throwing during page enhancement', (t) => {
  const warning = t.mock.method(globalThis.console, 'warn', () => {});
  assert.equal(fragmentId('#%'), undefined);
  assert.equal(fragmentId('#%E0%A4%A'), undefined);
  assert.equal(warning.mock.calls.length, 2);
  assert.equal(fragmentId('#guidance-type-scale'), 'guidance-type-scale');
});
