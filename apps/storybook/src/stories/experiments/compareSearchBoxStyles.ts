// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'align-items',
  'flex-wrap',
  'column-gap',
  'row-gap',
  'box-sizing',
  'vertical-align',
  'min-height',
  'max-width',
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
  'cursor',
] as const;

const inputProperties = [
  'align-self',
  'box-sizing',
  'flex-grow',
  'min-width',
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
  'appearance',
] as const;

const contentProperties = [
  'display',
  'box-sizing',
  'color',
  'padding-left',
  'padding-right',
  'column-gap',
  'overflow-x',
  'overflow-y',
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

export interface SearchBoxStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getSearchBoxSlots(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>(':scope > .fui-SearchBox__input');
  if (!input) throw new Error('Missing native input in SearchBox fixture');
  const contentBefore = root.querySelector<HTMLElement>(':scope > .fui-SearchBox__contentBefore');
  const contentAfter = root.querySelector<HTMLElement>(':scope > .fui-SearchBox__contentAfter');
  const dismiss =
    contentAfter?.querySelector<HTMLElement>(':scope > .fui-SearchBox__dismiss') ?? null;
  return { root, input, contentBefore, contentAfter, dismiss };
}

export function captureSearchBoxStyles(root: HTMLElement): Record<string, string> {
  const slots = getSearchBoxSlots(root);
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
  for (const pseudo of ['decoration', 'cancel-button']) {
    values[`input.search-${pseudo}.display`] = getComputedStyle(
      slots.input,
      `::-webkit-search-${pseudo}`,
    ).display;
  }
  const focusBorder = getComputedStyle(root, '::after');
  for (const property of focusBorderProperties) {
    values[`root.after.${property}`] = focusBorder.getPropertyValue(property);
  }
  for (const name of ['contentBefore', 'contentAfter', 'dismiss'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (!element) continue;
    capture(
      name,
      element,
      name === 'dismiss' ? [...contentProperties, 'cursor'] : contentProperties,
    );
    const icon = element.querySelector(':scope > svg');
    values[`${name}.icon.present`] = String(Boolean(icon));
    if (icon) capture(`${name}.icon`, icon, ['font-size', 'color', 'fill']);
  }
  return values;
}

// Only captured rectangle allocation gets tolerance; CSS property strings stay exact.
const rectangleProperty =
  /^(root|input|contentBefore(?:\.icon)?|contentAfter(?:\.icon)?|dismiss(?:\.icon)?)\.rect\.(width|height)$/;

export function compareSearchBoxStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SearchBoxStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => {
      if (legacy[property] === headless[property]) return false;
      if (
        rectangleProperty.test(property) &&
        legacy[property] !== undefined &&
        headless[property] !== undefined &&
        Math.abs(Number(legacy[property]) - Number(headless[property])) <= 0.5
      ) {
        return false;
      }
      return true;
    })
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonSearchBox(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-searchbox-implementation="${implementation}"] .fui-SearchBox`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} SearchBox in comparison fixture`);
  }
  return root;
}

export async function settleSearchBoxStyles(root: HTMLElement): Promise<void> {
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
