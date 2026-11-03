// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import type { SwatchPickerImplementation } from './SwatchPickerComparison.js';

const pickerProperties = [
  'display',
  'flex-direction',
  'row-gap',
  'column-gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const;
const swatchProperties = [
  'display',
  'box-sizing',
  'flex-shrink',
  'align-items',
  'justify-content',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'background-image',
  'background-size',
  'background-repeat',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'box-shadow',
  'overflow',
  'font-size',
  'line-height',
  'color',
  'cursor',
  'outline-style',
  'outline-width',
  'outline-color',
] as const;
const iconProperties = [
  'display',
  'position',
  'align-self',
  'font-size',
  'color',
  'filter',
] as const;

export interface SwatchPickerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'consumer-priority';
}

export function requireSwatchPickerHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML SwatchPicker fixture');
  return element;
}

export function getComparisonSwatchPicker(
  container: ParentNode,
  implementation: SwatchPickerImplementation,
): HTMLElement {
  const element = container.querySelector(`[data-swatch-implementation="${implementation}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing ${implementation} SwatchPicker`);
  return element;
}

export function getFixtureSwatch(picker: ParentNode, part: string): HTMLButtonElement {
  const element = picker.querySelector(`[data-swatch-part="${part}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Missing SwatchPicker ${part}`);
  return element;
}

export function captureSwatchPickerStyles(picker: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const pickerRect = picker.getBoundingClientRect();
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    if (name !== 'picker') {
      values[`${name}.offset.top`] = String(rect.top - pickerRect.top);
      values[`${name}.offset.left`] = String(rect.left - pickerRect.left);
    }
  };
  capture('picker', picker, pickerProperties);
  const rows = picker.querySelectorAll('[data-swatch-row]');
  values['rows.count'] = String(rows.length);
  rows.forEach((row, index) => capture(`row.${index}`, row, pickerProperties));
  const swatches = picker.querySelectorAll('[data-swatch-part]');
  values['swatches.count'] = String(swatches.length);
  swatches.forEach((swatch) => {
    const name = `swatch.${swatch.getAttribute('data-swatch-part')}`;
    capture(name, swatch, swatchProperties);
    for (const slot of ['icon', 'disabled-icon']) {
      const element = swatch.querySelector(`[data-swatch-slot="${slot}"]`);
      values[`${name}.${slot}.count`] = element ? '1' : '0';
      if (!element) continue;
      capture(`${name}.${slot}`, element, iconProperties);
      const svg = element.querySelector('svg');
      values[`${name}.${slot}.glyph.count`] = svg ? '1' : '0';
      if (svg) capture(`${name}.${slot}.glyph`, svg, ['display', 'fill', 'line-height']);
    }
  });
  return values;
}

export function compareSwatchPickerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): SwatchPickerStyleDifference[] {
  const consumerProperties = new Set([
    'picker.row-gap',
    'picker.column-gap',
    'picker.padding-top',
    'picker.padding-right',
    'picker.padding-bottom',
    'picker.padding-left',
    'row.0.column-gap',
    'row.1.column-gap',
    ...['red', 'blue', 'gradient', 'image', 'disabled', 'empty'].flatMap((part) => [
      `swatch.${part}.border-radius`,
      `swatch.${part}.box-shadow`,
      `swatch.${part}.icon.font-size`,
      `swatch.${part}.disabled-icon.font-size`,
    ]),
  ]);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property): SwatchPickerStyleDifference => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      kind:
        consumer &&
        (consumerProperties.has(property) ||
          /\.(rect\.(width|height)|offset\.(top|left))$/.test(property))
          ? 'consumer-priority'
          : 'unexpected',
    }));
}

export function captureSwatchPickerNativeContract(picker: HTMLElement): Record<string, string> {
  return {
    role: picker.getAttribute('role') ?? '',
    focusgroup: picker.getAttribute('focusgroup') ?? '',
    'focusgroup-mode': supportsFocusGroup() ? 'native' : 'consumer-polyfill',
    'focusgroup-polyfill': 'Consumer-owned @microsoft/focusgroup-polyfill 1.6.0',
    'grid-navigation':
      'Pinned grid/manual tokens do not navigate in either tested engine; use explicit focusMode=tab',
    'swatch-elements': [...picker.querySelectorAll('[data-swatch-part]')]
      .map((element) => element.tagName.toLowerCase())
      .join(','),
    'image-visual-props': 'Installed visual source selects parent size/shape, not child overrides',
    'empty-selection': 'Author-owned action; no automatic selection request or stored value',
    'form-value': 'Native buttons, not radio inputs; no hidden selection field or reset model',
  };
}

export async function settleSwatchPickerStyles(...elements: Element[]): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    elements.flatMap((element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
