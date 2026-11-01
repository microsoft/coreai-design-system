// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Checkbox as LegacyCheckbox } from '@coreai-ds/react-components';
import {
  Checkbox as HeadlessCheckbox,
  type CheckboxProps,
} from '@coreai-ds/react-headless-components';
import styles from './CheckboxComparison.module.css';

export const checkboxSizes = ['medium', 'large'] as const;
export const checkboxShapes = ['square', 'circular'] as const;
export const checkboxCheckedStates = [false, true, 'mixed'] as const;

export interface CheckboxExample {
  name: string;
  props: CheckboxProps;
}

const label = 'Send project updates';

export const checkboxExamples: CheckboxExample[] = [
  { name: 'Default', props: { label } },
  {
    name: 'Explicitly undefined defaults',
    props: {
      label,
      size: undefined,
      shape: undefined,
      disabled: undefined,
      labelPosition: undefined,
    },
  },
  { name: 'Checked', props: { label, defaultChecked: true } },
  { name: 'Mixed', props: { label, defaultChecked: 'mixed' } },
  { name: 'Large', props: { label, size: 'large' } },
  { name: 'Large checked', props: { label, size: 'large', defaultChecked: true } },
  { name: 'Large mixed', props: { label, size: 'large', defaultChecked: 'mixed' } },
  { name: 'Circular', props: { label, shape: 'circular' } },
  { name: 'Circular checked', props: { label, shape: 'circular', defaultChecked: true } },
  { name: 'Circular mixed', props: { label, shape: 'circular', defaultChecked: 'mixed' } },
  {
    name: 'Large circular mixed',
    props: { label, shape: 'circular', size: 'large', defaultChecked: 'mixed' },
  },
  { name: 'Label before', props: { label, labelPosition: 'before', defaultChecked: true } },
  ...checkboxCheckedStates.map((checked) => ({
    name: `Disabled ${String(checked)}`,
    props: { label, disabled: true, checked },
  })),
  { name: 'Required', props: { label, required: true } },
  {
    name: 'Disabled required',
    props: { label, disabled: true, required: true },
  },
  {
    name: 'Disabled Label override',
    props: { label: { children: label, disabled: true, required: true } },
  },
  {
    name: 'Custom required label',
    props: {
      required: true,
      label: {
        children: label,
        size: 'large',
        weight: 'regular',
        required: { children: '(required)', title: 'Required preference' },
      },
    },
  },
  {
    name: 'Wrapped label',
    props: {
      label: 'Send project updates, including schedule changes and review requests',
      style: { maxWidth: '180px' },
    },
  },
  {
    name: 'Custom indicator slot',
    props: {
      label,
      defaultChecked: true,
      indicator: { as: 'span', children: <span className="caller-glyph">✓</span> },
    },
  },
];

export const checkboxConsumerExample: CheckboxExample = {
  name: 'Consumer CSS Modules',
  props: {
    required: true,
    defaultChecked: true,
    size: 'large',
    shape: 'circular',
    className: styles.consumerRoot,
    input: { className: styles.consumerInput },
    indicator: { className: styles.consumerIndicator },
    label: {
      children: label,
      className: styles.consumerLabel,
      required: { children: '*', className: styles.consumerRequired },
    },
  },
};

function CheckboxFixture({
  implementation,
  props,
}: CheckboxExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const generatedId = React.useId();
  const id = `${props.input?.id ?? props.id ?? generatedId}-${implementation}`;
  const Component = implementation === 'legacy' ? LegacyCheckbox : HeadlessCheckbox;
  return (
    <div className={styles.cell} data-checkbox-implementation={implementation}>
      <Component {...props} id={id} input={props.input ? { ...props.input, id } : undefined} />
    </div>
  );
}

export function CheckboxComparison({
  examples = checkboxExamples,
}: {
  examples?: readonly CheckboxExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row} data-checkbox-comparison-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-checkbox-case={example.name}>
          <span>{example.name}</span>
          <CheckboxFixture {...example} implementation="legacy" />
          <CheckboxFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
