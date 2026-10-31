// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Label as LegacyLabel } from '@coreai-ds/react-components';
import { Label as HeadlessLabel, type LabelProps } from '@coreai-ds/react-headless-components';
import styles from './LabelComparison.module.css';

export const labelSizes = ['small', 'medium', 'large'] as const;
export const labelWeights = ['regular', 'semibold'] as const;

export interface LabelExample {
  name: string;
  props: LabelProps;
}

export const labelExamples: LabelExample[] = [
  { name: 'Default', props: { children: 'Project name' } },
  {
    name: 'Explicitly undefined defaults',
    props: {
      children: 'Project name',
      size: undefined,
      weight: undefined,
      disabled: undefined,
      required: undefined,
    },
  },
  ...labelSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, children: 'Project name' },
  })),
  { name: 'Semibold', props: { weight: 'semibold', children: 'Project name' } },
  { name: 'Required', props: { required: true, children: 'Project name' } },
  { name: 'Required string', props: { required: '***', children: 'Project name' } },
  {
    name: 'Required slot',
    props: {
      required: { children: '(required)', title: 'Required field' },
      children: 'Project name',
    },
  },
  {
    name: 'Required JSX',
    props: { required: <em>!</em>, children: 'Project name' },
  },
  { name: 'Disabled', props: { disabled: true, children: 'Project name' } },
  {
    name: 'Disabled required',
    props: { disabled: true, required: true, children: 'Project name' },
  },
  {
    name: 'Disabled indicator with root color',
    props: {
      disabled: true,
      required: true,
      style: { color: 'rgb(20, 80, 120)' },
      children: 'Project name',
    },
  },
  {
    name: 'Small semibold required',
    props: { size: 'small', weight: 'semibold', required: true, children: 'Project name' },
  },
  {
    name: 'Large regular required',
    props: { size: 'large', weight: 'regular', required: true, children: 'Project name' },
  },
];

export const labelConsumerExample: LabelExample = {
  name: 'Consumer CSS Modules',
  props: {
    children: 'Project name',
    size: 'large',
    weight: 'semibold',
    className: styles.consumerLabel,
    required: { children: '*', className: styles.consumerRequired },
  },
};

function LabelFixture({
  implementation,
  props,
}: LabelExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const id = React.useId();
  const controlId = `${implementation}-${id}`;
  const Component = implementation === 'legacy' ? LegacyLabel : HeadlessLabel;
  return (
    <div className={styles.cell} data-implementation={implementation}>
      <Component {...props} id={`${controlId}-label`} htmlFor={controlId} />
      <input
        className={styles.control}
        id={controlId}
        type="text"
        disabled={props.disabled}
        required={Boolean(props.required)}
      />
    </div>
  );
}

export function LabelComparison({
  examples = labelExamples,
}: {
  examples?: readonly LabelExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-label-case={example.name}>
          <span>{example.name}</span>
          <LabelFixture {...example} implementation="legacy" />
          <LabelFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
