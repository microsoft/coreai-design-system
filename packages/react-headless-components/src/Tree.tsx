// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTree,
  useTree,
  useTreeContextValues,
  type TreeProps as HeadlessTreeProps,
} from '@fluentui/react-headless-components-preview/tree';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Tree.module.css';
import './Tree.overrides.module.css';

export {
  useSubtreeContext,
  useTreeContext,
} from '@fluentui/react-headless-components-preview/tree';
export type {
  SubtreeContextValue,
  TreeCheckedChangeData,
  TreeCheckedChangeEvent,
  TreeContextValue,
  TreeContextValues,
  TreeNavigationData,
  TreeNavigationDataParam,
  TreeNavigationEvent,
  TreeNavigationMode,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
  TreeSelectionValue,
  TreeSlots,
  TreeState,
} from '@fluentui/react-headless-components-preview/tree';

export type TreeSize = 'small' | 'medium';
export type TreeAppearance = 'subtle' | 'subtle-alpha' | 'transparent';

export type TreeProps = HeadlessTreeProps & {
  /** Item height and typography, shared with every nested item. Ignored on subtrees. @default 'medium' */
  size?: TreeSize;
  /** Item background treatment, shared with every nested item. Ignored on subtrees. @default 'subtle' */
  appearance?: TreeAppearance;
};

export const treeClassNames = {
  root: 'fui-Tree',
} as const;

export const Tree: ForwardRefComponent<TreeProps> = React.forwardRef<HTMLDivElement, TreeProps>(
  function Tree({ size = 'medium', appearance = 'subtle', ...props }, ref) {
    const state = useTree(props, ref);

    if (state.contextType !== 'subtree') {
      // useTreeContextValues reads design values from the root state when they are present,
      // so items read them back through useTreeContext like the v9 styled hooks do.
      Object.assign(state, { size, appearance });
      Object.assign(state.root, { 'data-size': size, 'data-appearance': appearance });
    }
    const contextValues = useTreeContextValues(state);

    state.root.className = [treeClassNames.root, styles.Tree, state.root.className]
      .filter(Boolean)
      .join(' ');

    return renderTree(state, contextValues);
  },
);

Tree.displayName = 'Tree';
