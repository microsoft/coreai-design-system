// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { assertFluentStoryVersion } from './fluent-story-version.mjs';

test('accepts only an exact installed and upstream package version match', () => {
  assert.doesNotThrow(() => assertFluentStoryVersion('9.74.9', '9.74.9', '9.74.9'));
  assert.throws(
    () => assertFluentStoryVersion('9.74.9', '9.74.10', '9.74.9'),
    /pinned 9\.74\.9, installed 9\.74\.10, source 9\.74\.9/,
  );
  assert.throws(() => assertFluentStoryVersion('9.74.9', '9.74.9', '9.74.2'), /source 9\.74\.2/);
});
