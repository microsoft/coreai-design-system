// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { CoreAIFluentProvider as LegacyProvider } from '@coreai-ds/react-components';
import {
  CoreAIFluentProvider as HeadlessProvider,
  azureDarkTheme,
  azureLightTheme,
  coreaiDarkTheme,
  coreaiLightTheme,
  type CoreAIFluentProviderProps,
} from '@coreai-ds/react-headless-components';

export const providerThemes = {
  'CoreAI light': coreaiLightTheme,
  'CoreAI dark': coreaiDarkTheme,
  'Azure light': azureLightTheme,
  'Azure dark': azureDarkTheme,
} as const;

const properties = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'direction',
  'scrollbar-width',
  'scrollbar-color',
] as const;

export function captureProviderStyles(root: HTMLElement): Record<string, string> {
  const result: Record<string, string> = {};
  const computed = getComputedStyle(root);
  for (const property of properties) {
    result[property] = computed.getPropertyValue(property);
  }
  for (const child of root.querySelectorAll<HTMLElement>('[data-tracking-size]')) {
    result[`tracking-${child.dataset.trackingSize}`] = getComputedStyle(child).letterSpacing;
  }
  return result;
}

export function CoreAIFluentProviderComparison({
  theme = coreaiLightTheme,
  dir = 'ltr',
}: Pick<CoreAIFluentProviderProps, 'theme' | 'dir'>): React.ReactElement {
  const content = (
    <>
      <p>Inherited typography and theme-scoped scrollbars.</p>
      {[10, 12, 14, 16, 18, 24].map((size) => (
        <span key={size} data-tracking-size={size} style={{ fontSize: size }}>
          {size}px text{' '}
        </span>
      ))}
    </>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
      <LegacyProvider theme={theme} dir={dir} data-provider-implementation="legacy">
        {content}
      </LegacyProvider>
      <HeadlessProvider theme={theme} dir={dir} data-provider-implementation="headless">
        {content}
      </HeadlessProvider>
    </div>
  );
}
