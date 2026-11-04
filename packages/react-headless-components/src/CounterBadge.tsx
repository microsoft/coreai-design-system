// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCounterBadge,
  useCounterBadge,
  type CounterBadgeProps as HeadlessCounterBadgeProps,
} from '@fluentui/react-headless-components-preview/badge';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyBadgeStyles, type BadgeProps } from './Badge.js';
import styles from './CounterBadge.module.css';
import './CounterBadge.overrides.module.css';

export const counterBadgeClassNames = {
  root: 'fui-CounterBadge',
  icon: 'fui-CounterBadge__icon',
} as const;

export type CounterBadgeProps = HeadlessCounterBadgeProps & {
  /** Visual emphasis. @default 'filled' */
  appearance?: 'filled' | 'ghost';
  /** Semantic color. @default 'brand' */
  color?: Extract<BadgeProps['color'], 'brand' | 'danger' | 'important' | 'informative'>;
  /** Outline shape. @default 'circular' */
  shape?: 'circular' | 'rounded';
  /** Visual size. @default 'medium' */
  size?: BadgeProps['size'];
};

export const CounterBadge: ForwardRefComponent<CounterBadgeProps> = React.forwardRef<
  HTMLDivElement,
  CounterBadgeProps
>(function CounterBadge(
  { appearance = 'filled', color = 'brand', shape = 'circular', size = 'medium', ...props },
  ref,
) {
  const state = useCounterBadge(props, ref);
  applyBadgeStyles(state, { appearance, color, shape, size });
  state.root.className = [counterBadgeClassNames.root, styles.CounterBadge, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [counterBadgeClassNames.icon, state.icon.className]
      .filter(Boolean)
      .join(' ');
  }
  return renderCounterBadge(state);
});

CounterBadge.displayName = 'CounterBadge';
