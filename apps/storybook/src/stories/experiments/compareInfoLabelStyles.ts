// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { compareFieldStyles, type FieldStyleDifference } from './compareFieldStyles.js';
import { settlePopoverStyles } from './comparePopoverStyles.js';

export type InfoLabelStyleDifference = FieldStyleDifference;

export interface ComparisonInfoLabel {
  root: HTMLElement;
  label: HTMLLabelElement;
  button: HTMLButtonElement | null;
  required: HTMLElement | null;
  control: HTMLInputElement;
}

export function getComparisonInfoLabel(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonInfoLabel {
  const cell = container.querySelector(`[data-infolabel-implementation="${implementation}"]`);
  const root = cell?.querySelector<HTMLElement>('.fui-InfoLabel');
  const label = root?.querySelector<HTMLLabelElement>('.fui-InfoLabel__label');
  const control = cell?.querySelector('input');
  if (!root || !label || !(control instanceof HTMLInputElement)) {
    throw new Error(`Missing ${implementation} InfoLabel fixture`);
  }
  return {
    root,
    label,
    button: root.querySelector<HTMLButtonElement>('.fui-InfoLabel__infoButton'),
    required: label.querySelector<HTMLElement>('.fui-Label__required'),
    control,
  };
}

export function captureInfoLabelStyles({
  root,
  label,
  button,
  required,
}: ComparisonInfoLabel): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, element, properties] of [
    ['root', root, ['display', 'color', 'cursor']],
    [
      'label',
      label,
      [
        'display',
        'color',
        'cursor',
        'vertical-align',
        'font-family',
        'font-size',
        'font-weight',
        'line-height',
      ],
    ],
    ['required', required, ['display', 'color', 'font-size', 'padding-left', 'padding-right']],
    [
      'button',
      button,
      [
        'display',
        'color',
        'vertical-align',
        'margin-top',
        'margin-bottom',
        'padding-top',
        'padding-left',
      ],
    ],
  ] as const) {
    values[`${name}.present`] = String(Boolean(element));
    if (!element) continue;
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.width`] = String(rect.width);
    values[`${name}.height`] = String(rect.height);
  }
  for (const variant of ['regular', 'filled'] as const) {
    const glyph = button?.querySelector<SVGElement>(
      `[data-info-glyph="${variant}"], .fui-Icon-${variant}`,
    );
    values[`glyph.${variant}.present`] = String(Boolean(glyph));
    if (glyph) {
      values[`glyph.${variant}.display`] = getComputedStyle(glyph).display;
      values[`glyph.${variant}.width`] = String(glyph.getBoundingClientRect().width);
      values[`glyph.${variant}.height`] = String(glyph.getBoundingClientRect().height);
    }
  }
  return values;
}

export const compareInfoLabelStyles = compareFieldStyles;

export async function settleInfoLabelStyles({ root }: ComparisonInfoLabel): Promise<void> {
  return settlePopoverStyles(root);
}
