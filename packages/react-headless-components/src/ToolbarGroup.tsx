// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbarGroup,
  useToolbarGroup,
  type ToolbarGroupProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ToolbarGroup.module.css';

export type {
  ToolbarGroupProps,
  ToolbarGroupState,
} from '@fluentui/react-headless-components-preview/toolbar';

export const toolbarGroupClassNames = { root: 'fui-ToolbarGroup' } as const;

export const ToolbarGroup: ForwardRefComponent<ToolbarGroupProps> = React.forwardRef<
  HTMLDivElement,
  ToolbarGroupProps
>(function ToolbarGroup(props, ref) {
  const state = useToolbarGroup(props, ref);
  state.root.className = [toolbarGroupClassNames.root, styles.ToolbarGroup, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderToolbarGroup(state);
});

ToolbarGroup.displayName = 'ToolbarGroup';
