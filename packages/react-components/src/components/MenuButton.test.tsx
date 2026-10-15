// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { MenuButton } from './MenuButton.js';

afterEach(cleanup);

test('defaults to a circular shape', async () => {
  const screen = await renderCoreAIComponent(<MenuButton>Default</MenuButton>);

  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Default' }).element()).borderRadius,
  ).toBe('10000px');
});
