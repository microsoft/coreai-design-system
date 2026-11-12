// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { PresenceBadge as LegacyPresenceBadge } from '@coreai-ds/react-components';
import {
  PresenceBadge as HeadlessPresenceBadge,
  type PresenceBadgeProps,
} from '@coreai-ds/react-headless-components';
import {
  BadgeFixtureIcon,
  badgeIconRenderer,
  badgeRootRenderer,
  badgeSizes,
} from './BadgeComparison.js';
import styles from './BadgeComparison.module.css';

export const presenceBadgeStatuses = [
  'available',
  'away',
  'busy',
  'do-not-disturb',
  'offline',
  'out-of-office',
  'blocked',
  'unknown',
] as const;

export const presenceBadgeAccessibleStatus = {
  available: 'available',
  away: 'away',
  busy: 'busy',
  'do-not-disturb': 'do not disturb',
  offline: 'offline',
  'out-of-office': 'out of office',
  blocked: 'blocked',
  unknown: 'unknown',
} as const;

export interface PresenceBadgeExample {
  name: string;
  props: PresenceBadgeProps;
}

export const presenceBadgeExamples: PresenceBadgeExample[] = [
  { name: 'Default', props: {} },
  ...presenceBadgeStatuses.flatMap((status) =>
    [false, true].map((outOfOffice) => ({
      name: `${status}${outOfOffice ? ', out of office' : ''}`,
      props: { status, outOfOffice },
    })),
  ),
  ...badgeSizes.map((size) => ({ name: `Size: ${size}`, props: { size } })),
  { name: 'Consumer icon', props: { status: 'busy', icon: <BadgeFixtureIcon /> } },
  { name: 'Null icon', props: { status: 'away', icon: null } },
  { name: 'False icon content', props: { icon: { children: false } } },
  {
    name: 'Additional content',
    props: { status: 'unknown', children: <span className="consumer-content">?</span> },
  },
  {
    name: 'Icon slot render function',
    props: { status: 'blocked', icon: { className: 'consumer-icon', children: badgeIconRenderer } },
  },
  { name: 'Root slot render function', props: { children: badgeRootRenderer } },
  {
    name: 'Accessible label override',
    props: { status: 'busy', 'aria-label': 'Presenting to the team' },
  },
  {
    name: 'Explicitly undefined props',
    props: { size: undefined, status: undefined, outOfOffice: undefined },
  },
];

export const presenceBadgeConsumerExample: PresenceBadgeExample = {
  name: 'Unlayered consumer CSS',
  props: {
    status: 'busy',
    outOfOffice: true,
    className: styles.consumerPresence,
    icon: { className: styles.consumerPresenceIcon },
  },
};

export function PresenceBadgeComparison({
  examples = presenceBadgeExamples,
}: {
  examples?: readonly PresenceBadgeExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-presencebadge-case={example.name}>
          <span>{example.name}</span>
          <div className={styles.cell} data-presencebadge-implementation="legacy">
            <LegacyPresenceBadge {...example.props} />
          </div>
          <div className={styles.cell} data-presencebadge-implementation="headless">
            <HeadlessPresenceBadge {...example.props} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PresenceBadgeAvailability(props: PresenceBadgeProps): React.ReactElement {
  const [status, setStatus] =
    React.useState<NonNullable<PresenceBadgeProps['status']>>('available');
  const [outOfOffice, setOutOfOffice] = React.useState(false);
  return (
    <div className={styles.playground}>
      <p>
        Presence is a labelled image, not a live region. This experience separately announces
        updates.
      </p>
      <HeadlessPresenceBadge {...props} status={status} outOfOffice={outOfOffice} />
      <div className={styles.actions}>
        {presenceBadgeStatuses.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            Set {value}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={outOfOffice}
          onClick={() => setOutOfOffice((value) => !value)}
        >
          Out of office
        </button>
      </div>
      <output aria-live="polite">
        Availability: {presenceBadgeAccessibleStatus[status]}
        {outOfOffice && status !== 'out-of-office' ? ', out of office' : ''}
      </output>
    </div>
  );
}
