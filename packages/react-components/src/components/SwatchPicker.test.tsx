// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { ColorSwatch } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { SwatchPicker } from './SwatchPicker.js';

afterEach(cleanup);

const getSwatch = () => document.querySelector<HTMLElement>('.fui-ColorSwatch');
const swatchPicker = (shape?: 'rounded' | 'square') => (
  <SwatchPicker aria-label="Colors" {...(shape ? { shape } : {})}>
    <ColorSwatch color="#ff0000" value="red" aria-label="Red" />
  </SwatchPicker>
);

test('uses the rounded shape by default and allows an explicit override', async () => {
  await renderCoreAIComponent(swatchPicker());
  expect(getSwatch()).not.toBeNull();
  const defaultRadius = getComputedStyle(getSwatch()!).borderRadius;

  await cleanup();
  await renderCoreAIComponent(swatchPicker('rounded'));
  expect(getComputedStyle(getSwatch()!).borderRadius).toBe(defaultRadius);

  await cleanup();
  await renderCoreAIComponent(swatchPicker('square'));
  const squareRadius = getComputedStyle(getSwatch()!).borderRadius;
  expect(squareRadius).not.toBe(defaultRadius);

  await cleanup();
  await renderCoreAIComponent(swatchPicker(), {
    providerProps: { withComponentDefaults: false },
  });
  expect(getComputedStyle(getSwatch()!).borderRadius).toBe(squareRadius);
});
