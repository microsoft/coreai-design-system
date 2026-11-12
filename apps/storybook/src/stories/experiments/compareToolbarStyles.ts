// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import type { ToolbarImplementation } from './ToolbarComparison.js';

const toolbarProperties = [
  'display',
  'align-items',
  'flex-direction',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const;
const buttonProperties = [
  'display',
  'align-items',
  'justify-content',
  'box-sizing',
  'flex-direction',
  'min-width',
  'max-width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'color',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-decoration-line',
  'box-shadow',
] as const;
const partProperties = {
  button: buttonProperties,
  toggle: buttonProperties,
  radio: buttonProperties,
  icon: [
    'display',
    'align-items',
    'justify-content',
    'font-size',
    'color',
    'margin-inline-start',
    'margin-inline-end',
    'margin-top',
    'margin-bottom',
  ],
  divider: [
    'display',
    'flex-direction',
    'flex-grow',
    'max-width',
    'min-height',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'color',
    'font-size',
  ],
  group: ['display', 'align-items', 'flex-direction'],
  radioGroup: ['display', 'align-items', 'flex-direction'],
} satisfies Record<string, readonly string[]>;

export interface ToolbarStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'consumer-priority';
}

export function requireToolbarHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML Toolbar fixture');
  return element;
}

export function getComparisonToolbar(
  container: ParentNode,
  implementation: ToolbarImplementation,
): HTMLElement {
  const element = container.querySelector(`[data-toolbar-implementation="${implementation}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing ${implementation} Toolbar`);
  return element;
}

export function captureToolbarStyles(toolbar: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = toolbar.getBoundingClientRect();
  const capture = (name: string, element: HTMLElement, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    if (name !== 'toolbar') {
      values[`${name}.offset.top`] = String(rect.top - rootRect.top);
      values[`${name}.offset.left`] = String(rect.left - rootRect.left);
    }
  };
  capture('toolbar', toolbar, toolbarProperties);
  for (const [part, properties] of Object.entries(partProperties)) {
    const elements = toolbar.querySelectorAll<HTMLElement>(`[data-toolbar-part="${part}"]`);
    values[`${part}.count`] = String(elements.length);
    elements.forEach((element, index) => {
      const name = `${part}.${index}`;
      capture(name, element, properties);
      if (part === 'icon') {
        const glyph = element.querySelector<SVGElement>('[data-toolbar-glyph]');
        if (glyph) {
          const rect = glyph.getBoundingClientRect();
          values[`${name}.glyph.width`] = String(rect.width);
          values[`${name}.glyph.height`] = String(rect.height);
        }
      }
      if (part === 'divider') {
        for (const pseudo of ['::before', '::after']) {
          const computed = getComputedStyle(element, pseudo);
          for (const property of [
            'content',
            'border-top-width',
            'border-top-color',
            'border-top-style',
            'border-inline-end-width',
            'border-inline-end-color',
            'border-inline-end-style',
            'margin-inline-start',
            'margin-inline-end',
            'margin-top',
            'margin-bottom',
          ]) {
            values[`${name}${pseudo}.${property}`] = computed.getPropertyValue(property);
          }
        }
      }
    });
  }
  return values;
}

export function compareToolbarStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): ToolbarStyleDifference[] {
  const consumerProperties = new Set([
    'toolbar.padding-top',
    'toolbar.padding-right',
    'toolbar.padding-bottom',
    'toolbar.padding-left',
    ...['button.0', 'toggle.0', 'radio.0', 'radio.1'].flatMap((part) => [
      `${part}.min-width`,
      `${part}.border-radius`,
    ]),
    ...[0, 1, 2, 3].map((index) => `icon.${index}.font-size`),
  ]);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property): ToolbarStyleDifference => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      kind:
        consumer &&
        (consumerProperties.has(property) ||
          // Only the captured slots' rectangles/offsets can flow from these explicit size changes.
          /\.(rect\.(width|height)|offset\.(top|left)|glyph\.(width|height))$/.test(property))
          ? 'consumer-priority'
          : 'unexpected',
    }));
}

export function captureToolbarNativeContract(toolbar: HTMLElement): Record<string, string> {
  return {
    focusgroup: toolbar.getAttribute('focusgroup') ?? '',
    'focusgroup-mode': supportsFocusGroup() ? 'native' : 'consumer-polyfill',
    'aria-orientation': toolbar.getAttribute('aria-orientation') ?? '(omitted)',
    'focusgroup-polyfill': 'Consumer-owned @microsoft/focusgroup-polyfill 1.6.0',
    'library-focus-manager': 'none',
  };
}

export async function settleToolbarStyles(...elements: Element[]): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    elements.flatMap((element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) =>
          Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
