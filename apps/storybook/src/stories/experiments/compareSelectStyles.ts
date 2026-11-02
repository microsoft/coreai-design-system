// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'align-items',
  'box-sizing',
  'flex-wrap',
  'font-family',
  'min-width',
  'position',
] as const;

const selectProperties = [
  'appearance',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-width',
  'border-bottom-width',
  'border-top-style',
  'border-bottom-style',
  'border-radius',
  'box-shadow',
  'box-sizing',
  'color',
  'cursor',
  'flex-grow',
  'max-width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'outline-color',
  'outline-style',
  'outline-width',
] as const;

const iconProperties = [
  'box-sizing',
  'color',
  'display',
  'position',
  'pointer-events',
  'font-size',
  'inset-inline-end',
] as const;

const focusBorderProperties = [
  'background-image',
  'border-radius',
  'box-sizing',
  'content',
  'height',
  'position',
  'bottom',
  'left',
  'right',
  'transform',
  'transition-property',
  'transition-duration',
  'transition-delay',
] as const;

export interface SelectStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getSelectSlots(root: HTMLElement) {
  const select = root.querySelector<HTMLSelectElement>(':scope > .fui-Select__select');
  if (!select) throw new Error('Missing native select in Select fixture');
  const icon = root.querySelector<HTMLElement>(':scope > .fui-Select__icon');
  return { root, select, icon };
}

export function captureSelectStyles(root: HTMLElement): Record<string, string> {
  const slots = getSelectSlots(root);
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
  capture('select', slots.select, selectProperties);
  const focusBorder = getComputedStyle(root, '::after');
  for (const property of focusBorderProperties) {
    values[`root.after.${property}`] = focusBorder.getPropertyValue(property);
  }
  const option = slots.select.querySelector('option');
  if (option) values['option.background-color'] = getComputedStyle(option).backgroundColor;
  values['icon.present'] = String(Boolean(slots.icon));
  if (slots.icon) {
    capture('icon', slots.icon, iconProperties);
    const glyph = slots.icon.querySelector('svg');
    values['icon.svg.present'] = String(Boolean(glyph));
    if (glyph) {
      capture('icon.svg', glyph, ['display', 'fill', 'font-size', 'forced-color-adjust']);
    }
  }
  return values;
}

export function compareSelectStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SelectStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonSelect(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-select-implementation="${implementation}"] .fui-Select`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} Select in comparison fixture`);
  }
  return root;
}

export async function settleSelectStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
