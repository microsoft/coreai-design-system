// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPickerOptionGroup,
  useTagPickerOptionGroup,
  type TagPickerOptionGroupProps,
} from '@fluentui/react-headless-components-preview/tag-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { optionGroupClassNames } from './OptionGroup.js';
import styles from './TagPickerOptionGroup.module.css';

export type {
  TagPickerOptionGroupProps,
  TagPickerOptionGroupSlots,
  TagPickerOptionGroupState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export const tagPickerOptionGroupClassNames = {
  root: 'fui-TagPickerOptionGroup',
  label: 'fui-TagPickerOptionGroup__label',
} as const;

export const TagPickerOptionGroup: ForwardRefComponent<TagPickerOptionGroupProps> =
  React.forwardRef<HTMLDivElement, TagPickerOptionGroupProps>(
    function TagPickerOptionGroup(props, ref) {
      const state = useTagPickerOptionGroup(props, ref);
      state.root.className = [
        optionGroupClassNames.root,
        tagPickerOptionGroupClassNames.root,
        styles.TagPickerOptionGroup,
        state.root.className,
      ]
        .filter(Boolean)
        .join(' ');
      if (state.label) {
        state.label.className = [
          optionGroupClassNames.label,
          tagPickerOptionGroupClassNames.label,
          styles.TagPickerOptionGroup__label,
          state.label.className,
        ]
          .filter(Boolean)
          .join(' ');
      }
      return renderTagPickerOptionGroup(state);
    },
  );

TagPickerOptionGroup.displayName = 'TagPickerOptionGroup';
