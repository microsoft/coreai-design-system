// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderColorPicker,
  useColorPicker,
  useColorPickerContextValues,
  type ColorPickerProps as HeadlessColorPickerProps,
} from '@fluentui/react-headless-components-preview/color-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ColorPicker.module.css';

export {
  useColorPickerContextValue,
  useColorPickerContextValues,
  type ColorPickerContextValue,
  type ColorPickerSlots,
} from '@fluentui/react-headless-components-preview/color-picker';

export type ColorPickerShape = 'rounded' | 'square';
export type ColorPickerProps = HeadlessColorPickerProps & {
  /** Shape inherited by descendant color controls. @default 'rounded' */
  shape?: ColorPickerShape;
};
export type ColorPickerOnChangeData = Parameters<NonNullable<ColorPickerProps['onColorChange']>>[1];

export const colorPickerClassNames = {
  root: 'fui-ColorPicker',
} as const;

export const ColorPicker: ForwardRefComponent<ColorPickerProps> = React.forwardRef<
  HTMLDivElement,
  ColorPickerProps
>(function ColorPicker({ shape = 'rounded', ...props }, ref) {
  const state = { ...useColorPicker(props, ref), shape };
  const contextValues = useColorPickerContextValues(state);
  state.root.className = [colorPickerClassNames.root, styles.ColorPicker, state.root.className]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.root, { 'data-shape': shape });
  return renderColorPicker(state, contextValues);
});

ColorPicker.displayName = 'ColorPicker';
