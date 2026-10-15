// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Select as FluentSelect,
  type ForwardRefComponent,
  type SelectProps as FluentSelectProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAISelectAppearanceProps {
  /**
   * Controls the colors and borders of the Select.
   * @default 'filled-darker'
   */
  appearance?: FluentSelectProps['appearance'];
}

export type SelectProps = WithDefaultPropDocs<FluentSelectProps, CoreAISelectAppearanceProps>;

export const Select = withComponentDefaults<SelectProps>(FluentSelect, {
  appearance: 'filled-darker',
}) as ForwardRefComponent<SelectProps>;
