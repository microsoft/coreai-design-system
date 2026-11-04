// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ForwardRefComponent, SlotRenderFunction } from '@fluentui/react-utilities';
import { ButtonContextProvider } from '@fluentui/react-headless-components-preview/button';
import { coreaiLightTheme, coreaiDarkTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  MenuButtonComparison,
  menuButtonExamples,
  menuButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantIcon,
  type MenuButtonExample,
} from '../../../apps/storybook/src/stories/experiments/ButtonVariantsComparison.js';
import { MenuButtonFlow } from '../../../apps/storybook/src/stories/experiments/ButtonVariantsFlows.js';
import {
  captureButtonVariantStyles,
  compareButtonVariantStyles,
  getComparisonButtonVariant,
  settleButtonVariantStyles,
} from '../../../apps/storybook/src/stories/experiments/compareButtonVariantsStyles.js';
import { MenuButton, menuButtonClassNames, type MenuButtonProps } from './MenuButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: MenuButtonExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={defaults} dir={dir}>
      <MenuButtonComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonButtonVariant(screen.container, 'legacy');
  const headless = getComparisonButtonVariant(screen.container, 'headless');
  await Promise.all([settleButtonVariantStyles(legacy), settleButtonVariantStyles(headless)]);
  return { screen, legacy, headless };
}
const capture = (root: HTMLElement) => captureButtonVariantStyles(root, 'menu');

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(menuButtonExamples)(`matches $name at rest in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  });

  test.each(buttonVariantAppearances)(
    `matches expanded %s hover, focus, and press in ${mode}`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        {
          name: appearance,
          props: {
            appearance,
            'aria-expanded': true,
            icon: buttonVariantIcon,
            children: 'Actions',
          },
        },
        theme,
      );
      await userEvent.hover(legacy);
      expect(legacy.matches(':hover')).toBe(true);
      await settleButtonVariantStyles(legacy);
      const hovered = capture(legacy);
      await userEvent.hover(headless);
      expect(headless.matches(':hover')).toBe(true);
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(hovered, capture(headless))).toEqual([]);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(legacy).toHaveFocus();
      await settleButtonVariantStyles(legacy);
      const focused = capture(legacy);
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
      await userEvent.keyboard('[Space>]');
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(pressed, capture(headless))).toEqual([]);
      await userEvent.keyboard('[/Space]');
    },
  );
}

test.each(['small', 'medium', 'large'] as const)(
  'restores delegated Fluent %s defaults on opt-out',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, children: 'Actions' } },
      coreaiLightTheme,
      false,
    );
    expect(headless.dataset.shape).toBe('rounded');
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  },
);

test('preserves public refs, native slots, caller render functions, classes, and ARIA', async () => {
  expectTypeOf(MenuButton).toMatchTypeOf<ForwardRefComponent<MenuButtonProps>>();
  const ref = React.createRef<HTMLButtonElement>();
  const menuRef = React.createRef<HTMLSpanElement>();
  const renderIcon: SlotRenderFunction<React.ComponentProps<'span'>> = (Component, props) => (
    <Component {...props} data-rendered="menu">
      ⌄
    </Component>
  );
  const menuIcon = {
    ref: menuRef,
    className: 'consumer-chevron',
    children: renderIcon,
    'data-contract': 'kept',
  };
  await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <ButtonContextProvider value={{ size: 'large' }}>
        <MenuButton
          ref={ref}
          className="consumer-menu"
          aria-label="More release actions"
          aria-controls="supplied-popup"
          aria-haspopup="menu"
          aria-expanded="true"
          data-caller="kept"
          icon={buttonVariantIcon}
          menuIcon={menuIcon}
        >
          Actions
        </MenuButton>
      </ButtonContextProvider>
    </CoreAIFluentProvider>,
  );
  expect(ref.current?.tagName).toBe('BUTTON');
  expect(ref.current).toHaveClass(menuButtonClassNames.root, 'fui-Button', 'consumer-menu');
  expect(ref.current).toHaveAttribute('data-size', 'large');
  expect(ref.current).toHaveAttribute('data-open', '');
  expect(ref.current).toHaveAttribute('data-caller', 'kept');
  expect(ref.current).toHaveAttribute('aria-controls', 'supplied-popup');
  expect(ref.current).toHaveAttribute('aria-haspopup', 'menu');
  expect(menuRef.current).toHaveClass(menuButtonClassNames.menuIcon, 'consumer-chevron');
  expect(menuRef.current?.dataset.contract).toBe('kept');
  expect(menuRef.current?.dataset.rendered).toBe('menu');
  expect(ref.current?.querySelector('.parity-icon')).toHaveClass(
    menuButtonClassNames.icon,
    'fui-Button__icon',
  );
});

test('adds only the visual chevron and does not invent standalone menu behavior', async () => {
  const onClick = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <MenuButton onClick={(event) => onClick(event.type, event.currentTarget.tagName)}>
        Standalone actions
      </MenuButton>
      <MenuButton menuIcon={null}>No chevron</MenuButton>
      <MenuButton icon={buttonVariantIcon} aria-label="Icon actions" />
    </CoreAIFluentProvider>,
  );
  const button = screen.getByRole('button', { name: 'Standalone actions', exact: true });
  expect(button.element().querySelector(`.${menuButtonClassNames.menuIcon} svg`)).not.toBeNull();
  await userEvent.click(button);
  await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  expect(onClick.mock.calls).toEqual([['click', 'BUTTON']]);
  expect(
    screen
      .getByRole('button', { name: 'No chevron' })
      .element()
      .querySelector(`.${menuButtonClassNames.menuIcon}`),
  ).toBeNull();
  expect(
    screen
      .getByRole('button', { name: 'Icon actions' })
      .element()
      .querySelector(`.${menuButtonClassNames.menuIcon}`),
  ).toBeNull();
});

test('uses the public Menu context for native activation, selection, and Escape', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <MenuButtonFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Release actions', exact: true });
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await userEvent.click(trigger);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  const item = screen.getByRole('menuitem', { name: 'Inspect release', exact: true });
  await expect.element(item).toBeVisible();
  const popover = item.element().closest('[popover]');
  expect(popover?.getAttribute('popover')).toBe('auto');
  await userEvent.click(item);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('Last action: Inspect release; requested open: false');
  trigger.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('retains anchor semantics, native submission, and disabled-focusable activation blocking', async () => {
  const anchorRef = React.createRef<HTMLAnchorElement>();
  const click = vi.fn();
  const submit = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <MenuButton
        as="a"
        href="#release-actions"
        ref={anchorRef}
        onClick={(event) => {
          event.preventDefault();
          click(event.type, event.currentTarget.tagName);
        }}
      >
        Linked actions
      </MenuButton>
      <MenuButton disabledFocusable onClick={click}>
        Locked actions
      </MenuButton>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(new FormData(event.currentTarget).get('release'));
        }}
      >
        <input name="release" defaultValue="v2" />
        <MenuButton type="submit">Submit action</MenuButton>
      </form>
    </CoreAIFluentProvider>,
  );
  expect(anchorRef.current?.getAttribute('href')).toBe('#release-actions');
  await userEvent.click(anchorRef.current!);
  expect(click.mock.calls).toEqual([['click', 'A']]);
  const disabled = screen.getByRole('button', { name: 'Locked actions' });
  disabled.element().focus();
  await userEvent.keyboard('{Enter}');
  await userEvent.click(disabled, { force: true });
  expect(click.mock.calls).toEqual([['click', 'A']]);
  await userEvent.click(screen.getByRole('button', { name: 'Submit action' }));
  expect(submit.mock.calls).toEqual([['v2']]);
});

test('preserves RTL chevron spacing and consumer priority', async () => {
  const { legacy, headless } = await renderPair(
    { name: 'RTL', props: { icon: buttonVariantIcon, children: 'Actions' } },
    coreaiLightTheme,
    true,
    'rtl',
  );
  expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  await cleanup();
  const consumer = await renderPair(menuButtonConsumerExample);
  expect(getComputedStyle(consumer.headless).minWidth).toBe('120px');
  expect(getComputedStyle(consumer.headless).borderRadius).toBe('3px');
  expect(capture(consumer.headless)['icon.font-size']).toBe('16px');
});
