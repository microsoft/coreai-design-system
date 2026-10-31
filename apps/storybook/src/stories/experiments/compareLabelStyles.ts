// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'direction',
] as const;

const requiredProperties = [
  'display',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'padding-left',
  'padding-right',
] as const;

export interface LabelStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonLabel {
  root: HTMLLabelElement;
  required: HTMLSpanElement | null;
  control: HTMLInputElement;
}

export function getComparisonLabel(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonLabel {
  const cell = container.querySelector(`[data-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Label');
  const control = cell?.querySelector('input');
  if (!(root instanceof HTMLLabelElement) || !(control instanceof HTMLInputElement)) {
    throw new Error(`Missing ${implementation} Label or associated native input`);
  }
  return {
    root,
    required: root.querySelector<HTMLSpanElement>(':scope > span.fui-Label__required'),
    control,
  };
}

export function captureLabelStyles({
  root,
  required,
}: ComparisonLabel): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['required', required, requiredProperties],
  ] as const) {
    if (!element) continue;
    const styles = getComputedStyle(element);
    for (const property of properties) {
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
  }
  return values;
}

export function compareLabelStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): LabelStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleLabelStyles({ root }: ComparisonLabel): Promise<void> {
  await document.fonts.ready;
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
