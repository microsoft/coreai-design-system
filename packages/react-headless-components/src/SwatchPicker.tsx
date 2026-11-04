// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSwatchPicker,
  useSwatchPicker,
  useSwatchPickerContextValues,
  type SwatchPickerProps as HeadlessSwatchPickerProps,
} from '@fluentui/react-headless-components-preview/swatch-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import styles from './SwatchPicker.module.css';

export {
  useSwatchPickerContextValue,
  useSwatchPickerContextValues,
} from '@fluentui/react-headless-components-preview/swatch-picker';
export type {
  SwatchPickerSlots,
  SwatchPickerState,
} from '@fluentui/react-headless-components-preview/swatch-picker';

export type SwatchPickerSize = 'extra-small' | 'small' | 'medium' | 'large';
export type SwatchPickerShape = 'rounded' | 'square' | 'circular';
export type SwatchPickerSpacing = 'small' | 'medium';
export type SwatchPickerProps = HeadlessSwatchPickerProps & {
  /** Swatch dimensions. @default 'medium' */
  size?: SwatchPickerSize;
  /** CoreAI defaults to rounded; disabling defaults restores square. */
  shape?: SwatchPickerShape;
  /** Space between swatches and grid rows. @default 'medium' */
  spacing?: SwatchPickerSpacing;
};
export type SwatchPickerOnSelectEventHandler = NonNullable<
  HeadlessSwatchPickerProps['onSelectionChange']
>;
export type SwatchPickerOnSelectionChangeData = Parameters<SwatchPickerOnSelectEventHandler>[1];
export type SwatchPickerContextValues = ReturnType<typeof useSwatchPickerContextValues>;
export type SwatchPickerContextValue = SwatchPickerContextValues['swatchPicker'];

export const swatchPickerClassNames = { root: 'fui-SwatchPicker' } as const;

export const SwatchPicker: ForwardRefComponent<SwatchPickerProps> = React.forwardRef<
  HTMLDivElement,
  SwatchPickerProps
>(function SwatchPicker(props, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const {
    size = 'medium',
    shape = 'square',
    spacing = 'medium',
    ...behaviorProps
  } = defaultsEnabled ? { shape: 'rounded' as const, ...props } : props;
  const state = {
    ...useSwatchPicker(behaviorProps, ref),
    size,
    shape,
    spacing,
  };
  const contextValues = useSwatchPickerContextValues(state);
  Object.assign(state.root, { 'data-size': size, 'data-shape': shape, 'data-spacing': spacing });
  state.root.className = [swatchPickerClassNames.root, styles.SwatchPicker, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderSwatchPicker(state, contextValues);
});

SwatchPicker.displayName = 'SwatchPicker';
