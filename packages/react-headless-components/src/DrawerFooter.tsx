// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDrawerFooter,
  useDrawerFooter,
  type DrawerFooterProps,
} from '@fluentui/react-headless-components-preview/drawer';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DrawerFooter.module.css';

export type {
  DrawerFooterProps,
  DrawerFooterSlots,
  DrawerFooterState,
} from '@fluentui/react-headless-components-preview/drawer';

export const drawerFooterClassNames = { root: 'fui-DrawerFooter' } as const;

export const DrawerFooter: ForwardRefComponent<DrawerFooterProps> = React.forwardRef<
  HTMLElement,
  DrawerFooterProps
>(function DrawerFooter(props, ref) {
  const state = useDrawerFooter(props, ref);
  state.root.className = [drawerFooterClassNames.root, styles.DrawerFooter, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderDrawerFooter(state);
});

DrawerFooter.displayName = 'DrawerFooter';
