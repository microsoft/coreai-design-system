// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { DateTimePicker } from '@coreai-ds/react-headless-components';
import { ComparisonProvider, withHeadlessProvider } from './ComparisonProvider.js';
import {
  DateTimePickerComparison,
  DateTimePickerNativeForm,
  dateTimePickerAppearances,
  dateTimePickerConsumerExample,
  dateTimePickerExamples,
  dateTimePickerReadOnlyExample,
  dateTimePickerTypes,
  type DateTimePickerExample,
} from './DateTimePickerComparison.js';
import {
  captureDateTimePickerStyles,
  compareDateTimePickerStyles,
  getComparisonDateTimePicker,
  settleDateTimePickerStyles,
  type DateTimePickerStyleDifference,
} from './DateTimePickerComparison.helpers.js';
import styles from './DateTimePickerComparison.module.css';

function ComparisonWithReport({
  examples = dateTimePickerExamples,
}: {
  examples?: readonly DateTimePickerExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState('');
  const [differences, setDifferences] = React.useState<
    (DateTimePickerStyleDifference & { example: string })[]
  >([]);
  const [count, setCount] = React.useState(0);

  const compare = async () => {
    setStatus('running');
    setError('');
    try {
      const container = containerRef.current;
      if (!container) throw new Error('DateTimePicker comparison has not mounted');
      const rows = [...container.querySelectorAll<HTMLElement>('[data-date-time-picker-case]')];
      if (!rows.length) throw new Error('DateTimePicker comparison has no fixtures');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonDateTimePicker(row, 'legacy');
        const headless = getComparisonDateTimePicker(row, 'headless');
        await Promise.all([
          settleDateTimePickerStyles(legacy),
          settleDateTimePickerStyles(headless),
        ]);
        if (!legacy.getBoundingClientRect().width || !headless.getBoundingClientRect().width) {
          throw new Error('A DateTimePicker comparison control has no layout width');
        }
        results.push(
          ...compareDateTimePickerStyles(
            captureDateTimePickerStyles(legacy),
            captureDateTimePickerStyles(headless),
          ).map((difference) => ({
            ...difference,
            example: row.dataset.dateTimePickerCase ?? '',
          })),
        );
      }
      setDifferences(results);
      setCount(rows.length);
      setStatus('complete');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setStatus('error');
    }
  };

  return (
    <>
      <p>
        Both implementations receive the same native temporal inputs. The report includes the Input
        foundation, native indicator, action buttons, bundled glyph visibility, and measured
        dimensions. It excludes no captured differences. Native browser picker surfaces are not DOM
        snapshots. Click Compare again after theme or layout changes.
      </p>
      <button type="button" onClick={compare} disabled={status === 'running'}>
        Compare resting styles
      </button>
      <output
        className={styles.DateTimePickerComparison__report}
        aria-label="DateTimePicker comparison report"
        aria-live="polite"
        data-date-time-picker-report=""
        data-status={status}
        data-fixture-count={count}
        data-difference-count={differences.length}
      >
        {status === 'complete'
          ? `${count} fixtures captured. ${
              differences.length
                ? `${differences.length} differences:\n${JSON.stringify(differences, null, 2)}`
                : 'No differences in the selected properties.'
            }`
          : status === 'error'
            ? `Comparison failed: ${error}`
            : status === 'running'
              ? 'Comparing…'
              : 'Comparison not run.'}
      </output>
      <div ref={containerRef}>
        <DateTimePickerComparison examples={examples} />
      </div>
    </>
  );
}

