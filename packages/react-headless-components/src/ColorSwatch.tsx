// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderColorSwatch,
  useColorSwatch,
  useSwatchPickerContextValue,
  type ColorSwatchProps as HeadlessColorSwatchProps,
} from '@fluentui/react-headless-components-preview/swatch-picker';
import { slot, type ForwardRefComponent } from '@fluentui/react-utilities';
import { ProhibitedFilled } from '@fluentui/react-icons/headless/svg/prohibited';
import type { SwatchPickerProps } from './SwatchPicker.js';
import styles from './ColorSwatch.module.css';

export type {
  ColorSwatchSlots,
  ColorSwatchState,
} from '@fluentui/react-headless-components-preview/swatch-picker';
export type ColorSwatchProps = HeadlessColorSwatchProps & Pick<SwatchPickerProps, 'size' | 'shape'>;

export const colorSwatchClassNames = {
  root: 'fui-ColorSwatch',
  icon: 'fui-ColorSwatch__icon',
  disabledIcon: 'fui-ColorSwatch__disabledIcon',
} as const;

export const ColorSwatch: ForwardRefComponent<ColorSwatchProps> = React.forwardRef<
  HTMLButtonElement,
  ColorSwatchProps
>(function ColorSwatch({ size: sizeProp, shape: shapeProp, ...props }, ref) {
  const contextSize = useSwatchPickerContextValue((context) => context.size);
  const contextShape = useSwatchPickerContextValue((context) => context.shape);
  const size = sizeProp ?? contextSize ?? 'medium';
  const shape = shapeProp ?? contextShape ?? 'square';
  const state = useColorSwatch(props, ref);
  state.disabledIcon = slot.optional(props.disabledIcon, {
    elementType: 'span',
    renderByDefault: true,
    defaultProps: {
      ...state.disabledIcon,
      children: <ProhibitedFilled className={styles.ColorSwatch__glyph} />,
    },
  });
  Object.assign(state.root, { 'data-size': size, 'data-shape': shape });
  state.root.className = [colorSwatchClassNames.root, styles.ColorSwatch, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [
      colorSwatchClassNames.icon,
      styles.ColorSwatch__icon,
      state.icon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.disabledIcon) {
    state.disabledIcon.className = [
      colorSwatchClassNames.disabledIcon,
      styles.ColorSwatch__disabledIcon,
      state.disabledIcon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderColorSwatch(state);
});

ColorSwatch.displayName = 'ColorSwatch';
