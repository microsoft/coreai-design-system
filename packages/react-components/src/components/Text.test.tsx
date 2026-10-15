// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Text } from './Text.js';

afterEach(async () => {
  await cleanup();
});

const getTextStyles = (element: Element) => {
  const styles = getComputedStyle(element);

  return {
    color: styles.color,
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    fontStyle: styles.fontStyle,
    fontVariant: styles.fontVariant,
    fontWeight: styles.fontWeight,
    letterSpacing: styles.letterSpacing,
    lineHeight: styles.lineHeight,
    textTransform: styles.textTransform,
    wordSpacing: styles.wordSpacing,
  };
};

test.each(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)(
  'renders %s without browser default margins',
  async (as) => {
    const screen = await renderCoreAIComponent(<Text as={as}>Text content</Text>);
    const styles = getComputedStyle(screen.getByText('Text content').element());

    expect(styles.marginTop).toBe('0px');
    expect(styles.marginRight).toBe('0px');
    expect(styles.marginBottom).toBe('0px');
    expect(styles.marginLeft).toBe('0px');
  },
);

test('bare Text matches a span inherited from the same parent', async () => {
  const screen = await renderCoreAIComponent(
    <div
      style={{
        color: 'rgb(12, 34, 56)',
        fontFamily: 'Georgia',
        fontSize: '19px',
        fontStyle: 'italic',
        fontVariant: 'small-caps',
        fontWeight: 500,
        letterSpacing: '0.7px',
        lineHeight: '31px',
        textTransform: 'capitalize',
        wordSpacing: '2px',
      }}
    >
      <span>Native span</span>
      <Text>Bare Text</Text>
    </div>,
  );
  const span = screen.getByText('Native span').element();
  const text = screen.getByText('Bare Text').element();

  expect(getTextStyles(text)).toEqual(getTextStyles(span));
});

test.each([
  { size: 100 as const, expectedFontSize: 10, expectedLetterSpacing: 0.66 },
  { size: 300 as const, expectedFontSize: 14, expectedLetterSpacing: 0.532 },
  { size: 500 as const, expectedFontSize: 20, expectedLetterSpacing: 0.2 },
])(
  'applies responsive letter spacing to size $size Text',
  async ({ size, expectedFontSize, expectedLetterSpacing }) => {
    const screen = await renderCoreAIComponent(<Text size={size}>Responsive tracking</Text>);
    const styles = getComputedStyle(screen.getByText('Responsive tracking').element());

    expect(Number.parseFloat(styles.fontSize)).toBeCloseTo(expectedFontSize);
    expect(Number.parseFloat(styles.letterSpacing)).toBeCloseTo(expectedLetterSpacing);
  },
);

test('nested foreground text inherits its parent typography', async () => {
  const screen = await renderCoreAIComponent(
    <Text data-testid="heading" as="h2" preset="heading3" foreground={1}>
      Weekly status report <Text foreground={4}>00/00/0000</Text>
    </Text>,
  );
  const heading = screen.getByTestId('heading').element();
  const date = screen.getByText('00/00/0000').element();
  const headingStyles = getComputedStyle(heading);
  const dateStyles = getComputedStyle(date);

  expect(dateStyles.fontFamily).toBe(headingStyles.fontFamily);
  expect(dateStyles.fontSize).toBe(headingStyles.fontSize);
  expect(dateStyles.fontWeight).toBe(headingStyles.fontWeight);
  expect(dateStyles.lineHeight).toBe(headingStyles.lineHeight);
  expect(dateStyles.color).not.toBe(headingStyles.color);
});

test('nested foreground colors override and then inherit through descendants', async () => {
  const screen = await renderCoreAIComponent(
    <Text data-testid="parent" foreground={2}>
      Parent
      <Text data-testid="nested" foreground={4}>
        Nested <Text data-testid="descendant">descendant</Text>
      </Text>
    </Text>,
  );
  const parentColor = getComputedStyle(screen.getByTestId('parent').element()).color;
  const nestedColor = getComputedStyle(screen.getByTestId('nested').element()).color;
  const descendantColor = getComputedStyle(screen.getByTestId('descendant').element()).color;

  expect(nestedColor).not.toBe(parentColor);
  expect(descendantColor).toBe(nestedColor);
});

