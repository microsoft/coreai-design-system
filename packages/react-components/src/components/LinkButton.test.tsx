// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { LinkButton } from './LinkButton.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

test('renders a native anchor with anchor attributes and ref', async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  const screen = await renderCoreAIComponent(
    <LinkButton
      ref={ref}
      href="/guide.pdf"
      download="guide.pdf"
      hrefLang="en"
      referrerPolicy="no-referrer"
    >
      Download guide
    </LinkButton>,
  );
  const link = screen.getByRole('link', { name: 'Download guide' }).element();

  expect(link.tagName).toBe('A');
  expect(link).toHaveAttribute('href', '/guide.pdf');
  expect(link).toHaveAttribute('download', 'guide.pdf');
  expect(link).toHaveAttribute('hreflang', 'en');
  expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(ref.current).toBe(link);
});

test('supports an anchor-compatible root component', async () => {
  const CustomAnchor = React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement>
  >((props, ref) => <a data-custom-root="true" {...props} ref={ref} />);
  const screen = await renderCoreAIComponent(
    <LinkButton as={CustomAnchor} href="/guide">
      Guide
    </LinkButton>,
  );

  expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute('data-custom-root', 'true');
});

test('supports the Button icon slot and icon position', async () => {
  await renderCoreAIComponent(
    <LinkButton href="/next" icon={<span data-testid="next-icon">Next</span>} iconPosition="after">
      Continue
    </LinkButton>,
  );

  const link = document.querySelector('.fui-LinkButton');
  const icon = document.querySelector('[data-testid="next-icon"]');

  expect(link).toHaveClass('fui-Button');
  expect(icon?.parentElement).toHaveClass('fui-Button__icon');
  expect(link?.lastElementChild).toBe(icon?.parentElement);
});

test('applies external link defaults and allows overrides', async () => {
  const screen = await renderCoreAIComponent(
    <LinkButton external href="https://example.com">
      External site
    </LinkButton>,
  );
  const link = screen.getByRole('link', { name: 'External site' }).element();

  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  const defaultIcon = link.querySelector('svg[aria-hidden="true"]');
  expect(defaultIcon?.parentElement).toHaveClass('fui-Button__icon');
  expect(link.lastElementChild).toBe(defaultIcon?.parentElement);

  await screen.rerender(
    <LinkButton
      external
      href="https://example.com"
      target="_self"
      rel="external"
      icon={<span data-testid="custom-external-icon">Custom</span>}
      iconPosition="before"
    >
      External site
    </LinkButton>,
  );

  expect(link).toHaveAttribute('target', '_self');
  expect(link).toHaveAttribute('rel', 'external');
  const customIcon = link.querySelector('[data-testid="custom-external-icon"]');
  expect(link.querySelector('svg[aria-hidden="true"]')).toBeNull();
  expect(link.firstElementChild).toBe(customIcon?.parentElement);
});

test('prevents navigation when disabled', async () => {
  const onClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <LinkButton disabled href="/settings" onClick={onClick}>
      Settings
    </LinkButton>,
  );
  const link = screen.getByRole('link', { name: 'Settings' });

  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).not.toHaveAttribute('href');
  (link.element() as HTMLAnchorElement).click();
  expect(onClick).not.toHaveBeenCalled();
});

test('preserves native modifier-click behavior when enabled', async () => {
  const onClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <LinkButton href="/settings" target="_blank" rel="noopener" onClick={onClick}>
      Settings
    </LinkButton>,
  );
  const link = screen.getByRole('link', { name: 'Settings' }).element();
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    ctrlKey: true,
  });

  link.dispatchEvent(clickEvent);

  expect(clickEvent.defaultPrevented).toBe(false);
  expect(onClick).toHaveBeenCalledOnce();
});

test('remains focusable without navigating when disabledFocusable', async () => {
  const onClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before link</button>
      <LinkButton disabledFocusable href="/settings" onClick={onClick}>
        Settings
      </LinkButton>
    </>,
  );
  const link = screen.getByRole('link', { name: 'Settings' });

  screen.getByRole('button', { name: 'Before link' }).element().focus();
  await userEvent.tab();

  await expect.element(link).toHaveFocus();
  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).not.toHaveAttribute('href');
  await userEvent.keyboard('{Enter}');
  expect(onClick).not.toHaveBeenCalled();
});
