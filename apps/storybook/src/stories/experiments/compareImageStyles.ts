// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'box-sizing',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-radius',
  'box-shadow',
  'object-fit',
  'object-position',
  'direction',
] as const;

export interface ImageStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonImage(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLImageElement {
  const cell = container.querySelector(`[data-implementation="${implementation}"]`);
  const image = cell?.querySelector('.fui-Image');
  if (!(image instanceof HTMLImageElement)) {
    throw new Error(`Missing ${implementation} Image root`);
  }
  return image;
}

export function captureImageStyles(image: HTMLImageElement): Record<string, string> {
  const values: Record<string, string> = {};
  const styles = getComputedStyle(image);
  for (const property of rootProperties) {
    values[`root.${property}`] = styles.getPropertyValue(property);
  }
  const rect = image.getBoundingClientRect();
  values['root.width'] = rect.width.toFixed(2);
  values['root.height'] = rect.height.toFixed(2);
  return values;
}

export function compareImageStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): ImageStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleImage(image: HTMLImageElement): Promise<void> {
  await image.decode();
  if (!image.complete || image.naturalWidth === 0) {
    throw new Error(`Image did not load: ${image.alt}`);
  }
}
