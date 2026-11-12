// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { Calendar, calendarClassNames, calendarDayClassNames } from './Calendar.js';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { DatePicker, datePickerClassNames, type DatePickerProps } from './DatePicker.js';
import { coreaiLightTheme } from './theme.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const today = new Date(2026, 7, 12);

async function renderDatePicker(props: Partial<DatePickerProps> = {}) {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <button type="button">Before</button>
      <DatePicker aria-label="Due date" today={today} {...(props as DatePickerProps)} />
    </CoreAIFluentProvider>,
  );
  const root = screen.container.querySelector<HTMLElement>(`.${datePickerClassNames.root}`)!;
  const getSurface = () =>
    document.querySelector<HTMLElement>(`.${datePickerClassNames.popupSurface}`);
  return { screen, root, getSurface };
}

function dayCell(label: string) {
  return document.querySelector(`button[aria-label="${label}"]`)!.closest('td')!;
}

function rgb(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.querySelector(`.${datePickerClassNames.root}`)!.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

test('styles the field slots and exposes root state attributes', async () => {
  const { root } = await renderDatePicker({ className: 'consumer' });
  const trigger = root.querySelector<HTMLButtonElement>(`.${datePickerClassNames.trigger}`)!;
  const displayValue = root.querySelector<HTMLElement>(`.${datePickerClassNames.displayValue}`)!;
  const icon = root.querySelector<HTMLElement>(`.${datePickerClassNames.icon}`)!;

  expect(root.classList.contains('consumer')).toBe(true);
  expect(root.dataset).toMatchObject({
    appearance: 'filled-darker',
    size: 'medium',
    placeholder: '',
  });
  expect(root.dataset.open).toBeUndefined();
  expect(root.dataset.editable).toBeUndefined();
  expect(trigger.tagName).toBe('BUTTON');
  expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  expect(displayValue.textContent).toBe('Select a date');
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.querySelector('svg')).not.toBeNull();
  expect(document.querySelector(`.${datePickerClassNames.errorMessage}`)!.textContent).toBe('');

  expect(getComputedStyle(root).backgroundColor).toBe(rgb('--colorNeutralBackground3'));
  expect(getComputedStyle(root).minHeight).toBe('32px');
  expect(getComputedStyle(displayValue).color).toBe(rgb('--colorNeutralForeground4'));
  expect(getComputedStyle(icon.querySelector('svg')!).width).toBe('20px');
});

test('honors appearance and size like Input', async () => {
  const { root } = await renderDatePicker({ appearance: 'outline', size: 'large' });

  expect(root.dataset).toMatchObject({ appearance: 'outline', size: 'large' });
  expect(getComputedStyle(root).backgroundColor).toBe(rgb('--colorNeutralBackground1'));
  expect(getComputedStyle(root).minHeight).toBe('40px');
});

test('opens a styled calendar popup and Escape returns focus to the field', async () => {
  const onOpenChange = vi.fn();
  const { root, getSurface } = await renderDatePicker({ onOpenChange });
  const trigger = root.querySelector<HTMLButtonElement>(`.${datePickerClassNames.trigger}`)!;

  await userEvent.click(trigger);
  expect(root.dataset.open).toBe('');
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  const surface = getSurface()!;
  expect(surface.matches(':popover-open')).toBe(true);
  expect(surface.getAttribute('role')).toBe('dialog');
  expect(surface.querySelector(`.${datePickerClassNames.calendar}`)).not.toBeNull();
  expect(surface.querySelector(`.${calendarClassNames.root}`)).not.toBeNull();
  expect(surface.querySelector(`.${calendarDayClassNames.grid}`)).not.toBeNull();
  // DatePicker defaults the month picker to three columns.
  expect(
    surface.querySelector('[data-fui-calendar-picker="month"] [role="row"]')!.children,
  ).toHaveLength(3);
  expect(getComputedStyle(surface).backgroundColor).toBe(rgb('--colorNeutralBackground1'));
  expect(getComputedStyle(surface).borderTopColor).toBe(rgb('--colorNeutralStroke3'));
  await expect.poll(() => document.activeElement).toBe(dayCell('August 12, 2026'));

  await userEvent.keyboard('{Escape}');
  expect(getSurface()).toBeNull();
  expect(root.dataset.open).toBeUndefined();
  expect(document.activeElement).toBe(trigger);
  expect(onOpenChange).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ open: false, reason: 'escape' }),
  );
});

test('Alt+ArrowDown opens, arrows move and Enter selects then returns focus', async () => {
  const onDateChange = vi.fn();
  const { root, getSurface } = await renderDatePicker({ onDateChange });
  const trigger = root.querySelector<HTMLButtonElement>(`.${datePickerClassNames.trigger}`)!;

  trigger.focus();
  await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
  expect(getSurface()).not.toBeNull();
  await expect.poll(() => document.activeElement).toBe(dayCell('August 12, 2026'));

  await userEvent.keyboard('{ArrowRight}');
  const next = dayCell('August 13, 2026');
  expect(document.activeElement).toBe(next);
  expect(next.tabIndex).toBe(0);
  expect(dayCell('August 12, 2026').tabIndex).toBe(-1);

  await userEvent.keyboard('{Enter}');
  expect(onDateChange).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ value: new Date(2026, 7, 13), reason: 'calendar' }),
  );
  expect(getSurface()).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(root.dataset.placeholder).toBeUndefined();
  expect(root.querySelector(`.${datePickerClassNames.displayValue}`)!.textContent).toBe(
    'August 13, 2026',
  );

  await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
  await expect.poll(() => document.activeElement).toBe(dayCell('August 13, 2026'));
  expect(dayCell('August 13, 2026').dataset.selected).toBe('');
});

