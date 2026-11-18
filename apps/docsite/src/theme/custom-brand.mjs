// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createCoreAIDarkTheme, createCoreAILightTheme } from '@coreai-ds/react-components';
import { createBrandRamp } from '../utils/BrandRamp.mjs';

export const DEFAULT_CUSTOM_COLOR = '#0F7C8C';

export function createCustomBrand(color) {
  const variants = createBrandRamp(color);
  const light = {
    ...createCoreAILightTheme(variants),
    colorBrandBackground: variants[70],
    colorBrandBackgroundHover: variants[60],
    colorBrandBackgroundPressed: variants[40],
    colorBrandBackgroundSelected: variants[50],
  };
  const dark = {
    ...createCoreAIDarkTheme(variants),
    colorBrandForeground1: variants[110],
    colorBrandForeground2: variants[120],
    colorBrandForegroundLink: variants[140],
    colorNeutralForeground2BrandHover: variants[120],
    colorNeutralForeground2BrandSelected: variants[120],
    colorNeutralForeground3BrandHover: variants[120],
    colorNeutralForeground3BrandSelected: variants[120],
  };
  return { light, dark, variants };
}
