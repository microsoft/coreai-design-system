// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { normalizeHex } from '../utils/BrandRamp.mjs';
import { createCustomBrand, DEFAULT_CUSTOM_COLOR } from './custom-brand.mjs';

const root = globalThis.document.documentElement;
root.dataset.referenceEnhanced = 'true';
globalThis.window.addEventListener(
  'error',
  (event) => {
    if (!globalThis.document.getElementById('reference-content')) return;
    if (
      event instanceof globalThis.ErrorEvent ||
      event.target instanceof globalThis.HTMLScriptElement
    )
      delete root.dataset.referenceEnhanced;
  },
  true,
);

let stored;
let brand;
let color;
try {
  stored = globalThis.localStorage.getItem('coreai-docsite-theme');
  brand = globalThis.localStorage.getItem('coreai-docsite-brand');
  color = globalThis.localStorage.getItem('coreai-docsite-custom-color');
} catch (error) {
  globalThis.console.warn('Could not read the saved theme; using the default theme.', error);
}

root.dataset.brand = ['coreai', 'azure', 'custom'].includes(brand) ? brand : 'coreai';
root.dataset.theme =
  stored === 'light' || stored === 'dark'
    ? stored
    : globalThis.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';

if (root.dataset.brand === 'custom') {
  const { light, dark } = createCustomBrand(normalizeHex(color) ?? DEFAULT_CUSTOM_COLOR);
  const declarations = (theme) =>
    Object.entries(theme)
      .map(([token, value]) => `--${token}:${value}`)
      .join(';');
  const style = globalThis.document.createElement('style');
  style.id = 'reference-custom-theme';
  style.textContent = `:root[data-brand="custom"]{${declarations(light)}}:root[data-brand="custom"][data-theme="dark"]{${declarations(dark)}}`;
  globalThis.document.head.append(style);
}
