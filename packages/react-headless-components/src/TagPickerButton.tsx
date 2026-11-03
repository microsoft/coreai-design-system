// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPickerButton,
  useTagPickerButton,
  useTagPickerContext_unstable,
  type TagPickerButtonProps as HeadlessTagPickerButtonProps,
} from '@fluentui/react-headless-components-preview/tag-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { TagPickerAppearance } from './TagPicker.js';
import styles from './TagPickerButton.module.css';

export type {
  TagPickerButtonSlots,
  TagPickerButtonState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export type TagPickerButtonProps = HeadlessTagPickerButtonProps & {
  /** Retained visual prop; the enclosing TagPicker controls the appearance. */
  appearance?: TagPickerAppearance;
  /** Retained visual prop; actual sizing comes from the enclosing TagPicker. */
  size?: 'small' | 'medium' | 'large';
};

export const tagPickerButtonClassNames = { root: 'fui-TagPickerButton' } as const;

export const TagPickerButton: ForwardRefComponent<TagPickerButtonProps> = React.forwardRef<
  HTMLButtonElement,
  TagPickerButtonProps
>(function TagPickerButton({ appearance: _appearance, size: _size, ...props }, ref) {
  const size = useTagPickerContext_unstable((context) => context.size);
  const state = useTagPickerButton(props, ref);
  Object.assign(state.root, {
    'data-size': size,
    'data-has-selected-option': state.hasSelectedOption ? '' : undefined,
  });
  state.root.className = [
    tagPickerButtonClassNames.root,
    styles.TagPickerButton,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderTagPickerButton(state);
});

TagPickerButton.displayName = 'TagPickerButton';
