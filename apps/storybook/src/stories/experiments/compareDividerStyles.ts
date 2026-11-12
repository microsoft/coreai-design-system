// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'box-sizing',
  'display',
  'position',
  'flex-direction',
  'flex-grow',
  'align-items',
  'min-height',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  'padding-inline-start',
  'padding-inline-end',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-inline-start-width',
  'border-inline-end-width',
  'border-inline-end-style',
  'border-inline-end-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'direction',
] as const;
const wrapperProperties = ['display', 'font-size', 'font-weight', 'line-height', 'color'] as const;
const pseudoProperties = [
  'content',
  'display',
  'box-sizing',
  'flex-grow',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'width',
  'height',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-inline-start-width',
  'border-inline-end-width',
  'border-inline-end-style',
  'border-inline-end-color',
] as const;

export interface ComparisonDivider {
  root: HTMLElement;
  wrapper: HTMLDivElement | null;
}

export interface DividerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonDivider(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonDivider {
  const cell = container.querySelector(`[data-divider-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Divider');
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} Divider root`);
  return {
    root,
    wrapper: root.querySelector<HTMLDivElement>(':scope > .fui-Divider__wrapper'),
  };
}

export function captureDividerStyles({ root, wrapper }: ComparisonDivider): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['wrapper', wrapper, wrapperProperties],
  ] as const) {
    values[`${slot}.present`] = String(Boolean(element));
    if (!element) continue;
    const styles = getComputedStyle(element);
    for (const property of properties) {
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
    if (slot === 'wrapper') {
      values['wrapper.offset-inline'] = (
        getComputedStyle(root).direction === 'rtl'
          ? rootRect.right - rect.right
          : rect.left - rootRect.left
      ).toFixed(2);
      values['wrapper.offset-block'] = (rect.top - rootRect.top).toFixed(2);
    }
  }

  const rootStyle = getComputedStyle(root);
  // Griffel flips left/right; native logical start/end expresses the same effective alignment.
  const textAlign = rootStyle.textAlign;
  values['root.effective-text-align'] =
    textAlign === 'start'
      ? rootStyle.direction === 'rtl'
        ? 'right'
        : 'left'
      : textAlign === 'end'
        ? rootStyle.direction === 'rtl'
          ? 'left'
          : 'right'
        : textAlign;

  for (const pseudo of ['::before', '::after']) {
    const styles = getComputedStyle(root, pseudo);
    for (const property of pseudoProperties) {
      values[`root${pseudo}.${property}`] = styles.getPropertyValue(property);
    }
  }
  return values;
}

export function compareDividerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): DividerStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleDividerStyles({ root }: ComparisonDivider): Promise<void> {
  await document.fonts.ready;
  getComputedStyle(root, '::before').getPropertyValue('content');
  getComputedStyle(root, '::after').getPropertyValue('content');
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
