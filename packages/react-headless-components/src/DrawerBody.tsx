// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDrawerBody,
  useDrawerBody,
  type DrawerBodyProps,
} from '@fluentui/react-headless-components-preview/drawer';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DrawerBody.module.css';

export type {
  DrawerBodyProps,
  DrawerBodySlots,
  DrawerBodyState,
} from '@fluentui/react-headless-components-preview/drawer';

export const drawerBodyClassNames = { root: 'fui-DrawerBody' } as const;

export const DrawerBody: ForwardRefComponent<DrawerBodyProps> = React.forwardRef<
  HTMLDivElement,
  DrawerBodyProps
>(function DrawerBody(props, ref) {
  const state = useDrawerBody(props, ref);
  state.root.className = [drawerBodyClassNames.root, styles.DrawerBody, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderDrawerBody(state);
});

DrawerBody.displayName = 'DrawerBody';
