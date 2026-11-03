// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { DrawerExample, DrawerImplementation } from './DrawerComparison.js';

const surfaceProperties = [
  'position',
  'display',
  'direction',
  'box-sizing',
  'color',
  'background-color',
  'flex-direction',
  'align-items',
  'justify-content',
  'max-width',
  'max-height',
  'overflow-x',
  'overflow-y',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const;

const slotProperties = {
  header: [
    'display',
    'box-sizing',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'gap',
    'z-index',
  ],
  title: ['display', 'align-items', 'justify-content', 'column-gap'],
  heading: [
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'margin-top',
    'margin-bottom',
  ],
  action: ['margin-left', 'margin-right', 'align-self', 'justify-self'],
  navigation: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  body: [
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'overflow-y',
    'flex-grow',
    'align-self',
    'z-index',
  ],
  footer: [
    'display',
    'box-sizing',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'column-gap',
    'z-index',
  ],
} as const;

export const DRAWER_COMPARISON_PROPERTY_COUNT =
  surfaceProperties.length +
  6 +
  Object.values(slotProperties).reduce((count, properties) => count + properties.length + 4, 0) +
  3 +
  6 +
  1;

export interface DrawerStyleSnapshot {
  styles: Record<string, string>;
  native: Record<string, string>;
}

export interface DrawerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'native-viewport-boundary' | 'native-scrollbar-viewport';
}

export function getComparisonDrawer(
  fixtureId: string,
  implementation: DrawerImplementation,
): HTMLElement {
  const element = [...document.querySelectorAll<HTMLElement>('[data-drawer-implementation]')].find(
    (candidate) =>
      candidate.dataset.drawerFixture === fixtureId &&
      candidate.dataset.drawerImplementation === implementation,
  );
  if (!element) throw new Error(`Missing open ${implementation} Drawer fixture`);
  return element;
}

export function captureDrawerStyles(surface: HTMLElement): Record<string, string> {
  const document = surface.ownerDocument;
  const win = document.defaultView;
  if (!win) throw new Error('Drawer requires a live document');
  const surfaceRect = surface.getBoundingClientRect();
  const values: Record<string, string> = {
    'viewport.width': String(document.documentElement.getBoundingClientRect().width),
    'viewport.inner-width': String(win.innerWidth),
    'viewport.height': String(win.innerHeight),
  };
  const capture = (name: string, element: HTMLElement | null, properties: readonly string[]) => {
    const computed = element ? getComputedStyle(element) : undefined;
    for (const property of properties) {
      values[`${name}.${property}`] = computed?.getPropertyValue(property) ?? 'absent';
    }
    const rect = element?.getBoundingClientRect();
    values[`${name}.rect.width`] = rect ? String(rect.width) : 'absent';
    values[`${name}.rect.height`] = rect ? String(rect.height) : 'absent';
    if (name === 'surface') {
      values['surface.viewport.left'] = String(surfaceRect.left);
      values['surface.viewport.top'] = String(surfaceRect.top);
      values['surface.viewport.right'] = String(win.innerWidth - surfaceRect.right);
      values['surface.viewport.bottom'] = String(win.innerHeight - surfaceRect.bottom);
    } else {
      values[`${name}.offset.left`] = rect ? String(rect.left - surfaceRect.left) : 'absent';
      values[`${name}.offset.top`] = rect ? String(rect.top - surfaceRect.top) : 'absent';
    }
  };
  capture('surface', surface, surfaceProperties);
  for (const [name, properties] of Object.entries(slotProperties)) {
    const slot = surface.querySelector<HTMLElement>(`[data-drawer-${name}]`);
    if (!slot && name !== 'navigation') throw new Error(`Missing Drawer ${name} slot`);
    capture(name, slot, properties);
  }
  for (const [name, pseudo] of [
    ['header', '::after'],
    ['footer', '::before'],
  ] as const) {
    const slot = surface.querySelector<HTMLElement>(`[data-drawer-${name}]`);
    if (!slot) throw new Error(`Missing Drawer ${name} separator owner`);
    const separator = getComputedStyle(slot, pseudo);
    for (const property of ['content', 'opacity', 'background-color']) {
      values[`${name}.separator.${property}`] = separator.getPropertyValue(property);
    }
  }
  const backdrop = [...document.querySelectorAll<HTMLElement>('[data-drawer-backdrop]')].find(
    (candidate) => candidate.dataset.drawerBackdrop === surface.dataset.drawerFixture,
  );
  values['backdrop.background-color'] =
    surface.dataset.drawerKind === 'inline'
      ? 'absent'
      : backdrop
        ? getComputedStyle(backdrop).backgroundColor
        : getComputedStyle(surface, '::backdrop').backgroundColor;
  return values;
}

export function captureDrawerNativeContract(surface: HTMLElement): Record<string, string> {
  // Native opening follows child layout effects. Wait for the public scroll
  // context's scheduled resize update before sampling its separator styles.
  const body = surface.querySelector<HTMLElement>('[data-drawer-body]');
  return {
    element: surface.tagName.toLowerCase(),
    role: surface.getAttribute('role') ?? '',
    'aria-modal': surface.getAttribute('aria-modal') ?? '',
    'aria-labelledby-present': String(Boolean(surface.getAttribute('aria-labelledby'))),
    'aria-describedby-present': String(Boolean(surface.getAttribute('aria-describedby'))),
    'dialog.open': String(surface instanceof HTMLDialogElement && surface.open),
    modal: String(surface.matches(':modal')),
    popover: surface.getAttribute('popover') ?? '',
    'popover-open': String(surface.matches(':popover-open')),
    'data-open': String(surface.hasAttribute('data-open')),
    'body.scroll-height': String(body?.scrollHeight),
    'body.client-height': String(body?.clientHeight),
    'header.scroll-state':
      surface.querySelector('[data-drawer-header]')?.getAttribute('data-scroll-state') ?? '',
    'footer.scroll-state':
      surface.querySelector('[data-drawer-footer]')?.getAttribute('data-scroll-state') ?? '',
    'fonts.status': surface.ownerDocument.fonts.status,
    'viewport.client-width': String(surface.ownerDocument.documentElement.clientWidth),
    'viewport.root-width': String(
      surface.ownerDocument.documentElement.getBoundingClientRect().width,
    ),
  };
}

