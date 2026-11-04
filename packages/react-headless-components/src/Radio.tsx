// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderRadio,
  useRadio,
  type RadioProps as HeadlessRadioProps,
} from '@fluentui/react-headless-components-preview/radio-group';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { resolveLabelSlot } from './Label.js';
import styles from './Radio.module.css';
import './Radio.overrides.module.css';

export type { RadioSlots } from '@fluentui/react-headless-components-preview/radio-group';

export const radioClassNames = {
  root: 'fui-Radio',
  input: 'fui-Radio__input',
  indicator: 'fui-Radio__indicator',
  label: 'fui-Radio__label',
} as const;

export type RadioProps = HeadlessRadioProps;
export type RadioOnChangeData = Parameters<NonNullable<RadioProps['onChange']>>[1];

export const Radio: ForwardRefComponent<RadioProps> = React.forwardRef<
  HTMLInputElement,
  RadioProps
>(function Radio(props, ref) {
  const state = useRadio(props, ref);

  state.label = resolveLabelSlot(props.label, { ...state.label });

  // The default checked dot is CSS; consumer indicator children keep their own rendering.
  Object.assign(state.root, {
    'data-custom-indicator': state.indicator.children ? '' : undefined,
  });
  state.root.className = [radioClassNames.root, styles.Radio, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.input.className = [radioClassNames.input, styles.Radio__input, state.input.className]
    .filter(Boolean)
    .join(' ');
  state.indicator.className = [
    radioClassNames.indicator,
    styles.Radio__indicator,
    state.indicator.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.label) {
    state.label.className = [radioClassNames.label, styles.Radio__label, state.label.className]
      .filter(Boolean)
      .join(' ');
  }

  return renderRadio(state);
});

Radio.displayName = 'Radio';
