// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Button } from './Button.js';

afterEach(cleanup);

test('defaults to a circular shape', async () => {
  const screen = await renderCoreAIComponent(<Button>Default</Button>);

  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Default' }).element()).borderRadius,
  ).toBe('10000px');
});

test('allows an explicit shape override', async () => {
  const screen = await renderCoreAIComponent(<Button shape="square">Square</Button>);

  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Square' }).element()).borderRadius,
  ).toBe('0px');
});

test('uses the Fluent default shape when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(<Button>Default</Button>, {
    providerProps: { withComponentDefaults: false },
  });

  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Default' }).element()).borderRadius,
  ).toBe('4px');
});
