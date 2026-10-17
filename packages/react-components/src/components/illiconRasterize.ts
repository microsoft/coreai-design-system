// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Private rasterization helpers backing `Illicon` — not exported from the
 * package root.
 *
 * Samples the original vector paths at the requested output size using a
 * fixed 5px grid. Results are cached per icon and size; generated dots use
 * CSS-pixel coordinates rather than a scaled source viewBox.
 */

// A 4× raster narrows each sampled pixel's footprint around the dot center, more closely
// approximating point containment. Testing showed that 1× adds unwanted dots around edges
// and internal openings.
const CENTER_SAMPLE_SCALE = 4;
const DOT_DIAMETER = 2;
const DOT_GAP = 3;
const DOT_PITCH = DOT_DIAMETER + DOT_GAP;

/** Use fixed-size dots and spacing at every output size. */
export function getDotSettings(size: number): { pitch: number; diameter: number } {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Illicon: size ${size} must be a positive, finite whole number.`);
  }
  return { pitch: DOT_PITCH, diameter: DOT_DIAMETER };
}

export interface RasterizedIcon {
  /** Rendered dimensions in CSS pixels. */
  width: number;
  height: number;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  diameter: number;
  /** Row-major occupancy sampled at each grid cell's dot center. */
  occupied: Uint8Array;
}

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const rasterCache = new WeakMap<object, Map<number, RasterizedIcon>>();

/** Read a previously sampled icon, if any, without sampling it. */
export function peekRasterizedIcon(key: object, size: number): RasterizedIcon | undefined {
  return rasterCache.get(key)?.get(size);
}

function create2dContext(width: number, height: number): Context2D | null {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d', { willReadFrequently: true });
}

function isOpaqueSvgColor(value: string): boolean {
  return (
    /^(?:#[\da-f]{3}(?:[\da-f]{3})?|[a-z]+)$/.test(value) &&
    !['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert'].includes(value) &&
    CSS.supports('color', value)
  );
}

function validateSvgPaths(svg: SVGSVGElement): void {
  let usablePaths = 0;
  for (const element of [svg, ...svg.querySelectorAll('*')]) {
    if (
      !(element instanceof SVGElement) ||
      (element !== svg && !['g', 'path', 'title', 'desc'].includes(element.localName))
    ) {
      throw new Error(`Illicon: unsupported SVG element <${element.localName}>; use filled paths.`);
    }
    if (element.localName === 'title' || element.localName === 'desc') continue;
    if (element !== svg && !['svg', 'g'].includes(element.parentElement?.localName ?? '')) {
      throw new Error('Illicon: SVG paths and groups must be children of the root or a group.');
    }

    for (const feature of [
      'transform',
      'translate',
      'rotate',
      'scale',
      'mask',
      'clip-path',
      'filter',
      'animation-name',
    ]) {
      const value = element.style.getPropertyValue(feature) || element.getAttribute(feature);
      if (value && value.trim().toLowerCase() !== 'none') {
        throw new Error(`Illicon: SVG ${feature} is unsupported; flatten the filled paths.`);
      }
    }
    for (const feature of ['opacity', 'fill-opacity']) {
      const value = element.style.getPropertyValue(feature) || element.getAttribute(feature);
      if (value !== null && !/^(?:1(?:\.0+)?|100(?:\.0+)?%)$/.test(value.trim())) {
        throw new Error(`Illicon: SVG ${feature} must be opaque (1 or 100%); omit it otherwise.`);
      }
    }
    for (const feature of ['display', 'visibility']) {
      const value = (
        element.style.getPropertyValue(feature) || element.getAttribute(feature)
      )?.trim();
      if (
        (feature === 'display' && value === 'none') ||
        (feature === 'visibility' && (value === 'hidden' || value === 'collapse'))
      ) {
        throw new Error(
          `Illicon: SVG ${feature} is unsupported; use visible, opaque filled paths.`,
        );
      }
    }
    const fillRule = element.getAttribute('fill-rule');
    if (
      element.style.fillRule ||
      (fillRule && (element.localName === 'g' || !['nonzero', 'evenodd'].includes(fillRule)))
    ) {
      throw new Error(
        'Illicon: fill-rule must be a nonzero or evenodd attribute on the root or path.',
      );
    }
    if (element.style.getPropertyValue('d')) {
      throw new Error('Illicon: CSS path data is unsupported; use the path d attribute.');
    }
    if (element.localName !== 'path') continue;

    let fill: string | undefined;
    let stroke: string | undefined;
    let color: string | undefined;
    // Resolve only explicit SVG/inline paint; external CSS is outside the input contract.
    for (let ancestor: SVGElement | null = element; ancestor;) {
      const ownFill = (ancestor.style.fill || ancestor.getAttribute('fill'))?.trim().toLowerCase();
      const ownStroke = (ancestor.style.stroke || ancestor.getAttribute('stroke'))
        ?.trim()
        .toLowerCase();
      const ownColor = (ancestor.style.color || ancestor.getAttribute('color'))
        ?.trim()
        .toLowerCase();
      if (ownFill && ownFill !== 'inherit') fill ??= ownFill;
      if (ownStroke && ownStroke !== 'inherit') stroke ??= ownStroke;
      if (ownColor && ownColor !== 'inherit' && ownColor !== 'currentcolor') color ??= ownColor;
      if (ancestor === svg) break;
      const parent: Element | null = ancestor.parentElement;
      ancestor = parent instanceof SVGElement ? parent : null;
    }
    if (fill === 'none' || (stroke && stroke !== 'none')) {
      throw new Error(
        'Illicon: unfilled paths and SVG strokes are unsupported; use filled paths without strokes.',
      );
    }
    if (fill && fill !== 'currentcolor' && !isOpaqueSvgColor(fill)) {
      throw new Error(
        'Illicon: unsupported SVG fill or paint references; use currentColor, an opaque named color, or 3-/6-digit hex.',
      );
    }
    if (fill === 'currentcolor' && color && !isOpaqueSvgColor(color)) {
      throw new Error(
        'Illicon: currentColor requires an opaque named color or 3-/6-digit hex within the source SVG.',
      );
    }
    if (element.getAttribute('d')?.trim()) usablePaths++;
  }
  if (!usablePaths) {
    throw new Error('Illicon: the source SVG must contain usable filled path data.');
  }
}

function fillSvgPaths(ctx: Context2D, svg: SVGSVGElement): void {
  const rootFillRule = (svg.getAttribute('fill-rule') as CanvasFillRule | null) ?? 'nonzero';
  svg.querySelectorAll('path').forEach((path) => {
    const d = path.getAttribute('d');
    if (!d) return;
    const fillRule = (path.getAttribute('fill-rule') as CanvasFillRule | null) ?? rootFillRule;
    ctx.fill(new Path2D(d), fillRule);
  });
}

/**
 * Rasterize the source vector paths directly onto the output-size dot grid.
 * Repeated requests for the same icon and size reuse the sampled occupancy.
 *
 * @throws if the source SVG's viewBox is missing, non-positive, or not a
 * whole-pixel size, or if a 2D canvas context is unavailable.
 */
export function rasterizeIcon(key: object, svg: SVGSVGElement, size: number): RasterizedIcon {
  const { pitch, diameter } = getDotSettings(size);
  const cached = peekRasterizedIcon(key, size);
  if (cached) return cached;

  validateSvgPaths(svg);

  const viewBox = svg.viewBox.baseVal;
  const sourceWidth =
    viewBox && viewBox.width > 0 ? viewBox.width : Number(svg.getAttribute('width'));
  const sourceHeight =
    viewBox && viewBox.height > 0 ? viewBox.height : Number(svg.getAttribute('height'));
  const originX = viewBox?.x ?? 0;
  const originY = viewBox?.y ?? 0;

  if (
    !Number.isInteger(sourceWidth) ||
    !Number.isInteger(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new Error('Illicon: the source SVG must have a positive, whole-pixel viewBox.');
  }

  const scale = size / sourceWidth;
  const width = size;
  const height = sourceHeight * scale;
  const cellWidth = Math.min(pitch, width);
  const cellHeight = Math.min(pitch, height);
  const columns = Math.max(1, Math.floor(width / cellWidth));
  const rows = Math.max(1, Math.floor(height / cellHeight));
  const offsetX = (width - columns * cellWidth) / 2;
  const offsetY = (height - rows * cellHeight) / 2;
  const rasterWidth = columns * CENTER_SAMPLE_SCALE;
  const rasterHeight = rows * CENTER_SAMPLE_SCALE;
  const ctx = create2dContext(rasterWidth, rasterHeight);
  if (!ctx) throw new Error('Illicon: 2D canvas context is unavailable.');

  const transformA = (scale * CENTER_SAMPLE_SCALE) / cellWidth;
  const transformD = (scale * CENTER_SAMPLE_SCALE) / cellHeight;
  const transformE = -((originX * scale + offsetX) * CENTER_SAMPLE_SCALE) / cellWidth + 0.5;
  const transformF = -((originY * scale + offsetY) * CENTER_SAMPLE_SCALE) / cellHeight + 0.5;
  ctx.setTransform(transformA, 0, 0, transformD, transformE, transformF);
  fillSvgPaths(ctx, svg);

  const { data } = ctx.getImageData(0, 0, rasterWidth, rasterHeight);
  const occupied = new Uint8Array(columns * rows);
  const centerPixelOffset = Math.floor(CENTER_SAMPLE_SCALE / 2);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const rasterX = x * CENTER_SAMPLE_SCALE + centerPixelOffset;
      const rasterY = y * CENTER_SAMPLE_SCALE + centerPixelOffset;
      occupied[y * columns + x] = data[(rasterY * rasterWidth + rasterX) * 4 + 3] > 0 ? 1 : 0;
    }
  }

  const rasterized: RasterizedIcon = {
    width,
    height,
    columns,
    rows,
    cellWidth,
    cellHeight,
    offsetX,
    offsetY,
    diameter,
    occupied,
  };
  const sizes = rasterCache.get(key) ?? new Map<number, RasterizedIcon>();
  sizes.set(size, rasterized);
  rasterCache.set(key, sizes);
  return rasterized;
}

const round = (n: number) => +n.toFixed(4);

/** Build one SVG path containing a centred, spaced dot for every occupied grid cell. */
export function buildDottedPath({
  width,
  height,
  columns,
  rows,
  cellWidth,
  cellHeight,
  offsetX,
  offsetY,
  diameter,
  occupied,
}: RasterizedIcon): string {
  const radius = round(diameter / 2);
  let d = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (!occupied[y * columns + x]) continue;
      const centerX = offsetX + (x + 0.5) * cellWidth;
      const centerY = offsetY + (y + 0.5) * cellHeight;
      if (
        centerX - radius < 0 ||
        centerX + radius > width ||
        centerY - radius < 0 ||
        centerY + radius > height
      ) {
        continue;
      }
      // Quarter arcs avoid browser radius correction at a semicircle's 180-degree boundary.
      d += `M${round(centerX - radius)} ${round(centerY)}a${radius} ${radius} 0 0 1 ${radius} -${radius}a${radius} ${radius} 0 0 1 ${radius} ${radius}a${radius} ${radius} 0 0 1 -${radius} ${radius}a${radius} ${radius} 0 0 1 -${radius} -${radius}z`;
    }
  }
  return d;
}
