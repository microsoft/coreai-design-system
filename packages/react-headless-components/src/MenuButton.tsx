// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuButton,
  useMenuButton,
  type MenuButtonProps as HeadlessMenuButtonProps,
} from '@fluentui/react-headless-components-preview/menu-button';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import { slot, type ForwardRefComponent } from '@fluentui/react-utilities';
import {
  applyButtonVariantStyles,
  useButtonVariantVisuals,
  type ButtonVariantVisualProps,
} from './ButtonVariants.js';
import styles from './MenuButton.module.css';

export const menuButtonClassNames = {
  root: 'fui-MenuButton',
  icon: 'fui-MenuButton__icon',
  menuIcon: 'fui-MenuButton__menuIcon',
} as const;

export type MenuButtonProps = HeadlessMenuButtonProps & ButtonVariantVisualProps;
export type { MenuButtonSlots } from '@fluentui/react-headless-components-preview/menu-button';

export const MenuButton: ForwardRefComponent<MenuButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  MenuButtonProps
>(function MenuButton(componentProps, ref) {
  const { appearance, shape, size, ...props } = componentProps;
  const visuals = useButtonVariantVisuals(
    { appearance, shape, size },
    Object.prototype.hasOwnProperty.call(componentProps, 'shape'),
  );
  const menuIcon = slot.optional(props.menuIcon, {
    defaultProps: { children: <ChevronDownRegular /> },
    renderByDefault: true,
    elementType: 'span',
  });
  const state = useMenuButton({ ...props, menuIcon }, ref);
  applyButtonVariantStyles(state, visuals, menuButtonClassNames, {
    root: styles.MenuButton,
    icon: styles.MenuButton__icon,
  });
  Object.assign(state.root, {
    'data-icon-position': state.icon ? 'before' : undefined,
  });
  if (state.menuIcon) {
    state.menuIcon.className = [
      menuButtonClassNames.menuIcon,
      styles.MenuButton__menuIcon,
      state.menuIcon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderMenuButton(state);
});

MenuButton.displayName = 'MenuButton';
