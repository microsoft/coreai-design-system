// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { TagPickerImplementation } from './TagPickerComparison.js';
import { captureTagStyles } from './compareTagStyles.js';
import { settleOptionPickerStyles } from './compareOptionPickerStyles.js';

export { refreshPopoverComparisonPositioning as refreshTagPickerPositioning } from './comparePopoverStyles.js';

const controlProperties = [
  'display',
  'box-sizing',
  'align-items',
  'column-gap',
  'flex-wrap',
  'min-width',
  'min-height',
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
  'cursor',
] as const;
const triggerProperties = [
  'display',
  'position',
  'box-sizing',
  'flex-grow',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'background-color',
  'border-top-width',
  'min-width',
  'min-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'text-align',
  'clip',
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
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'cursor',
] as const;

export interface TagPickerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'native-maximum' | 'consumer-priority';
}

export async function settleTagPickerStyles(...elements: Element[]): Promise<void> {
  await settleOptionPickerStyles(...elements);
  const controls = elements.filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && element.matches('.fui-TagPickerControl'),
  );
  let previous: string | undefined;
  let stableFrames = 0;
  const recent: string[] = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const current = JSON.stringify(
      elements.flatMap((element) =>
        [
          element,
          ...element.querySelectorAll(
            '.fui-TagPickerGroup, .fui-TagPickerInput, .fui-TagPickerButton, .fui-TagPickerControl__aside',
          ),
        ].map((part) => {
          const box = part.getBoundingClientRect();
          return [
            box.width,
            box.height,
            part instanceof HTMLElement
              ? part.style.getPropertyValue('--fui-TagPickerControl-aside-width')
              : '',
            part instanceof HTMLInputElement
              ? part.style.getPropertyValue('--fluent-TagPickerInput__width')
              : '',
          ];
        }),
      ),
    );
    if (current !== previous) {
      recent.push(current);
      if (recent.length > 3) recent.shift();
    }
    stableFrames = current === previous ? stableFrames + 1 : 0;
    previous = current;
    if (stableFrames >= 2) return;
  }
  throw new Error(
    `TagPicker sizing observers did not settle within 20 animation frames: ${JSON.stringify({
      measurements: controls.map((control) =>
        control.style.getPropertyValue('--fui-TagPickerControl-aside-width'),
      ),
      recent,
    })}`,
  );
}

export function tagPickerHTML(element: Element | null): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML TagPicker element');
  return element;
}

export function getComparisonTagPicker(
  container: ParentNode,
  implementation: TagPickerImplementation,
): HTMLElement {
  return tagPickerHTML(
    container.querySelector(
      `[data-tagpicker-implementation="${implementation}"] [data-tagpicker-control]`,
    ),
  );
}

export function getTagPickerPopup(
  container: HTMLElement,
  implementation: TagPickerImplementation,
): HTMLElement | null {
  const comparison = container.matches('[data-tagpicker-comparison]')
    ? container
    : container.querySelector('[data-tagpicker-comparison]');
  const identity = comparison?.getAttribute('data-tagpicker-comparison');
  if (!identity) throw new Error('Missing TagPicker comparison identity');
  return (
    [...document.querySelectorAll<HTMLElement>('[data-tagpicker-popup]')].find(
      (popup) =>
        popup.dataset.tagpickerPopup === identity &&
        popup.dataset.tagpickerImplementation === implementation,
    ) ?? null
  );
}

export function getTagPickerTrigger(control: ParentNode): HTMLInputElement | HTMLButtonElement {
  const trigger = control.querySelector('[data-tagpicker-trigger]');
  if (!(trigger instanceof HTMLInputElement || trigger instanceof HTMLButtonElement)) {
    throw new Error('Missing native TagPicker trigger');
  }
  return trigger;
}

