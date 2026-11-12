// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagGroup,
  useTagGroup,
  useTagGroupContextValues,
  type TagGroupProps as HeadlessTagGroupProps,
} from '@fluentui/react-headless-components-preview/tag-group';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { TagGroupVisualContext, type TagVisualOptions } from './TagVisualContext.js';
import styles from './TagGroup.module.css';

export { useTagGroupContextValues } from '@fluentui/react-headless-components-preview/tag-group';
export type {
  TagGroupContextValues,
  TagGroupSlots,
  TagGroupState,
} from '@fluentui/react-headless-components-preview/tag-group';

export type TagGroupProps = HeadlessTagGroupProps & Pick<TagVisualOptions, 'appearance' | 'size'>;

export const tagGroupClassNames = { root: 'fui-TagGroup' } as const;

export const TagGroup: ForwardRefComponent<TagGroupProps> = React.forwardRef<
  HTMLDivElement,
  TagGroupProps
>(function TagGroup({ appearance = 'filled', size = 'medium', ...props }, ref) {
  const state = { ...useTagGroup(props, ref), appearance, size };
  state.root.className = [tagGroupClassNames.root, styles.TagGroup, state.root.className]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.root, { 'data-size': size, 'data-appearance': appearance });
  return (
    <TagGroupVisualContext.Provider value={{ appearance, size }}>
      {renderTagGroup(state, useTagGroupContextValues(state))}
    </TagGroupVisualContext.Provider>
  );
});

TagGroup.displayName = 'TagGroup';
