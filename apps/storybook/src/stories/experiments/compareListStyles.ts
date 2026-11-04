// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import type { ListImplementation } from './ListComparison.js';

const listProperties = [
  'display',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'text-indent',
  'list-style-type',
  'border-radius',
] as const;
const rowProperties = [
  ...listProperties,
  'align-items',
  'column-gap',
  'min-height',
  'cursor',
  'color',
  'background-color',
  'outline-color',
  'outline-width',
  'outline-style',
] as const;
const checkmarkProperties = [
  'box-sizing',
  'width',
  'height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'background-color',
  'color',
  'font-size',
] as const;

export interface ListStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'consumer-priority';
}

export function requireListHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML List fixture');
  return element;
}

export function getComparisonList(
  container: ParentNode,
  implementation: ListImplementation,
): HTMLElement {
  const element = container.querySelector(`[data-list-implementation="${implementation}"]`);
  if (!element) throw new Error(`Missing ${implementation} List`);
  return requireListHTML(element);
}

export function getListRow(list: ParentNode, value: string): HTMLElement {
  const element = list.querySelector(`[data-list-row="${value}"]`);
  if (!element) throw new Error(`Missing List row ${value}`);
  return requireListHTML(element);
}

export function captureListStyles(list: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = list.getBoundingClientRect();
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    values[`${name}.offset.top`] = String(rect.top - rootRect.top);
    values[`${name}.offset.left`] = String(rect.left - rootRect.left);
  };
  capture('list', list, listProperties);
  const rows = list.querySelectorAll('[data-list-row]');
  values['rows.count'] = String(rows.length);
  rows.forEach((row) => {
    const name = `row.${row.getAttribute('data-list-row')}`;
    capture(name, row, rowProperties);
    for (const slot of ['content', 'actions']) {
      const element = row.querySelector(`[data-list-slot="${slot}"]`);
      values[`${name}.${slot}.count`] = element ? '1' : '0';
      if (element) capture(`${name}.${slot}`, element, ['display', 'font-size', 'line-height']);
    }
    const indicator =
      row.querySelector('.fui-Checkbox__indicator') ??
      row.querySelector('input.fui-ListItem__checkmark');
    values[`${name}.checkmark.count`] = indicator ? '1' : '0';
    if (indicator) capture(`${name}.checkmark`, indicator, checkmarkProperties);
  });
  return values;
}

export function compareListStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): ListStyleDifference[] {
  const consumerProperties = new Set([
    ...['top', 'right', 'bottom', 'left'].map((side) => `list.padding-${side}`),
    'list.border-radius',
    'list.rect.height',
    ...['alpha', 'bravo', 'charlie'].flatMap((value) => {
      const row = `row.${value}`;
      return [
        ...['top', 'right', 'bottom', 'left'].map((side) => `${row}.padding-${side}`),
        `${row}.border-radius`,
        `${row}.background-color`,
        `${row}.color`,
        `${row}.checkmark.border-radius`,
        `${row}.checkmark.border-top-width`,
        ...['', '.content', '.actions', '.checkmark'].flatMap((slot) => [
          `${row}${slot}.rect.width`,
          `${row}${slot}.rect.height`,
          `${row}${slot}.offset.top`,
          `${row}${slot}.offset.left`,
        ]),
      ];
    }),
  ]);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property): ListStyleDifference => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      kind: consumer && consumerProperties.has(property) ? 'consumer-priority' : 'unexpected',
    }));
}

export function captureListNativeContract(list: HTMLElement): Record<string, string> {
  return {
    role: list.getAttribute('role') ?? '',
    element: list.tagName.toLowerCase(),
    navigation: list.getAttribute('data-navigation-mode') ?? 'none',
    focusgroup: list.getAttribute('focusgroup') ?? '',
    'focusgroup-mode': supportsFocusGroup() ? 'native' : 'consumer-polyfill',
    'composite-navigation':
      'Current public hook owns row/control navigation and its roving tab stop',
    'native-checkmarks': String(list.querySelectorAll('input[type="checkbox"]').length),
    'checkmark-cells': String(
      list.querySelectorAll('[role="gridcell"] > input.fui-ListItem__checkmark').length,
    ),
    'visual-props':
      'No size, layout, inset, or spacing props are published by installed List 9.7.0',
    selection: 'Current hook state; native input slots and original event payloads are preserved',
  };
}

export async function settleListStyles(...elements: Element[]): Promise<void> {
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
