// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Card as FluentCard, makeStyles } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Card } from './Card.js';
import { Text } from './Text.js';

afterEach(cleanup);

const useStyles = makeStyles({
  customColor: { color: 'rgb(255, 0, 0)' },
});

const CustomColorText = () => {
  const styles = useStyles();

  return <Text className={styles.customColor}>Custom color</Text>;
};

test('preserves a custom Text color in an interactive card', async () => {
  await renderCoreAIComponent(
    <Card onClick={() => undefined}>
      <CustomColorText />
    </Card>,
  );

  const text = document.querySelector<HTMLElement>('.fui-Card .fui-Text');

  expect(text).not.toBeNull();
  expect(getComputedStyle(text!).color).toBe('rgb(255, 0, 0)');
});

// This is a "bug" with fluent. If this test fails, our bugfix can be removed.
test('overrides a custom Text color in an interactive Fluent card', async () => {
  await renderCoreAIComponent(
    <FluentCard onClick={() => undefined}>
      <CustomColorText />
    </FluentCard>,
    { providerProps: { withComponentDefaults: false } },
  );

  const text = document.querySelector<HTMLElement>('.fui-Card .fui-Text');

  expect(text).not.toBeNull();
  expect(getComputedStyle(text!).color).not.toBe('rgb(255, 0, 0)');
});
