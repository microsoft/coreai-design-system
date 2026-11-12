// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderOptionGroup,
  useOptionGroup,
  type OptionGroupProps,
} from '@fluentui/react-headless-components-preview/combobox';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './OptionGroup.module.css';

export type {
  OptionGroupProps,
  OptionGroupSlots,
} from '@fluentui/react-headless-components-preview/combobox';

export const optionGroupClassNames = {
  root: 'fui-OptionGroup',
  label: 'fui-OptionGroup__label',
} as const;

export const OptionGroup: ForwardRefComponent<OptionGroupProps> = React.forwardRef<
  HTMLDivElement,
  OptionGroupProps
>(function OptionGroup(props, ref) {
  const state = useOptionGroup(props, ref);
  state.root.className = [optionGroupClassNames.root, styles.OptionGroup, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.label) {
    state.label.className = [
      optionGroupClassNames.label,
      styles.OptionGroup__label,
      state.label.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderOptionGroup(state);
});

OptionGroup.displayName = 'OptionGroup';
