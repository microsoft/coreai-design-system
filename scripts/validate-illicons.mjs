// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SaxesParser } from 'saxes';

const svgNamespace = 'http://www.w3.org/2000/svg';
const shapeAttributes = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
};
const attributes = {
  ...shapeAttributes,
  svg: ['width', 'height', 'viewBox', 'version', 'xmlns', 'xmlns:xlink'],
  g: [],
  defs: [],
  use: ['href', 'xlink:href', 'x', 'y', 'width', 'height'],
  title: [],
  desc: [],
};
const commonAttributes = [
  'id',
  'role',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'fill',
  'fill-rule',
  'clip-rule',
  'fill-opacity',
  'opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'transform',
];
const paint = /^(?:none|currentColor|black|white|#[0-9a-f]{3,8})$/i;
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonempty = (value) => typeof value === 'string' && value.trim() === value && value.length > 0;

export function validateSvg(source) {
  if (Buffer.byteLength(source) > 1024 * 1024) throw new Error('SVG exceeds 1 MiB');
  const parser = new SaxesParser({ xmlns: true });
  const ids = new Map();
  const references = [];
  let elements = 0;
  let geometry = 0;
  let depth = 0;
  let textElement;
  const reject = (message) => {
    throw new Error(message);
  };
  parser.on('doctype', () => reject('DOCTYPE is not allowed'));
  parser.on('processinginstruction', () => reject('Processing instructions are not allowed'));
  parser.on('cdata', () => reject('CDATA is not allowed'));
  parser.on('opentag', (node) => {
    if (++elements > 20000) reject('SVG exceeds 20000 elements');
    const name = node.name;
    if (node.uri !== svgNamespace || !Object.hasOwn(attributes, name)) {
      reject(`Unsupported SVG element: ${name}`);
    }
    if (textElement) reject('title and desc must contain text only');
    if (depth === 0) {
      if (name !== 'svg') reject('Root must be svg');
      const value = (key) => node.attributes[key]?.value;
      if (
        value('viewBox')
          ?.trim()
          .split(/[\s,]+/)
          .join(' ') !== '0 0 140 140' ||
        value('width') !== '140' ||
        value('height') !== '140'
      ) {
        reject('SVG requires width="140", height="140", viewBox="0 0 140 140"');
      }
    } else if (name === 'svg') {
      reject('Nested svg elements are not supported');
    }
    for (const [key, attribute] of Object.entries(node.attributes)) {
      const value = attribute.value;
      if (![...attributes[name], ...commonAttributes].includes(key)) {
        reject(`Unsupported SVG attribute: ${key}`);
      }
      if (key === 'xmlns' && value !== svgNamespace) reject('Unexpected SVG namespace');
      if (key === 'xmlns:xlink' && value !== 'http://www.w3.org/1999/xlink') {
        reject('Unexpected xlink namespace');
      }
      if ((key === 'fill' || key === 'stroke') && !paint.test(value)) {
        reject('Only static monochrome paints are supported');
      }
      if (key === 'id') {
        if (!/^[a-zA-Z_][\w.-]*$/.test(value) || ids.has(value))
          reject('Invalid or duplicate SVG id');
        ids.set(value, name);
      }
      if (key === 'href' || key === 'xlink:href') {
        if (!/^#[a-zA-Z_][\w.-]*$/.test(value)) reject('Only local shape references are allowed');
        references.push(value.slice(1));
      }
    }
    if (name === 'title' || name === 'desc') textElement = name;
    if (Object.hasOwn(shapeAttributes, name)) geometry++;
    depth++;
  });
  parser.on('closetag', () => {
    depth--;
    textElement = undefined;
  });
  parser.on('text', (text) => {
    if (text.trim() && !textElement) reject('Text is only supported inside title or desc');
  });
  parser.write(source).close();
  if (!geometry) reject('SVG must contain geometry');
  for (const reference of references) {
    if (!Object.hasOwn(shapeAttributes, ids.get(reference))) {
      reject(`Reference must resolve to a static shape: ${reference}`);
    }
  }
}

export function validateCatalog(directory) {
  const manifest = JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.icons)) {
    throw new Error('Catalog requires version 1 and an icons array');
  }
  const titles = new Set();
  const files = new Set();
  for (const icon of manifest.icons) {
    if (
      !icon ||
      !nonempty(icon.file) ||
      !icon.file.endsWith('.svg') ||
      !slug.test(icon.file.slice(0, -4)) ||
      files.has(icon.file)
    ) {
      throw new Error('Invalid or duplicate SVG filename; use lowercase kebab-case.svg');
    }
    if (!nonempty(icon.title) || titles.has(icon.title.toLowerCase())) {
      throw new Error(`${icon.file}: invalid or duplicate title`);
    }
    if (
      !Array.isArray(icon.tags) ||
      icon.tags.some((tag) => !nonempty(tag) || tag !== tag.toLowerCase()) ||
      new Set(icon.tags).size !== icon.tags.length
    ) {
      throw new Error(`${icon.file}: use unique, nonempty lowercase tags`);
    }
    if (!nonempty(icon.author)) {
      throw new Error(`${icon.file}: author is required`);
    }
    const filename = path.join(directory, icon.file);
    if (!lstatSync(filename).isFile()) throw new Error(`${icon.file}: expected a regular SVG file`);
    try {
      validateSvg(readFileSync(filename, 'utf8'));
    } catch (error) {
      throw new Error(`${icon.file}: ${error.message}`, { cause: error });
    }
    titles.add(icon.title.toLowerCase());
    files.add(icon.file);
  }
  for (const filename of readdirSync(directory)) {
    if (/\.svg$/i.test(filename) && !files.has(filename)) {
      throw new Error(`Unlisted SVG: ${filename}`);
    }
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = validateCatalog(
    fileURLToPath(new URL('../packages/react-components/illicons/', import.meta.url)),
  );
  console.log(`Validated ${manifest.icons.length} illicons`);
}
