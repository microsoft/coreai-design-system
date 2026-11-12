// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPickerList,
  useTagPickerList,
  type TagPickerListProps,
} from '@fluentui/react-headless-components-preview/tag-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { resolveListboxSlot } from './Listbox.js';
import styles from './TagPickerList.module.css';

export type {
  TagPickerListProps,
  TagPickerListSlots,
  TagPickerListState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export const tagPickerListClassNames = { root: 'fui-TagPickerList' } as const;

export const TagPickerList: ForwardRefComponent<TagPickerListProps> = React.forwardRef<
  HTMLDivElement,
  TagPickerListProps
>(function TagPickerList(props, ref) {
  const state = useTagPickerList(props, ref);
  state.root = resolveListboxSlot(props, state.root) ?? state.root;
  Object.assign(state.root, { 'data-open': state.open ? '' : undefined });
  state.root.className = [tagPickerListClassNames.root, styles.TagPickerList, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderTagPickerList(state);
});

TagPickerList.displayName = 'TagPickerList';
