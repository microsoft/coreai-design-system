// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  SplitButton as FluentSplitButton,
  type ForwardRefComponent,
  type SplitButtonProps as FluentSplitButtonProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAISplitButtonShapeProps {
  /**
   * A button can be rounded, circular, or square.
   * @default 'circular'
   */
  shape?: FluentSplitButtonProps['shape'];
}

export type SplitButtonProps = WithDefaultPropDocs<
  FluentSplitButtonProps,
  CoreAISplitButtonShapeProps
>;

export const SplitButton = withComponentDefaults<SplitButtonProps>(FluentSplitButton, {
  shape: 'circular',
}) as ForwardRefComponent<SplitButtonProps>;
