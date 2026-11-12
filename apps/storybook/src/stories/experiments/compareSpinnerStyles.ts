// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'align-items',
  'justify-content',
  'flex-direction',
  'line-height',
  'gap',
  'overflow',
  'min-width',
  'direction',
] as const;
const spinnerProperties = [
  'position',
  'flex-shrink',
  'color',
  'background-color',
  'mask-image',
  '--fui-Spinner--strokeWidth',
  'forced-color-adjust',
  'transform',
] as const;
const tailProperties = [
  'position',
  'display',
  'mask-image',
  'background-image',
  'transform',
] as const;
const labelProperties = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
] as const;
const requiredProperties = ['color', 'padding-left', 'padding-right'] as const;
const animationProperties = [
  'animation-duration',
  'animation-iteration-count',
  'animation-timing-function',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',
] as const;
const pseudoProperties = [
  'content',
  'display',
  'position',
  'width',
  'height',
  'background-image',
  'transform',
  ...animationProperties,
] as const;

export interface SpinnerStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonSpinner {
  root: HTMLElement;
  spinner: HTMLSpanElement | null;
  spinnerTail: HTMLSpanElement | null;
  label: HTMLLabelElement | null;
  required: HTMLSpanElement | null;
}

export function getComparisonSpinner(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonSpinner {
  const cell = container.querySelector(`[data-spinner-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Spinner');
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} Spinner root`);
  const spinner = root.querySelector<HTMLSpanElement>(':scope > .fui-Spinner__spinner');
  const spinnerTail =
    spinner?.querySelector<HTMLSpanElement>(':scope > .fui-Spinner__spinnerTail') ?? null;
  const label = root.querySelector<HTMLLabelElement>(':scope > .fui-Spinner__label');
  return {
    root,
    spinner,
    spinnerTail,
    label,
    required: label?.querySelector<HTMLSpanElement>(':scope > .fui-Label__required') ?? null,
  };
}

function getOwnedSpinnerAnimations({
  root,
  spinner,
  spinnerTail,
}: ComparisonSpinner): CSSAnimation[] {
  return root.getAnimations({ subtree: true }).filter((animation): animation is CSSAnimation => {
    const effect = animation.effect;
    return (
      animation instanceof CSSAnimation &&
      effect instanceof KeyframeEffect &&
      (effect.target === spinner || effect.target === spinnerTail) &&
      (!effect.pseudoElement ||
        effect.pseudoElement === '::before' ||
        effect.pseudoElement === '::after')
    );
  });
}

export function captureSpinnerStyles(control: ComparisonSpinner): Record<string, string> {
  const { root, spinner, spinnerTail, label, required } = control;
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['spinner', spinner, [...spinnerProperties, ...animationProperties]],
    ['spinnerTail', spinnerTail, [...tailProperties, ...animationProperties]],
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

  if (spinnerTail) {
    for (const pseudo of ['::before', '::after']) {
      const styles = getComputedStyle(spinnerTail, pseudo);
      for (const property of pseudoProperties) {
        values[`spinnerTail${pseudo}.${property}`] = styles.getPropertyValue(property);
      }
    }
  }

  for (const [slot, element, pseudo] of [
    ['spinner', spinner, null],
    ['spinnerTail', spinnerTail, null],
    ['spinnerTail::before', spinnerTail, '::before'],
    ['spinnerTail::after', spinnerTail, '::after'],
  ] as const) {
    if (!element) continue;
    // Generated animation names differ; compare their actual keyframes instead.
    values[`${slot}.animation-keyframes`] = JSON.stringify(
      getOwnedSpinnerAnimations(control).flatMap((animation) => {
        const effect = animation.effect;
        if (
          !(effect instanceof KeyframeEffect) ||
          effect.target !== element ||
          effect.pseudoElement !== pseudo
        ) {
          return [];
        }
        return [
          effect.getKeyframes().map((frame) => ({
            offset: frame.computedOffset,
            easing: frame.easing,
            transform: frame.transform,
          })),
        ];
      }),
    );
  }
  return values;
}

export function compareSpinnerStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SpinnerStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleSpinnerStyles(control: ComparisonSpinner): Promise<void> {
  await document.fonts.ready;
  if (control.spinner) getComputedStyle(control.spinner).getPropertyValue('transform');
  if (control.spinnerTail) {
    getComputedStyle(control.spinnerTail, '::before').getPropertyValue('content');
    getComputedStyle(control.spinnerTail, '::after').getPropertyValue('content');
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // Freeze only the owned ring/tail CSS animations (including pseudo-elements) at time zero.
  // Their durations, easing, iterations, and keyframes remain observable; never await infinity.
  const animations = getOwnedSpinnerAnimations(control);
  for (const animation of animations) {
    animation.pause();
    animation.currentTime = 0;
  }
  await Promise.all(animations.map((animation) => animation.ready));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
