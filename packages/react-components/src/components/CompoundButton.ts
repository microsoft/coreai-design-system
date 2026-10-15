// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  CompoundButton as FluentCompoundButton,
  type CompoundButtonProps as FluentCompoundButtonProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAICompoundButtonShapeProps {
  /**
   * A button can be rounded, circular, or square.
   * @default 'circular'
   */
  shape?: FluentCompoundButtonProps['shape'];
}

export type CompoundButtonProps = WithDefaultPropDocs<
  FluentCompoundButtonProps,
  CoreAICompoundButtonShapeProps
>;

export const CompoundButton = withComponentDefaults<CompoundButtonProps>(FluentCompoundButton, {
  shape: 'circular',
}) as ForwardRefComponent<CompoundButtonProps>;
