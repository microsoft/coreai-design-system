// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDrawerHeaderTitle,
  useDrawerHeaderTitle,
  type DrawerHeaderTitleProps,
} from '@fluentui/react-headless-components-preview/drawer';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DrawerHeaderTitle.module.css';

export type {
  DrawerHeaderTitleProps,
  DrawerHeaderTitleSlots,
  DrawerHeaderTitleState,
} from '@fluentui/react-headless-components-preview/drawer';

export const drawerHeaderTitleClassNames = {
  root: 'fui-DrawerHeaderTitle',
  heading: 'fui-DrawerHeaderTitle__heading',
  action: 'fui-DrawerHeaderTitle__action',
} as const;

export const DrawerHeaderTitle: ForwardRefComponent<DrawerHeaderTitleProps> = React.forwardRef<
  HTMLDivElement,
  DrawerHeaderTitleProps
>(function DrawerHeaderTitle(props, ref) {
  const state = useDrawerHeaderTitle(props, ref);
  Object.assign(state.root, { 'data-has-action': state.action ? '' : undefined });
  state.root.className = [
    drawerHeaderTitleClassNames.root,
    styles.DrawerHeaderTitle,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.heading) {
    state.heading.className = [
      'fui-DialogTitle',
      drawerHeaderTitleClassNames.heading,
      styles.DrawerHeaderTitle__heading,
      state.heading.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.action) {
    state.action.className = [
      'fui-DialogTitle__action',
      drawerHeaderTitleClassNames.action,
      styles.DrawerHeaderTitle__action,
      state.action.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderDrawerHeaderTitle(state);
});

DrawerHeaderTitle.displayName = 'DrawerHeaderTitle';
