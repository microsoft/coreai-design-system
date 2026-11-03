// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface MessageBarStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

const rootProperties = [
  'display',
  'box-sizing',
  'white-space',
  'grid-template-areas',
  'grid-template-columns',
  'align-items',
  'padding-top',
  'padding-inline-start',
  'min-height',
  'background-color',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-radius',
] as const;

const contentProperties = [
  'display',
  'grid-area',
  'padding-inline-end',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'white-space',
  'overflow',
  'text-overflow',
] as const;

export function getMessageBarSlots(root: Element) {
  return {
    root,
    icon: root.querySelector<HTMLElement>(':scope > .fui-MessageBar__icon'),
    body: root.querySelector<HTMLElement>(':scope > .fui-MessageBarBody'),
    title: root.querySelector<HTMLElement>('.fui-MessageBarTitle'),
    actions: root.querySelector<HTMLElement>(':scope > .fui-MessageBarActions'),
    containerAction: root.querySelector<HTMLElement>(
      ':scope > .fui-MessageBarActions__containerAction',
    ),
    bottomReflowSpacer: root.querySelector<HTMLElement>(
      ':scope > .fui-MessageBar__bottomReflowSpacer',
    ),
    link: root.querySelector<HTMLElement>('.fui-Link'),
    action: root.querySelector<HTMLElement>('.fui-MessageBarActions > .fui-Button'),
  };
}

export function captureMessageBarStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    const laidOut = element.getClientRects().length > 0;
    values[`${name}.rect.present`] = String(laidOut);
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
    values[`${name}.rect.left`] = laidOut ? (rect.left - rootRect.left).toFixed(2) : 'not laid out';
    values[`${name}.rect.top`] = laidOut ? (rect.top - rootRect.top).toFixed(2) : 'not laid out';
  };
  capture('root', root, rootProperties);
  const slots = getMessageBarSlots(root);
  for (const name of ['body', 'title', 'link'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) capture(name, element, contentProperties);
  }
  if (slots.title) {
    values['title::after.content'] = getComputedStyle(slots.title, '::after').content;
  }
  values['icon.present'] = String(Boolean(slots.icon));
  if (slots.icon) {
    capture('icon', slots.icon, [
      'display',
      'grid-area',
      'font-size',
      'color',
      'align-items',
      'margin-inline-end',
    ]);
    const glyph = slots.icon.querySelector('svg');
    values['glyph.present'] = String(Boolean(glyph));
    if (glyph) capture('glyph', glyph, ['display', 'width', 'height', 'fill']);
  }
  for (const name of ['actions', 'containerAction', 'bottomReflowSpacer'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) {
      capture(name, element, [
        'display',
        'grid-area',
        'justify-content',
        'column-gap',
        'padding-inline-end',
        'margin-top',
        'margin-bottom',
        'margin-inline-end',
      ]);
    }
  }
  values['action.present'] = String(Boolean(slots.action));
  if (slots.action) {
    capture('action', slots.action, [
      'font-size',
      'line-height',
      'padding-top',
      'padding-inline-start',
      'min-width',
      'border-radius',
    ]);
  }
  return values;
}

export function compareMessageBarStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): MessageBarStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonMessageBar(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-messagebar-implementation="${implementation}"] [data-messagebar-root]`,
  );
  if (!root) throw new Error(`Missing ${implementation} MessageBar in shared fixture`);
  return root;
}

export async function settleMessageBarStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((animation) => animation.finished.catch(() => undefined)),
  );
  let previous = '';
  let stableFrames = 0;
  for (let frame = 0; frame < 120; frame++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const geometry = JSON.stringify(captureMessageBarStyles(root));
    if (geometry === previous) {
      if (++stableFrames === 3) return;
    } else {
      stableFrames = 0;
      previous = geometry;
    }
  }
  throw new Error('MessageBar slot geometry did not settle');
}
