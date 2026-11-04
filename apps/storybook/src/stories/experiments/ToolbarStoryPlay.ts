// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor } from 'storybook/test';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { getComparisonToolbar } from './compareToolbarStyles.js';

export async function assertToolbarReport(container: HTMLElement, example: string) {
  const report = container.querySelector('[data-toolbar-report-state]');
  if (!(report instanceof HTMLElement)) throw new Error('Missing Toolbar style report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-toolbar-report-state', 'ready');
      await expect(report).toHaveAttribute('data-toolbar-report-example', example);
      await expect(report).toHaveAttribute('data-toolbar-unexpected-count', '0');
    },
    { timeout: 10000 },
  );
  const toolbar = getComparisonToolbar(container, 'headless');
  const rect = toolbar.getBoundingClientRect();
  await expect(rect.width).toBe(Number(report.getAttribute('data-toolbar-width')));
  await expect(rect.height).toBe(Number(report.getAttribute('data-toolbar-height')));
  await expect(rect.width).toBeGreaterThan(0);
  await expect(rect.height).toBeGreaterThan(0);
  await expect(toolbar.querySelectorAll('[data-toolbar-part="button"]').length).toBe(1);
  await expect(toolbar.querySelectorAll('[data-toolbar-part="toggle"]').length).toBe(1);
  await expect(toolbar.querySelectorAll('[data-toolbar-part="radio"]').length).toBe(2);
  await expect(toolbar).toHaveAttribute(
    'focusgroup',
    `toolbar ${toolbar.hasAttribute('data-vertical') ? 'block' : 'inline'} wrap`,
  );
}

export async function assertToolbarFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function focusToolbarStoryItem(element: HTMLElement, key: string) {
  if (supportsFocusGroup()) {
    // Storybook's synthetic keyboard cannot invoke native focusgroup defaults.
    // Trusted Browser Mode/acceptance tests exercise the real keys in both feature modes.
    element.focus();
  } else {
    await userEvent.keyboard(key);
  }
  await assertToolbarFocus(element);
}

export async function leaveToolbarStory(element: HTMLElement) {
  if (supportsFocusGroup()) element.focus();
  else await userEvent.tab();
  await assertToolbarFocus(element);
}
