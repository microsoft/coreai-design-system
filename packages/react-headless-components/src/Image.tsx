// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderImage,
  useImage,
  type ImageProps as HeadlessImageProps,
} from '@fluentui/react-headless-components-preview/image';
import styles from './Image.module.css';
import './Image.overrides.module.css';

export const imageClassNames = {
  root: 'fui-Image',
} as const;

export type ImageProps = HeadlessImageProps & {
  /** Take up the width of the container without changing the inline-block display. @default false */
  block?: boolean;
  /** Add a border, regardless of shape. @default false */
  bordered?: boolean;
  /** Resize the image content within its native element. @default 'default' */
  fit?: 'none' | 'center' | 'contain' | 'cover' | 'default';
  /** Elevate the image with a shadow. @default false */
  shadow?: boolean;
  /** Visual shape. @default 'square' */
  shape?: 'square' | 'circular' | 'rounded';
};

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  { block = false, bordered = false, fit = 'default', shadow = false, shape = 'square', ...props },
  ref,
) {
  const state = useImage(props, ref);
  const hasExplicitSize = state.root.height != null || state.root.width != null;

  Object.assign(state.root, {
    'data-block': block ? '' : undefined,
    'data-bordered': bordered ? '' : undefined,
    'data-fit': fit,
    'data-fit-fill': fit !== 'default' && !hasExplicitSize ? '' : undefined,
    'data-shadow': shadow ? '' : undefined,
    'data-shape': shape,
  });
  state.root.className = [imageClassNames.root, styles.Image, state.root.className]
    .filter(Boolean)
    .join(' ');

  return renderImage(state);
});

Image.displayName = 'Image';
