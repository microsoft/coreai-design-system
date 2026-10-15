// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  SpinButton as FluentSpinButton,
  type ForwardRefComponent,
  type SpinButtonProps as FluentSpinButtonProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAISpinButtonAppearanceProps {
  /**
   * Controls the colors and borders of the input.
   * @default 'filled-darker'
   */
  appearance?: FluentSpinButtonProps['appearance'];
}

export type SpinButtonProps = WithDefaultPropDocs<
  FluentSpinButtonProps,
  CoreAISpinButtonAppearanceProps
>;

export const SpinButton = withComponentDefaults<SpinButtonProps>(FluentSpinButton, {
  appearance: 'filled-darker',
}) as ForwardRefComponent<SpinButtonProps>;
