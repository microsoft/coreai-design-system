// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuItemRadio,
  useMenuItemRadio,
  type MenuItemRadioProps,
} from '@fluentui/react-headless-components-preview/menu';
import { Checkmark16Filled } from '@fluentui/react-icons/headless/svg/checkmark';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyMenuItemVisualStyles } from './MenuVisualStyles.js';
import styles from './MenuItem.module.css';

export type {
  MenuItemRadioProps,
  MenuItemRadioState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuItemRadioClassNames = {
  root: 'fui-MenuItemRadio',
  icon: 'fui-MenuItemRadio__icon',
  checkmark: 'fui-MenuItemRadio__checkmark',
  content: 'fui-MenuItemRadio__content',
  secondaryContent: 'fui-MenuItemRadio__secondaryContent',
  subText: 'fui-MenuItemRadio__subText',
} as const;

export const MenuItemRadio: ForwardRefComponent<MenuItemRadioProps> = React.forwardRef<
  HTMLDivElement,
  MenuItemRadioProps
>(function MenuItemRadio(props, ref) {
  const state = useMenuItemRadio(props, ref);
  if (state.checkmark) {
    state.checkmark.children ??= <Checkmark16Filled className={styles.MenuItem__glyph} />;
  }
  applyMenuItemVisualStyles(state, menuItemRadioClassNames);
  return renderMenuItemRadio(state);
});

MenuItemRadio.displayName = 'MenuItemRadio';
