// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Field, Select as LegacySelect } from '@coreai-ds/react-components';
import { Select as HeadlessSelect, type SelectProps } from '@coreai-ds/react-headless-components';
import styles from './SelectComparison.module.css';

export const selectAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;

export interface SelectExample {
  name: string;
  props: SelectProps;
  field?: {
    size?: 'small' | 'medium' | 'large';
    required?: boolean;
    validationState?: 'none' | 'error' | 'warning' | 'success';
    validationMessage?: string;
    hint?: string;
  };
}

export const selectOptions = (
  <>
    <option value="red">Red</option>
    <option value="green">Green</option>
    <option value="blue">Blue</option>
  </>
);

export const selectGroupedOptions = (
  <>
    <optgroup label="Available">
      <option value="red">Red</option>
      <option value="green">Green</option>
    </optgroup>
    <optgroup label="Later" disabled>
      <option value="blue">Blue</option>
    </optgroup>
    <option value="other" disabled>
      Other
    </option>
  </>
);

export const selectExamples: SelectExample[] = [
  { name: 'Default', props: {} },
  { name: 'Explicit undefined appearance', props: { appearance: undefined } },
  ...selectAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, defaultValue: 'green' },
  })),
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: 'blue' },
  })),
  ...selectAppearances.map((appearance) => ({
    name: `Disabled: ${appearance}`,
    props: { appearance, disabled: true, 'aria-invalid': true },
  })),
  ...selectAppearances.map((appearance) => ({
    name: `Invalid: ${appearance}`,
    props: { appearance, 'aria-invalid': true },
  })),
  { name: 'No icon', props: { icon: null } },
  { name: 'Empty options', props: { children: [] } },
  {
    name: 'Controlled value',
    props: { value: 'blue', onChange: () => undefined },
  },
  {
    name: 'Custom icon slot',
    props: { icon: { children: <span className="select-custom-icon-child">⌄</span> } },
  },
  { name: 'Grouped options', props: { children: selectGroupedOptions, defaultValue: 'green' } },
  { name: 'Text as value', props: { children: <option>Text without a value prop</option> } },
  {
    name: 'Resolved native slot',
    props: { disabled: true, select: { disabled: false, 'aria-invalid': 'grammar' } },
  },
  {
    name: 'Field validation and size',
    props: {},
    field: {
      size: 'large',
      required: true,
      validationState: 'error',
      validationMessage: 'Choose a color',
      hint: 'Used for the project label',
    },
  },
  {
    name: 'Explicit size over Field',
    props: { size: 'small' },
    field: { size: 'large' },
  },
  {
    name: 'Undefined size inherits Field',
    props: { size: undefined },
    field: { size: 'small' },
  },
];

export const selectConsumerExample: SelectExample = {
  name: 'Consumer CSS Modules',
  props: {
    className: styles.consumerRoot,
    select: { className: styles.consumerSelect },
    icon: { className: styles.consumerIcon },
  },
};

function ExampleCell({
  implementation,
  example: { name, props, field },
}: {
  implementation: 'legacy' | 'headless';
  example: SelectExample;
}): React.ReactElement {
  const generatedId = React.useId();
  const id = `${props.id ?? generatedId}-${implementation}`;
  const accessibleName = field ? undefined : (props['aria-label'] ?? name);
  const options = Object.prototype.hasOwnProperty.call(props, 'children')
    ? props.children
    : selectOptions;
  const control =
    implementation === 'headless' ? (
      <HeadlessSelect {...props} id={id} aria-label={accessibleName}>
        {options}
      </HeadlessSelect>
    ) : (
      <LegacySelect {...props} id={id} aria-label={accessibleName}>
        {options}
      </LegacySelect>
    );
  return (
    <div data-select-implementation={implementation}>
      {field ? (
        <Field {...field} label={name}>
          {control}
        </Field>
      ) : (
        control
      )}
    </div>
  );
}

export function SelectComparison({
  examples = selectExamples,
}: {
  examples?: readonly SelectExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row} data-select-comparison-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-select-case={example.name}>
          <span>{example.name}</span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}
