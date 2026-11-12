// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDrawerHeader,
  useDrawerHeader,
  type DrawerHeaderProps,
} from '@fluentui/react-headless-components-preview/drawer';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DrawerHeader.module.css';

export type {
  DrawerHeaderProps,
  DrawerHeaderSlots,
  DrawerHeaderState,
} from '@fluentui/react-headless-components-preview/drawer';

export const drawerHeaderClassNames = { root: 'fui-DrawerHeader' } as const;

export const DrawerHeader: ForwardRefComponent<DrawerHeaderProps> = React.forwardRef<
  HTMLElement,
  DrawerHeaderProps
>(function DrawerHeader(props, ref) {
  const state = useDrawerHeader(props, ref);
  state.root.className = [drawerHeaderClassNames.root, styles.DrawerHeader, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderDrawerHeader(state);
});

DrawerHeader.displayName = 'DrawerHeader';
