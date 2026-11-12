// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'background-color',
  'overflow-x',
  'overflow-y',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'direction',
  'forced-color-adjust',
] as const;
const barProperties = [
  'position',
  'background-color',
  'background-image',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'max-width',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'translate',
  'opacity',
  'forced-color-adjust',
] as const;

export interface ProgressBarStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonProgressBar {
  root: HTMLDivElement;
  bar: HTMLDivElement;
}

export function getComparisonProgressBar(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonProgressBar {
  const cell = container.querySelector(`[data-progressbar-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-ProgressBar');
  const bar = root?.querySelector(':scope > .fui-ProgressBar__bar');
  if (!(root instanceof HTMLDivElement) || !(bar instanceof HTMLDivElement)) {
    throw new Error(`Missing ${implementation} ProgressBar track or bar`);
  }
  return { root, bar };
}

function getBarAnimations({ root, bar }: ComparisonProgressBar): Animation[] {
  return root.getAnimations({ subtree: true }).filter((animation) => {
    const effect = animation.effect;
    return (
      !(animation instanceof CSSTransition) &&
      effect instanceof KeyframeEffect &&
      effect.target === bar &&
      effect.pseudoElement === null
    );
  });
}

function normalizeEquivalentLinearEasing(easing: string): string {
  // CSS puts timing on keyframes; upstream WAAPI puts it on the effect.
  // Only the exact upstream identity curve is equivalent to linear in both positions.
  return easing.replace(/ /g, '') === 'cubic-bezier(0,0,1,1)' ? 'linear' : easing;
}

export function captureProgressBarStyles(control: ComparisonProgressBar): Record<string, string> {
  const { root, bar } = control;
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['bar', bar, barProperties],
  ] as const) {
    const styles = getComputedStyle(element);
    for (const property of properties) {
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
    if (slot === 'bar') {
      values['bar.offset-left'] = (rect.left - rootRect.left).toFixed(2);
      values['bar.offset-top'] = (rect.top - rootRect.top).toFixed(2);
    }
    // Neither implementation owns pseudo-elements; keep their absence observable.
    for (const pseudo of ['::before', '::after']) {
      values[`${slot}${pseudo}.content`] = getComputedStyle(element, pseudo).content;
    }
  }

  const animations = getBarAnimations(control);
  values['bar.animation-count'] = String(animations.length);
  animations.forEach((animation, index) => {
    const effect = animation.effect;
    if (!(effect instanceof KeyframeEffect)) return;
    const timing = effect.getTiming();
    for (const property of [
      'duration',
      'delay',
      'endDelay',
      'iterations',
      'iterationStart',
      'easing',
      'direction',
      'fill',
    ] as const) {
      const value = String(timing[property]);
      values[`bar.animation-${index}.${property}`] =
        property === 'easing' ? normalizeEquivalentLinearEasing(value) : value;
    }
    values[`bar.animation-${index}.play-state`] = animation.playState;
    // Upstream uses WAAPI; the port uses CSS. Compare real effects, not generated CSS names.
    values[`bar.animation-${index}.keyframes`] = JSON.stringify(
      effect.getKeyframes().map((frame) => ({
        offset: frame.computedOffset,
        easing: normalizeEquivalentLinearEasing(frame.easing),
        translate: frame.translate,
        opacity: frame.opacity,
      })),
    );
  });
  return values;
}

export function compareProgressBarStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): ProgressBarStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleProgressBarStyles(control: ComparisonProgressBar): Promise<void> {
  await document.fonts.ready;
  getComputedStyle(control.bar).getPropertyValue('translate');
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const transitions = control.root.getAnimations({ subtree: true }).filter((animation) => {
    const effect = animation.effect;
    return (
      animation instanceof CSSTransition &&
      effect instanceof KeyframeEffect &&
      (effect.target === control.root || effect.target === control.bar)
    );
  });
  await Promise.all(transitions.map((animation) => animation.finished.catch(() => undefined)));

  // Freeze only bar-slot animations at frame zero. Never await an infinite animation's finish.
  // Consumer descendants and their own animations are left running.
  const animations = getBarAnimations(control);
  for (const animation of animations) {
    animation.pause();
    animation.currentTime = 0;
  }
  await Promise.all(animations.map((animation) => animation.ready));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
