// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAlphaSlider,
  useAlphaSlider,
  useColorPickerContextValue,
  type AlphaSliderProps as HeadlessAlphaSliderProps,
} from '@fluentui/react-headless-components-preview/color-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { ColorPickerShape } from './ColorPicker.js';
import { colorSliderClassNames } from './ColorSlider.js';
import styles from './AlphaSlider.module.css';

export type { AlphaSliderSlots } from '@fluentui/react-headless-components-preview/color-picker';
export type AlphaSliderProps = HeadlessAlphaSliderProps & {
  /** Shape of the rail; inherits ColorPicker's shape. */
  shape?: ColorPickerShape;
};
export type AlphaSliderOnChangeData = Parameters<NonNullable<AlphaSliderProps['onChange']>>[1];

export const alphaSliderClassNames = {
  root: 'fui-AlphaSlider',
  input: 'fui-AlphaSlider__input',
  rail: 'fui-AlphaSlider__rail',
  thumb: 'fui-AlphaSlider__thumb',
} as const;

export const AlphaSlider: ForwardRefComponent<AlphaSliderProps> = React.forwardRef<
  HTMLInputElement,
  AlphaSliderProps
>(function AlphaSlider({ shape, ...props }, ref) {
  const inheritedShape = useColorPickerContextValue((context) => context.shape);
  const state = useAlphaSlider(props, ref);
  Object.assign(state.root, { 'data-shape': shape ?? inheritedShape ?? 'rounded' });
  state.root.className = [
    colorSliderClassNames.root,
    alphaSliderClassNames.root,
    styles.AlphaSlider,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.input.className = [
    colorSliderClassNames.input,
    alphaSliderClassNames.input,
    styles.AlphaSlider__input,
    state.input.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.rail.className = [
    colorSliderClassNames.rail,
    alphaSliderClassNames.rail,
    styles.AlphaSlider__rail,
    state.rail.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.thumb.className = [
    colorSliderClassNames.thumb,
    alphaSliderClassNames.thumb,
    styles.AlphaSlider__thumb,
    state.thumb.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderAlphaSlider(state);
});

AlphaSlider.displayName = 'AlphaSlider';
