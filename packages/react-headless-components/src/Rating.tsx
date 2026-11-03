// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderRating,
  useRating,
  useRatingContextValues,
  type RatingProps as HeadlessRatingProps,
} from '@fluentui/react-headless-components-preview/rating';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { RatingFilledIcon, RatingOutlineIcon } from './RatingGlyphs.js';
import { RatingItem } from './RatingItem.js';
import { RatingVisualContext, type RatingVisualOptions } from './RatingVisualContext.js';
import styles from './Rating.module.css';

export type { RatingSlots } from '@fluentui/react-headless-components-preview/rating';
export type { RatingColor, RatingSize } from './RatingVisualContext.js';
export type RatingOnChangeEventData = Parameters<NonNullable<HeadlessRatingProps['onChange']>>[1];
export type RatingProps = HeadlessRatingProps & RatingVisualOptions;

export const ratingClassNames = {
  root: 'fui-Rating',
} as const;

export const Rating: ForwardRefComponent<RatingProps> = React.forwardRef<
  HTMLDivElement,
  RatingProps
>(function Rating(
  {
    color = 'neutral',
    size = 'extra-large',
    iconFilled = RatingFilledIcon,
    iconOutline = RatingOutlineIcon,
    max = 5,
    ...props
  },
  ref,
) {
  const state = {
    ...useRating({ ...props, iconFilled, iconOutline }, ref),
    color,
    size,
  };
  const contextValues = useRatingContextValues(state);
  const items = React.useMemo(
    () => Array.from(Array(max), (_, index) => <RatingItem key={index + 1} value={index + 1} />),
    [max],
  );
  state.root.children ??= items;
  Object.assign(state.root, { 'data-size': size, 'data-color': color });
  state.root.className = [ratingClassNames.root, styles.Rating, state.root.className]
    .filter(Boolean)
    .join(' ');

  return (
    <RatingVisualContext.Provider value={{ color, size }}>
      {renderRating(state, contextValues)}
    </RatingVisualContext.Provider>
  );
});

Rating.displayName = 'Rating';
