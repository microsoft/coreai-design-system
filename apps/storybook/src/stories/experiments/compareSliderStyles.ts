// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'position',
  'display',
  'touch-action',
  'align-items',
  'justify-items',
  'min-width',
  'min-height',
  'grid-template-rows',
  'grid-template-columns',
  'direction',
] as const;
const inputProperties = [
  'cursor',
  'opacity',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'grid-area',
  'writing-mode',
  'direction',
] as const;
const railProperties = [
  'position',
  'pointer-events',
  'grid-area',
  'border-top-left-radius',
  'background-image',
  'background-color',
  'outline-width',
  'outline-style',
  'outline-color',
  'forced-color-adjust',
] as const;
const thumbProperties = [
  'position',
  'pointer-events',
  'grid-area',
  'border-top-left-radius',
  'background-color',
  'box-shadow',
  'transform',
  'forced-color-adjust',
] as const;
const pseudoProperties = [
  'content',
  'position',
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
  'background-image',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-top-left-radius',
  'box-sizing',
  'pointer-events',
] as const;

export interface SliderStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

// Griffel mirrors the upstream vertical input's explicit direction in RTL.
// The modern native input keeps max at the top, aligned with the visual rail and thumb.
export const sliderVerticalRtlDirectionDifference: SliderStyleDifference = {
  property: 'input.direction',
  legacy: 'ltr',
  headless: 'rtl',
};

export interface ComparisonSlider {
  root: HTMLDivElement;
  input: HTMLInputElement;
  rail: HTMLDivElement;
  thumb: HTMLDivElement;
}

export function getSliderSlots(root: HTMLDivElement): ComparisonSlider {
  const input = root.querySelector(':scope > .fui-Slider__input');
  const rail = root.querySelector(':scope > .fui-Slider__rail');
  const thumb = root.querySelector(':scope > .fui-Slider__thumb');
  if (
    !(input instanceof HTMLInputElement) ||
    !(rail instanceof HTMLDivElement) ||
    !(thumb instanceof HTMLDivElement)
  ) {
    throw new Error('Missing Slider input, rail, or thumb slot');
  }
  return { root, input, rail, thumb };
}

export function getComparisonSlider(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonSlider {
  const root = container
    .querySelector(`[data-slider-implementation="${implementation}"]`)
    ?.querySelector('.fui-Slider');
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} Slider root`);
  return getSliderSlots(root);
}

export function captureSliderStyles(control: ComparisonSlider): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = control.root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', control.root, rootProperties],
    ['input', control.input, inputProperties],
    ['rail', control.rail, railProperties],
    ['thumb', control.thumb, thumbProperties],
  ] as const) {
    const styles = getComputedStyle(element);
    for (const property of properties) {
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
    values[`${slot}.offset-left`] = (rect.left - rootRect.left).toFixed(2);
    values[`${slot}.offset-top`] = (rect.top - rootRect.top).toFixed(2);
  }
  for (const property of [
    '--fui-Slider--progress',
    '--fui-Slider--steps-percent',
    '--fui-Slider--direction',
  ]) {
    values[`root.${property}`] = getComputedStyle(control.root).getPropertyValue(property);
  }
  for (const [slot, pseudo] of [
    ['root', '::after'],
    ['rail', '::before'],
    ['thumb', '::before'],
  ] as const) {
    const styles = getComputedStyle(control[slot], pseudo);
    for (const property of pseudoProperties) {
      values[`${slot}${pseudo}.${property}`] = styles.getPropertyValue(property);
    }
  }
  return values;
}

export function compareSliderStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SliderStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleSliderStyles(control: ComparisonSlider): Promise<void> {
  await document.fonts.ready;
  getComputedStyle(control.thumb).getPropertyValue('background-color');
  getComputedStyle(control.rail, '::before').getPropertyValue('background-image');
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const slots = [control.root, control.input, control.rail, control.thumb];
  const transitions = control.root.getAnimations({ subtree: true }).filter((animation) => {
    const effect = animation.effect;
    return (
      animation instanceof CSSTransition &&
      effect instanceof KeyframeEffect &&
      slots.some((slot) => slot === effect.target) &&
      Number.isFinite(effect.getComputedTiming().endTime)
    );
  });
  await Promise.all(transitions.map((animation) => animation.finished.catch(() => undefined)));
}
