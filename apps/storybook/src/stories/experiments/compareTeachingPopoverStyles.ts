// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  capturePopoverStyles,
  comparePopoverStyles,
  refreshPopoverComparisonPositioning,
  settlePopoverStyles,
  type PopoverStyleDifference,
} from './comparePopoverStyles.js';

export { capturePopoverNativeContract } from './comparePopoverStyles.js';
export { refreshPopoverComparisonPositioning as refreshTeachingPopoverPositioning };
export { settlePopoverStyles as settleTeachingPopoverStyles };

export interface TeachingPopoverStyleDifference extends Omit<PopoverStyleDifference, 'kind'> {
  kind: PopoverStyleDifference['kind'] | 'native-subpixel-centering';
}

const textProperties = [
  'display',
  'box-sizing',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
] as const;

const slotSelectors = {
  header: '[data-teaching-slot="header"]',
  'header-icon': '.fui-TeachingPopoverHeader__icon',
  'header-dismiss': '.fui-TeachingPopoverHeader__dismissButton',
  title: '[data-teaching-slot="title"]',
  'title-dismiss': '.fui-TeachingPopoverTitle__dismissButton',
  body: '[data-teaching-slot="body"]',
  media: '[data-teaching-slot="media"]',
  footer: '[data-teaching-slot="footer"]',
  'carousel-footer': '[data-teaching-slot="carousel-footer"]',
  previous: '.fui-TeachingPopoverCarouselFooter__previous',
  next: '.fui-TeachingPopoverCarouselFooter__next',
  nav: '[data-teaching-slot="nav"]',
  selected: '.fui-TeachingPopoverCarouselNavButton[aria-selected="true"]',
  unselected: '.fui-TeachingPopoverCarouselNavButton[aria-selected="false"]',
  'page-count': '[data-teaching-slot="page-count"]',
} as const;

export function getTeachingPopoverSurface(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const fixture =
    container instanceof HTMLElement && container.hasAttribute('data-teaching-comparison')
      ? container
      : container.querySelector<HTMLElement>('[data-teaching-comparison]');
  const id = fixture?.dataset.teachingComparison;
  const surface = [
    ...document.querySelectorAll<HTMLElement>(`[data-teaching-implementation="${implementation}"]`),
  ].find((candidate) => candidate.dataset.teachingFixture === id);
  if (!id || !surface) throw new Error(`Missing ${implementation} TeachingPopover surface`);
  return surface;
}

export function getTeachingPopoverTrigger(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLButtonElement {
  const trigger = container.querySelector<HTMLButtonElement>(
    `[data-teaching-trigger="${implementation}"]`,
  );
  if (!trigger) throw new Error(`Missing ${implementation} TeachingPopover trigger`);
  return trigger;
}

export function prepareTeachingPopoverComparison(container: ParentNode): void {
  const trigger = getTeachingPopoverTrigger(container, 'headless');
  trigger.focus({ preventScroll: true });
  // Stacked narrow columns need enough viewport space below the native anchor.
  if (innerWidth <= 720) trigger.scrollIntoView({ block: 'start', inline: 'nearest' });
}

export function captureTeachingPopoverStyles(
  surface: Element,
  trigger: Element,
): Record<string, string> {
  const result = capturePopoverStyles(surface, trigger);
  for (const [name, selector] of Object.entries(slotSelectors)) {
    const element = [...surface.querySelectorAll(selector)].find(
      (candidate) => !candidate.closest('[hidden]'),
    );
    result[`${name}.present`] = String(Boolean(element));
    if (!element) continue;
    const computed = getComputedStyle(element);
    for (const property of textProperties) {
      result[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    if (name === 'media') {
      result['media.aspect-ratio'] = computed.aspectRatio;
      result['media.overflow-x'] = computed.overflowX;
      result['media.overflow-y'] = computed.overflowY;
    }
    const rectangle = element.getBoundingClientRect();
    result[`${name}.rect.width`] = String(rectangle.width);
    result[`${name}.rect.height`] = String(rectangle.height);
    const glyph = [...element.querySelectorAll('svg')].find(
      (candidate) => getComputedStyle(candidate).display !== 'none',
    );
    if (glyph && (name === 'header-icon' || name.endsWith('dismiss'))) {
      const bounds = glyph.getBoundingClientRect();
      result[`${name}.glyph.width`] = String(bounds.width);
      result[`${name}.glyph.height`] = String(bounds.height);
      result[`${name}.glyph.fill`] = getComputedStyle(glyph).fill;
    }
  }
  return result;
}

export function compareTeachingPopoverStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  arrowHeight?: 6 | 8,
): TeachingPopoverStyleDifference[] {
  return comparePopoverStyles(legacy, headless, arrowHeight).map(
    (difference): TeachingPopoverStyleDifference =>
      difference.property === 'anchor.cross-offset' &&
      Math.abs(Number(difference.legacy)) === 0.5 &&
      Number(difference.headless) === 0 &&
      legacy['anchor.side'] === headless['anchor.side'] &&
      (headless['anchor.side'] === 'above' || headless['anchor.side'] === 'below') &&
      legacy['surface.rect.width'] === headless['surface.rect.width'] &&
      legacy['trigger.rect.width'] === headless['trigger.rect.width']
        ? { ...difference, kind: 'native-subpixel-centering' }
        : difference,
  );
}
