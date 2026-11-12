// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Spinner as LegacySpinner } from '@coreai-ds/react-components';
import {
  Spinner as HeadlessSpinner,
  type SpinnerProps,
  type SpinnerSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './SpinnerComparison.module.css';

export const spinnerSizes = [
  'extra-tiny',
  'tiny',
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
  'huge',
] as const;
export const spinnerAppearances = ['primary', 'inverted'] as const;
export const spinnerLabelPositions = ['before', 'after', 'above', 'below'] as const;

export interface SpinnerExample {
  name: string;
  props: SpinnerProps;
}

const label = 'Loading projects…';

const renderSpinner: SlotRenderFunction<ExtractSlotProps<SpinnerSlots['spinner']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-spinner="">
    {props.children}
    <span className={styles.customContent} data-consumer-spinner-child="" />
  </Component>
);

const renderLabel: SlotRenderFunction<ExtractSlotProps<SpinnerSlots['label']>> = (
  Component,
  props,
) => (
  <Component {...props}>
    <span data-consumer-label-child="">Loading projects…</span>
  </Component>
);

export const spinnerExamples: SpinnerExample[] = [
  { name: 'Default', props: { label } },
  ...spinnerAppearances.flatMap((appearance) =>
    spinnerSizes.map((size) => ({
      name: `${appearance}: ${size}`,
      props: { appearance, size, label },
    })),
  ),
  ...spinnerLabelPositions
    .filter((labelPosition) => labelPosition !== 'after')
    .map((labelPosition) => ({
      name: `Label: ${labelPosition}`,
      props: { labelPosition, label },
    })),
  { name: 'Without label', props: { 'aria-label': 'Loading projects' } },
  {
    name: 'Without label above',
    props: { label: null, labelPosition: 'above', 'aria-label': 'Loading projects' },
  },
  { name: 'Without spinning ring', props: { spinner: null, label } },
  { name: 'Inline root', props: { as: 'span', size: 'tiny', label } },
  {
    name: 'Wrapping label',
    props: {
      style: { maxWidth: '180px' },
      label: 'Loading the projects you worked on most recently…',
    },
  },
  { name: 'Required label', props: { label: { children: label, required: true } } },
  { name: 'Disabled label', props: { label: { children: label, disabled: true } } },
  {
    name: 'Inverted disabled required label',
    props: {
      appearance: 'inverted',
      label: { children: label, required: true, disabled: true },
    },
  },
  {
    name: 'Small ring with large required label',
    props: {
      size: 'small',
      label: { children: label, size: 'large', weight: 'semibold', required: '(required)' },
    },
  },
  {
    name: 'Rich label',
    props: {
      label: {
        children: (
          <span data-consumer-label-child="">
            Loading <em>projects</em>…
          </span>
        ),
        className: 'consumer-label',
      },
    },
  },
  {
    name: 'Spinner and label render functions',
    props: {
      spinner: { className: 'consumer-spinner', children: renderSpinner },
      label: { className: 'consumer-label', required: true, children: renderLabel },
    },
  },
  {
    name: 'Custom tail content',
    props: {
      label,
      spinnerTail: {
        className: 'consumer-tail',
        children: <span className={styles.customContent} data-consumer-tail-child="" />,
      },
    },
  },
  {
    name: 'Explicitly undefined visual props',
    props: { size: undefined, appearance: undefined, labelPosition: undefined, label },
  },
];

export const spinnerConsumerExample: SpinnerExample = {
  name: 'Consumer CSS Modules',
  props: {
    size: 'small',
    className: styles.consumerRoot,
    spinner: { className: styles.consumerSpinner },
    spinnerTail: { className: styles.consumerTail },
    label: {
      children: label,
      className: styles.consumerLabel,
      required: { children: '*', className: styles.consumerRequired },
    },
  },
};

function SpinnerFixture({
  implementation,
  name,
  props,
}: SpinnerExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacySpinner : HeadlessSpinner;
  return (
    <div
      className={[styles.cell, props.appearance === 'inverted' && styles.inverted]
        .filter(Boolean)
        .join(' ')}
      data-spinner-implementation={implementation}
    >
      <Component
        {...props}
        aria-label={props.label == null ? (props['aria-label'] ?? name) : props['aria-label']}
      />
    </div>
  );
}

export function SpinnerComparison({
  examples = spinnerExamples,
}: {
  examples?: readonly SpinnerExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-spinner-case={example.name}>
          <span>{example.name}</span>
          <SpinnerFixture {...example} implementation="legacy" />
          <SpinnerFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
