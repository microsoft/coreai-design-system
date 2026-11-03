// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAvatarGroupItem,
  useAvatarGroupContext,
  useAvatarGroupItem,
  type AvatarGroupItemProps as HeadlessAvatarGroupItemProps,
  type AvatarGroupItemSlots as HeadlessAvatarGroupItemSlots,
} from '@fluentui/react-headless-components-preview/avatar-group';
import { Avatar as HeadlessAvatar } from '@fluentui/react-headless-components-preview/avatar';
import {
  slot,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { Avatar, type AvatarColor, type AvatarProps } from './Avatar.js';
import groupStyles from './AvatarGroup.module.css';
import styles from './AvatarGroupItem.module.css';
import overrides from './AvatarGroupItem.overrides.module.css';

export type { AvatarGroupItemState } from '@fluentui/react-headless-components-preview/avatar-group';

export const avatarGroupItemClassNames = {
  root: 'fui-AvatarGroupItem',
  avatar: 'fui-AvatarGroupItem__avatar',
  overflowLabel: 'fui-AvatarGroupItem__overflowLabel',
} as const;

export type AvatarGroupItemColor = Exclude<AvatarColor, 'neutral-alt'>;
export type AvatarGroupItemAvatarProps = Omit<AvatarProps, 'color'> & {
  color?: AvatarGroupItemColor;
};
export type AvatarGroupItemSlots = Omit<HeadlessAvatarGroupItemSlots, 'avatar'> & {
  avatar: NonNullable<Slot<ForwardRefComponent<AvatarGroupItemAvatarProps>>>;
};
export type AvatarGroupItemProps = Omit<HeadlessAvatarGroupItemProps, 'avatar' | 'badge'> &
  Pick<Partial<AvatarGroupItemSlots>, 'avatar'> &
  Pick<AvatarGroupItemAvatarProps, 'color' | 'idForColor' | 'badge'>;

function resolveAvatar(
  value: AvatarGroupItemProps['avatar'],
  defaultProps: Partial<AvatarGroupItemAvatarProps>,
) {
  const resolved = slot.always<AvatarGroupItemAvatarProps>(value, {
    defaultProps,
    elementType: HeadlessAvatar,
  });
  const original = slot.resolveShorthand(value);
  const render: SlotRenderFunction<AvatarGroupItemAvatarProps> = (_Component, props) =>
    typeof original?.children === 'function' ? (
      original.children(Avatar, props)
    ) : (
      <Avatar {...props} />
    );
  return slot.always<AvatarGroupItemAvatarProps>(
    { children: render },
    { defaultProps: resolved, elementType: HeadlessAvatar },
  );
}

export const AvatarGroupItem: ForwardRefComponent<AvatarGroupItemProps> = React.forwardRef<
  HTMLSpanElement,
  AvatarGroupItemProps
>(function AvatarGroupItem({ color = 'colorful', idForColor, avatar, ...props }, ref) {
  const size = useAvatarGroupContext((context) => context.size) ?? 32;
  const state = useAvatarGroupItem({ ...props, avatar }, ref);
  state.avatar = resolveAvatar(avatar, { color, idForColor, size, ...state.avatar });

  Object.assign(state.root, {
    'data-size': size,
    'data-layout': state.layout,
    'data-overflow': state.isOverflowItem ? '' : undefined,
  });
  state.root.className = [
    avatarGroupItemClassNames.root,
    styles.AvatarGroupItem,
    overrides.AvatarGroupItem,
    !state.isOverflowItem && groupStyles.AvatarGroup__size,
    !state.isOverflowItem && groupStyles.AvatarGroup__child,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.avatar.className = [
    avatarGroupItemClassNames.avatar,
    styles.AvatarGroupItem__avatar,
    overrides.AvatarGroupItem__avatar,
    state.avatar.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.overflowLabel.className = [
    avatarGroupItemClassNames.overflowLabel,
    styles.AvatarGroupItem__overflowLabel,
    state.overflowLabel.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderAvatarGroupItem(state);
});

AvatarGroupItem.displayName = 'AvatarGroupItem';
