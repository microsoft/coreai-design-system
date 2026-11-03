// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `Date` <-> native-input-string conversion for `DateTimePicker`.
 *
 * All conversions use local wall-clock fields, not UTC fields or ISO parsing.
 * Native valueAsDate is UTC-based for date/month/week and is unsupported for
 * datetime-local, which has no timezone information.
 *
 * The CoreAI Date interface retains minute precision. Native time strings can
 * include seconds with a finer step, but those seconds do not enter the Date
 * callback. A time value uses today's local date at the moment it is parsed.
 */
import type { DateTimePickerType } from './DateTimePicker.js';

const pad = (value: number, width = 2): string => String(value).padStart(width, '0');

// Constructors remap years 0–99 to 1900+year. Set all date fields together to
// avoid that remapping and retain normalization across ISO-week year boundaries.
function makeLocalDate(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// ISO 8601 weeks start Monday; week 1 contains the year's first Thursday.
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

// Monday of ISO week 1 (the week containing Jan 4th).
function getIsoWeek1Monday(year: number): Date {
  const jan4 = makeLocalDate(year, 0, 4);
  return makeLocalDate(year, 0, 4 - ((jan4.getDay() + 6) % 7));
}

function parseDatePart(value: string): Date | null {
  const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = makeLocalDate(year, month, day);
  return year > 0 &&
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
    ? date
    : null;
}

function parseTimePart(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  return hours < 24 && minutes < 60 && seconds < 60 ? { hours, minutes } : null;
}

/** Format local fields for a native temporal input; empty for a nullish or invalid Date. */
export function dateToInputValue(date: Date | null | undefined, type: DateTimePickerType): string {
  if (!date || !Number.isFinite(date.getTime())) return '';
  if (type !== 'time' && date.getFullYear() < 1) return '';

  const yearMonth = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}`;
  const datePart = `${yearMonth}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  switch (type) {
    case 'date':
      return datePart;
    case 'month':
      return yearMonth;
    case 'week': {
      const { year, week } = getIsoWeek(date);
      return `${pad(year, 4)}-W${pad(week)}`;
    }
    case 'time':
      return timePart;
    case 'datetime-local':
      return `${datePart}T${timePart}`;
  }
}

/** Parse a native temporal input string as a local Date, or null if empty/unparsable. */
export function inputValueToDate(value: string, type: DateTimePickerType): Date | null {
  if (!value) return null;

  switch (type) {
    case 'date':
      return parseDatePart(value);
    case 'month':
      return parseDatePart(`${value}-01`);
    case 'week': {
      const match = /^(\d{4,})-W(\d{2})$/.exec(value);
      if (!match) return null;
      const year = Number(match[1]);
      const week = Number(match[2]);
      if (year < 1 || week < 1 || week > 53) return null;
      const monday = getIsoWeek1Monday(year);
      monday.setDate(monday.getDate() + (week - 1) * 7);
      const parsed = getIsoWeek(monday);
      return parsed.year === year && parsed.week === week ? monday : null;
    }
    case 'time': {
      const time = parseTimePart(value);
      if (!time) return null;
      const now = new Date();
      return makeLocalDate(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        time.hours,
        time.minutes,
      );
    }
    case 'datetime-local': {
      const [datePart, timePart, extra] = value.split('T');
      if (!timePart || extra !== undefined) return null;
      const date = parseDatePart(datePart);
      const time = parseTimePart(timePart);
      if (!date || !time) return null;
      // Date follows the local timezone's daylight-saving normalization.
      date.setHours(time.hours, time.minutes, 0, 0);
      return date;
    }
  }
}
