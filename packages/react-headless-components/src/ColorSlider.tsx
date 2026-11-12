// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderColorSlider,
  useColorPickerContextValue,
  useColorSlider,
  type ColorSliderProps as HeadlessColorSliderProps,
} from '@fluentui/react-headless-components-preview/color-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { ColorPickerShape } from './ColorPicker.js';
import styles from './ColorSlider.module.css';

export type { ColorSliderSlots } from '@fluentui/react-headless-components-preview/color-picker';
export type ColorSliderProps = HeadlessColorSliderProps & {
  /** Shape of the rail; inherits ColorPicker's shape. */
  shape?: ColorPickerShape;
};
export type ColorSliderOnChangeData = Parameters<NonNullable<ColorSliderProps['onChange']>>[1];

export const colorSliderClassNames = {
  root: 'fui-ColorSlider',
  input: 'fui-ColorSlider__input',
  rail: 'fui-ColorSlider__rail',
  thumb: 'fui-ColorSlider__thumb',
} as const;

export const ColorSlider: ForwardRefComponent<ColorSliderProps> = React.forwardRef<
  HTMLInputElement,
  ColorSliderProps
>(function ColorSlider({ shape, ...props }, ref) {
  const inheritedShape = useColorPickerContextValue((context) => context.shape);
  const state = useColorSlider(props, ref);
  Object.assign(state.root, { 'data-shape': shape ?? inheritedShape ?? 'rounded' });
  state.root.className = [colorSliderClassNames.root, styles.ColorSlider, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.input.className = [
    colorSliderClassNames.input,
    styles.ColorSlider__input,
    state.input.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.rail.className = [
    colorSliderClassNames.rail,
    styles.ColorSlider__rail,
    state.rail.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.thumb.className = [
    colorSliderClassNames.thumb,
    styles.ColorSlider__thumb,
    state.thumb.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderColorSlider(state);
});

ColorSlider.displayName = 'ColorSlider';
