// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  TagPicker as FluentTagPicker,
  type ForwardRefComponent,
  type TagPickerProps as FluentTagPickerProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAITagPickerAppearanceProps {
  /**
   * Controls the colors and borders of the combobox trigger.
   * @default 'filled-darker'
   */
  appearance?: FluentTagPickerProps['appearance'];
}

export type TagPickerProps = WithDefaultPropDocs<
  FluentTagPickerProps,
  CoreAITagPickerAppearanceProps
>;

export const TagPicker = withComponentDefaults<TagPickerProps>(FluentTagPicker, {
  appearance: 'filled-darker',
}) as ForwardRefComponent<TagPickerProps>;
