// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPickerOption,
  useTagPickerOption,
  type TagPickerOptionProps,
} from '@fluentui/react-headless-components-preview/tag-picker';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { optionClassNames } from './Option.js';
import styles from './TagPickerOption.module.css';

export type {
  TagPickerOptionProps,
  TagPickerOptionSlots,
  TagPickerOptionState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export const tagPickerOptionClassNames = {
  root: 'fui-TagPickerOption',
  media: 'fui-TagPickerOption__media',
  secondaryContent: 'fui-TagPickerOption__secondaryContent',
} as const;

export const TagPickerOption: ForwardRefComponent<TagPickerOptionProps> = React.forwardRef<
  HTMLDivElement,
  TagPickerOptionProps
>(function TagPickerOption(props, ref) {
  const state = useTagPickerOption(props, ref);
  Object.assign(state.root, {
    'data-has-media': state.media ? '' : undefined,
    'data-has-secondary-content': state.secondaryContent ? '' : undefined,
  });
  state.root.className = [
    optionClassNames.root,
    tagPickerOptionClassNames.root,
    styles.TagPickerOption,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  for (const name of ['media', 'secondaryContent'] as const) {
    const resolved = state[name];
    if (!resolved) continue;
    resolved.className = [
      tagPickerOptionClassNames[name],
      styles[`TagPickerOption__${name}`],
      resolved.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderTagPickerOption(state);
});

TagPickerOption.displayName = 'TagPickerOption';
