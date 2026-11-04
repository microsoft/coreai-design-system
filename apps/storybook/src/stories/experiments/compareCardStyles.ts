// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'position',
  'box-sizing',
  'overflow',
  'flex-direction',
  'align-items',
  'gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'color',
  'background-color',
  'box-shadow',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'cursor',
  'user-select',
  'text-decoration-line',
] as const;

const layoutProperties = [
  'display',
  'position',
  'flex-shrink',
  'flex-grow',
  'flex-direction',
  'align-items',
  'gap',
  'grid-auto-columns',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'color',
] as const;

const slotProperties = [
  'display',
  'position',
  'grid-column-start',
  'grid-row-start',
  'flex-grow',
  'margin-inline-start',
  'margin-inline-end',
  'color',
] as const;

export interface CardStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getCardSlots(root: HTMLElement) {
  const header = root.querySelector<HTMLElement>(':scope > .fui-CardHeader');
  const preview = root.querySelector<HTMLElement>(':scope > .fui-CardPreview');
  const footer = root.querySelector<HTMLElement>(':scope > .fui-CardFooter');
  const content = root.querySelector<HTMLElement>(':scope > [data-card-fixture-content]');
  return {
    root,
    header,
    image: header?.querySelector<HTMLElement>(':scope > .fui-CardHeader__image') ?? null,
    title: header?.querySelector<HTMLElement>(':scope > .fui-CardHeader__header') ?? null,
    description:
      header?.querySelector<HTMLElement>(':scope > .fui-CardHeader__description') ?? null,
    headerAction: header?.querySelector<HTMLElement>(':scope > .fui-CardHeader__action') ?? null,
    content,
    text: content?.querySelector<HTMLElement>('.fui-Text') ?? null,
    preview,
    media: preview?.querySelector<HTMLImageElement>(':scope > .fui-Image') ?? null,
    logo: preview?.querySelector<HTMLElement>(':scope > .fui-CardPreview__logo') ?? null,
    footer,
    footerAction: footer?.querySelector<HTMLElement>(':scope > .fui-CardFooter__action') ?? null,
    floatingAction: root.querySelector<HTMLElement>(':scope > .fui-Card__floatingAction'),
    checkbox: root.querySelector<HTMLInputElement>(':scope > .fui-Card__checkbox'),
  };
}

export function captureCardStyles(root: HTMLElement): Record<string, string> {
  const slots = getCardSlots(root);
  const values: Record<string, string> = {};
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
  };
  capture('root', root, rootProperties);
  for (const pseudo of ['::before', '::after']) {
    values[`root${pseudo}.content`] = getComputedStyle(root, pseudo).content;
  }
  for (const name of ['header', 'preview', 'footer'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) capture(name, element, layoutProperties);
  }
  for (const name of ['image', 'title', 'description', 'headerAction', 'footerAction'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) capture(name, element, slotProperties);
  }
  values['content.present'] = String(Boolean(slots.content));
  if (slots.content) capture('content', slots.content, ['color', 'font-size', 'line-height']);
  values['text.present'] = String(Boolean(slots.text));
  if (slots.text) capture('text', slots.text, ['color']);
  values['media.present'] = String(Boolean(slots.media));
  if (slots.media) {
    capture('media', slots.media, ['display', 'object-fit', 'width', 'height', 'border-radius']);
  }
  values['logo.present'] = String(Boolean(slots.logo));
  if (slots.logo) {
    capture('logo', slots.logo, ['position', 'bottom', 'inset-inline-start', 'width', 'height']);
  }
  values['floatingAction.present'] = String(Boolean(slots.floatingAction));
  if (slots.floatingAction) {
    capture('floatingAction', slots.floatingAction, [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'display',
      'flex-direction',
      'align-items',
      'box-sizing',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'width',
    ]);
  }
  values['checkbox.present'] = String(Boolean(slots.checkbox));
  if (slots.checkbox) {
    capture('checkbox', slots.checkbox, [
      'position',
      'overflow',
      'clip',
      'clip-path',
      'white-space',
      'width',
      'height',
    ]);
  }
  return values;
}

export function compareCardStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): CardStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonCard(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-card-implementation="${implementation}"] .fui-Card`,
  );
  if (!root) throw new Error(`Missing ${implementation} Card in shared fixture`);
  return root;
}

export async function settleCardStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await Promise.all(
    [...root.querySelectorAll('img')].map((image) =>
      image.decode().catch(() => {
        if (!image.complete) throw new Error('Card fixture image did not load');
      }),
    ),
  );
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
