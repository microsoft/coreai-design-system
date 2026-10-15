// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary,
  Tag,
  makeStyles,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';

afterEach(cleanup);

const useStyles = makeStyles({
  customPrimaryText: {
    paddingBottom: '6px',
  },
  customSecondary: {
    borderLeft: '3px solid rgb(255, 0, 0)',
    marginLeft: '7px',
  },
});

const CustomTags = () => {
  const styles = useStyles();

  return (
    <>
      <Tag primaryText={{ className: styles.customPrimaryText }}>Custom tag</Tag>
      <InteractionTag>
        <InteractionTagPrimary>Interaction tag</InteractionTagPrimary>
        <InteractionTagSecondary
          aria-label="Remove custom tag"
          className={styles.customSecondary}
        />
      </InteractionTag>
    </>
  );
};

test('removes primary text bottom padding from Tag and InteractionTagPrimary', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Tag>Standard tag</Tag>
      <InteractionTag>
        <InteractionTagPrimary>Interaction tag</InteractionTagPrimary>
      </InteractionTag>
    </>,
  );

  expect(getComputedStyle(screen.getByText('Standard tag').element()).paddingBottom).toBe('0px');
  expect(getComputedStyle(screen.getByText('Interaction tag').element()).paddingBottom).toBe('0px');
});

test('removes the shared border and offsets a non-outline secondary action', async () => {
  const screen = await renderCoreAIComponent(
    <InteractionTag>
      <InteractionTagPrimary>Tag</InteractionTagPrimary>
      <InteractionTagSecondary aria-label="Remove tag" />
    </InteractionTag>,
  );

  const style = getComputedStyle(screen.getByRole('button', { name: 'Remove tag' }).element());

  expect(style.borderLeftStyle).toBe('none');
  expect(style.marginLeft).toBe('1px');
});

test('preserves the stock shared border for an outline secondary action', async () => {
  const screen = await renderCoreAIComponent(
    <InteractionTag appearance="outline">
      <InteractionTagPrimary>Outline tag</InteractionTagPrimary>
      <InteractionTagSecondary aria-label="Remove outline tag" />
    </InteractionTag>,
  );

  const style = getComputedStyle(
    screen.getByRole('button', { name: 'Remove outline tag' }).element(),
  );

  expect(style.borderLeftStyle).not.toBe('none');
  expect(style.marginLeft).not.toBe('1px');
});

test('allows consumer slot styles to override CoreAI Tag styles', async () => {
  const screen = await renderCoreAIComponent(<CustomTags />);
  const primaryStyle = getComputedStyle(screen.getByText('Custom tag').element());
  const secondaryStyle = getComputedStyle(
    screen.getByRole('button', { name: 'Remove custom tag' }).element(),
  );

  expect(primaryStyle.paddingBottom).toBe('6px');
  expect(secondaryStyle.borderLeftWidth).toBe('3px');
  expect(secondaryStyle.borderLeftColor).toBe('rgb(255, 0, 0)');
  expect(secondaryStyle.marginLeft).toBe('7px');
});

test('keeps stock Fluent Tag styles when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Tag>Stock tag</Tag>
      <InteractionTag>
        <InteractionTagPrimary>Stock interaction tag</InteractionTagPrimary>
        <InteractionTagSecondary aria-label="Remove stock tag" />
      </InteractionTag>
    </>,
    { providerProps: { withComponentDefaults: false } },
  );

  expect(getComputedStyle(screen.getByText('Stock tag').element()).paddingBottom).not.toBe('0px');
  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Remove stock tag' }).element()).marginLeft,
  ).not.toBe('1px');
});
