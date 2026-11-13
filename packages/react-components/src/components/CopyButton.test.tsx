// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { CopyButton } from './CopyButton.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

test('copies the provided content and confirms success', async () => {
  const writeText = vi.spyOn(window.navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const onCopySuccess = vi.fn();
  const screen = await renderCoreAIComponent(
    <CopyButton
      aria-label="Copy test value"
      contentToCopy="Hello from CoreAI"
      onCopySuccess={onCopySuccess}
    />,
  );

  await screen.getByRole('button', { name: 'Copy test value' }).click();

  expect(writeText).toHaveBeenCalledWith('Hello from CoreAI');
  await expect.element(screen.getByText('Copied')).toBeVisible();
  expect(onCopySuccess).toHaveBeenCalledOnce();
});

test('receives focus and activates with the keyboard', async () => {
  const writeText = vi.spyOn(window.navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before copy</button>
      <CopyButton aria-label="Copy test value" contentToCopy="Hello from CoreAI" />
    </>,
  );
  const copyButton = screen.getByRole('button', { name: 'Copy test value' });

  screen.getByRole('button', { name: 'Before copy' }).element().focus();
  await userEvent.tab();

  await expect.element(copyButton).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(writeText).toHaveBeenCalledWith('Hello from CoreAI');
});

test('shows custom copy feedback without changing the accessible button label', async () => {
  vi.spyOn(window.navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await renderCoreAIComponent(
    <CopyButton
      aria-label="Copy Shield JSX"
      contentToCopy={'<Illicon name="shield" />'}
      copiedMessage="Copied Shield JSX"
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Copy Shield JSX' }));
  await expect.element(screen.getByText('Copied Shield JSX', { exact: true })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Copy Shield JSX' })).toBeVisible();
});

test('does not confirm success when copying fails', async () => {
  const copyError = new Error('Clipboard unavailable');
  const writeText = vi.spyOn(window.navigator.clipboard, 'writeText').mockRejectedValue(copyError);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const onCopyError = vi.fn();
  const screen = await renderCoreAIComponent(
    <CopyButton
      aria-label="Copy test value"
      contentToCopy="Hello from CoreAI"
      onCopyError={onCopyError}
    />,
  );

  await screen.getByRole('button', { name: 'Copy test value' }).click();

  expect(writeText).toHaveBeenCalledWith('Hello from CoreAI');
  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalledWith('Failed to write to clipboard:', copyError);
  });
  expect(document.body.textContent).not.toContain('Copied');
  expect(onCopyError).toHaveBeenCalledOnce();
});
