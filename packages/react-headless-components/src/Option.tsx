// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderOption,
  useOption,
  type OptionProps,
} from '@fluentui/react-headless-components-preview/combobox';
import { CheckmarkFilled, Checkmark12Filled } from '@fluentui/react-icons/headless/svg/checkmark';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Option.module.css';

export type {
  OptionProps,
  OptionSlots,
} from '@fluentui/react-headless-components-preview/combobox';

export const optionClassNames = {
  root: 'fui-Option',
  checkIcon: 'fui-Option__checkIcon',
} as const;

export const Option: ForwardRefComponent<OptionProps> = React.forwardRef<
  HTMLDivElement,
  OptionProps
>(function Option(props, ref) {
  const state = useOption(props, ref);
  if (state.checkIcon && state.checkIcon.children == null) {
    state.checkIcon.children = state.multiselect ? (
      state.selected ? (
        <Checkmark12Filled aria-hidden />
      ) : (
        ''
      )
    ) : (
      <CheckmarkFilled aria-hidden />
    );
  }
  state.root.className = [optionClassNames.root, styles.Option, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.checkIcon) {
    Object.assign(state.checkIcon, {
      'data-disabled': state.disabled ? '' : undefined,
      'data-selected': state.selected ? '' : undefined,
      'data-multiselect': state.multiselect ? '' : undefined,
    });
    state.checkIcon.className = [
      optionClassNames.checkIcon,
      styles.Option__checkIcon,
      state.checkIcon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderOption(state);
});

Option.displayName = 'Option';
