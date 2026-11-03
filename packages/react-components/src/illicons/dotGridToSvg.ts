// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  getDotGridCircles,
  getDotGridLayout,
  type DotGridData,
  type DotGridRenderOptions,
} from './dotGridGeometry.js';

/** Export standalone, circle-based SVG with explicit ink for Figma and other tools. */
export function dotGridToSvg(data: DotGridData, options: DotGridRenderOptions = {}): string {
  const { width, height, radius, pitch } = getDotGridLayout(data, options);
  const circles = Array.from(
    getDotGridCircles(data, pitch, radius),
    ({ cx, cy }) => `<circle cx="${cx}" cy="${cy}" r="${radius}"/>`,
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="#242424">${circles}</svg>`;
}
