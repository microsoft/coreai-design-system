// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export { compareBadgeStyles as comparePresenceBadgeStyles } from './compareBadgeStyles.js';
export type { BadgeStyleDifference as PresenceBadgeStyleDifference } from './compareBadgeStyles.js';

export interface ComparisonPresenceBadge {
  root: HTMLDivElement;
  icon: HTMLSpanElement | null;
  glyph: SVGSVGElement | null;
}

export function getComparisonPresenceBadge(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonPresenceBadge {
  const cell = container.querySelector(`[data-presencebadge-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-PresenceBadge');
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} PresenceBadge`);
  const icon = root.querySelector<HTMLSpanElement>(':scope > .fui-PresenceBadge__icon');
  return { root, icon, glyph: icon?.querySelector<SVGSVGElement>('svg') ?? null };
}

export function capturePresenceBadgeStyles({
  root,
  icon,
  glyph,
}: ComparisonPresenceBadge): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [slot, element, properties] of [
    [
      'root',
      root,
      [
        'display',
        'box-sizing',
        'align-items',
        'justify-content',
        'color',
        'background-color',
        'background-clip',
        'border-radius',
        'padding-top',
        'padding-bottom',
        'padding-left',
        'padding-right',
        'aspect-ratio',
        'direction',
      ],
    ],
    ['icon', icon, ['display', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right']],
    ['glyph', glyph, ['fill', 'width', 'height', 'forced-color-adjust']],
  ] as const) {
    if (!element) continue;
    const styles = getComputedStyle(element);
    for (const property of properties)
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
  }
  return values;
}

export function capturePresenceBadgeGlyph({ glyph }: ComparisonPresenceBadge) {
  return glyph
    ? {
        viewBox: glyph.getAttribute('viewBox'),
        width: glyph.getAttribute('width'),
        height: glyph.getAttribute('height'),
        ariaHidden: glyph.getAttribute('aria-hidden'),
        paths: [...glyph.querySelectorAll('path')].map((path) => path.getAttribute('d')),
      }
    : null;
}

export async function settlePresenceBadgeStyles({ root }: ComparisonPresenceBadge): Promise<void> {
  await document.fonts.ready;
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
