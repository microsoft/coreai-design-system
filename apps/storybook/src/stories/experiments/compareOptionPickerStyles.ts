// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { PickerImplementation } from './OptionPickerComparison.js';

export { refreshPopoverComparisonPositioning as refreshOptionPickerPositioning } from './comparePopoverStyles.js';

const rootProperties = [
  'display',
  'box-sizing',
  'vertical-align',
  'align-items',
  'column-gap',
  'min-width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-bottom-color',
  'border-radius',
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'cursor',
] as const;
const triggerProperties = [
  'display',
  'box-sizing',
  'align-self',
  'align-items',
  'column-gap',
  'grid-template-columns',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-top-style',
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'text-overflow',
  'cursor',
] as const;
const popupProperties = [
  'display',
  'box-sizing',
  'flex-direction',
  'min-width',
  'max-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'row-gap',
  'background-color',
  'border-radius',
  'border-top-width',
  'box-shadow',
  'outline-width',
  'outline-style',
  'outline-color',
  'overflow-y',
] as const;
const optionProperties = [
  'display',
  'position',
  'align-items',
  'box-sizing',
  'column-gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-radius',
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'cursor',
] as const;
const iconProperties = [
  'display',
  'position',
  'box-sizing',
  'color',
  'font-size',
  'margin-left',
  'margin-right',
  'visibility',
  'cursor',
] as const;
const checkProperties = [
  'display',
  'visibility',
  'box-sizing',
  'flex-shrink',
  'font-size',
  'color',
  'background-color',
  'border-top-width',
  'border-top-color',
  'border-radius',
  'margin-left',
  'margin-right',
] as const;
const labelProperties = [
  'display',
  'align-self',
  'color',
  'font-size',
  'font-weight',
  'line-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const;

export interface OptionPickerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'native-sizing';
}

export function expectedOptionPickerMaxHeight(viewportHeight = window.innerHeight): string {
  // The exact 4/5 ratio avoids serializing 896 * 0.8 as 716.8000000000001.
  return `${(viewportHeight * 4) / 5}px`;
}

