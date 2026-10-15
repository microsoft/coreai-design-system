// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  DateTimePicker,
  Field,
  type DateTimePickerErrorType,
  type DateTimePickerProps,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

import * as React from 'react';

export const Default: StoryObj<DateTimePickerProps> = {
  render: (props: DateTimePickerProps) => {
    const styles = /* css */ `
      .date-time-picker-default-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field label="Select a date">
          <DateTimePicker className="date-time-picker-default-example__control" {...props} />
        </Field>
      </>
    );
  },
};

export const DateAndTime: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .date-time-picker-date-time-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field label="Select a date and time">
          <DateTimePicker
            type="datetime-local"
            className="date-time-picker-date-time-example__control"
          />
        </Field>
      </>
    );
  },
};

export const Time: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .date-time-picker-time-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field label="Select a time">
          <DateTimePicker type="time" className="date-time-picker-time-example__control" />
        </Field>
      </>
    );
  },
};

export const Month: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .date-time-picker-month-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field label="Select a month">
          <DateTimePicker type="month" className="date-time-picker-month-example__control" />
        </Field>
      </>
    );
  },
};

export const Week: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .date-time-picker-week-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field label="Select a week">
          <DateTimePicker type="week" className="date-time-picker-week-example__control" />
        </Field>
      </>
    );
  },
};

export const Controlled: StoryObj = {
  render: () => {
    const validationMessages: Record<DateTimePickerErrorType, string> = {
      'required-input': 'A date is required.',
      'out-of-bounds': 'Date must be within the allowed range.',
      'invalid-input': "That date isn't valid.",
    };
    const min = new Date(2026, 0, 1);
    const max = new Date(2026, 11, 31);
    const [value, setValue] = React.useState<Date | null>(new Date(2026, 6, 1));
    const [error, setError] = React.useState<DateTimePickerErrorType>();

    const styles = /* css */ `
      .date-time-picker-controlled-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field
          label="Select a date in 2026"
          hint={
            error ? undefined : value ? `Selected: ${value.toDateString()}` : 'No date selected'
          }
          required
          validationState={error ? 'error' : 'none'}
          validationMessage={error && validationMessages[error]}
        >
          <DateTimePicker
            className="date-time-picker-controlled-example__control"
            value={value}
            min={min}
            max={max}
            onChange={(_ev, data) => setValue(data.value)}
            onValidationResult={(_ev, data) => setError(data.error)}
          />
        </Field>
      </>
    );
  },
};

// `end`'s `min` is `start` and `start`'s `max` is `end`, so picking a start after the
// current end (or an end before the current start) shows a validation error on that
// side via `onValidationResult`/`Field`, rather than being auto-corrected.
export const Range: StoryObj = {
  render: () => {
    const validationMessages: Record<DateTimePickerErrorType, string> = {
      'required-input': 'A date is required.',
      'out-of-bounds': 'Date must be within the allowed range.',
      'invalid-input': "That date isn't valid.",
    };
    const [start, setStart] = React.useState<Date | null>(new Date(2026, 6, 1));
    const [end, setEnd] = React.useState<Date | null>(new Date(2026, 6, 10));
    const [startError, setStartError] = React.useState<DateTimePickerErrorType>();
    const [endError, setEndError] = React.useState<DateTimePickerErrorType>();

    const dayCount =
      start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 : undefined;

    const styles = /* css */ `
      .date-time-picker-range-example__row {
        display: flex;
        gap: var(--spacingHorizontalM);
        align-items: flex-start;
      }

      .date-time-picker-range-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="date-time-picker-range-example">
          <div className="date-time-picker-range-example__row">
            <Field
              label="Start date"
              validationState={startError ? 'error' : 'none'}
              validationMessage={startError && validationMessages[startError]}
            >
              <DateTimePicker
                className="date-time-picker-range-example__control"
                value={start}
                max={end ?? undefined}
                onChange={(_ev, data) => setStart(data.value)}
                onValidationResult={(_ev, data) => setStartError(data.error)}
              />
            </Field>
            <Field
              label="End date"
              validationState={endError ? 'error' : 'none'}
              validationMessage={endError && validationMessages[endError]}
            >
              <DateTimePicker
                className="date-time-picker-range-example__control"
                value={end}
                min={start ?? undefined}
                onChange={(_ev, data) => setEnd(data.value)}
                onValidationResult={(_ev, data) => setEndError(data.error)}
              />
            </Field>
          </div>
          <p>
            {dayCount !== undefined
              ? `${dayCount} day${dayCount === 1 ? '' : 's'} selected`
              : 'Select both dates'}
          </p>
        </div>
      </>
    );
  },
};

// With no `defaultValue`, `clearable`'s "x" button clears the value to `null`.
export const Clearable: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState<Date | null>(new Date(2026, 6, 1));

    const styles = /* css */ `
      .date-time-picker-clearable-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field
          label="Select a date"
          hint={value ? `Selected: ${value.toDateString()}` : 'No date selected'}
        >
          <DateTimePicker
            className="date-time-picker-clearable-example__control"
            clearable
            value={value}
            onChange={(_ev, data) => setValue(data.value)}
          />
        </Field>
      </>
    );
  },
};

// With a `defaultValue`, `clearable`'s "x" button resets back to it instead of clearing.
export const ClearableWithDefault: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .date-time-picker-clearable-default-example__control {
        max-width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Field label="Select a date" hint="Resets to July 1, 2026 instead of clearing">
          <DateTimePicker
            className="date-time-picker-clearable-default-example__control"
            clearable
            defaultValue={new Date(2026, 6, 1)}
          />
        </Field>
      </>
    );
  },
};

/**
 * `DateTimePicker` renders the browser's native picker UI for date/time values —
 * a thin wrapper around `Input` that restricts `type` to HTML's temporal input
 * types (`date` [default], `time`, `datetime-local`, `month`, `week`), rather than
 * the custom popup calendar / dropdown list used by the compat `DatePicker`/`TimePicker`.
 * The native calendar/clock icon is swapped for a themed Fluent icon button that
 * opens the same native picker via `showPicker()`.
 *
 * `value`/`defaultValue`/`min`/`max` are plain `Date` objects (not strings) —
 * conversion to/from the native input string format happens internally, based
 * on local wall-clock `Date` fields. Construct/compare these `Date`s using local
 * fields too (e.g. `new Date(y, m, d)`), not UTC/ISO parsing (e.g. `new Date("2026-07-29")`),
 * or the calendar day can shift by one in negative-UTC-offset timezones. A `time`
 * value's date portion is filled in with "today" at the moment it's parsed, so
 * two `onChange` events on different days won't produce `Date`s that are `===`
 * or day-equal even for the same time of day.
 *
 * `min`/`max`/`required` are enforced by the browser's native constraint
 * validation. `onValidationResult` mirrors the compat `DatePicker`'s callback of
 * the same name, reporting the result derived from the input's `ValidityState`.
 * Pair it with `Field`'s `validationState`/`validationMessage` to surface it -
 * Fluent's `Input` already themes the invalid state once nested in a `Field`,
 * no custom styling needed, as shown in `Controlled` and `Range` (the latter
 * feeds each side's `min`/`max` from the other side's current value).
 *
 * `clearable` adds an "x" icon button, shown once there's a value to act on,
 * mirroring `Dropdown`/`Combobox`'s `clearable` prop. If `defaultValue` is set,
 * clicking it resets back to `defaultValue`; otherwise it clears the value.
 *
 * @summary Native browser input for picking a date, time, or related value.
 */
export default {
  title: 'Components/DateTimePicker',
  component: DateTimePicker,
};
