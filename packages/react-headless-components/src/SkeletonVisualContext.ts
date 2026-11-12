// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';

export type SkeletonItemSize =
  | 8
  | 12
  | 14
  | 16
  | 20
  | 22
  | 24
  | 28
  | 32
  | 36
  | 40
  | 48
  | 52
  | 56
  | 64
  | 72
  | 92
  | 96
  | 120
  | 128;

export interface SkeletonVisualOptions {
  /** Animation for this item or group. Inherits from the group, otherwise 'wave'. */
  animation?: 'wave' | 'pulse';
  /** Appearance for this item or group. Inherits from the group, otherwise 'opaque'. */
  appearance?: 'opaque' | 'translucent';
  /** Item height in pixels; circles and squares also use it as their width. Defaults to 16. */
  size?: SkeletonItemSize;
  /** Item shape. Inherits from the group, otherwise 'rectangle'. */
  shape?: 'circle' | 'square' | 'rectangle';
}

// The public headless context facade publishes these choices but has no visual-context reader.
export const SkeletonVisualContext = React.createContext<SkeletonVisualOptions>({});
