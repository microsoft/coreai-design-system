// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  CoreAIFluentProvider as LegacyProvider,
  type CoreAIFluentProviderProps,
} from '@coreai-ds/react-components';
import {
  CoreAIFluentProvider as HeadlessProvider,
  azureDarkTheme,
  azureLightTheme,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-headless-components';
import {
  teamsDarkTheme,
  teamsDarkV21Theme,
  teamsLightTheme,
  teamsLightV21Theme,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-theme';
import type { Decorator } from '@storybook/react-vite';

/**
 * Test/Storybook consumer only: publish both independent context families so
 * the old reference and the new implementation receive identical theme inputs.
 */
export function ComparisonProvider({
  children,
  theme,
  withComponentDefaults,
  dir,
  targetDocument,
  ...props
}: CoreAIFluentProviderProps): React.ReactElement {
  return (
    <LegacyProvider
      {...props}
      theme={theme}
      withComponentDefaults={withComponentDefaults}
      dir={dir}
      targetDocument={targetDocument}
    >
      <HeadlessProvider
        theme={theme}
        withComponentDefaults={withComponentDefaults}
        dir={dir}
        targetDocument={targetDocument}
        style={{
          display: 'contents',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 'inherit',
          textAlign: 'inherit',
        }}
      >
        {children}
      </HeadlessProvider>
    </LegacyProvider>
  );
}

const storyThemes = {
  coreai: { light: coreaiLightTheme, dark: coreaiDarkTheme },
  azure: { light: azureLightTheme, dark: azureDarkTheme },
  web: { light: webLightTheme, dark: webDarkTheme },
  teams: { light: teamsLightTheme, dark: teamsDarkTheme },
  teamsV21: { light: teamsLightV21Theme, dark: teamsDarkV21Theme },
};

/** Experimental stories only; normal published stories retain their old provider. */
export const withHeadlessProvider: Decorator = (Story, context) => {
  const themeKey = context.globals.theme ?? 'coreai';
  const mode = context.globals.mode === 'light' ? 'light' : 'dark';
  const theme =
    Object.entries(storyThemes).find(([key]) => key === themeKey)?.[1][mode] ??
    storyThemes.coreai[mode];
  return (
    <HeadlessProvider
      theme={theme}
      withComponentDefaults={themeKey === 'coreai' || themeKey === 'azure'}
    >
      <Story />
    </HeadlessProvider>
  );
};
