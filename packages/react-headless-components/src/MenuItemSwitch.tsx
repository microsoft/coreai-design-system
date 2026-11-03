// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuItemSwitch,
  useMenuItemSwitch,
  type MenuItemSwitchProps,
} from '@fluentui/react-headless-components-preview/menu';
import { CircleFilled } from '@fluentui/react-icons/headless/svg/circle';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyMenuItemVisualStyles } from './MenuVisualStyles.js';
import styles from './MenuItemSwitch.module.css';

export type {
  MenuItemSwitchProps,
  MenuItemSwitchSlots,
  MenuItemSwitchState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuItemSwitchClassNames = {
  root: 'fui-MenuItemSwitch',
  icon: 'fui-MenuItemSwitch__icon',
  content: 'fui-MenuItemSwitch__content',
  secondaryContent: 'fui-MenuItemSwitch__secondaryContent',
  switchIndicator: 'fui-MenuItemSwitch__switchIndicator',
  subText: 'fui-MenuItemSwitch__subText',
} as const;

export const MenuItemSwitch: ForwardRefComponent<MenuItemSwitchProps> = React.forwardRef<
  HTMLDivElement,
  MenuItemSwitchProps
>(function MenuItemSwitch(props, ref) {
  const state = useMenuItemSwitch(props, ref);
  applyMenuItemVisualStyles(state, menuItemSwitchClassNames);
  if (state.switchIndicator) {
    state.switchIndicator.children ??= (
      <CircleFilled
        className={`${styles.MenuItemSwitch__thumb} fui-MenuItemSwitch__switchIndicator__circleFilled`}
      />
    );
    state.switchIndicator.className = [
      menuItemSwitchClassNames.switchIndicator,
      styles.MenuItemSwitch__switchIndicator,
      state.switchIndicator.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderMenuItemSwitch(state);
});

MenuItemSwitch.displayName = 'MenuItemSwitch';
