// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Input as FluentInput, makeStyles } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Input } from './Input.js';

afterEach(cleanup);

const useStyles = makeStyles({
  custom: {
    backgroundColor: 'rgb(255, 0, 0)',
  },
});

function CustomInput(props: React.ComponentProps<typeof Input>) {
  const styles = useStyles();

  return <Input className={styles.custom} {...props} />;
}

test('uses filled-darker by default and allows an appearance override', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Input aria-label="Default input" />
      <Input aria-label="Outline input" appearance="outline" />
    </>,
  );

  const defaultRoot = screen.getByLabelText('Default input').element().closest('.fui-Input')!;
  const outlineRoot = screen.getByLabelText('Outline input').element().closest('.fui-Input')!;

  expect(getComputedStyle(defaultRoot).backgroundColor).not.toBe(
    getComputedStyle(outlineRoot).backgroundColor,
  );
});

test('applies CoreAI inline-label defaults and preserves caller overrides', async () => {
  const screen = await renderCoreAIComponent(
    <CustomInput label="Name" defaultValue="Ada" dynamicWidth truncateTextOverflow />,
  );

  const input = screen.getByLabelText('Name').element() as HTMLInputElement;
  const root = input.closest('.fui-Input') as HTMLElement;
  const label = root.querySelector<HTMLElement>('[data-inline-label]');

  expect(label).not.toBeNull();
  expect(getComputedStyle(label!, '::after').content).toContain(':');
  expect(getComputedStyle(input).getPropertyValue('field-sizing')).toBe('content');
  expect(getComputedStyle(input).textOverflow).toBe('ellipsis');
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 0, 0)');
});

test('keeps the stock Fluent appearance when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <FluentInput aria-label="Stock input" />
      <FluentInput aria-label="Outline input" appearance="outline" />
    </>,
    { providerProps: { withComponentDefaults: false } },
  );

  const stockRoot = screen.getByLabelText('Stock input').element().closest('.fui-Input')!;
  const outlineRoot = screen.getByLabelText('Outline input').element().closest('.fui-Input')!;

  expect(getComputedStyle(stockRoot).backgroundColor).toBe(
    getComputedStyle(outlineRoot).backgroundColor,
  );
});

test('dims a disabled inline label', async () => {
  const screen = await renderCoreAIComponent(<Input label="Name" disabled />);

  const input = screen.getByLabelText('Name').element() as HTMLInputElement;
  const label = input.closest('.fui-Input')?.querySelector<HTMLElement>('[data-inline-label]');

  expect(label).not.toBeNull();
  expect(getComputedStyle(label!).color).toBe(getComputedStyle(input).color);
});

test('adds a CopyButton for read-only values without overriding contentAfter', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Input label="API key" readOnly value="secret" />
      <Input aria-label="Custom action" readOnly value="value" contentAfter={<span>Custom</span>} />
    </>,
  );

  await expect.element(screen.getByRole('button', { name: 'Copy API key' })).toBeVisible();
  await expect.element(screen.getByText('Custom')).toBeVisible();
  expect(document.querySelectorAll('button[aria-label^="Copy "]')).toHaveLength(1);
});
