// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Persona as LegacyPersona,
  type PersonaProps as LegacyPersonaProps,
} from '@coreai-ds/react-components';
import {
  Persona as HeadlessPersona,
  type PersonaProps,
  type PersonaSlots,
  type PresenceBadgeProps,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import type { PersonaStyleDifference } from './comparePersonaStyles.js';
import styles from './PersonaComparison.module.css';

export const personaSizes = [
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
  'huge',
] as const;
export const personaTextPositions = ['after', 'before', 'below'] as const;
export const personaTextAlignments = ['start', 'center'] as const;
export const personaStatuses = [
  'available',
  'away',
  'busy',
  'do-not-disturb',
  'offline',
  'out-of-office',
  'blocked',
  'unknown',
] as const;

export const personaInlineImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#dbeaf3"/><circle cx="32" cy="23" r="13" fill="#39729a"/><path d="M7 64a25 24 0 0 1 50 0" fill="#39729a"/></svg>',
)}`;
export const personaBrokenImage = 'data:image/svg+xml,%3Csvg';

export const personaAvatarRenderer: SlotRenderFunction<ExtractSlotProps<PersonaSlots['avatar']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-persona-avatar="" />;

export const personaPresenceRenderer: SlotRenderFunction<
  ExtractSlotProps<PersonaSlots['presence']>
> = (Component, props) => <Component {...props} data-rendered-persona-presence="" />;

export const personaTextRenderer: SlotRenderFunction<
  ExtractSlotProps<PersonaSlots['primaryText']>
> = (Component, props) => <Component {...props} data-rendered-persona-text="" />;

export const personaRootRenderer: SlotRenderFunction<ExtractSlotProps<PersonaSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-persona-root="" />;

export interface PersonaExample {
  name: string;
  props: PersonaProps & LegacyPersonaProps;
  intentionalDifferences?: readonly PersonaStyleDifference[];
}

export const personaOutOfOfficeExample: PersonaExample = {
  name: 'Current out-of-office badge accessibility',
  props: {
    name: 'Ada Lovelace',
    presence: { status: 'available', outOfOffice: true },
  },
  intentionalDifferences: [
    { property: 'status.aria-label', legacy: 'available', headless: 'available out of office' },
  ],
};

export const personaPresenceOutOfOfficeExample: PersonaExample = {
  name: 'Current standalone out-of-office accessibility',
  props: {
    name: 'Ada Lovelace',
    presenceOnly: true,
    presence: { status: 'available', outOfOffice: true },
  },
  intentionalDifferences: personaOutOfOfficeExample.intentionalDifferences,
};

export const personaExamples: PersonaExample[] = [
  { name: 'Name supplies primary text and initials', props: { name: 'Ada Lovelace' } },
  { name: 'Guest icon', props: { avatar: { 'aria-label': 'Guest avatar' } } },
  {
    name: 'Explicitly undefined visual defaults',
    props: {
      name: 'Ada Lovelace',
      size: undefined,
      presenceOnly: undefined,
      textPosition: undefined,
      textAlignment: undefined,
    },
  },
  ...personaSizes.map((size) => ({
    name: `Avatar size ${size}`,
    props: {
      name: 'Ada Lovelace',
      size,
      presence: { status: 'available' as const },
      secondaryText: 'Product designer',
    },
  })),
  ...personaSizes.map((size) => ({
    name: `Presence size ${size}`,
    props: {
      name: 'Ada Lovelace',
      size,
      presenceOnly: true,
      presence: { status: 'busy' as const },
      secondaryText: 'Product designer',
    },
  })),
  {
    name: 'Extra-small one-line presence typography',
    props: {
      name: 'Ada Lovelace',
      size: 'extra-small',
      presenceOnly: true,
      presence: { status: 'available' },
    },
  },
  ...personaTextPositions.flatMap((textPosition) =>
    personaTextAlignments.flatMap((textAlignment) =>
      [false, true].map((presenceOnly) => ({
        name: `${presenceOnly ? 'Presence' : 'Avatar'} ${textPosition} ${textAlignment}`,
        props: {
          name: 'Miriam Graham',
          size: 'large' as const,
          textPosition,
          textAlignment,
          presenceOnly,
          presence: { status: 'away' as const },
          secondaryText: 'Engineering manager',
          tertiaryText: 'Design systems',
          quaternaryText: 'Seattle',
        },
      })),
    ),
  ),
  {
    name: 'Centered avatar taller than one text line',
    props: { name: 'Miriam Graham', size: 'huge', textAlignment: 'center' },
  },
  {
    name: 'Four huge text lines',
    props: {
      name: 'Miriam Graham',
      size: 'huge',
      secondaryText: 'Engineering manager',
      tertiaryText: 'Design systems',
      quaternaryText: 'Seattle',
    },
  },
  {
    name: 'Four huge presence-only text lines',
    props: {
      name: 'Miriam Graham',
      size: 'huge',
      presenceOnly: true,
      presence: { status: 'available' },
      secondaryText: 'Engineering manager',
      tertiaryText: 'Design systems',
      quaternaryText: 'Seattle',
    },
  },
  { name: 'No text slots', props: { primaryText: null, avatar: { 'aria-label': 'Guest' } } },
  {
    name: 'Secondary text without primary',
    props: { name: 'Ada Lovelace', primaryText: null, secondaryText: 'Available' },
  },
  {
    name: 'Nonconsecutive optional text lines',
    props: {
      name: 'Ada Lovelace',
      tertiaryText: 'Design systems',
      quaternaryText: 'Seattle',
      textAlignment: 'center',
    },
  },
  {
    name: 'Display text differs from avatar identity',
    props: { name: 'Ada Lovelace', primaryText: 'Ada · Design systems', secondaryText: 'Online' },
  },
  ...personaStatuses.map((status) => ({
    name: `Standalone status ${status}`,
    props: {
      name: 'Ada Lovelace',
      presenceOnly: true,
      presence: { status },
      secondaryText: status,
    },
  })),
  {
    name: 'Default standalone presence',
    props: { name: 'Ada Lovelace', presenceOnly: true, presence: {} },
  },
  {
    name: 'Presence only without supplied presence',
    props: { name: 'Ada Lovelace', presenceOnly: true },
  },
  { name: 'Explicitly null avatar', props: { name: 'Ada Lovelace', avatar: null } },
  {
    name: 'Avatar badge overrides Persona presence',
    props: {
      name: 'Ada Lovelace',
      presence: { status: 'away' },
      avatar: { badge: { status: 'busy' } },
    },
  },
  {
    name: 'Null avatar badge suppresses Persona presence',
    props: {
      name: 'Ada Lovelace',
      presence: { status: 'away' },
      avatar: { badge: null },
    },
  },
  {
    name: 'Caller avatar size shape name and initials',
    props: {
      name: 'Ada Lovelace',
      avatar: { name: 'Grace Hopper', initials: 'GH', size: 48, shape: 'square', color: 'brand' },
      presence: { status: 'busy' },
    },
  },
  {
    name: 'Colorful avatar delegates palette selection',
    props: { name: 'Ada Lovelace', avatar: { color: 'colorful' } },
  },
  {
    name: 'Inline photo',
    props: { name: 'Ada Lovelace', avatar: { image: { src: personaInlineImage } } },
  },
  {
    name: 'Failed photo retains initials',
    props: { name: 'Ada Lovelace', avatar: { image: { src: personaBrokenImage } } },
  },
  {
    name: 'Failed guest photo uses native fallback',
    props: { avatar: { 'aria-label': 'Guest', image: { src: personaBrokenImage } } },
  },
  {
    name: 'Explicit accessible identity',
    props: {
      name: 'Ada Lovelace',
      avatar: { 'aria-label': 'Profile for Ada' },
      presence: { status: 'away' },
    },
  },
  {
    name: 'Decorative repeated identity',
    props: {
      name: 'Ada Lovelace',
      avatar: { role: 'presentation', 'aria-hidden': true },
      secondaryText: 'Available',
    },
  },
  {
    name: 'Avatar public render function',
    props: {
      name: 'Ada Lovelace',
      avatar: { className: 'consumer-avatar', children: personaAvatarRenderer },
    },
  },
  {
    name: 'Presence public render function',
    props: {
      name: 'Ada Lovelace',
      presenceOnly: true,
      presence: {
        status: 'busy',
        className: 'consumer-presence',
        children: personaPresenceRenderer,
      },
    },
  },
  {
    name: 'Text public render function',
    props: {
      name: 'Ada Lovelace',
      primaryText: { className: 'consumer-primary', children: personaTextRenderer },
      secondaryText: { children: 'Design systems', className: 'consumer-secondary' },
    },
  },
  {
    name: 'Root public render function',
    props: { name: 'Ada Lovelace', children: personaRootRenderer },
  },
  {
    name: 'Native text wrapping',
    props: {
      name: 'Avery a person with a longer display name',
      primaryText: { style: { width: '130px' } },
      secondaryText: {
        children: 'A longer secondary description that wraps naturally',
        style: { width: '130px' },
      },
    },
  },
  {
    name: 'Native text ellipsis',
    props: {
      name: 'Avery a person with a longer display name',
      primaryText: {
        style: {
          maxWidth: '130px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
      secondaryText: 'Design systems',
    },
  },
  {
    name: 'Current tiny avatar initials',
    props: { name: 'Ada Lovelace', avatar: { size: 16 } },
    intentionalDifferences: [{ property: 'avatar.initials.text', legacy: 'A', headless: 'AL' }],
  },
  personaOutOfOfficeExample,
  personaPresenceOutOfOfficeExample,
];

export const personaConsumerExample: PersonaExample = {
  name: 'Ordinary consumer CSS',
  props: {
    name: 'Ada Lovelace',
    className: styles.consumerPersona,
    primaryText: { className: styles.consumerPrimary },
    secondaryText: { children: 'Design systems', className: styles.consumerSecondary },
    avatar: { className: styles.consumerAvatar },
    presence: { status: 'available' },
  },
};

export function PersonaComparison({
  examples = personaExamples,
}: {
  examples?: readonly PersonaExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-persona-case={example.name}>
          <span>{example.name}</span>
          <div className={styles.cell} data-persona-implementation="legacy">
            <LegacyPersona {...example.props} />
          </div>
          <div className={styles.cell} data-persona-implementation="headless">
            <HeadlessPersona {...example.props} />
          </div>
        </div>
      ))}
    </div>
  );
}

const availabilities = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'away', label: 'Away' },
  { value: 'offline', label: 'Offline' },
] as const satisfies readonly {
  value: NonNullable<PresenceBadgeProps['status']>;
  label: string;
}[];

export function PersonaProfileFlow(props: PersonaProps): React.ReactElement {
  const [name, setName] = React.useState(props.name ?? 'Ada Lovelace');
  const [status, setStatus] = React.useState<(typeof availabilities)[number]['value']>('available');
  const [details, setDetails] = React.useState(false);
  const [presenceOnly, setPresenceOnly] = React.useState(false);
  const [image, setImage] = React.useState<'none' | 'photo' | 'broken'>('none');
  const [loads, setLoads] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const availability = availabilities.find((value) => value.value === status);
  return (
    <div className={styles.playground}>
      <div className={styles.actions}>
        <label>
          Display name
          <input value={name} onChange={(event) => setName(event.currentTarget.value)} />
        </label>
        <label>
          Availability
          <select
            value={status}
            onChange={(event) => {
              const next = availabilities.find(
                (value) => value.value === event.currentTarget.value,
              );
              if (next) setStatus(next.value);
            }}
          >
            {availabilities.map((value) => (
              <option key={value.value} value={value.value}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" aria-pressed={details} onClick={() => setDetails((value) => !value)}>
          Show more details
        </button>
        <button
          type="button"
          aria-pressed={presenceOnly}
          onClick={() => setPresenceOnly((value) => !value)}
        >
          Show presence only
        </button>
      </div>
      <HeadlessPersona
        size="large"
        {...props}
        name={name}
        role="group"
        aria-label="Profile preview"
        presenceOnly={presenceOnly}
        presence={{ status }}
        secondaryText={availability?.label}
        tertiaryText={details ? 'Design systems' : undefined}
        quaternaryText={details ? 'Seattle · UTC−8' : undefined}
        avatar={{
          'aria-label': name ? undefined : 'Guest avatar',
          image:
            image === 'none'
              ? undefined
              : {
                  src: image === 'photo' ? personaInlineImage : personaBrokenImage,
                  onLoad: () => setLoads((value) => value + 1),
                  onError: () => setErrors((value) => value + 1),
                },
        }}
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
      </div>
      <output aria-label="Profile changes" aria-live="polite">
        {name || 'Guest'} · {status} · {details ? 4 : 2} lines
      </output>
      <output aria-label="Image events" aria-live="polite">
        Loads: {loads}; errors: {errors}
      </output>
    </div>
  );
}
