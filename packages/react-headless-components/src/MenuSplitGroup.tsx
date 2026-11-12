// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuSplitGroup,
  useMenuSplitGroup,
  useMenuSplitGroupContextValues,
  type MenuSplitGroupProps,
} from '@fluentui/react-headless-components-preview/menu';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MenuSplitGroup.module.css';

export { useMenuSplitGroupContextValues } from '@fluentui/react-headless-components-preview/menu';
export type {
  MenuSplitGroupContextValues,
  MenuSplitGroupProps,
  MenuSplitGroupSlots,
  MenuSplitGroupState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuSplitGroupClassNames = { root: 'fui-MenuSplitGroup' } as const;

export const MenuSplitGroup: ForwardRefComponent<MenuSplitGroupProps> = React.forwardRef<
  HTMLDivElement,
  MenuSplitGroupProps
>(function MenuSplitGroup(props, ref) {
  const state = useMenuSplitGroup(props, ref);
  state.root.className = [
    menuSplitGroupClassNames.root,
    styles.MenuSplitGroup,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderMenuSplitGroup(state, useMenuSplitGroupContextValues(state));
});

MenuSplitGroup.displayName = 'MenuSplitGroup';
