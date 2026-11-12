// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSpinner,
  useSpinner,
  type SpinnerProps as HeadlessSpinnerProps,
} from '@fluentui/react-headless-components-preview/spinner';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { resolveLabelSlot } from './Label.js';
import styles from './Spinner.module.css';
import './Spinner.overrides.module.css';

export type { SpinnerSlots } from '@fluentui/react-headless-components-preview/spinner';

export const spinnerClassNames = {
  root: 'fui-Spinner',
  spinner: 'fui-Spinner__spinner',
  spinnerTail: 'fui-Spinner__spinnerTail',
  label: 'fui-Spinner__label',
} as const;

export type SpinnerProps = HeadlessSpinnerProps & {
  /** Visual appearance. @default 'primary' */
  appearance?: 'primary' | 'inverted';
  /** Visual size. @default 'medium' */
  size?:
    'extra-tiny' | 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge';
};

export const Spinner: ForwardRefComponent<SpinnerProps> = React.forwardRef<
  HTMLElement,
  SpinnerProps
>(function Spinner({ appearance = 'primary', size = 'medium', ...props }, ref) {
  const state = useSpinner(props, ref);

  state.label = resolveLabelSlot(props.label, state.label ?? {});

  // Apply styling to the Spinner slots based on the state
  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-size': size,
    'data-has-label': state.label ? '' : undefined,
    'data-has-spinner': state.spinner ? '' : undefined,
  });
  state.root.className = [spinnerClassNames.root, styles.Spinner, state.root.className]
    .filter(Boolean)
    .join(' ');

  if (state.spinner) {
    state.spinner.className = [
      spinnerClassNames.spinner,
      styles.Spinner__spinner,
      state.spinner.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.spinnerTail) {
    state.spinnerTail.className = [
      spinnerClassNames.spinnerTail,
      styles.Spinner__spinnerTail,
      state.spinnerTail.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.label) {
    state.label.className = [spinnerClassNames.label, styles.Spinner__label, state.label.className]
      .filter(Boolean)
      .join(' ');
  }

  return renderSpinner(state);
});

Spinner.displayName = 'Spinner';
