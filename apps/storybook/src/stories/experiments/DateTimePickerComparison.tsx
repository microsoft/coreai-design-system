// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  DateTimePicker as LegacyDateTimePicker,
  Field as LegacyField,
} from '@coreai-ds/react-components';
import {
  Button,
  DateTimePicker as HeadlessDateTimePicker,
  Field as HeadlessField,
  type DateTimePickerErrorType,
  type DateTimePickerProps,
} from '@coreai-ds/react-headless-components';
import styles from './DateTimePickerComparison.module.css';

export const dateTimePickerTypes = ['date', 'time', 'datetime-local', 'month', 'week'] as const;
export const dateTimePickerAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;

export interface DateTimePickerExample {
  name: string;
  props: DateTimePickerProps;
  field?: {
    label: string;
    required?: boolean;
    size?: 'small' | 'medium' | 'large';
    validationState?: 'none' | 'error' | 'warning' | 'success';
    validationMessage?: string;
    hint?: string;
  };
}

const appointment = new Date(2026, 6, 29, 9, 30);

export const dateTimePickerExamples: readonly DateTimePickerExample[] = [
  { name: 'Default empty date', props: {} },
  ...dateTimePickerTypes.map((type) => ({
    name: `Native ${type}`,
    props: { type, defaultValue: appointment },
  })),
  ...dateTimePickerAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, defaultValue: appointment },
  })),
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: appointment, contentAfter: 'Local' },
  })),
  { name: 'Inline label empty', props: { label: 'Due date' } },
  { name: 'Inline label value', props: { label: 'Due date', defaultValue: appointment } },
  {
    name: 'Dynamic width',
    props: { label: 'Due date', dynamicWidth: true, defaultValue: appointment },
  },
  {
    name: 'Truncated value',
    props: {
      label: 'Appointment',
      type: 'datetime-local',
      defaultValue: appointment,
      truncateTextOverflow: true,
      style: { width: '280px' },
    },
  },
  {
    name: 'Clear to empty',
    props: { value: appointment, clearable: true },
  },
  {
    name: 'Disabled',
    props: {
      label: 'Unavailable date',
      defaultValue: appointment,
      disabled: true,
      clearable: true,
    },
  },
  {
    name: 'Required Field error',
    props: { appearance: 'outline', clearable: true },
    field: {
      label: 'Required date',
      required: true,
      size: 'small',
      validationState: 'error',
      validationMessage: 'Choose a date.',
      hint: 'Native required validation owns submission.',
    },
  },
  {
    name: 'Native range constraints',
    props: {
      min: new Date(2026, 6, 1),
      max: new Date(2026, 6, 31),
      defaultValue: appointment,
      contentBefore: 'Local',
    },
  },
];

export const dateTimePickerReadOnlyExample: DateTimePickerExample = {
  name: 'Read-only native actions',
  props: { label: 'Read-only date', value: appointment, readOnly: true, clearable: true },
};

export const dateTimePickerConsumerExample: DateTimePickerExample = {
  name: 'Consumer CSS Modules',
  props: {
    label: 'Consumer date',
    value: appointment,
    clearable: true,
    className: styles.DateTimePickerConsumerRoot,
    input: { className: styles.DateTimePickerConsumerInput },
    contentAfter: 'Local',
  },
};

function ExampleCell({
  implementation,
  example: { name, props, field },
}: {
  implementation: 'legacy' | 'headless';
  example: DateTimePickerExample;
}) {
  const generatedId = React.useId();
  const id = `${props.id ?? generatedId}-${implementation}`;
  const accessibleName = props.label || field ? undefined : (props['aria-label'] ?? name);
  const picker =
    implementation === 'legacy' ? (
      <LegacyDateTimePicker {...props} id={id} aria-label={accessibleName} />
    ) : (
      <HeadlessDateTimePicker {...props} id={id} aria-label={accessibleName} />
    );

  return (
    <div data-date-time-picker-implementation={implementation}>
      {field ? (
        implementation === 'legacy' ? (
          <LegacyField {...field}>{picker}</LegacyField>
        ) : (
          <HeadlessField {...field}>{picker}</HeadlessField>
        )
      ) : (
        picker
      )}
    </div>
  );
}

export function DateTimePickerComparison({
  examples = dateTimePickerExamples,
}: {
  examples?: readonly DateTimePickerExample[];
}) {
  return (
    <div className={styles.DateTimePickerComparison}>
      <div className={styles.DateTimePickerComparison__row} data-date-time-picker-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div
          key={example.name}
          className={styles.DateTimePickerComparison__row}
          data-date-time-picker-case={example.name}
        >
          <span>{example.name}</span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}

const validationMessages: Record<DateTimePickerErrorType, string> = {
  'required-input': 'An appointment date is required.',
  'out-of-bounds': 'Choose a date in July 2026.',
  'invalid-input': 'Enter a complete native date.',
};

export function DateTimePickerNativeForm({
  onChange,
  onValidationResult,
}: Pick<DateTimePickerProps, 'onChange' | 'onValidationResult'>) {
  const [value, setValue] = React.useState<Date | null>(appointment);
  const [error, setError] = React.useState<DateTimePickerErrorType>();
  const [submitted, setSubmitted] = React.useState('Not submitted');
  const [changed, setChanged] = React.useState('No changes');

  return (
    <form
      className={styles.DateTimePickerNativeForm}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(`Submitted: ${new FormData(event.currentTarget).get('appointment')}`);
      }}
      onReset={() => {
        // Controlled reset is consumer-owned; native reset does not reset Input's hook state.
        setValue(appointment);
        setError(undefined);
        setSubmitted('Not submitted');
      }}
    >
      <HeadlessField
        label="Appointment date"
        required
        validationState={error ? 'error' : 'none'}
        validationMessage={error ? validationMessages[error] : undefined}
        hint="Choose July 1–31, 2026. The browser owns the calendar and validation."
      >
        <HeadlessDateTimePicker
          name="appointment"
          value={value}
          min={new Date(2026, 6, 1)}
          max={new Date(2026, 6, 31)}
          clearable
          onChange={(event, data) => {
            onChange?.(event, data);
            setValue(data.value);
            setChanged(data.value ? event.currentTarget.value : '(empty)');
          }}
          onValidationResult={(event, data) => {
            onValidationResult?.(event, data);
            setError(data.error);
          }}
        />
      </HeadlessField>
      <div className={styles.DateTimePickerNativeForm__actions}>
        <Button type="submit">Save appointment</Button>
        <Button type="reset">Reset appointment</Button>
      </div>
      <output aria-label="Appointment change" aria-live="polite">
        {changed}
      </output>
      <output aria-label="Appointment submission" aria-live="polite">
        {submitted}
      </output>
    </form>
  );
}
