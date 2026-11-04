// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'flex-wrap',
  'align-items',
  'direction',
  'gap',
  'padding',
] as const;
const itemProperties = [
  'position',
  'font-size',
  'width',
  'height',
  'outline-style',
  'border-top-color',
] as const;
const iconProperties = [
  'display',
  'position',
  'overflow',
  'color',
  'fill',
  'stroke',
  'pointer-events',
  'top',
  'right',
  'bottom',
  'left',
  'margin-left',
  'margin-right',
] as const;
const inputProperties = [
  'position',
  'box-sizing',
  'margin',
  'opacity',
  'cursor',
  'height',
  'width',
  'top',
  'right',
  'bottom',
  'left',
] as const;
const focusProperties = [
  'content',
  'position',
  'pointer-events',
  'z-index',
  'top',
  'right',
  'bottom',
  'left',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-radius',
] as const;

export interface RatingStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getRatingItems(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(':scope > .fui-RatingItem')];
}

export function getComparisonRating(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-rating-implementation="${implementation}"] .fui-Rating`,
  );
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} Rating fixture`);
  return root;
}

export function captureRatingStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const capture = (
    prefix: string,
    element: Element,
    properties: readonly string[],
    relativeTo: Element,
  ) => {
    const style = getComputedStyle(element);
    for (const property of properties) {
      values[`${prefix}.${property}`] = style.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    const relative = relativeTo.getBoundingClientRect();
    values[`${prefix}.rect.width`] = rect.width.toFixed(2);
    values[`${prefix}.rect.height`] = rect.height.toFixed(2);
    values[`${prefix}.offset-left`] = (rect.left - relative.left).toFixed(2);
    values[`${prefix}.offset-top`] = (rect.top - relative.top).toFixed(2);
  };
  capture('root', root, rootProperties, root);
  const items = getRatingItems(root);
  values['items.count'] = String(items.length);
  items.forEach((item, index) => {
    const prefix = `item[${index}]`;
    capture(prefix, item, itemProperties, root);
    const focusStyle = getComputedStyle(item, '::after');
    for (const property of focusProperties) {
      values[`${prefix}.after.${property}`] = focusStyle.getPropertyValue(property);
    }
    for (const name of [
      'selectedIcon',
      'unselectedIcon',
      'halfValueInput',
      'fullValueInput',
    ] as const) {
      const element = item.querySelector(`:scope > .fui-RatingItem__${name}`);
      const key = `${prefix}.${name}`;
      values[`${key}.present`] = String(Boolean(element));
      if (!element) continue;
      capture(key, element, name.endsWith('Input') ? inputProperties : iconProperties, item);
      if (!name.endsWith('Input')) {
        const glyph = element.querySelector(':scope > svg');
        values[`${key}.glyph.present`] = String(Boolean(glyph));
        if (glyph) {
          capture(
            `${key}.glyph`,
            glyph,
            ['color', 'fill', 'width', 'height', 'flex-grow', 'flex-shrink', 'flex-basis'],
            item,
          );
        }
      }
    }
  });
  return values;
}

export function compareRatingStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): RatingStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function assertRatingGeometry(root: HTMLElement): void {
  const items = getRatingItems(root);
  if (!items.length) throw new Error('Rating fixture has no owned rating items');
  for (const element of [root, ...items]) {
    const rect = element.getBoundingClientRect();
    if (
      !Number.isFinite(rect.width) ||
      !Number.isFinite(rect.height) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      throw new Error('Rating fixture has invalid live geometry');
    }
  }
}

export async function settleRatingStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  for (const item of getRatingItems(root)) {
    getComputedStyle(item, '::after').getPropertyValue('content');
  }
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