export function captureTagPickerStyles(
  control: HTMLElement,
  popup: HTMLElement | null,
): Record<string, string> {
  const values: Record<string, string> = {};
  const origin = control.getBoundingClientRect();
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties)
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = String(rect.width);
    values[`${name}.rect.height`] = String(rect.height);
    if (name !== 'popup') {
      values[`${name}.offset.top`] = String(rect.top - origin.top);
      values[`${name}.offset.left`] = String(rect.left - origin.left);
    }
  };
  capture('control', control, controlProperties);
  const trigger = getTagPickerTrigger(control);
  capture('trigger', trigger, triggerProperties);
  if (trigger instanceof HTMLInputElement) {
    for (const property of ['color', 'opacity']) {
      values[`placeholder.${property}`] = getComputedStyle(
        trigger,
        '::placeholder',
      ).getPropertyValue(property);
    }
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
    values[`control.after.${property}`] = getComputedStyle(control, '::after').getPropertyValue(
      property,
    );
  }
  const group = control.querySelector('.fui-TagPickerGroup');
  values['selectedGroup.present'] = String(Boolean(group));
  if (group) {
    capture('selectedGroup', group, [
      'display',
      'flex-wrap',
      'box-sizing',
      'column-gap',
      'row-gap',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'cursor',
    ]);
  }
  const tags = [...control.querySelectorAll<HTMLElement>('[data-tagpicker-part="tag"]')];
  values['tag.count'] = String(tags.length);
  tags.forEach((tag, index) => {
    for (const [property, value] of Object.entries(captureTagStyles(tag)))
      values[`tag.${index}.${property}`] = value;
  });
  for (const name of ['expandIcon', 'aside', 'secondaryAction'] as const) {
    const part = control.querySelector(`.fui-TagPickerControl__${name}`);
    values[`${name}.present`] = String(Boolean(part));
    if (!part) continue;
    capture(name, part, [
      'display',
      'position',
      'align-self',
      'align-items',
      'box-sizing',
      'color',
      'font-size',
      'min-height',
      'margin-left',
      'margin-right',
      'cursor',
    ]);
    if (name === 'expandIcon') {
      const glyph = part.querySelector('svg');
      values['expandIcon.glyph.present'] = String(Boolean(glyph));
      if (glyph)
        capture('expandIcon.glyph', glyph, ['display', 'color', 'fill', 'width', 'height']);
    }
  }
  values['popup.present'] = String(Boolean(popup));
  if (!popup) return values;
  capture('popup', popup, popupProperties);
  const surface = popup.getBoundingClientRect();
  values['popup.offset.inline'] = String(surface.left - origin.left);
  values['popup.offset.block'] = String(surface.top - origin.bottom);
  const options = [...popup.querySelectorAll('.fui-TagPickerOption')];
  values['option.count'] = String(options.length);
  options.forEach((option, index) => {
    capture(`option.${index}`, option, optionProperties);
    const media = option.querySelector('.fui-TagPickerOption__media');
    const secondary = option.querySelector('.fui-TagPickerOption__secondaryContent');
    values[`option.${index}.media.present`] = String(Boolean(media));
    if (media) capture(`option.${index}.media`, media, ['display', 'grid-row-start']);
    values[`option.${index}.secondary.present`] = String(Boolean(secondary));
    if (secondary) {
      capture(`option.${index}.secondary`, secondary, [
        'display',
        'grid-column-start',
        'grid-row-start',
        'font-size',
        'font-weight',
        'line-height',
      ]);
    }
    values[`option.${index}.checkGlyph.count`] = String(
      option.querySelectorAll('.fui-Option__checkIcon').length,
    );
  });
  const optionGroups = [...popup.querySelectorAll('.fui-TagPickerOptionGroup')];
  values['optionGroup.count'] = String(optionGroups.length);
  optionGroups.forEach((optionGroup, index) => {
    capture(`optionGroup.${index}`, optionGroup, ['display', 'flex-direction', 'row-gap']);
    const label = optionGroup.querySelector('.fui-TagPickerOptionGroup__label');
    if (label)
      capture(`optionGroup.${index}.label`, label, [
        'display',
        'font-size',
        'font-weight',
        'line-height',
        'color',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
      ]);
    for (const property of ['content', 'padding-bottom', 'margin-bottom', 'border-bottom-color'])
      values[`optionGroup.${index}.after.${property}`] = getComputedStyle(
        optionGroup,
        '::after',
      ).getPropertyValue(property);
  });
  return values;
}

export function compareTagPickerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  consumer = false,
): TagPickerStyleDifference[] {
  const samePopupBox =
    legacy['popup.rect.width'] !== undefined &&
    legacy['popup.rect.width'] === headless['popup.rect.width'] &&
    legacy['popup.rect.height'] === headless['popup.rect.height'];
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => {
      let kind: TagPickerStyleDifference['kind'] = 'unexpected';
      if (
        property === 'popup.max-height' &&
        headless[property] === `${(window.innerHeight * 4) / 5}px` &&
        samePopupBox
      ) {
        kind = 'native-maximum';
      } else if (
        consumer &&
        ((property === 'control.min-width' && headless[property] === '280px') ||
          (property === 'control.border-radius' && headless[property] === '3px') ||
          (/^(trigger|option\.\d+)\.color$/.test(property) &&
            headless[property] === 'rgb(90, 40, 130)'))
      ) {
        kind = 'consumer-priority';
      }
      return {
        property,
        legacy: legacy[property] ?? null,
        headless: headless[property] ?? null,
        kind,
      };
    });
}

export function captureTagPickerNativeContract(control: HTMLElement, popup: HTMLElement | null) {
  const trigger = getTagPickerTrigger(control);
  const computed = popup ? getComputedStyle(popup) : null;
  return {
    trigger: trigger.tagName.toLowerCase(),
    expanded: trigger.getAttribute('aria-expanded') ?? '',
    popover: popup?.getAttribute('popover') ?? '(unmounted)',
    open: String(popup?.matches(':popover-open') ?? false),
    display: computed?.display ?? '(unmounted)',
    position: computed?.position ?? '(unmounted)',
    anchor: control.style.getPropertyValue('anchor-name'),
    positionAnchor: popup?.style.getPropertyValue('position-anchor') ?? '',
    positionArea: popup?.style.getPropertyValue('position-area') ?? '',
    fallbacks: popup?.style.getPropertyValue('position-try-fallbacks') ?? '',
    groupRole: control.querySelector('.fui-TagPickerGroup')?.getAttribute('role') ?? '(absent)',
    focusgroup:
      control.querySelector('.fui-TagPickerGroup')?.getAttribute('focusgroup') ?? '(absent)',
  };
}
