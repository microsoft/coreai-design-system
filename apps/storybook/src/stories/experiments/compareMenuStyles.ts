// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import type { MenuImplementation } from './MenuComparison.js';

const surfaceProperties = [
  'display',
  'box-sizing',
  'min-width',
  'max-width',
  'overflow-x',
  'overflow-y',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'box-shadow',
] as const;

const partProperties = {
  list: ['display', 'flex-direction', 'gap', 'height'],
  item: [
    'display',
    'align-items',
    'gap',
    'box-sizing',
    'color',
    'background-color',
    'font-size',
    'min-height',
    'max-width',
    'border-radius',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'cursor',
    'text-decoration-line',
  ],
  content: ['display', 'flex-direction', 'flex-grow', 'padding-left', 'padding-right'],
  icon: ['display', 'align-items', 'justify-content', 'font-size', 'line-height', 'color'],
  checkmark: ['visibility', 'margin-top', 'flex-shrink'],
  submenu: ['display', 'align-self', 'font-size'],
  subText: ['font-family', 'font-size', 'font-weight', 'line-height', 'color'],
  shortcut: [
    'padding-left',
    'padding-right',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'color',
    'align-self',
  ],
  switch: [
    'border-radius',
    'border-top-width',
    'border-top-style',
    'border-top-color',
    'background-color',
    'color',
    'font-size',
    'line-height',
    'fill',
    'align-self',
    'margin-right',
    'margin-left',
    'transition-duration',
    'transition-property',
  ],
  group: ['display'],
  header: ['font-size', 'font-weight', 'color', 'padding-left', 'padding-right', 'align-items'],
  divider: [
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'border-bottom-width',
    'border-bottom-color',
    'border-bottom-style',
  ],
  splitGroup: ['display'],
} satisfies Record<string, readonly string[]>;

export interface MenuStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'consumer-priority';
}

export function requireMenuHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML Menu fixture element');
  return element;
}

export function getComparisonMenu(
  container: ParentNode,
  implementation: MenuImplementation,
): HTMLElement {
  const fixture = container.querySelector<HTMLElement>('[data-menu-comparison]');
  const fixtureId = fixture?.dataset.menuComparison;
  const surface = [...document.querySelectorAll<HTMLElement>('[data-menu-implementation]')].find(
    (candidate) =>
      candidate.dataset.menuImplementation === implementation &&
      candidate.dataset.menuFixture === fixtureId,
  );
  if (!fixtureId || !surface) throw new Error(`Missing ${implementation} Menu fixture`);
  return surface;
}

export function getComparisonMenuTrigger(
  container: ParentNode,
  implementation: MenuImplementation,
): HTMLButtonElement {
  const trigger = container.querySelector(`[data-menu-trigger="${implementation}"]`);
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error(`Missing ${implementation} MenuButton fixture`);
  }
  return trigger;
}

export function captureMenuStyles(surface: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const surfaceRect = surface.getBoundingClientRect();
  const capture = (name: string, element: HTMLElement, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    if (name !== 'surface') {
      values[`${name}.offset.top`] = String(rect.top - surfaceRect.top);
      values[`${name}.offset.left`] = String(rect.left - surfaceRect.left);
    }
  };
  capture('surface', surface, surfaceProperties);
  for (const [part, properties] of Object.entries(partProperties)) {
    // Closed native submenus remain mounted. Only visible, fixture-marked slots are paired;
    // separate regressions assert native closed-state hiding instead of equating DOM lifetime.
    // Link/Switch's published content prop intersects native content:string. Use
    // ordinary children, then identify their owned content by the stable slot marker.
    const selector =
      part === 'content'
        ? '[data-menu-part="content"], [data-menu-part="item"] > .fui-MenuItem__content:not([data-menu-part])'
        : `[data-menu-part="${part}"]`;
    const elements = [...surface.querySelectorAll<HTMLElement>(selector)].filter(
      (element) => element.getClientRects().length > 0,
    );
    values[`${part}.count`] = String(elements.length);
    elements.forEach((element, index) => {
      capture(`${part}.${index}`, element, properties);
      if (part === 'switch') {
        const thumb = element.querySelector('svg');
        if (thumb) values[`switch.${index}.thumb.transform`] = getComputedStyle(thumb).transform;
      }
      if (part === 'splitGroup') {
        const trigger = element.children[1];
        if (trigger) {
          const before = getComputedStyle(trigger, '::before');
          for (const property of ['content', 'width', 'height', 'background-color']) {
            values[`splitGroup.${index}.trigger::before.${property}`] =
              before.getPropertyValue(property);
          }
        }
      }
    });
  }
  return values;
}

