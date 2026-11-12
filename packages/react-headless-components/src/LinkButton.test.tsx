// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ButtonSlots } from '@fluentui/react-headless-components-preview/button';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  LinkButtonComparison,
  LinkButtonCustomAnchor,
  LinkButtonFlow,
  linkButtonConsumerExample,
  linkButtonExamples,
  type LinkButtonExample,
} from '../../../apps/storybook/src/stories/experiments/LinkButtonComparison.js';
import {
  captureLinkButtonStyles,
  compareLinkButtonStyles,
  getComparisonLinkButton,
  settleLinkButtonStyles,
} from '../../../apps/storybook/src/stories/experiments/LinkButtonComparisonStyles.js';
import fixtureStyles from '../../../apps/storybook/src/stories/experiments/LinkButtonComparison.module.css';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { coreaiDarkTheme, coreaiLightTheme } from './theme.js';
import { LinkButton, type LinkButtonProps } from './LinkButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function TestProvider({ children }: { children: React.ReactNode }) {
  return <CoreAIFluentProvider theme={coreaiLightTheme}>{children}</CoreAIFluentProvider>;
}

async function renderPair(
  example: LinkButtonExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <>
      <span
        className={fixtureStyles.pointerRest}
        data-testid="link-button-pointer-rest"
        aria-hidden
      />
      <LinkButtonComparison
        examples={[example]}
        theme={theme}
        withComponentDefaults={withComponentDefaults}
        dir={dir}
      />
    </>,
  );
  await userEvent.hover(screen.getByTestId('link-button-pointer-rest'));
  const legacy = getComparisonLinkButton(screen.container, 'legacy');
  const headless = getComparisonLinkButton(screen.container, 'headless');
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  await Promise.all([settleLinkButtonStyles(legacy), settleLinkButtonStyles(headless)]);
  return { legacy, headless, screen };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(linkButtonExamples)(`matches $name at rest in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareLinkButtonStyles(captureLinkButtonStyles(legacy), captureLinkButtonStyles(headless)),
    ).toEqual([]);
    expect(headless.tagName).toBe('A');
  });

  test(`matches external anchor hover visuals in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'External subtle hover',
        props: {
          href: '#project-guide',
          external: true,
          appearance: 'subtle',
          children: 'Project guide',
        },
      },
      theme,
    );
    await userEvent.hover(legacy);
    await settleLinkButtonStyles(legacy);
    const hovered = captureLinkButtonStyles(legacy);
    await userEvent.hover(headless);
    await settleLinkButtonStyles(headless);
    expect(compareLinkButtonStyles(hovered, captureLinkButtonStyles(headless))).toEqual([]);
  });

  test(`opts out of Button defaults without dropping external behavior in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'External defaults opt-out',
        props: { href: '#guide', external: true, children: 'Project guide' },
      },
      theme,
      false,
    );
    expect(
      compareLinkButtonStyles(captureLinkButtonStyles(legacy), captureLinkButtonStyles(headless)),
    ).toEqual([]);
    expect(headless).toHaveAttribute('data-shape', 'rounded');
    expect(headless).toHaveAttribute('target', '_blank');
    expect(headless).toHaveAttribute('rel', 'noopener noreferrer');
  });
}

test('preserves the external after-icon spacing in RTL', async () => {
  const { legacy, headless } = await renderPair(
    {
      name: 'RTL external anchor',
      props: { href: '#guide', external: true, children: 'Project guide' },
    },
    coreaiLightTheme,
    true,
    'rtl',
  );
  expect(
    compareLinkButtonStyles(captureLinkButtonStyles(legacy), captureLinkButtonStyles(headless)),
  ).toEqual([]);
});

test('lets ordinary caller CSS override the reused root and icon layers', async () => {
  const { headless } = await renderPair(linkButtonConsumerExample);
  const values = captureLinkButtonStyles(headless);
  expect(values['root.min-width']).toBe('152px');
  expect(values['root.border-radius']).toBe('3px');
  expect(values['root.color']).toBe('rgb(20, 90, 160)');
  expect(values['presetIcon.width']).toBe('16px');
  expect(values['presetIcon.font-size']).toBe('16px');
});

test('keeps native anchor attributes, a precise anchor ref, and caller classes', async () => {
  expectTypeOf(LinkButton).toMatchTypeOf<ForwardRefComponent<LinkButtonProps>>();
  expectTypeOf<LinkButtonProps['onClick']>().toEqualTypeOf<
    React.MouseEventHandler<HTMLAnchorElement> | undefined
  >();
  const ref = React.createRef<HTMLAnchorElement>();
  const screen = await render(
    <LinkButton
      ref={ref}
      href="#guide.pdf"
      download="guide.pdf"
      hrefLang="en"
      referrerPolicy="no-referrer"
      type="application/pdf"
      className="consumer-link-button"
      appearance="primary"
      size="small"
      shape="square"
      data-consumer="kept"
    >
      Download guide
    </LinkButton>,
    { wrapper: TestProvider },
  );
  const link = screen.getByRole('link', { name: 'Download guide' }).element();
  expect(link).toBeInstanceOf(HTMLAnchorElement);
  expect(ref.current).toBe(link);
  expect(link).toHaveClass('fui-LinkButton', 'fui-Button', 'consumer-link-button');
  expect(link).toHaveAttribute('href', '#guide.pdf');
  expect(link).toHaveAttribute('download', 'guide.pdf');
  expect(link).toHaveAttribute('hreflang', 'en');
  expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(link).toHaveAttribute('type', 'application/pdf');
  expect(link).toHaveAttribute('data-consumer', 'kept');
  expect(link).toHaveAttribute('data-appearance', 'primary');
  expect(link).toHaveAttribute('data-size', 'small');
  expect(link).toHaveAttribute('data-shape', 'square');
  for (const prop of ['appearance', 'size', 'shape', 'external']) {
    expect(link).not.toHaveAttribute(prop);
  }
  await screen.unmount();
  expect(ref.current).toBeNull();
});

test.each([
  {
    name: 'external defaults',
    props: { external: true },
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  {
    name: 'external overrides',
    props: { external: true, target: '_self', rel: 'external' },
    target: '_self',
    rel: 'external',
  },
  {
    name: 'explicit empty navigation props',
    props: { external: true, target: '', rel: '' },
    target: '',
    rel: '',
  },
  { name: 'internal defaults', props: { external: false }, target: null, rel: null },
])('keeps $name without replacing explicit target/rel values', async ({ props, target, rel }) => {
  const screen = await render(
    <LinkButton href="#guide" {...props}>
      Project guide
    </LinkButton>,
    { wrapper: TestProvider },
  );
  const link = screen.getByRole('link', { name: 'Project guide' }).element();
  expect(link.getAttribute('target')).toBe(target);
  expect(link.getAttribute('rel')).toBe(rel);
});

test('uses the default filled external glyph only when the caller leaves icon undefined', async () => {
  const screen = await render(
    <LinkButton external href="#guide">
      Project guide
    </LinkButton>,
    { wrapper: TestProvider },
  );
  const link = screen.getByRole('link', { name: 'Project guide' }).element();
  const defaultIcon = link.querySelector('svg[aria-hidden="true"]');
  expect(defaultIcon).not.toBeNull();
  expect(link.querySelectorAll('svg')).toHaveLength(1);
  expect(defaultIcon?.parentElement).toHaveClass('fui-Button__icon');
  expect(link.lastElementChild).toBe(defaultIcon?.parentElement);
  await screen.rerender(
    <LinkButton external href="#guide" icon={undefined} iconPosition={undefined}>
      Project guide
    </LinkButton>,
  );
  expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  expect(link).toHaveAttribute('data-icon-position', 'after');
  await screen.rerender(
    <LinkButton external href="#guide" icon={null}>
      Project guide
    </LinkButton>,
  );
  expect(link.querySelector('.fui-Button__icon')).toBeNull();
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test.each(['before', 'after'] as const)(
  'preserves caller icon renderer, slot ref and explicit %s position on an external custom anchor',
  async (iconPosition) => {
    const ref = React.createRef<HTMLAnchorElement>();
    const iconRef = React.createRef<HTMLSpanElement>();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const renderIcon: SlotRenderFunction<ExtractSlotProps<ButtonSlots['icon']>> = (
      Component,
      props,
    ) => (
      <Component {...props} data-rendered-link-icon="">
        <span aria-hidden>Custom icon</span>
      </Component>
    );
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
      expect(event.currentTarget).toBe(ref.current);
      event.preventDefault();
    });
    const screen = await render(
      <LinkButton
        as={LinkButtonCustomAnchor}
        ref={ref}
        href="#guide"
        external
        onClick={onClick}
        className="consumer-router-link"
        icon={{ ref: iconRef, className: 'consumer-link-icon', children: renderIcon }}
        iconPosition={iconPosition}
      >
        <span data-link-label="">Project guide</span>
      </LinkButton>,
      { wrapper: TestProvider },
    );
    const link = screen.getByRole('link', { name: 'Project guide' }).element();
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('data-link-button-custom-root', '');
    expect(link).toHaveClass('fui-Button', 'fui-LinkButton', 'consumer-router-link');
    expect(link).toHaveAttribute('data-has-content', '');
    expect(link).not.toHaveAttribute('data-icon-only');
    expect(iconRef.current).toHaveClass('fui-Button__icon', 'consumer-link-icon');
    expect(iconRef.current).toHaveAttribute('data-rendered-link-icon', '');
    expect(link.querySelector('svg')).toBeNull();
    expect(iconPosition === 'after' ? link.lastElementChild : link.firstElementChild).toBe(
      iconRef.current,
    );
    expect(link.querySelectorAll('[data-link-label]')).toHaveLength(1);
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
    expect(warning).not.toHaveBeenCalled();
  },
);

test('keeps the Button icon-only metadata and size on compatible custom roots', async () => {
  const screen = await render(
    <LinkButton
      as={LinkButtonCustomAnchor}
      href="#guide"
      external
      size="small"
      aria-label="Open project guide"
    />,
    { wrapper: TestProvider },
  );
  const link = screen.getByRole('link', { name: 'Open project guide' }).element();
  expect(link).toHaveAttribute('data-icon-only', '');
  expect(link).not.toHaveAttribute('data-has-content');
  expect(getComputedStyle(link).minWidth).toBe('24px');
  expect(link.getBoundingClientRect().width).toBe(24);
  expect(link.querySelectorAll('.fui-Button__icon')).toHaveLength(1);
});

test.each([undefined, LinkButtonCustomAnchor])(
  'keeps an anchor root without an href instead of substituting a native button',
  async (Root) => {
    const ref = React.createRef<HTMLAnchorElement>();
    const screen = await render(
      <LinkButton as={Root} ref={ref}>
        Project guide
      </LinkButton>,
      { wrapper: TestProvider },
    );
    const root = screen.getByRole('button', { name: 'Project guide' }).element();
    expect(root).toBeInstanceOf(HTMLAnchorElement);
    expect(root).not.toHaveAttribute('href');
    expect(ref.current).toBe(root);
    expect(root).not.toHaveAttribute('type');
  },
);

test.each([
  { name: 'native disabled', disabled: true, disabledFocusable: false, custom: false },
  { name: 'native disabled focusable', disabled: true, disabledFocusable: true, custom: false },
  { name: 'native focusable only', disabled: false, disabledFocusable: true, custom: false },
  { name: 'custom disabled', disabled: true, disabledFocusable: false, custom: true },
  { name: 'custom disabled focusable', disabled: true, disabledFocusable: true, custom: true },
])(
  'blocks navigation and callbacks for $name with the supported anchor behavior',
  async ({ disabled, disabledFocusable, custom }) => {
    const onClick = vi.fn();
    const screen = await render(
      <>
        <button type="button">Before disabled link</button>
        <LinkButton
          as={custom ? LinkButtonCustomAnchor : undefined}
          href="#unavailable"
          disabled={disabled}
          disabledFocusable={disabledFocusable}
          onClick={onClick}
        >
          Unavailable guide
        </LinkButton>
        <button type="button">After disabled link</button>
      </>,
      { wrapper: TestProvider },
    );
    const link = screen.getByRole('link', { name: 'Unavailable guide' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).not.toHaveAttribute('href');
    await userEvent.click(screen.getByRole('button', { name: 'Before disabled link' }));
    await userEvent.tab();
    if (disabledFocusable) {
      await expect.element(link).toHaveFocus();
      await userEvent.keyboard('{Enter} ');
    } else {
      await expect
        .element(screen.getByRole('button', { name: 'After disabled link' }))
        .toHaveFocus();
    }
    await userEvent.click(link, { force: true });
    expect(onClick).not.toHaveBeenCalled();
  },
);

test('preserves enabled modifier-click events without preventing their native default', async () => {
  const onClick = vi.fn();
  const preventedBeforeConsumerBoundary: boolean[] = [];
  const screen = await render(
    <div
      onClick={(event) => {
        preventedBeforeConsumerBoundary.push(event.defaultPrevented);
        // Stop the test itself from opening another browsing context.
        event.preventDefault();
      }}
    >
      <LinkButton href="#guide" target="_blank" rel="noopener" onClick={onClick}>
        Project guide
      </LinkButton>
    </div>,
    { wrapper: TestProvider },
  );
  const link = screen.getByRole('link', { name: 'Project guide' }).element();
  const click = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
  link.dispatchEvent(click);
  expect(onClick).toHaveBeenCalledOnce();
  expect(onClick.mock.calls[0][0].ctrlKey).toBe(true);
  expect(preventedBeforeConsumerBoundary).toEqual([false]);
});

test('retains the existing Button anchor keyboard contract without submitting its parent form', async () => {
  const screen = await render(<LinkButtonFlow />, { wrapper: TestProvider });
  await userEvent.click(screen.getByRole('button', { name: 'Before links' }));
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Open project guide' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('status', { name: 'Link outcomes' }))
    .toHaveTextContent('1 link activations; 0 form submissions');
  await userEvent.keyboard(' ');
  await expect
    .element(screen.getByRole('status', { name: 'Link outcomes' }))
    .toHaveTextContent('2 link activations; 0 form submissions');
  await userEvent.tab();
  const disabled = screen.getByRole('link', { name: 'Focusable unavailable guide' });
  await expect.element(disabled).toHaveFocus();
  await userEvent.keyboard('{Enter} ');
  await expect
    .element(screen.getByRole('status', { name: 'Link outcomes' }))
    .toHaveTextContent('2 link activations; 0 form submissions');
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Custom router guide' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('status', { name: 'Link outcomes' }))
    .toHaveTextContent('3 link activations; 0 form submissions');
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('status', { name: 'Link outcomes' }))
    .toHaveTextContent('3 link activations; 1 form submissions');
});
