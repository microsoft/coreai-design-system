// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  Input as RawInput,
  type InputSlots,
} from '@fluentui/react-headless-components-preview/input';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { CoreAIFluentProvider as LegacyProvider } from '@coreai-ds/react-components';
import { ComparisonProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  DateTimePickerComparison,
  DateTimePickerNativeForm,
  dateTimePickerConsumerExample,
  dateTimePickerExamples,
  dateTimePickerReadOnlyExample,
  type DateTimePickerExample,
} from '../../../apps/storybook/src/stories/experiments/DateTimePickerComparison.js';
import {
  captureDateTimePickerStyles,
  compareDateTimePickerStyles,
  getComparisonDateTimePicker,
  getDateTimePickerSlots,
  settleDateTimePickerStyles,
} from '../../../apps/storybook/src/stories/experiments/DateTimePickerComparison.helpers.js';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import {
  DateTimePicker,
  dateTimePickerClassNames,
  type DateTimePickerProps,
} from './DateTimePicker.js';
import { Field } from './Field.js';
import { coreaiDarkTheme, coreaiLightTheme } from './theme.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: DateTimePickerExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <ComparisonProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <DateTimePickerComparison examples={[example]} />
    </ComparisonProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonDateTimePicker(screen.container, 'legacy');
  const headless = getComparisonDateTimePicker(screen.container, 'headless');
  await Promise.all([settleDateTimePickerStyles(legacy), settleDateTimePickerStyles(headless)]);
  return { screen, legacy, headless };
}

