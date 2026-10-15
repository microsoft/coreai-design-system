// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Link } from './Link.js';

afterEach(cleanup);

test('forwards its ref to the underlying link element', async () => {
  const ref = React.createRef<HTMLAnchorElement>();

  await renderCoreAIComponent(
    <Link ref={ref} href="/docs">
      Documentation
    </Link>,
  );

  expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  expect(ref.current).toHaveTextContent('Documentation');
});

test('adds a decorative icon and safe navigation defaults to external links', async () => {
  const screen = await renderCoreAIComponent(
    <Link external href="https://example.com">
      External site
    </Link>,
  );
  const link = screen.getByRole('link', { name: 'External site' }).element();

  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
});

test('preserves explicit external navigation overrides', async () => {
  const screen = await renderCoreAIComponent(
    <Link external href="https://example.com" target="_self" rel="external">
      External site
    </Link>,
  );
  const link = screen.getByRole('link', { name: 'External site' });

  expect(link).toHaveAttribute('target', '_self');
  expect(link).toHaveAttribute('rel', 'external');
});

test('does not add external behavior to an ordinary link when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(<Link href="/docs">Documentation</Link>, {
    providerProps: { withComponentDefaults: false },
  });
  const link = screen.getByRole('link', { name: 'Documentation' }).element();

  expect(link).not.toHaveAttribute('target');
  expect(link).not.toHaveAttribute('rel');
  expect(link.querySelector('svg')).toBeNull();
});

test('forwards consumer class and style overrides', async () => {
  const screen = await renderCoreAIComponent(
    <Link
      external
      href="https://example.com"
      className="consumer-link"
      style={{ color: 'rgb(255, 0, 0)', display: 'inline' }}
    >
      Styled link
    </Link>,
  );
  const link = screen.getByRole('link', { name: 'Styled link' }).element();

  expect(link).toHaveClass('consumer-link');
  expect(getComputedStyle(link).color).toBe('rgb(255, 0, 0)');
  expect(getComputedStyle(link).display).toBe('inline');
});
