// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderImageSwatch,
  useImageSwatch,
  useSwatchPickerContextValue,
  type ImageSwatchProps as HeadlessImageSwatchProps,
} from '@fluentui/react-headless-components-preview/swatch-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { SwatchPickerProps } from './SwatchPicker.js';
import styles from './ImageSwatch.module.css';

export type {
  ImageSwatchSlots,
  ImageSwatchState,
} from '@fluentui/react-headless-components-preview/swatch-picker';
export type ImageSwatchProps = HeadlessImageSwatchProps & Pick<SwatchPickerProps, 'size' | 'shape'>;

export const imageSwatchClassNames = { root: 'fui-ImageSwatch' } as const;

export const ImageSwatch: ForwardRefComponent<ImageSwatchProps> = React.forwardRef<
  HTMLButtonElement,
  ImageSwatchProps
>(function ImageSwatch({ size: _size, shape: _shape, ...props }, ref) {
  // The installed visual hook always selects the parent size and shape for images.
  const size = useSwatchPickerContextValue((context) => context.size) ?? 'medium';
  const shape = useSwatchPickerContextValue((context) => context.shape) ?? 'square';
  const state = useImageSwatch(props, ref);
  Object.assign(state.root, { 'data-size': size, 'data-shape': shape });
  state.root.className = [imageSwatchClassNames.root, styles.ImageSwatch, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderImageSwatch(state);
});

ImageSwatch.displayName = 'ImageSwatch';
