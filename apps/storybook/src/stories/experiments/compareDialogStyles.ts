// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { DialogImplementation } from './DialogComparison.js';

const surfaceProperties = [
  'position',
  'box-sizing',
  'color',
  'background-color',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'max-width',
  'max-height',
  'overflow-x',
  'overflow-y',
  'box-shadow',
] as const;

const bodyProperties = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'box-sizing',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'overflow-y',
  'min-height',
] as const;

export interface DialogStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind:
    'unexpected' | 'native-viewport-sizing' | 'native-scrollbar-viewport' | 'legacy-beak-border';
}

export interface DialogStyleSnapshot {
  styles: Record<string, string>;
  native: Record<string, string>;
}

export function getComparisonDialog(
  fixtureId: string,
  implementation: DialogImplementation,
): HTMLElement {
  const candidate = [
    ...document.querySelectorAll<HTMLElement>('[data-dialog-implementation]'),
  ].find(
    (element) =>
      element.dataset.dialogFixture === fixtureId &&
      element.dataset.dialogImplementation === implementation,
  );
  if (!candidate) throw new Error(`Missing open ${implementation} Dialog fixture`);
  return candidate;
}

function requireSlot(surface: Element, marker: string): HTMLElement {
  const element = surface.querySelector<HTMLElement>(`[${marker}]`);
  if (!element) throw new Error(`Missing Dialog ${marker} slot`);
  return element;
}

export function captureDialogStyles(surface: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  // Chromium's clientWidth includes an empty stable scrollbar gutter. The root
  // CSS rectangle exposes the actual fixed-layout width reserved by the old lock.
  values['viewport.available-width'] = String(
    surface.ownerDocument.documentElement.getBoundingClientRect().width,
  );
  const surfaceRect = surface.getBoundingClientRect();
  const theme = getComputedStyle(surface);
  const color = document.createElement('span').style;
  for (const [name, token] of [
    ['stroke-3', '--colorNeutralStroke3'],
    ['stroke-subtle', '--colorNeutralStrokeSubtle'],
  ]) {
    // Let the CSSOM serialize the resolved color literal without adding DOM.
    color.color = '';
    color.color = theme.getPropertyValue(token).trim();
    if (!color.color) throw new Error(`Missing Dialog reference theme token ${token}`);
    values[`theme.${name}`] = color.color;
  }
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
  capture('body', requireSlot(surface, 'data-dialog-content'), bodyProperties);
  capture('title', requireSlot(surface, 'data-dialog-title'), [
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'color',
    'margin-top',
    'margin-bottom',
  ]);
  capture('actions', requireSlot(surface, 'data-dialog-actions'), [
    'display',
    'box-sizing',
    'gap',
    'flex-direction',
    'justify-self',
    'grid-column-start',
    'grid-column-end',
    'grid-row-start',
    'grid-row-end',
  ]);
  const legacyLayout = surface.querySelector<HTMLElement>('[data-dialog-layout]');
  const divider = getComputedStyle(legacyLayout ?? surface, '::before');
  for (const property of [
    'content',
    'height',
    'border-top-width',
    'border-bottom-width',
    'border-bottom-color',
  ]) {
    values[`divider.${property}`] = divider.getPropertyValue(property);
  }
  const backdrop = [...document.querySelectorAll<HTMLElement>('[data-dialog-backdrop]')].find(
    (element) => element.dataset.dialogBackdrop === surface.dataset.dialogFixture,
  );
  values['backdrop.background-color'] = backdrop
    ? getComputedStyle(backdrop).backgroundColor
    : surface instanceof HTMLDialogElement
      ? getComputedStyle(surface, '::backdrop').backgroundColor
      : 'rgba(0, 0, 0, 0)';
  return values;
}

export function captureDialogNativeContract(surface: HTMLElement): Record<string, string> {
  const body = requireSlot(surface, 'data-dialog-content');
  const actions = requireSlot(surface, 'data-dialog-actions');
  const layout = surface.querySelector<HTMLElement>('[data-dialog-layout]') ?? surface;
  return {
    element: surface.tagName.toLowerCase(),
    display: getComputedStyle(surface).display,
    role: surface.getAttribute('role') ?? '',
    'aria-modal': surface.getAttribute('aria-modal') ?? '',
    'aria-labelledby-present': String(Boolean(surface.getAttribute('aria-labelledby'))),
    'aria-describedby-present': String(Boolean(surface.getAttribute('aria-describedby'))),
    'dialog.open': String(surface instanceof HTMLDialogElement && surface.open),
    modal: String(surface.matches(':modal')),
    popover: surface.getAttribute('popover') ?? '',
    'popover-open': String(surface.matches(':popover-open')),
    'data-open': String(surface.hasAttribute('data-open')),
    'body.scroll-height': String(body.scrollHeight),
    'body.client-height': String(body.clientHeight),
    'surface.rect.width': String(surface.getBoundingClientRect().width),
    'surface.rect.height': String(surface.getBoundingClientRect().height),
    'body.rect.width': String(body.getBoundingClientRect().width),
    'body.rect.height': String(body.getBoundingClientRect().height),
    'layout.grid-template-rows': getComputedStyle(layout).gridTemplateRows,
    'layout.grid-template-columns': getComputedStyle(layout).gridTemplateColumns,
    'layout.rect.height': String(layout.getBoundingClientRect().height),
    'layout.first-surface-child': surface.firstElementChild?.tagName.toLowerCase() ?? '',
    'layout.divider-border-top': getComputedStyle(layout, '::before').borderTopWidth,
    'layout.divider-border-bottom': getComputedStyle(layout, '::before').borderBottomWidth,
    'actions.child-widths': [...actions.children]
      .map((element) => element.getBoundingClientRect().width)
      .join(','),
    'fonts.status': surface.ownerDocument.fonts.status,
    'viewport.available-width': String(
      surface.ownerDocument.documentElement.getBoundingClientRect().width,
    ),
    'viewport.client-width': String(surface.ownerDocument.documentElement.clientWidth),
    'viewport.inner-width': String(surface.ownerDocument.defaultView?.innerWidth),
    'viewport.root-rect-width': String(
      surface.ownerDocument.documentElement.getBoundingClientRect().width,
    ),
    'viewport.root-css-width': getComputedStyle(surface.ownerDocument.documentElement).width,
    'viewport.scrollbar-gutter': getComputedStyle(surface.ownerDocument.documentElement)
      .scrollbarGutter,
  };
}