test('clicking a day selects it and closes the popup', async () => {
  const onDateChange = vi.fn();
  const { root, screen, getSurface } = await renderDatePicker({ onDateChange });
  const trigger = root.querySelector<HTMLButtonElement>(`.${datePickerClassNames.trigger}`)!;

  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'August 20, 2026' }));
  expect(onDateChange).toHaveBeenCalledTimes(1);
  expect(getSurface()).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test('validates typed text on Enter and shows the error message', async () => {
  const onDateChange = vi.fn();
  const { root } = await renderDatePicker({ allowTextInput: true, onDateChange });
  const input = root.querySelector<HTMLInputElement>(`.${datePickerClassNames.input}`)!;
  const errorMessage = document.querySelector<HTMLElement>(
    `.${datePickerClassNames.errorMessage}`,
  )!;

  expect(root.dataset.editable).toBe('');
  expect(input.tagName).toBe('INPUT');
  expect(root.querySelector(`.${datePickerClassNames.trigger}`)).toBeNull();

  await userEvent.click(input);
  await userEvent.keyboard('2026-08-20{Enter}');
  expect(onDateChange).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ value: new Date(2026, 7, 20), reason: 'input' }),
  );
  expect(root.dataset.invalid).toBeUndefined();
  expect(input.value).toBe('August 20, 2026');

  await userEvent.clear(input);
  await userEvent.keyboard('not a date{Enter}');
  expect(root.dataset.invalid).toBe('');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.getAttribute('aria-describedby')).toContain(errorMessage.id);
  expect(errorMessage.textContent).not.toBe('');
  expect(getComputedStyle(errorMessage).color).toBe(rgb('--colorPaletteRedForeground1'));
  // Like Input, the invalid border yields to the focus indicator while focused.
  input.blur();
  expect(root.dataset.invalid).toBe('');
  expect(getComputedStyle(root).borderTopColor).toBe(rgb('--colorPaletteRedBorder2'));
});

test('the editable icon toggles the popup without taking focus', async () => {
  const { root, getSurface } = await renderDatePicker({ allowTextInput: true });
  const input = root.querySelector<HTMLInputElement>(`.${datePickerClassNames.input}`)!;
  const icon = root.querySelector<HTMLElement>(`.${datePickerClassNames.icon}`)!;

  expect(icon.getAttribute('role')).toBe('button');
  expect(icon.tabIndex).toBe(-1);
  await userEvent.click(input);
  await userEvent.click(icon);
  expect(getSurface()).not.toBeNull();
  expect(icon.getAttribute('aria-expanded')).toBe('true');

  await userEvent.click(icon);
  expect(getSurface()).toBeNull();
});

test('Escape on the field closes and an outside click dismisses', async () => {
  const { root, screen, getSurface } = await renderDatePicker({ allowTextInput: true });
  const input = root.querySelector<HTMLInputElement>(`.${datePickerClassNames.input}`)!;

  input.focus();
  await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
  expect(getSurface()).not.toBeNull();
  input.focus();
  await userEvent.keyboard('{Escape}');
  expect(getSurface()).toBeNull();

  await userEvent.click(root.querySelector(`.${datePickerClassNames.icon}`)!);
  expect(getSurface()).not.toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Before' }));
  expect(getSurface()).toBeNull();
});

test('disabled fields do not open', async () => {
  const { root, getSurface } = await renderDatePicker({ disabled: true });
  const trigger = root.querySelector<HTMLButtonElement>(`.${datePickerClassNames.trigger}`)!;

  expect(root.dataset.disabled).toBe('');
  expect(trigger.disabled).toBe(true);
  expect(getComputedStyle(root).cursor).toBe('not-allowed');
  expect(getSurface()).toBeNull();
});

test('calendar render functions receive the styled Calendar', async () => {
  const renderCalendar = vi.fn((Component: React.ElementType, props: object) => (
    <Component {...props} data-testid="custom-calendar" />
  ));
  const { root } = await renderDatePicker({
    defaultOpen: true,
    showGoToToday: true,
    calendar: { children: renderCalendar },
  });

  expect(root.dataset.open).toBe('');
  expect(renderCalendar.mock.calls[0][0]).toBe(Calendar);
  const calendar = document.querySelector<HTMLElement>('[data-testid="custom-calendar"]')!;
  expect(calendar.classList.contains(calendarClassNames.root)).toBe(true);
  expect(calendar.classList.contains(datePickerClassNames.calendar)).toBe(true);
  expect(calendar.querySelector(`.${calendarClassNames.goToTodayButton}`)).not.toBeNull();
});
