// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Field,
  SpinButton as LegacySpinButton,
  type FieldProps,
} from '@coreai-ds/react-components';
import {
  SpinButton as HeadlessSpinButton,
  type SpinButtonOnChangeData,
  type SpinButtonProps,
} from '@coreai-ds/react-headless-components';
import styles from './SpinButtonComparison.module.css';

export const spinButtonAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;
export const spinButtonSizes = ['small', 'medium'] as const;

export interface SpinButtonExample {
  name: string;
  props: SpinButtonProps;
  field?: Pick<FieldProps, 'size' | 'required' | 'validationState' | 'validationMessage' | 'hint'>;
}

export const spinButtonExamples: readonly SpinButtonExample[] = [
  { name: 'Default', props: {} },
  { name: 'Explicit undefined appearance', props: { appearance: undefined } },
  { name: 'Explicit undefined size', props: { size: undefined } },
  ...spinButtonAppearances.flatMap((appearance) =>
    spinButtonSizes.map((size) => ({
      name: `${appearance}, ${size}`,
      props: { appearance, size, defaultValue: 4.5, step: 0.5 },
    })),
  ),
  ...spinButtonAppearances.map((appearance) => ({
    name: `Disabled ${appearance}`,
    props: { appearance, disabled: true, defaultValue: 4 },
  })),
  ...spinButtonAppearances.map((appearance) => ({
    name: `Read only ${appearance}`,
    props: { appearance, readOnly: true, defaultValue: 4 },
  })),
  { name: 'Empty with placeholder', props: { defaultValue: null, placeholder: 'Quantity' } },
  {
    name: 'Disabled placeholder',
    props: { defaultValue: null, disabled: true, placeholder: 'Unavailable' },
  },
  { name: 'At minimum', props: { defaultValue: 0, min: 0, max: 10 } },
  { name: 'At maximum', props: { defaultValue: 10, min: 0, max: 10 } },
  { name: 'Both bounds', props: { defaultValue: 5, min: 5, max: 5 } },
  {
    name: 'Controlled formatted value',
    props: { value: 3.5, displayValue: '$3.50', precision: 2 },
  },
  { name: 'Controlled empty value', props: { value: null, displayValue: '(empty)' } },
  {
    name: 'Invalid outline',
    props: { appearance: 'outline', 'aria-invalid': true, defaultValue: 4 },
  },
  {
    name: 'Disabled invalid',
    props: { appearance: 'outline', disabled: true, 'aria-invalid': true, defaultValue: 4 },
  },
  {
    name: 'Spelling is not validation failure',
    props: { appearance: 'outline', 'aria-invalid': 'spelling' },
  },
  {
    name: 'Custom step controls',
    props: {
      defaultValue: 4,
      incrementButton: { children: <span aria-hidden>+</span>, 'aria-label': 'Add one' },
      decrementButton: { children: <span aria-hidden>−</span>, 'aria-label': 'Remove one' },
    },
  },
  {
    name: 'Explicit empty glyph children',
    props: { incrementButton: { children: false }, decrementButton: { children: false } },
  },
  { name: 'Native input size', props: { input: { size: 12 }, defaultValue: 12 } },
  {
    name: 'Field validation and required',
    props: { defaultValue: 4 },
    field: {
      required: true,
      validationState: 'error',
      validationMessage: 'Choose a quantity',
      hint: 'Use a number from 0 to 10',
    },
  },
  {
    name: 'Field does not change default size',
    props: { defaultValue: 4 },
    field: { size: 'large' },
  },
  {
    name: 'Explicit undefined size in small Field',
    props: { size: undefined, defaultValue: 4 },
    field: { size: 'small' },
  },
  {
    name: 'Explicit small size in large Field',
    props: { size: 'small', defaultValue: 4 },
    field: { size: 'large' },
  },
];

export const spinButtonConsumerExample: SpinButtonExample = {
  name: 'Consumer CSS Modules',
  props: {
    defaultValue: 4,
    className: styles.consumerRoot,
    input: { className: styles.consumerInput },
    incrementButton: { className: styles.consumerIncrement },
    decrementButton: { className: styles.consumerDecrement },
  },
};

function ExampleCell({
  implementation,
  example: { name, props, field },
}: {
  implementation: 'legacy' | 'headless';
  example: SpinButtonExample;
}): React.ReactElement {
  const generatedId = React.useId();
  const id = field ? props.id : `${props.id ?? generatedId}-${implementation}`;
  const accessibleName = props['aria-label'] ?? (field ? undefined : name);
  const control =
    implementation === 'headless' ? (
      <HeadlessSpinButton {...props} id={id} aria-label={accessibleName} />
    ) : (
      <LegacySpinButton {...props} id={id} aria-label={accessibleName} />
    );

  return (
    <div data-spinbutton-implementation={implementation}>
      {field ? (
        <Field label={name} {...field}>
          {control}
        </Field>
      ) : (
        control
      )}
    </div>
  );
}

