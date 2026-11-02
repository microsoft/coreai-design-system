// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Avatar as LegacyAvatar } from '@coreai-ds/react-components';
import {
  Avatar as HeadlessAvatar,
  type AvatarNamedColor,
  type AvatarProps,
  type AvatarSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import type { AvatarStyleDifference } from './compareAvatarStyles.js';
import styles from './AvatarComparison.module.css';

export const avatarSizes = [16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 128] as const;
export const avatarShapes = ['circular', 'square'] as const;
export const avatarActiveAppearances = ['ring', 'shadow', 'ring-shadow'] as const;
export const avatarNamedColors = [
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
] as const satisfies readonly AvatarNamedColor[];

export const avatarInlineImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60"><rect width="80" height="60" fill="#dbeaf3"/><circle cx="40" cy="21" r="13" fill="#39729a"/><path d="M12 60a28 26 0 0 1 56 0" fill="#39729a"/></svg>',
)}`;
export const avatarBrokenImage = 'data:image/svg+xml,%3Csvg';

export function AvatarFixtureIcon(): React.ReactElement {
  return (
    <svg
      data-avatar-fixture-glyph=""
      aria-hidden="true"
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M10 2 18 10 10 18 2 10Z" />
    </svg>
  );
}

export const avatarInitialsRenderer: SlotRenderFunction<
  ExtractSlotProps<AvatarSlots['initials']>
> = (Component, props) => <Component {...props} data-rendered-initials="" />;

export const avatarIconRenderer: SlotRenderFunction<ExtractSlotProps<AvatarSlots['icon']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-icon="">
    <AvatarFixtureIcon />
  </Component>
);

export const avatarBadgeRenderer: SlotRenderFunction<ExtractSlotProps<AvatarSlots['badge']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-badge="" />;

export const avatarRootRenderer: SlotRenderFunction<ExtractSlotProps<AvatarSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-root="" />;

export interface AvatarExample {
  name: string;
  props: AvatarProps;
  intentionalDifferences?: readonly AvatarStyleDifference[];
}

export const avatarOutOfOfficeExample: AvatarExample = {
  name: 'Out of office presence',
  props: { name: 'Out Of Office', badge: { status: 'available', outOfOffice: true } },
  intentionalDifferences: [
    {
      property: 'badge.aria-label',
      legacy: 'available',
      headless: 'available out of office',
    },
  ],
};

export const avatarExamples: AvatarExample[] = [
  { name: 'Default named avatar', props: { name: 'Ada Lovelace' } },
  { name: 'Default guest glyph', props: { 'aria-label': 'Guest avatar' } },
  { name: 'Neutral initials', props: { name: 'Neutral Avatar', color: 'neutral' } },
  { name: 'Alternate neutral initials', props: { name: 'Neutral Avatar', color: 'neutral-alt' } },
  { name: 'Alternate neutral icon', props: { color: 'neutral-alt', 'aria-label': 'Guest' } },
  { name: 'Brand initials', props: { name: 'Brand Avatar', color: 'brand' } },
  {
    name: 'Explicitly undefined visual props',
    props: {
      name: 'Undefined Props',
      size: undefined,
      shape: undefined,
      color: undefined,
      activeAppearance: undefined,
      idForColor: undefined,
    },
  },
  ...avatarSizes.map((size) => ({
    name: `Size ${size} with presence`,
    props: {
      name: 'Ada Lovelace',
      initials: size === 16 ? 'A' : undefined,
      size,
      badge: { status: 'available' as const },
    },
  })),
  ...([16, 20, 28, 48, 56, 64, 96, 128] as const).map((size) => ({
    name: `Icon size ${size}`,
    props: { size, 'aria-label': 'Guest avatar' },
  })),
  ...([24, 48, 72, 128] as const).map((size) => ({
    name: `Square size ${size}`,
    props: { size, shape: 'square' as const, name: 'Square Avatar' },
  })),
  ...avatarNamedColors.map((color) => ({
    name: `Palette ${color}`,
    props: { color, initials: 'AV', name: 'Palette avatar', active: 'active' as const },
  })),
  {
    name: 'Colorful name hash',
    props: { name: 'Katri Athokas', color: 'colorful', active: 'active' },
  },
  {
    name: 'Colorful identifier hash',
    props: { name: 'Katri Athokas', color: 'colorful', idForColor: 'id-123' },
  },
  {
    name: 'Colorful empty identifier',
    props: { name: 'Katri Athokas', color: 'colorful', idForColor: '' },
  },
  {
    name: 'Colorful guest hash',
    props: { color: 'colorful', idForColor: 'Guest-23', 'aria-label': 'Guest' },
  },
  ...avatarActiveAppearances.flatMap((activeAppearance) =>
    (['active', 'inactive'] as const).map((active) => ({
      name: `${active} ${activeAppearance}`,
      props: {
        name: 'Active Avatar',
        active,
        activeAppearance,
        badge: { status: 'away' as const },
      },
    })),
  ),
  ...([28, 56, 64, 72, 128] as const).map((size) => ({
    name: `Ring and shadow size ${size}`,
    props: {
      size,
      name: 'Active Avatar',
      active: 'active' as const,
      activeAppearance: 'ring-shadow' as const,
      color: 'seafoam' as const,
      badge: { status: 'busy' as const },
    },
  })),
  {
    name: 'Explicit badge size',
    props: { name: 'Custom Badge', size: 64, badge: { status: 'away', size: 'small' } },
  },
  avatarOutOfOfficeExample,
  {
    name: 'Custom presence icon',
    props: { name: 'Custom Presence', badge: { icon: <AvatarFixtureIcon /> } },
  },
  { name: 'No badge', props: { name: 'No Badge', badge: null } },
  { name: 'Inline photo', props: { name: 'Ada Lovelace', image: { src: avatarInlineImage } } },
  {
    name: 'Alternate neutral does not override photo',
    props: { name: 'Ada Lovelace', color: 'neutral-alt', image: { src: avatarInlineImage } },
  },
  {
    name: 'Square photo with presence and ring',
    props: {
      name: 'Ada Lovelace',
      size: 64,
      shape: 'square',
      active: 'active',
      image: { src: avatarInlineImage },
      badge: { status: 'busy' },
    },
  },
  {
    name: 'Failed photo retains initials',
    props: { name: 'Ada Lovelace', image: { src: avatarBrokenImage } },
  },
  {
    name: 'Failed guest photo uses glyph',
    props: { 'aria-label': 'Guest', image: { src: avatarBrokenImage } },
  },
  { name: 'Empty image source', props: { name: 'Ada Lovelace', image: { src: '' } } },
  { name: 'Custom initials', props: { name: 'Cecil Robin Folk', initials: 'CRF' } },
  { name: 'Initials without name', props: { initials: 'JD' } },
  {
    name: 'Name suppresses caller icon',
    props: { name: 'Ada Lovelace', icon: <AvatarFixtureIcon /> },
  },
  {
    name: 'Null initials uses caller icon',
    props: { name: 'Ada Lovelace', initials: null, icon: <AvatarFixtureIcon /> },
  },
  { name: 'Null icon', props: { icon: null, 'aria-label': 'Guest' } },
  { name: 'Explicit empty icon', props: { icon: { children: null }, 'aria-label': 'Guest' } },
  {
    name: 'Custom accessible label',
    props: {
      name: 'Ada Lovelace',
      active: 'active',
      badge: { status: 'busy' },
      'aria-label': 'Me',
    },
  },
  {
    name: 'Decorative avatar',
    props: { name: 'Ada Lovelace', role: 'presentation', 'aria-hidden': true },
  },
  {
    name: 'Initials slot render function',
    props: {
      name: 'Ada Lovelace',
      initials: { className: 'consumer-initials', children: avatarInitialsRenderer },
    },
  },
  {
    name: 'Icon slot render function',
    props: {
      icon: { className: 'consumer-icon', children: avatarIconRenderer },
      'aria-label': 'Team',
    },
  },
  {
    name: 'Badge slot render function',
    props: { name: 'Ada Lovelace', badge: { status: 'away', children: avatarBadgeRenderer } },
  },
  {
    name: 'Root slot render function',
    props: { name: 'Ada Lovelace', children: avatarRootRenderer },
  },
  {
    name: 'Current tiny-name initials',
    props: { name: 'Ada Lovelace', size: 16 },
    intentionalDifferences: [{ property: 'initials.text', legacy: 'A', headless: 'AL' }],
  },
];

export const avatarConsumerExample: AvatarExample = {
  name: 'Ordinary consumer CSS',
  props: {
    name: 'Ada Lovelace',
    active: 'active',
    className: styles.consumerAvatar,
    initials: { className: styles.consumerInitials },
    badge: { status: 'busy', className: styles.consumerBadge },
  },
};

export function AvatarComparison({
  examples = avatarExamples,
}: {
  examples?: readonly AvatarExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-avatar-case={example.name}>
          <span>{example.name}</span>
          <div className={styles.cell} data-avatar-implementation="legacy">
            <LegacyAvatar {...example.props} />
          </div>
          <div className={styles.cell} data-avatar-implementation="headless">
            <HeadlessAvatar {...example.props} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AvatarImageFallbackFlow(props: AvatarProps): React.ReactElement {
  const [image, setImage] = React.useState<'none' | 'photo' | 'broken'>('none');
  const [guest, setGuest] = React.useState(false);
  const [loads, setLoads] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  return (
    <div className={styles.playground}>
      <p>
        Real inline-image events drive fallback and recovery. No network request or fake event is
        used.
      </p>
      <HeadlessAvatar
        {...props}
        name={guest ? undefined : (props.name ?? 'Ada Lovelace')}
        aria-label={guest ? 'Guest avatar' : undefined}
        image={
          image === 'none'
            ? undefined
            : {
                src: image === 'photo' ? avatarInlineImage : avatarBrokenImage,
                onLoad: () => setLoads((value) => value + 1),
                onError: () => setErrors((value) => value + 1),
              }
        }
      />
      <div className={styles.actions}>
        <button type="button" onClick={() => setImage('photo')}>
          Load photo
        </button>
        <button type="button" onClick={() => setImage('broken')}>
          Break photo
        </button>
        <button type="button" onClick={() => setImage('none')}>
          Remove photo
        </button>
        <button type="button" aria-pressed={guest} onClick={() => setGuest((value) => !value)}>
          Use guest identity
        </button>
      </div>
      <output aria-label="Image events" aria-live="polite">
        Loads: {loads}; errors: {errors}
      </output>
    </div>
  );
}

export function AvatarIdentityPlayground(props: AvatarProps): React.ReactElement {
  const [name, setName] = React.useState(props.name ?? 'Ada Lovelace');
  const [active, setActive] = React.useState(false);
  return (
    <div className={styles.playground}>
      <label>
        Display name
        <input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </label>
      <button type="button" aria-pressed={active} onClick={() => setActive((value) => !value)}>
        Speaking
      </button>
      <HeadlessAvatar
        {...props}
        name={name}
        aria-label={name ? undefined : 'Guest avatar'}
        active={active ? 'active' : 'unset'}
      />
      <output aria-live="polite">
        {name || 'Guest'}
        {active ? ' is speaking' : ' is listening'}
      </output>
    </div>
  );
}
