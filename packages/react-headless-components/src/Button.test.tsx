// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { ButtonContextProvider } from '@fluentui/react-headless-components-preview/button';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  ButtonComparison,
  buttonAppearances,
  buttonExamples,
  consumerExample,
  type ButtonExample,
} from '../../../apps/storybook/src/stories/experiments/ButtonComparison.js';
import {
  captureButtonStyles,
  compareButtonStyles,
  getComparisonButton,
  settleButtonStyles,
} from '../../../apps/storybook/src/stories/experiments/compareButtonStyles.js';
import { Button } from './Button.js';

afterEach(cleanup);

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: ButtonExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <ButtonComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  const legacy = getComparisonButton(document, 'legacy');
  const headless = getComparisonButton(document, 'headless');
  await Promise.all([settleButtonStyles(legacy), settleButtonStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of themes) {
  test.each(buttonExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareButtonStyles(captureButtonStyles(legacy), captureButtonStyles(headless))).toEqual(
      [],
    );
  });

  test.each(buttonAppearances)(`matches %s on hover in ${mode} mode`, async (appearance) => {
    const example = buttonExamples.find((item) => item.name === 'Icon before');
    if (!example) throw new Error('Missing icon fixture');
    const { legacy, headless } = await renderPair(
      { name: appearance, props: { ...example.props, appearance } },
      theme,
    );
    await userEvent.hover(legacy);
    await settleButtonStyles(legacy);
    const expected = captureButtonStyles(legacy);
    await userEvent.hover(headless);
    await settleButtonStyles(headless);
    expect(compareButtonStyles(expected, captureButtonStyles(headless))).toEqual([]);
  });

  test.each(buttonAppearances)(
    `matches %s on keyboard focus and press in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        { name: appearance, props: { appearance, children: 'Example' } },
        theme,
      );
      // Establish keyboard modality for the legacy focus polyfill before moving focus.
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(legacy).toHaveFocus();
      await expect.poll(() => getComputedStyle(legacy).boxShadow).not.toBe('none');
      await settleButtonStyles(legacy);
      const focused = captureButtonStyles(legacy);
      await userEvent.keyboard('[Space>]');
      await settleButtonStyles(legacy);
      const pressed = captureButtonStyles(legacy);
      await userEvent.keyboard('[/Space]');
      await userEvent.tab();
      await expect.element(headless).toHaveFocus();
      await settleButtonStyles(headless);
      expect(compareButtonStyles(focused, captureButtonStyles(headless))).toEqual([]);
      await userEvent.keyboard('[Space>]');
      await settleButtonStyles(headless);
      expect(compareButtonStyles(pressed, captureButtonStyles(headless))).toEqual([]);
      await userEvent.keyboard('[/Space]');
    },
  );
}

test.each(['small', 'medium', 'large'] as const)(
  'restores Fluent defaults for %s when CoreAI defaults are disabled',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, children: 'Example' } },
      coreaiLightTheme,
      false,
    );
    expect(compareButtonStyles(captureButtonStyles(legacy), captureButtonStyles(headless))).toEqual(
      [],
    );
  },
);

test.each(['before', 'after'] as const)('matches icon %s spacing in RTL', async (iconPosition) => {
  const example = buttonExamples.find((item) => item.name === 'Icon before');
  if (!example) throw new Error('Missing icon fixture');
  const { legacy, headless } = await renderPair(
    { name: iconPosition, props: { ...example.props, iconPosition } },
    coreaiLightTheme,
    true,
    'rtl',
  );
  expect(compareButtonStyles(captureButtonStyles(legacy), captureButtonStyles(headless))).toEqual(
    [],
  );
});

test('allows ordinary consumer CSS Modules to override root and icon styles', async () => {
  const { headless } = await renderPair(consumerExample);
  const styles = captureButtonStyles(headless);
  expect(styles['root.min-width']).toBe('120px');
  expect(styles['root.border-radius']).toBe('3px');
  expect(styles['icon.font-size']).toBe('16px');
  expect(styles['icon.width']).toBe('16px');
});

test('inherits headless Button context size and allows an explicit override', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <ButtonContextProvider value={{ size: 'small' }}>
        <Button>Inherited</Button>
        <Button size="large">Explicit</Button>
      </ButtonContextProvider>
    </CoreAIFluentProvider>,
  );
  expect(getComputedStyle(screen.getByRole('button', { name: 'Inherited' }).element()).height).toBe(
    '24px',
  );
  expect(getComputedStyle(screen.getByRole('button', { name: 'Explicit' }).element()).height).toBe(
    '40px',
  );
});

test('preserves resolved slots, custom classes, handlers, and refs without leaking visual props', async () => {
  const rootRef = React.createRef<HTMLButtonElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Button
        ref={rootRef}
        appearance="primary"
        size="small"
        shape="square"
        className="consumer-button"
        icon={{
          ref: iconRef,
          className: 'consumer-icon',
          children: <span className="consumer-icon-content">+</span>,
        }}
        onClick={onClick}
      >
        Save
      </Button>
    </CoreAIFluentProvider>,
  );
  const button = screen.getByRole('button', { name: '+ Save' }).element();
  expect(rootRef.current).toBe(button);
  expect(button).toHaveClass('consumer-button');
  expect(iconRef.current).toHaveClass('consumer-icon');
  expect(iconRef.current?.firstElementChild).toHaveClass('consumer-icon-content');
  for (const prop of ['appearance', 'size', 'shape']) {
    expect(button.hasAttribute(prop)).toBe(false);
  }
  await userEvent.click(button);
  await userEvent.keyboard('{Enter}');
  expect(onClick).toHaveBeenCalledTimes(2);
});

test('keeps disabled-focusable buttons in tab order without activating them', async () => {
  const onClick = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
      <Button disabledFocusable onClick={onClick}>
        Disabled focusable
      </Button>
      <Button>Next</Button>
    </CoreAIFluentProvider>,
  );
  const button = screen.getByRole('button', { name: 'Disabled focusable' });
  await userEvent.tab();
  await expect.element(button).toHaveFocus();
  await expect.element(button).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{Enter} ');
  await userEvent.click(button, { force: true });
  expect(onClick).not.toHaveBeenCalled();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
});

test('forwards anchor refs and preserves disabled anchor behavior', async () => {
  const anchorRef = React.createRef<HTMLAnchorElement>();
  const onClick = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Button as="a" href="#target" ref={anchorRef}>
        Enabled link
      </Button>
      <Button as="a" href="#target" disabledFocusable onClick={onClick}>
        Disabled link
      </Button>
    </CoreAIFluentProvider>,
  );
  expect(anchorRef.current?.tagName).toBe('A');
  expect(anchorRef.current?.getAttribute('href')).toBe('#target');
  const disabled = screen.getByRole('link', { name: 'Disabled link' });
  await expect.element(disabled).toHaveAttribute('aria-disabled', 'true');
  await expect.element(disabled).not.toHaveAttribute('href');
  await userEvent.click(disabled, { force: true });
  expect(onClick).not.toHaveBeenCalled();
});
