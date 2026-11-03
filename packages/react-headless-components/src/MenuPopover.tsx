// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMenuPopover,
  useMenuPopover,
  type MenuPopoverProps,
} from '@fluentui/react-headless-components-preview/menu';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import styles from './MenuPopover.module.css';
import overrides from './MenuPopover.overrides.module.css';

export type {
  MenuPopoverProps,
  MenuPopoverSlots,
  MenuPopoverState,
} from '@fluentui/react-headless-components-preview/menu';

export const menuPopoverClassNames = { root: 'fui-MenuPopover' } as const;

export const MenuPopover: ForwardRefComponent<MenuPopoverProps> = React.forwardRef<
  HTMLDivElement,
  MenuPopoverProps
>(function MenuPopover(props, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const state = useMenuPopover(props, ref);
  state.root.className = [
    menuPopoverClassNames.root,
    styles.MenuPopover,
    defaultsEnabled && overrides.MenuPopover,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.root, {
    'data-coreai-defaults': defaultsEnabled ? '' : undefined,
  });
  return renderMenuPopover(state);
});

MenuPopover.displayName = 'MenuPopover';
