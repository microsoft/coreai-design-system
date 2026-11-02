// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ButtonVariantFamily } from './ButtonVariantsComparison.js';

const rootProperties = [
  'display',
  'align-items',
  'justify-content',
  'box-sizing',
  'background-color',
  'color',
  'border-top-color',
  'border-right-color',
  'border-left-color',
  'border-top-width',
  'border-right-width',
  'border-left-width',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'min-width',
  'max-width',
  'font-size',
  'font-weight',
  'line-height',
  'outline-style',
  'outline-color',
  'outline-width',
  'outline-offset',
  'box-shadow',
  'cursor',
  'text-decoration-line',
] as const;
const contentProperties = [
  'display',
  'flex-direction',
  'text-align',
  'color',
  'font-size',
  'font-weight',
  'line-height',
  'margin-left',
  'margin-right',
] as const;
const iconProperties = [
  'display',
  'color',
  'font-size',
  'height',
  'width',
  'line-height',
  'margin-left',
  'margin-right',
] as const;

export interface ButtonVariantStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonButtonVariant(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(`[data-implementation="${implementation}"] > :first-child`);
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} Button variant`);
  return root;
}

export function captureButtonVariantStyles(
  root: HTMLElement,
  family: ButtonVariantFamily,
): Record<string, string> {
  const result: Record<string, string> = {};
  const capture = (name: string, element: Element | null, properties: readonly string[]) => {
    if (!element) return;
    const computed = getComputedStyle(element);
    for (const property of properties) {
      result[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const bounds = element.getBoundingClientRect();
    result[`${name}.width`] = bounds.width.toFixed(2);
    result[`${name}.height`] = bounds.height.toFixed(2);
  };
  capture('root', root, rootProperties);
  capture('icon', root.querySelector('.parity-icon'), iconProperties);
  for (const variant of ['filled', 'regular']) {
    const svg = root.querySelector(`.parity-icon .fui-Icon-${variant}`);
    if (svg) result[`icon.${variant}.display`] = getComputedStyle(svg).display;
  }
  if (family === 'compound') {
    capture(
      'content',
      root.querySelector('.fui-CompoundButton__contentContainer'),
      contentProperties,
    );
    capture(
      'secondary',
      root.querySelector('.fui-CompoundButton__secondaryContent'),
      contentProperties,
    );
  }
  if (family === 'menu' || family === 'split') {
    capture('menuIcon', root.querySelector('.fui-MenuButton__menuIcon'), iconProperties);
  }
  if (family === 'split') {
    capture('primary', root.querySelector('.fui-SplitButton__primaryActionButton'), rootProperties);
    capture('menu', root.querySelector('.fui-SplitButton__menuButton'), rootProperties);
  }
  return result;
}

export function compareButtonVariantStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): ButtonVariantStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleButtonVariantStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  // Subtree enumeration includes pseudo-element transitions; never await infinite animations.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
