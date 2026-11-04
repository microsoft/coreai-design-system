// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'box-sizing',
  'align-items',
  'justify-content',
  'background-color',
  'color',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'min-width',
  'max-width',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'outline-color',
  'outline-style',
  'outline-width',
  'box-shadow',
  'cursor',
  'text-decoration-line',
  'transition-duration',
] as const;

const iconProperties = [
  'display',
  'color',
  'font-size',
  'width',
  'height',
  'margin-left',
  'margin-right',
] as const;

export interface ButtonStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function captureButtonStyles(root: HTMLElement): Record<string, string> {
  const styles = getComputedStyle(root);
  const values: Record<string, string> = Object.fromEntries(
    rootProperties.map((property) => [`root.${property}`, styles.getPropertyValue(property)]),
  );
  const rect = root.getBoundingClientRect();
  values['root.width'] = rect.width.toFixed(2);
  values['root.height'] = rect.height.toFixed(2);

  const icon = root.querySelector('.parity-icon');
  if (icon) {
    const iconStyles = getComputedStyle(icon);
    for (const property of iconProperties) {
      values[`icon.${property}`] = iconStyles.getPropertyValue(property);
    }
    for (const variant of ['filled', 'regular']) {
      const svg = icon.querySelector(`.fui-Icon-${variant}`);
      if (svg) {
        values[`icon.${variant}.display`] = getComputedStyle(svg).display;
      }
    }
  }

  return values;
}

export function compareButtonStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): ButtonStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonButton(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(`[data-implementation="${implementation}"] > :first-child`);
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} Button in comparison fixture`);
  }
  return root;
}

export async function settleButtonStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await Promise.all(root.getAnimations().map((animation) => animation.finished));
}
