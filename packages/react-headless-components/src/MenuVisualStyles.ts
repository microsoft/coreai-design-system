// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Shared selection from @fluentui/react-menu 9.25.8:
// [useMenuItemStyles.styles.raw.js](../../../node_modules/@fluentui/react-menu/lib/components/MenuItem/useMenuItemStyles.styles.raw.js).

import styles from './MenuItem.module.css';

export const menuItemClassNames = {
  root: 'fui-MenuItem',
  icon: 'fui-MenuItem__icon',
  checkmark: 'fui-MenuItem__checkmark',
  submenuIndicator: 'fui-MenuItem__submenuIndicator',
  content: 'fui-MenuItem__content',
  secondaryContent: 'fui-MenuItem__secondaryContent',
  subText: 'fui-MenuItem__subText',
} as const;

type VisualSlot = { className?: string };
type ItemVisualState = {
  root: VisualSlot;
  icon?: VisualSlot;
  checkmark?: VisualSlot;
  submenuIndicator?: VisualSlot;
  content?: VisualSlot;
  secondaryContent?: VisualSlot;
  subText?: VisualSlot;
};
type ItemClassNames = Partial<Record<keyof ItemVisualState, string>>;

// All five styled MenuItem hooks delegate to the same MenuItem/checkmark foundation.
export function applyMenuItemVisualStyles(
  state: ItemVisualState,
  classNames: ItemClassNames = {},
): void {
  Object.assign(state.root, {
    'data-menu-item': '',
    'data-multiline': state.subText ? '' : undefined,
  });
  state.root.className = [
    menuItemClassNames.root,
    styles.MenuItem,
    classNames.root,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  const slots = [
    'icon',
    'checkmark',
    'submenuIndicator',
    'content',
    'secondaryContent',
    'subText',
  ] as const;
  for (const name of slots) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [
        menuItemClassNames[name],
        styles[`MenuItem__${name}`],
        classNames[name],
        resolved.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
  }
}
