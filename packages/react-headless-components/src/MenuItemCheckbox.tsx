// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuItemCheckbox,
  useMenuItemCheckbox,
  type MenuItemCheckboxProps,
} from '@fluentui/react-headless-components-preview/menu';
import { Checkmark16Filled } from '@fluentui/react-icons/headless/svg/checkmark';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyMenuItemVisualStyles } from './MenuVisualStyles.js';
import styles from './MenuItem.module.css';

export type {
  MenuItemCheckboxProps,
  MenuItemCheckboxState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuItemCheckboxClassNames = {
  root: 'fui-MenuItemCheckbox',
  icon: 'fui-MenuItemCheckbox__icon',
  checkmark: 'fui-MenuItemCheckbox__checkmark',
  content: 'fui-MenuItemCheckbox__content',
  secondaryContent: 'fui-MenuItemCheckbox__secondaryContent',
  subText: 'fui-MenuItemCheckbox__subText',
} as const;

export const MenuItemCheckbox: ForwardRefComponent<MenuItemCheckboxProps> = React.forwardRef<
  HTMLDivElement,
  MenuItemCheckboxProps
>(function MenuItemCheckbox(props, ref) {
  const state = useMenuItemCheckbox(props, ref);
  if (state.checkmark) {
    state.checkmark.children ??= <Checkmark16Filled className={styles.MenuItem__glyph} />;
  }
  applyMenuItemVisualStyles(state, menuItemCheckboxClassNames);
  return renderMenuItemCheckbox(state);
});

MenuItemCheckbox.displayName = 'MenuItemCheckbox';