export function getComparisonPicker(
  container: ParentNode,
  implementation: PickerImplementation,
): HTMLElement {
  const root = container.querySelector(
    `[data-picker-implementation="${implementation}"] :is(.fui-Combobox, .fui-Dropdown, .fui-Listbox)`,
  );
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} picker root`);
  return root;
}

export function getComparisonPickerPopup(
  container: HTMLElement,
  implementation: PickerImplementation,
): HTMLElement | null {
  const comparison = container.matches('[data-picker-comparison]')
    ? container
    : container.querySelector<HTMLElement>('[data-picker-comparison]');
  const fixture = comparison?.dataset.pickerComparison;
  if (!fixture) throw new Error('Missing option-picker fixture identity');
  const popup = [...document.querySelectorAll<HTMLElement>('[data-picker-popup]')].find(
    (candidate) =>
      candidate.dataset.pickerPopup === fixture &&
      candidate.dataset.pickerImplementation === implementation,
  );
  return popup ?? null;
}

export function getPickerTrigger(root: HTMLElement): HTMLInputElement | HTMLButtonElement {
  const trigger = root.querySelector('.fui-Combobox__input, .fui-Dropdown__button');
  if (!(trigger instanceof HTMLInputElement || trigger instanceof HTMLButtonElement)) {
    throw new Error('Missing native picker trigger');
  }
  return trigger;
}

export function captureOptionPickerStyles(
  root: HTMLElement,
  popup: HTMLElement | null,
): Record<string, string> {
  const values: Record<string, string> = {};
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
  };
  capture('root', root, rootProperties);
  const trigger = root.querySelector('.fui-Combobox__input, .fui-Dropdown__button');
  if (trigger) capture('trigger', trigger, triggerProperties);
  if (trigger instanceof HTMLInputElement) {
    for (const property of ['color', 'opacity']) {
      values[`placeholder.${property}`] = getComputedStyle(
        trigger,
        '::placeholder',
      ).getPropertyValue(property);
    }
  }
  for (const name of ['expandIcon', 'clearIcon', 'clearButton'] as const) {
    const icon = root.querySelector(`.fui-Combobox__${name}, .fui-Dropdown__${name}`);
    values[`${name}.present`] = String(Boolean(icon));
    if (icon) {
      capture(name, icon, iconProperties);
      const svg = icon.querySelector('svg');
      values[`${name}.glyph.present`] = String(Boolean(svg));
      if (svg) capture(`${name}.glyph`, svg, ['color', 'fill', 'width', 'height']);
    }
  }
  const inlineLabel = root.querySelector('[data-inline-label]');
  values['inlineLabel.present'] = String(Boolean(inlineLabel));
  if (inlineLabel) {
    capture('inlineLabel', inlineLabel, labelProperties);
    values['inlineLabel.after.content'] = getComputedStyle(inlineLabel, '::after').content;
  }
  for (const property of [
    'content',
    'height',
    'border-bottom-color',
    'border-bottom-width',
    'clip-path',
    'transform',
    'transition-duration',
    'transition-delay',
  ]) {
    values[`root.after.${property}`] = getComputedStyle(root, '::after').getPropertyValue(property);
  }
  values['popup.present'] = String(Boolean(popup));
  if (popup) {
    capture('popup', popup, popupProperties);
    if (root !== popup) {
      const target = root.getBoundingClientRect();
      const surface = popup.getBoundingClientRect();
      values['popup.offset.inline'] = String(surface.left - target.left);
      values['popup.offset.block'] = String(surface.top - target.bottom);
    }
    [...popup.querySelectorAll('.fui-Option')].forEach((option, index) => {
      capture(`option.${index}`, option, optionProperties);
      const check = option.querySelector('.fui-Option__checkIcon');
      values[`check.${index}.present`] = String(Boolean(check));
      if (check) {
        capture(`check.${index}`, check, checkProperties);
        const svg = check.querySelector('svg');
        values[`check.${index}.glyph.present`] = String(Boolean(svg));
        if (svg) capture(`check.${index}.glyph`, svg, ['width', 'height', 'fill']);
      }
    });
    [...popup.querySelectorAll('.fui-OptionGroup')].forEach((group, index) => {
      capture(`group.${index}`, group, ['display', 'flex-direction', 'row-gap']);
      const label = group.querySelector('.fui-OptionGroup__label');
      if (label) capture(`group.${index}.label`, label, labelProperties);
      for (const property of [
        'content',
        'padding-bottom',
        'margin-bottom',
        'border-bottom-color',
      ]) {
        values[`group.${index}.after.${property}`] = getComputedStyle(
          group,
          '::after',
        ).getPropertyValue(property);
      }
    });
  }
  return values;
}

export function compareOptionPickerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): OptionPickerStyleDifference[] {
  const samePopupRectangle =
    legacy['popup.rect.width'] !== undefined &&
    legacy['popup.rect.height'] !== undefined &&
    legacy['popup.rect.width'] === headless['popup.rect.width'] &&
    legacy['popup.rect.height'] === headless['popup.rect.height'];
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map<OptionPickerStyleDifference>((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
      // Legacy maxSize replaces authored 80vh. Keep that visible without accepting actual clipping.
      kind:
        property === 'popup.max-height' &&
        headless[property] === expectedOptionPickerMaxHeight() &&
        samePopupRectangle
          ? 'native-sizing'
          : 'unexpected',
    }));
}

export function captureOptionPickerNativeContract(root: HTMLElement, popup: HTMLElement | null) {
  return {
    popover: popup?.getAttribute('popover') ?? '(inline or absent)',
    open: String(popup?.matches(':popover-open') ?? false),
    display: popup ? getComputedStyle(popup).display : '(unmounted)',
    position: popup ? getComputedStyle(popup).position : '(unmounted)',
    anchor: root.style.getPropertyValue('anchor-name'),
    positionAnchor: popup?.style.getPropertyValue('position-anchor') ?? '',
    positionArea: popup?.style.getPropertyValue('position-area') ?? '',
    fallbacks: popup?.style.getPropertyValue('position-try-fallbacks') ?? '',
  };
}

export async function settleOptionPickerStyles(...elements: Element[]): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    elements.flatMap((element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) =>
          Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
