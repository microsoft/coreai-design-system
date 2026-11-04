// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderProgressBar,
  useProgressBar,
  type ProgressBarProps as HeadlessProgressBarProps,
} from '@fluentui/react-headless-components-preview/progress-bar';
import { useFieldContext } from '@fluentui/react-headless-components-preview/field';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ProgressBar.module.css';
import './ProgressBar.overrides.module.css';

export type { ProgressBarSlots } from '@fluentui/react-headless-components-preview/progress-bar';

export const progressBarClassNames = {
  root: 'fui-ProgressBar',
  bar: 'fui-ProgressBar__bar',
} as const;

export type ProgressBarProps = HeadlessProgressBarProps & {
  /** Visual shape of the track and bar. @default 'rounded' */
  shape?: 'rounded' | 'square';
  /** Visual track thickness. @default 'medium' */
  thickness?: 'medium' | 'large';
  /** Determinate bar color; inherits Field validation state. @default 'brand' */
  color?: 'brand' | 'error' | 'warning' | 'success';
};

// If the percentComplete is near 0, don't animate it.
// This prevents animations on reset to 0 scenarios.
const ZERO_THRESHOLD = 0.01;

export const ProgressBar: ForwardRefComponent<ProgressBarProps> = React.forwardRef<
  HTMLDivElement,
  ProgressBarProps
>(function ProgressBar(
  { shape = 'rounded', thickness = 'medium', color: colorProp, ...props },
  ref,
) {
  const field = useFieldContext();
  const validationState = field?.validationState;
  const color =
    colorProp ??
    (validationState === 'error' || validationState === 'warning' || validationState === 'success'
      ? validationState
      : 'brand');
  const state = useProgressBar(props, ref);

  Object.assign(state.root, {
    'data-shape': shape,
    'data-thickness': thickness,
    'data-color': color,
    'data-nonzero-determinate':
      state.value !== undefined && state.value > ZERO_THRESHOLD ? '' : undefined,
  });
  state.root.className = [progressBarClassNames.root, styles.ProgressBar, state.root.className]
    .filter(Boolean)
    .join(' ');

  if (state.bar) {
    state.bar.className = [progressBarClassNames.bar, styles.ProgressBar__bar, state.bar.className]
      .filter(Boolean)
      .join(' ');
  }

  return renderProgressBar(state);
});

ProgressBar.displayName = 'ProgressBar';
