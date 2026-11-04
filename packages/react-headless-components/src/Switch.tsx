// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSwitch,
  useSwitch,
  type SwitchProps as HeadlessSwitchProps,
} from '@fluentui/react-headless-components-preview/switch';
import { CircleFilled } from '@fluentui/react-icons/headless/svg/circle';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { resolveLabelSlot } from './Label.js';
import styles from './Switch.module.css';
import './Switch.overrides.module.css';

export type { SwitchSlots } from '@fluentui/react-headless-components-preview/switch';

export const switchClassNames = {
  root: 'fui-Switch',
  indicator: 'fui-Switch__indicator',
  input: 'fui-Switch__input',
  label: 'fui-Switch__label',
} as const;

export type SwitchOnChangeData = Parameters<NonNullable<HeadlessSwitchProps['onChange']>>[1];

export type SwitchProps = HeadlessSwitchProps & {
  /** Visual size; does not inherit Field size. @default 'medium' */
  size?: 'small' | 'medium';
};

export const Switch: ForwardRefComponent<SwitchProps> = React.forwardRef<
  HTMLInputElement,
  SwitchProps
>(function Switch({ size = 'medium', ...props }, ref) {
  const state = useSwitch(props, ref);

  state.label = resolveLabelSlot(props.label, {
    size: 'medium',
    ...state.label,
  });
  // Like the styled hook, supply the visual-only thumb only for nullish indicator content.
  state.indicator.children ??= <CircleFilled className={styles.Switch__thumb} />;

  // Apply styling to the Switch slots based on the state
  Object.assign(state.root, {
    'data-size': size,
    'data-has-label': state.label ? '' : undefined,
  });
  state.root.className = [switchClassNames.root, styles.Switch, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.input.className = [switchClassNames.input, styles.Switch__input, state.input.className]
    .filter(Boolean)
    .join(' ');
  state.indicator.className = [
    switchClassNames.indicator,
    styles.Switch__indicator,
    state.indicator.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.label) {
    state.label.className = [switchClassNames.label, styles.Switch__label, state.label.className]
      .filter(Boolean)
      .join(' ');
  }

  return renderSwitch(state);
});

Switch.displayName = 'Switch';
