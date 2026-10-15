// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Card } from './Card.js';

afterEach(cleanup);

const useStyles = makeStyles({
  customCard: {
    backgroundColor: 'rgb(255, 0, 0)',
    borderRadius: '1px',
    cursor: 'wait',
  },
  customText: {
    color: 'rgb(255, 0, 0)',
  },
});

const CustomCard = () => {
  const styles = useStyles();

  return (
    <Card className={styles.customCard} onClick={() => undefined} data-testid="custom-card">
      Custom card
    </Card>
  );
};

const CardWithCustomText = () => {
  const styles = useStyles();

  return (
    <Card onClick={() => undefined}>
      <Text className={styles.customText} data-testid="custom-text">
        Custom text
      </Text>
    </Card>
  );
};

test('uses the filled-alternative appearance by default and honors an explicit appearance', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Card data-testid="default-card">Default</Card>
      <Card appearance="filled-alternative" data-testid="alternative-card">
        Alternative
      </Card>
      <Card appearance="filled" data-testid="filled-card">
        Filled
      </Card>
    </>,
  );

  const defaultBackground = getComputedStyle(
    screen.getByTestId('default-card').element(),
  ).backgroundColor;
  const alternativeBackground = getComputedStyle(
    screen.getByTestId('alternative-card').element(),
  ).backgroundColor;
  const filledBackground = getComputedStyle(
    screen.getByTestId('filled-card').element(),
  ).backgroundColor;

  expect(defaultBackground).toBe(alternativeBackground);
  expect(filledBackground).not.toBe(alternativeBackground);
});

test('applies CoreAI surface styles for each Card appearance', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Card appearance="filled" data-testid="filled-card">
        Filled
      </Card>
      <Card appearance="filled-alternative" data-testid="alternative-card">
        Alternative
      </Card>
      <Card appearance="outline" data-testid="outline-card">
        Outline
      </Card>
      <Card appearance="subtle" data-testid="subtle-card">
        Subtle
      </Card>
    </>,
  );

  const filled = getComputedStyle(screen.getByTestId('filled-card').element());
  const alternative = getComputedStyle(screen.getByTestId('alternative-card').element());
  const outline = getComputedStyle(screen.getByTestId('outline-card').element());
  const subtle = getComputedStyle(screen.getByTestId('subtle-card').element());

  expect(filled.backgroundColor).not.toBe(alternative.backgroundColor);
  expect(outline.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(outline.borderColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(subtle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(subtle.borderColor).toBe('rgba(0, 0, 0, 0)');
});

test('uses the large radius only for large Cards', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Card size="small" data-testid="small-card">
        Small
      </Card>
      <Card size="medium" data-testid="medium-card">
        Medium
      </Card>
      <Card size="large" data-testid="large-card">
        Large
      </Card>
    </>,
  );

  const smallRadius = getComputedStyle(screen.getByTestId('small-card').element()).borderRadius;
  const mediumRadius = getComputedStyle(screen.getByTestId('medium-card').element()).borderRadius;
  const largeRadius = getComputedStyle(screen.getByTestId('large-card').element()).borderRadius;

  expect(smallRadius).toBe(mediumRadius);
  expect(largeRadius).not.toBe(mediumRadius);
});

test('applies interactive hover treatments to outline and subtle Cards', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Card appearance="outline" onClick={() => undefined} data-testid="outline-card">
        Outline
      </Card>
      <Card appearance="subtle" onClick={() => undefined} data-testid="subtle-card">
        Subtle
      </Card>
    </>,
  );

  const outline = screen.getByTestId('outline-card').element();
  const subtle = screen.getByTestId('subtle-card').element();

  expect(getComputedStyle(outline).cursor).toBe('pointer');
  expect(getComputedStyle(subtle).cursor).toBe('pointer');

  await userEvent.hover(outline);
  expect(getComputedStyle(outline).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

  await userEvent.hover(subtle);
  expect(getComputedStyle(subtle).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  await userEvent.unhover(subtle);
});

test('removes the Card shadow at rest and on hover', async () => {
  const screen = await renderCoreAIComponent(
    <Card onClick={() => undefined} data-testid="interactive-card">
      Interactive
    </Card>,
  );
  const card = screen.getByTestId('interactive-card').element();

  expect(getComputedStyle(card).boxShadow).toBe('none');

  await userEvent.hover(card);
  expect(getComputedStyle(card).boxShadow).toBe('none');
  await userEvent.unhover(card);
});

test('allows Text inside an interactive Card to keep its custom color', async () => {
  const screen = await renderCoreAIComponent(<CardWithCustomText />);

  expect(getComputedStyle(screen.getByTestId('custom-text').element()).color).toBe(
    'rgb(255, 0, 0)',
  );
});

test('applies selected and disabled state treatments', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Card onSelectionChange={() => undefined} selected data-testid="selected-card">
        Selected
      </Card>
      <Card onSelectionChange={() => undefined} disabled data-testid="disabled-card">
        Disabled
      </Card>
    </>,
  );

  const selected = getComputedStyle(screen.getByTestId('selected-card').element());
  const disabled = getComputedStyle(screen.getByTestId('disabled-card').element());

  expect(selected.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(selected.borderColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(disabled.borderColor).not.toBe(selected.borderColor);
  expect(disabled.cursor).not.toBe('pointer');
});

test('allows consumer styles to override CoreAI Card styles', async () => {
  const screen = await renderCoreAIComponent(<CustomCard />);
  const style = getComputedStyle(screen.getByTestId('custom-card').element());

  expect(style.backgroundColor).toBe('rgb(255, 0, 0)');
  expect(style.borderRadius).toBe('1px');
  expect(style.cursor).toBe('wait');
});

test('keeps stock Fluent Card surface styles when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(<Card data-testid="stock-card">Stock</Card>, {
    providerProps: { withComponentDefaults: false },
  });

  expect(getComputedStyle(screen.getByTestId('stock-card').element()).boxShadow).not.toBe('none');
});
