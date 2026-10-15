// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  ToggleButton as FluentToggleButton,
  type ForwardRefComponent,
  type ToggleButtonProps as FluentToggleButtonProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAIToggleButtonShapeProps {
  /**
   * A button can be rounded, circular, or square.
   * @default 'circular'
   */
  shape?: FluentToggleButtonProps['shape'];
}

export type ToggleButtonProps = WithDefaultPropDocs<
  FluentToggleButtonProps,
  CoreAIToggleButtonShapeProps
>;

export const ToggleButton = withComponentDefaults<ToggleButtonProps>(FluentToggleButton, {
  shape: 'circular',
}) as ForwardRefComponent<ToggleButtonProps>;
