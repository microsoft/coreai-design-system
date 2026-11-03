// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Boolean context that tells wrapped components whether to apply CoreAI's
 * default props. A bare CoreAIFluentProvider opts in; outside a provider,
 * components retain stock Fluent defaults.
 */
import * as React from 'react';

const ComponentDefaultsContext = React.createContext(false);

export const ComponentDefaultsProvider = ComponentDefaultsContext.Provider;

export const useCoreAIDefaults = (): boolean => React.useContext(ComponentDefaultsContext);
