// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { AvatarShape, AvatarSize } from './Avatar.js';

export type TagAppearance = 'filled' | 'outline' | 'brand';
export type TagShape = 'rounded' | 'circular';
export type TagSize = 'medium' | 'small' | 'extra-small';

export interface TagVisualOptions {
  /** Visual emphasis; inherits TagGroup when omitted. @default 'filled' */
  appearance?: TagAppearance;
  /** Corner shape. @default 'rounded' */
  shape?: TagShape;
  /** Visual size; inherits TagGroup when omitted. @default 'medium' */
  size?: TagSize;
}

// The facades expose no visual-context readers. Behavior stays in their public contexts.
export const TagGroupVisualContext = React.createContext<
  Required<Pick<TagVisualOptions, 'appearance' | 'size'>>
>({ appearance: 'filled', size: 'medium' });

export const InteractionTagVisualContext = React.createContext<Required<TagVisualOptions>>({
  appearance: 'filled',
  shape: 'rounded',
  size: 'medium',
});

export const tagAvatarSizes = {
  medium: 28,
  small: 20,
  'extra-small': 16,
} as const satisfies Record<TagSize, AvatarSize>;

export const tagAvatarShapes = {
  rounded: 'square',
  circular: 'circular',
} as const satisfies Record<TagShape, AvatarShape>;