test('nested monospace text inherits its parent size and weight', async () => {
  const screen = await renderCoreAIComponent(
    <Text data-testid="body" preset="body" foreground={2}>
      Configuration lives in{' '}
      <Text font="monospace" foreground={1}>
        useTextStyles
      </Text>
    </Text>,
  );
  const body = screen.getByTestId('body').element();
  const code = screen.getByText('useTextStyles').element();
  const bodyStyles = getComputedStyle(body);
  const codeStyles = getComputedStyle(code);

  expect(codeStyles.fontFamily).not.toBe(bodyStyles.fontFamily);
  expect(codeStyles.fontSize).toBe(bodyStyles.fontSize);
  expect(codeStyles.fontWeight).toBe(bodyStyles.fontWeight);
  expect(codeStyles.lineHeight).toBe(bodyStyles.lineHeight);
  expect(codeStyles.color).not.toBe(bodyStyles.color);
});

test('applies each CoreAI foreground level', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Text foreground={1}>Foreground 1</Text>
      <Text foreground={2}>Foreground 2</Text>
      <Text foreground={3}>Foreground 3</Text>
      <Text foreground={4}>Foreground 4</Text>
      <Text foreground="disabled">Foreground disabled</Text>
    </>,
  );
  const colors = [
    'Foreground 1',
    'Foreground 2',
    'Foreground 3',
    'Foreground 4',
    'Foreground disabled',
  ].map((label) => getComputedStyle(screen.getByText(label).element()).color);

  expect(new Set(colors).size).toBe(colors.length);
});

// TODO: Known CoreAI bug — provider tracking currently overrides uppercase letter spacing.
test.fails('transforms uppercase text with 1.6px CoreAI letter spacing', async () => {
  const screen = await renderCoreAIComponent(<Text uppercase>Uppercase text</Text>);
  const styles = getComputedStyle(screen.getByText('Uppercase text').element());

  expect(styles.textTransform).toBe('uppercase');
  expect(Number.parseFloat(styles.letterSpacing)).toBeCloseTo(1.6);
});

test('applies preset size and weight', async () => {
  const screen = await renderCoreAIComponent(<Text preset="heading3">Preset text</Text>);
  const styles = getComputedStyle(screen.getByText('Preset text').element());

  expect(styles.fontSize).toBe('20px');
  expect(styles.fontWeight).toBe('600');
});

test('explicit size and weight override preset values', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Text preset="heading1">Preset text</Text>
      <Text preset="heading1" size={100} weight="regular">
        Overridden text
      </Text>
    </>,
  );
  const presetStyles = getComputedStyle(screen.getByText('Preset text').element());
  const overriddenStyles = getComputedStyle(screen.getByText('Overridden text').element());

  expect(overriddenStyles.fontSize).toBe('10px');
  expect(overriddenStyles.fontSize).not.toBe(presetStyles.fontSize);
  expect(overriddenStyles.fontWeight).toBe('400');
  expect(overriddenStyles.fontWeight).not.toBe(presetStyles.fontWeight);
});

test('allows consumer styles to override CoreAI text styles', async () => {
  const screen = await renderCoreAIComponent(
    <Text
      foreground={1}
      uppercase
      style={{ color: 'rgb(255, 0, 0)', letterSpacing: '2px', textTransform: 'lowercase' }}
    >
      Custom text
    </Text>,
  );
  const styles = getComputedStyle(screen.getByText('Custom text').element());

  expect(styles.color).toBe('rgb(255, 0, 0)');
  expect(styles.letterSpacing).toBe('2px');
  expect(styles.textTransform).toBe('lowercase');
});
