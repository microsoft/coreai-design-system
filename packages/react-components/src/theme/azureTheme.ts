// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { BrandVariants, ColorTokens, Theme } from '@fluentui/react-components';

import { createCoreAIDarkTheme, createCoreAILightTheme, type CoreAITokens } from './theme.js';

export type AzureTheme = Theme & CoreAITokens;

/**
 * Azure / Coherence brand ramp — sourced directly from:
 * https://coherence-ftekb0dcfpcjb3gv.b02.azurefd.net/cdn/latest/themes/cui/theme.css
 */
export const azureBrandVariants: BrandVariants = {
  10: '#061724',
  20: '#082338',
  30: '#0a2e4a',
  40: '#0c3b5e',
  50: '#0e4775',
  60: '#0f548c',
  70: '#115ea3',
  80: '#0f6cbd',
  90: '#2886de',
  100: '#479ef5',
  110: '#62abf5',
  120: '#77b7f7',
  130: '#96c6fa',
  140: '#b4d6fa',
  150: '#cfe4fa',
  160: '#ebf3fc',
};

/**
 * Light-theme overrides matching the Coherence CSS semantic token assignments.
 * Sourced from: https://coherence-ftekb0dcfpcjb3gv.b02.azurefd.net/cdn/latest/themes/cui/theme.css
 */
const lightOverrides: Partial<ColorTokens> = {
  // brand-background-pressed maps to brand-40 in Coherence (Fluent default is brand-30)
  colorBrandBackgroundPressed: azureBrandVariants[40],
  // brand-background-selected maps to brand-60
  colorBrandBackgroundSelected: azureBrandVariants[60],
  // brand-foreground-link maps to brand-70 (not brand-80)
  colorBrandForegroundLink: azureBrandVariants[70],
  colorBrandForegroundLinkHover: azureBrandVariants[60],
  colorBrandForegroundLinkPressed: azureBrandVariants[40],
  colorBrandForegroundLinkSelected: azureBrandVariants[70],
  // brand-foreground2 maps to brand-70
  colorBrandForeground2: azureBrandVariants[70],
};

/**
 * Dark-theme overrides sourced from the live Coherence dark theme via CDP.
 * Brand colors are from Azure/Coherence; neutral colors use the CoreAI palette
 * for consistency across themes.
 */
const darkOverrides: Partial<ColorTokens> = {
  // Actual Azure Portal dark mode button background (user-verified)
  colorBrandBackground: '#125ca9',
  colorBrandBackgroundHover: azureBrandVariants[80], // --brand-background-hover: brand-80
  colorBrandBackgroundPressed: azureBrandVariants[40], // --brand-background-pressed: brand-40
  colorBrandBackgroundSelected: azureBrandVariants[60], // --brand-background-selected: brand-60

  // Brand foreground
  colorBrandForeground1: azureBrandVariants[100], // --brand-foreground1: brand-100 (#479ef5)
  colorBrandForeground2: azureBrandVariants[90], // --brand-foreground2: brand-90 (#2886de)
  colorBrandForegroundLink: azureBrandVariants[100], // brand-100 (#479ef5) — brand-90 fails AA (4.36:1 on #1f1f1f)
  colorBrandForegroundLinkHover: azureBrandVariants[120], // brand-120 (#77b7f7) — shifted up to maintain visual step
  colorBrandForegroundLinkPressed: azureBrandVariants[100], // brand-100 (#479ef5)
  colorBrandForegroundLinkSelected: azureBrandVariants[100], // brand-100 (#479ef5)
  colorBrandForegroundInverted: azureBrandVariants[80], // --brand-foreground-inverted: brand-80
  colorBrandForegroundOnLight: azureBrandVariants[100], // --brand-foreground-on-light: brand-100

  // Compound brand
  colorCompoundBrandForeground1: azureBrandVariants[100], // brand-100
  colorCompoundBrandForeground1Hover: azureBrandVariants[90], // brand-90
  colorCompoundBrandForeground1Pressed: azureBrandVariants[110], // brand-110
  colorCompoundBrandBackground: azureBrandVariants[100], // brand-100
  colorCompoundBrandBackgroundHover: azureBrandVariants[110], // brand-110
  colorCompoundBrandBackgroundPressed: azureBrandVariants[90], // brand-90
  colorCompoundBrandStroke: azureBrandVariants[100], // brand-100
  colorCompoundBrandStrokeHover: azureBrandVariants[90], // brand-90
  colorCompoundBrandStrokePressed: azureBrandVariants[110], // brand-110

  // Neutral foreground with brand
  colorNeutralForeground2BrandHover: azureBrandVariants[100], // brand-100
  colorNeutralForeground2BrandPressed: azureBrandVariants[90], // brand-90
  colorNeutralForeground2BrandSelected: azureBrandVariants[100], // brand-100
  colorNeutralForeground3BrandHover: azureBrandVariants[100], // brand-100
  colorNeutralForeground3BrandPressed: azureBrandVariants[90], // brand-90
  colorNeutralForeground3BrandSelected: azureBrandVariants[100], // brand-100

  // Brand stroke
  colorBrandStroke1: azureBrandVariants[100], // brand-100
  colorBrandStroke2: azureBrandVariants[50], // brand-50
  colorBrandStroke2Hover: azureBrandVariants[50],
  colorBrandStroke2Pressed: azureBrandVariants[30],

  // Brand background2
  colorBrandBackground2: azureBrandVariants[20], // brand-20
  colorBrandBackground2Hover: azureBrandVariants[40], // brand-40
  colorBrandBackground2Pressed: azureBrandVariants[10], // brand-10

  // Neutral stroke accessible selected uses brand
  colorNeutralStrokeAccessibleSelected: azureBrandVariants[100], // brand-100
};

export const azureLightTheme: AzureTheme = {
  ...createCoreAILightTheme(azureBrandVariants),
  ...lightOverrides,
};

export const azureDarkTheme: AzureTheme = {
  ...createCoreAIDarkTheme(azureBrandVariants),
  ...darkOverrides,
};
