// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { describe, expect, it } from 'vitest';

import {
  coreaiBrandVariants,
  coreaiDarkTheme,
  coreaiLightTheme,
  createCoreAIDarkTheme,
  createCoreAILightTheme,
} from './theme.js';

const expectedBaseFontFamily =
  'Aptos, Inter, Helvetica, Arial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

describe('CoreAI theme font families', () => {
  it.each([
    coreaiLightTheme,
    coreaiDarkTheme,
    createCoreAILightTheme(coreaiBrandVariants),
    createCoreAIDarkTheme(coreaiBrandVariants),
  ])('uses Inter as the fallback for proportional and numeric text', (theme) => {
    expect(theme.fontFamilyBase).toBe(expectedBaseFontFamily);
    expect(theme.fontFamilyNumeric).toBe(expectedBaseFontFamily);
    expect(theme.fontFamilyMonospace).toBe('"Aptos Mono", Menlo, Monaco, Consolas, monospace');
  });
});
