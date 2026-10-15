// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { DateTimePicker } from './DateTimePicker.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

test('renders a native temporal input with converted constraints and forwards its ref', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const screen = await renderCoreAIComponent(
    <DateTimePicker
      ref={ref}
      label="Appointment"
      type="datetime-local"
      defaultValue={new Date(2026, 6, 29, 9, 30)}
      min={new Date(2026, 6, 1, 8, 0)}
      max={new Date(2026, 6, 31, 17, 0)}
    />,
  );
  const input = screen.getByLabelText('Appointment').element() as HTMLInputElement;

  expect(input).toBe(ref.current);
  expect(input).toHaveAttribute('type', 'datetime-local');
  expect(input).toHaveValue('2026-07-29T09:30');
  expect(input).toHaveAttribute('min', '2026-07-01T08:00');
  expect(input).toHaveAttribute('max', '2026-07-31T17:00');
  expect(input.closest('.fui-DateTimePicker')).not.toBeNull();
});

test('converts native input changes to local Date values', async () => {
  const onChange = vi.fn();
  const screen = await renderCoreAIComponent(
    <DateTimePicker aria-label="Start date" onChange={onChange} />,
  );
  const input = screen.getByLabelText('Start date');

  await input.fill('2026-07-29');

  expect(onChange).toHaveBeenCalledOnce();
  const changedValue = onChange.mock.calls[0][1].value as Date;
  expect(changedValue.getFullYear()).toBe(2026);
  expect(changedValue.getMonth()).toBe(6);
  expect(changedValue.getDate()).toBe(29);
  expect(changedValue.getHours()).toBe(0);
  expect(changedValue.getMinutes()).toBe(0);
});

test.each([
  ['below min', '2026-06-30', 'out-of-bounds'],
  ['equal to min', '2026-07-01', undefined],
  ['between min and max', '2026-07-15', undefined],
  ['equal to max', '2026-07-31', undefined],
  ['above max', '2026-08-01', 'out-of-bounds'],
] as const)(
  'reports native constraint validation when the value is %s',
  async (_, value, error) => {
    const onValidationResult = vi.fn();
    const screen = await renderCoreAIComponent(
      <DateTimePicker
        aria-label="Due date"
        min={new Date(2026, 6, 1)}
        max={new Date(2026, 6, 31)}
        onValidationResult={onValidationResult}
      />,
    );
    const input = screen.getByLabelText('Due date');

    await input.fill(value);
    expect(onValidationResult).toHaveBeenLastCalledWith(expect.anything(), {
      error,
    });
  },
);

test('clears an uncontrolled value', async () => {
  const onChange = vi.fn();
  const screen = await renderCoreAIComponent(
    <DateTimePicker
      aria-label="Due date"
      defaultValue={new Date(2026, 6, 29)}
      clearable
      onChange={onChange}
    />,
  );
  const input = screen.getByLabelText('Due date');

  await input.fill('2026-07-30');
  await screen.getByRole('button', { name: 'Clear value' }).click();

  await expect.element(input).toHaveValue('2026-07-29');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), {
    value: new Date(2026, 6, 29),
  });
  expect(document.querySelector('button[aria-label="Clear value"]')).toBeNull();
});

test('opens the native picker from the themed picker button', async () => {
  const showPicker = vi
    .spyOn(HTMLInputElement.prototype, 'showPicker')
    .mockImplementation(() => undefined);
  const screen = await renderCoreAIComponent(<DateTimePicker type="time" />);

  await screen.getByRole('button', { name: 'Open time picker' }).click();

  expect(showPicker).toHaveBeenCalledOnce();
});

test('reflects controlled value updates', async () => {
  const screen = await renderCoreAIComponent(
    <DateTimePicker aria-label="Billing month" type="month" value={new Date(2026, 6, 1)} />,
  );
  const input = screen.getByLabelText('Billing month');

  await expect.element(input).toHaveValue('2026-07');

  await screen.rerender(
    <DateTimePicker aria-label="Billing month" type="month" value={new Date(2026, 7, 1)} />,
  );

  await expect.element(input).toHaveValue('2026-08');
});
