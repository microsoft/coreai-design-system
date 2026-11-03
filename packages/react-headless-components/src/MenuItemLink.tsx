// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuItemLink,
  useMenuItemLink,
  type MenuItemLinkProps,
} from '@fluentui/react-headless-components-preview/menu';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyMenuItemVisualStyles } from './MenuVisualStyles.js';
import styles from './MenuItemLink.module.css';

export type {
  MenuItemLinkProps,
  MenuItemLinkSlots,
  MenuItemLinkState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuItemLinkClassNames = {
  root: 'fui-MenuItemLink',
  icon: 'fui-MenuItemLink__icon',
  checkmark: 'fui-MenuItemLink__checkmark',
  content: 'fui-MenuItemLink__content',
  secondaryContent: 'fui-MenuItemLink__secondaryContent',
} as const;

export const MenuItemLink: ForwardRefComponent<MenuItemLinkProps> = React.forwardRef<
  HTMLAnchorElement,
  MenuItemLinkProps
>(function MenuItemLink(props, ref) {
  const state = useMenuItemLink(props, ref);
  applyMenuItemVisualStyles(state, menuItemLinkClassNames);
  state.root.className = [styles.MenuItemLink, state.root.className].filter(Boolean).join(' ');
  return renderMenuItemLink(state);
});

MenuItemLink.displayName = 'MenuItemLink';