async function tabTo(element: HTMLElement) {
  // Native temporal inputs can tab through internal segments before leaving.
  for (let count = 0; count < 8 && document.activeElement !== element; count++) {
    await userEvent.tab();
  }
  await expect.element(element).toHaveFocus();
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(dateTimePickerExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareDateTimePickerStyles(
        captureDateTimePickerStyles(legacy),
        captureDateTimePickerStyles(headless),
      ),
    ).toEqual([]);
    expect(getDateTimePickerSlots(legacy).input.id).not.toBe(
      getDateTimePickerSlots(headless).input.id,
    );
  });

  test(`preserves enabled picker glyph hover and keyboard-focus styling in ${mode}`, async () => {
    const { screen, legacy, headless } = await renderPair(
      { name: 'Interactive glyph', props: { defaultValue: new Date(2026, 6, 29) } },
      theme,
    );
    const oldButton = getDateTimePickerSlots(legacy).pickerButton;
    const newButton = getDateTimePickerSlots(headless).pickerButton;
    await userEvent.hover(oldButton);
    expect(oldButton.matches(':hover')).toBe(true);
    await settleDateTimePickerStyles(legacy);
    const hovered = captureDateTimePickerStyles(legacy);
    // Visible SVGs are flex items, so their computed display is blockified.
    expect(hovered['pickerButton.filled.display']).toBe('block');
    expect(Number(hovered['pickerButton.filled.width'])).toBeGreaterThan(0);
    expect(Number(hovered['pickerButton.filled.height'])).toBeGreaterThan(0);
    expect(hovered['pickerButton.regular.display']).toBe('none');
    await userEvent.hover(newButton);
    expect(newButton.matches(':hover')).toBe(true);
    await settleDateTimePickerStyles(headless);
    expect(compareDateTimePickerStyles(hovered, captureDateTimePickerStyles(headless))).toEqual([]);

    await userEvent.hover(screen.getByText('Case', { exact: true }));
    await userEvent.tab();
    await expect.element(getDateTimePickerSlots(legacy).input).toHaveFocus();
    await tabTo(oldButton);
    expect(oldButton.matches(':hover')).toBe(false);
    await settleDateTimePickerStyles(legacy);
    const focused = captureDateTimePickerStyles(legacy);
    await userEvent.hover(oldButton);
    expect(oldButton.matches(':hover')).toBe(true);
    await settleDateTimePickerStyles(legacy);
    const focusedHover = captureDateTimePickerStyles(legacy);
    await userEvent.hover(screen.getByText('Case', { exact: true }));
    await userEvent.tab();
    await expect.element(getDateTimePickerSlots(headless).input).toHaveFocus();
    await tabTo(newButton);
    expect(newButton.matches(':hover')).toBe(false);
    await settleDateTimePickerStyles(headless);
    expect(compareDateTimePickerStyles(focused, captureDateTimePickerStyles(headless))).toEqual([]);
    await userEvent.hover(newButton);
    expect(newButton.matches(':hover')).toBe(true);
    await settleDateTimePickerStyles(headless);
    expect(
      compareDateTimePickerStyles(focusedHover, captureDateTimePickerStyles(headless)),
    ).toEqual([]);
  });

  test(`keeps disabled native picker glyphs regular on hover in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Disabled native picker',
        props: { defaultValue: new Date(2026, 6, 29), disabled: true },
      },
      theme,
    );
    const oldButton = getDateTimePickerSlots(legacy).pickerButton;
    const newButton = getDateTimePickerSlots(headless).pickerButton;
    await userEvent.hover(oldButton);
    await settleDateTimePickerStyles(legacy);
    const hovered = captureDateTimePickerStyles(legacy);
    await userEvent.hover(newButton);
    expect(newButton.matches(':hover')).toBe(true);
    await settleDateTimePickerStyles(headless);
    const headlessHovered = captureDateTimePickerStyles(headless);
    expect(compareDateTimePickerStyles(hovered, headlessHovered)).toEqual([]);
    expect(headlessHovered['pickerButton.filled.display']).toBe('none');
    expect(headlessHovered['pickerButton.regular.display']).toBe('block');
    expect(Number(headlessHovered['pickerButton.regular.width'])).toBeGreaterThan(0);
    expect(Number(headlessHovered['pickerButton.regular.height'])).toBeGreaterThan(0);
  });
}

test('retains the inline-label type contract and excludes legacy appearances and raw Date strings', () => {
  expectTypeOf<{ label: string; dynamicWidth: true }>().toMatchTypeOf<DateTimePickerProps>();
  expectTypeOf<{ dynamicWidth: true }>().not.toMatchTypeOf<DateTimePickerProps>();
  expectTypeOf<{ label?: string; dynamicWidth: true }>().not.toMatchTypeOf<DateTimePickerProps>();
  expectTypeOf<{ value: string }>().not.toMatchTypeOf<DateTimePickerProps>();
  expectTypeOf<{ min: string }>().not.toMatchTypeOf<DateTimePickerProps>();
  expectTypeOf<DateTimePickerProps['value']>().toEqualTypeOf<Date | null | undefined>();
  expectTypeOf<DateTimePickerProps['type']>().toEqualTypeOf<
    'date' | 'time' | 'datetime-local' | 'month' | 'week' | undefined
  >();
  expectTypeOf<DateTimePickerProps['appearance']>().toEqualTypeOf<
    'outline' | 'underline' | 'filled-darker' | 'filled-lighter' | undefined
  >();
  expectTypeOf<NonNullable<DateTimePickerProps['input']>['children']>().toEqualTypeOf<undefined>();
});

test.each([
  ['date', '2026-07-29', '2026-07-01', '2026-07-31', 'Open date picker'],
  ['time', '09:30', '08:00', '17:00', 'Open time picker'],
  [
    'datetime-local',
    '2026-07-29T09:30',
    '2026-07-01T08:00',
    '2026-07-31T17:00',
    'Open date and time picker',
  ],
  ['month', '2026-07', '2026-07', '2026-07', 'Open month picker'],
  ['week', '2026-W31', '2026-W27', '2026-W31', 'Open week picker'],
] as const)(
  'renders native %s with local Date constraints and a native ref',
  async (type, value, min, max, label) => {
    const ref = React.createRef<HTMLInputElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        <DateTimePicker
          ref={ref}
          label="Local appointment"
          type={type}
          defaultValue={new Date(2026, 6, 29, 9, 30)}
          min={new Date(2026, 6, 1, 8)}
          max={new Date(2026, 6, 31, 17)}
        />
      </CoreAIFluentProvider>,
    );
    expect(ref.current).toBe(screen.getByLabelText('Local appointment').element());
    expect(ref.current).toHaveAttribute('type', type);
    expect(ref.current).toHaveValue(value);
    expect(ref.current).toHaveAttribute('min', min);
    expect(ref.current).toHaveAttribute('max', max);
    expect(ref.current).toHaveClass(dateTimePickerClassNames.input);
    expect(ref.current?.closest('.fui-DateTimePicker')).not.toBeNull();
    await expect
      .element(screen.getByRole('button', { name: label }))
      .toHaveAttribute('type', 'button');
  },
);

test('converts an actual native time edit to today at minute precision', async () => {
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <DateTimePicker aria-label="Local time" type="time" onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  await screen.getByLabelText('Local time').fill('09:30');
  const today = new Date();
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
    value: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30),
  });
});

test.each([
  ['date', '2026-07-29', [2026, 6, 29, 0, 0]],
  ['month', '2026-07', [2026, 6, 1, 0, 0]],
  ['week', '2026-W01', [2025, 11, 29, 0, 0]],
  ['datetime-local', '2026-07-29T09:30', [2026, 6, 29, 9, 30]],
] as const)(
  'converts an actual native %s edit and preserves callback order/targets',
  async (type, value, fields) => {
    const ref = React.createRef<HTMLInputElement>();
    const order: string[] = [];
    const targets: EventTarget[] = [];
    const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      order.push('change');
      targets.push(event.currentTarget);
    });
    const onValidationResult = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      order.push('validation');
      targets.push(event.currentTarget);
    });
    const onInput = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <DateTimePicker
          ref={ref}
          aria-label="Native edit"
          type={type}
          onChange={onChange}
          onValidationResult={onValidationResult}
          input={{ onInput }}
        />
      </CoreAIFluentProvider>,
    );
    await screen.getByLabelText('Native edit').fill(value);
    const [year, month, day, hours, minutes] = fields;
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: new Date(year, month, day, hours, minutes),
    });
    expect(onValidationResult).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      error: undefined,
    });
    expect(order).toEqual(['change', 'validation']);
    expect(targets).toEqual([ref.current, ref.current]);
    expect(onInput).toHaveBeenCalledOnce();
  },
);

test.each([
  ['below minimum', '2026-06-30', 'out-of-bounds', false],
  ['equal to minimum', '2026-07-01', undefined, true],
  ['between limits', '2026-07-15', undefined, true],
  ['equal to maximum', '2026-07-31', undefined, true],
  ['above maximum', '2026-08-01', 'out-of-bounds', false],
] as const)(
  'reports native validation when %s without clamping the value',
  async (_, value, error, valid) => {
    const ref = React.createRef<HTMLInputElement>();
    const onValidationResult = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <DateTimePicker
          ref={ref}
          aria-label="Constrained date"
          min={new Date(2026, 6, 1)}
          max={new Date(2026, 6, 31)}
          onValidationResult={onValidationResult}
        />
      </CoreAIFluentProvider>,
    );
    await screen.getByLabelText('Constrained date').fill(value);
    expect(ref.current).toHaveValue(value);
    expect(ref.current?.validity.valid).toBe(valid);
    expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), { error });
  },
);

test('reports malformed native input when deleting one segment from a complete date', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const onChange = vi.fn();
  const onValidationResult = vi.fn();
  await render(
    <CoreAIFluentProvider>
      <DateTimePicker
        ref={ref}
        aria-label="Partially edited date"
        defaultValue={new Date(2026, 6, 29)}
        onChange={onChange}
        onValidationResult={onValidationResult}
      />
    </CoreAIFluentProvider>,
  );
  ref.current?.focus();
  await userEvent.keyboard('{Delete}');
  expect(ref.current?.validity.badInput).toBe(true);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: null });
  expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), {
    error: 'invalid-input',
  });
});

test('preserves Chromium incomplete-edit validity without synthesizing input and notifies on a complete edit', async () => {
  const rawRef = React.createRef<HTMLInputElement>();
  const pickerRef = React.createRef<HTMLInputElement>();
  const rawChange = vi.fn();
  const pickerChange = vi.fn();
  const onValidationResult = vi.fn();
  const rawInput = vi.fn<(event: React.FormEvent<HTMLInputElement>) => void>();
  const pickerInput = vi.fn<(event: React.FormEvent<HTMLInputElement>) => void>();
  const rawNativeInput = vi.fn<(event: Event) => void>();
  const pickerNativeInput = vi.fn<(event: Event) => void>();
  await render(
    <CoreAIFluentProvider>
      <RawInput
        type="date"
        ref={rawRef}
        aria-label="Raw incomplete date"
        onChange={rawChange}
        onInput={rawInput}
      />
      <DateTimePicker
        ref={pickerRef}
        aria-label="Incomplete date"
        onChange={pickerChange}
        onInput={pickerInput}
        onValidationResult={onValidationResult}
      />
    </CoreAIFluentProvider>,
  );
  const raw = rawRef.current;
  const picker = pickerRef.current;
  if (!raw || !picker) throw new Error('Missing native temporal input fixtures');
  raw.addEventListener('input', rawNativeInput);
  picker.addEventListener('input', pickerNativeInput);
  raw.focus();
  await userEvent.keyboard('{ArrowUp}');
  picker.focus();
  await userEvent.keyboard('{ArrowUp}');
  expect(raw.validity.badInput).toBe(true);
  expect(picker.validity.badInput).toBe(true);
  expect(raw).toHaveValue('');
  expect(picker).toHaveValue('');
  expect(rawNativeInput).not.toHaveBeenCalled();
  expect(pickerNativeInput).not.toHaveBeenCalled();
  expect(rawInput).not.toHaveBeenCalled();
  expect(pickerInput).not.toHaveBeenCalled();
  expect(rawChange).not.toHaveBeenCalled();
  expect(pickerChange).not.toHaveBeenCalled();
  expect(onValidationResult).not.toHaveBeenCalled();

  await userEvent.fill(raw, '2026-07-29');
  await userEvent.fill(picker, '2026-07-29');
  expect(raw).toHaveValue('2026-07-29');
  expect(picker).toHaveValue('2026-07-29');
  expect(raw.validity.valid).toBe(true);
  expect(picker.validity.valid).toBe(true);
  expect(rawNativeInput).toHaveBeenCalledOnce();
  expect(pickerNativeInput).toHaveBeenCalledOnce();
  expect(rawInput).toHaveBeenCalledOnce();
  expect(pickerInput).toHaveBeenCalledOnce();
  expect(rawInput.mock.calls[0]?.[0].nativeEvent).toBe(rawNativeInput.mock.calls[0]?.[0]);
  expect(pickerInput.mock.calls[0]?.[0].nativeEvent).toBe(pickerNativeInput.mock.calls[0]?.[0]);
  expect(rawNativeInput.mock.calls[0]?.[0].target).toBe(raw);
  expect(pickerNativeInput.mock.calls[0]?.[0].target).toBe(picker);
  expect(rawChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: '2026-07-29' });
  expect(pickerChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
    value: new Date(2026, 6, 29),
  });
  expect(onValidationResult).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
    error: undefined,
  });
});

test.each([
  { reason: 'stepMismatch', nativeValue: '09:07' },
  { reason: 'customError', nativeValue: '09:15' },
] as const)(
  'leaves $reason to native forms without inventing a validation error category',
  async ({ reason, nativeValue }) => {
    const ref = React.createRef<HTMLInputElement>();
    const onValidationResult = vi.fn();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const screen = await render(
      <CoreAIFluentProvider>
        <form onSubmit={submit}>
          <DateTimePicker
            ref={ref}
            aria-label="Quarter-hour appointment"
            type="time"
            min={new Date(2026, 6, 1, 9)}
            step={900}
            onValidationResult={onValidationResult}
          />
          <button type="submit">Submit time</button>
        </form>
      </CoreAIFluentProvider>,
    );
    if (reason === 'customError') ref.current?.setCustomValidity('Consumer validation');
    await screen.getByLabelText('Quarter-hour appointment').fill(nativeValue);
    expect(ref.current?.validity[reason]).toBe(true);
    expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), { error: undefined });
    await screen.getByRole('button', { name: 'Submit time' }).click();
    expect(submit).not.toHaveBeenCalled();
  },
);

test('uses native Field validation, actual FormData, clear callbacks, and consumer-controlled reset', async () => {
  const onChange = vi.fn();
  const onValidationResult = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <DateTimePickerNativeForm onChange={onChange} onValidationResult={onValidationResult} />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText(/Appointment date/);
  expect(input.element()).toHaveAttribute('required');
  expect(input.element()).toHaveAttribute('aria-describedby');
  await input.fill('2026-08-01');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(screen.getByText('Choose a date in July 2026.')).toBeVisible();
  await screen.getByRole('button', { name: 'Save appointment' }).click();
  await expect
    .element(screen.getByRole('status', { name: 'Appointment submission' }))
    .toHaveTextContent('Not submitted');
  await input.fill('2026-07-30');
  await expect.element(input).not.toHaveAttribute('aria-invalid', 'true');
  await screen.getByRole('button', { name: 'Save appointment' }).click();
  await expect
    .element(screen.getByRole('status', { name: 'Appointment submission' }))
    .toHaveTextContent('Submitted: 2026-07-30');
  await screen.getByRole('button', { name: 'Clear value' }).click();
  await expect.element(input).toHaveValue('');
  await expect.element(input).toHaveFocus();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: null });
  expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), {
    error: 'required-input',
  });
  await expect.element(screen.getByText('An appointment date is required.')).toBeVisible();
  const changeCount = onChange.mock.calls.length;
  const validationCount = onValidationResult.mock.calls.length;
  await screen.getByRole('button', { name: 'Reset appointment' }).click();
  await expect.element(input).toHaveValue('2026-07-29');
  await expect.element(input).not.toHaveAttribute('aria-invalid', 'true');
  expect(onChange).toHaveBeenCalledTimes(changeCount);
  expect(onValidationResult).toHaveBeenCalledTimes(validationCount);
});

test('resets an uncontrolled edit to its Date default without submitting and keeps native reset hook-owned', async () => {
  const onChange = vi.fn();
  const onValidationResult = vi.fn();
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const screen = await render(
    <CoreAIFluentProvider>
      <form onSubmit={submit}>
        <DateTimePicker
          aria-label="Uncontrolled date"
          name="due"
          defaultValue={new Date(2026, 6, 29)}
          clearable
          onChange={onChange}
          onValidationResult={onValidationResult}
        />
        <button type="reset">Native reset</button>
      </form>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Uncontrolled date');
  expect(screen.container.querySelector('[aria-label="Clear value"]')).toBeNull();
  await input.fill('2026-07-30');
  await screen.getByRole('button', { name: 'Native reset' }).click();
  await expect.element(input).toHaveValue('2026-07-30');
  expect(onChange).toHaveBeenCalledOnce();
  await screen.getByRole('button', { name: 'Clear value' }).click();
  await expect.element(input).toHaveValue('2026-07-29');
  await expect.element(input).toHaveFocus();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: new Date(2026, 6, 29) });
  expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), { error: undefined });
  expect(screen.container.querySelector('[aria-label="Clear value"]')).toBeNull();
  expect(submit).not.toHaveBeenCalled();
  const form = screen.container.querySelector('form');
  if (!form) throw new Error('Missing native form');
  expect([...new FormData(form).entries()]).toEqual([['due', '2026-07-29']]);
});

test('clears an uncontrolled input without a default and reports the empty native form value', async () => {
  const onChange = vi.fn();
  const onValidationResult = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form>
        <DateTimePicker
          aria-label="Optional date"
          name="optional"
          clearable
          onChange={onChange}
          onValidationResult={onValidationResult}
        />
      </form>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Optional date');
  await input.fill('2026-07-29');
  await screen.getByRole('button', { name: 'Clear value' }).click();
  await expect.element(input).toHaveValue('');
  await expect.element(input).toHaveFocus();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: null });
  expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), { error: undefined });
  expect(screen.container.querySelector('[aria-label="Clear value"]')).toBeNull();
  const form = screen.container.querySelector('form');
  if (!form) throw new Error('Missing native form');
  expect([...new FormData(form).entries()]).toEqual([['optional', '']]);
});

test('includes read-only dates and excludes disabled dates from native form submission', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const onChange = vi.fn();
  const submit = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit([...new FormData(event.currentTarget).entries()]);
        }}
      >
        <DateTimePicker
          ref={ref}
          aria-label="Read-only appointment"
          type="datetime-local"
          name="appointment"
          defaultValue={new Date(2026, 6, 29, 9, 30)}
          readOnly
          onChange={onChange}
        />
        <DateTimePicker
          aria-label="Disabled billing month"
          type="month"
          name="excluded"
          defaultValue={new Date(2026, 6, 1)}
          disabled
        />
        <button type="submit">Submit native dates</button>
      </form>
    </CoreAIFluentProvider>,
  );
  ref.current?.focus();
  await userEvent.keyboard('{ArrowUp}');
  expect(ref.current).toHaveValue('2026-07-29T09:30');
  expect(onChange).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: 'Submit native dates' }).click();
  expect(submit).toHaveBeenCalledExactlyOnceWith([['appointment', '2026-07-29T09:30']]);
});

test('reflects controlled Date/null updates and respects rejected clear requests', async () => {
  const onChange = vi.fn();
  const ref = React.createRef<HTMLInputElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <DateTimePicker
        ref={ref}
        aria-label="Controlled month"
        type="month"
        value={new Date(2026, 6, 1)}
        clearable
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  await screen.getByRole('button', { name: 'Clear value' }).click();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: null });
  await expect.element(ref.current!).toHaveValue('2026-07');
  await screen.rerender(
    <CoreAIFluentProvider>
      <DateTimePicker
        ref={ref}
        aria-label="Controlled month"
        type="month"
        value={null}
        clearable
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  await expect.element(ref.current!).toHaveValue('');
  expect(screen.container.querySelector('[aria-label="Clear value"]')).toBeNull();
  await screen.rerender(
    <CoreAIFluentProvider>
      <DateTimePicker
        ref={ref}
        aria-label="Controlled month"
        type="month"
        value={new Date(2026, 7, 1)}
        clearable
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  await expect.element(ref.current!).toHaveValue('2026-08');
});

test('preserves native props/refs, supported root/affix renderers, classes, and handler precedence', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const slotRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const afterRef = React.createRef<HTMLSpanElement>();
  const beforeRef = React.createRef<HTMLSpanElement>();
  const onChange = vi.fn();
  const slotChange = vi.fn();
  const topKeyDown = vi.fn();
  const slotKeyDown = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const showPicker = vi
    .spyOn(HTMLInputElement.prototype, 'showPicker')
    .mockImplementation(function (this: HTMLInputElement) {
      expect(this).toBe(ref.current);
    });
  const renderRoot: SlotRenderFunction<ExtractSlotProps<InputSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-root-rendered="" />;
  const renderAfter: SlotRenderFunction<ExtractSlotProps<InputSlots['contentAfter']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-after-rendered="">
      <span>Caller suffix</span>
      {props.children}
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <DateTimePicker
        ref={ref}
        aria-label="Slotted date"
        id="top-level-date-id"
        name="top-level-date-name"
        className="top-class-overridden-by-root"
        root={{
          ref: rootRef,
          className: 'caller-root',
          style: { maxWidth: '340px' },
          children: renderRoot,
        }}
        input={{
          ref: slotRef,
          id: 'slotted-native-date',
          name: 'slotted-native-name',
          className: 'caller-input',
          onChange: slotChange,
          onKeyDown: slotKeyDown,
        }}
        contentBefore={{ ref: beforeRef, className: 'caller-before', children: 'Local' }}
        contentAfter={{
          ref: afterRef,
          className: 'caller-after',
          children: renderAfter,
        }}
        onChange={onChange}
        onKeyDown={topKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <button type="button">After picker</button>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Slotted date').element();
  expect(ref.current).toBe(input);
  expect(slotRef.current).toBe(input);
  expect(rootRef.current).toBe(input.closest('.fui-DateTimePicker'));
  expect(rootRef.current).toHaveClass('caller-root', dateTimePickerClassNames.root);
  expect(rootRef.current).not.toHaveClass('top-class-overridden-by-root');
  expect(rootRef.current?.style.maxWidth).toBe('340px');
  expect(rootRef.current).toHaveAttribute('data-root-rendered');
  expect(input).toHaveClass('caller-input', dateTimePickerClassNames.input);
  expect(input.tagName).toBe('INPUT');
  expect(input).toHaveAttribute('id', 'slotted-native-date');
  expect(input).toHaveAttribute('name', 'slotted-native-name');
  expect(beforeRef.current).toHaveClass('caller-before');
  expect(beforeRef.current).toHaveTextContent('Local');
  expect(afterRef.current).toHaveClass('caller-after', dateTimePickerClassNames.contentAfter);
  expect(afterRef.current).toHaveAttribute('data-after-rendered');
  await expect.element(screen.getByText('Caller suffix')).toBeVisible();
  expect(afterRef.current?.querySelectorAll('button')).toHaveLength(1);
  await screen.getByLabelText('Slotted date').fill('2026-07-29');
  expect(onChange).toHaveBeenCalledOnce();
  // The installed public Input replaces its native-slot onChange.
  expect(slotChange).not.toHaveBeenCalled();
  await userEvent.keyboard('{ArrowRight}');
  expect(slotKeyDown).toHaveBeenCalledOnce();
  expect(topKeyDown).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: 'Open date picker' }).click();
  expect(showPicker).toHaveBeenCalledOnce();
  await screen.getByRole('button', { name: 'After picker' }).click();
  expect(onFocus).toHaveBeenCalled();
  expect(onBlur).toHaveBeenCalled();
});

test('calls showPicker from real click and keyboard activation without becoming a form submitter', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const showPicker = vi
    .spyOn(HTMLInputElement.prototype, 'showPicker')
    .mockImplementation(function (this: HTMLInputElement) {
      expect(this).toBe(ref.current);
    });
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const screen = await render(
    <CoreAIFluentProvider>
      <form onSubmit={submit}>
        <DateTimePicker ref={ref} aria-label="Native time" type="time" />
      </form>
    </CoreAIFluentProvider>,
  );
  const button = screen.getByRole('button', { name: 'Open time picker' });
  await button.click();
  await expect.element(button).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(showPicker).toHaveBeenCalledTimes(2);
  expect(submit).not.toHaveBeenCalled();
});

test('keeps the native editor when showPicker is unavailable without adding a replacement popup', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <DateTimePicker ref={ref} aria-label="Native fallback" />
    </CoreAIFluentProvider>,
  );
  Object.defineProperty(ref.current, 'showPicker', { configurable: true, value: undefined });
  await screen.getByRole('button', { name: 'Open date picker' }).click();
  await expect.element(ref.current!).toHaveFocus();
  await screen.getByLabelText('Native fallback').fill('2026-07-29');
  await expect.element(ref.current!).toHaveValue('2026-07-29');
  expect(screen.container.querySelector('dialog, [popover]')).toBeNull();
});

test.each([
  { name: 'top-level disabled', props: { disabled: true }, disabled: true, readOnly: false },
  { name: 'top-level readOnly', props: { readOnly: true }, disabled: false, readOnly: true },
  {
    name: 'native disabled',
    props: { input: { disabled: true } },
    disabled: true,
    readOnly: false,
  },
  {
    name: 'native readOnly',
    props: { input: { readOnly: true } },
    disabled: false,
    readOnly: true,
  },
  {
    name: 'enabled slot override',
    props: { disabled: true, input: { disabled: false } },
    disabled: false,
    readOnly: false,
  },
  {
    name: 'editable slot override',
    props: { readOnly: true, input: { readOnly: false } },
    disabled: false,
    readOnly: false,
  },
  {
    name: 'explicit undefined slot override',
    props: { disabled: true, input: { disabled: undefined } },
    disabled: false,
    readOnly: false,
  },
] satisfies { name: string; props: DateTimePickerProps; disabled: boolean; readOnly: boolean }[])(
  'uses actual native mutability for actions with $name',
  async ({ props, disabled, readOnly }) => {
    const ref = React.createRef<HTMLInputElement>();
    const showPicker = vi
      .spyOn(HTMLInputElement.prototype, 'showPicker')
      .mockImplementation(() => undefined);
    const screen = await render(
      <CoreAIFluentProvider>
        <DateTimePicker
          {...props}
          ref={ref}
          aria-label="Native mutability"
          value={new Date(2026, 6, 29)}
          clearable
        />
      </CoreAIFluentProvider>,
    );
    expect(ref.current?.disabled).toBe(disabled);
    expect(ref.current?.readOnly).toBe(readOnly);
    const button = screen.getByRole('button', { name: 'Open date picker' });
    const mutable = !disabled && !readOnly;
    expect(button.element()).toHaveProperty('disabled', !mutable);
    expect(Boolean(screen.container.querySelector('[aria-label="Clear value"]'))).toBe(mutable);
    await userEvent.click(button, { force: true });
    expect(showPicker).toHaveBeenCalledTimes(mutable ? 1 : 0);
  },
);

test('keeps read-only action differences visible instead of copying legacy programmatic edits', async () => {
  const { legacy, headless } = await renderPair(dateTimePickerReadOnlyExample);
  const oldSlots = getDateTimePickerSlots(legacy);
  const newSlots = getDateTimePickerSlots(headless);
  expect(oldSlots.input.readOnly).toBe(true);
  expect(newSlots.input.readOnly).toBe(true);
  expect(oldSlots.clearButton).not.toBeNull();
  expect(newSlots.clearButton).toBeNull();
  expect(oldSlots.pickerButton.disabled).toBe(false);
  expect(newSlots.pickerButton.disabled).toBe(true);
  expect(
    compareDateTimePickerStyles(
      captureDateTimePickerStyles(legacy),
      captureDateTimePickerStyles(headless),
    ),
  ).toContainEqual({ property: 'pickerButton.disabled', legacy: 'false', headless: 'true' });
});

test('does not retain an arrow-step rollback after caller-cancelled keyboard editing', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const onChange = vi.fn();
  const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') event.preventDefault();
  });
  const screen = await render(
    <CoreAIFluentProvider>
      <DateTimePicker
        ref={ref}
        aria-label="Native keyboard"
        defaultValue={new Date(2026, 6, 29)}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </CoreAIFluentProvider>,
  );
  ref.current?.focus();
  await userEvent.keyboard('{ArrowUp}');
  expect(onKeyDown).toHaveBeenCalledOnce();
  expect(onChange).not.toHaveBeenCalled();
  await screen.getByLabelText('Native keyboard').fill('2025-07-29');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: new Date(2025, 6, 29) });
  await expect.element(ref.current!).toHaveValue('2025-07-29');
});

for (const enabled of [true, false]) {
  test(`uses only the new provider for defaults=${enabled}, even under opposite legacy defaults`, async () => {
    const ref = React.createRef<HTMLInputElement>();
    const screen = await render(
      <LegacyProvider
        withComponentDefaults={!enabled}
        theme={{ borderRadiusCircular: '31px', borderRadiusMedium: '19px' }}
      >
        <CoreAIFluentProvider
          withComponentDefaults={enabled}
          theme={{ ...coreaiLightTheme, borderRadiusCircular: '13px', borderRadiusMedium: '4px' }}
        >
          <Field label="Independent native date" size="small" required>
            <DateTimePicker ref={ref} />
          </Field>
          <DateTimePicker aria-label="Explicit undefined appearance" appearance={undefined} />
          <DateTimePicker aria-label="Explicit outline" appearance="outline" size="large" />
        </CoreAIFluentProvider>
      </LegacyProvider>,
    );
    const root = ref.current?.closest<HTMLElement>('.fui-DateTimePicker');
    if (!root) throw new Error('Missing new-provider picker');
    expect(root).toHaveAttribute('data-appearance', 'filled-darker');
    expect(root).toHaveAttribute('data-size', 'small');
    expect(ref.current?.required).toBe(true);
    const button = getDateTimePickerSlots(root).pickerButton;
    expect(button).toHaveAttribute('data-shape', enabled ? 'circular' : 'rounded');
    expect(getComputedStyle(button).borderRadius).toBe(enabled ? '13px' : '4px');
    const undefinedRoot = screen
      .getByLabelText('Explicit undefined appearance')
      .element()
      .closest('.fui-DateTimePicker');
    expect(undefinedRoot).toHaveAttribute('data-appearance', 'filled-darker');
    const explicitRoot = screen
      .getByLabelText('Explicit outline')
      .element()
      .closest('.fui-DateTimePicker');
    expect(explicitRoot).toHaveAttribute('data-appearance', 'outline');
    expect(explicitRoot).toHaveAttribute('data-size', 'large');
  });
}

test.each([
  { name: 'omitted appearance', props: { label: 'Default date' } },
  { name: 'undefined appearance', props: { label: 'Default date', appearance: undefined } },
  { name: 'explicit outline', props: { label: 'Default date', appearance: 'outline' } },
] satisfies DateTimePickerExample[])(
  'matches $name with both provider defaults disabled',
  async (example) => {
    const { legacy, headless } = await renderPair(example, coreaiLightTheme, false);
    expect(
      compareDateTimePickerStyles(
        captureDateTimePickerStyles(legacy),
        captureDateTimePickerStyles(headless),
      ),
    ).toEqual([]);
    expect(getDateTimePickerSlots(headless).pickerButton).toHaveAttribute('data-shape', 'rounded');
  },
);

test('matches RTL native control and logical affix/button spacing', async () => {
  const { legacy, headless } = await renderPair(
    {
      name: 'RTL native date',
      props: {
        label: 'Due date',
        value: new Date(2026, 6, 29),
        clearable: true,
        contentAfter: 'Local',
      },
    },
    coreaiDarkTheme,
    true,
    'rtl',
  );
  expect(getComputedStyle(headless).direction).toBe('rtl');
  expect(
    compareDateTimePickerStyles(
      captureDateTimePickerStyles(legacy),
      captureDateTimePickerStyles(headless),
    ),
  ).toEqual([]);
  expect(getDateTimePickerSlots(headless).input).toHaveValue('2026-07-29');
});

test('lets ordinary caller CSS override the Input foundation, native slot, and Button actions', async () => {
  const { headless } = await renderPair(dateTimePickerConsumerExample);
  const { input, contentAfter, pickerButton, clearButton } = getDateTimePickerSlots(headless);
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(headless).backgroundColor).toBe('rgb(232, 240, 255)');
  expect(getComputedStyle(input).paddingInlineStart).toBe('14px');
  expect(getComputedStyle(input).paddingInlineEnd).toBe('14px');
  expect(getComputedStyle(input).color).toBe('rgb(32, 48, 96)');
  expect(contentAfter && getComputedStyle(contentAfter).gap).toBe('7px');
  expect(contentAfter && getComputedStyle(contentAfter).color).toBe('rgb(72, 32, 128)');
  for (const action of [pickerButton, clearButton]) {
    if (!action) throw new Error('Missing consumer action');
    expect(getComputedStyle(action).borderRadius).toBe('2px');
    expect(action.getBoundingClientRect().width).toBe(28);
  }
});
