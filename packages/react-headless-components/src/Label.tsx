// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderLabel,
  useLabel,
  type LabelProps as HeadlessLabelProps,
} from '@fluentui/react-headless-components-preview/label';
import styles from './Label.module.css';
import './Label.overrides.module.css';

export type { LabelSlots } from '@fluentui/react-headless-components-preview/label';

export const labelClassNames = {
  root: 'fui-Label',
  required: 'fui-Label__required',
} as const;

export type LabelProps = HeadlessLabelProps & {
  /** Visual size. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
  /** Large labels remain semibold even with regular weight, matching Fluent. @default 'regular' */
  weight?: 'regular' | 'semibold';
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { size = 'medium', weight = 'regular', ...props },
  ref,
) {
  const state = useLabel(props, ref);

  Object.assign(state.root, {
    'data-size': size,
    'data-weight': weight,
  });
  state.root.className = [labelClassNames.root, styles.Label, state.root.className]
    .filter(Boolean)
    .join(' ');

  if (state.required) {
    state.required.className = [
      labelClassNames.required,
      styles.Label__required,
      state.required.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderLabel(state);
});

Label.displayName = 'Label';
