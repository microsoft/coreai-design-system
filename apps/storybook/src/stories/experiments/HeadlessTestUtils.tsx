// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Keep both independent provider contexts mounted across browser-test rerenders
 * without making the new provider restyle the old visual reference.
 */
import * as React from 'react';
import { render, type RenderOptions } from 'vitest-browser-react';
import { ComparisonProvider } from './ComparisonProvider.js';

export interface RenderCoreAIComponentOptions extends Omit<RenderOptions, 'wrapper'> {
  providerProps?: Omit<React.ComponentProps<typeof ComparisonProvider>, 'children'>;
}

export function renderCoreAIComponent(
  component: React.ReactNode,
  { providerProps, ...renderOptions }: RenderCoreAIComponentOptions = {},
) {
  function Wrapper({ children }: React.PropsWithChildren) {
    return <ComparisonProvider {...providerProps}>{children}</ComparisonProvider>;
  }
  return render(component, { ...renderOptions, wrapper: Wrapper });
}
