// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderEmptySwatch,
  useEmptySwatch,
  useSwatchPickerContextValue,
  type EmptySwatchProps as HeadlessEmptySwatchProps,
} from '@fluentui/react-headless-components-preview/swatch-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { SwatchPickerProps } from './SwatchPicker.js';
import styles from './EmptySwatch.module.css';

export type {
  EmptySwatchSlots,
  EmptySwatchState,
} from '@fluentui/react-headless-components-preview/swatch-picker';
export type EmptySwatchProps = HeadlessEmptySwatchProps & Pick<SwatchPickerProps, 'size' | 'shape'>;

export const emptySwatchClassNames = { root: 'fui-EmptySwatch' } as const;

export const EmptySwatch: ForwardRefComponent<EmptySwatchProps> = React.forwardRef<
  HTMLButtonElement,
  EmptySwatchProps
>(function EmptySwatch({ size: sizeProp, shape: shapeProp, ...props }, ref) {
  const contextSize = useSwatchPickerContextValue((context) => context.size);
  const contextShape = useSwatchPickerContextValue((context) => context.shape);
  const size = sizeProp ?? contextSize ?? 'medium';
  const shape = shapeProp ?? contextShape ?? 'square';
  const state = useEmptySwatch(props, ref);
  Object.assign(state.root, { 'data-size': size, 'data-shape': shape });
  state.root.className = [emptySwatchClassNames.root, styles.EmptySwatch, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderEmptySwatch(state);
});

EmptySwatch.displayName = 'EmptySwatch';
