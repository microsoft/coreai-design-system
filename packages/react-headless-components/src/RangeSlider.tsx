// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderRangeSlider,
  useRangeSlider,
  type RangeSliderProps as HeadlessRangeSliderProps,
} from '@fluentui/react-headless-components-preview/range-slider';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './RangeSlider.module.css';
import './RangeSlider.overrides.module.css';

export type {
  RangeSliderOnChangeData,
  RangeSliderSlots,
  RangeSliderState,
  RangeSliderThumbDataAttributes,
  RangeSliderValue,
} from '@fluentui/react-headless-components-preview/range-slider';

export const rangeSliderClassNames = {
  root: 'fui-RangeSlider',
  rail: 'fui-RangeSlider__rail',
  startThumb: 'fui-RangeSlider__startThumb',
  endThumb: 'fui-RangeSlider__endThumb',
  startInput: 'fui-RangeSlider__startInput',
  endInput: 'fui-RangeSlider__endInput',
} as const;

export type RangeSliderProps = HeadlessRangeSliderProps & {
  /** Visual size of the rail and thumbs. @default 'medium' */
  size?: 'small' | 'medium';
};

export const RangeSlider: ForwardRefComponent<RangeSliderProps> = React.forwardRef<
  HTMLDivElement,
  RangeSliderProps
>(function RangeSlider({ size = 'medium', ...props }, ref) {
  const state = useRangeSlider(props, ref);

  Object.assign(state.root, {
    'data-size': size,
    // v9 raises the active thumb only while both thumbs share a value.
    'data-thumbs-overlap': state.value.start === state.value.end ? '' : undefined,
  });
  state.root.className = [rangeSliderClassNames.root, styles.RangeSlider, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.rail.className = [
    rangeSliderClassNames.rail,
    styles.RangeSlider__rail,
    state.rail.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.startThumb.className = [
    rangeSliderClassNames.startThumb,
    styles.RangeSlider__thumb,
    styles.RangeSlider__startThumb,
    state.startThumb.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.endThumb.className = [
    rangeSliderClassNames.endThumb,
    styles.RangeSlider__thumb,
    styles.RangeSlider__endThumb,
    state.endThumb.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.startInput.className = [
    rangeSliderClassNames.startInput,
    styles.RangeSlider__input,
    state.startInput.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.endInput.className = [
    rangeSliderClassNames.endInput,
    styles.RangeSlider__input,
    state.endInput.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderRangeSlider(state);
});

RangeSlider.displayName = 'RangeSlider';
