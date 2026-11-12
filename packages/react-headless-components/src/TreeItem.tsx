// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTreeItem,
  useTreeItem,
  useTreeItemContextValues,
  type TreeItemProps,
} from '@fluentui/react-headless-components-preview/tree';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './TreeItem.module.css';
import './TreeItem.overrides.module.css';

export { useTreeItemContext } from '@fluentui/react-headless-components-preview/tree';
export type {
  TreeItemContextValues,
  TreeItemOpenChangeData,
  TreeItemOpenChangeEvent,
  TreeItemProps,
  TreeItemSlots,
  TreeItemState,
  TreeItemType,
  TreeItemValue,
} from '@fluentui/react-headless-components-preview/tree';

export const treeItemClassNames = {
  root: 'fui-TreeItem',
} as const;

/** Upstream indentation token (`treeItemLevelToken`), read by TreeItemLayout padding. */
const treeItemLevelVar = '--fluent-TreeItem--level';

export const TreeItem: ForwardRefComponent<TreeItemProps> = React.forwardRef<
  HTMLDivElement,
  TreeItemProps
>(function TreeItem(props, ref) {
  const state = useTreeItem(props, ref);
  const contextValues = useTreeItemContextValues(state);

  state.root.style = {
    [treeItemLevelVar]: state.level,
    ...state.root.style,
  } as React.CSSProperties;
  state.root.className = [treeItemClassNames.root, styles.TreeItem, state.root.className]
    .filter(Boolean)
    .join(' ');

  return renderTreeItem(state, contextValues);
});

TreeItem.displayName = 'TreeItem';
