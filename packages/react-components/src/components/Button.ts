// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button as FluentButton,
  type ButtonProps as FluentButtonProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAIButtonShapeProps {
  /**
   * A button can be rounded, circular, or square.
   * @default 'circular'
   */
  shape?: FluentButtonProps['shape'];
}

export type ButtonProps = WithDefaultPropDocs<FluentButtonProps, CoreAIButtonShapeProps>;

export const Button = withComponentDefaults<ButtonProps>(FluentButton, {
  shape: 'circular',
}) as ForwardRefComponent<ButtonProps>;
