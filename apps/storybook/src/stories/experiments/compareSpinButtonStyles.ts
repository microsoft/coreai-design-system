// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'position',
  'isolation',
  'box-sizing',
  'vertical-align',
  'grid-template-columns',
  'grid-template-rows',
  'column-gap',
  'row-gap',
  'min-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'border-radius',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'outline-style',
  'outline-width',
  'outline-color',
  'cursor',
] as const;

const inputProperties = [
  'grid-column-start',
  'grid-column-end',
  'grid-row-start',
  'grid-row-end',
  'box-sizing',
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
] as const;

const buttonProperties = [
  'display',
  'position',
  'box-sizing',
  'grid-column-start',
  'grid-row-start',
  'width',
  'height',
  'align-items',
  'justify-content',
  'border-top-width',
  'border-top-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'color',
  'outline-style',
  'cursor',
] as const;

const borderProperties = [
  'content',
  'box-sizing',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'pointer-events',
  'z-index',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-bottom-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
] as const;

const focusBorderProperties = [
  'content',
  'box-sizing',
  'position',
  'right',
  'bottom',
  'left',
  'z-index',
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

export interface SpinButtonStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getSpinButtonSlots(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>(':scope > .fui-SpinButton__input');
  const incrementButton = root.querySelector<HTMLButtonElement>(
    ':scope > .fui-SpinButton__incrementButton',
  );
  const decrementButton = root.querySelector<HTMLButtonElement>(
    ':scope > .fui-SpinButton__decrementButton',
  );
  if (!input || !incrementButton || !decrementButton) {
    throw new Error('Missing native input or repeat button in SpinButton fixture');
  }
  return { root, input, incrementButton, decrementButton };
}

export function captureSpinButtonStyles(root: HTMLElement): Record<string, string> {
  const slots = getSpinButtonSlots(root);
  const values: Record<string, string> = {};
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
  };
  capture('root', root, rootProperties);
  capture('input', slots.input, inputProperties);
  for (const property of ['color', 'opacity']) {
    values[`input.placeholder.${property}`] = getComputedStyle(
      slots.input,
      '::placeholder',
    ).getPropertyValue(property);
  }
  for (const [pseudo, properties] of [
    ['before', borderProperties],
    ['after', focusBorderProperties],
  ] as const) {
    const computed = getComputedStyle(root, `::${pseudo}`);
    for (const property of properties) {
      values[`root.${pseudo}.${property}`] = computed.getPropertyValue(property);
    }
  }
  for (const name of ['incrementButton', 'decrementButton'] as const) {
    const element = slots[name];
    capture(name, element, buttonProperties);
    const glyph = element.querySelector(':scope > svg');
    values[`${name}.glyph.present`] = String(Boolean(glyph));
    if (glyph) capture(`${name}.glyph`, glyph, ['color', 'fill', 'width', 'height']);
  }
  return values;
}

export function compareSpinButtonStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SpinButtonStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonSpinButton(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-spinbutton-implementation="${implementation}"] .fui-SpinButton`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} SpinButton in comparison fixture`);
  }
  return root;
}

export async function settleSpinButtonStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
