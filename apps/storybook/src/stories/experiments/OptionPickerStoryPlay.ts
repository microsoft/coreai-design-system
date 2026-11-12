// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, waitFor } from 'storybook/test';
import {
  expectedOptionPickerMaxHeight,
  getComparisonPicker,
  getComparisonPickerPopup,
} from './compareOptionPickerStyles.js';

export async function assertPickerReport(container: HTMLElement, example?: string) {
  const report = container.querySelector('[data-picker-report-state]');
  if (!(report instanceof HTMLOutputElement)) throw new Error('Missing option-picker report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-picker-report-state', 'ready');
      if (example) await expect(report).toHaveAttribute('data-picker-report-example', example);
      await expect(report).toHaveAttribute('data-picker-unexpected-count', '0');
    },
    { timeout: 10000 },
  );
  await expect(report.getAttribute('data-picker-difference-count')).toBe(
    report.getAttribute('data-picker-native-sizing-count'),
  );
  const root = getComparisonPicker(container, 'headless');
  const popup = getComparisonPickerPopup(container, 'headless');
  if (popup && root !== popup) {
    await expect(popup.matches(':popover-open')).toBe(true);
    await expect(getComputedStyle(popup).display).toBe('flex');
    await expect(getComputedStyle(popup).maxHeight).toBe(expectedOptionPickerMaxHeight());
    const target = root.getBoundingClientRect();
    const surface = popup.getBoundingClientRect();
    const minimumWidth = Number.parseFloat(getComputedStyle(popup).minWidth);
    await expect(surface.width).toBe(Math.max(target.width, minimumWidth));
    await expect(surface.left - target.left).toBe(0);
    await expect(surface.top - target.bottom).toBe(0);
  }
}
