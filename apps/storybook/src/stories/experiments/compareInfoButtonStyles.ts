// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import {
  capturePopoverStyles,
  comparePopoverStyles,
  refreshPopoverComparisonPositioning,
  settlePopoverStyles,
  type PopoverStyleDifference,
} from './comparePopoverStyles.js';

export type InfoButtonStyleDifference = PopoverStyleDifference;

export interface ComparisonInfoButton {
  button: HTMLButtonElement;
  surface: HTMLElement;
}

export function getComparisonInfoButton(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonInfoButton {
  const fixture = container.querySelector<HTMLElement>('[data-information-comparison]');
  const fixtureId = fixture?.dataset.informationComparison;
  const button = fixture?.querySelector<HTMLButtonElement>(
    `[data-information-cell="${implementation}"] .fui-InfoButton`,
  );
  const surface = [
    ...document.querySelectorAll<HTMLElement>(
      `[data-information-implementation="${implementation}"]`,
    ),
  ].find((candidate) => candidate.dataset.informationFixture === fixtureId);
  if (!fixtureId || !button || !surface) {
    throw new Error(`Missing ${implementation} information fixture`);
  }
  return { button, surface };
}

export function captureInfoButtonStyles({
  button,
  surface,
}: ComparisonInfoButton): Record<string, string> {
  const values = capturePopoverStyles(surface, button);
  const computed = getComputedStyle(button);
  for (const property of [
    'display',
    'box-sizing',
    'align-items',
    'justify-content',
    'vertical-align',
    'position',
    'text-decoration-line',
    'background-color',
    'color',
    'border-top-style',
    'border-radius',
    'margin-top',
    'margin-bottom',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
  ]) {
    values[`button.${property}`] = computed.getPropertyValue(property);
  }
  const buttonRect = button.getBoundingClientRect();
  values['button.width'] = String(buttonRect.width);
  values['button.height'] = String(buttonRect.height);
  for (const variant of ['regular', 'filled'] as const) {
    const glyph = button.querySelector<SVGElement>(
      `[data-info-glyph="${variant}"], .fui-Icon-${variant}`,
    );
    values[`glyph.${variant}.present`] = String(Boolean(glyph));
    if (!glyph) continue;
    values[`glyph.${variant}.display`] = getComputedStyle(glyph).display;
    values[`glyph.${variant}.width`] = String(glyph.getBoundingClientRect().width);
    values[`glyph.${variant}.height`] = String(glyph.getBoundingClientRect().height);
    values[`glyph.${variant}.path`] = glyph.querySelector('path')?.getAttribute('d') ?? '';
  }
  return values;
}

export function compareInfoButtonStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  popoverSize: 'small' | 'medium' | 'large' = 'small',
): InfoButtonStyleDifference[] {
  return comparePopoverStyles(legacy, headless, popoverSize === 'small' ? 6 : 8);
}

export async function settleInfoButtonStyles({
  button,
  surface,
}: ComparisonInfoButton): Promise<void> {
  await Promise.all([settlePopoverStyles(button), settlePopoverStyles(surface)]);
}

export async function refreshInformationPositioning(
  legacy: ComparisonInfoButton,
  headless: ComparisonInfoButton,
  legacyRef: PositioningImperativeRef,
  headlessRef: PositioningImperativeRef,
): Promise<void> {
  return refreshPopoverComparisonPositioning(
    legacy.surface,
    legacy.button,
    headless.surface,
    headless.button,
    legacyRef,
    headlessRef,
  );
}
