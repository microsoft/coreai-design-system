// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Switch as LegacySwitch } from '@coreai-ds/react-components';
import { Switch as HeadlessSwitch, type SwitchProps } from '@coreai-ds/react-headless-components';
import styles from './SwitchComparison.module.css';

export const switchSizes = ['small', 'medium'] as const;
export const switchLabelPositions = ['after', 'before', 'above'] as const;

export interface SwitchExample {
  name: string;
  props: SwitchProps;
}

const label = 'Email notifications';

export const switchExamples: SwitchExample[] = [
  { name: 'Default', props: { label } },
  ...switchSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, label },
  })),
  { name: 'Initially checked', props: { defaultChecked: true, label } },
  { name: 'Controlled checked', props: { checked: true, label } },
  { name: 'Disabled unchecked', props: { disabled: true, label } },
  { name: 'Disabled checked', props: { disabled: true, checked: true, label } },
  {
    name: 'Disabled focusable',
    props: { disabled: true, disabledFocusable: true, label },
  },
  {
    name: 'Disabled focusable checked without disabled',
    props: { disabledFocusable: true, checked: true, label },
  },
  ...switchLabelPositions
    .filter((labelPosition) => labelPosition !== 'after')
    .map((labelPosition) => ({
      name: `Label: ${labelPosition}`,
      props: { labelPosition, label },
    })),
  {
    name: 'Small checked label above',
    props: { size: 'small', defaultChecked: true, labelPosition: 'above', label },
  },
  {
    name: 'Wrapping label',
    props: {
      style: { maxWidth: '180px' },
      label: 'Email me when someone changes the project settings.',
    },
  },
  { name: 'Without label', props: { 'aria-label': 'Email notifications' } },
  {
    name: 'Without label above',
    props: { label: null, labelPosition: 'above', 'aria-label': 'Email notifications' },
  },
  { name: 'Small required', props: { size: 'small', required: true, label } },
  {
    name: 'Label visual props',
    props: {
      label: { children: label, size: 'large', weight: 'semibold', required: '(required)' },
    },
  },
  {
    name: 'Small switch with large label',
    props: {
      size: 'small',
      label: { children: label, size: 'large', weight: 'semibold', required: true },
    },
  },
  {
    name: 'Label visual opt-out',
    props: {
      disabled: true,
      required: true,
      label: { children: label, disabled: false, required: false },
    },
  },
  {
    name: 'Native slot disabled',
    props: { input: { disabled: true }, defaultChecked: true, label },
  },
  {
    name: 'Consumer indicator content',
    props: {
      defaultChecked: true,
      label,
      indicator: {
        children: <span className={styles.customThumb} data-consumer-thumb="" />,
      },
    },
  },
];

export const switchConsumerExample: SwitchExample = {
  name: 'Consumer CSS Modules',
  props: {
    size: 'small',
    checked: true,
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

function SwitchFixture({
  implementation,
  name,
  props,
}: SwitchExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const generatedId = React.useId();
  const id = `${props.id ?? generatedId}-${implementation}`;
  const Component = implementation === 'legacy' ? LegacySwitch : HeadlessSwitch;
  return (
    <div className={styles.cell} data-switch-implementation={implementation}>
      <Component
        {...props}
        id={id}
        aria-label={props.label == null ? (props['aria-label'] ?? name) : props['aria-label']}
      />
    </div>
  );
}

export function SwitchComparison({
  examples = switchExamples,
}: {
  examples?: readonly SwitchExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-switch-case={example.name}>
          <span>{example.name}</span>
          <SwitchFixture {...example} implementation="legacy" />
          <SwitchFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
