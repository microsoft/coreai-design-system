// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  SwatchPicker as FluentSwatchPicker,
  type ForwardRefComponent,
  type SwatchPickerProps as FluentSwatchPickerProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAISwatchPickerShapeProps {
  /**
   * Swatch shape.
   * @default 'rounded'
   */
  shape?: FluentSwatchPickerProps['shape'];
}

export type SwatchPickerProps = WithDefaultPropDocs<
  FluentSwatchPickerProps,
  CoreAISwatchPickerShapeProps
>;

export const SwatchPicker = withComponentDefaults<SwatchPickerProps>(FluentSwatchPicker, {
  shape: 'rounded',
}) as ForwardRefComponent<SwatchPickerProps>;
