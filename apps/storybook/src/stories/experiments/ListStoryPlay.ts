// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor } from 'storybook/test';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { getComparisonList } from './compareListStyles.js';

export async function assertListReport(
  container: HTMLElement,
  example: string,
  checkmarks: boolean,
) {
  const report = container.querySelector('[data-list-report-state]');
  if (!(report instanceof HTMLElement)) throw new Error('Missing List report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-list-report-state', 'ready');
      await expect(report).toHaveAttribute('data-list-report-example', example);
      await expect(report).toHaveAttribute('data-list-unexpected-count', '0');
      await expect(report).toHaveAttribute('data-list-row-count', '3');
      await expect(report).toHaveAttribute('data-list-checkmark-count', checkmarks ? '3' : '0');
    },
    { timeout: 10000 },
  );
  const list = getComparisonList(container, 'headless');
  const rect = list.getBoundingClientRect();
  await expect(rect.width).toBe(Number(report.getAttribute('data-list-width')));
  await expect(rect.height).toBe(Number(report.getAttribute('data-list-height')));
  await expect(rect.width).toBeGreaterThan(0);
  await expect(rect.height).toBeGreaterThan(0);
  await expect(list.querySelectorAll('[data-list-row]').length).toBe(3);
  await expect(list.querySelectorAll('input[type="checkbox"]').length).toBe(checkmarks ? 3 : 0);
}

export async function assertListFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function focusListStoryItem(element: HTMLElement, key: string) {
  if (supportsFocusGroup()) {
    // Synthetic Storybook keys do not invoke native focusgroup defaults.
    // Trusted Browser Mode and live follow-ups exercise those real keys.
    element.focus();
  } else {
    await userEvent.keyboard(key);
  }
  await assertListFocus(element);
}
