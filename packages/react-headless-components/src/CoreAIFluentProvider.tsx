// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderProvider,
  useProvider,
  useProviderContextValues,
  useProviderContext,
} from '@fluentui/react-headless-components-preview/provider';
import {
  getIntrinsicElementProps,
  type ComponentProps,
  type ForwardRefComponent,
  type Slot,
} from '@fluentui/react-utilities';
import { IconDirectionContextProvider } from '@fluentui/react-icons/providers';
import { ComponentDefaultsProvider } from './ComponentDefaultsContext.js';
import { FluentThemeModeProvider } from './FluentThemeModeContext.js';
import { coreaiLightTheme, type CoreAITheme } from './theme.js';
import './Icon.css';
import styles from './CoreAIFluentProvider.module.css';
import overrides from './CoreAIFluentProvider.overrides.module.css';

type ThemeStyle = React.CSSProperties & {
  [variable: `--${string}`]: string | number | undefined;
};

export type CoreAIFluentProviderProps = Omit<
  ComponentProps<{ root: Slot<'div'> }>,
  'dir' | 'style'
> &
  // React 18 has no FragmentProps; derive these fields from the valid public context API.
  Partial<Pick<ReturnType<typeof useProviderContext>, 'dir' | 'targetDocument'>> & {
    /** Theme values are emitted as native CSS variables, including during SSR. */
    theme?: Partial<CoreAITheme>;
    /** Apply CoreAI component prop defaults. @default true */
    withComponentDefaults?: boolean;
    style?: ThemeStyle;
  };

export const coreaiFluentProviderClassNames = { root: 'fui-FluentProvider' } as const;

const CoreAIThemeContext = React.createContext<Partial<CoreAITheme> | undefined>(undefined);

/**
 * Owns CoreAI's theme variables and CSS Modules visual layer. The public
 * headless provider owns direction and target-document behavior.
 */
export const CoreAIFluentProvider: ForwardRefComponent<CoreAIFluentProviderProps> =
  React.forwardRef<HTMLDivElement, CoreAIFluentProviderProps>(function CoreAIFluentProvider(
    {
      theme = coreaiLightTheme,
      withComponentDefaults = true,
      dir,
      targetDocument,
      as: Root = 'div',
      className,
      style,
      children,
      ...props
    },
    ref,
  ) {
    const parentTheme = React.useContext(CoreAIThemeContext);
    const mergedTheme = React.useMemo(() => ({ ...parentTheme, ...theme }), [parentTheme, theme]);
    const variables = React.useMemo(() => {
      const result: ThemeStyle = {};
      for (const [name, value] of Object.entries(mergedTheme)) {
        if (value !== undefined) {
          result[`--${name}`] = value;
        }
      }
      return result;
    }, [mergedTheme]);
    const state = useProvider({ dir, targetDocument }, ref);
    const contexts = useProviderContextValues(state);
    state.root.children = (
      <CoreAIThemeContext.Provider value={mergedTheme}>
        <IconDirectionContextProvider value={contexts.iconDirection}>
          <ComponentDefaultsProvider value={withComponentDefaults}>
            <Root
              {...getIntrinsicElementProps('div', props)}
              ref={ref}
              dir={state.dir}
              className={[
                coreaiFluentProviderClassNames.root,
                styles.FluentProvider,
                overrides.CoreAIFluentProvider,
                className,
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ ...variables, ...style }}
            >
              <FluentThemeModeProvider theme={mergedTheme} style={style}>
                {children}
              </FluentThemeModeProvider>
            </Root>
          </ComponentDefaultsProvider>
        </IconDirectionContextProvider>
      </CoreAIThemeContext.Provider>
    );
    return renderProvider(state, contexts);
  });

CoreAIFluentProvider.displayName = 'CoreAIFluentProvider';
