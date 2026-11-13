// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FluentIcon } from '@fluentui/react-icons';
import type { DotGridData } from './dotGridGeometry.js';

export type IconToDotGridSource =
  string | SVGSVGElement | React.ReactElement<React.SVGProps<SVGSVGElement>> | FluentIcon;

export interface IconToDotGridOptions {
  /** Grid width in cells, from 1 to 256. Defaults to 24. Prefer native-size multiples for Fluent icons. */
  columns?: number;
  /** Grid height in cells, from 1 to 256. Defaults to the source aspect ratio, rounded. */
  rows?: number;
  /** Minimum sampled alpha, from 1 to 255. Defaults to 128 (approximately 50% opacity). */
  alphaThreshold?: number;
}

const svgNamespace = 'http://www.w3.org/2000/svg';
// An odd raster scale puts the sampled pixel exactly at each cell's center.
const pixelsPerCell = 5;
const supportedElements = new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'defs',
  'symbol',
  'use',
  'clipPath',
  'mask',
  'linearGradient',
  'radialGradient',
  'stop',
  'title',
  'desc',
]);
const supportedStyles = new Set([
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'color',
  'transform',
  'transform-origin',
  'transform-box',
  'clip-path',
  'clip-rule',
  'mask',
  'mask-image',
  'mask-mode',
  'mask-repeat',
  'mask-position',
  'mask-position-x',
  'mask-position-y',
  // Chromium exposes these aliases when CSSOM expands the mask shorthand.
  '-webkit-mask-position-x',
  '-webkit-mask-position-y',
  'mask-size',
  'mask-origin',
  'mask-clip',
  'mask-composite',
  'display',
  'visibility',
  'stop-color',
  'stop-opacity',
  'vector-effect',
  'paint-order',
  'width',
  'height',
]);

function validateSvg(svg: Element, document: Document) {
  const elements = [svg, ...svg.querySelectorAll('*')];
  if (
    document.doctype ||
    document.createTreeWalker(document, NodeFilter.SHOW_PROCESSING_INSTRUCTION).nextNode()
  ) {
    throw new Error('iconToDotGrid: document types and processing instructions are unsupported.');
  }
  if (elements.length > 10000) {
    throw new Error('iconToDotGrid: SVG exceeds 10000 elements.');
  }
  const ids = new Set(elements.map((element) => element.getAttribute('id')).filter(Boolean));
  const checkReference = (value: string) => {
    if (!value.startsWith('#') || !ids.has(value.slice(1))) {
      throw new Error('iconToDotGrid: references must resolve to an element within the SVG.');
    }
  };
  for (const element of elements) {
    if (
      !supportedElements.has(element.localName) ||
      (element.namespaceURI !== null && element.namespaceURI !== svgNamespace)
    ) {
      throw new Error(`iconToDotGrid: unsupported SVG element <${element.localName}>.`);
    }
    for (const attribute of element.attributes) {
      const { name, value } = attribute;
      if (
        /^on/i.test(name) ||
        (attribute.namespaceURI !== null &&
          !['http://www.w3.org/2000/xmlns/', 'http://www.w3.org/1999/xlink'].includes(
            attribute.namespaceURI,
          )) ||
        /\\|\/\*|var\s*\(/i.test(value)
      ) {
        throw new Error(`iconToDotGrid: unsupported SVG attribute ${name}.`);
      }
      if (attribute.localName === 'href') checkReference(value);
      for (const match of value.matchAll(/url\s*\(\s*([^)]*?)\s*\)/gi)) {
        checkReference(match[1].replace(/^(['"])(.*)\1$/, '$2'));
      }
      if (name === 'style') {
        const style = window.document.createElementNS(svgNamespace, 'svg').style;
        style.cssText = value;
        if (
          value.includes('@') ||
          Array.from(style).some((property) => !supportedStyles.has(property))
        ) {
          throw new Error(
            'iconToDotGrid: only static, inline SVG paint and geometry styles are supported.',
          );
        }
      }
    }
  }
}

function readViewBox(svg: Element): number[] {
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox !== null) {
    const values = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0) {
      return values;
    }
  } else {
    const dimension = (name: string) => {
      const value = svg.getAttribute(name)?.trim() ?? '';
      return /^(?:\d+(?:\.\d*)?|\.\d+)(?:px)?$/.test(value)
        ? Number(value.replace(/px$/, ''))
        : NaN;
    };
    const width = dimension('width');
    const height = dimension('height');
    if (width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)) {
      return [0, 0, width, height];
    }
  }
  throw new Error(
    'iconToDotGrid: SVG requires a finite, positive viewBox or numeric width and height.',
  );
}

function validateInteger(value: number, name: string, maximum: number) {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`iconToDotGrid: ${name} must be a whole number from 1 to ${maximum}.`);
  }
}

/**
 * Browser-only conversion of standalone, static SVG artwork into occupancy.
 * The browser renders shapes, strokes, transforms, and local SVG references.
 * Each cell samples its center, not the average coverage of the whole cell.
 * Empty rows and columns are never trimmed. No radius or pitch is stored.
 */
export async function iconToDotGrid(
  source: IconToDotGridSource,
  { columns = 24, rows, alphaThreshold = 128 }: IconToDotGridOptions = {},
): Promise<DotGridData> {
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') {
    throw new Error(
      'iconToDotGrid: conversion requires a browser; use saved grid data during SSR.',
    );
  }
  validateInteger(columns, 'columns', 256);
  validateInteger(alphaThreshold, 'alphaThreshold', 255);
  const markup =
    typeof source === 'string'
      ? source
      : source instanceof SVGSVGElement
        ? new XMLSerializer().serializeToString(source)
        : renderToStaticMarkup(React.isValidElement(source) ? source : React.createElement(source));
  if (new TextEncoder().encode(markup).byteLength > 1024 * 1024) {
    throw new Error('iconToDotGrid: SVG exceeds 1 MiB of text.');
  }
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = parsed.documentElement;
  if (parsed.querySelector('parsererror') || svg.localName !== 'svg') {
    throw new Error('iconToDotGrid: source must be a well-formed SVG document.');
  }
  validateSvg(svg, parsed);
  const viewBox = readViewBox(svg);
  const rowCount = rows ?? Math.max(1, Math.round((columns * viewBox[3]) / viewBox[2]));
  validateInteger(rowCount, 'rows', 256);

  const canvas = document.createElement('canvas');
  canvas.width = columns * pixelsPerCell;
  canvas.height = rowCount * pixelsPerCell;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('iconToDotGrid: 2D canvas context is unavailable.');

  svg.setAttribute('xmlns', svgNamespace);
  svg.setAttribute('viewBox', viewBox.join(' '));
  svg.setAttribute('width', String(canvas.width));
  svg.setAttribute('height', String(canvas.height));
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const center = Math.floor(pixelsPerCell / 2);
    return {
      rows: Array.from({ length: rowCount }, (_, row) =>
        Array.from({ length: columns }, (_, column) => {
          const x = column * pixelsPerCell + center;
          const y = row * pixelsPerCell + center;
          return data[(y * canvas.width + x) * 4 + 3] >= alphaThreshold ? '1' : '0';
        }).join(''),
      ),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
