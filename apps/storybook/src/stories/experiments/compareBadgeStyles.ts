// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'box-sizing',
  'position',
  'align-items',
  'justify-content',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'min-width',
  'border-radius',
  'border-top-color',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'direction',
] as const;
const iconProperties = [
  'display',
  'color',
  'font-size',
  'line-height',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
] as const;

export interface BadgeStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonBadge {
  root: HTMLDivElement;
  icon: HTMLSpanElement | null;
}

export function getComparisonBadge(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonBadge {
  const cell = container.querySelector(`[data-badge-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Badge');
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} Badge`);
  return { root, icon: root.querySelector<HTMLSpanElement>(':scope > .fui-Badge__icon') };
}

export function captureBadgeStyles({ root, icon }: ComparisonBadge): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['icon', icon, iconProperties],
  ] as const) {
    if (!element) continue;
    const styles = getComputedStyle(element);
    for (const property of properties)
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
    if (slot === 'icon') {
      values['icon.offset-left'] = (rect.left - rootRect.left).toFixed(2);
      values['icon.offset-top'] = (rect.top - rootRect.top).toFixed(2);
    }
  }
  const stroke = getComputedStyle(root, '::after');
  for (const property of [
    'content',
    'display',
    'position',
    'border-top-width',
    'border-top-style',
    'border-top-color',
    'border-radius',
  ]) {
    values[`root::after.${property}`] = stroke.getPropertyValue(property);
  }
  return values;
}

export function compareBadgeStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): BadgeStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleBadgeStyles({ root }: ComparisonBadge): Promise<void> {
  await document.fonts.ready;
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
