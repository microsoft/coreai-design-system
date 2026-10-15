// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Dropdown as FluentDropdown, makeStyles, Option } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Dropdown } from './Dropdown.js';

afterEach(cleanup);

const useStyles = makeStyles({
  custom: { backgroundColor: 'rgb(255, 0, 0)' },
});

function CustomDropdown() {
  const styles = useStyles();

  return (
    <Dropdown
      className={styles.custom}
      label="Status"
      value="Awaiting stakeholder review and final sign-off"
      selectedOptions={['review']}
      dynamicWidth
    >
      <Option value="review">Awaiting stakeholder review and final sign-off</Option>
    </Dropdown>
  );
}

test('uses filled-darker by default and allows an appearance override', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Dropdown aria-label="Default dropdown" />
      <Dropdown aria-label="Outline dropdown" appearance="outline" />
    </>,
  );

  const defaultRoot = screen.getByLabelText('Default dropdown').element().closest('.fui-Dropdown')!;
  const outlineRoot = screen.getByLabelText('Outline dropdown').element().closest('.fui-Dropdown')!;

  expect(getComputedStyle(defaultRoot).backgroundColor).not.toBe(
    getComputedStyle(outlineRoot).backgroundColor,
  );
});

test('applies inline-label sizing and preserves a root override', async () => {
  const screen = await renderCoreAIComponent(<CustomDropdown />);

  const button = screen.getByRole('combobox', { name: 'Status' }).element() as HTMLButtonElement;
  const root = button.closest('.fui-Dropdown') as HTMLElement;
  const label = root.querySelector<HTMLElement>('[data-inline-label]');

  expect(getComputedStyle(label!, '::after').content).toContain(':');
  expect(getComputedStyle(root).minWidth).toBe('0px');
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 0, 0)');
});

test('truncates an unlabeled value', async () => {
  const screen = await renderCoreAIComponent(
    <Dropdown aria-label="Status" value="Awaiting review" truncateTextOverflow />,
  );

  const button = screen.getByRole('combobox', { name: 'Status' }).element();
  const value = button.querySelector('span:not(.fui-Dropdown__expandIcon)');

  expect(getComputedStyle(value!).textOverflow).toBe('ellipsis');
});

test('dims a disabled inline label', async () => {
  const screen = await renderCoreAIComponent(<Dropdown label="Status" disabled />);

  const button = screen.getByRole('combobox', { name: 'Status' }).element();
  const label = button.closest('.fui-Dropdown')?.querySelector<HTMLElement>('[data-inline-label]');

  expect(getComputedStyle(label!).color).toBe(getComputedStyle(button).color);
});

test('keeps the stock Fluent appearance when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <FluentDropdown aria-label="Stock dropdown" />
      <FluentDropdown aria-label="Outline dropdown" appearance="outline" />
    </>,
    { providerProps: { withComponentDefaults: false } },
  );

  const stockRoot = screen.getByLabelText('Stock dropdown').element().closest('.fui-Dropdown')!;
  const outlineRoot = screen.getByLabelText('Outline dropdown').element().closest('.fui-Dropdown')!;

  expect(getComputedStyle(stockRoot).backgroundColor).toBe(
    getComputedStyle(outlineRoot).backgroundColor,
  );
});
