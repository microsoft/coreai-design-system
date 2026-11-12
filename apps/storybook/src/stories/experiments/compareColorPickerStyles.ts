// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface ColorPickerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'native-axis' | 'consumer-cascade';
}

export interface ColorPickerComparisonSlots {
  elements: Record<string, HTMLElement>;
  roots: Record<string, HTMLDivElement>;
}

const rootProperties = [
  'display',
  'position',
  'box-sizing',
  'touch-action',
  'align-items',
  'justify-items',
  'min-width',
  'min-height',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-top-left-radius',
  'background-image',
  'background-color',
  'margin-bottom',
  'grid-template-rows',
  'grid-template-columns',
  'flex-direction',
  'row-gap',
] as const;
const inputProperties = [
  'position',
  'pointer-events',
  'cursor',
  'opacity',
  'padding-top',
  'margin-top',
  'grid-area',
  'writing-mode',
  'direction',
] as const;
const railProperties = [
  'position',
  'pointer-events',
  'grid-area',
  'background-image',
  'background-color',
  'border-top-left-radius',
  'border-top-width',
  'border-top-color',
  'outline-width',
  'outline-style',
  'outline-color',
  'forced-color-adjust',
] as const;
const thumbProperties = [
  'position',
  'pointer-events',
  'grid-area',
  'background-color',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-top-left-radius',
  'box-shadow',
  'transform',
  'outline-width',
  'outline-style',
  'outline-color',
  'forced-color-adjust',
] as const;
const pseudoProperties = [
  'content',
  'position',
  'background-color',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-top-left-radius',
  'box-sizing',
  'pointer-events',
] as const;

export function getColorPickerSlots(container: ParentNode): ColorPickerComparisonSlots {
  const elements: Record<string, HTMLElement> = {};
  const roots: Record<string, HTMLDivElement> = {};
  for (const [part, selector, classPrefix, slots] of [
    ['picker', '.fui-ColorPicker', 'fui-ColorPicker', []],
    ['area', '.fui-ColorArea', 'fui-ColorArea', ['inputX', 'inputY', 'thumb']],
    [
      'slider',
      '.fui-ColorSlider:not(.fui-AlphaSlider)',
      'fui-ColorSlider',
      ['input', 'rail', 'thumb'],
    ],
    ['alpha', '.fui-AlphaSlider', 'fui-AlphaSlider', ['input', 'rail', 'thumb']],
  ] as const) {
    const root = container.querySelector(selector);
    if (!root) continue;
    if (!(root instanceof HTMLDivElement)) throw new Error(`Invalid ${part} root`);
    elements[`${part}.root`] = root;
    roots[part] = root;
    for (const slot of slots) {
      const element = root.querySelector(`.${classPrefix}__${slot}`);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${part}.${slot}`);
      elements[`${part}.${slot}`] = element;
    }
  }
  if (!Object.keys(roots).length) throw new Error('No ColorPicker family controls found');
  return { elements, roots };
}

export function getComparisonColorPicker(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ColorPickerComparisonSlots {
  const fixture = container.querySelector(`[data-colorpicker-implementation="${implementation}"]`);
  if (!fixture) throw new Error(`Missing ${implementation} ColorPicker fixture`);
  return getColorPickerSlots(fixture);
}

export function getColorPickerInput(
  slots: ColorPickerComparisonSlots,
  name: 'area.inputX' | 'area.inputY' | 'slider.input' | 'alpha.input',
): HTMLInputElement {
  const input = slots.elements[name];
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing native ${name}`);
  return input;
}

export function captureColorPickerStyles(
  slots: ColorPickerComparisonSlots,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, element] of Object.entries(slots.elements)) {
    const [part, slot] = name.split('.');
    const properties = slot.startsWith('input')
      ? inputProperties
      : slot === 'thumb'
        ? thumbProperties
        : slot === 'rail'
          ? railProperties
          : rootProperties;
    const computed = getComputedStyle(element);
    for (const property of properties)
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    const rect = element.getBoundingClientRect();
    const rootRect = slots.roots[part].getBoundingClientRect();
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
    if (slot !== 'root') {
      values[`${name}.rect.offset-left`] = (rect.left - rootRect.left).toFixed(2);
      values[`${name}.rect.offset-top`] = (rect.top - rootRect.top).toFixed(2);
    }
    if (slot === 'thumb' || slot === 'rail') {
      for (const pseudo of slot === 'thumb' ? ['::before', '::after'] : ['::before']) {
        const style = getComputedStyle(element, pseudo);
        for (const property of pseudoProperties)
          values[`${name}${pseudo}.${property}`] = style.getPropertyValue(property);
      }
    }
  }
  return values;
}

export function compareColorPickerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  options: { rtl?: boolean; consumer?: boolean } = {},
): ColorPickerStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => {
      // These explicit RTL differences keep the current physical area coordinates
      // and bottom-to-top native range direction aligned with their visual thumbs.
      const nativeAxis =
        options.rtl &&
        ([
          'area.root.background-image',
          'area.thumb.transform',
          'area.thumb.rect.offset-left',
          'area.inputX.rect.offset-left',
          'area.inputY.rect.offset-left',
        ].includes(property) ||
          ((property === 'slider.input.direction' || property === 'alpha.input.direction') &&
            legacy[property] === 'ltr' &&
            headless[property] === 'rtl'));
      return {
        property,
        legacy: legacy[property] ?? null,
        headless: headless[property] ?? null,
        kind: options.consumer ? 'consumer-cascade' : nativeAxis ? 'native-axis' : 'unexpected',
      };
    });
}

export async function settleColorPickerStyles(slots: ColorPickerComparisonSlots): Promise<void> {
  await document.fonts.ready;
  const elements = Object.values(slots.elements);
  for (const element of elements) {
    getComputedStyle(element).getPropertyValue('background-image');
    getComputedStyle(element, '::before').getPropertyValue('border-top-width');
    getComputedStyle(element, '::after').getPropertyValue('border-top-width');
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    Object.values(slots.roots).flatMap((root) =>
      root
        .getAnimations({ subtree: true })
        .filter((animation) => {
          const effect = animation.effect;
          return (
            effect instanceof KeyframeEffect &&
            elements.some((element) => element === effect.target) &&
            Number.isFinite(effect.getComputedTiming().endTime)
          );
        })
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  let previous = '';
  for (let frame = 0; frame < 12; frame += 1) {
    const current = elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return `${rect.x},${rect.y},${rect.width},${rect.height}`;
      })
      .join(';');
    if (current === previous) return;
    previous = current;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error('ColorPicker slot geometry did not settle');
}
