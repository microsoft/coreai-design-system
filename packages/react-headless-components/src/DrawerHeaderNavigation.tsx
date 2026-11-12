// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDrawerHeaderNavigation,
  useDrawerHeaderNavigation,
  type DrawerHeaderNavigationProps,
} from '@fluentui/react-headless-components-preview/drawer';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DrawerHeaderNavigation.module.css';

export type {
  DrawerHeaderNavigationProps,
  DrawerHeaderNavigationSlots,
  DrawerHeaderNavigationState,
} from '@fluentui/react-headless-components-preview/drawer';

export const drawerHeaderNavigationClassNames = { root: 'fui-DrawerHeaderNavigation' } as const;

export const DrawerHeaderNavigation: ForwardRefComponent<DrawerHeaderNavigationProps> =
  React.forwardRef<HTMLElement, DrawerHeaderNavigationProps>(
    function DrawerHeaderNavigation(props, ref) {
      const state = useDrawerHeaderNavigation(props, ref);
      state.root.className = [
        drawerHeaderNavigationClassNames.root,
        styles.DrawerHeaderNavigation,
        state.root.className,
      ]
        .filter(Boolean)
        .join(' ');
      return renderDrawerHeaderNavigation(state);
    },
  );

DrawerHeaderNavigation.displayName = 'DrawerHeaderNavigation';
