// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// @fluentui/react-menu 9.25.8 adds only its stable marker, with no CoreAI override/default.
// Local source: [useMenuGroupStyles.styles.raw.js](../../../node_modules/@fluentui/react-menu/lib/components/MenuGroup/useMenuGroupStyles.styles.raw.js).

import * as React from 'react';
import {
  renderMenuGroup,
  useMenuGroup,
  useMenuGroupContextValues,
  type MenuGroupProps,
} from '@fluentui/react-headless-components-preview/menu';
import type { ForwardRefComponent } from '@fluentui/react-utilities';

export { useMenuGroupContextValues } from '@fluentui/react-headless-components-preview/menu';
export type {
  MenuGroupContextValues,
  MenuGroupProps,
  MenuGroupSlots,
  MenuGroupState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuGroupClassNames = { root: 'fui-MenuGroup' } as const;

export const MenuGroup: ForwardRefComponent<MenuGroupProps> = React.forwardRef<
  HTMLDivElement,
  MenuGroupProps
>(function MenuGroup(props, ref) {
  const state = useMenuGroup(props, ref);
  state.root.className = [menuGroupClassNames.root, state.root.className].filter(Boolean).join(' ');
  return renderMenuGroup(state, useMenuGroupContextValues(state));
});

MenuGroup.displayName = 'MenuGroup';
