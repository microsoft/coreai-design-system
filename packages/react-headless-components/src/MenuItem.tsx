// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuItem,
  useMenuItem,
  type MenuItemProps,
} from '@fluentui/react-headless-components-preview/menu';
import { useFluent_unstable as useFluent } from '@fluentui/react-shared-contexts';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyMenuItemVisualStyles } from './MenuVisualStyles.js';
import { MenuSubmenuGlyph } from './MenuVisualGlyphs.js';

export { menuItemClassNames } from './MenuVisualStyles.js';
export type {
  MenuItemProps,
  MenuItemSlots,
  MenuItemState,
} from '@fluentui/react-headless-components-preview/menu';

export const MenuItem: ForwardRefComponent<MenuItemProps> = React.forwardRef<
  HTMLDivElement,
  MenuItemProps
>(function MenuItem(props, ref) {
  const { dir } = useFluent();
  const state = useMenuItem(props, ref);
  if (state.submenuIndicator) {
    state.submenuIndicator.children ??= <MenuSubmenuGlyph dir={dir} />;
  }
  applyMenuItemVisualStyles(state);
  return renderMenuItem(state);
});

MenuItem.displayName = 'MenuItem';
