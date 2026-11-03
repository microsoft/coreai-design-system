// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderRatingItem,
  useRatingItem,
  type RatingItemProps,
} from '@fluentui/react-headless-components-preview/rating';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { RatingVisualContext } from './RatingVisualContext.js';
import styles from './RatingItem.module.css';

export type {
  RatingItemProps,
  RatingItemSlots,
} from '@fluentui/react-headless-components-preview/rating';

export const ratingItemClassNames = {
  root: 'fui-RatingItem',
  selectedIcon: 'fui-RatingItem__selectedIcon',
  unselectedIcon: 'fui-RatingItem__unselectedIcon',
  halfValueInput: 'fui-RatingItem__halfValueInput',
  fullValueInput: 'fui-RatingItem__fullValueInput',
} as const;

export const RatingItem: ForwardRefComponent<RatingItemProps> = React.forwardRef<
  HTMLSpanElement,
  RatingItemProps
>(function RatingItem(props, ref) {
  const { color, size } = React.useContext(RatingVisualContext);
  const state = useRatingItem(props, ref);

  Object.assign(state.root, {
    'data-size': size,
    'data-color': color,
    'data-icon-appearance': state.appearance,
    'data-has-half-input': state.halfValueInput ? '' : undefined,
  });
  state.root.className = [ratingItemClassNames.root, styles.RatingItem, state.root.className]
    .filter(Boolean)
    .join(' ');
  for (const [name, scopedClass] of [
    ['selectedIcon', styles.RatingItem__selectedIcon],
    ['unselectedIcon', styles.RatingItem__unselectedIcon],
    ['halfValueInput', styles.RatingItem__halfValueInput],
    ['fullValueInput', styles.RatingItem__fullValueInput],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [ratingItemClassNames[name], scopedClass, resolved.className]
        .filter(Boolean)
        .join(' ');
    }
  }
  return renderRatingItem(state);
});

RatingItem.displayName = 'RatingItem';
