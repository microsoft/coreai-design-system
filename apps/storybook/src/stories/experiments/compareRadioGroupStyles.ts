// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const groupProperties = ['display', 'align-items', 'flex-direction', 'direction', 'gap'] as const;
const rootProperties = [
  'display',
  'position',
  'align-items',
  'flex-direction',
  'direction',
] as const;
const inputProperties = ['position', 'box-sizing', 'opacity', 'cursor'] as const;
const indicatorProperties = [
  'color',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'font-size',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'pointer-events',
] as const;
const labelProperties = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'margin-top',
  'margin-bottom',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'text-align',
  'cursor',
] as const;
const requiredProperties = ['color', 'padding-left', 'padding-right'] as const;
const dotProperties = ['content', 'width', 'height', 'background-color', 'transform'] as const;
const focusProperties = [
  'content',
  'border-top-color',
  'border-top-width',
  'border-radius',
  'top',
  'right',
  'bottom',
  'left',
] as const;
const measuredDimension =
  /^(?:group|(?:radio\d+\.)?(?:root|input|indicator|label|required))\.(?:width|height)$/;
const numericDimension = /^\d+(?:\.\d+)?$/;
const geometryTolerance = 0.5;

export interface RadioGroupStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonRadio {
  root: HTMLSpanElement;
  input: HTMLInputElement;
  indicator: HTMLDivElement;
  label: HTMLLabelElement | null;
  required: HTMLSpanElement | null;
}

export interface ComparisonRadioGroup {
  root: HTMLDivElement;
  radios: ComparisonRadio[];
}

export function getRadioSlots(root: HTMLSpanElement): ComparisonRadio {
  const input = root.querySelector(':scope > .fui-Radio__input');
  const indicator = root.querySelector(':scope > .fui-Radio__indicator');
  const label = root.querySelector<HTMLLabelElement>(':scope > .fui-Radio__label');
  if (!(input instanceof HTMLInputElement) || !(indicator instanceof HTMLDivElement)) {
    throw new Error('Missing Radio input or indicator');
  }
  return {
    root,
    input,
    indicator,
    label,
    required: label?.querySelector<HTMLSpanElement>(':scope > .fui-Label__required') ?? null,
  };
}

export function getComparisonRadioGroup(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonRadioGroup {
  const cell = container.querySelector(`[data-radiogroup-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-RadioGroup');
  if (!(root instanceof HTMLDivElement)) {
    throw new Error(`Missing ${implementation} RadioGroup`);
  }
  return {
    root,
    radios: [...root.querySelectorAll<HTMLSpanElement>('.fui-Radio')].map(getRadioSlots),
  };
}

function captureElement(
  values: Record<string, string>,
  slot: string,
  element: Element | null,
  properties: readonly string[],
  relativeTo?: DOMRect,
) {
  values[`${slot}.present`] = String(Boolean(element));
  if (!element) return;
  const styles = getComputedStyle(element);
  for (const property of properties) {
    values[`${slot}.${property}`] = styles.getPropertyValue(property);
  }
  const rect = element.getBoundingClientRect();
  values[`${slot}.width`] = rect.width.toFixed(2);
  values[`${slot}.height`] = rect.height.toFixed(2);
  if (relativeTo) {
    values[`${slot}.offset-left`] = (rect.left - relativeTo.left).toFixed(2);
    values[`${slot}.offset-top`] = (rect.top - relativeTo.top).toFixed(2);
  }
}

export function captureRadioStyles({
  root,
  input,
  indicator,
  label,
  required,
}: ComparisonRadio): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['input', input, inputProperties],
    ['indicator', indicator, indicatorProperties],
    ['label', label, labelProperties],
    ['required', required, requiredProperties],
  ] as const) {
    captureElement(values, slot, element, properties, slot === 'root' ? undefined : rootRect);
  }
  const dot = getComputedStyle(indicator, '::after');
  for (const property of dotProperties) {
    values[`dot.${property}`] = dot.getPropertyValue(property);
  }
  const customDot = indicator.querySelector('[data-custom-dot]');
  if (customDot) values['custom-dot.opacity'] = getComputedStyle(customDot).opacity;
  const focus = getComputedStyle(root, '::after');
  for (const property of focusProperties) {
    values[`focus.${property}`] = focus.getPropertyValue(property);
  }
  return values;
}

export function captureRadioGroupStyles({
  root,
  radios,
}: ComparisonRadioGroup): Record<string, string> {
  const values: Record<string, string> = {};
  captureElement(values, 'group', root, groupProperties);
  const groupRect = root.getBoundingClientRect();
  for (const [index, radio] of radios.entries()) {
    const rect = radio.root.getBoundingClientRect();
    values[`radio${index}.offset-left`] = (rect.left - groupRect.left).toFixed(2);
    values[`radio${index}.offset-top`] = (rect.top - groupRect.top).toFixed(2);
    for (const [property, value] of Object.entries(captureRadioStyles(radio))) {
      values[`radio${index}.${property}`] = value;
    }
  }
  return values;
}

export function compareRadioGroupStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): RadioGroupStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => {
      const oldValue = legacy[property];
      const newValue = headless[property];
      if (oldValue === newValue) return false;
      // Fractional grid tracks allocate subpixel remainders differently. Only known
      // getBoundingClientRect dimensions have a 0.5 CSSpx tolerance; CSS strings stay exact.
      if (
        measuredDimension.test(property) &&
        oldValue !== undefined &&
        newValue !== undefined &&
        numericDimension.test(oldValue) &&
        numericDimension.test(newValue)
      ) {
        const oldDimension = Number(oldValue);
        const newDimension = Number(newValue);
        if (Number.isFinite(oldDimension) && Number.isFinite(newDimension)) {
          return Math.abs(oldDimension - newDimension) > geometryTolerance;
        }
      }
      return true;
    })
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleRadioGroupStyles({
  root,
}: Pick<ComparisonRadioGroup, 'root'> | Pick<ComparisonRadio, 'root'>): Promise<void> {
  await document.fonts.ready;
  getComputedStyle(root, '::after').getPropertyValue('content');
  for (const indicator of root.querySelectorAll('.fui-Radio__indicator')) {
    getComputedStyle(indicator, '::after').getPropertyValue('content');
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // There are no upstream animations; settle only finite consumer/pseudo-element transitions.
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
