// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Shared rendering utilities for CoreAI browser component tests.
 *
 * Use `renderCoreAIComponent` when the component under test should run with
 * the same provider defaults as production. The provider is installed through
 * Vitest's wrapper option so it remains mounted when a test calls `rerender`.
 */
import * as React from 'react';
import { render, type RenderOptions } from 'vitest-browser-react';
import {
  CoreAIFluentProvider,
  type CoreAIFluentProviderProps,
} from './contexts/CoreAIFluentProvider.js';

export interface RenderCoreAIComponentOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Override provider settings for theme and component-default test cases. */
  providerProps?: Omit<CoreAIFluentProviderProps, 'children'>;
}

/** Render a component inside `CoreAIFluentProvider` using the browser test renderer. */
export function renderCoreAIComponent(
  component: React.ReactNode,
  { providerProps, ...renderOptions }: RenderCoreAIComponentOptions = {},
) {
  function Wrapper({ children }: React.PropsWithChildren) {
    return <CoreAIFluentProvider {...providerProps}>{children}</CoreAIFluentProvider>;
  }

  return render(component, { ...renderOptions, wrapper: Wrapper });
}
