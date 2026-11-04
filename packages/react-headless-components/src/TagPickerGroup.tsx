// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPickerGroup,
  useTagPickerContext_unstable,
  useTagPickerGroup,
  useTagPickerGroupContextValues,
  type TagPickerGroupProps,
} from '@fluentui/react-headless-components-preview/tag-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { tagGroupClassNames } from './TagGroup.js';
import { TagGroupVisualContext, type TagSize } from './TagVisualContext.js';
import styles from './TagPickerGroup.module.css';

export { useTagPickerGroupContextValues } from '@fluentui/react-headless-components-preview/tag-picker';
export type {
  TagPickerGroupProps,
  TagPickerGroupSlots,
  TagPickerGroupState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export const tagPickerGroupClassNames = { root: 'fui-TagPickerGroup' } as const;

const tagSizes = {
  medium: 'extra-small',
  large: 'small',
  'extra-large': 'medium',
} as const satisfies Record<'medium' | 'large' | 'extra-large', TagSize>;

export const TagPickerGroup: ForwardRefComponent<TagPickerGroupProps> = React.forwardRef<
  HTMLDivElement,
  TagPickerGroupProps
>(function TagPickerGroup(props, ref) {
  const pickerSize = useTagPickerContext_unstable((context) => context.size);
  const pickerAppearance = useTagPickerContext_unstable((context) => context.appearance);
  const size = tagSizes[pickerSize];
  const appearance = pickerAppearance === 'filled-darker' ? 'outline' : 'filled';
  const state = useTagPickerGroup(props, ref);
  Object.assign(state.root, {
    'data-size': size,
    'data-picker-size': pickerSize,
    'data-appearance': appearance,
  });
  state.root.className = [
    tagGroupClassNames.root,
    tagPickerGroupClassNames.root,
    styles.TagPickerGroup,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <TagGroupVisualContext.Provider value={{ size, appearance }}>
      {renderTagPickerGroup(state, useTagPickerGroupContextValues(state))}
    </TagGroupVisualContext.Provider>
  );
});

TagPickerGroup.displayName = 'TagPickerGroup';
