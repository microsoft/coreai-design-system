// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = ['display', 'color', 'cursor', 'vertical-align', 'direction'] as const;
const inputProperties = ['position', 'opacity', 'cursor', 'left', 'right'] as const;
const indicatorProperties = [
  'display',
  'align-self',
  'color',
  'background-color',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-radius',
  'font-size',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'pointer-events',
] as const;
const labelProperties = [
  'align-self',
  'color',
  'cursor',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-bottom',
] as const;
const focusProperties = [
  'position',
  'pointer-events',
  'z-index',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-radius',
  'top',
  'right',
  'bottom',
  'left',
] as const;

export interface CheckboxStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getCheckboxSlots(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>(':scope > .fui-Checkbox__input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Missing native input in Checkbox fixture');
  }
  const indicator = root.querySelector<HTMLElement>(':scope > .fui-Checkbox__indicator');
  const label = root.querySelector<HTMLLabelElement>(':scope > .fui-Checkbox__label');
  const required = label?.querySelector<HTMLElement>(':scope > .fui-Label__required') ?? null;
  const glyph = indicator?.querySelector<SVGSVGElement>(':scope > svg') ?? null;
  return { root, input, indicator, label, required, glyph };
}

export function getComparisonCheckbox(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-checkbox-implementation="${implementation}"] > .fui-Checkbox`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} Checkbox in comparison fixture`);
  }
  return root;
}

export function captureCheckboxStyles(root: HTMLElement): Record<string, string> {
  const { input, indicator, label, required, glyph } = getCheckboxSlots(root);
  const values: Record<string, string> = {};
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.width`] = rect.width.toFixed(2);
    values[`${name}.height`] = rect.height.toFixed(2);
  };

  capture('root', root, rootProperties);
  capture('input', input, inputProperties);
  for (const [name, element, properties] of [
    ['indicator', indicator, indicatorProperties],
    ['label', label, labelProperties],
    ['required', required, ['color', 'padding-left', 'padding-right']],
    ['glyph', glyph, ['display', 'visibility', 'fill', 'line-height']],
  ] as const) {
    values[`${name}.present`] = String(Boolean(element));
    if (element) capture(name, element, properties);
  }

  const focus = getComputedStyle(root, '::after');
  values['root.after.content'] = focus.content;
  if (focus.content !== 'none' && focus.content !== 'normal') {
    for (const property of focusProperties) {
      values[`root.after.${property}`] = focus.getPropertyValue(property);
    }
  }
  return values;
}

export function compareCheckboxStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): CheckboxStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleCheckboxStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
