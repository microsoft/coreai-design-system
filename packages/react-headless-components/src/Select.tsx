// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSelect,
  useSelect,
  type SelectProps as HeadlessSelectProps,
} from '@fluentui/react-headless-components-preview/select';
import { useFieldContext } from '@fluentui/react-headless-components-preview/field';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import styles from './Select.module.css';
import './Select.overrides.module.css';

export type { SelectSlots } from '@fluentui/react-headless-components-preview/select';

export const selectClassNames = {
  root: 'fui-Select',
  select: 'fui-Select__select',
  icon: 'fui-Select__icon',
} as const;

export type SelectOnChangeData = Parameters<NonNullable<HeadlessSelectProps['onChange']>>[1];

export type SelectProps = HeadlessSelectProps & {
  /**
   * Visual appearance. Disabling CoreAI defaults restores 'outline'.
   * Explicit undefined clears the CoreAI appearance default.
   * @default 'filled-darker'
   */
  appearance?: 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';
  /** Inherits Field size when omitted. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
};

export const Select: ForwardRefComponent<SelectProps> = React.forwardRef<
  HTMLSelectElement,
  SelectProps
>(function Select(props, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const field = useFieldContext();
  const defaultAppearance =
    defaultsEnabled && !Object.prototype.hasOwnProperty.call(props, 'appearance')
      ? 'filled-darker'
      : 'outline';
  const { appearance = defaultAppearance, size: sizeProp, ...baseProps } = props;
  const size = sizeProp ?? field?.size ?? 'medium';
  const state = useSelect(baseProps, ref);

  if (state.icon && state.icon.children == null) {
    state.icon.children = <ChevronDownRegular aria-hidden />;
  }

  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-size': size,
    'data-required': state.select.required ? '' : undefined,
    'data-has-icon': state.icon ? '' : undefined,
  });
  state.root.className = [selectClassNames.root, styles.Select, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.select.className = [selectClassNames.select, styles.Select__select, state.select.className]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [selectClassNames.icon, styles.Select__icon, state.icon.className]
      .filter(Boolean)
      .join(' ');
  }

  return renderSelect(state);
});

Select.displayName = 'Select';
