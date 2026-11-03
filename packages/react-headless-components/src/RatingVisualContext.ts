// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';

export type RatingSize = 'small' | 'medium' | 'large' | 'extra-large';
export type RatingColor = 'neutral' | 'brand' | 'marigold';

export interface RatingVisualOptions {
  /** Color of the rating icons. @default 'neutral' */
  color?: RatingColor;
  /** Icon size; Rating defaults to extra-large and RatingDisplay to medium. */
  size?: RatingSize;
}

// The public facade publishes family context but has no visual-context reader.
// Selection, hover, precision, names, icons, and accessibility stay in its context.
export const RatingVisualContext = React.createContext<Required<RatingVisualOptions>>({
  color: 'neutral',
  size: 'medium',
});
