// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderRadioGroup,
  useRadioGroup,
  useRadioGroupContextValues,
  type RadioGroupProps as HeadlessRadioGroupProps,
} from '@fluentui/react-headless-components-preview/radio-group';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './RadioGroup.module.css';
import './RadioGroup.overrides.module.css';

export type { RadioGroupSlots } from '@fluentui/react-headless-components-preview/radio-group';

export const radioGroupClassNames = {
  root: 'fui-RadioGroup',
} as const;

export type RadioGroupProps = HeadlessRadioGroupProps & {
  /** Visual arrangement; native radio keyboard behavior is unchanged. @default 'vertical' */
  layout?: 'vertical' | 'horizontal' | 'horizontal-stacked';
};
export type RadioGroupOnChangeData = Parameters<NonNullable<RadioGroupProps['onChange']>>[1];

export const RadioGroup: ForwardRefComponent<RadioGroupProps> = React.forwardRef<
  HTMLDivElement,
  RadioGroupProps
>(function RadioGroup({ layout = 'vertical', ...props }, ref) {
  const state = { ...useRadioGroup(props, ref), layout };
  const contextValues = useRadioGroupContextValues(state);

  Object.assign(state.root, { 'data-layout': layout });
  state.root.className = [radioGroupClassNames.root, styles.RadioGroup, state.root.className]
    .filter(Boolean)
    .join(' ');

  return renderRadioGroup(state, contextValues);
});

RadioGroup.displayName = 'RadioGroup';
