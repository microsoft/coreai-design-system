// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuGroupHeader,
  useMenuGroupHeader,
  type MenuGroupHeaderProps,
} from '@fluentui/react-headless-components-preview/menu';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MenuGroupHeader.module.css';

export type {
  MenuGroupHeaderProps,
  MenuGroupHeaderSlots,
  MenuGroupHeaderState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuGroupHeaderClassNames = { root: 'fui-MenuGroupHeader' } as const;

export const MenuGroupHeader: ForwardRefComponent<MenuGroupHeaderProps> = React.forwardRef<
  HTMLDivElement,
  MenuGroupHeaderProps
>(function MenuGroupHeader(props, ref) {
  const state = useMenuGroupHeader(props, ref);
  state.root.className = [
    menuGroupHeaderClassNames.root,
    styles.MenuGroupHeader,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderMenuGroupHeader(state);
});

MenuGroupHeader.displayName = 'MenuGroupHeader';
