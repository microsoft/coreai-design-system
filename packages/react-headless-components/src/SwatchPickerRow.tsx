// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSwatchPickerRow,
  useSwatchPickerContextValue,
  useSwatchPickerRow,
  type SwatchPickerRowProps,
} from '@fluentui/react-headless-components-preview/swatch-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './SwatchPickerRow.module.css';

export type {
  SwatchPickerRowProps,
  SwatchPickerRowSlots,
  SwatchPickerRowState,
} from '@fluentui/react-headless-components-preview/swatch-picker';

export const swatchPickerRowClassNames = { root: 'fui-SwatchPickerRow' } as const;

export const SwatchPickerRow: ForwardRefComponent<SwatchPickerRowProps> = React.forwardRef<
  HTMLDivElement,
  SwatchPickerRowProps
>(function SwatchPickerRow(props, ref) {
  const spacing = useSwatchPickerContextValue((context) => context.spacing) ?? 'medium';
  const state = useSwatchPickerRow(props, ref);
  Object.assign(state.root, { 'data-spacing': spacing });
  state.root.className = [
    swatchPickerRowClassNames.root,
    styles.SwatchPickerRow,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderSwatchPickerRow(state);
});

SwatchPickerRow.displayName = 'SwatchPickerRow';
