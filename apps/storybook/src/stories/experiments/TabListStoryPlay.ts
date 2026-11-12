// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor } from 'storybook/test';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { getComparisonTabList } from './compareTabListStyles.js';

export async function assertTabListReport(container: HTMLElement, example: string) {
  const report = container.querySelector('[data-tablist-report-state]');
  if (!(report instanceof HTMLElement)) throw new Error('Missing TabList style report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-tablist-report-state', 'ready');
      await expect(report).toHaveAttribute('data-tablist-report-example', example);
      await expect(report).toHaveAttribute('data-tablist-unexpected-count', '0');
      await expect(report).toHaveAttribute('data-tablist-tab-count', '3');
    },
    { timeout: 10000 },
  );
  const list = getComparisonTabList(container, 'headless');
  const rect = list.getBoundingClientRect();
  await expect(rect.width).toBe(Number(report.getAttribute('data-tablist-width')));
  await expect(rect.height).toBe(Number(report.getAttribute('data-tablist-height')));
  await expect(rect.width).toBeGreaterThan(0);
  await expect(rect.height).toBeGreaterThan(0);
  await expect(list.querySelectorAll('[data-tablist-fixture-tab]').length).toBe(3);
  await expect(list).toHaveAttribute(
    'focusgroup',
    `tablist ${list.getAttribute('data-orientation') === 'vertical' ? 'block' : 'inline'} wrap nomemory`,
  );
}

export async function assertTabListFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function focusTabListStoryItem(element: HTMLElement, key: string) {
  if (supportsFocusGroup()) {
    // Synthetic Storybook keys cannot run native focusgroup defaults. Browser tests use real keys.
    element.focus();
  } else {
    await userEvent.keyboard(key);
  }
  await assertTabListFocus(element);
}

export async function leaveTabListStory(element: HTMLElement) {
  if (supportsFocusGroup()) element.focus();
  else await userEvent.tab();
  await assertTabListFocus(element);
}
