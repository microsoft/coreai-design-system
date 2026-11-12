// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderList,
  useList,
  useListContextValues,
  type ListProps,
} from '@fluentui/react-headless-components-preview/list';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './List.module.css';

export {
  useListContext,
  useListContextValues,
} from '@fluentui/react-headless-components-preview/list';
export type {
  ListContextValue,
  ListContextValues,
  ListNavigationMode,
  ListProps,
  ListSlots,
  ListState,
  OnListSelectionChangeData,
} from '@fluentui/react-headless-components-preview/list';

export const listClassNames = { root: 'fui-List' } as const;

export const List: ForwardRefComponent<ListProps> = React.forwardRef<
  HTMLDivElement | HTMLUListElement | HTMLOListElement,
  ListProps
>(function List(props, ref) {
  const state = useList(props, ref);
  const contextValues = useListContextValues(state);
  state.root.className = [listClassNames.root, styles.List, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderList(state, contextValues);
});

List.displayName = 'List';
