// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  captureInputStyles,
  compareInputStyles,
  getInputSlots,
  settleInputStyles,
} from './compareInputStyles.js';

export interface DateTimePickerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonDateTimePicker(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-date-time-picker-implementation="${implementation}"] .fui-Input`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} DateTimePicker comparison fixture`);
  }
  return root;
}

export function getDateTimePickerSlots(root: HTMLElement) {
  const inputSlots = getInputSlots(root);
  const pickerButton = root.querySelector<HTMLButtonElement>('button[aria-label^="Open "]');
  if (!pickerButton) throw new Error('Missing native picker action');
  const clearButton = root.querySelector<HTMLButtonElement>('button[aria-label="Clear value"]');
  return { ...inputSlots, pickerButton, clearButton };
}

export function captureDateTimePickerStyles(root: HTMLElement): Record<string, string> {
  const values = captureInputStyles(root);
  const { input, pickerButton, clearButton } = getDateTimePickerSlots(root);
  values['input.native-indicator.display'] = getComputedStyle(
    input,
    '::-webkit-calendar-picker-indicator',
  ).display;
  for (const [name, button] of [
    ['pickerButton', pickerButton],
    ['clearButton', clearButton],
  ] as const) {
    values[`${name}.present`] = String(Boolean(button));
    if (!button) continue;
    const computed = getComputedStyle(button);
    for (const property of [
      'display',
      'align-items',
      'justify-content',
      'background-color',
      'color',
      'border-radius',
      'border-top-color',
      'border-top-width',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'min-width',
      'max-width',
      'cursor',
    ]) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = button.getBoundingClientRect();
    values[`${name}.width`] = rect.width.toFixed(2);
    values[`${name}.height`] = rect.height.toFixed(2);
    values[`${name}.disabled`] = String(button.disabled);
    for (const variant of ['filled', 'regular']) {
      const icon = button.querySelector<SVGElement>(`.fui-Icon-${variant}`);
      values[`${name}.${variant}.present`] = String(Boolean(icon));
      if (!icon) continue;
      const iconStyle = getComputedStyle(icon);
      values[`${name}.${variant}.display`] = iconStyle.display;
      values[`${name}.${variant}.color`] = iconStyle.color;
      const iconRect = icon.getBoundingClientRect();
      values[`${name}.${variant}.width`] = iconRect.width.toFixed(2);
      values[`${name}.${variant}.height`] = iconRect.height.toFixed(2);
    }
  }
  return values;
}

export function compareDateTimePickerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): DateTimePickerStyleDifference[] {
  return compareInputStyles(legacy, headless);
}

export const settleDateTimePickerStyles = settleInputStyles;
