// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'direction',
  'text-align',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-style',
  'text-decoration-thickness',
  'outline-style',
  'cursor',
  'border-top-style',
  'overflow',
  'text-overflow',
  'column-gap',
  'align-items',
] as const;

const iconProperties = ['display', 'color', 'fill', 'font-size', 'line-height'] as const;

export interface ComparisonLink {
  root: HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement;
  externalIcon: SVGSVGElement | null;
  contentIcon: SVGSVGElement | null;
}

export interface LinkStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonLink(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonLink {
  const cell = container.querySelector(`[data-link-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Link');
  if (
    !(root instanceof HTMLAnchorElement) &&
    !(root instanceof HTMLButtonElement) &&
    !(root instanceof HTMLSpanElement)
  ) {
    throw new Error(`Missing ${implementation} Link root`);
  }
  return {
    root,
    externalIcon: root.querySelector<SVGSVGElement>(':scope > svg[data-fui-icon]'),
    contentIcon: root.querySelector<SVGSVGElement>('svg[data-parity-child-icon]'),
  };
}

export function captureLinkStyles({
  root,
  externalIcon,
  contentIcon,
}: ComparisonLink): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['externalIcon', externalIcon, iconProperties],
    ['contentIcon', contentIcon, iconProperties],
  ] as const) {
    if (!element) continue;
    const styles = getComputedStyle(element);
    for (const property of properties) {
      let value = styles.getPropertyValue(property);
      // Compare effective alignment rather than the equivalent logical/physical spelling.
      if (property === 'text-align' && value === 'start') {
        value = styles.direction === 'rtl' ? 'right' : 'left';
      }
      values[`${slot}.${property}`] = value;
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
  }
  return values;
}

export function compareLinkStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): LinkStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleLinkStyles({ root }: ComparisonLink): Promise<void> {
  await document.fonts.ready;
  // Native getAnimations includes descendant and pseudo-element animations.
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
