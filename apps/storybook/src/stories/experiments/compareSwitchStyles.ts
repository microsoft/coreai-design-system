// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'box-sizing',
  'align-items',
  'flex-direction',
  'direction',
] as const;
const inputProperties = ['position', 'box-sizing', 'opacity', 'cursor'] as const;
const indicatorProperties = [
  'color',
  'background-color',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'font-size',
  'line-height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'pointer-events',
  'transition-duration',
] as const;
const thumbProperties = ['display', 'color', 'fill', 'transform', 'transition-duration'] as const;
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
  'cursor',
] as const;
const requiredProperties = ['color', 'padding-left', 'padding-right'] as const;
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

export interface SwitchStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonSwitch {
  root: HTMLDivElement;
  input: HTMLInputElement;
  indicator: HTMLDivElement;
  thumb: Element | null;
  label: HTMLLabelElement | null;
  required: HTMLSpanElement | null;
}

export function getComparisonSwitch(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonSwitch {
  const cell = container.querySelector(`[data-switch-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Switch');
  const input = root?.querySelector(':scope > .fui-Switch__input');
  const indicator = root?.querySelector(':scope > .fui-Switch__indicator');
  if (
    !(root instanceof HTMLDivElement) ||
    !(input instanceof HTMLInputElement) ||
    !(indicator instanceof HTMLDivElement)
  ) {
    throw new Error(`Missing ${implementation} Switch root, input, or indicator`);
  }
  const label = root.querySelector<HTMLLabelElement>(':scope > .fui-Switch__label');
  return {
    root,
    input,
    indicator,
    thumb: indicator.firstElementChild,
    label,
    required: label?.querySelector<HTMLSpanElement>(':scope > .fui-Label__required') ?? null,
  };
}

export function captureSwitchStyles({
  root,
  input,
  indicator,
  thumb,
  label,
  required,
}: ComparisonSwitch): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['input', input, inputProperties],
    ['indicator', indicator, indicatorProperties],
    ['thumb', thumb, thumbProperties],
    ['label', label, labelProperties],
    ['required', required, requiredProperties],
  ] as const) {
    values[`${slot}.present`] = String(Boolean(element));
    if (!element) continue;
    const styles = getComputedStyle(element);
    for (const property of properties) {
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
    if (slot !== 'root' && slot !== 'required') {
      values[`${slot}.offset-left`] = (rect.left - rootRect.left).toFixed(2);
      values[`${slot}.offset-top`] = (rect.top - rootRect.top).toFixed(2);
    }
  }
  const focus = getComputedStyle(root, '::after');
  for (const property of focusProperties) {
    values[`focus.${property}`] = focus.getPropertyValue(property);
  }
  return values;
}

export function compareSwitchStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SwitchStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleSwitchStyles({
  root,
  indicator,
  thumb,
}: Pick<ComparisonSwitch, 'root' | 'indicator' | 'thumb'>): Promise<void> {
  await document.fonts.ready;
  // Flush state/pseudo-element styles before enumerating track and thumb transitions.
  getComputedStyle(indicator).getPropertyValue('background-color');
  if (thumb) getComputedStyle(thumb).getPropertyValue('transform');
  getComputedStyle(root, '::after').getPropertyValue('content');
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
