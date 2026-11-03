// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Heart16Filled,
  Heart16Regular,
  Heart24Filled,
  Heart24Regular,
} from '@fluentui/react-icons';
import { afterEach, expect, test, vi } from 'vitest';
import { iconToDotGrid } from './iconToDotGrid.js';
import { dotGridToSvg } from './dotGridToSvg.js';

afterEach(() => vi.restoreAllMocks());

const svg = (content: string, viewBox = '0 0 4 4') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`;

test('samples into occupancy-only data and preserves empty borders', async () => {
  const data = await iconToDotGrid(svg('<rect x="1" y="1" width="2" height="2"/>'), { columns: 4 });
  expect(data).toEqual({ rows: ['0000', '0110', '0110', '0000'] });
  expect(JSON.parse(JSON.stringify(data))).toEqual(data);
});

test('accepts SVG markup without an explicit namespace', async () => {
  expect(
    await iconToDotGrid('<svg viewBox="0 0 2 2"><rect width="2" height="2"/></svg>', {
      columns: 2,
    }),
  ).toEqual({ rows: ['11', '11'] });
});

test('samples cell centers rather than any geometry overlapping the cell', async () => {
  expect(
    await iconToDotGrid(svg('<rect x="1.3" y="1.3" width=".4" height=".4"/>'), { columns: 4 }),
  ).toEqual({ rows: ['0000', '0100', '0000', '0000'] });
  expect(
    await iconToDotGrid(svg('<rect x="1.05" y="1.05" width=".2" height=".2"/>'), { columns: 4 }),
  ).toEqual({ rows: ['0000', '0000', '0000', '0000'] });
});

test('lets the browser render paths, shapes, strokes, and transforms together', async () => {
  const source = svg(
    '<rect width="1" height="1"/>' +
      '<circle cx="2.5" cy=".5" r=".4"/>' +
      '<ellipse cx="3.5" cy="1.5" rx=".4" ry=".3"/>' +
      '<g transform="translate(0 2)"><path d="M0 0h1v1H0z"/></g>' +
      '<line x1="2.1" y1="2.5" x2="2.9" y2="2.5" stroke="black" stroke-width=".6"/>' +
      '<polygon points="1,3 2,3 2,4 1,4"/>',
  );
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({
    rows: ['1010', '0001', '1010', '0100'],
  });
});

test('honors inherited fill rules and internal openings', async () => {
  const source = svg('<g fill-rule="evenodd"><path d="M0 0h4v4H0z M1 1h2v2H1z"/></g>');
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({
    rows: ['1111', '1001', '1001', '1111'],
  });
});

test('supports local definitions, clipping, and gradients', async () => {
  const source = svg(
    '<defs>' +
      '<rect id="shape" width="4" height="4"/>' +
      '<clipPath id="clip"><rect x="1" y="1" width="2" height="2"/></clipPath>' +
      '<linearGradient id="ink"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient>' +
      '</defs><use href="#shape" clip-path="url(#clip)" fill="url(#ink)"/>',
  );
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({
    rows: ['0000', '0110', '0110', '0000'],
  });
});

test('preserves source origins, whitespace, and equivalent geometry at different native sizes', async () => {
  const small = await iconToDotGrid(
    svg('<rect x="12" y="22" width="4" height="4"/>', '10 20 8 8'),
    { columns: 4 },
  );
  const large = await iconToDotGrid(
    svg('<rect x="20" y="20" width="40" height="40"/>', '0 0 80 80'),
    { columns: 4 },
  );
  expect(small).toEqual({ rows: ['0000', '0110', '0110', '0000'] });
  expect(large).toEqual(small);
});

test('infers rows from aspect ratio and fits the source when both dimensions are supplied', async () => {
  const source = svg('<rect width="4" height="2"/>', '0 0 4 2');
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({ rows: ['1111', '1111'] });
  expect(await iconToDotGrid(source, { columns: 4, rows: 4 })).toEqual({
    rows: ['0000', '1111', '1111', '0000'],
  });
});

test('accepts fractional viewBoxes and numeric dimensions without a viewBox', async () => {
  expect(
    await iconToDotGrid(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8px" height="4"><rect width="4" height="4"/></svg>',
      { columns: 4 },
    ),
  ).toEqual({ rows: ['1100', '1100'] });
  expect(
    await iconToDotGrid(svg('<rect width="2.5" height="1.25"/>', '0 0 2.5 1.25'), { columns: 4 }),
  ).toEqual({ rows: ['1111', '1111'] });
});

test('accepts SVG elements without mutating their dimensions, paint, or markup', async () => {
  const source = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  source.setAttribute('viewBox', '0 0 4 4');
  source.innerHTML = '<rect x="1" y="1" width="2" height="2" fill="currentColor"/>';
  const before = source.outerHTML;
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({
    rows: ['0000', '0110', '0110', '0000'],
  });
  expect(source.outerHTML).toBe(before);
});

test('uses the sampling viewport rather than the source root CSS dimensions', async () => {
  const source =
    '<svg viewBox="0 0 4 4" style="width: 1px; height: 4px"><rect width="4" height="4"/></svg>';
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({
    rows: ['1111', '1111', '1111', '1111'],
  });
});

test('renders real Fluent Filled and Regular components through React', async () => {
  const filled = await iconToDotGrid(Heart24Filled);
  const element = await iconToDotGrid(<Heart24Filled />);
  const regular = await iconToDotGrid(Heart24Regular);
  const occupied = (rows: readonly string[]) => rows.join('').replace(/0/g, '').length;
  expect(filled).toEqual(element);
  expect(filled.rows).toHaveLength(24);
  expect(filled.rows.every((row) => row.length === 24)).toBe(true);
  expect(occupied(regular.rows)).toBeGreaterThan(0);
  expect(occupied(filled.rows)).toBeGreaterThan(occupied(regular.rows));
});

test.each([
  { icon: Heart16Filled, nativeSize: 16, name: 'Heart16Filled' },
  { icon: Heart16Regular, nativeSize: 16, name: 'Heart16Regular' },
  { icon: Heart24Filled, nativeSize: 24, name: 'Heart24Filled' },
  { icon: Heart24Regular, nativeSize: 24, name: 'Heart24Regular' },
])('supports native-size sampling multiples for $name', async ({ icon, nativeSize }) => {
  for (const multiplier of [1, 2, 3]) {
    const columns = nativeSize * multiplier;
    const data = await iconToDotGrid(icon, { columns });
    expect(data.rows).toHaveLength(columns);
    expect(data.rows.every((row) => row.length === columns)).toBe(true);
    expect(data.rows.some((row) => row.includes('1'))).toBe(true);
  }
});

test('keeps native-size multiples as guidance rather than a restriction', async () => {
  const data = await iconToDotGrid(Heart16Regular, { columns: 23 });
  expect(data.rows).toHaveLength(23);
  expect(data.rows.every((row) => row.length === 23)).toBe(true);
  expect(data.rows.some((row) => row.includes('1'))).toBe(true);
});

test('supports React SVG elements and static inline paint styles', async () => {
  const source = (
    <svg viewBox="0 0 4 4">
      <g style={{ transform: 'translate(1px, 1px)', fill: 'navy' }}>
        <rect width="2" height="2" />
      </g>
    </svg>
  );
  expect(await iconToDotGrid(source, { columns: 4 })).toEqual({
    rows: ['0000', '0110', '0110', '0000'],
  });
});

test('uses an explicit alpha threshold and retains fully transparent cells', async () => {
  const source = svg('<rect width="4" height="4" opacity=".3"/>');
  expect(await iconToDotGrid(source, { columns: 2 })).toEqual({ rows: ['00', '00'] });
  expect(await iconToDotGrid(source, { columns: 2, alphaThreshold: 64 })).toEqual({
    rows: ['11', '11'],
  });
  expect(await iconToDotGrid(svg(''), { columns: 2 })).toEqual({ rows: ['00', '00'] });
});

test('can sample exported circles back into the same occupancy', async () => {
  const data = { rows: ['00000', '00100', '01110', '00100', '00000'] };
  expect(await iconToDotGrid(dotGridToSvg(data), { columns: 5 })).toEqual(data);
});

test.each([
  { columns: 0 },
  { columns: -1 },
  { columns: 2.5 },
  { columns: 257 },
  { rows: 0 },
  { rows: 257 },
  { rows: NaN },
  { columns: Infinity },
  { alphaThreshold: 0 },
  { alphaThreshold: 256 },
  { alphaThreshold: 1.5 },
])('rejects invalid sampling options %j before allocating a canvas', async (options) => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  await expect(iconToDotGrid(svg(''), options)).rejects.toThrow(/must be a whole number/);
  expect(getContext).not.toHaveBeenCalled();
});

test.each([
  '<svg>',
  '<div/>',
  '<svg viewBox="0 0 0 4"/>',
  '<svg viewBox="0 0 -4 4"/>',
  '<svg viewBox="0 0 NaN 4"/>',
  '<svg viewBox="0 0 4 4 4"/>',
  '<svg width="100%" height="100%"/>',
  '<svg/>',
])('rejects malformed or dimensionless sources: %s', async (source) => {
  await expect(iconToDotGrid(source)).rejects.toThrow(/well-formed SVG|positive viewBox/);
});

test.each([
  '<script/>',
  '<rect width="4" height="4" onload="alert(1)"/>',
  '<image href="https://example.com/image.png"/>',
  '<foreignObject/>',
  '<style>rect { fill: red }</style>',
  '<animate attributeName="opacity"/>',
  '<text>Requires a font</text>',
  '<use href="https://example.com/art.svg#shape"/>',
  '<rect fill="url(https://example.com/paint.svg#ink)"/>',
  '<rect style="fill: var(--app-color)"/>',
  '<rect style="animation: pulse 1s infinite"/>',
  '<rect style="background-image: url(https://example.com/image.png)"/>',
  '<rect xml:base="https://example.com"/>',
  '<rect xmlns="https://example.com"/>',
])('rejects unsupported or externally dependent SVG: %s', async (content) => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  await expect(iconToDotGrid(svg(content))).rejects.toThrow(/unsupported|static|references/);
  expect(getContext).not.toHaveBeenCalled();
});

test('rejects excessive source complexity and document types', async () => {
  await expect(iconToDotGrid(svg('<g/>'.repeat(10000)))).rejects.toThrow(/10000 elements/);
  await expect(iconToDotGrid(svg(' '.repeat(1024 * 1024)))).rejects.toThrow(/1 MiB/);
  await expect(iconToDotGrid('<!DOCTYPE svg>' + svg(''))).rejects.toThrow(/document types/);
});

test('releases temporary image URLs after successful decoding', async () => {
  const create = vi.spyOn(URL, 'createObjectURL');
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  await iconToDotGrid(svg('<rect width="4" height="4"/>'));
  expect(create).toHaveBeenCalledTimes(1);
  expect(revoke).toHaveBeenCalledWith(create.mock.results[0].value);
});

test('propagates decoding errors and still releases the temporary image URL', async () => {
  const create = vi.spyOn(URL, 'createObjectURL');
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockRejectedValueOnce(new Error('Decode failed'));
  await expect(iconToDotGrid(svg(''))).rejects.toThrow('Decode failed');
  expect(revoke).toHaveBeenCalledWith(create.mock.results[0].value);
});

test('fails explicitly when canvas rendering is unavailable', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  await expect(iconToDotGrid(svg(''))).rejects.toThrow(/2D canvas context is unavailable/);
});
