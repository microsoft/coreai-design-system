// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPickerControl,
  useTagPickerContext_unstable,
  useTagPickerControl,
  type TagPickerControlProps,
} from '@fluentui/react-headless-components-preview/tag-picker';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './TagPickerControl.module.css';

export type {
  TagPickerControlInternalSlots,
  TagPickerControlProps,
  TagPickerControlSlots,
  TagPickerControlState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export const tagPickerControlClassNames = {
  root: 'fui-TagPickerControl',
  expandIcon: 'fui-TagPickerControl__expandIcon',
  secondaryAction: 'fui-TagPickerControl__secondaryAction',
  aside: 'fui-TagPickerControl__aside',
} as const;

export const TagPickerControl: ForwardRefComponent<TagPickerControlProps> = React.forwardRef<
  HTMLDivElement,
  TagPickerControlProps
>(function TagPickerControl(props, ref) {
  const appearance = useTagPickerContext_unstable((context) => context.appearance);
  const size = useTagPickerContext_unstable((context) => context.size);
  const noPopover = useTagPickerContext_unstable((context) => context.noPopover);
  const state = useTagPickerControl(
    !noPopover && props.expandIcon === undefined
      ? { ...props, expandIcon: <ChevronDownRegular aria-hidden /> }
      : props,
    ref,
  );
  Object.assign(state.root, { 'data-appearance': appearance, 'data-size': size });
  state.root.className = [
    tagPickerControlClassNames.root,
    styles.TagPickerControl,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  for (const name of ['expandIcon', 'secondaryAction', 'aside'] as const) {
    const resolved = state[name];
    if (!resolved) continue;
    Object.assign(resolved, {
      'data-size': size,
      'data-disabled': state.disabled ? '' : undefined,
    });
    resolved.className = [
      tagPickerControlClassNames[name],
      styles[`TagPickerControl__${name}`],
      resolved.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderTagPickerControl(state);
});

TagPickerControl.displayName = 'TagPickerControl';
