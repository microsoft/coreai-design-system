// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { makeStyles, Option } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { DropdownButton } from './DropdownButton.js';

afterEach(cleanup);

const useStyles = makeStyles({
  custom: { backgroundColor: 'rgb(255, 0, 0)' },
});

function CustomDropdownButton() {
  const styles = useStyles();

  return (
    <DropdownButton
      className={styles.custom}
      label="Sort by"
      value="Newest"
      selectedOptions={['newest']}
      appearance="subtle"
    >
      <Option value="newest">Newest</Option>
      <Option value="oldest">Oldest</Option>
    </DropdownButton>
  );
}

test('uses secondary by default and allows an appearance override', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <DropdownButton label="Default sort" />
      <DropdownButton label="Subtle sort" appearance="subtle" />
    </>,
  );

  const defaultRoot = screen
    .getByRole('combobox', { name: 'Default sort' })
    .element()
    .closest('.fui-DropdownButton')!;
  const subtleRoot = screen
    .getByRole('combobox', { name: 'Subtle sort' })
    .element()
    .closest('.fui-DropdownButton')!;

  expect(getComputedStyle(defaultRoot).backgroundColor).not.toBe(
    getComputedStyle(subtleRoot).backgroundColor,
  );
});

test('preserves a className on the subtle trigger and opens its options', async () => {
  const screen = await renderCoreAIComponent(<CustomDropdownButton />);

  const trigger = screen.getByRole('combobox', { name: 'Sort by' });
  const root = trigger.element().closest('.fui-DropdownButton') as HTMLElement;

  expect(root).not.toBeNull();
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 0, 0)');

  await trigger.click();
  await expect.element(screen.getByRole('option', { name: 'Oldest' })).toBeVisible();
});

test('forwards the disabled state to the trigger', async () => {
  const screen = await renderCoreAIComponent(<DropdownButton label="Sort by" disabled />);

  await expect.element(screen.getByRole('combobox', { name: 'Sort by' })).toBeDisabled();
});
