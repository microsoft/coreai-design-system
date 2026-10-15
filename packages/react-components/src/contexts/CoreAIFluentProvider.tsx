// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Unified provider for the CoreAI theme.
 *
 * Wraps Fluent's `FluentProvider` and pre-wires our per-component
 * `customStyleHooks_unstable`. Also publishes a boolean on the internal
 * defaults context so components built via the `withComponentDefaults` HoC know
 * whether to apply the theme's default props.
 *
 * Use this anywhere you'd otherwise reach for `FluentProvider`.
 */
import * as React from 'react';
import { FluentProvider, mergeClasses, type FluentProviderProps } from '@fluentui/react-components';
import { styleHooks } from './styleHooks.js';
import { ComponentDefaultsProvider } from './ComponentDefaultsContext.js';
import { FluentThemeModeProvider } from './FluentThemeModeContext.js';
import { useCoreAIGlobalStyles } from '../theme/globalStyles.js';
import { coreaiLightTheme } from '../theme/theme.js';

export interface CoreAIFluentProviderProps extends FluentProviderProps {
  /**
   * When `true` (the default), wrapped components apply CoreAI's default
   * props. Set to `false` to render with stock Fluent semantics — e.g.,
   * when previewing the Web or Teams themes.
   */
  withComponentDefaults?: boolean;
}

export const CoreAIFluentProvider = React.forwardRef<HTMLDivElement, CoreAIFluentProviderProps>(
  function CoreAIFluentProvider(props, ref) {
    const {
      customStyleHooks_unstable,
      withComponentDefaults = true,
      theme = coreaiLightTheme,
      className,
      children,
      ...rest
    } = props;
    const globalStyles = useCoreAIGlobalStyles();
    return (
      <ComponentDefaultsProvider value={withComponentDefaults}>
        <FluentProvider
          ref={ref}
          className={mergeClasses(globalStyles.root, className)}
          customStyleHooks_unstable={{
            ...styleHooks,
            // Allow callers to override or extend on a case-by-case basis.
            ...customStyleHooks_unstable,
          }}
          theme={theme}
          {...rest}
        >
          <FluentThemeModeProvider theme={theme}>{children}</FluentThemeModeProvider>
        </FluentProvider>
      </ComponentDefaultsProvider>
    );
  },
);
