// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  captureRatingStyles,
  compareRatingStyles,
  type RatingStyleDifference,
} from './compareRatingStyles.js';

export type RatingDisplayStyleDifference = RatingStyleDifference;

const labelProperties = [
  'display',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'margin-left',
  'margin-right',
] as const;

export function getComparisonRatingDisplay(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(
    `[data-ratingdisplay-implementation="${implementation}"] .fui-RatingDisplay`,
  );
  if (!(root instanceof HTMLElement)) {
    throw new Error(`Missing ${implementation} RatingDisplay fixture`);
  }
  return root;
}

export function captureRatingDisplayStyles(root: HTMLElement): Record<string, string> {
  const values = captureRatingStyles(root);
  const rootRect = root.getBoundingClientRect();
  for (const name of ['valueText', 'countText'] as const) {
    const element = root.querySelector(`:scope > .fui-RatingDisplay__${name}`);
    values[`${name}.present`] = String(Boolean(element));
    if (!element) continue;
    const style = getComputedStyle(element);
    for (const property of labelProperties) {
      values[`${name}.${property}`] = style.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
    values[`${name}.offset-left`] = (rect.left - rootRect.left).toFixed(2);
    values[`${name}.offset-top`] = (rect.top - rootRect.top).toFixed(2);
    if (name === 'countText') {
      values['countText.before.content'] = getComputedStyle(element, '::before').content;
    }
  }
  return values;
}

export const compareRatingDisplayStyles = compareRatingStyles;
