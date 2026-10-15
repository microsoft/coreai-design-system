// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { SplitButton } from './SplitButton.js';

afterEach(cleanup);

const getPrimaryActionRadius = () => {
  const button = document.querySelector<HTMLElement>('.fui-SplitButton__primaryActionButton');

  expect(button).not.toBeNull();
  return getComputedStyle(button!).borderTopLeftRadius;
};

test('defaults to a circular shape', async () => {
  await renderCoreAIComponent(<SplitButton>Default</SplitButton>);

  expect(getPrimaryActionRadius()).toBe('10000px');
});
