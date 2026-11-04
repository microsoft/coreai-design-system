// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor } from 'storybook/test';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { getComparisonMenu } from './compareMenuStyles.js';

export async function assertMenuReport(container: HTMLElement, example: string) {
  const report = container.querySelector('[data-menu-report-state]');
  if (!(report instanceof HTMLElement)) throw new Error('Missing Menu style report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-menu-report-state', 'ready');
      await expect(report).toHaveAttribute('data-menu-report-example', example);
      await expect(report).toHaveAttribute('data-menu-unexpected-count', '0');
    },
    { timeout: 10000 },
  );
  await expect(report.getBoundingClientRect().height).toBe(320);
  const surface = getComparisonMenu(container, 'headless');
  await expect(surface.matches(':popover-open')).toBe(true);
  await expect(surface.getBoundingClientRect().width).toBe(
    Number(report.getAttribute('data-menu-surface-width')),
  );
  await expect(surface.getBoundingClientRect().height).toBe(
    Number(report.getAttribute('data-menu-surface-height')),
  );
  await expect(surface.getBoundingClientRect().width).toBeGreaterThanOrEqual(138);
  await expect(surface.getBoundingClientRect().height).toBeGreaterThan(0);
  await expect(surface.querySelector('[role="menu"]')).toHaveAttribute(
    'focusgroup',
    'menu block wrap',
  );
}

export async function assertMenuFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function focusMenuStoryItem(element: HTMLElement, key: string) {
  if (supportsFocusGroup()) {
    // Synthetic events cannot invoke native focusgroup key defaults. Prepare focus
    // explicitly here; trusted Chromium acceptance checks the actual navigation.
    element.focus();
  } else {
    await waitFor(async () => {
      await expect(element.tabIndex).toBe(-1);
    });
    await userEvent.keyboard(key);
  }
  await assertMenuFocus(element);
}

export function nativeMenuSurface(container: HTMLElement, testId: string): HTMLElement {
  const surface = container.querySelector(`[data-testid="${testId}"]`);
  if (!(surface instanceof HTMLElement)) throw new Error(`Missing native Menu surface ${testId}`);
  return surface;
}

export async function assertMenuClosed(surface: HTMLElement) {
  await waitFor(async () => {
    await expect(surface.matches(':popover-open')).toBe(false);
    await expect(getComputedStyle(surface).display).toBe('none');
    await expect(surface.getBoundingClientRect().width).toBe(0);
    await expect(surface.getBoundingClientRect().height).toBe(0);
  });
}