export function compareDrawerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  example: DrawerExample,
): DrawerStyleDifference[] {
  const position = example.props?.position ?? 'start';
  const size = example.props?.size ?? 'small';
  const legacyViewport = Number(legacy['viewport.width']);
  const nativeViewport = Number(headless['viewport.width']);
  const innerWidth = Number(headless['viewport.inner-width']);
  const targetWidth = { small: 320, medium: 592, large: 940, full: innerWidth }[size];
  const legacyWidth = position === 'bottom' ? innerWidth : Math.min(targetWidth, innerWidth);
  const nativeWidth =
    position === 'bottom' ? nativeViewport : Math.min(targetWidth, nativeViewport);
  const widthDelta = nativeWidth - legacyWidth;
  const rightAligned =
    position !== 'bottom' && (position === 'end') !== (headless['surface.direction'] === 'rtl');
  // Legacy bottom drawers keep auto inline insets: RTL static positioning uses
  // the scrollbar-reduced containing block. Native bottom drawers set both edges.
  const legacyRightAligned =
    position === 'bottom' ? legacy['surface.direction'] === 'rtl' : rightAligned;
  const expectedLegacyLeft = legacyRightAligned ? legacyViewport - legacyWidth : 0;
  const expectedNativeLeft = rightAligned ? nativeViewport - nativeWidth : 0;
  const leftDelta = expectedNativeLeft - expectedLegacyLeft;
  const nativeViewportEvidence =
    example.kind === 'overlay' &&
    Number(legacy['surface.rect.width']) === legacyWidth &&
    Number(headless['surface.rect.width']) === nativeWidth &&
    Number(legacy['surface.viewport.left']) === expectedLegacyLeft &&
    Number(headless['surface.viewport.left']) === expectedNativeLeft;
  const scrollbarEvidence =
    nativeViewportEvidence &&
    nativeViewport === innerWidth &&
    legacyViewport > 0 &&
    legacyViewport < nativeViewport;
  const stretchedSlots = new Set(['header', 'title', 'navigation', 'body', 'footer']);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => {
      const delta = Number(headless[property]) - Number(legacy[property]);
      const [slotName] = property.split('.');
      const isViewportBoundary =
        example.kind === 'overlay' &&
        property === 'surface.max-width' &&
        legacy[property] === `${innerWidth}px` &&
        headless[property] === '100%';
      const isDerivedScrollbarChange =
        scrollbarEvidence &&
        ((property === 'viewport.width' && delta === nativeViewport - legacyViewport) ||
          ((property === 'surface.rect.width' ||
            (stretchedSlots.has(slotName) && property.endsWith('.rect.width'))) &&
            delta === widthDelta) ||
          (property === 'surface.viewport.left' && delta === leftDelta) ||
          (property === 'surface.viewport.right' && delta === -leftDelta - widthDelta) ||
          (property === 'action.offset.left' &&
            headless['surface.direction'] === 'ltr' &&
            delta === widthDelta) ||
          (property === 'heading.offset.left' &&
            headless['surface.direction'] === 'rtl' &&
            delta === widthDelta));
      return {
        property,
        legacy: legacy[property] ?? null,
        headless: headless[property] ?? null,
        kind: isViewportBoundary
          ? 'native-viewport-boundary'
          : isDerivedScrollbarChange
            ? 'native-scrollbar-viewport'
            : 'unexpected',
      };
    });
}

export async function settleDrawerStyles(surface: HTMLElement): Promise<void> {
  await surface.ownerDocument.fonts.ready;
  let previous = '';
  for (let frame = 0; frame < 60; frame += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const finite = surface.getAnimations({ subtree: true }).filter((animation) => {
      const timing = animation.effect?.getComputedTiming();
      return animation.playState === 'running' && timing && Number.isFinite(timing.endTime);
    });
    if (finite.length) {
      await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
      previous = '';
      continue;
    }
    const body = surface.querySelector<HTMLElement>('[data-drawer-body]');
    if (body) {
      const expectedScrollState =
        body.scrollHeight <= body.clientHeight
          ? 'none'
          : body.scrollTop === 0
            ? 'top'
            : body.scrollTop + body.clientHeight === body.scrollHeight
              ? 'bottom'
              : 'middle';
      const pendingScrollState = ['header', 'footer'].some((name) => {
        const slot = surface.querySelector(`[data-drawer-${name}]`);
        return (
          slot?.hasAttribute('data-scroll-state') &&
          slot.getAttribute('data-scroll-state') !== expectedScrollState
        );
      });
      if (pendingScrollState) {
        previous = '';
        continue;
      }
    }
    const geometry = [surface, ...surface.querySelectorAll<HTMLElement>('[data-drawer-body]')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return `${rect.x}:${rect.y}:${rect.width}:${rect.height}:${element.scrollHeight}`;
      })
      .join('|');
    if (geometry === previous) return;
    previous = geometry;
  }
  throw new Error('Drawer geometry did not settle within 60 animation frames');
}
