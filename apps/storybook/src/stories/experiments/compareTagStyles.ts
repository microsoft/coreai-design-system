// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { TagImplementation } from './TagComparison.js';

export const tagRootProperties = [
  'display',
  'box-sizing',
  'align-items',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'background-color',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-right-width',
  'border-right-style',
  'border-right-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'border-left-width',
  'border-left-style',
  'border-left-color',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-left',
  'margin-right',
  'min-width',
  'cursor',
] as const;

const textProperties = [
  'display',
  'grid-area',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'white-space',
  'padding-left',
  'padding-right',
  'padding-bottom',
  'margin-top',
  'color',
] as const;

export const tagPartProperties = {
  item: tagRootProperties,
  media: ['display', 'grid-area', 'padding-left', 'padding-right'],
  icon: [
    'display',
    'grid-area',
    'box-sizing',
    'font-size',
    'padding-left',
    'padding-right',
    'color',
  ],
  primaryText: textProperties,
  secondaryText: textProperties,
  dismissIcon: [
    'display',
    'grid-area',
    'font-size',
    'padding-left',
    'padding-right',
    'color',
    'cursor',
  ],
} satisfies Record<string, readonly string[]>;

export interface TagStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'consumer-priority';
}

export function requireTagHTML(element: Element | null): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML Tag fixture element');
  return element;
}

export function getComparisonTag(
  container: ParentNode,
  implementation: TagImplementation,
): HTMLElement {
  return requireTagHTML(
    container.querySelector(`[data-tag-implementation="${implementation}"] [data-tag-surface]`),
  );
}

export function captureTagParts(
  root: HTMLElement,
  rootProperties: readonly string[],
  parts: Record<string, readonly string[]>,
): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties)
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    const rect = element.getBoundingClientRect();
    const hasLayoutBox = element.getClientRects().length > 0;
    values[`${name}.has-layout-box`] = String(hasLayoutBox);
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    // display:none glyphs have no box; their zero viewport origin is not a root-relative offset.
    if (name !== 'root' && hasLayoutBox) {
      values[`${name}.offset.top`] = String(rect.top - rootRect.top);
      values[`${name}.offset.left`] = String(rect.left - rootRect.left);
    }
  };
  capture('root', root, rootProperties);
  for (const [part, properties] of Object.entries(parts)) {
    const elements = [...root.querySelectorAll(`[data-tag-part="${part}"]`)];
    values[`${part}.count`] = String(elements.length);
    elements.forEach((element, index) => capture(`${part}.${index}`, element, properties));
  }
  const avatars = [...root.querySelectorAll('.fui-Avatar')];
  values['avatar.count'] = String(avatars.length);
  avatars.forEach((avatar, index) => {
    capture(`avatar.${index}`, avatar, [
      'display',
      'border-radius',
      'font-size',
      'background-color',
    ]);
    const badge = avatar.querySelector('.fui-PresenceBadge');
    values[`presence.${index}.present`] = String(!!badge);
    if (badge)
      capture(`presence.${index}`, badge, [
        'background-color',
        'border-radius',
        'font-size',
        'color',
      ]);
  });
  const glyphs = [
    ...root.querySelectorAll(
      '[data-tag-part="icon"] > svg, [data-tag-part="dismissIcon"] > svg, [data-tag-part="secondary"] > svg',
    ),
  ];
  values['glyph.count'] = String(glyphs.length);
  glyphs.forEach((glyph, index) =>
    capture(`glyph.${index}`, glyph, ['display', 'font-size', 'line-height', 'color', 'fill']),
  );
  return values;
}

export function captureTagStyles(root: HTMLElement): Record<string, string> {
  return captureTagParts(
    root,
    root.hasAttribute('data-tag-group')
      ? ['display', 'column-gap', 'row-gap', 'flex-wrap', 'align-items', 'box-sizing']
      : tagRootProperties,
    tagPartProperties,
  );
}

export function compareTagStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): TagStyleDifference[] {
  const consumerProperty =
    /^(root|primary\.0)\.(min-width|border-radius)$|^root\.column-gap$|^primaryText\.0\.(padding-bottom|font-size|line-height)$|^icon\.0\.font-size$|^glyph\.0\.font-size$|^secondary\.0\.(border-(left|right)-(width|style|color)|margin-(left|right))$/;
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      kind:
        consumer &&
        (consumerProperty.test(property) ||
          /\.(rect\.(width|height)|offset\.(top|left))$/.test(property))
          ? 'consumer-priority'
          : 'unexpected',
    }));
}

export async function settleTagStyles(...roots: HTMLElement[]): Promise<void> {
  await document.fonts.ready;
  await Promise.all(
    roots.flatMap((root) =>
      [...root.querySelectorAll('img')].map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    ),
  );
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    roots
      .flatMap((root) => root.getAnimations({ subtree: true }))
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