export function compareMenuStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): MenuStyleDifference[] {
  const consumerProperties = new Set([
    'surface.border-top-color',
    'surface.border-top-width',
    'surface.border-radius',
    'surface.padding-top',
    'surface.padding-right',
    'surface.padding-bottom',
    'surface.padding-left',
    'item.0.min-height',
    'item.0.border-radius',
    'item.1.min-height',
    'item.1.border-radius',
    'icon.0.font-size',
    'header.0.font-weight',
    'list.0.height',
  ]);
  const isConsumerDifference = (property: string) =>
    consumer &&
    (consumerProperties.has(property) ||
      // These bounded rectangles/offsets flow from the explicitly asserted border,
      // padding, item-height and icon-size overrides; other style differences stay visible.
      /\.(rect\.(width|height)|offset\.(top|left))$/.test(property));
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      kind: isConsumerDifference(property) ? 'consumer-priority' : 'unexpected',
    }));
}

export function captureMenuNativeContract(surface: HTMLElement): Record<string, string> {
  const list = surface.querySelector('[role="menu"]');
  const computed = getComputedStyle(surface);
  return {
    popover: surface.getAttribute('popover') ?? '',
    open: String(surface.matches(':popover-open')),
    focusgroup: list?.getAttribute('focusgroup') ?? '',
    'focusgroup-mode': supportsFocusGroup() ? 'native' : 'consumer-polyfill',
    'position-anchor': computed.getPropertyValue('position-anchor'),
    'position-area': computed.getPropertyValue('position-area'),
    'focusgroup-polyfill': 'Consumer-owned @microsoft/focusgroup-polyfill 1.6.0',
    'initial-focus-role': surface.ownerDocument.activeElement?.getAttribute('role') ?? '',
  };
}

export async function settleMenuStyles(...elements: Element[]): Promise<void> {
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

export async function refreshMenuComparisonPositioning(
  legacySurface: HTMLElement,
  legacyTrigger: HTMLElement,
  headlessSurface: HTMLElement,
  headlessTrigger: HTMLElement,
  legacyPositioning: PositioningImperativeRef,
  headlessPositioning: PositioningImperativeRef,
): Promise<void> {
  const geometry = () =>
    [legacySurface, legacyTrigger, headlessSurface, headlessTrigger].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height];
    });
  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // The legacy observer does not track ancestor-only relocation. Refresh its public
  // positioning handle and await completion before comparing stable geometry.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timeout);
        legacySurface.removeEventListener('fui-positioningend', positioned);
      };
      const positioned = () => {
        cleanup();
        resolve();
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Legacy Menu positioning did not complete'));
      }, 1000);
      legacySurface.addEventListener('fui-positioningend', positioned, { once: true });
      legacyPositioning.updatePosition();
      headlessPositioning.updatePosition();
    });
    const positioned = geometry();
    await nextFrame();
    const first = geometry();
    await nextFrame();
    const second = geometry();
    if (
      positioned.every((value, index) => value === first[index]) &&
      first.every((value, index) => value === second[index])
    ) {
      return;
    }
  }
  throw new Error('Menu comparison geometry did not settle');
}
