// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCheckbox,
  useCheckbox,
  type CheckboxProps as HeadlessCheckboxProps,
} from '@fluentui/react-headless-components-preview/checkbox';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { Checkmark12Filled, Checkmark16Filled } from '@fluentui/react-icons/headless/svg/checkmark';
import { Square12Filled, Square16Filled } from '@fluentui/react-icons/headless/svg/square';
import { CircleFilled } from '@fluentui/react-icons/headless/svg/circle';
import { resolveLabelSlot } from './Label.js';
import styles from './Checkbox.module.css';
import './Checkbox.overrides.module.css';

export type { CheckboxSlots } from '@fluentui/react-headless-components-preview/checkbox';

export const checkboxClassNames = {
  root: 'fui-Checkbox',
  input: 'fui-Checkbox__input',
  indicator: 'fui-Checkbox__indicator',
  label: 'fui-Checkbox__label',
} as const;

export type CheckboxOnChangeData = Parameters<NonNullable<HeadlessCheckboxProps['onChange']>>[1];

export type CheckboxProps = HeadlessCheckboxProps & {
  /** Circular indicators are intended for tasks-style checklists. @default 'square' */
  shape?: 'square' | 'circular';
  /** Indicator size; the label remains medium unless its slot specifies a size. @default 'medium' */
  size?: 'medium' | 'large';
};

export const Checkbox: ForwardRefComponent<CheckboxProps> = React.forwardRef<
  HTMLInputElement,
  CheckboxProps
>(function Checkbox({ shape = 'square', size = 'medium', ...props }, ref) {
  const state = useCheckbox(props, ref);

  state.label = resolveLabelSlot(props.label, {
    ...state.label,
    size: 'medium',
  });

  // The public headless hook intentionally leaves the style-only indicator glyph to its consumer.
  if (state.indicator && state.indicator.children == null) {
    const Glyph =
      state.checked === 'mixed'
        ? shape === 'circular'
          ? CircleFilled
          : size === 'large'
            ? Square16Filled
            : Square12Filled
        : state.checked
          ? size === 'large'
            ? Checkmark16Filled
            : Checkmark12Filled
          : undefined;
    state.indicator.children = Glyph ? <Glyph className={styles.Checkbox__glyph} /> : undefined;
  }

  // Apply styling to the Checkbox slots based on the state.
  Object.assign(state.root, {
    'data-shape': shape,
    'data-size': size,
  });
  state.root.className = [checkboxClassNames.root, styles.Checkbox, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.input.className = [checkboxClassNames.input, styles.Checkbox__input, state.input.className]
    .filter(Boolean)
    .join(' ');

  if (state.indicator) {
    state.indicator.className = [
      checkboxClassNames.indicator,
      styles.Checkbox__indicator,
      state.indicator.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.label) {
    state.label.className = [
      checkboxClassNames.label,
      styles.Checkbox__label,
      state.label.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderCheckbox(state);
});

Checkbox.displayName = 'Checkbox';
