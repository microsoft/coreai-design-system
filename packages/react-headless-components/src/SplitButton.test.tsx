// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  Slot,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { ButtonContextProvider } from '@fluentui/react-headless-components-preview/button';
import {
  CoreAIFluentProvider,
  coreaiLightTheme,
  coreaiDarkTheme,
} from '@coreai-ds/react-components';
import {
  SplitButtonComparison,
  splitButtonExamples,
  splitButtonConsumerExample,
  buttonVariantAppearances,
  type SplitButtonExample,
} from '../../../apps/storybook/src/stories/experiments/ButtonVariantsComparison.js';
import { SplitButtonFlow } from '../../../apps/storybook/src/stories/experiments/ButtonVariantsFlows.js';
import {
  captureButtonVariantStyles,
  compareButtonVariantStyles,
  getComparisonButtonVariant,
  settleButtonVariantStyles,
} from '../../../apps/storybook/src/stories/experiments/compareButtonVariantsStyles.js';
import {
  SplitButton,
  splitButtonClassNames,
  type SplitButtonProps,
  type SplitButtonSlots,
} from './SplitButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: SplitButtonExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={defaults} dir={dir}>
      <SplitButtonComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonButtonVariant(screen.container, 'legacy');
  const headless = getComparisonButtonVariant(screen.container, 'headless');
  await Promise.all([settleButtonVariantStyles(legacy), settleButtonVariantStyles(headless)]);
  return { screen, legacy, headless };
}
const capture = (root: HTMLElement) => captureButtonVariantStyles(root, 'split');
function action(root: HTMLElement, slot: 'primaryActionButton' | 'menuButton') {
  const element = root.querySelector<HTMLElement>(`.${splitButtonClassNames[slot]}`);
  if (!element) throw new Error(`Missing SplitButton ${slot}`);
  return element;
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(splitButtonExamples)(`matches $name at rest in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  });

  test.each(buttonVariantAppearances)(
    `matches %s joined hover and independent keyboard focus/press in ${mode}`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        { name: appearance, props: { appearance, children: 'Deploy' } },
        theme,
      );
      for (const name of ['primaryActionButton', 'menuButton'] as const) {
        await userEvent.hover(action(legacy, name));
        expect(legacy.matches(':hover')).toBe(true);
        await settleButtonVariantStyles(legacy);
        const hovered = capture(legacy);
        await userEvent.hover(action(headless, name));
        await settleButtonVariantStyles(headless);
        expect(compareButtonVariantStyles(hovered, capture(headless))).toEqual([]);
      }
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(action(legacy, 'primaryActionButton')).toHaveFocus();
      await settleButtonVariantStyles(legacy);
      const primaryFocus = capture(legacy);
      await userEvent.keyboard('[Space>]');
      await settleButtonVariantStyles(legacy);
      const primaryPress = capture(legacy);
      await userEvent.keyboard('[/Space]');
      await userEvent.tab();
      await expect.element(action(legacy, 'menuButton')).toHaveFocus();
      await settleButtonVariantStyles(legacy);
      const menuFocus = capture(legacy);
      await userEvent.tab();
      await expect.element(action(headless, 'primaryActionButton')).toHaveFocus();
      expect(headless.matches(':hover')).toBe(false);
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(primaryFocus, capture(headless))).toEqual([]);
      await userEvent.keyboard('[Space>]');
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(primaryPress, capture(headless))).toEqual([]);
      await userEvent.keyboard('[/Space]');
      await userEvent.tab();
      await expect.element(action(headless, 'menuButton')).toHaveFocus();
      await settleButtonVariantStyles(headless);
      expect(compareButtonVariantStyles(menuFocus, capture(headless))).toEqual([]);
    },
  );
}

test.each(['small', 'medium', 'large'] as const)(
  'restores Fluent %s defaults on both child buttons',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, children: 'Deploy' } },
      coreaiLightTheme,
      false,
    );
    expect(headless.dataset.shape).toBe('rounded');
    expect(action(headless, 'primaryActionButton').dataset.shape).toBe('rounded');
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  },
);

test.each(['rounded', 'circular', 'square'] as const)(
  'joins %s corners and seam logically in RTL',
  async (shape) => {
    const { legacy, headless } = await renderPair(
      { name: shape, props: { shape, appearance: 'primary', children: 'Deploy' } },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
    expect(getComputedStyle(action(headless, 'primaryActionButton')).borderTopLeftRadius).toBe(
      '0px',
    );
    expect(getComputedStyle(action(headless, 'menuButton')).borderTopRightRadius).toBe('0px');
  },
);

test('preserves root and independent child refs, consumer classes, render functions, and ARIA', async () => {
  expectTypeOf(SplitButton).toMatchTypeOf<ForwardRefComponent<SplitButtonProps>>();
  const rootRef = React.createRef<HTMLDivElement>();
  const primaryRef = React.createRef<HTMLButtonElement>();
  const menuRef = React.createRef<HTMLButtonElement>();
  const warning = vi.spyOn(console, 'warn');
  const primaryRender: SlotRenderFunction<
    Extract<ExtractSlotProps<SplitButtonSlots['primaryActionButton']>, { as?: 'button' }>
  > = (Component, props) => <Component {...props} data-rendered="primary" />;
  const menuRender: SlotRenderFunction<
    Extract<ExtractSlotProps<SplitButtonSlots['menuButton']>, { as?: 'button' }>
  > = (Component, props) => <Component {...props} data-rendered="menu" />;
  const primary = {
    ref: primaryRef,
    className: 'consumer-primary',
    children: primaryRender,
    'aria-label': 'Deploy now',
    'data-contract': 'primary',
  };
  const menu = {
    ref: menuRef,
    className: 'consumer-menu',
    children: menuRender,
    'aria-label': 'More deployment options',
    'aria-controls': 'supplied-menu',
    'data-contract': 'menu',
  };
  await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <ButtonContextProvider value={{ size: 'large' }}>
        <SplitButton
          ref={rootRef}
          className="consumer-split"
          data-caller="kept"
          primaryActionButton={primary}
          menuButton={menu}
        >
          Deploy
        </SplitButton>
      </ButtonContextProvider>
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current?.tagName).toBe('DIV');
  expect(rootRef.current).toHaveClass(splitButtonClassNames.root, 'consumer-split');
  expect(rootRef.current).not.toHaveClass('fui-Button');
  expect(rootRef.current).toHaveAttribute('data-caller', 'kept');
  expect(primaryRef.current?.tagName).toBe('BUTTON');
  expect(menuRef.current?.tagName).toBe('BUTTON');
  expect(primaryRef.current).not.toBe(menuRef.current);
  expect(primaryRef.current).toHaveClass(
    splitButtonClassNames.primaryActionButton,
    'fui-Button',
    'consumer-primary',
  );
  expect(menuRef.current).toHaveClass(
    splitButtonClassNames.menuButton,
    'fui-MenuButton',
    'consumer-menu',
  );
  expect(primaryRef.current).toHaveAttribute('data-size', 'medium');
  expect(menuRef.current).toHaveAttribute('data-size', 'medium');
  expect(primaryRef.current).toHaveAttribute('data-rendered', 'primary');
  expect(menuRef.current).toHaveAttribute('data-rendered', 'menu');
  expect(primaryRef.current).toHaveAttribute('data-contract', 'primary');
  expect(menuRef.current).toHaveAttribute('data-contract', 'menu');
  expect(menuRef.current).toHaveAttribute('aria-controls', 'supplied-menu');
  expect(menuRef.current).not.toHaveAttribute('aria-labelledby');
  expect(
    warning.mock.calls
      .map(([message]) => String(message))
      .filter((message) => message.includes('state.') && message.includes('slot')),
  ).toEqual([]);
});

test('retains generated menu labelling and slot-level visual overrides without a second behavior model', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <SplitButton
        size="large"
        shape="circular"
        primaryActionButton={{ size: 'small', appearance: 'outline' }}
      >
        Deploy
      </SplitButton>
    </CoreAIFluentProvider>,
  );
  const root = screen.container.querySelector<HTMLElement>(`.${splitButtonClassNames.root}`);
  if (!root) throw new Error('Missing SplitButton');
  const primary = action(root, 'primaryActionButton');
  const menu = action(root, 'menuButton');
  expect(menu.getAttribute('aria-labelledby')).toBe(primary.id);
  expect(primary.dataset.size).toBe('small');
  expect(primary.dataset.appearance).toBe('outline');
  expect(menu.dataset.size).toBe('large');
  expect(menu.dataset.shape).toBe('circular');
});

test('preserves anchor refs and render functions for either independently selected native slot', async () => {
  const primaryRef = React.createRef<HTMLAnchorElement>();
  const menuRef = React.createRef<HTMLAnchorElement>();
  const click = vi.fn();
  const anchorRender: SlotRenderFunction<ExtractSlotProps<Slot<'a'>>> = (Component, props) => (
    <Component {...props} data-rendered="anchor" />
  );
  const primary = {
    as: 'a',
    ref: primaryRef,
    href: '#release-details',
    children: anchorRender,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      click(event.currentTarget);
    },
  } satisfies Extract<ExtractSlotProps<SplitButtonSlots['primaryActionButton']>, { as: 'a' }>;
  const menu = {
    as: 'a',
    ref: menuRef,
    href: '#release-options',
    'aria-label': 'Linked release options',
    children: anchorRender,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      click(event.currentTarget);
    },
  } satisfies Extract<ExtractSlotProps<SplitButtonSlots['menuButton']>, { as: 'a' }>;
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <SplitButton primaryActionButton={primary} menuButton={menu}>
        Release details
      </SplitButton>
    </CoreAIFluentProvider>,
  );
  const primaryLink = screen.getByRole('link', { name: 'Release details', exact: true }).element();
  const menuLink = screen
    .getByRole('link', { name: 'Linked release options', exact: true })
    .element();
  expect(primaryRef.current).toBe(primaryLink);
  expect(menuRef.current).toBe(menuLink);
  expect(primaryLink).toHaveAttribute('data-rendered', 'anchor');
  expect(menuLink).toHaveAttribute('data-rendered', 'anchor');
  await userEvent.click(primaryLink);
  await userEvent.click(menuLink);
  expect(click.mock.calls.length).toBe(2);
  expect(click.mock.calls[0][0]).toBe(primaryLink);
  expect(click.mock.calls[1][0]).toBe(menuLink);
});

test('keeps primary and menu activation independent through the public Menu context', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <SplitButtonFlow />
    </CoreAIFluentProvider>,
  );
  const primary = screen.getByRole('button', { name: 'Deploy release', exact: true });
  const menu = screen.getByRole('button', { name: 'More deployment options', exact: true });
  await userEvent.click(primary);
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('Deployments: 1; last action: None');
  await expect.element(menu).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(menu);
  await expect.element(menu).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Schedule deployment', exact: true }));
  await expect.element(menu).toHaveAttribute('aria-expanded', 'false');
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('Deployments: 1; last action: Schedule deployment');
  primary.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('Deployments: 2; last action: Schedule deployment');
});

test('preserves separate native callback targets, submission, links, and disabled slots', async () => {
  const primaryClick = vi.fn();
  const menuClick = vi.fn();
  const submit = vi.fn();
  const anchorRef = React.createRef<HTMLAnchorElement>();
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(new FormData(event.currentTarget).get('release'));
        }}
      >
        <input name="release" defaultValue="v2" />
        <SplitButton
          primaryActionButton={{
            as: 'button',
            type: 'submit',
            onClick: (event) => primaryClick(event.type, event.currentTarget.tagName),
          }}
          menuButton={{
            as: 'button',
            'aria-label': 'Submission options',
            onClick: (event) => menuClick(event.type, event.currentTarget.tagName),
          }}
        >
          Submit release
        </SplitButton>
      </form>
      <SplitButton
        primaryActionButton={{
          as: 'a',
          href: '#details',
          ref: anchorRef,
          onClick: (event) => event.preventDefault(),
        }}
        menuButton={{ disabled: true, 'aria-label': 'Locked link options', onClick: menuClick }}
      >
        Release details
      </SplitButton>
      <SplitButton
        disabledFocusable
        primaryActionButton={{ 'aria-label': 'Locked primary', onClick: primaryClick }}
        menuButton={{ 'aria-label': 'Locked menu', onClick: menuClick }}
      >
        Locked
      </SplitButton>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Submit release', exact: true }));
  expect(primaryClick.mock.calls).toEqual([['click', 'BUTTON']]);
  expect(submit.mock.calls).toEqual([['v2']]);
  await userEvent.click(screen.getByRole('button', { name: 'Submission options' }));
  expect(menuClick.mock.calls).toEqual([['click', 'BUTTON']]);
  expect(submit.mock.calls).toEqual([['v2']]);
  expect(anchorRef.current?.tagName).toBe('A');
  expect(anchorRef.current?.getAttribute('href')).toBe('#details');
  await expect.element(screen.getByRole('button', { name: 'Locked link options' })).toBeDisabled();
  for (const name of ['Locked primary', 'Locked menu']) {
    const disabled = screen.getByRole('button', { name, exact: true });
    disabled.element().focus();
    await userEvent.keyboard('{Enter} ');
    await userEvent.click(disabled, { force: true });
  }
  expect(primaryClick.mock.calls).toEqual([['click', 'BUTTON']]);
  expect(menuClick.mock.calls).toEqual([['click', 'BUTTON']]);
});

test('ordinary consumer CSS overrides both completed child foundations and joined corners', async () => {
  const { headless } = await renderPair(splitButtonConsumerExample);
  const primary = action(headless, 'primaryActionButton');
  const menu = action(headless, 'menuButton');
  expect(getComputedStyle(primary).minWidth).toBe('120px');
  expect(getComputedStyle(menu).minWidth).toBe('120px');
  expect(getComputedStyle(primary).borderRadius).toBe('3px');
  expect(getComputedStyle(menu).borderRadius).toBe('3px');
  expect(capture(headless)['icon.font-size']).toBe('16px');
});
