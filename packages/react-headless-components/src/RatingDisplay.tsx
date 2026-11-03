// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderRatingDisplay,
  useRatingDisplay,
  useRatingDisplayContextValues,
  type RatingDisplayProps as HeadlessRatingDisplayProps,
} from '@fluentui/react-headless-components-preview/rating-display';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { RatingFilledIcon } from './RatingGlyphs.js';
import { RatingItem } from './RatingItem.js';
import { RatingVisualContext, type RatingVisualOptions } from './RatingVisualContext.js';
import styles from './RatingDisplay.module.css';

export type { RatingDisplaySlots } from '@fluentui/react-headless-components-preview/rating-display';
export type RatingDisplayProps = HeadlessRatingDisplayProps & RatingVisualOptions;

export const ratingDisplayClassNames = {
  root: 'fui-RatingDisplay',
  valueText: 'fui-RatingDisplay__valueText',
  countText: 'fui-RatingDisplay__countText',
} as const;

export const RatingDisplay: ForwardRefComponent<RatingDisplayProps> = React.forwardRef<
  HTMLDivElement,
  RatingDisplayProps
>(function RatingDisplay(
  { color = 'neutral', size = 'medium', icon = RatingFilledIcon, ...props },
  ref,
) {
  const state = { ...useRatingDisplay({ ...props, icon }, ref), color, size };
  const contextValues = useRatingDisplayContextValues(state);
  const { compact, max } = state;
  const items = React.useMemo(
    () =>
      Array.from(Array(compact ? 1 : max), (_, index) => (
        <RatingItem key={index + 1} value={index + 1} aria-hidden="true" />
      )),
    [compact, max],
  );
  // Slot render functions receive the facade's default children, so those need the same foundation.
  // The caller's render function remains in the resolved slot metadata.
  if (props.children == null || typeof props.children === 'function') state.root.children = items;

  Object.assign(state.root, { 'data-size': size, 'data-color': color });
  state.root.className = [ratingDisplayClassNames.root, styles.RatingDisplay, state.root.className]
    .filter(Boolean)
    .join(' ');
  for (const [name, scopedClass] of [
    ['valueText', styles.RatingDisplay__valueText],
    ['countText', styles.RatingDisplay__countText],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [ratingDisplayClassNames[name], scopedClass, resolved.className]
        .filter(Boolean)
        .join(' ');
    }
  }
  if (state.countText) {
    Object.assign(state.countText, { 'data-has-value': state.valueText ? '' : undefined });
  }

  return (
    <RatingVisualContext.Provider value={{ color, size }}>
      {renderRatingDisplay(state, contextValues)}
    </RatingVisualContext.Provider>
  );
});

RatingDisplay.displayName = 'RatingDisplay';
