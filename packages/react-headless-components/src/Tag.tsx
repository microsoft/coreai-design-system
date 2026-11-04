// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTag,
  useTag,
  useTagContextValues,
  type TagProps as HeadlessTagProps,
} from '@fluentui/react-headless-components-preview/tag';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import {
  TagGroupVisualContext,
  tagAvatarShapes,
  tagAvatarSizes,
  type TagVisualOptions,
} from './TagVisualContext.js';
import { applyTagVisualSlots } from './TagVisualStyles.js';
import styles from './Tag.module.css';

export { useTagContextValues } from '@fluentui/react-headless-components-preview/tag';
export type {
  TagContextValues,
  TagSlots,
  TagState,
} from '@fluentui/react-headless-components-preview/tag';
export type { TagAppearance, TagShape, TagSize } from './TagVisualContext.js';
export type TagProps = HeadlessTagProps & TagVisualOptions;

export const tagClassNames = {
  root: 'fui-Tag',
  media: 'fui-Tag__media',
  icon: 'fui-Tag__icon',
  primaryText: 'fui-Tag__primaryText',
  secondaryText: 'fui-Tag__secondaryText',
  dismissIcon: 'fui-Tag__dismissIcon',
} as const;

export const Tag: ForwardRefComponent<TagProps> = React.forwardRef<
  HTMLSpanElement | HTMLButtonElement,
  TagProps
>(function Tag({ appearance: appearanceProp, shape = 'rounded', size: sizeProp, ...props }, ref) {
  const context = React.useContext(TagGroupVisualContext);
  const appearance = appearanceProp ?? context.appearance;
  const size = sizeProp ?? context.size;
  const defaultsEnabled = useCoreAIDefaults();
  const state = {
    ...useTag(props, ref),
    appearance,
    shape,
    size,
    avatarShape: tagAvatarShapes[shape],
    avatarSize: tagAvatarSizes[size],
  };
  if (state.dismissIcon) {
    state.dismissIcon.children ??= <DismissRegular className={styles.Tag__glyph} />;
  }
  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-shape': shape,
    'data-size': size,
    'data-has-media': state.media || state.icon ? '' : undefined,
    'data-has-dismiss': state.dismissIcon ? '' : undefined,
    'data-coreai-defaults': defaultsEnabled ? '' : undefined,
  });
  state.root.className = [tagClassNames.root, styles.Tag, state.root.className]
    .filter(Boolean)
    .join(' ');
  applyTagVisualSlots(
    state,
    size,
    tagClassNames,
    {
      media: styles.Tag__media,
      icon: styles.Tag__icon,
      primaryText: styles.Tag__primaryText,
      secondaryText: styles.Tag__secondaryText,
    },
    defaultsEnabled,
  );
  if (state.dismissIcon) {
    state.dismissIcon.className = [
      tagClassNames.dismissIcon,
      styles.Tag__dismissIcon,
      state.dismissIcon.className,
    ]
      .filter(Boolean)
      .join(' ');
    Object.assign(state.dismissIcon, {
      'data-size': size,
      'data-disabled': state.disabled ? '' : undefined,
      'data-selected': state.selected ? '' : undefined,
    });
  }
  return renderTag(state, useTagContextValues(state));
});

Tag.displayName = 'Tag';
