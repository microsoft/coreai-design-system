// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  MenuButton as FluentMenuButton,
  type ForwardRefComponent,
  type MenuButtonProps as FluentMenuButtonProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAIMenuButtonShapeProps {
  /**
   * A button can be rounded, circular, or square.
   * @default 'circular'
   */
  shape?: FluentMenuButtonProps['shape'];
}

export type MenuButtonProps = WithDefaultPropDocs<
  FluentMenuButtonProps,
  CoreAIMenuButtonShapeProps
>;

export const MenuButton = withComponentDefaults<MenuButtonProps>(FluentMenuButton, {
  shape: 'circular',
}) as ForwardRefComponent<MenuButtonProps>;
