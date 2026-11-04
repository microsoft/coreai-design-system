// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Input as LegacyInput } from '@coreai-ds/react-components';
import { Input as HeadlessInput, type InputProps } from '@coreai-ds/react-headless-components';
import { SearchRegular } from '@fluentui/react-icons';
import styles from './InputComparison.module.css';

export const inputAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;

export interface InputExample {
  name: string;
  props: InputProps;
}

const leadingIcon = <SearchRegular aria-hidden="true" />;
const trailingText = <span aria-hidden="true">kg</span>;

export const inputExamples: InputExample[] = [
  { name: 'Default', props: { placeholder: 'Enter a value' } },
  ...inputAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, defaultValue: 'Example' },
  })),
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `Size with slots: ${size}`,
    props: {
      size,
      defaultValue: 'Example',
      contentBefore: leadingIcon,
      contentAfter: trailingText,
    },
  })),
  {
    name: 'Content before',
    props: { defaultValue: 'Example', contentBefore: leadingIcon },
  },
  {
    name: 'Content after',
    props: { defaultValue: 'Example', contentAfter: trailingText },
  },
  { name: 'Inline label empty', props: { label: 'Name', placeholder: 'Enter a name' } },
  { name: 'Inline label value', props: { label: 'Name', defaultValue: 'Ada' } },
  {
    name: 'Inline label replaces prefix',
    props: { label: 'Name', defaultValue: 'Ada', contentBefore: leadingIcon },
  },
  {
    name: 'Dynamic width',
    props: { label: 'Name', defaultValue: 'Ada', dynamicWidth: true },
  },
  {
    name: 'Truncated value',
    props: {
      label: 'Project',
      defaultValue: 'A project name that is too long to fit',
      truncateTextOverflow: true,
      style: { width: '240px' },
    },
  },
  {
    name: 'Disabled with label',
    props: { label: 'Name', disabled: true, defaultValue: 'Ada' },
  },
  {
    name: 'Disabled placeholder',
    props: { disabled: true, placeholder: 'Unavailable', contentBefore: leadingIcon },
  },
  {
    name: 'Read only copy action',
    props: { label: 'Account', readOnly: true, defaultValue: 'Ada' },
  },
  {
    name: 'Read only custom suffix',
    props: { readOnly: true, defaultValue: 'Example', contentAfter: trailingText },
  },
  {
    name: 'Invalid',
    props: { appearance: 'outline', 'aria-invalid': true, defaultValue: 'Invalid value' },
  },
  { name: 'Native email', props: { type: 'email', defaultValue: 'ada@example.com' } },
];

export const inputConsumerExample: InputExample = {
  name: 'Consumer CSS Modules',
  props: {
    label: 'Amount',
    defaultValue: '12',
    className: styles.consumerRoot,
    input: { className: styles.consumerInput },
    contentAfter: { className: styles.consumerAfter, children: trailingText },
  },
};

function ExampleCell({
  implementation,
  example: { name, props },
}: {
  implementation: 'legacy' | 'headless';
  example: InputExample;
}): React.ReactElement {
  const generatedId = React.useId();
  const id = `${props.id ?? generatedId}-${implementation}`;
  const accessibleName = props.label ? undefined : (props['aria-label'] ?? name);

  return (
    <div data-input-implementation={implementation}>
      {implementation === 'headless' ? (
        <HeadlessInput {...props} id={id} aria-label={accessibleName} />
      ) : (
        <LegacyInput {...props} id={id} aria-label={accessibleName} />
      )}
    </div>
  );
}

export function InputComparison({
  examples = inputExamples,
}: {
  examples?: readonly InputExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row} data-input-comparison-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-input-case={example.name}>
          <span>{example.name}</span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}
