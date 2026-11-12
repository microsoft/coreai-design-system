// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import type { TabListImplementation } from './TabListComparison.js';

const listProperties = [
  'display',
  'align-items',
  'flex-direction',
  'flex-shrink',
  'flex-wrap',
  'row-gap',
  'column-gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'color',
  'border-radius',
] as const;
const tabProperties = [
  'display',
  'align-items',
  'justify-content',
  'grid-auto-flow',
  'column-gap',
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
  'line-height',
  'overflow',
  'text-transform',
  'cursor',
  'outline-style',
  'outline-width',
  'outline-color',
  'box-shadow',
] as const;
const contentProperties = [
  'display',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'grid-column-start',
  'grid-row-start',
  'overflow',
  'visibility',
] as const;
const iconProperties = [
  'display',
  'align-items',
  'justify-content',
  'font-size',
  'color',
  'width',
  'height',
  'grid-column-start',
  'grid-row-start',
  'overflow',
] as const;
const indicatorProperties = [
  'content',
  'position',
  'background-color',
  'border-radius',
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
  'transform',
  'transform-origin',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
] as const;

export interface TabListStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'consumer-priority';
}

export function requireTabListHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML TabList fixture');
  return element;
}

export function getComparisonTabList(
  container: ParentNode,
  implementation: TabListImplementation,
): HTMLElement {
  const element = container.querySelector(`[data-tablist-implementation="${implementation}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing ${implementation} TabList`);
  return element;
}

export function getFixtureTab(list: ParentNode, value: string): HTMLButtonElement {
  const element = list.querySelector(`[data-tablist-fixture-tab="${value}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Missing fixture Tab ${value}`);
  return element;
}

export function captureTabListStyles(list: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const listRect = list.getBoundingClientRect();
  const capture = (name: string, element: HTMLElement, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    if (name !== 'list') {
      values[`${name}.offset.top`] = String(rect.top - listRect.top);
      values[`${name}.offset.left`] = String(rect.left - listRect.left);
    }
  };
  capture('list', list, listProperties);
  const tabs = list.querySelectorAll<HTMLElement>('[data-tablist-fixture-tab]');
  values['tabs.count'] = String(tabs.length);
  tabs.forEach((tab, index) => {
    const name = `tab.${index}`;
    capture(name, tab, tabProperties);
    for (const [part, selector, properties] of [
      ['content', '.fui-Tab__content', contentProperties],
      ['reserved', '.fui-Tab__content--reserved-space', contentProperties],
      ['icon', '.fui-Tab__icon', iconProperties],
    ] as const) {
      const element = tab.querySelector<HTMLElement>(`:scope > ${selector}`);
      values[`${name}.${part}.count`] = element ? '1' : '0';
      if (element) capture(`${name}.${part}`, element, properties);
      if (part === 'icon' && element) {
        for (const glyph of ['regular', 'filled']) {
          const svg = element.querySelector<SVGElement>(`[data-tablist-glyph="${glyph}"]`);
          if (!svg) throw new Error(`Missing fixture ${glyph} glyph`);
          const rect = svg.getBoundingClientRect();
          values[`${name}.glyph.${glyph}.display`] = getComputedStyle(svg).display;
          values[`${name}.glyph.${glyph}.rect.width`] = String(rect.width);
          values[`${name}.glyph.${glyph}.rect.height`] = String(rect.height);
        }
      }
    }
    for (const pseudo of ['::before', '::after']) {
      const computed = getComputedStyle(tab, pseudo);
      for (const property of indicatorProperties) {
        values[`${name}${pseudo}.${property}`] = computed.getPropertyValue(property);
      }
    }
  });
  return values;
}

export function compareTabListStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): TabListStyleDifference[] {
  const consumerProperties = new Set([
    'list.row-gap',
    'list.column-gap',
    'list.padding-top',
    'list.padding-right',
    'list.padding-bottom',
    'list.padding-left',
    'list.border-radius',
    ...[0, 1, 2].flatMap((index) => [
      `tab.${index}.border-radius`,
      `tab.${index}.content.font-size`,
      `tab.${index}.reserved.font-size`,
      `tab.${index}.icon.font-size`,
      `tab.${index}.icon.width`,
      `tab.${index}.icon.height`,
    ]),
  ]);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property): TabListStyleDifference => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      kind:
        consumer &&
        (consumerProperties.has(property) ||
          /\.(rect\.(width|height)|offset\.(top|left))$/.test(property) ||
          /^tab\.\d+::(?:before|after)\.(?:width|height|top|right|bottom|left|transform-origin)$/.test(
            property,
          ))
          ? 'consumer-priority'
          : 'unexpected',
    }));
}

export function captureTabListNativeContract(list: HTMLElement): Record<string, string> {
  return {
    focusgroup: list.getAttribute('focusgroup') ?? '',
    'focusgroup-mode': supportsFocusGroup() ? 'native' : 'consumer-polyfill',
    'aria-orientation': list.getAttribute('aria-orientation') ?? '',
    'focusgroup-polyfill': 'Consumer-owned @microsoft/focusgroup-polyfill 1.6.0',
    'indicator-motion': 'Local CSS indicator; no legacy JavaScript slide between tabs',
    'reserved-space': 'Public root slot renderer; no internal reserved-space slot API',
    'panel-api': 'Author-owned native role=tabpanel; no facade TabPanel or provider alias',
  };
}

export async function settleTabListStyles(...elements: Element[]): Promise<void> {
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
