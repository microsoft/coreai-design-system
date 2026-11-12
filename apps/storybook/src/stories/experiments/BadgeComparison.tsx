// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Badge as LegacyBadge } from '@coreai-ds/react-components';
import {
  Badge as HeadlessBadge,
  type BadgeProps,
  type BadgeSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './BadgeComparison.module.css';

export const badgeAppearances = ['filled', 'ghost', 'outline', 'tint'] as const;
export const badgeColors = [
  'brand',
  'danger',
  'important',
  'informative',
  'severe',
  'subtle',
  'success',
  'warning',
] as const;
export const badgeShapes = ['circular', 'rounded', 'square'] as const;
export const badgeSizes = [
  'tiny',
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
] as const;

export function BadgeFixtureIcon(): React.ReactElement {
  return (
    <svg
      data-parity-glyph=""
      aria-hidden="true"
      width="1em"
      height="1em"
      viewBox="0 0 12 12"
      fill="currentColor"
    >
      <path d="M6 1 11 6 6 11 1 6Z" />
    </svg>
  );
}

export const badgeIconRenderer: SlotRenderFunction<ExtractSlotProps<BadgeSlots['icon']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-icon="">
    <BadgeFixtureIcon />
  </Component>
);

export const badgeRootRenderer: SlotRenderFunction<ExtractSlotProps<BadgeSlots['root']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-root="">
    {props.children}
    <span data-consumer-root-child="" />
  </Component>
);

export interface BadgeExample {
  name: string;
  props: BadgeProps;
}

export const badgeExamples: BadgeExample[] = [
  { name: 'Default', props: { children: 'Ready' } },
  ...badgeAppearances.flatMap((appearance) =>
    badgeColors.map((color) => ({
      name: `${appearance}: ${color}`,
      props: { appearance, color, children: 'Ready', icon: <BadgeFixtureIcon /> },
    })),
  ),
  ...badgeSizes.map((size) => ({
    name: `Size: ${size}`,
    props: {
      size,
      icon: <BadgeFixtureIcon />,
      children: size === 'tiny' || size === 'extra-small' ? undefined : '9',
    },
  })),
  ...badgeShapes.map((shape) => ({
    name: `Shape: ${shape}`,
    props: { shape, children: 'Team' },
  })),
  ...(['tiny', 'extra-small', 'small'] as const).map((size) => ({
    name: `Small rounded: ${size}`,
    props: { size, shape: 'rounded' as const },
  })),
  { name: 'Icon only', props: { icon: <BadgeFixtureIcon />, 'aria-label': 'Project ready' } },
  {
    name: 'Icon after content',
    props: { icon: <BadgeFixtureIcon />, iconPosition: 'after', children: 'Ready' },
  },
  {
    name: 'Extra-large icon after content',
    props: {
      size: 'extra-large',
      icon: <BadgeFixtureIcon />,
      iconPosition: 'after',
      children: '9',
    },
  },
  { name: 'Numeric zero content', props: { children: 0, icon: <BadgeFixtureIcon /> } },
  { name: 'False content', props: { children: false, icon: <BadgeFixtureIcon /> } },
  { name: 'Null icon', props: { icon: null, children: 'Ready' } },
  {
    name: 'Consumer content and classes',
    props: {
      className: 'consumer-badge',
      icon: { className: 'consumer-icon', children: <BadgeFixtureIcon /> },
      children: <span className="consumer-content">Ready</span>,
    },
  },
  {
    name: 'Icon slot render function',
    props: { children: 'Ready', icon: { children: badgeIconRenderer, className: 'consumer-icon' } },
  },
  {
    name: 'Root slot render function',
    props: { children: badgeRootRenderer, icon: <BadgeFixtureIcon /> },
  },
  {
    name: 'Explicitly undefined visual props',
    props: {
      appearance: undefined,
      color: undefined,
      shape: undefined,
      size: undefined,
      children: 'Ready',
    },
  },
];

export const badgeConsumerExample: BadgeExample = {
  name: 'Unlayered consumer CSS',
  props: {
    appearance: 'tint',
    color: 'danger',
    shape: 'rounded',
    children: 'Ready',
    className: styles.consumerRoot,
    icon: { className: styles.consumerIcon, children: <BadgeFixtureIcon /> },
  },
};

function BadgeFixture({
  implementation,
  props,
}: BadgeExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacyBadge : HeadlessBadge;
  const branded =
    props.color === 'subtle' && (props.appearance === 'ghost' || props.appearance === 'outline');
  return (
    <div
      className={[styles.cell, branded && styles.brandSurface].filter(Boolean).join(' ')}
      data-badge-implementation={implementation}
    >
      <Component {...props} />
    </div>
  );
}

export function BadgeComparison({
  examples = badgeExamples,
}: {
  examples?: readonly BadgeExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-badge-case={example.name}>
          <span>{example.name}</span>
          <BadgeFixture {...example} implementation="legacy" />
          <BadgeFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
