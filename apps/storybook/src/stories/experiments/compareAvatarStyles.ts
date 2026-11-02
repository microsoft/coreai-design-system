// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface AvatarStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonAvatar {
  root: HTMLSpanElement;
  initials: HTMLSpanElement | null;
  icon: HTMLSpanElement | null;
  image: HTMLImageElement | null;
  badge: HTMLDivElement | null;
}

export function getAvatarSlots(root: HTMLSpanElement): ComparisonAvatar {
  return {
    root,
    initials: root.querySelector<HTMLSpanElement>(':scope > .fui-Avatar__initials'),
    icon: root.querySelector<HTMLSpanElement>(':scope > .fui-Avatar__icon'),
    image: root.querySelector<HTMLImageElement>(':scope > .fui-Avatar__image'),
    badge: root.querySelector<HTMLDivElement>(':scope > .fui-Avatar__badge'),
  };
}

export function getComparisonAvatar(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonAvatar {
  const cell = container.querySelector(`[data-avatar-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Avatar');
  if (!(root instanceof HTMLSpanElement)) throw new Error(`Missing ${implementation} Avatar`);
  return getAvatarSlots(root);
}

function captureElement(
  values: Record<string, string>,
  slot: string,
  element: Element | null,
  properties: readonly string[],
  relativeTo?: DOMRect,
) {
  values[`${slot}.present`] = String(Boolean(element));
  if (!element) return;
  const style = getComputedStyle(element);
  for (const property of properties)
    values[`${slot}.${property}`] = style.getPropertyValue(property);
  const rect = element.getBoundingClientRect();
  values[`${slot}.width`] = rect.width.toFixed(2);
  values[`${slot}.height`] = rect.height.toFixed(2);
  if (relativeTo) {
    const nonRenderedImage =
      element instanceof HTMLImageElement &&
      element.hidden &&
      style.display === 'none' &&
      element.getClientRects().length === 0 &&
      rect.left === 0 &&
      rect.top === 0 &&
      rect.width === 0 &&
      rect.height === 0;
    // A hidden image's empty DOMRect is at the document origin, not inside its Avatar.
    // Only its meaningless relative offsets are canonicalized; rendered geometry stays exact.
    values[`${slot}.offset-left`] = nonRenderedImage
      ? 'not-rendered'
      : (rect.left - relativeTo.left).toFixed(2);
    values[`${slot}.offset-top`] = nonRenderedImage
      ? 'not-rendered'
      : (rect.top - relativeTo.top).toFixed(2);
  }
}

export function captureAvatarStyles({ root }: ComparisonAvatar): Record<string, string> {
  const { image, initials, icon, badge } = getAvatarSlots(root);
  const values: Record<string, string> = {};
  const rect = root.getBoundingClientRect();
  const contentProperties = [
    'display',
    'position',
    'box-sizing',
    'color',
    'background-color',
    'border-radius',
    'mask-image',
  ] as const;
  for (const [name, element, properties] of [
    [
      'root',
      root,
      [
        'display',
        'position',
        'flex-shrink',
        'vertical-align',
        'border-radius',
        'font-family',
        'font-size',
        'font-weight',
        'opacity',
        'transform',
        'direction',
        'transition-property',
        'transition-duration',
        'transition-timing-function',
      ],
    ],
    ['image', image, [...contentProperties, 'object-fit', 'vertical-align']],
    [
      'initials',
      initials,
      [
        ...contentProperties,
        'font-size',
        'font-weight',
        'line-height',
        'align-items',
        'justify-content',
        'text-align',
        'user-select',
        'border-top-width',
        'border-top-color',
        'border-top-style',
      ],
    ],
    [
      'icon',
      icon,
      [
        ...contentProperties,
        'font-size',
        'line-height',
        'align-items',
        'justify-content',
        'border-top-width',
        'border-top-color',
      ],
    ],
    [
      'badge',
      badge,
      [
        'display',
        'position',
        'color',
        'background-color',
        'background-clip',
        'border-radius',
        'padding-top',
        'padding-bottom',
      ],
    ],
  ] as const) {
    captureElement(values, name, element, properties, name === 'root' ? undefined : rect);
  }
  if (initials) values['initials.text'] = initials.textContent ?? '';
  if (image) {
    values['image.hidden'] = String(image.hidden);
    values['image.rendered'] = String(image.getClientRects().length !== 0);
    values['image.visibility'] = getComputedStyle(image).visibility;
  }
  const badgeLabel = badge?.getAttribute('aria-label');
  if (badgeLabel != null) values['badge.aria-label'] = badgeLabel;
  for (const [name, element] of [
    ['icon-glyph', icon?.querySelector('svg') ?? null],
    ['badge-glyph', badge?.querySelector('svg') ?? null],
  ] as const) {
    captureElement(values, name, element, ['display', 'fill', 'forced-color-adjust']);
    if (element) {
      values[`${name}.viewBox`] = element.getAttribute('viewBox') ?? '';
      values[`${name}.paths`] = JSON.stringify(
        [...element.querySelectorAll('path')].map((path) => path.getAttribute('d')),
      );
    }
  }
  for (const pseudo of ['::before', '::after'] as const) {
    const style = getComputedStyle(root, pseudo);
    for (const property of [
      'content',
      'position',
      'z-index',
      'border-radius',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'opacity',
      'transition-property',
      'transition-duration',
      'transition-timing-function',
      ...(pseudo === '::before'
        ? ['color', 'border-top-width', 'border-top-style', 'mask-image']
        : ['box-shadow']),
    ]) {
      values[`${pseudo}.${property}`] = style.getPropertyValue(property);
    }
  }
  return values;
}

export function compareAvatarStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): AvatarStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleAvatarStyles({ root }: ComparisonAvatar): Promise<void> {
  await document.fonts.ready;
  const { image } = getAvatarSlots(root);
  if (image) await image.decode().catch(() => undefined);
  getComputedStyle(root, '::before').getPropertyValue('content');
  getComputedStyle(root, '::after').getPropertyValue('content');
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // Settle finite root/pseudo-element transitions without waiting on infinite consumer motion.
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
