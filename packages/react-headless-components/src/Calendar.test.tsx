// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import {
  Calendar,
  CalendarDay,
  calendarClassNames,
  calendarDayClassNames,
  calendarMonthClassNames,
  calendarYearClassNames,
  type CalendarProps,
} from './Calendar.js';
import { coreaiLightTheme } from './theme.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const today = new Date(2026, 7, 12);

async function renderCalendar(props: Partial<CalendarProps> = {}) {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <Calendar aria-label="Calendar" today={today} {...props} />
    </CoreAIFluentProvider>,
  );
  const root = screen.container.querySelector<HTMLElement>(`.${calendarClassNames.root}`)!;
  return { screen, root };
}

function dayCell(root: HTMLElement, label: string) {
  const button = root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  expect(button, label).not.toBeNull();
  return button!.closest('td')!;
}

function monthCell(root: HTMLElement, name: string) {
  const picker = root.querySelector<HTMLElement>(`.${calendarMonthClassNames.grid}`)!;
  return [...picker.querySelectorAll<HTMLElement>('[role="gridcell"]')].find(
    (cell) => cell.textContent === name,
  )!;
}

function rgb(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.querySelector(`.${calendarClassNames.root}`)!.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

test('styles every Calendar, CalendarDay and CalendarMonth slot', async () => {
  const { root } = await renderCalendar({ showWeekNumbers: false });

  expect(root.dataset.sideBySide).toBe('');
  expect(root.dataset.dateRangeType).toBe('day');
  expect(root.querySelector(`.${calendarClassNames.liveRegion}`)).toHaveProperty('offsetWidth', 1);
  expect(root.querySelector(`.${calendarClassNames.divider}`)).not.toBeNull();
  expect(root.querySelector(`.${calendarClassNames.monthPickerWrapper}`)).not.toBeNull();
  expect(root.querySelector(`.${calendarClassNames.goToTodayButton}`)).toHaveProperty(
    'disabled',
    true,
  );

  for (const className of Object.values(calendarDayClassNames).filter(
    (name) => name !== calendarDayClassNames.closeButton,
  )) {
    expect(root.querySelector(`.${className}`), className).not.toBeNull();
  }
  for (const className of Object.values(calendarMonthClassNames)) {
    expect(root.querySelector(`.${className}`), className).not.toBeNull();
  }

  const dayRoot = root.querySelector<HTMLElement>(`.${calendarDayClassNames.root}`)!;
  expect(dayRoot.dataset.fuiCalendarPicker).toBe('day');
  expect(getComputedStyle(dayRoot).width).toBe('196px');
  expect(getComputedStyle(root).display).toBe('inline-grid');
  expect(root.querySelector(`.${calendarDayClassNames.grid}`)!.getBoundingClientRect().width).toBe(
    196,
  );

  // Upstream navigation buttons are empty; the CoreAI port supplies icons.
  for (const className of [
    calendarDayClassNames.previousMonthButton,
    calendarDayClassNames.nextMonthButton,
    calendarMonthClassNames.previousYearButton,
    calendarMonthClassNames.nextYearButton,
  ]) {
    expect(root.querySelector(`.${className} svg`), className).not.toBeNull();
  }
});

test('keeps consumer className, children and render functions on nested pickers', async () => {
  const render = vi.fn((Component: React.ElementType, props: object) => (
    <Component {...props} data-testid="custom-day" />
  ));
  const { root } = await renderCalendar({
    className: 'consumer',
    dayPicker: { children: render, previousMonthButton: { children: 'Prev' } },
  });

  expect(root.classList.contains('consumer')).toBe(true);
  expect(render).toHaveBeenCalled();
  expect(render.mock.calls[0][0]).toBe(CalendarDay);
  const day = root.querySelector<HTMLElement>('[data-testid="custom-day"]')!;
  expect(day.classList.contains(calendarDayClassNames.root)).toBe(true);
  expect(root.querySelector(`.${calendarDayClassNames.previousMonthButton}`)!.textContent).toBe(
    'Prev',
  );
});

test('exposes selected, today and current state attributes with matching styles', async () => {
  const { root } = await renderCalendar({ defaultValue: new Date(2026, 7, 20) });

  const todayCell = dayCell(root, 'August 12, 2026');
  expect(todayCell.dataset.today).toBe('');
  expect(todayCell.getAttribute('aria-current')).toBe('date');
  expect(getComputedStyle(todayCell.querySelector('button')!, '::before').backgroundColor).toBe(
    rgb('--colorBrandBackground'),
  );

  const selectedCell = dayCell(root, 'August 20, 2026');
  expect(selectedCell.dataset.selected).toBe('');
  expect(selectedCell.getAttribute('aria-selected')).toBe('true');
  expect(selectedCell.tabIndex).toBe(0);
  expect(getComputedStyle(selectedCell.querySelector('button')!).backgroundColor).toBe(
    rgb('--colorBrandBackgroundInvertedSelected'),
  );

  const outside = dayCell(root, 'September 1, 2026');
  expect(outside.dataset.outsideMonth).toBe('');
  expect(getComputedStyle(outside).color).toBe(rgb('--colorNeutralForeground4'));

  const august = monthCell(root, 'Aug');
  expect(august.dataset.current).toBe('');
  expect(august.dataset.selected).toBe('');
  expect(getComputedStyle(august.querySelector('button')!).backgroundColor).toBe(
    rgb('--colorBrandBackground'),
  );
  expect(monthCell(root, 'Mar').dataset.current).toBeUndefined();
});

test('marks out-of-bounds days unavailable', async () => {
  const { root } = await renderCalendar({ minDate: new Date(2026, 7, 10) });

  const cell = dayCell(root, 'August 9, 2026');
  expect(cell.dataset.outsideBounds).toBe('');
  expect(cell.querySelector('button')!.disabled).toBe(true);
  expect(getComputedStyle(cell).pointerEvents).toBe('none');
});

test('moves the roving tab stop with arrow keys and selects with Enter', async () => {
  const onSelectDate = vi.fn();
  const { root } = await renderCalendar({ defaultValue: new Date(2026, 7, 20), onSelectDate });
  const start = dayCell(root, 'August 20, 2026');

  start.focus();
  await userEvent.keyboard('{ArrowRight}');
  const next = dayCell(root, 'August 21, 2026');
  expect(document.activeElement).toBe(next);
  expect(next.tabIndex).toBe(0);
  expect(start.tabIndex).toBe(-1);

  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(dayCell(root, 'August 28, 2026'));

  await userEvent.keyboard('{ArrowDown}');
  const crossed = dayCell(root, 'September 4, 2026');
  expect(document.activeElement).toBe(crossed);
  expect(root.querySelector(`.${calendarDayClassNames.heading}`)!.textContent).toBe(
    'September 2026',
  );

  await userEvent.keyboard('{Enter}');
  expect(onSelectDate).toHaveBeenCalledTimes(1);
  expect(onSelectDate.mock.calls[0][1].date).toEqual(new Date(2026, 8, 4));
  expect(dayCell(root, 'September 4, 2026').dataset.selected).toBe('');
});

test('selects by click and navigates months and the go-to-today button', async () => {
  const onSelectDate = vi.fn();
  const { root, screen } = await renderCalendar({ onSelectDate });
  const heading = root.querySelector(`.${calendarDayClassNames.heading}`)!;

  await userEvent.click(root.querySelector(`.${calendarDayClassNames.nextMonthButton}`)!);
  expect(heading.textContent).toBe('September 2026');

  await userEvent.click(screen.getByRole('button', { name: 'September 15, 2026' }));
  expect(onSelectDate).toHaveBeenCalledTimes(1);
  expect(dayCell(root, 'September 15, 2026').dataset.selected).toBe('');

  const goToToday = root.querySelector<HTMLButtonElement>(
    `.${calendarClassNames.goToTodayButton}`,
  )!;
  expect(goToToday.disabled).toBe(false);
  await userEvent.click(goToToday);
  expect(heading.textContent).toBe('August 2026');
});

test('month grid uses a roving tab stop and the year picker is styled', async () => {
  const { root } = await renderCalendar();
  const august = monthCell(root, 'Aug');

  august.focus();
  // Month rows do not wrap; August ends the second four-column row.
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(august);
  await userEvent.keyboard('{ArrowLeft}');
  const july = monthCell(root, 'Jul');
  expect(document.activeElement).toBe(july);
  expect(july.tabIndex).toBe(0);
  expect(august.tabIndex).toBe(-1);

  await userEvent.click(root.querySelector(`.${calendarMonthClassNames.heading}`)!);
  for (const className of Object.values(calendarYearClassNames)) {
    expect(root.querySelector(`.${className}`), className).not.toBeNull();
  }
  const current = root.querySelector<HTMLElement>(
    `.${calendarYearClassNames.grid} [role="gridcell"][data-current]`,
  )!;
  expect(current.textContent).toBe('2026');
});

test('highlights a whole selected week as one range', async () => {
  const { root } = await renderCalendar({
    dateRangeType: 'week',
    defaultValue: new Date(2026, 7, 12),
  });
  expect(root.dataset.dateRangeType).toBe('week');

  const selected = [...root.querySelectorAll<HTMLElement>('td[data-selected]')];
  expect(selected).toHaveLength(7);
  const fill = rgb('--colorBrandBackgroundInvertedSelected');
  for (const cell of selected) {
    expect(getComputedStyle(cell).backgroundColor).toBe(fill);
  }
  expect(getComputedStyle(selected[0]).borderStartStartRadius).not.toBe('0px');
  expect(getComputedStyle(selected[3]).borderStartStartRadius).toBe('0px');
  expect(getComputedStyle(selected[6]).borderEndEndRadius).not.toBe('0px');
});

test('Escape on the calendar calls onDismiss', async () => {
  const onDismiss = vi.fn();
  const { root } = await renderCalendar({ onDismiss });

  dayCell(root, 'August 12, 2026').focus();
  await userEvent.keyboard('{Escape}');
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
