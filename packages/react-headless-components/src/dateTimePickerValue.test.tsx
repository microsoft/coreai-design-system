// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { afterEach, expect, test, vi } from 'vitest';
import type { DateTimePickerType } from './DateTimePicker.js';
import { dateToInputValue, inputValueToDate } from './dateTimePickerValue.js';

afterEach(() => {
  vi.useRealTimers();
});

const types: readonly DateTimePickerType[] = ['date', 'time', 'datetime-local', 'month', 'week'];
const local = new Date(2026, 6, 29, 9, 30, 45, 123);

test.each([
  ['date', '2026-07-29'],
  ['time', '09:30'],
  ['datetime-local', '2026-07-29T09:30'],
  ['month', '2026-07'],
  ['week', '2026-W31'],
] as const)('formats local %s fields without UTC conversion', (type, expected) => {
  expect(dateToInputValue(local, type)).toBe(expected);
});

test.each(types)('formats nullish and invalid Dates as an empty %s input', (type) => {
  expect(dateToInputValue(null, type)).toBe('');
  expect(dateToInputValue(undefined, type)).toBe('');
  expect(dateToInputValue(new Date(Number.NaN), type)).toBe('');
  expect(inputValueToDate('', type)).toBeNull();
});

test.each([
  ['date', '2026-07-29', new Date(2026, 6, 29)],
  ['month', '2026-07', new Date(2026, 6, 1)],
  ['datetime-local', '2026-07-29T09:30', new Date(2026, 6, 29, 9, 30)],
] as const)('parses %s as local wall-clock fields', (type, native, expected) => {
  expect(inputValueToDate(native, type)).toEqual(expected);
});

test.each([
  ['2026-W01', 2025, 11, 29],
  ['2020-W01', 2019, 11, 30],
  ['2020-W53', 2020, 11, 28],
  ['2021-W01', 2021, 0, 4],
  ['2026-W31', 2026, 6, 27],
] as const)('resolves %s to the correct ISO Monday across calendar years', (value, y, m, d) => {
  const parsed = inputValueToDate(value, 'week');
  expect(parsed).toEqual(new Date(y, m, d));
  expect(parsed?.getDay()).toBe(1);
  expect(dateToInputValue(parsed, 'week')).toBe(value);
});

test.each([
  [2016, 0, 1, '2015-W53'],
  [2018, 11, 31, '2019-W01'],
  [2026, 0, 1, '2026-W01'],
  [2027, 0, 1, '2026-W53'],
] as const)('formats ISO week-year rather than calendar year for %s/%s/%s', (y, m, d, native) => {
  expect(dateToInputValue(new Date(y, m, d), 'week')).toBe(native);
});

test('preserves small years and years with more than four digits', () => {
  const small = inputValueToDate('0002-07-01', 'date');
  expect(small?.getFullYear()).toBe(2);
  expect(small?.getMonth()).toBe(6);
  expect(small?.getDate()).toBe(1);
  expect(dateToInputValue(small, 'date')).toBe('0002-07-01');
  const extended = inputValueToDate('10000-07', 'month');
  expect(extended?.getFullYear()).toBe(10000);
  expect(dateToInputValue(extended, 'month')).toBe('10000-07');
  const smallWeek = inputValueToDate('0002-W01', 'week');
  expect(smallWeek?.getFullYear()).toBe(1);
  expect(smallWeek?.getMonth()).toBe(11);
  expect(smallWeek?.getDate()).toBe(31);
  expect(dateToInputValue(smallWeek, 'week')).toBe('0002-W01');
});

test('uses today for time callbacks and retains the current minute-precision boundary', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 3, 11, 0));
  expect(inputValueToDate('09:30', 'time')).toEqual(new Date(2026, 10, 3, 9, 30));
  expect(inputValueToDate('09:30:45.123', 'time')).toEqual(new Date(2026, 10, 3, 9, 30));
  expect(inputValueToDate('2026-07-29T09:30:45', 'datetime-local')).toEqual(
    new Date(2026, 6, 29, 9, 30),
  );
  vi.setSystemTime(new Date(2026, 10, 4, 11, 0));
  expect(inputValueToDate('09:30', 'time')).toEqual(new Date(2026, 10, 4, 9, 30));
});

test.each([
  ['date', 'not a date'],
  ['date', '2026-02-29'],
  ['date', '2026-13-01'],
  ['date', '2026-07-00'],
  ['date', '0000-01-01'],
  ['month', '2026-00'],
  ['month', '2026-07-01'],
  ['week', '2026-W00'],
  ['week', '2021-W53'],
  ['week', '2026-W54'],
  ['week', '0000-W01'],
  ['time', '24:00'],
  ['time', '09:60'],
  ['time', '09:30:60'],
  ['time', '9:30'],
  ['datetime-local', '2026-07-29'],
  ['datetime-local', '2026-02-29T09:30'],
  ['datetime-local', '2026-07-29T25:30'],
  ['datetime-local', '2026-07-29T09:30T10:30'],
] as const)('returns null for an unparsable %s value: %s', (type, value) => {
  expect(inputValueToDate(value, type)).toBeNull();
});
