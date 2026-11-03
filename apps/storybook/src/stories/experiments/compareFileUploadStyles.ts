// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const properties = [
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'box-sizing',
  'min-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-radius',
  'background-color',
  'color',
  'cursor',
  'font-family',
  'font-size',
  'line-height',
  'letter-spacing',
  'direction',
  'outline-style',
] as const;

export function getComparisonFileUpload(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLDivElement {
  const root = container.querySelector(`[data-implementation="${implementation}"] .fui-FileUpload`);
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} FileUpload`);
  return root;
}

export function captureFileUploadStyles(root: HTMLElement): Record<string, string> {
  const computed = getComputedStyle(root);
  const values: Record<string, string> = {};
  for (const property of properties) values[property] = computed.getPropertyValue(property);
  const rectangle = root.getBoundingClientRect();
  values.width = rectangle.width.toFixed(2);
  values.height = rectangle.height.toFixed(2);
  return values;
}

export function compareFileUploadStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): { property: string; legacy: string | null; headless: string | null }[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}
