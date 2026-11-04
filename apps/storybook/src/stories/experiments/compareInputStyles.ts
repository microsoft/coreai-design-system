// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'align-items',
  'flex-wrap',
  'gap',
  'box-sizing',
  'vertical-align',
  'min-height',
  'background-color',
  'border-top-color',
  'border-bottom-color',
  'border-top-width',
  'border-bottom-width',
  'border-top-style',
  'border-left-style',
  'border-radius',
  'padding-left',
  'padding-right',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'outline-style',
  'outline-width',
  'outline-color',
  'box-shadow',
  'cursor',
] as const;

const inputProperties = [
  'align-self',
  'box-sizing',
  'flex-grow',
  'min-width',
  'max-width',
  'border-top-width',
  'border-top-style',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'outline-style',
  'cursor',
  'overflow-x',
  'text-overflow',
  'white-space',
  'field-sizing',
] as const;

const contentProperties = [
  'display',
  'box-sizing',
  'color',
  'margin-left',
  'margin-right',
] as const;

const focusBorderProperties = [
  'content',
  'box-sizing',
  'position',
  'left',
  'right',
  'bottom',
  'height',
  'border-bottom-color',
  'border-bottom-style',
  'border-bottom-width',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'clip-path',
  'transform',
  'transition-property',
  'transition-duration',
  'transition-delay',
] as const;

export interface InputStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getInputSlots(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>(':scope > .fui-Input__input');
  if (!input) throw new Error('Missing native input in Input fixture');
  const contentBefore = root.querySelector<HTMLElement>(':scope > .fui-Input__contentBefore');
  const contentAfter = root.querySelector<HTMLElement>(':scope > .fui-Input__contentAfter');
  const label = contentBefore?.querySelector<HTMLElement>(':scope > .fui-Input__label') ?? null;
  return { root, input, contentBefore, contentAfter, label };
}

export function captureInputStyles(root: HTMLElement): Record<string, string> {
  const slots = getInputSlots(root);
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
  capture('input', slots.input, inputProperties);
  const placeholder = getComputedStyle(slots.input, '::placeholder');
  values['input.placeholder.color'] = placeholder.color;
  values['input.placeholder.opacity'] = placeholder.opacity;
  const focusBorder = getComputedStyle(root, '::after');
  for (const property of focusBorderProperties) {
    values[`root.after.${property}`] = focusBorder.getPropertyValue(property);
  }

  for (const name of ['contentBefore', 'contentAfter'] as const) {
    const slot = slots[name];
    values[`${name}.present`] = String(Boolean(slot));
    if (slot) {
      capture(name, slot, contentProperties);
      const icon = slot.querySelector(':scope > svg');
      if (icon) capture(`${name}.icon`, icon, ['font-size']);
    }
  }

  values['label.present'] = String(Boolean(slots.label));
  if (slots.label) {
    capture('label', slots.label, [
      'color',
      'cursor',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
    ]);
    values['label.after.content'] = getComputedStyle(slots.label, '::after').content;
  }
  return values;
}

export function compareInputStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): InputStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonInput(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-input-implementation="${implementation}"] > .fui-Input`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} Input in comparison fixture`);
  }
  return root;
}

export async function settleInputStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
