// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Combobox as FluentCombobox, makeStyles, Option } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Combobox } from './Combobox.js';

afterEach(cleanup);

const useStyles = makeStyles({
  custom: { backgroundColor: 'rgb(255, 0, 0)' },
});

function CustomCombobox() {
  const styles = useStyles();

  return (
    <Combobox
      className={styles.custom}
      label="Status"
      value="In progress"
      selectedOptions={['In progress']}
      dynamicWidth
      truncateTextOverflow
    >
      <Option>In progress</Option>
    </Combobox>
  );
}

test('uses filled-darker by default and allows an appearance override', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Combobox aria-label="Default combobox" />
      <Combobox aria-label="Outline combobox" appearance="outline" />
    </>,
  );

  const defaultRoot = screen
    .getByLabelText('Default combobox', { exact: true })
    .element()
    .closest('.fui-Combobox')!;
  const outlineRoot = screen
    .getByLabelText('Outline combobox', { exact: true })
    .element()
    .closest('.fui-Combobox')!;

  expect(getComputedStyle(defaultRoot).backgroundColor).not.toBe(
    getComputedStyle(outlineRoot).backgroundColor,
  );
});

test('applies inline-label sizing and preserves caller overrides', async () => {
  const screen = await renderCoreAIComponent(<CustomCombobox />);

  const input = screen.getByLabelText('Status').element() as HTMLInputElement;
  const root = input.closest('.fui-Combobox') as HTMLElement;
  const label = root.querySelector<HTMLElement>('[data-inline-label]');

  expect(label).not.toBeNull();
  expect(getComputedStyle(label!, '::after').content).toContain(':');
  expect(getComputedStyle(input).getPropertyValue('field-sizing')).toBe('content');
  expect(getComputedStyle(input).textOverflow).toBe('ellipsis');
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 0, 0)');
});

test('supplies the dynamic-width placeholder and disabled label treatment', async () => {
  const screen = await renderCoreAIComponent(<Combobox label="Status" dynamicWidth disabled />);

  const input = screen.getByLabelText('Status').element() as HTMLInputElement;
  const label = input.closest('.fui-Combobox')?.querySelector<HTMLElement>('[data-inline-label]');

  expect(input.placeholder).toBe('Select...');
  expect(getComputedStyle(label!).color).toBe(getComputedStyle(input).color);
});

test('keeps the stock Fluent appearance when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <FluentCombobox aria-label="Stock combobox" />
      <FluentCombobox aria-label="Outline combobox" appearance="outline" />
    </>,
    { providerProps: { withComponentDefaults: false } },
  );

  const stockRoot = screen
    .getByLabelText('Stock combobox', { exact: true })
    .element()
    .closest('.fui-Combobox')!;
  const outlineRoot = screen
    .getByLabelText('Outline combobox', { exact: true })
    .element()
    .closest('.fui-Combobox')!;

  expect(getComputedStyle(stockRoot).backgroundColor).toBe(
    getComputedStyle(outlineRoot).backgroundColor,
  );
});
