// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, test } from 'vitest';
import { dotGridToSvg } from './dotGridToSvg.js';
import { getDotGridCircles, getDotGridLayout } from './dotGridGeometry.js';

test('infers cell dimensions without trimming empty rows or columns', () => {
  expect(getDotGridLayout({ rows: ['0000', '0010', '0000'] })).toEqual({
    width: 20,
    height: 15,
    radius: 1,
    pitch: 5,
  });
});

test.each([[], [''], ['10', '1'], ['10', '02'], ['1 '], ['1\n']].map((rows) => ({ rows })))(
  'rejects invalid occupancy rows %j',
  ({ rows }) => {
    expect(() => dotGridToSvg({ rows })).toThrow(/nonempty, equal-length strings of 0s and 1s/);
  },
);

test.each([0, -1, NaN, Infinity])('rejects invalid pitch %s', (pitch) => {
  expect(() => dotGridToSvg({ rows: ['1'] }, { pitch })).toThrow(
    /pitch must be positive and finite/,
  );
});

test.each([0, -1, NaN, Infinity, 3])('rejects invalid radius %s', (radius) => {
  expect(() => dotGridToSvg({ rows: ['1'] }, { radius })).toThrow(/radius must be positive/);
});

test('exports editable circles with explicit paint and the complete rectangular artboard', () => {
  const source = dotGridToSvg({ rows: ['0000', '0010', '0000'] }, { radius: 1.5, pitch: 4 });
  expect(source).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="#242424">' +
      '<circle cx="9.5" cy="5.5" r="1.5"/></svg>',
  );
});

test.each([
  { pitch: 4, radius: 1, offset: 2 },
  { pitch: 5, radius: 1, offset: 2 },
  { pitch: 4, radius: 0.5, offset: 1.5 },
  { pitch: 5, radius: 0.5, offset: 2.5 },
  { pitch: 4.5, radius: 1, offset: 2.25 },
  { pitch: 5, radius: 1.25, offset: 2.5 },
])('preserves pitch and radius while positioning dots: %j', ({ pitch, radius, offset }) => {
  const data = { rows: ['11'] };
  expect(Array.from(getDotGridCircles(data, pitch, radius))).toEqual([
    { cx: offset, cy: offset },
    { cx: offset + pitch, cy: offset },
  ]);
  const svg = new DOMParser().parseFromString(
    dotGridToSvg(data, { pitch, radius }),
    'image/svg+xml',
  );
  const dots = Array.from(svg.querySelectorAll('circle'));
  expect(dots.map((dot) => Number(dot.getAttribute('cx')))).toEqual([offset, offset + pitch]);
  expect(dots.every((dot) => Number(dot.getAttribute('r')) === radius)).toBe(true);
});

test('exports an all-zero grid without dropping its artboard', () => {
  expect(dotGridToSvg({ rows: ['00', '00', '00'] })).toContain(
    'width="10" height="15" viewBox="0 0 10 15"',
  );
  expect(dotGridToSvg({ rows: ['00', '00', '00'] })).not.toContain('<circle');
});
