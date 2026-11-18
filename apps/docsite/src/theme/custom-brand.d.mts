// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { BrandVariants, CoreAITheme } from '@coreai-ds/react-components';

export const DEFAULT_CUSTOM_COLOR: string;
export function createCustomBrand(color: string): {
  light: CoreAITheme;
  dark: CoreAITheme;
  variants: BrandVariants;
};
