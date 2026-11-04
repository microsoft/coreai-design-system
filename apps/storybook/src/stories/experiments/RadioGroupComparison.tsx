// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Field,
  Radio as LegacyRadio,
  RadioGroup as LegacyRadioGroup,
} from '@coreai-ds/react-components';
import {
  Radio as HeadlessRadio,
  RadioGroup as HeadlessRadioGroup,
  type RadioGroupProps,
  type RadioProps,
} from '@coreai-ds/react-headless-components';
import styles from './RadioGroupComparison.module.css';

export const radioGroupLayouts = ['vertical', 'horizontal', 'horizontal-stacked'] as const;
export const radioLabelPositions = ['after', 'below'] as const;
export const radioLabelSizes = ['small', 'medium', 'large'] as const;

export interface RadioGroupExample {
  name: string;
  props: Omit<RadioGroupProps, 'children'>;
  radios?: readonly RadioProps[];
  field?: {
    label: string;
    required?: boolean;
    hint?: string;
    validationState?: 'error';
    validationMessage?: string;
  };
}

export const radioGroupOptions: readonly RadioProps[] = [
  { value: 'free', label: 'Free' },
  { value: 'standard', label: 'Standard' },
  { value: 'team', label: 'Team' },
];

export const radioGroupExamples: RadioGroupExample[] = [
  { name: 'Default', props: { defaultValue: 'standard' } },
  ...radioGroupLayouts
    .filter((layout) => layout !== 'vertical')
    .map((layout) => ({
      name: `Layout: ${layout}`,
      props: { layout, defaultValue: 'standard' },
    })),
  { name: 'No selection', props: {} },
  { name: 'Controlled value', props: { value: 'team' } },
  {
    name: 'Item defaultChecked',
    props: {},
    radios: radioGroupOptions.map((option) => ({
      ...option,
      defaultChecked: option.value === 'free',
    })),
  },
  { name: 'Disabled group', props: { disabled: true, defaultValue: 'standard' } },
  {
    name: 'Disabled item',
    props: { defaultValue: 'free' },
    radios: radioGroupOptions.map((option) => ({
      ...option,
      disabled: option.value === 'standard',
    })),
  },
  {
    name: 'Input-slot disabled',
    props: { defaultValue: 'standard' },
    radios: [{ value: 'standard', label: 'Standard', input: { disabled: true } }],
  },
  {
    name: 'Required group',
    props: { required: true, defaultValue: 'free' },
  },
  {
    name: 'Required Field',
    props: {},
    field: {
      label: 'Plan',
      required: true,
      hint: 'Select one plan.',
      validationState: 'error',
      validationMessage: 'A plan is required.',
    },
  },
  ...radioLabelSizes.map((size) => ({
    name: `Label size: ${size}`,
    props: { defaultValue: 'standard' },
    radios: [{ value: 'standard', label: { children: 'Standard', size } }],
  })),
  {
    name: 'Required label slot',
    props: { defaultValue: 'standard' },
    radios: [
      {
        value: 'standard',
        label: { children: 'Standard', size: 'large', weight: 'semibold', required: true },
      },
    ],
  },
  {
    name: 'Disabled required label',
    props: { disabled: true, defaultValue: 'standard' },
    radios: [
      {
        value: 'standard',
        label: { children: 'Standard', required: '(required)' },
      },
    ],
  },
  {
    name: 'Label below',
    props: { defaultValue: 'standard' },
    radios: [{ value: 'standard', label: 'Standard', labelPosition: 'below' }],
  },
  {
    name: 'Stacked label-position override',
    props: { layout: 'horizontal-stacked', defaultValue: 'standard' },
    radios: [{ value: 'standard', label: 'Standard', labelPosition: 'after' }],
  },
  {
    name: 'Wrapping label',
    props: {},
    radios: [
      {
        value: 'standard',
        label: 'Standard plan for a small project team.',
        style: { maxWidth: '180px' },
      },
    ],
  },
  {
    name: 'No visual label',
    props: { defaultValue: 'standard' },
    radios: [{ value: 'standard', 'aria-label': 'Standard', label: null }],
  },
  {
    name: 'Consumer indicator children',
    props: { defaultValue: 'standard' },
    radios: radioGroupOptions.map((option) => ({
      ...option,
      indicator: { children: <span className={styles.customDot} data-custom-dot="" /> },
    })),
  },
];

export const radioGroupConsumerExample: RadioGroupExample = {
  name: 'Consumer CSS Modules',
  props: {
    defaultValue: 'standard',
    className: styles.consumerGroup,
  },
  radios: [
    {
      value: 'standard',
      className: styles.consumerRadio,
      input: { className: styles.consumerInput },
      indicator: { className: styles.consumerIndicator },
      label: {
        children: 'Standard',
        className: styles.consumerLabel,
        required: { children: '*', className: styles.consumerRequired },
      },
    },
  ],
};

function RadioGroupFixture({
  implementation,
  name,
  props,
  radios = radioGroupOptions,
  field,
}: RadioGroupExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const generatedId = React.useId();
  const Group = implementation === 'legacy' ? LegacyRadioGroup : HeadlessRadioGroup;
  const Item = implementation === 'legacy' ? LegacyRadio : HeadlessRadio;
  const group = (
    <Group
      {...props}
      name={`${props.name ?? generatedId}-${implementation}`}
      aria-label={field ? props['aria-label'] : (props['aria-label'] ?? name)}
    >
      {radios.map((option, index) => (
        <Item
          key={option.value ?? index}
          {...option}
          id={`${option.id ?? generatedId}-${implementation}-${index}`}
        />
      ))}
    </Group>
  );
  return (
    <div className={styles.cell} data-radiogroup-implementation={implementation}>
      {field ? <Field {...field}>{group}</Field> : group}
    </div>
  );
}

export function RadioGroupComparison({
  examples = radioGroupExamples,
}: {
  examples?: readonly RadioGroupExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-radiogroup-case={example.name}>
          <span>{example.name}</span>
          <RadioGroupFixture {...example} implementation="legacy" />
          <RadioGroupFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
