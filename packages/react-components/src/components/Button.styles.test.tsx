// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { makeStyles } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Button } from './Button.js';
import { CompoundButton } from './CompoundButton.js';
import { MenuButton } from './MenuButton.js';
import { SplitButton } from './SplitButton.js';
import { ToggleButton } from './ToggleButton.js';

afterEach(cleanup);

const useStyles = makeStyles({
  customMinWidth: { minWidth: '72px' },
});

const ConsumerStyledButton = () => {
  const styles = useStyles();

  return <Button className={styles.customMinWidth}>Consumer styled</Button>;
};

test.each([
  ['Button', <Button>Default</Button>, '.fui-Button'],
  ['CompoundButton', <CompoundButton>Default</CompoundButton>, '.fui-CompoundButton'],
  ['MenuButton', <MenuButton>Default</MenuButton>, '.fui-MenuButton'],
  ['SplitButton', <SplitButton>Default</SplitButton>, '.fui-SplitButton'],
  ['ToggleButton', <ToggleButton>Default</ToggleButton>, '.fui-ToggleButton'],
])('registers the shared minimum-width hook for %s', async (_name, component, selector) => {
  await renderCoreAIComponent(component);
  const root = document.querySelector<HTMLElement>(selector);

  expect(root).not.toBeNull();
  expect(getComputedStyle(root!).minWidth).toBe('40px');
});

test('does not apply the content minimum width to icon-only buttons', async () => {
  const screen = await renderCoreAIComponent(
    <Button aria-label="Icon only" icon={<span aria-hidden="true">+</span>} />,
  );
  const button = screen.getByRole('button', { name: 'Icon only' }).element();
  const styles = getComputedStyle(button);

  expect(styles.minWidth).not.toBe('40px');
  expect(styles.width).toBe(styles.height);
});

test('uses the Fluent minimum width when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(<Button>Default</Button>, {
    providerProps: { withComponentDefaults: false },
  });

  expect(getComputedStyle(screen.getByRole('button', { name: 'Default' }).element()).minWidth).toBe(
    '96px',
  );
});

test('preserves consumer style precedence', async () => {
  const screen = await renderCoreAIComponent(<ConsumerStyledButton />);

  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Consumer styled' }).element()).minWidth,
  ).toBe('72px');
});