const meta = {
  title: 'Experiments/Headless DateTimePicker',
  component: DateTimePicker,
  decorators: [withHeadlessProvider],
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'CoreAI native date/time composition, not the compat or headless DatePicker popup. It uses the new Input, Button, Field and provider, style-free icons, local Date conversion, and native validity. No calendar, focusgroup, overlay, segment-wraparound, or form-reset shim is added. Production DateTimePicker remains the comparison baseline.',
      },
    },
  },
  argTypes: {
    type: { control: 'select', options: dateTimePickerTypes },
    appearance: { control: 'select', options: dateTimePickerAppearances },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    value: { control: false },
    defaultValue: { control: false },
    min: { control: false },
    max: { control: false },
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    const report = canvas.getByRole('status', { name: 'DateTimePicker comparison report' });
    await waitFor(() => expect(report).toHaveAttribute('data-status', 'complete'), {
      timeout: 15000,
    });
    await expect(report).toHaveAttribute(
      'data-fixture-count',
      String(dateTimePickerExamples.length),
    );
    await expect(report).toHaveAttribute('data-difference-count', '0');
  },
};

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>Unlayered consumer classes win over the new component layers, including action buttons.</p>
      <ComparisonWithReport examples={[dateTimePickerConsumerExample]} />
    </>
  ),
};

export const DefaultsOptOut: Story = {
  render: () => (
    <ComparisonProvider theme={{}} withComponentDefaults={false}>
      <p>
        Input retains its filled-darker fallback with defaults disabled, including explicitly
        undefined appearance. Button shape changes to rounded; explicit native/inline-label features
        remain available.
      </p>
      <ComparisonWithReport
        examples={[
          { name: 'Omitted appearance', props: { label: 'Default appearance' } },
          {
            name: 'Explicit undefined',
            props: { appearance: undefined, label: 'Undefined appearance' },
          },
          { name: 'Explicit outline', props: { appearance: 'outline', label: 'Outline' } },
        ]}
      />
    </ComparisonProvider>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <ComparisonProvider theme={{}} dir="rtl">
      <ComparisonWithReport
        examples={[
          {
            name: 'RTL native date and actions',
            props: {
              label: 'Due date',
              value: new Date(2026, 6, 29),
              clearable: true,
              contentAfter: 'Local',
            },
          },
        ]}
      />
    </ComparisonProvider>
  ),
};

export const NativeBoundaries: Story = {
  render: () => (
    <>
      <p>
        The new read-only control cannot be cleared or open a mutable native picker. Its picker
        button is disabled. The legacy column still exposes both actions; the report keeps these
        intentional differences visible.
      </p>
      <p>
        Native picker support and displayed segments vary by browser and locale. Unsupported
        temporal types can fall back to text inputs; no calendar fallback is supplied. showPicker
        requires user activation and may be restricted in cross-origin frames. Without it, the
        native editor remains available. Native keyboard stepping is not rolled back. Dates use
        local wall-clock fields and minute precision; time callbacks use today. ISO week values
        resolve to their Monday, including the previous calendar year. Local Date follows the
        timezone&apos;s daylight-saving normalization.
      </p>
      <p>
        The pinned Input owns state and onChange. Use the top-level DateTimePicker onChange, not
        input.onChange. Incomplete native segment edits can change badInput while the value remains
        empty without delivering an input event. Callbacks follow delivered native events, not every
        validity transition; no keyboard-specific validation shim is added. Native form reset
        retains Input&apos;s latest hook value; controlled reset belongs to the consumer. Native
        stepMismatch/customError block submission but have no matching DateTimePicker error
        category.
      </p>
      <ComparisonWithReport examples={[dateTimePickerReadOnlyExample]} />
    </>
  ),
};

export const NativeForm: Story = {
  args: { onChange: fn(), onValidationResult: fn() },
  render: (args) => <DateTimePickerNativeForm {...args} />,
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText('Appointment date', { exact: false });
    await expect(input).toHaveValue('2026-07-29');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear value' }));
    await expect(input).toHaveValue('');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: null });
    await expect(args.onValidationResult).toHaveBeenLastCalledWith(expect.anything(), {
      error: 'required-input',
    });
    await expect(canvas.getByText('An appointment date is required.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Save appointment' }));
    await expect(canvas.getByRole('status', { name: 'Appointment submission' })).toHaveTextContent(
      'Not submitted',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reset appointment' }));
    await expect(input).toHaveValue('2026-07-29');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Save appointment' }));
    await expect(canvas.getByRole('status', { name: 'Appointment submission' })).toHaveTextContent(
      'Submitted: 2026-07-29',
    );
  },
};
