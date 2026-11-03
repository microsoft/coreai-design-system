// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderInlineDrawer,
  useDrawerContextValue,
  useInlineDrawer,
  type InlineDrawerProps as HeadlessInlineDrawerProps,
} from '@fluentui/react-headless-components-preview/drawer';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { DrawerSize } from './Drawer.js';
import styles from './InlineDrawer.module.css';

export type {
  InlineDrawerSlots,
  InlineDrawerState,
} from '@fluentui/react-headless-components-preview/drawer';

export type InlineDrawerProps = HeadlessInlineDrawerProps & {
  /** Visual size; bottom drawers use the same size on their block axis. @default 'small' */
  size?: DrawerSize;
  /** Whether the inline drawer has an edge separator. @default false */
  separator?: boolean;
};

export const inlineDrawerClassNames = { root: 'fui-InlineDrawer' } as const;

export const InlineDrawer: ForwardRefComponent<InlineDrawerProps> = React.forwardRef<
  HTMLElement,
  InlineDrawerProps
>(function InlineDrawer({ size = 'small', separator = false, ...props }, ref) {
  const state = useInlineDrawer(props, ref);
  const contextValue = useDrawerContextValue();
  Object.assign(state.root, {
    'data-size': size,
    'data-separator': separator ? '' : undefined,
  });
  state.root.className = [inlineDrawerClassNames.root, styles.InlineDrawer, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderInlineDrawer(state, contextValue);
});

InlineDrawer.displayName = 'InlineDrawer';
