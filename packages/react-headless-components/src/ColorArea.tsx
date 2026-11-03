// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderColorArea,
  useColorArea,
  useColorPickerContextValue,
  type ColorAreaProps as HeadlessColorAreaProps,
} from '@fluentui/react-headless-components-preview/color-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { ColorPickerShape } from './ColorPicker.js';
import styles from './ColorArea.module.css';

export type { ColorAreaSlots } from '@fluentui/react-headless-components-preview/color-picker';
export type ColorAreaProps = HeadlessColorAreaProps & {
  /** Shape of the color area; inherits ColorPicker's shape. */
  shape?: ColorPickerShape;
};
export type ColorAreaOnColorChangeData = Parameters<NonNullable<ColorAreaProps['onChange']>>[1];

export const colorAreaClassNames = {
  root: 'fui-ColorArea',
  inputX: 'fui-ColorArea__inputX',
  inputY: 'fui-ColorArea__inputY',
  thumb: 'fui-ColorArea__thumb',
} as const;

export const ColorArea: ForwardRefComponent<ColorAreaProps> = React.forwardRef<
  HTMLDivElement,
  ColorAreaProps
>(function ColorArea({ shape, ...props }, ref) {
  const inheritedShape = useColorPickerContextValue((context) => context.shape);
  const state = useColorArea(props, ref);
  Object.assign(state.root, { 'data-shape': shape ?? inheritedShape ?? 'rounded' });
  state.root.className = [colorAreaClassNames.root, styles.ColorArea, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.inputX.className = [
    colorAreaClassNames.inputX,
    styles.ColorArea__inputX,
    state.inputX.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.inputY.className = [
    colorAreaClassNames.inputY,
    styles.ColorArea__inputY,
    state.inputY.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.thumb.className = [
    colorAreaClassNames.thumb,
    styles.ColorArea__thumb,
    state.thumb.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderColorArea(state);
});

ColorArea.displayName = 'ColorArea';
