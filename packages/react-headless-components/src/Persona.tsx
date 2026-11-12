// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderPersona,
  usePersona,
  type PersonaProps as HeadlessPersonaProps,
  type PersonaSlots as HeadlessPersonaSlots,
} from '@fluentui/react-headless-components-preview/persona';
import { Avatar as UnstyledAvatar } from '@fluentui/react-headless-components-preview/avatar';
import { PresenceBadge as UnstyledPresenceBadge } from '@fluentui/react-headless-components-preview/badge';
import {
  slot,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { Avatar, type AvatarColor, type AvatarProps, type AvatarSize } from './Avatar.js';
import { PresenceBadge, type PresenceBadgeProps } from './PresenceBadge.js';
import styles from './Persona.module.css';

export const personaClassNames = {
  root: 'fui-Persona',
  avatar: 'fui-Persona__avatar',
  presence: 'fui-Persona__presence',
  primaryText: 'fui-Persona__primaryText',
  secondaryText: 'fui-Persona__secondaryText',
  tertiaryText: 'fui-Persona__tertiaryText',
  quaternaryText: 'fui-Persona__quaternaryText',
} as const;

export type PersonaSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge';
export type PersonaAvatarProps = Omit<AvatarProps, 'color'> & {
  color?: Exclude<AvatarColor, 'neutral-alt'>;
};
export type PersonaSlots = Omit<HeadlessPersonaSlots, 'avatar'> & {
  avatar?: Slot<ForwardRefComponent<PersonaAvatarProps>>;
  presence?: Slot<typeof PresenceBadge>;
};

export type PersonaProps = Omit<HeadlessPersonaProps, 'avatar'> &
  Pick<PersonaSlots, 'avatar' | 'presence'> & {
    /** Display the presence coin instead of the avatar. @default false */
    presenceOnly?: boolean;
    /** Visual size of the coin and text. @default 'medium' */
    size?: PersonaSize;
    /** Vertical alignment of text relative to the coin. @default 'start' */
    textAlignment?: 'start' | 'center';
  };

// Visual composition sizes from react-persona 9.7.11; identity and status stay in the primitives.
const avatarSizes = {
  'extra-small': 20,
  small: 28,
  medium: 32,
  large: 36,
  'extra-large': 40,
  huge: 56,
} as const satisfies Record<PersonaSize, AvatarSize>;

const presenceSizes = {
  'extra-small': 'tiny',
  small: 'extra-small',
  medium: 'small',
  large: 'medium',
  'extra-large': 'large',
  huge: 'large',
} as const satisfies Record<PersonaSize, NonNullable<PresenceBadgeProps['size']>>;

function resolveAvatar(value: PersonaSlots['avatar'], defaultProps: Partial<PersonaAvatarProps>) {
  const resolved = slot.optional<PersonaAvatarProps>(value, {
    defaultProps,
    renderByDefault: true,
    elementType: UnstyledAvatar,
  });
  if (!resolved) return undefined;
  const original = slot.resolveShorthand(value);
  const render: SlotRenderFunction<PersonaAvatarProps> = (_Component, props) =>
    typeof original?.children === 'function' ? (
      original.children(Avatar, props)
    ) : (
      <Avatar {...props} />
    );

  // Keep the current primitive's slot metadata; the public render adapter supplies its styles.
  return slot.optional<PersonaAvatarProps>(
    { children: render },
    { defaultProps: resolved, elementType: UnstyledAvatar },
  );
}

function resolvePresence(
  value: PersonaSlots['presence'],
  size: NonNullable<PresenceBadgeProps['size']>,
) {
  const resolved = slot.optional<PresenceBadgeProps>(value, {
    defaultProps: { size },
    elementType: UnstyledPresenceBadge,
  });
  if (!resolved) return undefined;
  const original = slot.resolveShorthand(value);
  const render: SlotRenderFunction<PresenceBadgeProps> = (_Component, props) =>
    typeof original?.children === 'function' ? (
      original.children(PresenceBadge, props)
    ) : (
      <PresenceBadge {...props} />
    );
  return slot.optional<PresenceBadgeProps>(
    { children: render },
    { defaultProps: resolved, elementType: UnstyledPresenceBadge },
  );
}

export const Persona: ForwardRefComponent<PersonaProps> = React.forwardRef<
  HTMLDivElement,
  PersonaProps
>(function Persona(
  { avatar, presence, presenceOnly = false, size = 'medium', textAlignment = 'start', ...props },
  ref,
) {
  // Resolve visual props before the primitive's native slot type widens HTML's color attribute.
  const resolvedAvatar = presenceOnly
    ? undefined
    : resolveAvatar(avatar, {
        name: props.name,
        size: avatarSizes[size],
        badge: presence,
      });
  const baseState = usePersona({ ...props, avatar: resolvedAvatar ?? null }, ref);
  const state = {
    ...baseState,
    presenceOnly,
    presence: presenceOnly ? resolvePresence(presence, presenceSizes[size]) : undefined,
  };

  Object.assign(state.root, {
    'data-size': size,
    'data-text-alignment': textAlignment,
    'data-presence-only': presenceOnly ? '' : undefined,
    'data-text-lines': state.numTextLines,
    'data-align-to-primary':
      presenceOnly && textAlignment === 'start' && size !== 'extra-large' && size !== 'huge'
        ? ''
        : undefined,
  });
  state.root.className = [personaClassNames.root, styles.Persona, state.root.className]
    .filter(Boolean)
    .join(' ');

  for (const [name, scopedClass] of [
    ['avatar', styles.Persona__avatar],
    ['presence', styles.Persona__presence],
    ['primaryText', styles.Persona__primaryText],
    ['secondaryText', styles.Persona__secondaryText],
    ['tertiaryText', styles.Persona__tertiaryText],
    ['quaternaryText', styles.Persona__quaternaryText],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [personaClassNames[name], scopedClass, resolved.className]
        .filter(Boolean)
        .join(' ');
    }
  }
  return renderPersona(state);
});

Persona.displayName = 'Persona';
