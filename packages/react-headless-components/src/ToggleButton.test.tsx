// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { ButtonContextProvider } from '@fluentui/react-headless-components-preview/button';
import {
  CoreAIFluentProvider,
  coreaiLightTheme,
  coreaiDarkTheme,
} from '@coreai-ds/react-components';
import {
  ToggleButtonComparison,
  toggleButtonExamples,
  toggleButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantIcon,
  type ToggleButtonExample,
} from '../../../apps/storybook/src/stories/experiments/ButtonVariantsComparison.js';
import {
  captureButtonVariantStyles,
  compareButtonVariantStyles,
  getComparisonButtonVariant,
  settleButtonVariantStyles,
} from '../../../apps/storybook/src/stories/experiments/compareButtonVariantsStyles.js';
import { ToggleButton, toggleButtonClassNames, type ToggleButtonProps } from './ToggleButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: ToggleButtonExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={defaults} dir={dir}>
      <ToggleButtonComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonButtonVariant(screen.container, 'legacy');
  const headless = getComparisonButtonVariant(screen.container, 'headless');
  await Promise.all([settleButtonVariantStyles(legacy), settleButtonVariantStyles(headless)]);
  return { screen, legacy, headless };
}
const capture = (root: HTMLElement) => captureButtonVariantStyles(root, 'toggle');

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(toggleButtonExamples)(`matches $name at rest in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  });

  test.each(buttonVariantAppearances)(
    `matches checked %s hover, focus, combined hover/focus, and press in ${mode}`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        {
          name: appearance,
          props: { appearance, checked: true, icon: buttonVariantIcon, children: 'Pin' },
        },
        theme,
      );
      await userEvent.hover(legacy);
      expect(legacy.matches(':hover')).toBe(true);
      await settleButtonVariantStyles(legacy);
      const hovered = capture(legacy);
      await userEvent.hover(headless);
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(hovered, capture(headless))).toEqual([]);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(legacy).toHaveFocus();
      await settleButtonVariantStyles(legacy);
      const focused = capture(legacy);
      await userEvent.hover(legacy);
      await settleButtonVariantStyles(legacy);
      const focusedHover = capture(legacy);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      await userEvent.keyboard('[Space>]');
      await settleButtonVariantStyles(legacy);
      const pressed = capture(legacy);
      await userEvent.keyboard('[/Space]');
      await userEvent.tab();
      await expect.element(headless).toHaveFocus();
      expect(headless.matches(':hover')).toBe(false);
      expect(headless.matches(':focus-visible')).toBe(true);
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(focused, capture(headless))).toEqual([]);
      await userEvent.hover(headless);
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(focusedHover, capture(headless))).toEqual([]);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      await userEvent.keyboard('[Space>]');
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(pressed, capture(headless))).toEqual([]);
      await userEvent.keyboard('[/Space]');
    },
  );
}

test.each(['small', 'medium', 'large'] as const)(
  'restores Fluent %s defaults on opt-out',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, children: 'Pin' } },
      coreaiLightTheme,
      false,
    );
    expect(headless.dataset.shape).toBe('rounded');
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  },
);

test('inherits current context size and preserves native ref, caller ARIA, classes, and data', async () => {
  expectTypeOf(ToggleButton).toMatchTypeOf<ForwardRefComponent<ToggleButtonProps>>();
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <ButtonContextProvider value={{ size: 'small' }}>
        <ToggleButton
          ref={ref}
          className="consumer-toggle"
          defaultChecked
          aria-label="Pin release"
          data-caller="kept"
          icon={buttonVariantIcon}
        />
      </ButtonContextProvider>
    </CoreAIFluentProvider>,
  );
  expect(ref.current?.tagName).toBe('BUTTON');
  expect(ref.current).toHaveClass(toggleButtonClassNames.root, 'fui-Button', 'consumer-toggle');
  expect(ref.current).toHaveAttribute('data-size', 'small');
  expect(ref.current).toHaveAttribute('data-checked', '');
  expect(ref.current).toHaveAttribute('data-caller', 'kept');
  expect(ref.current).toHaveAttribute('aria-label', 'Pin release');
  expect(ref.current?.querySelector('.parity-icon')).toHaveClass(
    toggleButtonClassNames.icon,
    'fui-Button__icon',
  );
});

test('keeps checked/defaultChecked and click event payload in the public hook without inventing a change event', async () => {
  const onClick = vi.fn();
  const onChange = vi.fn();
  function Controlled() {
    const [checked, setChecked] = React.useState(false);
    return (
      <ToggleButton
        checked={checked}
        defaultChecked
        onChange={onChange}
        onClick={(event) => {
          onClick(
            event.type,
            event.currentTarget.tagName,
            event.currentTarget.getAttribute('aria-pressed'),
          );
          setChecked((value) => !value);
        }}
      >
        Controlled pin
      </ToggleButton>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <Controlled />
      <ToggleButton defaultChecked>Default pin</ToggleButton>
      <ToggleButton defaultChecked onClick={(event) => event.preventDefault()}>
        Prevented pin
      </ToggleButton>
    </CoreAIFluentProvider>,
  );
  const controlled = screen.getByRole('button', { name: 'Controlled pin', exact: true });
  await expect.element(controlled).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(controlled);
  await expect.element(controlled).toHaveAttribute('aria-pressed', 'true');
  expect(onClick.mock.calls).toEqual([['click', 'BUTTON', 'false']]);
  expect(onChange).not.toHaveBeenCalled();
  const uncontrolled = screen.getByRole('button', { name: 'Default pin', exact: true });
  await userEvent.click(uncontrolled);
  await expect.element(uncontrolled).toHaveAttribute('aria-pressed', 'false');
  await userEvent.keyboard('{Enter}');
  await expect.element(uncontrolled).toHaveAttribute('aria-pressed', 'true');
  await userEvent.keyboard(' ');
  await expect.element(uncontrolled).toHaveAttribute('aria-pressed', 'false');
  const prevented = screen.getByRole('button', { name: 'Prevented pin', exact: true });
  await userEvent.click(prevented);
  await expect.element(prevented).toHaveAttribute('aria-pressed', 'true');
});

test.each([{ disabled: true }, { disabledFocusable: true }])(
  'blocks disabled activation and retains checked state: %j',
  async (disabledProps) => {
    const onClick = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider theme={coreaiLightTheme}>
        <ToggleButton {...disabledProps} defaultChecked onClick={onClick}>
          Locked
        </ToggleButton>
      </CoreAIFluentProvider>,
    );
    const button = screen.getByRole('button', { name: 'Locked' });
    if (disabledProps.disabledFocusable) {
      button.element().focus();
      await userEvent.keyboard('{Enter} ');
      await userEvent.click(button, { force: true });
    } else {
      await expect.element(button).toBeDisabled();
    }
    expect(onClick).not.toHaveBeenCalled();
    await expect.element(button).toHaveAttribute('aria-pressed', 'true');
  },
);

test('retains checkbox-role ARIA and anchor semantics', async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  const onClick = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <ToggleButton role="checkbox" defaultChecked>
        Checkbox toggle
      </ToggleButton>
      <ToggleButton
        as="a"
        href="#pinned"
        ref={ref}
        onClick={(event) => {
          event.preventDefault();
          onClick(event.currentTarget.tagName);
        }}
      >
        Pinned releases
      </ToggleButton>
    </CoreAIFluentProvider>,
  );
  const checkbox = screen.getByRole('checkbox', { name: 'Checkbox toggle' });
  await expect.element(checkbox).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(checkbox);
  await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
  expect(ref.current?.getAttribute('href')).toBe('#pinned');
  await userEvent.click(ref.current!);
  expect(onClick.mock.calls).toEqual([['A']]);
});

test('preserves RTL spacing and unlayered consumer priority', async () => {
  const { legacy, headless } = await renderPair(
    {
      name: 'RTL',
      props: { icon: buttonVariantIcon, iconPosition: 'after', checked: true, children: 'Pin' },
    },
    coreaiLightTheme,
    true,
    'rtl',
  );
  expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  await cleanup();
  const consumer = await renderPair(toggleButtonConsumerExample);
  expect(getComputedStyle(consumer.headless).minWidth).toBe('120px');
  expect(getComputedStyle(consumer.headless).borderRadius).toBe('3px');
  expect(capture(consumer.headless)['icon.font-size']).toBe('16px');
});
