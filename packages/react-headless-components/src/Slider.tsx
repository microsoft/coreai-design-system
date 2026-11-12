// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSlider,
  useSlider,
  type SliderProps as HeadlessSliderProps,
} from '@fluentui/react-headless-components-preview/slider';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Slider.module.css';
import './Slider.overrides.module.css';

export type { SliderSlots } from '@fluentui/react-headless-components-preview/slider';

export const sliderClassNames = {
  root: 'fui-Slider',
  input: 'fui-Slider__input',
  rail: 'fui-Slider__rail',
  thumb: 'fui-Slider__thumb',
} as const;

export type SliderProps = HeadlessSliderProps & {
  /** Visual size of the rail and thumb. @default 'medium' */
  size?: 'small' | 'medium';
};

export const Slider: ForwardRefComponent<SliderProps> = React.forwardRef<
  HTMLInputElement,
  SliderProps
>(function Slider({ size = 'medium', ...props }, ref) {
  const state = useSlider(props, ref);

  Object.assign(state.root, { 'data-size': size });
  state.root.className = [sliderClassNames.root, styles.Slider, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.input.className = [sliderClassNames.input, styles.Slider__input, state.input.className]
    .filter(Boolean)
    .join(' ');
  state.rail.className = [sliderClassNames.rail, styles.Slider__rail, state.rail.className]
    .filter(Boolean)
    .join(' ');
  state.thumb.className = [sliderClassNames.thumb, styles.Slider__thumb, state.thumb.className]
    .filter(Boolean)
    .join(' ');

  return renderSlider(state);
});

Slider.displayName = 'Slider';
