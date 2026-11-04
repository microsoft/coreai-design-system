// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  captureButtonStyles,
  compareButtonStyles,
  settleButtonStyles,
} from './compareButtonStyles.js';

export { compareButtonStyles as compareCopyButtonStyles };
export { settleButtonStyles as settleCopyButtonStyles };
export type { ButtonStyleDifference as CopyButtonStyleDifference } from './compareButtonStyles.js';

// Both presets reuse Button's visuals. Include its default icon slot, not only caller icons.
export function captureCopyButtonStyles(root: HTMLElement): Record<string, string> {
  const values = captureButtonStyles(root);
  const icon = root.querySelector('.fui-Button__icon');
  if (icon instanceof HTMLElement) {
    const styles = getComputedStyle(icon);
    for (const property of [
      'color',
      'font-size',
      'width',
      'height',
      'margin-left',
      'margin-right',
    ]) {
      values[`presetIcon.${property}`] = styles.getPropertyValue(property);
    }
    for (const variant of ['filled', 'regular']) {
      const svg = icon.querySelector(`.fui-Icon-${variant}`);
      if (svg) values[`presetIcon.${variant}.display`] = getComputedStyle(svg).display;
    }
    const glyph = [...icon.querySelectorAll('svg')].find(
      (candidate) => getComputedStyle(candidate).display !== 'none',
    );
    if (glyph) {
      values['presetIcon.glyph.width'] = glyph.getBoundingClientRect().width.toFixed(2);
      values['presetIcon.glyph.height'] = glyph.getBoundingClientRect().height.toFixed(2);
    }
  }
  return values;
}

export function getComparisonCopyButton(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector(`[data-copy-button-implementation="${implementation}"]`);
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} CopyButton`);
  return root;
}
