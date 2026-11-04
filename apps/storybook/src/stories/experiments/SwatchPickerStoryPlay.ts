// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor } from 'storybook/test';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { getComparisonSwatchPicker } from './compareSwatchPickerStyles.js';

export async function assertSwatchPickerReport(
  container: HTMLElement,
  example: string,
  grid: boolean,
) {
  const report = container.querySelector('[data-swatch-report-state]');
  if (!(report instanceof HTMLElement)) throw new Error('Missing SwatchPicker report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-swatch-report-state', 'ready');
      await expect(report).toHaveAttribute('data-swatch-report-example', example);
      await expect(report).toHaveAttribute('data-swatch-unexpected-count', '0');
      await expect(report).toHaveAttribute('data-swatch-count', '6');
      await expect(report).toHaveAttribute('data-swatch-row-count', grid ? '2' : '0');
    },
    { timeout: 10000 },
  );
  const picker = getComparisonSwatchPicker(container, 'headless');
  const rect = picker.getBoundingClientRect();
  await expect(rect.width).toBe(Number(report.getAttribute('data-swatch-width')));
  await expect(rect.height).toBe(Number(report.getAttribute('data-swatch-height')));
  await expect(rect.width).toBeGreaterThan(0);
  await expect(rect.height).toBeGreaterThan(0);
  await expect(picker.querySelectorAll('[data-swatch-part]').length).toBe(6);
  await expect(picker.querySelectorAll('[data-swatch-row]').length).toBe(grid ? 2 : 0);
  await expect(picker).toHaveAttribute('role', grid ? 'grid' : 'radiogroup');
}

export async function assertSwatchPickerFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function focusSwatchPickerStoryItem(element: HTMLElement, key: string) {
  if (supportsFocusGroup()) {
    // Synthetic Storybook keys cannot invoke native focusgroup defaults.
    // Trusted Browser Mode and live follow-ups exercise the real native/polyfill keys.
    element.focus();
  } else {
    await userEvent.keyboard(key);
  }
  await assertSwatchPickerFocus(element);
}
