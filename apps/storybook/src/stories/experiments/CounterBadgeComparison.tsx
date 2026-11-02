// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { CounterBadge as LegacyCounterBadge } from '@coreai-ds/react-components';
import {
  CounterBadge as HeadlessCounterBadge,
  type CounterBadgeProps,
} from '@coreai-ds/react-headless-components';
import {
  BadgeFixtureIcon,
  badgeIconRenderer,
  badgeRootRenderer,
  badgeSizes,
} from './BadgeComparison.js';
import styles from './BadgeComparison.module.css';

export const counterBadgeAppearances = ['filled', 'ghost'] as const;
export const counterBadgeColors = ['brand', 'danger', 'important', 'informative'] as const;
export const counterBadgeShapes = ['circular', 'rounded'] as const;

export interface CounterBadgeExample {
  name: string;
  props: CounterBadgeProps;
}

export const counterBadgeExamples: CounterBadgeExample[] = [
  { name: 'Default hidden zero', props: {} },
  ...counterBadgeAppearances.flatMap((appearance) =>
    counterBadgeColors.map((color) => ({
      name: `${appearance}: ${color}`,
      props: { appearance, color, count: 8, icon: <BadgeFixtureIcon /> },
    })),
  ),
  ...badgeSizes.map((size) => ({ name: `Size: ${size}`, props: { size, count: 8 } })),
  ...counterBadgeShapes.map((shape) => ({ name: `Shape: ${shape}`, props: { shape, count: 42 } })),
  { name: 'Zero shown', props: { count: 0, showZero: true } },
  { name: 'Overflow', props: { count: 100 } },
  { name: 'Custom overflow', props: { count: 15, overflowCount: 9 } },
  { name: 'At overflow threshold', props: { count: 9, overflowCount: 9 } },
  { name: 'Negative count', props: { count: -1 } },
  { name: 'Dot', props: { dot: true } },
  { name: 'Dot suppresses automatic count', props: { count: 100, dot: true } },
  {
    name: 'Extra-large rounded dot',
    props: { count: 8, dot: true, size: 'extra-large', shape: 'rounded' },
  },
  { name: 'Hidden with an icon', props: { count: 0, icon: <BadgeFixtureIcon /> } },
  { name: 'Consumer content wins', props: { count: 12, children: 'New' } },
  { name: 'Dot preserves supplied content', props: { dot: true, children: '!' } },
  {
    name: 'Icon after count',
    props: { count: 8, icon: <BadgeFixtureIcon />, iconPosition: 'after' },
  },
  {
    name: 'Icon slot render function',
    props: { count: 8, icon: { className: 'consumer-icon', children: badgeIconRenderer } },
  },
  {
    name: 'Root slot render function',
    props: { children: badgeRootRenderer, count: 8, icon: <BadgeFixtureIcon /> },
  },
  {
    name: 'Explicitly undefined visual props',
    props: { appearance: undefined, color: undefined, shape: undefined, size: undefined, count: 8 },
  },
];

export const counterBadgeNumericZeroExample: CounterBadgeExample = {
  name: 'Current hook preserves numeric zero content',
  props: { children: 0 },
};

export const counterBadgeConsumerExample: CounterBadgeExample = {
  name: 'Unlayered consumer CSS',
  props: {
    appearance: 'filled',
    color: 'danger',
    size: 'small',
    shape: 'rounded',
    count: 5,
    className: styles.consumerRoot,
    icon: { className: styles.consumerIcon, children: <BadgeFixtureIcon /> },
  },
};

export function CounterBadgeComparison({
  examples = counterBadgeExamples,
}: {
  examples?: readonly CounterBadgeExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-counterbadge-case={example.name}>
          <span>{example.name}</span>
          <div className={styles.cell} data-badge-implementation="legacy">
            <LegacyCounterBadge {...example.props} />
          </div>
          <div className={styles.cell} data-badge-implementation="headless">
            <HeadlessCounterBadge {...example.props} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CounterBadgeNotifications(props: CounterBadgeProps): React.ReactElement {
  const [count, setCount] = React.useState(0);
  const [dot, setDot] = React.useState(false);
  const [showZero, setShowZero] = React.useState(false);
  return (
    <div className={styles.playground}>
      <p>
        The host button names its notifications; the decorative badge is hidden from assistive
        technology.
      </p>
      <button type="button" aria-label={`Inbox, ${count} unread messages`}>
        Inbox{' '}
        <HeadlessCounterBadge
          {...props}
          count={count}
          dot={dot}
          showZero={showZero}
          aria-hidden="true"
        />
      </button>
      <div className={styles.actions}>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Receive message
        </button>
        <button type="button" onClick={() => setCount(100)}>
          Receive 100 messages
        </button>
        <button type="button" onClick={() => setCount(0)}>
          Clear inbox
        </button>
        <button type="button" aria-pressed={dot} onClick={() => setDot((value) => !value)}>
          Dot only
        </button>
        <button
          type="button"
          aria-pressed={showZero}
          onClick={() => setShowZero((value) => !value)}
        >
          Show zero
        </button>
      </div>
      <output aria-live="polite">{count} unread messages</output>
    </div>
  );
}