export function SpinButtonComparison({
  examples = spinButtonExamples,
}: {
  examples?: readonly SpinButtonExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row} data-spinbutton-comparison-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-spinbutton-case={example.name}>
          <span>{example.name}</span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}

function Payload({ data }: { data: SpinButtonOnChangeData | null }): React.ReactElement {
  return (
    <>
      value: {data?.value === undefined ? 'undefined' : String(data.value)}; displayValue:{' '}
      {data?.displayValue === undefined ? 'undefined' : JSON.stringify(data.displayValue)}
    </>
  );
}

export function SpinButtonNumericFlow(props: SpinButtonProps): React.ReactElement {
  const id = React.useId();
  const [commits, setCommits] = React.useState(0);
  const [lastChange, setLastChange] = React.useState<SpinButtonOnChangeData | null>(null);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.flow}
      aria-label="Quantity form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('quantity') ?? ''));
      }}
    >
      <p>
        Typing edits the native text; Enter or blur commits it. Arrow keys, Page Up/Down, Home/End,
        and the repeat buttons are owned by the public hook. Typed values are not clamped to bounds.
        Native reset keeps the hook&apos;s latest value and emits no change callback.
      </p>
      <label htmlFor={id}>Quantity</label>
      <HeadlessSpinButton
        {...props}
        id={id}
        name="quantity"
        defaultValue={4}
        min={0}
        max={20}
        step={0.5}
        stepPage={5}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setLastChange(data);
          setCommits((count) => count + 1);
        }}
      />
      <div className={styles.actions}>
        <button type="submit">Submit quantity</button>
        <button type="reset">Reset native form</button>
      </div>
      <output aria-label="Quantity commits" aria-live="polite">
        Commits: {commits}; <Payload data={lastChange} />
      </output>
      <output aria-label="Quantity submission" aria-live="polite">
        Submitted: {submitted === null ? '(not submitted)' : submitted || '(empty)'}
      </output>
    </form>
  );
}

export function SpinButtonValidationFlow(props: SpinButtonProps): React.ReactElement {
  const [value, setValue] = React.useState<number | null>(1);
  const [displayValue, setDisplayValue] = React.useState('$1');
  const [commits, setCommits] = React.useState(0);
  const [lastChange, setLastChange] = React.useState<SpinButtonOnChangeData | null>(null);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  const invalid = value === null || value < 0 || value > 10;

  return (
    <form
      className={styles.flow}
      aria-label="Budget form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(
          invalid ? '(invalid)' : String(new FormData(event.currentTarget).get('budget') ?? ''),
        );
      }}
      onReset={() => {
        setValue(1);
        setDisplayValue('$1');
      }}
    >
      <p>
        Formatting, parsing, and validation are explicit application code, not extra SpinButton
        props or a second model inside the component. The hook reports numeric step changes and
        display-only text commits separately. This controlled form resets application state.
      </p>
      <Field
        label="Budget"
        required
        validationState={invalid ? 'error' : 'none'}
        validationMessage={invalid ? 'Enter an amount between $0 and $10.' : undefined}
        hint="Quarter-dollar steps; Page Up adds $2."
      >
        <HeadlessSpinButton
          {...props}
          name="budget"
          value={value}
          displayValue={displayValue}
          min={0}
          max={10}
          step={0.25}
          stepPage={2}
          onChange={(event, data) => {
            props.onChange?.(event, data);
            setLastChange(data);
            setCommits((count) => count + 1);
            if (data.value !== undefined) {
              setValue(data.value);
              setDisplayValue(data.value === null ? '(invalid)' : `$${data.value}`);
            } else if (data.displayValue !== undefined) {
              const parsed = Number.parseFloat(data.displayValue.replace(/^\$/, ''));
              setValue(Number.isNaN(parsed) ? null : parsed);
              setDisplayValue(Number.isNaN(parsed) ? '(invalid)' : `$${parsed}`);
            }
          }}
        />
      </Field>
      <div className={styles.actions}>
        <button type="submit">Submit budget</button>
        <button type="reset">Reset budget</button>
      </div>
      <output aria-label="Budget commits" aria-live="polite">
        Commits: {commits}; <Payload data={lastChange} />
      </output>
      <output aria-label="Budget submission" aria-live="polite">
        Submitted: {submitted === null ? '(not submitted)' : submitted}
      </output>
    </form>
  );
}
