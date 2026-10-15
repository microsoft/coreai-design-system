// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { SpinButton } from './SpinButton.js';

afterEach(cleanup);

const getSpinButton = () => document.querySelector<HTMLElement>('.fui-SpinButton');

test('uses the filled-darker appearance by default and allows an explicit override', async () => {
  await renderCoreAIComponent(<SpinButton aria-label="Default spin button" />);
  expect(getSpinButton()).not.toBeNull();
  const defaultBackground = getComputedStyle(getSpinButton()!).backgroundColor;

  await cleanup();
  await renderCoreAIComponent(
    <SpinButton aria-label="Explicit default spin button" appearance="filled-darker" />,
  );
  expect(getComputedStyle(getSpinButton()!).backgroundColor).toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<SpinButton aria-label="Outline spin button" appearance="outline" />);
  const outlineBackground = getComputedStyle(getSpinButton()!).backgroundColor;
  expect(outlineBackground).not.toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<SpinButton aria-label="Stock spin button" />, {
    providerProps: { withComponentDefaults: false },
  });
  expect(getComputedStyle(getSpinButton()!).backgroundColor).toBe(outlineBackground);
});
