// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuList,
  useMenuList,
  useMenuListContextValues,
  type MenuListProps,
} from '@fluentui/react-headless-components-preview/menu';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MenuList.module.css';

export { useMenuListContextValues } from '@fluentui/react-headless-components-preview/menu';
export type {
  MenuListProps,
  MenuListSlots,
  MenuListState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuListClassNames = { root: 'fui-MenuList' } as const;

export const MenuList: ForwardRefComponent<MenuListProps> = React.forwardRef<
  HTMLDivElement,
  MenuListProps
>(function MenuList(props, ref) {
  const state = useMenuList(props, ref);
  state.root.className = [menuListClassNames.root, styles.MenuList, state.root.className]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.root, {
    'data-menu-context': state.hasMenuContext ? '' : undefined,
  });
  return renderMenuList(state, useMenuListContextValues(state));
});

MenuList.displayName = 'MenuList';
