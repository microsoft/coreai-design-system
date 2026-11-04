// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderBadge,
  useBadge,
  type BadgeProps as HeadlessBadgeProps,
  type BadgeState,
} from '@fluentui/react-headless-components-preview/badge';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Badge.module.css';
import './Badge.overrides.module.css';

export type { BadgeSlots } from '@fluentui/react-headless-components-preview/badge';

export const badgeClassNames = {
  root: 'fui-Badge',
  icon: 'fui-Badge__icon',
} as const;

export type BadgeProps = HeadlessBadgeProps & {
  /** Visual emphasis. @default 'filled' */
  appearance?: 'filled' | 'ghost' | 'outline' | 'tint';
  /** Semantic color; convey its meaning in text as well. @default 'brand' */
  color?:
    'brand' | 'danger' | 'important' | 'informative' | 'severe' | 'subtle' | 'success' | 'warning';
  /** Outline shape. @default 'circular' */
  shape?: 'circular' | 'rounded' | 'square';
  /** Visual size. @default 'medium' */
  size?: 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
};

type BadgeVisualProps = Required<Pick<BadgeProps, 'appearance' | 'color' | 'shape' | 'size'>>;

/** CounterBadge delegates to the same Badge foundation as the Fluent style source. */
export function applyBadgeStyles(state: BadgeState, visual: BadgeVisualProps): void {
  // Handle children={0}: it is falsy but still renders text and needs icon spacing.
  Object.assign(state.root, {
    'data-appearance': visual.appearance,
    'data-color': visual.color,
    'data-shape': visual.shape,
    'data-size': visual.size,
    'data-has-content': React.Children.toArray(state.root.children).length > 0 ? '' : undefined,
    'data-icon-position': state.icon ? state.iconPosition : undefined,
  });
  state.root.className = [badgeClassNames.root, styles.Badge, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [badgeClassNames.icon, styles.Badge__icon, state.icon.className]
      .filter(Boolean)
      .join(' ');
  }
}

export const Badge: ForwardRefComponent<BadgeProps> = React.forwardRef<HTMLDivElement, BadgeProps>(
  function Badge(
    { appearance = 'filled', color = 'brand', shape = 'circular', size = 'medium', ...props },
    ref,
  ) {
    const state = useBadge(props, ref);
    applyBadgeStyles(state, { appearance, color, shape, size });
    return renderBadge(state);
  },
);

Badge.displayName = 'Badge';
