// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Select } from './Select.js';

afterEach(cleanup);

const getSelect = () => document.querySelector<HTMLElement>('.fui-Select__select');

test('uses the filled-darker appearance by default and allows an explicit override', async () => {
  await renderCoreAIComponent(<Select aria-label="Default select" />);
  expect(getSelect()).not.toBeNull();
  const defaultBackground = getComputedStyle(getSelect()!).backgroundColor;

  await cleanup();
  await renderCoreAIComponent(
    <Select aria-label="Explicit default select" appearance="filled-darker" />,
  );
  expect(getSelect()).not.toBeNull();
  expect(getComputedStyle(getSelect()!).backgroundColor).toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<Select aria-label="Outline select" appearance="outline" />);
  expect(getSelect()).not.toBeNull();
  const outlineBackground = getComputedStyle(getSelect()!).backgroundColor;
  expect(outlineBackground).not.toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<Select aria-label="Stock select" />, {
    providerProps: { withComponentDefaults: false },
  });
  expect(getSelect()).not.toBeNull();
  expect(getComputedStyle(getSelect()!).backgroundColor).toBe(outlineBackground);
});
