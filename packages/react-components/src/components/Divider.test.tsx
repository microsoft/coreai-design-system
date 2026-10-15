// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Divider } from './Divider.js';

afterEach(cleanup);

test('renders a horizontal hr by default', async () => {
  const screen = await renderCoreAIComponent(<Divider aria-label="Section divider" />);
  const divider = screen.getByRole('separator', { name: 'Section divider' });

  await expect.element(divider).toHaveAttribute('aria-orientation', 'horizontal');
  expect(divider.element().tagName).toBe('HR');
  expect(getComputedStyle(divider.element()).borderTopWidth).not.toBe('0px');
});

test('renders an accessible vertical div when requested', async () => {
  const screen = await renderCoreAIComponent(
    <Divider as="div" vertical aria-label="Column divider" />,
  );
  const divider = screen.getByRole('separator', { name: 'Column divider' });

  await expect.element(divider).toHaveAttribute('aria-orientation', 'vertical');
  expect(divider.element().tagName).toBe('DIV');
  expect(getComputedStyle(divider.element()).borderRightWidth).not.toBe('0px');
});

test.each([
  { vertical: false, insetProperty: 'marginInlineStart' as const },
  { vertical: true, insetProperty: 'marginBlockStart' as const },
])('applies inset spacing in the $vertical orientation', async ({ vertical, insetProperty }) => {
  const screen = await renderCoreAIComponent(
    <>
      <Divider data-testid="plain" vertical={vertical} />
      <Divider data-testid="inset" vertical={vertical} inset />
    </>,
  );

  const plainStyles = getComputedStyle(screen.getByTestId('plain').element());
  const insetStyles = getComputedStyle(screen.getByTestId('inset').element());

  expect(insetStyles[insetProperty]).not.toBe(plainStyles[insetProperty]);
});

test('applies distinct stroke colors for each appearance', async () => {
  const appearances = ['strong', 'default', 'subtle', 'brand'] as const;
  const screen = await renderCoreAIComponent(
    <>
      {appearances.map((appearance) => (
        <Divider key={appearance} data-testid={appearance} appearance={appearance} />
      ))}
    </>,
  );
  const strokeColors = appearances.map(
    (appearance) => getComputedStyle(screen.getByTestId(appearance).element()).borderTopColor,
  );

  expect(new Set(strokeColors).size).toBe(appearances.length);
});

test('allows consumer class and inline styles to override divider styles', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <style>{`
        .consumer-divider {
          border-top-color: rgb(0, 128, 0);
          margin-top: 24px;
        }
      `}</style>
      <Divider data-testid="class-divider" className="consumer-divider" />
      <Divider
        data-testid="inline-divider"
        className="consumer-divider"
        style={{ borderTopColor: 'rgb(255, 0, 0)', marginTop: '32px' }}
      />
    </>,
  );
  const classDivider = screen.getByTestId('class-divider').element();
  const inlineDivider = screen.getByTestId('inline-divider').element();

  expect(classDivider.classList).toContain('consumer-divider');
  expect(getComputedStyle(classDivider).borderTopColor).toBe('rgb(0, 128, 0)');
  expect(getComputedStyle(classDivider).marginTop).toBe('24px');

  expect(inlineDivider.classList).toContain('consumer-divider');
  expect(getComputedStyle(inlineDivider).borderTopColor).toBe('rgb(255, 0, 0)');
  expect(getComputedStyle(inlineDivider).marginTop).toBe('32px');
});
