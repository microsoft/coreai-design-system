// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const textProperties = [
  'display',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-transform',
  'text-decoration-line',
  'white-space',
  'overflow-x',
  'overflow-y',
  'text-overflow',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'direction',
] as const;

export interface TextStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonText(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(`[data-implementation="${implementation}"] > .fui-Text`);
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} Text`);
  return root;
}

export function captureTextStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const styles = getComputedStyle(root);
  for (const property of textProperties) {
    values[property] = styles.getPropertyValue(property);
  }
  const rect = root.getBoundingClientRect();
  values.width = rect.width.toFixed(2);
  values.height = rect.height.toFixed(2);
  return values;
}

export function compareTextStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): TextStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleTextStyles(root: HTMLElement): Promise<void> {
  await root.ownerDocument.fonts.ready;
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
