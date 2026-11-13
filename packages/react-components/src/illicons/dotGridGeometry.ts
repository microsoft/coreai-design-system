// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Occupancy only: equal-length, nonempty rows of 0s and 1s, including empty borders. */
export interface DotGridData {
  readonly rows: readonly string[];
}

/** CSS pixels when rendered by Illicon. These settings never change occupancy. */
export interface DotGridRenderOptions {
  /** Circle radius. Defaults to 1; must fit within half the pitch. */
  radius?: number;
  /** Center-to-center distance between cells. Defaults to 5. */
  pitch?: number;
}

export function getDotGridLayout(
  data: DotGridData,
  { radius = 1, pitch = 5 }: DotGridRenderOptions = {},
) {
  if (
    !data ||
    !Array.isArray(data.rows) ||
    data.rows.length === 0 ||
    typeof data.rows[0] !== 'string' ||
    data.rows[0].length === 0 ||
    data.rows.some(
      (row) => typeof row !== 'string' || /[^01]/.test(row) || row.length !== data.rows[0].length,
    )
  ) {
    throw new Error('Illicon: grid rows must be nonempty, equal-length strings of 0s and 1s.');
  }
  if (!Number.isFinite(pitch) || pitch <= 0) {
    throw new Error('Illicon: pitch must be positive and finite.');
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > pitch / 2) {
    throw new Error(
      'Illicon: radius must be positive, finite, and no greater than half the pitch.',
    );
  }
  const width = data.rows[0].length * pitch;
  const height = data.rows.length * pitch;
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('Illicon: grid dimensions must be finite.');
  }
  return { width, height, radius, pitch };
}

export function* getDotGridCircles(data: DotGridData, pitch: number, radius: number) {
  const diameter = radius * 2;
  // Snap whole-pixel bounds, leaving any spare pixel at the trailing edge.
  const offset =
    Number.isInteger(pitch) && Number.isInteger(diameter)
      ? Math.floor((pitch - diameter) / 2) + radius
      : pitch / 2;
  for (const [row, cells] of data.rows.entries()) {
    for (let column = 0; column < cells.length; column++) {
      if (cells[column] === '1') {
        yield { cx: column * pitch + offset, cy: row * pitch + offset };
      }
    }
  }
}
