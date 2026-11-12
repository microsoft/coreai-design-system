// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { ButtonProps } from './Button.js';

export const DropdownVisualContext = React.createContext<
  Required<Pick<ButtonProps, 'appearance' | 'shape' | 'size'>> | undefined
>(undefined);