export function compareDialogStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  scrolling = false,
  nonModal = false,
): DialogStyleDifference[] {
  // The legacy grid subtracts a fixed 48px from the viewport even when CoreAI
  // changes surface padding to 16px. Native layout instead fits the actual
  // padding and borders. Only these exact, derived scrolling deltas are expected;
  // styles, width, title geometry, and all other offsets remain exact.
  const innerHeightDelta =
    48 -
    parseFloat(headless['surface.padding-top']) -
    parseFloat(headless['surface.padding-bottom']) -
    2 * parseFloat(headless['surface.border-top-width']);
  const expectedLegacyHeight = Math.min(innerHeight, innerHeight - innerHeightDelta);
  const isNativeViewportLayout =
    scrolling &&
    Number(headless['surface.rect.height']) === innerHeight &&
    Number(legacy['surface.rect.height']) === expectedLegacyHeight;
  // CoreAI's obsolete surface > div:first-child::before beak selector reaches
  // the legacy non-modal body. Native dialogs have no beak. On the mobile grid
  // its accidental top border also adds exactly 1px to the otherwise empty row.
  const legacyBeak =
    nonModal &&
    legacy['divider.content'] === '""' &&
    headless['divider.content'] === '""' &&
    legacy['divider.border-top-width'] === '1px' &&
    headless['divider.border-top-width'] === '0px';
  const legacyBeakEmptyRow =
    legacyBeak && !scrolling && matchMedia('screen and (max-width: 480px)').matches;
  // The legacy scroll lock can preserve a page scrollbar; the current native
  // hook clips body overflow. Keep the two actual available viewport widths
  // observable, and classify only exact width changes derived from those widths.
  const legacyViewport = Number(legacy['viewport.available-width']);
  const nativeViewport = Number(headless['viewport.available-width']);
  const nativeScrollbarViewport =
    nativeViewport === innerWidth &&
    legacyViewport > 0 &&
    legacyViewport < nativeViewport &&
    Number(legacy['surface.rect.width']) === Math.min(600, legacyViewport) &&
    Number(headless['surface.rect.width']) === Math.min(600, nativeViewport);
  const nativeWidthDelta = Math.min(600, nativeViewport) - Math.min(600, legacyViewport);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => {
      const delta = Number(headless[property]) - Number(legacy[property]);
      const expectedDelta =
        property === 'surface.rect.height'
          ? Math.max(0, innerHeightDelta)
          : property === 'body.rect.height' || property === 'actions.offset.top'
            ? innerHeightDelta
            : undefined;
      const isLegacyBeakDifference =
        (legacyBeak && property === 'divider.border-top-width') ||
        (legacyBeak &&
          property === 'divider.border-bottom-color' &&
          legacy[property] === legacy['theme.stroke-3'] &&
          headless[property] === headless['theme.stroke-subtle']) ||
        (legacyBeakEmptyRow &&
          (property === 'surface.rect.height' || property === 'actions.offset.top') &&
          delta === -1);
      const isNativeScrollbarDifference =
        nativeScrollbarViewport &&
        ((property === 'viewport.available-width' && delta === nativeViewport - legacyViewport) ||
          ((property === 'surface.rect.width' ||
            property === 'body.rect.width' ||
            property === 'title.rect.width' ||
            (property === 'actions.rect.width' &&
              legacy['actions.justify-self'] === 'stretch' &&
              headless['actions.justify-self'] === 'stretch')) &&
            delta === nativeWidthDelta));
      return {
        property,
        legacy: legacy[property] ?? null,
        headless: headless[property] ?? null,
        kind: isLegacyBeakDifference
          ? 'legacy-beak-border'
          : isNativeScrollbarDifference
            ? 'native-scrollbar-viewport'
            : isNativeViewportLayout && expectedDelta !== undefined && delta === expectedDelta
              ? 'native-viewport-sizing'
              : 'unexpected',
      };
    });
}

export async function settleDialogStyles(surface: HTMLElement): Promise<void> {
  await surface.ownerDocument.fonts.ready;
  const finite = surface.getAnimations({ subtree: true }).filter((animation) => {
    const timing = animation.effect?.getComputedTiming();
    return animation.playState === 'running' && timing && Number.isFinite(timing.endTime);
  });
  await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  let previous = '';
  for (let frame = 0; frame < 60; frame += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const rect = surface.getBoundingClientRect();
    const geometry = `${rect.x}:${rect.y}:${rect.width}:${rect.height}`;
    if (geometry === previous) return;
    previous = geometry;
  }
  throw new Error('Dialog geometry did not settle within 60 animation frames');
}
