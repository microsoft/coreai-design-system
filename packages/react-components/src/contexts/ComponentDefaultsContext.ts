// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Boolean context that tells wrapped components (built via
 * `withComponentDefaults`) whether to apply the theme's default props.
 *
 * Published by `<CoreAIFluentProvider withComponentDefaults={...}>`. The provider
 * defaults the prop to `true`, so a bare `<CoreAIFluentProvider>` opts in. The
 * Storybook decorator flips it to `false` for the Web / Teams / Teams v2.1
 * themes so they render with stock Fluent semantics.
 *
 * Defaults to `false` outside of any provider — i.e., "no overrides" is
 * the safe default for any consumer using stock Fluent directly.
 */
import * as React from 'react';

const ComponentDefaultsContext = React.createContext<boolean>(false);

export const ComponentDefaultsProvider = ComponentDefaultsContext.Provider;

export const useComponentDefaults = (): boolean => React.useContext(ComponentDefaultsContext);
