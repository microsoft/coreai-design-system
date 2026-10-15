// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `Date` <-> native-input-string conversion for `DateTimePicker`.
 *
 * All conversions use *local* wall-clock `Date` fields (`getFullYear`,
 * `getMonth`, ... not the UTC variants) so a `Date` round-trips through the
 * picker as the calendar date/time the user saw, regardless of timezone —
 * `new Date("2026-07-29")`-style ISO parsing is avoided on purpose since it's
 * UTC-based and can shift a day in negative-UTC-offset timezones.
 *
 * Native `HTMLInputElement.valueAsDate` isn't used here because it's
 * UTC-based for `date`/`month`/`week` and unsupported entirely for
 * `datetime-local` (no timezone info) — see MDN.
 */
import type { DateTimePickerType } from './DateTimePicker.js';

const pad = (value: number, width = 2): string => String(value).padStart(width, '0');

// `new Date(year, ...)` silently remaps any `year` 0-99 to 1900+year (a legacy JS quirk) -
// e.g. `new Date(2, 6, 1)` is 1902, not year 2. Native date inputs allow typing a partial/small
// year (e.g. "0002" mid-edit), so every Date built from parsed input parts must go through this
// instead of the constructor directly. `setFullYear` has no such remapping.
function makeLocalDate(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  const date = new Date(2000, month, day, hours, minutes);
  date.setFullYear(year);
  return date;
}

// ISO 8601 week number (Monday-start, week 1 contains the year's first Thursday).
function getIsoWeek(date: Date): { year: number; week: number } {
  const target = makeLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = (target.getDay() + 6) % 7; // Mon=0 .. Sun=6
  target.setDate(target.getDate() - dayNumber + 3); // nearest Thursday
  const firstThursday = makeLocalDate(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return { year: target.getFullYear(), week };
}

// Monday of ISO week 1 (the week containing Jan 4th) for a given year.
function getIsoWeek1Monday(year: number): Date {
  const jan4 = makeLocalDate(year, 0, 4);
  const jan4DayNumber = (jan4.getDay() + 6) % 7;
  return makeLocalDate(year, 0, 4 - jan4DayNumber);
}

/** Formats a `Date` into the string a native `<input>` of the given `type` expects. Returns `""` for a nullish date. */
export function dateToInputValue(date: Date | null | undefined, type: DateTimePickerType): string {
  if (!date) {
    return '';
  }

  const datePart = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  switch (type) {
    case 'date':
      return datePart;
    case 'month':
      return datePart.slice(0, 7);
    case 'week': {
      const { year, week } = getIsoWeek(date);
      return `${pad(year, 4)}-W${pad(week)}`;
    }
    case 'time':
      return timePart;
    case 'datetime-local':
      return `${datePart}T${timePart}`;
    default:
      return '';
  }
}

/** Parses a native `<input>` value string (of the given `type`) into a `Date`, or `null` if empty/unparsable. */
export function inputValueToDate(value: string, type: DateTimePickerType): Date | null {
  if (!value) {
    return null;
  }

  switch (type) {
    case 'date': {
      const [y, m, d] = value.split('-').map(Number);
      return makeLocalDate(y, m - 1, d);
    }
    case 'month': {
      const [y, m] = value.split('-').map(Number);
      return makeLocalDate(y, m - 1, 1);
    }
    case 'week': {
      const [yearStr, weekStr] = value.split('-W');
      const year = Number(yearStr);
      const week = Number(weekStr);
      const week1Monday = getIsoWeek1Monday(year);
      return makeLocalDate(
        week1Monday.getFullYear(),
        week1Monday.getMonth(),
        week1Monday.getDate() + (week - 1) * 7,
      );
    }
    case 'time': {
      const [h, m] = value.split(':').map(Number);
      const now = new Date();
      return makeLocalDate(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    }
    case 'datetime-local': {
      const [datePart, timePart] = value.split('T');
      const [y, mo, d] = datePart.split('-').map(Number);
      const [h, mi] = (timePart ?? '0:0').split(':').map(Number);
      return makeLocalDate(y, mo - 1, d, h, mi);
    }
    default:
      return null;
  }
}
