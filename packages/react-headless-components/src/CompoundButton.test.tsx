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
  CompoundButtonComparison,
  compoundButtonExamples,
  compoundButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantIcon,
  type CompoundButtonExample,
} from '../../../apps/storybook/src/stories/experiments/ButtonVariantsComparison.js';
import { CompoundButtonFlow } from '../../../apps/storybook/src/stories/experiments/ButtonVariantsFlows.js';
import {
  captureButtonVariantStyles,
  compareButtonVariantStyles,
  getComparisonButtonVariant,
  settleButtonVariantStyles,
} from '../../../apps/storybook/src/stories/experiments/compareButtonVariantsStyles.js';
import {
  CompoundButton,
  compoundButtonClassNames,
  type CompoundButtonProps,
} from './CompoundButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: CompoundButtonExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <CompoundButtonComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonButtonVariant(screen.container, 'legacy');
  const headless = getComparisonButtonVariant(screen.container, 'headless');
  await Promise.all([settleButtonVariantStyles(legacy), settleButtonVariantStyles(headless)]);
  return { screen, legacy, headless };
}

function capture(root: HTMLElement) {
  return captureButtonVariantStyles(root, 'compound');
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(compoundButtonExamples)(`matches $name at rest in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  });

  test.each(buttonVariantAppearances)(
    `matches %s secondary content and icon on hover, focus, and press in ${mode}`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        {
          name: appearance,
          props: {
            appearance,
            icon: buttonVariantIcon,
            children: 'Create release',
            secondaryContent: 'Deploy changes',
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
      expect(legacy.matches(':hover')).toBe(false);
      await settleButtonVariantStyles(legacy);
      const focused = capture(legacy);
      await userEvent.keyboard('[Space>]');
      await settleButtonVariantStyles(legacy);
      const pressed = capture(legacy);
      await userEvent.keyboard('[/Space]');
      await userEvent.tab();
      await expect.element(headless).toHaveFocus();
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
  'restores delegated Fluent %s dimensions when defaults are disabled',
  async (size) => {
    const { legacy, headless } = await renderPair(
      {
        name: size,
        props: { size, icon: buttonVariantIcon, children: 'Run', secondaryContent: 'Now' },
      },
      coreaiLightTheme,
      false,
    );
    expect(headless.dataset.shape).toBe('rounded');
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  },
);

test.each(['before', 'after'] as const)(
  'uses logical %s icon spacing in RTL',
  async (iconPosition) => {
    const { legacy, headless } = await renderPair(
      {
        name: iconPosition,
        props: { iconPosition, icon: buttonVariantIcon, children: 'Run', secondaryContent: 'Now' },
      },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(compareButtonVariantStyles(capture(legacy), capture(headless))).toEqual([]);
  },
);

test('ordinary consumer CSS outranks the composed Button foundation and Compound slot rules', async () => {
  const { legacy, headless } = await renderPair(compoundButtonConsumerExample);
  expect(getComputedStyle(headless).minWidth).toBe('120px');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(capture(headless)['icon.font-size']).toBe('16px');
  expect(capture(legacy)['icon.font-size']).toBe('40px');
});

test('preserves public ref, classes, caller ARIA, slot render functions, and context size', async () => {
  expectTypeOf(CompoundButton).toMatchTypeOf<ForwardRefComponent<CompoundButtonProps>>();
  const ref = React.createRef<HTMLButtonElement>();
  const secondaryRef = React.createRef<HTMLSpanElement>();
  const secondaryRender: SlotRenderFunction<React.ComponentProps<'span'>> = (Component, props) => (
    <Component {...props} data-rendered="secondary" />
  );
  const secondary = {
    ref: secondaryRef,
    className: 'consumer-secondary',
    children: secondaryRender,
    'data-slot-contract': 'secondary',
    'aria-label': 'Deployment context',
  };
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <ButtonContextProvider value={{ size: 'large' }}>
        <CompoundButton
          ref={ref}
          className="consumer-compound"
          aria-label="Run deployment"
          aria-describedby="deployment-help"
          data-caller="kept"
          contentContainer={{ className: 'consumer-content' }}
          secondaryContent={secondary}
        >
          Run
        </CompoundButton>
      </ButtonContextProvider>
      <span id="deployment-help">Review the changes first</span>
    </CoreAIFluentProvider>,
  );
  const button = screen.getByRole('button', { name: 'Run deployment', exact: true }).element();
  expect(ref.current).toBe(button);
  expect(button).toHaveClass(compoundButtonClassNames.root, 'fui-Button', 'consumer-compound');
  expect(button).toHaveAttribute('data-size', 'large');
  expect(button).toHaveAttribute('data-caller', 'kept');
  expect(button).toHaveAttribute('aria-describedby', 'deployment-help');
  expect(secondaryRef.current?.dataset.rendered).toBe('secondary');
  expect(secondaryRef.current?.dataset.slotContract).toBe('secondary');
  expect(secondaryRef.current).toHaveClass(
    compoundButtonClassNames.secondaryContent,
    'consumer-secondary',
  );
  expect(button.querySelector('.consumer-content')).toHaveClass(
    compoundButtonClassNames.contentContainer,
  );
});

test('preserves native form submission, disabled activation, and anchor semantics', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <CompoundButtonFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.fill(screen.getByRole('textbox', { name: 'Release' }), 'v4');
  await userEvent.click(screen.getByRole('button', { name: 'Create release', exact: true }));
  await expect.element(screen.getByRole('status')).toHaveTextContent('Submitted release: v4');
  const onClick = vi.fn();
  const anchorRef = React.createRef<HTMLAnchorElement>();
  await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <CompoundButton
        as="a"
        href="#release"
        ref={anchorRef}
        onClick={(event) => {
          event.preventDefault();
          onClick(event.type, event.currentTarget.tagName);
        }}
      >
        Release details
      </CompoundButton>
      <CompoundButton disabledFocusable onClick={onClick}>
        Unavailable
      </CompoundButton>
    </CoreAIFluentProvider>,
  );
  expect(anchorRef.current?.tagName).toBe('A');
  expect(anchorRef.current?.getAttribute('href')).toBe('#release');
  await userEvent.click(anchorRef.current!);
  expect(onClick.mock.calls).toEqual([['click', 'A']]);
  const disabled = document.querySelector<HTMLElement>('[aria-disabled="true"]');
  if (!disabled) throw new Error('Missing disabled-focusable CompoundButton');
  disabled.focus();
  await userEvent.keyboard('{Enter}');
  await userEvent.click(disabled, { force: true });
  expect(onClick.mock.calls).toEqual([['click', 'A']]);
});
