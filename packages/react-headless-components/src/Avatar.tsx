// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAvatar,
  useAvatar,
  useAvatarContext,
  type AvatarProps as HeadlessAvatarProps,
  type AvatarSlots as HeadlessAvatarSlots,
} from '@fluentui/react-headless-components-preview/avatar';
import { PresenceBadge as UnstyledPresenceBadge } from '@fluentui/react-headless-components-preview/badge';
import {
  slot,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { PersonRegular } from '@fluentui/react-icons/headless/svg/person';
import { PresenceBadge, type PresenceBadgeProps } from './PresenceBadge.js';
import styles from './Avatar.module.css';
import overrides from './Avatar.overrides.module.css';

export const avatarClassNames = {
  root: 'fui-Avatar',
  image: 'fui-Avatar__image',
  initials: 'fui-Avatar__initials',
  icon: 'fui-Avatar__icon',
  badge: 'fui-Avatar__badge',
} as const;

const namedColors = [
  'dark-red',
  'cranberry',
  'red',
  'pumpkin',
  'peach',
  'marigold',
  'gold',
  'brass',
  'brown',
  'forest',
  'seafoam',
  'dark-green',
  'light-teal',
  'teal',
  'steel',
  'blue',
  'royal-blue',
  'cornflower',
  'navy',
  'lavender',
  'purple',
  'grape',
  'lilac',
  'pink',
  'magenta',
  'plum',
  'beige',
  'mink',
  'platinum',
  'anchor',
] as const;

export type AvatarNamedColor = (typeof namedColors)[number];
export type AvatarColor = 'neutral' | 'neutral-alt' | 'brand' | 'colorful' | AvatarNamedColor;
export type AvatarSize = 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128;
export type AvatarShape = 'circular' | 'square';
export type AvatarSlots = Omit<HeadlessAvatarSlots, 'badge'> & {
  badge?: Slot<typeof PresenceBadge>;
};

export type AvatarProps = Omit<HeadlessAvatarProps, 'color' | 'badge'> & {
  /** Presence uses the completed style-free PresenceBadge foundation. */
  badge?: AvatarSlots['badge'];
  /** CoreAI neutral backgrounds apply to initials/icon, not the image. @default 'neutral' */
  color?: AvatarColor;
  /** Inherits the public headless Avatar context when omitted. @default 32 */
  size?: AvatarSize;
  /** Inherits the public headless Avatar context when omitted. @default 'circular' */
  shape?: AvatarShape;
  /** Decoration for the hook's active/inactive state. @default 'ring' */
  activeAppearance?: 'ring' | 'shadow' | 'ring-shadow';
  /** Stable alternative to name when choosing a colorful palette entry. */
  idForColor?: string;
};

// Visual palette selection from react-avatar 9.11.9; name/initials behavior stays in useAvatar.
function resolveColor(color: AvatarColor, id: string): Exclude<AvatarColor, 'colorful'> {
  if (color !== 'colorful') return color;
  let hash = 0;
  for (let index = id.length - 1; index >= 0; index--) {
    const character = id.charCodeAt(index);
    const shift = index % 8;
    hash ^= (character << shift) + (character >> (8 - shift));
  }
  return namedColors[hash % namedColors.length];
}

function getBadgeSize(size: AvatarSize): NonNullable<PresenceBadgeProps['size']> {
  if (size >= 96) return 'extra-large';
  if (size >= 64) return 'large';
  if (size >= 56) return 'medium';
  if (size >= 40) return 'small';
  if (size >= 28) return 'extra-small';
  return 'tiny';
}

function resolveBadge(value: AvatarSlots['badge'], defaultProps: Partial<PresenceBadgeProps>) {
  const badge = slot.optional<PresenceBadgeProps>(value, {
    defaultProps,
    elementType: UnstyledPresenceBadge,
  });
  if (!badge) return undefined;
  const props = slot.resolveShorthand(value);
  const render: SlotRenderFunction<PresenceBadgeProps> = (_Component, resolvedProps) =>
    typeof props?.children === 'function' ? (
      props.children(PresenceBadge, resolvedProps)
    ) : (
      <PresenceBadge {...resolvedProps} />
    );

  // Retain the public hook's slot metadata; the render adapter supplies the styled foundation.
  return slot.optional<PresenceBadgeProps>(
    { children: render },
    { defaultProps: badge, elementType: UnstyledPresenceBadge },
  );
}

export const Avatar: ForwardRefComponent<AvatarProps> = React.forwardRef<
  HTMLSpanElement,
  AvatarProps
>(function Avatar(
  {
    color: colorProp = 'neutral',
    size: sizeProp,
    shape: shapeProp,
    activeAppearance = 'ring',
    idForColor,
    ...props
  },
  ref,
) {
  const context = useAvatarContext();
  const size = sizeProp ?? context.size ?? 32;
  const shape = shapeProp ?? context.shape ?? 'circular';
  const color = resolveColor(colorProp, idForColor ?? props.name ?? '');
  const state = useAvatar(props, ref);
  const badge = resolveBadge(props.badge, { ...state.badge, size: getBadgeSize(size) });
  state.badge = badge;

  if (state.icon && !Object.prototype.hasOwnProperty.call(state.icon, 'children')) {
    state.icon.children = <PersonRegular className={styles.Avatar__glyph} />;
  }

  Object.assign(state.root, {
    'data-size': size,
    'data-shape': shape,
    'data-color': color,
    'data-active-appearance': activeAppearance,
    'data-has-badge': badge ? '' : undefined,
    'data-badge-size': badge ? (badge.size ?? 'medium') : undefined,
    'data-has-image': state.image ? '' : undefined,
    'data-has-initials': state.initials ? '' : undefined,
    'data-has-icon': state.icon ? '' : undefined,
  });
  state.root.className = [
    avatarClassNames.root,
    styles.Avatar,
    overrides.Avatar,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');

  for (const [name, scopedClass, overrideClass] of [
    ['image', styles.Avatar__image, undefined],
    ['initials', styles.Avatar__initials, overrides.Avatar__initials],
    ['icon', styles.Avatar__icon, overrides.Avatar__icon],
    ['badge', styles.Avatar__badge, undefined],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [avatarClassNames[name], scopedClass, overrideClass, resolved.className]
        .filter(Boolean)
        .join(' ');
    }
  }
  return renderAvatar(state);
});

Avatar.displayName = 'Avatar';
